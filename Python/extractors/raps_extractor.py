import pdfplumber
import re
import sys
from utils.pdf_helpers import norm, limpiar_item, es_ruido, es_contenido_valido

def log_debug(mensaje):
    """Enviar logs a stderr para no contaminar stdout"""
    print(mensaje, file=sys.stderr, flush=True)


# === DETECTORES ===
# Regex mejorado para detectar RAPs con diferentes formatos
RAP_REGEX = re.compile(r"^\s*(\d{1,2})\s+([A-ZÁÉÍÓÚÑ'].{20,})", re.IGNORECASE)
RAP_REGEX_ALT = re.compile(r"^\s*(\d{1,2})[\-\)\s]+([A-ZÁÉÍÓÚÑ'].{15,})", re.IGNORECASE)

# Palabras clave de secciones
CONOC_PROCESO = "CONOCIMIENTOS DE PROCESO"
CONOC_SABER = "CONOCIMIENTOS DEL SABER"
CRITERIOS = "CRITERIOS DE EVALUACION"
COMPETENCIA_KEY = "UNIDAD DE COMPETENCIA"
CODIGO_KEY = "CODIGO NORMA DE COMPETENCIA LABORAL"
NOMBRE_COMPETENCIA_KEY = "NOMBRE DE LA COMPETENCIA"

# Detectores para fin de sección
FIN_SECCION_PATTERNS = [
    r"PERFIL DEL INSTRUCTOR",
    r"REQUISITOS ACADEMICOS",
    r"EXPERIENCIA LABORAL",
    r"^\s*4\.8\s+PERFIL",
    r"CONTENIDOS CURRICULARES DE LA COMPETENCIA",
    r"MATERIALES DE FORMACION"
]


def es_fin_seccion(texto):
    """Detecta si llegamos al final de la sección de RAPs"""
    texto_norm = norm(texto)
    for pattern in FIN_SECCION_PATTERNS:
        if re.search(pattern, texto_norm):
            return True
    return False


def detectar_rap(texto):
    """
    Detecta si el texto es un inicio de RAP y retorna (codigo, nombre)
    Retorna: (codigo_rap, nombre_rap) o (None, None)
    """
    # Intentar primer formato
    match = RAP_REGEX.match(texto)
    if match:
        return match.group(1).zfill(2), match.group(2).strip()
    
    # Intentar formato alternativo
    match = RAP_REGEX_ALT.match(texto)
    if match:
        return match.group(1).zfill(2), match.group(2).strip()
    
    return None, None


def _es_continuacion_nombre(texto):
    """
    Detecta si el texto es continuación del nombre del RAP
    (no empieza con viñeta ni número)
    """
    texto_limpio = texto.strip()
    
    # No es continuación si empieza con asterisco, guión o número seguido de punto/espacio
    if re.match(r'^[\*\-\•]\s*', texto_limpio):
        return False
    
    # No es continuación si parece inicio de lista (ej: "* CREAR", "- DEFINIR")
    if re.match(r'^[\*\-\•]\s*[A-Z]', texto_limpio):
        return False
    
    # Es continuación si empieza con mayúscula y tiene al menos 10 caracteres
    if len(texto_limpio) > 10 and texto_limpio[0].isupper():
        return True
    
    return False


