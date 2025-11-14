const db = require('../config/conexion_db');

class ProgramaController {
    //Obtener Todos Los Programas
    async obtenerProgramas(req, res) {
        try {
            const [programas] = await db.query(
                `SELECT 
                    p.id_programa, 
                    p.codigo_programa, 
                    p.nombre_programa, 
                    COUNT(f.id_ficha) AS total_fichas
                FROM programa_formacion p
                LEFT JOIN fichas f ON f.id_programa = p.id_programa
                GROUP BY p.id_programa`
            );

            res.json(programas);
        } catch (error) {
            console.error(error);
            res.status(500).json({ mensaje: 'Error al obtener programas' });
        }
    }

    async eliminarPrograma(req, res) {
    try {
        const { id } = req.params;

        // 1. Verificar que exista
        const [existe] = await db.query(
            "SELECT id_programa FROM programa_formacion WHERE id_programa = ?",
            [id]
        );

        if (existe.length === 0) {
            return res.status(404).json({ mensaje: "Programa no encontrado" });
        }

        // 2. Eliminar programa
        await db.query("DELETE FROM programa_formacion WHERE id_programa = ?", [id]);

        res.json({ mensaje: "Programa eliminado correctamente" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: "Error al eliminar programa" });
    }
}

}

module.exports = ProgramaController