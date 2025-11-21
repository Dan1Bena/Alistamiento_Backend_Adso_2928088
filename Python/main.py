import sys
import json
import os
from extractors.programa_extractor import extraer_programa
from extractors.competencias_extractor import extraer_competencias
from extractors.raps_extractor import extraer_raps 
from extractors.proyecto_extractor import extraer_proyecto, extraer_fases_proyecto, extraer_actividades_proyecto

# Configurar UTF-8
if sys.stdout.encoding != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8') # type: ignore
if sys.stderr.encoding != 'utf-8':
    sys.stderr.reconfigure(encoding='utf-8') # type: ignore

os.environ['PYTHONIOENCODING'] = 'utf-8'

def procesar_pdf(pdf_path: str, tipo: str) -> dict:
    """
    Procesa un PDF y extrae información según el tipo
    Args:
        pdf_path: Ruta absoluta al PDF
        tipo: 'programa', 'competencias', 'todo'
    """

    resultado = {}

    try:
        if tipo in ['programa', 'todo']:
            resultado['programa'] = extraer_programa(pdf_path)
            
        if tipo in ['competencias', 'todo']:
            resultado['competencias'] = extraer_competencias(pdf_path)
        
        if tipo in ['raps', 'todo']:
            resultado['unidadRaps'] = extraer_raps(pdf_path)
            
        if tipo in ['proyecto', 'todo']:
            resultado['proyecto'] = extraer_proyecto(pdf_path)
            
        if tipo in ['fases','todo']:
            resultado['fases'] = extraer_fases_proyecto(pdf_path)
            
        if tipo in ['actividades', 'todo']:
            resultado['actividades'] = extraer_actividades_proyecto(pdf_path)
            
        return {"success": True, "data": resultado}
    except Exception as e:
        return {"success": False, "error": str(e)}

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print(json.dumps({
            "success": False, 
            "error": "Uso: python main.py <ruta_pdf> <tipo>"
        }))
        sys.exit(1)

    pdf_path = sys.argv[1]
    tipo = sys.argv[2]

    resultado = procesar_pdf(pdf_path, tipo)
    print(json.dumps(resultado, ensure_ascii=False, indent=2))