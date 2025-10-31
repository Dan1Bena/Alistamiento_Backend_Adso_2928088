import pdfplumber
import re
import sys
from utils.pdf_helpers import norm

def log_debug(mensaje):
    """Enviar logs a stderr para no contaminar stdout"""
    print(mensaje, file=sys.stderr, flush=True)

def extraer_competencias(pdf_path: str) -> list:
    TARGET_COMPETENCIA = "UNIDAD DE COMPETENCIA"
    TARGET_CODIGO = "CODIGO NORMA DE COMPETENCIA LABORAL"
    TARGET_NOMBRE = "NOMBRE DE LA COMPETENCIA"
    TARGET_HORA = "DURACION MAXIMA ESTIMADA"
    
    HORA_RE = re.compile(r"\b(\d{1,4})\s*(HORA|HORAS)\b", re.IGNORECASE)
    
    registros = []
    registro_actual = {}
    hora_count = 0
    dentro_de_etapa_practica = False

    with pdfplumber.open(pdf_path) as pdf:
        for page in pdf.pages:
            tablas = page.extract_tables()
            for tabla in tablas:
                for fila in tabla:
                    if fila and len(fila) >= 2:
                        celda_izq = norm(fila[0] or "")
                        texto_fila = "".join([c for c in fila if c]).strip()
                        texto_norm = norm(texto_fila)
                        
                        # Detectar etapa práctica
                        if "ETAPA PRACTICA" in texto_norm or "999999999" in texto_fila:
                            dentro_de_etapa_practica = True
                            if registro_actual:
                                registros.append(registro_actual)
                                registro_actual = {}
                            continue
                        
                        if dentro_de_etapa_practica:
                            if TARGET_CODIGO in celda_izq and "999999999" not in texto_fila:
                                dentro_de_etapa_practica = False
                            else:
                                continue

                        # Competencia
                        if TARGET_COMPETENCIA in celda_izq:
                            if registro_actual:
                                registros.append(registro_actual)
                                log_debug(f"✅ Competencia guardada: {registro_actual.get('nombre_competencia', 'sin nombre')}")
                                registro_actual = {}
                            registro_actual["unidad_competencia"] = (norm(fila[1] or ""))

                        # Código
                        elif TARGET_CODIGO in celda_izq:
                            registro_actual["codigo_norma"] = (fila[1] or "").strip()

                        # Nombre
                        elif TARGET_NOMBRE in celda_izq:
                            registro_actual["nombre_competencia"] = (norm(fila[1] or ""))

                        # Horas
                        elif TARGET_HORA in celda_izq:
                            for celda in fila:
                                if celda and HORA_RE.search(str(celda)):
                                    if hora_count == 1: 
                                        print(f"[P{page.page_number}] ⚠ Hora ignorada (encabezado): {celda}")
                                    else:
                                        registro_actual["duracion_maxima"] = str(celda).strip()
                                        break

    # Guardar último registro
    if registro_actual:
        registros.append(registro_actual)
        log_debug(f"✅ Última competencia guardada: {registro_actual.get('nombre_competencia', 'sin nombre')}")

    return registros