def extraer_raps(pdf_path: str) -> list:
    """
    Extrae RAPs del PDF del programa SENA
    
    Args:
        pdf_path: Ruta absoluta al archivo PDF
        
    Returns:
        list: Lista de diccionarios con RAPs extraídos
    """
    
    # Variables de trabajo
    competencia_actual = ""
    codigo_competencia = ""
    nombre_competencia = ""
    raps_resultado = []
    rap_actual = None
    seccion_actual = None
    dentro_de_etapa_practica = False
    
    try:
        with pdfplumber.open(pdf_path) as pdf:
            for page_num, page in enumerate(pdf.pages, 1):
                log_debug(f"📄 Procesando página {page_num}")
                
                tablas = page.extract_tables()
                
                if not tablas:
                    continue
                
                for tabla in tablas:
                    for fila in tabla:
                        if not fila or all(c is None or c.strip() == "" for c in fila):
                            continue

                        texto_fila = " ".join([c for c in fila if c]).strip()
                        
                        # Skip si es ruido
                        if es_ruido(texto_fila):
                            continue
                        
                        texto_norm = norm(texto_fila)

                        # === DETECTAR Y SALTAR ETAPA PRÁCTICA ===
                        if "ETAPA PRACTICA" in texto_norm or "999999999" in texto_fila:
                            dentro_de_etapa_practica = True
                            if rap_actual:
                                raps_resultado.append(rap_actual)
                                log_debug(f"    💾 RAP guardado antes de etapa práctica: {rap_actual['codigo_competencia']}-{rap_actual['codigo_rap']}")
                                rap_actual = None
                            continue
                        
                        # Si estamos dentro de etapa práctica, seguir saltando
                        if dentro_de_etapa_practica:
                            if CODIGO_KEY in texto_norm and "999999999" not in texto_fila:
                                dentro_de_etapa_practica = False
                                log_debug("    ✅ Saliendo de etapa práctica")
                            else:
                                continue

                        # === DETECTAR FIN DE SECCIÓN ===
                        if es_fin_seccion(texto_fila):
                            if rap_actual:
                                raps_resultado.append(rap_actual)
                                log_debug(f"    💾 RAP guardado (fin de sección): {rap_actual['codigo_competencia']}-{rap_actual['codigo_rap']}")
                                rap_actual = None
                            seccion_actual = None
                            continue

                        # === DETECTAR COMPETENCIA ===
                        if COMPETENCIA_KEY in texto_norm and len(fila) > 1:
                            competencia_actual = (fila[1] or "").strip()
                            log_debug(f"    🎯 Competencia detectada: {competencia_actual[:50]}...")
                            continue
                            
                        if CODIGO_KEY in texto_norm and len(fila) > 1:
                            nuevo_codigo = (fila[1] or "").strip()
                            if nuevo_codigo and nuevo_codigo != "999999999":
                                codigo_competencia = nuevo_codigo
                                log_debug(f"    🔢 Código competencia: {codigo_competencia}")
                            continue
                            
                        if NOMBRE_COMPETENCIA_KEY in texto_norm and len(fila) > 1:
                            nombre_competencia = (fila[1] or "").strip()
                            log_debug(f"    📌 Nombre competencia: {nombre_competencia[:50]}...")
                            continue

                        # === DETECTAR INICIO DE RAP ===
                        codigo_rap, nombre_rap = detectar_rap(texto_fila)
                        
                        if codigo_rap and nombre_rap:
                            # Guardamos el RAP anterior
                            if rap_actual:
                                raps_resultado.append(rap_actual)
                                log_debug(f"    💾 RAP guardado: {rap_actual['codigo_competencia']}-{rap_actual['codigo_rap']}")
                            
                            rap_actual = {
                                "codigo_competencia": codigo_competencia,
                                "competencia": nombre_competencia or competencia_actual,
                                "codigo_rap": codigo_rap,
                                "nombre_rap": nombre_rap,
                                "conocimientos_proceso": [],
                                "conocimientos_saber": [],
                                "criterios_evaluacion": []
                            }
                            seccion_actual = None
                            log_debug(f"    📌 RAP {codigo_competencia}-{codigo_rap} encontrado: {nombre_rap[:50]}...")
                            continue
                        
                        # === DETECTAR CONTINUACIÓN DEL NOMBRE DEL RAP ===
                        # Si hay un RAP activo y no estamos en ninguna sección específica
                        if rap_actual and not seccion_actual and _es_continuacion_nombre(texto_fila):
                            # Verificar que no sea inicio de sección
                            if CONOC_PROCESO not in texto_norm and \
                               CONOC_SABER not in texto_norm and \
                               CRITERIOS not in texto_norm:
                                rap_actual["nombre_rap"] += " " + texto_fila.strip()
                                log_debug(f"    ➕ Continuación nombre RAP: {texto_fila[:40]}...")
                                continue

                        # === CAMBIAR SECCIÓN ===
                        if CONOC_PROCESO in texto_norm:
                            seccion_actual = "proceso"
                            log_debug(f"    🔄 Sección: Conocimientos de Proceso")
                            continue
                        elif CONOC_SABER in texto_norm:
                            seccion_actual = "saber"
                            log_debug(f"    🔄 Sección: Conocimientos del Saber")
                            continue
                        elif CRITERIOS in texto_norm:
                            seccion_actual = "criterios"
                            log_debug(f"    🔄 Sección: Criterios de Evaluación")
                            continue

                        # === AGREGAR TEXTO SEGÚN SECCIÓN ACTUAL ===
                        if seccion_actual and rap_actual:
                            texto_limpio = limpiar_item(texto_fila)
                            
                            # Validar que sea contenido válido antes de agregar
                            if es_contenido_valido(texto_limpio):
                                if seccion_actual == "proceso":
                                    rap_actual["conocimientos_proceso"].append(texto_limpio)
                                elif seccion_actual == "saber":
                                    rap_actual["conocimientos_saber"].append(texto_limpio)
                                elif seccion_actual == "criterios":
                                    rap_actual["criterios_evaluacion"].append(texto_limpio)

        # Guardar el último RAP procesado
        if rap_actual and not dentro_de_etapa_practica:
            raps_resultado.append(rap_actual)
            log_debug(f"✅ Último RAP guardado: {rap_actual['codigo_competencia']}-{rap_actual['codigo_rap']}")
        
        log_debug(f"\n✅ Total RAPs extraídos: {len(raps_resultado)}")
        
        return raps_resultado
    
    except Exception as e:
        log_debug(f"❌ Error en extracción de RAPs: {str(e)}")
        import traceback
        log_debug(traceback.format_exc())
        raise


