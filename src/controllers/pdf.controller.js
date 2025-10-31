const db = require('../config/conexion_db');
const PythonService = require('../services/pythonService');
const fs = require('fs');
const path = require('path');

class PdfController {
    /**
     * Procesa un PDF y guarda la información en la BD
     */
    async procesarPdf(req, res) {
        const connection = await db.getConnection();
        
        try {
            // Validar que se subió un archivo
            if (!req.file) {
                return res.status(400).json({ 
                    error: 'No se subió ningún archivo PDF' 
                });
            }

            const pdfPath = req.file.path;
            const tipo = req.body.tipo || 'todo'; // programa, competencias, todo

            console.log(`📄 Procesando PDF: ${pdfPath}`);
            console.log(`🔍 Tipo de extracción: ${tipo}`);

            // Ejecutar script Python
            const resultado = await PythonService.ejecutarScript(pdfPath, tipo);

            console.log('✅ Python retornó datos:', JSON.stringify(resultado, null, 2));

            // Iniciar transacción
            await connection.beginTransaction();

            let idPrograma = null;
            let idsCompetencias = [];

            // === GUARDAR PROGRAMA ===
            if (resultado.programa && resultado.programa.length > 0) {
                const prog = resultado.programa[0];
                
                const [resultPrograma] = await connection.query(`
                    INSERT INTO programa_formacion 
                    (codigo_programa, nombre_programa, vigencia, tipo_programa, 
                     version_programa, horas_totales, horas_etapa_lectiva, horas_etapa_productiva)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                `, [
                    prog.codigo_programa || null,
                    prog.nombre_programa || null,
                    prog.vigencia || null,
                    prog.tipo || null,
                    prog.version_programa || null,
                    this.extraerNumeroHoras(prog.horas_totales),
                    this.extraerNumeroHoras(prog.horas_etapa_lectiva),
                    this.extraerNumeroHoras(prog.horas_etapa_productiva)
                ]);

                idPrograma = resultPrograma.insertId;
                console.log(`✅ Programa guardado con ID: ${idPrograma}`);
            }

            // === GUARDAR COMPETENCIAS ===
            if (resultado.competencias && resultado.competencias.length > 0) {
                for (const comp of resultado.competencias) {
                    const [resultComp] = await connection.query(`
                        INSERT INTO competencias
                        (id_programa, codigo_norma, nombre_competencia, 
                         unidad_competencia, duracion_maxima)
                        VALUES (?, ?, ?, ?, ?)
                    `, [
                        idPrograma,
                        comp.codigo_norma || null,
                        comp.nombre_competencia || null,
                        comp.unidad_competencia || null,
                        this.extraerNumeroHoras(comp.duracion_maxima)
                    ]);

                    idsCompetencias.push(resultComp.insertId);
                }
                console.log(`✅ ${idsCompetencias.length} competencias guardadas`);
            }

            // Confirmar transacción
            await connection.commit();

            // Eliminar archivo temporal
            this.eliminarArchivo(pdfPath);

            res.json({
                mensaje: 'PDF procesado exitosamente',
                data: {
                    id_programa: idPrograma,
                    ids_competencias: idsCompetencias,
                    resumen: {
                        programas: resultado.programa?.length || 0,
                        competencias: resultado.competencias?.length || 0
                    }
                }
            });

        } catch (error) {
            await connection.rollback();
            
            // Eliminar archivo en caso de error
            if (req.file) {
                this.eliminarArchivo(req.file.path);
            }

            console.error('❌ Error procesando PDF:', error);

            res.status(500).json({
                error: 'Error al procesar el PDF',
                detalles: error.details || error.message
            });
        } finally {
            connection.release();
        }
    }

    /**
     * Extrae el número de horas de un string como "3120 horas"
     */
    extraerNumeroHoras(textoHoras) {
        if (!textoHoras) return null;
        const match = String(textoHoras).match(/(\d+)/);
        return match ? parseInt(match[1]) : null;
    }

    /**
     * Elimina un archivo de forma segura
     */
    eliminarArchivo(filePath) {
        try {
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
                console.log(`🗑️ Archivo eliminado: ${filePath}`);
            }
        } catch (error) {
            console.error('Error eliminando archivo:', error);
        }
    }
}

module.exports = PdfController;