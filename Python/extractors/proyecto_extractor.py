import pdfplumber
import re
import sys
from utils.pdf_helpers import norm

def log_debug(mensaje):
    """Enviar logs a stderr para no contaminar stdout"""
    print(mensaje, file=sys.stderr, flush=True)

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

def extraer_fases_proyecto(pdf_path: str) -> list:
    """
    Extrae las fases del proyecto formativo del PDF del SENA
    
    Args:
        pdf_path: Ruta absoluta al archivo PDF
        
    Returns:
        list: Lista única de fases encontradas (sin duplicados)
    """
    
    # Definir los targets de búsqueda
    TARGET_PLANEACION = "PLANEACION DEL PROYECTO"
    TARGET_FASES = "FASES DEL PROYECTO"
    
    # Set para evitar duplicados
    fases_encontradas = set()
    
    # Lista de fases válidas (las 4 que mencionaste)
    FASES_VALIDAS = ["ANALISIS", "PLANEACION", "EJECUCION", "EVALUACION"]
    
    en_seccion_planeacion = False
    
    try:
        with pdfplumber.open(pdf_path) as pdf:
            for page_num, page in enumerate(pdf.pages, 1):
                tablas = page.extract_tables()
                
                if not tablas:
                    continue
                
                for tabla in tablas:
                    for fila in tabla:
                        if not fila or all(c is None or c.strip() == "" for c in fila):
                            continue

                        # Convertir toda la fila a texto normalizado
                        texto_fila = " ".join([str(c).strip() for c in fila if c]).strip()
                        texto_norm = norm(texto_fila)
                        
                        # Detectar si estamos en la sección de planeación
                        if TARGET_PLANEACION in texto_norm or TARGET_FASES in texto_norm:
                            en_seccion_planeacion = True
                            log_debug(f"Sección 'Planeación del proyecto' detectada en página {page_num}")
                            continue
                        
                        # Si no estamos en la sección, continuar
                        if not en_seccion_planeacion:
                            continue
                        
                        # Detectar fin de sección (cuando llegue a otra sección principal)
                        if "RUBROS PRESUPUESTALES" in texto_norm or \
                           "EQUIPO QUE PARTICIPO" in texto_norm or \
                           "VALORACION PRODUCTIVA" in texto_norm:
                            en_seccion_planeacion = False
                            log_debug(f"Fin de sección 'Planeación del proyecto' en página {page_num}")
                            break
                        
                        # Buscar fases válidas en la primera columna
                        primera_celda = norm(fila[0] or "") if fila else ""
                        
                        # Verificar si la primera celda contiene alguna fase válida
                        for fase in FASES_VALIDAS:
                            if fase in primera_celda:
                                fases_encontradas.add(fase)
                                log_debug(f" Fase encontrada: {fase}")
                                break

        # Convertir set a lista ordenada
        fases_resultado = []
        
        # Ordenar las fases según el orden lógico del proyecto
        orden_fases = ["ANALISIS", "PLANEACION", "EJECUCION", "EVALUACION"]
        for fase in orden_fases:
            if fase in fases_encontradas:
                fases_resultado.append({"nombre": fase})
        
        log_debug(f"\nTotal fases únicas extraídas: {len(fases_resultado)}")
        log_debug(f" Fases: {[f['nombre'] for f in fases_resultado]}")
        
        return fases_resultado
    
    except Exception as e:
        log_debug(f"Error en extracción de fases: {str(e)}")
        import traceback
        log_debug(traceback.format_exc())
        raise

