import re
import unicodedata

# === Funciones auxiliares ===
def strip_accents(s: str) -> str:
    """Quita tildes"""
    return ''.join(c for c in unicodedata.normalize('NFD', s) if unicodedata.category(c) != 'Mn')

def norm(s: str) -> str:
    """Normaliza texto: mayúsculas y espacios"""
    s = strip_accents(s or "").upper()
    s = re.sub(r"\s+", " ", s)
    return s.strip()

def extraer_horas(texto: str) -> str:
    """Extrae el valor de horas de un texto (ej: '3120 horas' -> '3120 horas')"""
    if not texto:
        return ""
    # Buscar patrón de número seguido de "horas"
    match = re.search(r'(\d+)\s*horas?', texto, re.IGNORECASE)
    if match:
        return f"{match.group(1)} horas"
    return ""

def limpiar_item(texto):
    """Limpia viñetas o caracteres extra de un ítem"""
    texto = re.sub(r"^[*•\-\d.\s]+", "", texto.strip())
    return texto.strip()

def es_ruido(texto):
    """Detecta si el texto es ruido (header, footer, etc.)"""
    texto_norm = norm(texto)
    
    # Lista de patrones de ruido
    ruido_patterns = [
        r"LINEA TECNOLOGICA",
        r"RED TECNOLOGICA",
        r"RED DE CONOCIMIENTO",
        r"GESTION DE LA INFORMACION",
        r"TECNOLOGIAS DE LA INFORMACION",
        r"DISENO Y DESARROLLO",
        r"^\d+/\d+/\d+\s+\d+:\d+",  # fechas
        r"^PAGINA\s+\d+",
        r"INFORMACION Y LAS COMUNICACIONES",
        r"^SOFTWARE$",
        r"^DENOMINACION$"
    ]
    
    for pattern in ruido_patterns:
        if re.search(pattern, texto_norm):
            return True
    
    # Si el texto es muy corto (menos de 10 caracteres) y no tiene contenido sustancial
    if len(texto.strip()) < 10 and not re.search(r"[a-zA-Z]{5,}", texto):
        return True
        
    return False

def es_contenido_valido(texto):
    """Verifica si el texto es contenido válido para guardar"""
    if not texto or len(texto.strip()) < 15:  # Mínimo 15 caracteres
        return False
    
    if es_ruido(texto):
        return False
    
    # Debe tener al menos una palabra completa
    if not re.search(r"[a-zA-ZÁÉÍÓÚáéíóúÑñ]{4,}", texto):
        return False
        
    return True
