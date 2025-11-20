const { log } = require("console");
const db = require("../config/conexion_db");
const PythonService = require("../services/pythonService");
const fs = require("fs");
const path = require("path");

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
          error: "No se subió ningún archivo PDF",
        });
      }

      const pdfPath = req.file.path;
      const tipo = req.body.tipo || "todo"; // programa, competencias, todo

      console.log(`Procesando PDF: ${pdfPath}`);
      console.log(`Tipo de extracción: ${tipo}`);

      // Ejecutar script Python
      const resultado = await PythonService.ejecutarScript(pdfPath, tipo);

      console.log("✅ Python retornó datos:", JSON.stringify(resultado, null, 2));

      // Iniciar transacción
      await connection.beginTransaction();

      let idPrograma = null;
      let idsCompetencias = [];
      let idsRaps = [];

      // === GUARDAR PROGRAMA ===
      if (resultado.programa && resultado.programa.length > 0) {
        const prog = resultado.programa[0];

        const [resultPrograma] = await connection.query(
          `
                    INSERT INTO programa_formacion 
                    (codigo_programa, nombre_programa, vigencia, tipo_programa, 
                     version_programa, horas_totales, horas_etapa_lectiva, horas_etapa_productiva)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                `,
          [
            prog.codigo_programa || null,
            prog.nombre_programa || null,
            prog.vigencia || null,
            prog.tipo || null,
            prog.version_programa || null,
            this.extraerNumeroHoras(prog.horas_totales),
            this.extraerNumeroHoras(prog.horas_etapa_lectiva),
            this.extraerNumeroHoras(prog.horas_etapa_productiva),
          ]
        );

        idPrograma = resultPrograma.insertId;
        console.log(`Programa guardado con ID: ${idPrograma}`);
      }

      // === GUARDAR COMPETENCIAS ===
      if (resultado.competencias && resultado.competencias.length > 0) {
        for (const comp of resultado.competencias) {
          const [resultComp] = await connection.query(
            `
                        INSERT INTO competencias
                        (id_programa, codigo_norma, nombre_competencia, 
                         unidad_competencia, duracion_maxima)
                        VALUES (?, ?, ?, ?, ?)
                    `,
            [
              idPrograma,
              comp.codigo_norma || null,
              comp.nombre_competencia || null,
              comp.unidad_competencia || null,
              this.extraerNumeroHoras(comp.duracion_maxima),
            ]
          );

          idsCompetencias.push(resultComp.insertId);
        }
        console.log(`${idsCompetencias.length} competencias guardadas`);
      }

      // === GUARDAR RAPs ===
      if (resultado.unidadRaps && resultado.unidadRaps.length > 0) {
        console.log(`Procesando ${resultado.unidadRaps.length} competencias...`);

        for (const infoRap of resultado.unidadRaps) {
          const codigoCompetencia = infoRap.codigo_competencia;
          const raps = infoRap.resultados_aprendizaje || [];

          if (raps.length === 0) {
            console.warn(`Competencia ${codigoCompetencia} sin RAPs, saltando...`);
            continue;
          }

          // Buscar el id_competencia y duración
          const [competenciaRow] = await connection.query(
            `SELECT id_competencia, duracion_maxima FROM competencias WHERE codigo_norma = ?`,
            [codigoCompetencia]
          );

          if (competenciaRow.length === 0) {
            console.warn(`Competencia ${codigoCompetencia} no encontrada en BD`);
            continue;
          }

          const idCompetencia = competenciaRow[0].id_competencia;
          const duracionMaxima = competenciaRow[0].duracion_maxima;
          const numRaps = raps.length;

          // Calcular duración por RAP
          const duracionPorRap = duracionMaxima ? Math.round(duracionMaxima / numRaps) : null;

          console.log(`\n ${codigoCompetencia}: ${numRaps} RAPs (${duracionMaxima}h total → ${duracionPorRap}h/RAP)`);

          // Insertar cada RAP
          for (let i = 0; i < raps.length; i++) {
            const rapTexto = raps[i];

            // Extraer código del RAP (número al inicio)
            const match = rapTexto.match(/^(\d{1,2})\s+(.+)/);
            const codigoRap = match ? match[1].padStart(2, "0") : String(i + 1).padStart(2, "0");
            const denominacionRap = match ? match[2].trim() : rapTexto.trim();

            // Insertar RAP
            const [resultRap] = await connection.query(
              `INSERT INTO raps (id_competencia, codigo, denominacion, duracion) 
                 VALUES (?, ?, ?, ?)`,
              [idCompetencia, codigoRap, denominacionRap, duracionPorRap]
            );

            const idRap = resultRap.insertId;
            idsRaps.push(idRap);

            console.log(`${codigoCompetencia}-${codigoRap} guardado (ID: ${idRap})`);

            // Insertar Conocimientos de Proceso (como TEXTO único)
            if (infoRap.conocimientos_proceso) {
              await connection.query(`INSERT INTO conocimiento_proceso (id_rap, nombre) VALUES (?, ?)`, [
                idRap,
                infoRap.conocimientos_proceso,
              ]);
            }

            // Insertar Conocimientos del Saber (como TEXTO único)
            if (infoRap.conocimientos_saber) {
              await connection.query(`INSERT INTO conocimiento_saber (id_rap, nombre) VALUES (?, ?)`, [
                idRap,
                infoRap.conocimientos_saber,
              ]);
            }

            // Insertar Criterios de Evaluación (como TEXTO único)
            if (infoRap.criterios_evaluacion) {
              await connection.query(`INSERT INTO criterios_evaluacion (id_rap, nombre) VALUES (?, ?)`, [
                idRap,
                infoRap.criterios_evaluacion,
              ]);
            }
          }
        }

        console.log(`\nTotal de ${idsRaps.length} RAPs guardados con sus conocimientos y criterios`);
      }

      // Confirmar transacción
      await connection.commit();

      // Eliminar archivo temporal
      this.eliminarArchivo(pdfPath);

      res.json({
        mensaje: "PDF procesado exitosamente",
        data: {
          id_programa: idPrograma,
          ids_competencias: idsCompetencias,
          ids_raps: idsRaps,
          resumen: {
            programas: resultado.programa?.length || 0,
            competencias: resultado.competencias?.length || 0,
            resultados_aprendizaje: resultado.unidadRaps?.length || 0,
          },
        },
      });
    } catch (error) {
      await connection.rollback();

      // Eliminar archivo en caso de error
      if (req.file) {
        this.eliminarArchivo(req.file.path);
      }

      console.error("Error procesando PDF:", error);

      res.status(500).json({
        error: "Error al procesar el PDF",
        detalles: error.details || error.message,
      });
    } finally {
      connection.release();
    }
  }

  procesarProyecto = async (req, res) => {
    try {
      if (!req.file) return res.status(400).json({ error: "No se envió archivo" });

      const connection = await db.getConnection();
      const pdfPath = path.resolve(req.file.path);
      console.log(`Procesando PDF del proyecto: ${pdfPath}`);

      const resultado = await PythonService.ejecutarScript(pdfPath, "proyecto");
      const resultadoFases = await PythonService.ejecutarScript(pdfPath, "fases") 

      fs.unlinkSync(pdfPath);

      // === GUARDAR PROYECTO ===
      if (resultado.proyecto && resultado.proyecto.length > 0) {
        const proy = resultado.proyecto[0];

        const [rows] = await connection.query(`SELECT id_programa FROM programa_formacion WHERE codigo_programa = ?`, [
          proy.codigo_programa,
        ]);

        const idPrograma = rows.length > 0 ? rows[0].id_programa : null;

        const [resultProyecto] = await connection.query(
          `
                INSERT INTO proyectos 
                (codigo_proyecto, nombre_proyecto, codigo_programa, 
                centro_formacion, regional, id_programa)
                VALUES (?, ?, ?, ?, ?, ?)
            `,
          [
            proy.codigo_proyecto || null,
            proy.nombre_proyecto || null,
            proy.codigo_programa || null,
            proy.centro_formacion || null,
            proy.regional || null,
            idPrograma, // FK al programa (si se insertó antes)
          ]
        );

        const idProyecto = resultProyecto.insertId;
        console.log(`Proyecto guardado con ID: ${idProyecto}`);

        if (resultadoFases.fases && resultadoFases.fases.length > 0) {
          for(const fase of resultadoFases.fases) {
              await connection.query(
              `INSERT INTO fases (nombre) VALUES (?)`,
              [fase.nombre]
            );
          }
          console.log(`Fases guardadas: ${resultadoFases.fases.length}`);
        }
      }

      return res.status(200).json(resultado, resultadoFases);
    } catch (err) {
      console.error("Error procesando proyecto:", err);
      res.status(500).json({ error: err.message });
    }
  };

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
        console.log(`Archivo eliminado: ${filePath}`);
      }
    } catch (error) {
      console.error("Error eliminando archivo:", error);
    }
  }
}

module.exports = PdfController;
