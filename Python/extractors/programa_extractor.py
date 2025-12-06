import pdfplumber
import re
import sys
from utils.pdf_helpers import norm, extraer_horas

def log_debug(mensaje):
    """Enviar logs a stderr para no contaminar stdout"""
    print(mensaje, file=sys.stderr, flush=True)

def extraer_programa(pdf_path: str) -> list: 
    TARGET_NOMBRE = "DENOMINACION DEL PROGRAMA"
    TARGET_CODIGO = "CODIGO PROGRAMA"
    TARGET_VERSION = "VERSION PROGRAMA"
    TARGET_VIGENCIA = "VIGENCIA DEL PROGRAMA"
    TARGET_DURACION = "DURACION MAXIMA ESTIMADA DEL APRENDIZAJE (HORAS)"
    TARGET_LECTIVA = "ETAPA LECTIVA"
    TARGET_PRODUCTIVA = "ETAPA PRODUCTIVA"
    TARGET_TIPO = "TIPO DE PROGRAMA"
    TARGET_TITULO = "TITULO O CERTIFICADO QUE OBTENDRA"

    registros = []
    registro_actual = {}
    en_bloque_duracion = False

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
                    
                    # NOMBRE
                    if TARGET_NOMBRE in celda_izq:
                        if registro_actual:
                            registros.append(registro_actual)
                            log_debug(f"✅ Registro guardado: {registro_actual.get('nombre_programa', 'sin nombre')}")
                            registro_actual = {}
                        registro_actual["nombre_programa"] = (fila[1] or "").strip() if len(fila) > 1 else ""

                    # Código
                    elif TARGET_CODIGO in celda_izq:
                        registro_actual["codigo_programa"] = (fila[1] or "").strip() if len(fila) > 1 else ""

                    # Versión
                    elif TARGET_VERSION in celda_izq:
                        registro_actual["version_programa"] = (fila[1] or "").strip() if len(fila) > 1 else ""

                    # Vigencia
                    elif TARGET_VIGENCIA in celda_izq:
                        registro_actual["vigencia"] = (fila[1] or "").strip() if len(fila) > 1 else ""

                    # Duración
                    elif TARGET_DURACION in celda_izq:
                        en_bloque_duracion = True
                        
                        if TARGET_LECTIVA in texto_norm and "horas_etapa_lectiva" not in registro_actual:
                            horas = extraer_horas(texto_celda)
                            if horas:
                                registro_actual["horas_etapa_lectiva"] = horas
                                log_debug(f"    ✅ Etapa lectiva: {horas}")

                    elif en_bloque_duracion:
                        if TARGET_PRODUCTIVA in texto_norm and "horas_etapa_productiva" not in registro_actual:
                            horas = extraer_horas(texto_celda)
                            if horas:
                                registro_actual["horas_etapa_productiva"] = horas
                                log_debug(f"    ✅ Etapa productiva: {horas}")
                        
                        elif "horas_totales" not in registro_actual:
                            texto_norm_simple = re.sub(r"(.)\1+", r"\1", texto_norm)
                            if "TOTAL" in texto_norm_simple:
                                horas = extraer_horas(texto_celda)
                                if horas:
                                    registro_actual["horas_totales"] = horas
                                    log_debug(f"✅ Total detectado: {horas}")
                                    en_bloque_duracion = False
                                
                    elif TARGET_TIPO in celda_izq:
                        registro_actual["tipo"] = (fila[1] or "").strip() if len(fila) > 1 else ""
                        
                    elif TARGET_TITULO in celda_izq:
                        registro_actual["titulo"] = (fila[1] or "").strip() if len(fila) > 1 else ""

    # Guardar último registro
    if registro_actual:
        registros.append(registro_actual)
        log_debug(f"✅ Último registro guardado: {registro_actual.get('nombre_programa', 'sin nombre')}")

    return registros