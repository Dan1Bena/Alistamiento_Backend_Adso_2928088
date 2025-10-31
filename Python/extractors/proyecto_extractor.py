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
    TARGET_CODIGO_PROYECTO = "CODIGO PROYECTO SOFIA"
    TARGET_CODIGO_PROGRAMA = "CODIGO DEL PROGRAMA SOFIA"
    TARGET_VERSION_PROGRAMA = "VERSION DEL PROGRAMA"
    TARGET_CENTRO = "CENTRO DE FORMACION"
    TARGET_REGIONAL = "REGIONAL"
    TARGET_NOMBRE_PROYECTO = "NOMBRE DEL PROYECTO"
    TARGET_PROGRAMA_FORMACION = "PROGRAMA DE FORMACION AL QUE DA RESPUESTA"
    
    registros = []
    registro_actual = {}
    dentro_seccion_proyecto = False
    
    try:
        with pdfplumber.open(pdf_path) as pdf:
            for page_num, page in enumerate(pdf.pages, 1):
                log_debug(f"📄 Procesando página {page_num}")
                
                tablas = page.extract_tables()
                
                if not tablas:
                    log_debug(f"    ⚠️ No se encontraron tablas en página {page_num}")
                    continue
                
                for tabla_num, tabla in enumerate(tablas, 1):
                    log_debug(f"    📊 Analizando tabla {tabla_num} (filas: {len(tabla)})")
                    
                    for fila_num, fila in enumerate(tabla):
                        if not fila or len(fila) < 1:
                            continue
                        
                        # Normalizar texto de la celda izquierda y toda la fila
                        celda_izq = norm(fila[0] or "")
                        texto_fila = " ".join([str(c).strip() for c in fila if c]).strip()
                        texto_norm = norm(texto_fila)
                        
                        # Detectar inicio de sección "Información básica del proyecto"
                        if "INFORMACION BASICA DEL PROYECTO" in texto_norm:
                            dentro_seccion_proyecto = True
                            log_debug("    ✅ Sección 'Información básica del proyecto' detectada")
                            
                            # Si hay un registro en proceso, guardarlo
                            if registro_actual:
                                registros.append(registro_actual)
                                log_debug(f"    💾 Registro anterior guardado")
                                registro_actual = {}
                            continue
                        
                        # Solo procesar si estamos dentro de la sección del proyecto
                        if not dentro_seccion_proyecto:
                            continue
                        
                        # Detectar fin de sección (cuando aparece otra sección)
                        if "ESTRUCTURA DEL PROYECTO" in texto_norm or \
                           "PLANTEAMIENTO DEL PROBLEMA" in texto_norm:
                            dentro_seccion_proyecto = False
                            log_debug("    ⏹️ Fin de sección detectado")
                            continue
                        
                        # === EXTRACCIÓN DE CAMPOS ===
                        
                        # Código Proyecto SOFIA
                        if TARGET_CODIGO_PROYECTO in celda_izq:
                            valor = _extraer_valor_celda(fila, 1)
                            if valor:
                                registro_actual["codigo_proyecto"] = valor
                                log_debug(f"    ✅ Código proyecto: {valor}")
                        
                        # Código Programa SOFIA
                        elif TARGET_CODIGO_PROGRAMA in celda_izq:
                            valor = _extraer_valor_celda(fila, 1)
                            if valor:
                                registro_actual["codigo_programa"] = valor
                                log_debug(f"    ✅ Código programa: {valor}")
                        
                        # Versión del Programa
                        elif TARGET_VERSION_PROGRAMA in celda_izq:
                            valor = _extraer_valor_celda(fila, 2)  # Puede estar en col 2
                            if not valor:
                                valor = _extraer_valor_celda(fila, 1)
                            if valor:
                                registro_actual["version_programa"] = valor
                                log_debug(f"    ✅ Versión programa: {valor}")
                        
                        # Centro de Formación
                        elif TARGET_CENTRO in celda_izq:
                            valor = _extraer_valor_celda(fila, 1)
                            if valor:
                                registro_actual["centro_formacion"] = valor
                                log_debug(f"    ✅ Centro: {valor}")
                        
                        # Regional
                        elif TARGET_REGIONAL in celda_izq:
                            valor = _extraer_valor_celda(fila, 1)
                            if valor:
                                registro_actual["regional"] = valor
                                log_debug(f"    ✅ Regional: {valor}")
                        
                        # Nombre del Proyecto
                        elif TARGET_NOMBRE_PROYECTO in celda_izq:
                            valor = _extraer_valor_celda(fila, 1)
                            if valor:
                                registro_actual["nombre_proyecto"] = valor
                                log_debug(f"    ✅ Nombre proyecto: {valor[:50]}...")
                        
                        # Programa de Formación
                        elif TARGET_PROGRAMA_FORMACION in celda_izq:
                            valor = _extraer_valor_celda(fila, 1)
                            if valor:
                                registro_actual["programa_formacion"] = valor
                                log_debug(f"    ✅ Programa formación: {valor}")
        
        # Guardar último registro si existe
        if registro_actual:
            registros.append(registro_actual)
            log_debug(f"✅ Último registro guardado: {registro_actual.get('nombre_proyecto', 'sin nombre')}")
        
        # Validar que se extrajo al menos un proyecto
        if not registros:
            log_debug("⚠️ ADVERTENCIA: No se extrajo ningún proyecto del PDF")
        else:
            log_debug(f"✅ Total proyectos extraídos: {len(registros)}")
        
        return registros
    
    except Exception as e:
        log_debug(f"❌ Error en extracción de proyectos: {str(e)}")
        raise
