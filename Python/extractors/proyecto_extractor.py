import pdfplumber
import re
import sys
from utils.pdf_helpers import norm

def log_debug(mensaje):
    """Enviar logs a stderr para no contaminar stdout"""
    print(mensaje, file=sys.stderr, flush=True)


def _extraer_valor_celda(fila, indice):
    """
    Extrae y limpia el valor de una celda específica
    
    Args:
        fila: Lista de valores de la fila
        indice: Índice de la celda a extraer
        
    Returns:
        str: Valor limpio o None
    """
    try:
        if len(fila) > indice and fila[indice]:
            valor = str(fila[indice]).strip()
            # Eliminar valores que son solo espacios o None
            if valor and valor.lower() not in ['none', 'null', '']:
                return valor
    except (IndexError, AttributeError):
        pass
    return None


def extraer_proyecto(pdf_path: str) -> list:
    """
    Extrae información del proyecto formativo del PDF del SENA
    
    Args:
        pdf_path: Ruta absoluta al archivo PDF
        
    Returns:
        list: Lista de diccionarios con información del proyecto
    """
    
    # Definir los targets de búsqueda
    TARGET_SECCION = "INFORMACION BASICA DEL PROYECTO"
    TARGET_CODIGO_PROYECTO = "CODIGO PROYECTO SOFIA"
    TARGET_CODIGO_PROGRAMA = "CODIGO DEL PROGRAMA SOFIA"
    TARGET_CENTRO = "CENTRO DE FORMACION"
    TARGET_REGIONAL = "REGIONAL"
    TARGET_NOMBRE_PROYECTO = "NOMBRE DEL PROYECTO"
    TARGET_PROGRAMA_FORMACION = "PROGRAMA DE FORMACION AL QUE DA RESPUESTA"
    
    registros = []
    registro_actual = {}
    dentro_seccion = False
    
    try:
        with pdfplumber.open(pdf_path) as pdf:
            for page in pdf.pages:
                tablas = page.extract_tables()
                for tabla in tablas:
                    for fila in tabla:
                        if not fila or len(fila) < 1:
                            continue

                        celda_izq = norm(fila[0] or "")
                        texto_celda = " ".join([str(c).strip() for c in fila if c]).strip()
                        texto_norm = norm(texto_celda)

                        # === Detectar sección ===
                        if TARGET_SECCION in texto_norm:
                            dentro_seccion = True
                            log_debug("Sección 'Información básica del proyecto' detectada")
                            continue

                        if not dentro_seccion:
                            continue

                        # === Extracción de campos ===
                        if TARGET_CODIGO_PROYECTO in texto_norm and TARGET_CODIGO_PROGRAMA in texto_norm:

                            valor_proyecto = None
                            valor_programa = None

                            # Buscar los valores numéricos (2537295, 228118, etc.)
                            for idx, celda in enumerate(fila):
                                texto = str(celda or "").strip()
                                if re.match(r'^\d{5,}$', texto):
                                # Heurística: el primer número largo es proyecto, el segundo es programa
                                    if not valor_proyecto:
                                        valor_proyecto = texto
                                    elif not valor_programa:
                                        valor_programa = texto

                                if valor_proyecto:
                                    registro_actual["codigo_proyecto"] = valor_proyecto
                                    log_debug(f"Código Proyecto detectado: {valor_proyecto}")

                                if valor_programa:
                                    registro_actual["codigo_programa"] = valor_programa
                                    log_debug(f"Código Programa detectado: {valor_programa}")
                            continue

                        # Centro de formación
                        elif TARGET_CENTRO in celda_izq:
                            valor = (fila[1] or "").strip() if len(fila) > 1 else ""
                            registro_actual["centro_formacion"] = valor
                            log_debug(f"Centro de formación: {valor}")

                        # Regional
                        elif TARGET_REGIONAL in texto_norm:
                            valor = (fila[3] or "").strip() if len(fila) > 3 else ""
                            registro_actual["regional"] = valor
                            log_debug(f"Regional: {valor}")

                        # Nombre del proyecto
                        elif TARGET_NOMBRE_PROYECTO in celda_izq:
                            valor = (fila[1] or "").strip() if len(fila) > 1 else ""
                            registro_actual["nombre_proyecto"] = valor
                            log_debug(f"Nombre del proyecto: {valor}")

                        # Programa de formación
                        elif TARGET_PROGRAMA_FORMACION in celda_izq:
                            valor = (fila[1] or "").strip() if len(fila) > 1 else ""
                            registro_actual["programa_formacion"] = valor
                            log_debug(f"Programa de formación: {valor}")

        # Guardar último registro si existe
        if registro_actual:
            registros.append(registro_actual)
            log_debug(f" Último registro guardado: {registro_actual.get('nombre_proyecto', 'sin nombre')}")
        
        # Validar que se extrajo al menos un proyecto
        if not registros:
            log_debug("ADVERTENCIA: No se extrajo ningún proyecto del PDF")
        else:
            log_debug(f" Total proyectos extraídos: {len(registros)}")
        
        return registros
    
    except Exception as e:
        log_debug(f"Error en extracción de proyectos: {str(e)}")
        raise