def generar_resumen(raps):
    """
    Genera un resumen detallado por competencia
    
    Args:
        raps: Lista de RAPs extraídos
        
    Returns:
        dict: Resumen por competencia
    """
    competencias_count = {}
    for rap in raps:
        cod = rap["codigo_competencia"]
        if cod not in competencias_count:
            competencias_count[cod] = {
                "nombre": rap["competencia"],
                "count": 0,
                "raps": []
            }
        competencias_count[cod]["count"] += 1
        competencias_count[cod]["raps"].append(rap["codigo_rap"])
    
    return competencias_count


def verificar_completitud(competencias_count):
    """
    Verifica si se extrajeron todos los RAPs esperados
    
    Args:
        competencias_count: Diccionario con conteo por competencia
        
    Returns:
        list: Lista de códigos de competencias faltantes
    """
    competencias_esperadas = {
        "220201501": 4,
        "220601501": 4,
        "220501098": 3,
        "220501096": 5,
        "240201524": 4,
        "220501095": 4,
        "210201501": 4,
        "240201526": 4,
        "220501092": 4,
        "220501094": 3,
        "220501093": 4,
        "230101507": 4,
        "240201529": 4,
        "220501097": 4,
        "240202501": 6,
        "240201064": 4,
        "240201528": 4,
        "240201530": 1,
        "220501046": 4
    }
    
    faltantes = []
    log_debug("\n🔍 Verificación de completitud:")
    for cod, esperados in sorted(competencias_esperadas.items()):
        encontrados = competencias_count.get(cod, {"count": 0})["count"]
        status = "✅" if encontrados == esperados else "❌"
        log_debug(f"{status} {cod}: {encontrados}/{esperados} RAPs")
        if encontrados != esperados:
            faltantes.append(cod)
    
    return faltantes


# === PRUEBA DEL MÓDULO ===
if __name__ == "__main__":
    import sys
    import json
    
    if len(sys.argv) < 2:
        print("Uso: python raps_extractor.py <ruta_pdf>", file=sys.stderr)
        sys.exit(1)
    
    pdf_path = sys.argv[1]
    
    log_debug("=" * 60)
    log_debug("INICIANDO EXTRACCIÓN DE RAPs")
    log_debug("=" * 60)
    
    # Extraer RAPs
    raps = extraer_raps(pdf_path)
    
    # Generar resumen
    resumen = generar_resumen(raps)
    
    log_debug("\n📊 Resumen por competencia:")
    for cod in sorted(resumen.keys()):
        info = resumen[cod]
        log_debug(f"\n  🔹 {cod}: {info['count']} RAPs")
        log_debug(f"     {info['nombre'][:60]}...")
        log_debug(f"     RAPs: {', '.join(sorted(info['raps']))}")
    
    # Verificar completitud
    faltantes = verificar_completitud(resumen)
    
    if faltantes:
        log_debug(f"\n⚠️ Competencias con RAPs faltantes: {', '.join(faltantes)}")
    else:
        log_debug(f"\n✅ Todos los RAPs esperados fueron extraídos")
    
    # Crear resultado en formato JSON
    resultado = {
        "success": True,
        "data": {
            "raps": raps,
            "resumen": {
                "total_raps": len(raps),
                "total_competencias": len(resumen),
                "competencias_faltantes": faltantes
            }
        }
    }
    
    # Imprimir JSON a stdout
    print(json.dumps(resultado, ensure_ascii=False, indent=2), flush=True)