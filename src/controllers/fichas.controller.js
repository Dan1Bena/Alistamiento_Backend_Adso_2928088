const db = require("../config/conexion_db");

class FichasController {
  async obtenerFichasPorProgramas(req, res) {
    const { id_programa } = req.params;

    try {
      const [fichas] = await db.query(
        `SELECT
          f.id_ficha,
          f.codigo_ficha,
          f.modalidad,
          f.jornada,
          f.ambiente,
          f.fecha_inicio,
          f.fecha_final,
          f.cantidad_trimestre,
          p.nombre_programa AS programa,
          p.codigo_programa
        FROM fichas f
        LEFT JOIN programa_formacion p ON f.id_programa = p.id_programa
        WHERE f.id_programa = ?`,
        [id_programa]
      );

      if (fichas.length === 0) {
        return res.status(404).json({ error: "No se encontraron fichas para este programa" });
      }

      res.json(fichas);
    } catch (error) {
      console.error("Error al obtener fichas:", error);
      res.status(500).json({ error: "Error al obtener fichas" });
    }
  }

  async obtenerTodasLasFichas(req, res) {
    try {
      const [fichas] = await db.query(
        `SELECT
          f.id_ficha,
          f.codigo_ficha,
          f.modalidad,
          f.jornada,
          f.ambiente AS ubicacion,
          f.fecha_inicio,
          f.fecha_final AS fecha_fin,
          f.cantidad_trimestre,
          f.id_programa,
          p.nombre_programa
        FROM fichas f
        LEFT JOIN programa_formacion p ON f.id_programa = p.id_programa`
      );

      res.json(fichas);
    } catch (error) {
      console.error("Error al obtener todas las fichas:", error);
      res.status(500).json({ error: "Error al obtener fichas" });
    }
  }

  async agregarFichas(req, res) {
    const {
      id_programa,
      codigo_ficha,
      modalidad,
      jornada,
      ambiente,
      fecha_inicio,
      fecha_final,
      cantidad_trimestre,
      id_instructor
    } = req.body;

    try {
      const [result] = await db.query(
        `INSERT INTO fichas
        (id_programa, codigo_ficha, modalidad, jornada, ambiente, fecha_inicio, fecha_final, cantidad_trimestre)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id_programa,
          codigo_ficha,
          modalidad,
          jornada,
          ambiente,
          fecha_inicio,
          fecha_final,
          cantidad_trimestre
        ]
      );

      const id_ficha = result.insertId;

      if (id_instructor) {
        await db.query(
          "INSERT INTO instructor_ficha (id_instructor, id_ficha) VALUES (?, ?)",
          [id_instructor, id_ficha]
        );
      }

      res.json({ mensaje: "Ficha creada correctamente", id_ficha });
    } catch (error) {
      console.error("Error al crear ficha:", error);
      res.status(500).json({ error: "Error al crear ficha" });
    }
  }

  async actualizarFicha(req, res) {
    const { id } = req.params;
    const {
      id_programa,
      codigo_ficha,
      modalidad,
      jornada,
      ambiente,
      fecha_inicio,
      fecha_final,
      cantidad_trimestre,
      instructores
    } = req.body;

    try {
      const [existe] = await db.query(
        "SELECT id_ficha FROM fichas WHERE id_ficha = ?",
        [id]
      );

      if (existe.length === 0) {
        return res.status(404).json({ error: "Ficha no encontrada" });
      }

      await db.query(
        `UPDATE fichas
        SET id_programa=?, codigo_ficha=?, modalidad=?, jornada=?, ambiente=?,
            fecha_inicio=?, fecha_final=?, cantidad_trimestre=?
        WHERE id_ficha=?`,
        [
          id_programa,
          codigo_ficha,
          modalidad,
          jornada,
          ambiente,
          fecha_inicio,
          fecha_final,
          cantidad_trimestre,
          id
        ]
      );

      await db.query(
        "DELETE FROM instructor_ficha WHERE id_ficha = ?",
        [id]
      );

      if (Array.isArray(instructores) && instructores.length > 0) {
        for (const inst of instructores) {
          await db.query(
            "INSERT INTO instructor_ficha (id_instructor, id_ficha) VALUES (?, ?)",
            [inst, id]
          );
        }
      }

      res.json({ mensaje: "Ficha actualizada correctamente" });
    } catch (error) {
      console.error("Error al actualizar ficha:", error);
      res.status(500).json({ error: "Error al actualizar la ficha" });
    }
  }

  async obtenerFichasInstructor(req, res) {
    const { id_instructor } = req.params;

    try {
      const [rows] = await db.query(
        `SELECT
          f.id_ficha,
          f.codigo_ficha,
          f.modalidad,
          f.jornada,
          f.ambiente AS ubicacion,
          f.fecha_inicio,
          f.fecha_final,
          f.id_programa
        FROM instructor_ficha i
        INNER JOIN fichas f ON i.id_ficha = f.id_ficha
        WHERE i.id_instructor = ?`,
        [id_instructor]
      );

      res.json(rows);
    } catch (error) {
      console.error("Error obteniendo fichas del instructor:", error);
      res.status(500).json({ error: "Error al obtener fichas del instructor" });
    }
  }

  async eliminarFicha(req, res) {
    const { id } = req.params;

    try {
      const [existe] = await db.query(
        "SELECT id_ficha FROM fichas WHERE id_ficha = ?",
        [id]
      );

      if (existe.length === 0) {
        return res.status(404).json({ error: "Ficha no encontrada" });
      }

      await db.query("DELETE FROM fichas WHERE id_ficha = ?", [id]);

      res.json({ mensaje: "Ficha eliminada correctamente" });
    } catch (error) {
      console.error("Error eliminando ficha:", error);
      res.status(500).json({ error: "Error al eliminar la ficha" });
    }
  }
}

module.exports = FichasController;