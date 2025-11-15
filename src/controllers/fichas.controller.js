const db = require("../config/conexion_db");

class FichasController {
  // Obtener todas las fichas por programas almacenadas en la BD
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
      };

      res.json(fichas);
    } catch (error) {
      console.error("Error al obtener fichas:", error);
      res.status(500).json({ error: "Error al obtener fichas" });
    };
  }

  // Agrega este método después de obtenerFichasPorProgramas
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
    const { id_programa, codigo_ficha, modalidad, jornada, ambiente, fecha_inicio, fecha_final, cantidad_trimestre } = req.body;

    try {
      // MODIFICA ESTA PARTE:
      const [result] = await db.query(
        `INSERT INTO fichas (id_programa, codigo_ficha, modalidad, jornada, ambiente, fecha_inicio, fecha_final, cantidad_trimestre) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [id_programa, codigo_ficha, modalidad, jornada, ambiente, fecha_inicio, fecha_final, cantidad_trimestre]
      );

      // Obtener la ficha recién creada
      const [fichaCreada] = await db.query(
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
      LEFT JOIN programa_formacion p ON f.id_programa = p.id_programa
      WHERE f.id_ficha = ?`,
        [result.insertId]
      );

      res.json({ mensaje: 'Ficha creada exitosamente', ficha: fichaCreada[0] });
    } catch (error) {
      console.error("Error al crear ficha:", error);
      res.status(500).json({ error: "Error al crear ficha" });
    }
  }

  async eliminarFicha(req, res) {
    const { id } = req.params;

    try {
      // Verificar si la ficha existe
      const [existe] = await db.query(
        "SELECT id_ficha FROM fichas WHERE id_ficha = ?",
        [id]
      );

      if (existe.length === 0) {
        return res.status(404).json({ error: "Ficha no encontrada" });
      }

      // Eliminar la ficha
      await db.query("DELETE FROM fichas WHERE id_ficha = ?", [id]);

      res.json({ mensaje: "Ficha eliminada correctamente" });
    } catch (error) {
      console.error("Error eliminando ficha:", error);
      res.status(500).json({ error: "Error al eliminar la ficha" });
    }
  }

}

module.exports = FichasController;