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

            // Spawn del proceso Python
            const pythonPath = path.join(__dirname, '../../.venv/Scripts/python.exe');
            const python = spawn(pythonPath, [scriptPath, pdfPath, tipo]);

            let dataString = '';
            let errorString = '';

            // Capturar stdout
            python.stdout.on('data', (data) => {
                dataString += data.toString();
            });

            // Capturar stderr
            python.stderr.on('data', (data) => {
                const msg = data.toString();
                console.log("[PYTHON LOG]:", msg.trim()); // Muestra logs en consola Node
                errorString += msg;
            });


            // Cuando el proceso termine
            python.on('close', (code) => {
                if (code !== 0) {
                    return reject({
                        error: 'Error en el script Python',
                        details: errorString,
                        code: code
                    });
                }

                try {
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
                reject({
                    error: 'No se pudo ejecutar Python',
                    details: error.message
                });
            });
        });
    }
}

module.exports = PythonService;