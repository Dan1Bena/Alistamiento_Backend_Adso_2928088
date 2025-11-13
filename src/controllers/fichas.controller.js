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

  async agregarFichas(req, res){
    
    const { id_programa, codigo_ficha, modalidad, jornada, ambiente, fecha_inicio, fecha_final } = req.body;

    try {
      await db.query(
      `INSERT INTO fichas (id_programa, codigo_ficha, modalidad, jornada, ambiente, fecha_inicio, fecha_final, cantidad_trimestre) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [id_programa, codigo_ficha, modalidad, jornada, ambiente, fecha_inicio, fecha_final]
      );
      res.json({mensaje: 'Ficha creada exitosamente'});
    } catch (error) {
      console.error("Error al obtener fichas:", error);
      res.status(500).json({ error: "Error al crear ficha" });
    };
  };
}

module.exports = FichasController;