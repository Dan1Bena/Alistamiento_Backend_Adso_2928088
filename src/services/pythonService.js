const { spawn } = require('child_process');
const path = require('path');

class PythonService {
    /**
     * Ejecuta el script Python y retorna el resultado
     * @param {string} pdfPath - Ruta absoluta al PDF
     * @param {string} tipo - 'programa', 'competencias', 'proyecto', 'todo'
     * @returns {Promise<Object>} - Resultado parseado
     */
    static ejecutarScript(pdfPath, tipo = 'todo') {
        return new Promise((resolve, reject) => {
            const scriptPath = path.join(__dirname, '../../python/main.py');

            // ✅ SOLUCIÓN: Usar 'python' o 'python3' según tu sistema
            const pythonCommand = process.platform === 'win32' ? 'python' : 'python3';
            
            console.log(`🔧 Ejecutando: ${pythonCommand} ${scriptPath} ${pdfPath} ${tipo}`);

            const python = spawn(pythonCommand, [scriptPath, pdfPath, tipo]);

            let dataString = '';
            let errorString = '';

            // Capturar stdout
            python.stdout.on('data', (data) => {
                dataString += data.toString();
                console.log("[PYTHON STDOUT]:", data.toString().trim());
            });

            // Capturar stderr
            python.stderr.on('data', (data) => {
                const msg = data.toString();
                console.error("[PYTHON STDERR]:", msg.trim());
                errorString += msg;
            });

            // Cuando el proceso termine
            python.on('close', (code) => {
                console.log(`[PYTHON] Proceso terminado con código: ${code}`);
                
                if (code !== 0) {
                    return reject({
                        error: 'Error en el script Python',
                        details: errorString,
                        code: code
                    });
                }

                try {
                    console.log("[PYTHON] Datos recibidos:", dataString);
                    const resultado = JSON.parse(dataString);
                    
                    if (!resultado.success) {
                        return reject({
                            error: 'Python retornó error',
                            details: resultado.error
                        });
                    }

                    resolve(resultado.data);
                } catch (parseError) {
                    reject({
                        error: 'Error al parsear JSON de Python',
                        details: parseError.message,
                        raw: dataString
                    });
                }
            });

            // Error al lanzar el proceso
            python.on('error', (error) => {
                console.error("[PYTHON] Error ejecutando proceso:", error);
                reject({
                    error: 'No se pudo ejecutar Python',
                    details: `Comando: ${pythonCommand}. Error: ${error.message}`,
                    suggestion: 'Verifica que Python esté instalado y en el PATH'
                });
            });
        });
    }
}

module.exports = PythonService;