def extraer_actividades_proyecto(pdf_path: str) -> list:
    """
    Extrae las actividades del proyecto y sus RAPs asociados
    
    Args:
        pdf_path: Ruta absoluta al archivo PDF
        
    Returns:
        list: Lista de diccionarios con actividades y sus RAPs
    """
    
    TARGET_PLANEACION = "PLANEACION DEL PROYECTO"
    TARGET_ACTIVIDADES = "ACTIVIDADES DEL PROYECTO"
    
    actividades = []
    en_seccion_planeacion = False
    fase_actual = None
    
    try:
        with pdfplumber.open(pdf_path) as pdf:
            for page_num, page in enumerate(pdf.pages, 1):
                tablas = page.extract_tables()
                if not tablas:
                    continue
                for tabla in tablas:
                    for fila in tabla:
                        if not fila or all(c is None or c.strip() == "" for c in fila):
                            continue
                        
                        # Convertir fila a texto
                        texto_fila = " ".join([str(c).strip() for c in fila if c]).strip()
                        texto_norm = norm(texto_fila)
                        
                        # Detectar sección de planeación
                        if TARGET_PLANEACION in texto_norm or TARGET_ACTIVIDADES in texto_norm:
                            en_seccion_planeacion = True
                            log_debug(f"Sección 'Actividades del proyecto' detectada en página {page_num}")
                            continue
                        
                        if not en_seccion_planeacion:
                            continue
                        
                        # Detectar fin de sección
                        if "RUBROS PRESUPUESTALES" in texto_norm or \
                           "EQUIPO QUE PARTICIPO" in texto_norm:
                            en_seccion_planeacion = False
                            log_debug(f"Fin de sección en página {page_num}")
                            break
                        
                        # La estructura de la tabla es:
                        # [Fase, Actividad, RAPs/Código, Competencia]
                        
                        if len(fila) < 3:
                            continue
                        
                        fase_celda = norm(fila[0] or "")
                        actividad_celda = (fila[1] or "").strip()
                        raps_celda = (fila[2] or "").strip()
                        
                        # Detectar nueva fase
                        if fase_celda and fase_celda in ["ANALISIS", "PLANEACION", "EJECUCION", "EVALUACION"]:
                            fase_actual = fase_celda
                            log_debug(f"\nFase detectada: {fase_actual}")
                        
                        # Si hay actividad y RAPs, procesar
                        if actividad_celda and raps_celda and fase_actual:
                            raps_info = extraer_codigos_raps(raps_celda)
                            
                            if raps_info:
                                actividad = {
                                    "fase": fase_actual,
                                    "nombre_actividad": actividad_celda,
                                    "raps": raps_info
                                }
                                actividades.append(actividad)
                                log_debug(f"Actividad: {actividad_celda[:50]}... | RAPs: {len(raps_info)}")

        log_debug(f"\nTotal actividades extraídas: {len(actividades)}")
        return actividades
    
    except Exception as e:
        log_debug(f"Error en extracción de actividades: {str(e)}")
        import traceback
        log_debug(traceback.format_exc())
        raise


def extraer_codigos_raps(texto_raps: str) -> list:
    """
    Extrae los códigos de RAPs del texto
    Formato esperado: "593343 - 01 IDENTIFICAR LA DINÁMICA..."
    
    Returns:
        list: Lista de tuplas (codigo_rap, denominacion)
        Ejemplo: [("01", "IDENTIFICAR LA DINÁMICA..."), ("02", "APLICAR...")]
    """
    raps = []
    
    # Patrón: Captura código corto (01, 02) y la denominación completa
    # Formato: 593343 - 01 IDENTIFICAR LA DINÁMICA...
    patron = r'\d{6,7}\s*-\s*(\d{1,2})\s+([A-ZÀÁÉÍÓÚÑ].+?)(?=\d{6,7}\s*-|\Z)'
    matches = re.findall(patron, texto_raps, re.DOTALL)
    
    for match in matches:
        codigo_rap = match[0].zfill(2)  # "01", "02", etc.
        denominacion = match[1].strip()
        denominacion = re.sub(r'\s+', ' ', denominacion)  # Limpiar espacios múltiples
        raps.append((codigo_rap, denominacion[:100]))  # Primeros 100 chars
    
    return raps


# === PRUEBA DEL MÓDULO ===
if __name__ == "__main__":
    import json
    
    if len(sys.argv) < 2:
        print("Uso: python proyecto_extractor.py <ruta_pdf>", file=sys.stderr)
        sys.exit(1)
    
    pdf_path = sys.argv[1]
    
    log_debug("=" * 60)
    log_debug("INICIANDO EXTRACCIÓN DE PROYECTO")
    log_debug("=" * 60)
    
    # Extraer información del proyecto
    proyectos = extraer_proyecto(pdf_path)
    
    log_debug("\n" + "=" * 60)
    log_debug("INICIANDO EXTRACCIÓN DE FASES")
    log_debug("=" * 60)
    
    # Extraer fases del proyecto
    fases = extraer_fases_proyecto(pdf_path)

    log_debug("\n" + "=" * 60)
    log_debug("INICIANDO EXTRACCIÓN DE ACTIVIDADES DE PROYECTO")
    log_debug("=" * 60)
    
    # Extraer actividades del proyecto
    actividades = extraer_actividades_proyecto(pdf_path)
    
    # Crear resultado en formato JSON
    resultado = {
        "success": True,
        "data": {
            "proyectos": proyectos,
            "fases": fases,
            "actividades" : actividades
        }
    }
    
    # Imprimir JSON a stdout
    print(json.dumps(resultado, ensure_ascii=False, indent=2), flush=True)