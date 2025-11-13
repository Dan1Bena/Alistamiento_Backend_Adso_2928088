const db = require('../config/conexion_db');
const PythonService = require('../services/pythonService');
const fs = require('fs');
const path = require('path');

class PdfController {
    /**
     * Procesa un PDF de programa de formación
     */
    async procesarPdf(req, res) {
        const connection = await db.getConnection();

        try {
            if (!req.file) {
                return res.status(400).json({ error: 'No se subió ningún archivo PDF' });
            }

            const pdfPath = req.file.path;
            const tipo = req.body.tipo || 'todo';

            console.log(`Procesando PDF: ${pdfPath}`);
            console.log(`Tipo de extracción: ${tipo}`);

            // Ejecutar script Python
            const resultado = await PythonService.ejecutarScript(pdfPath, tipo);
            console.log('✅ Python retornó datos');

            await connection.beginTransaction();

            let idPrograma = null;
            let idsCompetencias = [];
            let idsRaps = [];

            // === GUARDAR PROGRAMA ===
            if (resultado.programa && resultado.programa.length > 0) {
                const prog = resultado.programa[0];

                const [resultPrograma] = await connection.query(`
                    INSERT INTO programa_formacion 
                    (codigo_programa, nombre_programa, vigencia, tipo_programa, 
                     version_programa, horas_totales, horas_etapa_lectiva, horas_etapa_productiva)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                `, [
                    this.truncar(prog.codigo_programa, 100),
                    this.truncar(prog.nombre_programa, 150),
                    this.truncar(prog.vigencia, 5000),
                    this.truncar(prog.tipo, 500),
                    this.truncar(prog.version_programa, 500),
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
                        INSERT INTO competencia
                        (id_programa, codigo_norma, nombre_competencia, 
                         unidad_competencia, duracion_maxima)
                        VALUES (?, ?, ?, ?, ?)
                    `, [
                        idPrograma,
                        this.truncar(comp.codigo_norma, 100),
                        this.truncar(comp.nombre_competencia, 200),
                        this.truncar(comp.unidad_competencia, 150),
                        this.extraerNumeroHoras(comp.duracion_maxima)
                    ]);

                    idsCompetencias.push(resultComp.insertId);
                }
                console.log(`✅ ${idsCompetencias.length} competencias guardadas`);
            }

            // ... (mantén el resto de tu código para RAPs)

            await connection.commit();
            this.eliminarArchivo(pdfPath);

            res.json({
                success: true,
                mensaje: 'PDF procesado exitosamente',
                data: {
                    id_programa: idPrograma,
                    ids_competencias: idsCompetencias,
                    ids_raps: idsRaps,
                    resumen: {
                        programas: resultado.programa?.length || 0,
                        competencias: resultado.competencias?.length || 0,
                        raps: resultado.raps?.length || 0
                    }
                }
            });

        } catch (error) {
            await connection.rollback();
            if (req.file) this.eliminarArchivo(req.file.path);

            console.error('❌ Error procesando PDF:', error);
            res.status(500).json({
                error: 'Error al procesar el PDF',
                detalles: error.message
            });
        } finally {
            connection.release();
        }
    }

    /**
     * Procesa un PDF de proyecto formativo
     */
    async procesarProyecto(req, res) {
        const connection = await db.getConnection();

        try {
            if (!req.file) return res.status(400).json({ error: 'No se envió archivo' });

            const pdfPath = path.resolve(req.file.path);
            console.log(`Procesando PDF del proyecto: ${pdfPath}`);

            const resultado = await PythonService.ejecutarScript(pdfPath, 'proyecto');

            await connection.beginTransaction();

            let idProyecto = null;

            // === GUARDAR PROYECTO ===
            if (resultado.proyecto && resultado.proyecto.length > 0) {
                const proy = resultado.proyecto[0];

                // Buscar el programa por código
                const [programaRows] = await connection.query(
                    `SELECT id_programa FROM programa_formacion WHERE codigo_programa = ?`,
                    [proy.codigo_programa]
                );

                const idPrograma = programaRows.length > 0 ? programaRows[0].id_programa : null;

                const [resultProyecto] = await connection.query(`
                    INSERT INTO proyectos 
                    (codigo_proyecto, nombre_proyecto, codigo_programa, 
                    centro_formacion, regional, id_programa)
                    VALUES (?, ?, ?, ?, ?, ?)
                `, [
                    this.truncar(proy.codigo_proyecto, 100),
                    this.truncar(proy.nombre_proyecto, 150),
                    this.truncar(proy.codigo_programa, 100),
                    this.truncar(proy.centro_formacion, 150),
                    this.truncar(proy.regional, 150),
                    idPrograma
                ]);

                idProyecto = resultProyecto.insertId;
                console.log(`✅ Proyecto guardado con ID: ${idProyecto}`);
            }

            await connection.commit();
            this.eliminarArchivo(pdfPath);

            return res.json({
                mensaje: 'Proyecto procesado exitosamente',
                data: {
                    id_proyecto: idProyecto,
                    datos_extraidos: resultado
                }
            });

        } catch (err) {
            await connection.rollback();
            if (req.file) this.eliminarArchivo(req.file.path);

            console.error('Error procesando proyecto:', err);
            res.status(500).json({
                error: 'Error al procesar el proyecto',
                detalles: err.message
            });
        } finally {
            connection.release();
        }
    }

    /**
 * Obtiene todos los programas de formación
 */
    async obtenerProgramas(req, res) {
        try {
            const [programas] = await db.query(`
            SELECT 
                pf.id_programa,
                pf.codigo_programa,
                pf.nombre_programa,
                pf.vigencia,
                pf.tipo_programa,
                pf.version_programa,
                pf.horas_totales,
                pf.horas_etapa_lectiva,
                pf.horas_etapa_productiva,
                COUNT(DISTINCT c.id_competencia) as total_competencias,
                COUNT(DISTINCT r.id_rap) as total_raps,
                COUNT(DISTINCT p.id_proyecto) as total_proyectos
            FROM programa_formacion pf
            LEFT JOIN competencia c ON pf.id_programa = c.id_programa
            LEFT JOIN raps r ON c.id_competencia = r.id_competencia
            LEFT JOIN proyectos p ON pf.id_programa = p.id_programa
            GROUP BY pf.id_programa
            ORDER BY pf.id_programa DESC
        `);

            res.json({
                success: true,
                data: programas
            });

        } catch (error) {
            console.error('Error obteniendo programas:', error);
            res.status(500).json({
                error: 'Error al obtener los programas',
                detalles: error.message
            });
        }
    }

    /**
     * Función para truncar campos largos
     */
    truncar(valor, maxLength = 255) {
        if (!valor || typeof valor !== 'string') return null;
        if (valor.length <= maxLength) return valor;

        console.log(`✂️ Truncando campo de ${valor.length} a ${maxLength} caracteres`);
        return valor.substring(0, maxLength - 3) + '...';
    }

    extraerNumeroHoras(textoHoras) {
        if (!textoHoras) return null;
        const match = String(textoHoras).match(/(\d+)/);
        return match ? parseInt(match[1]) : null;
    }

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