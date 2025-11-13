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
}

module.exports = ProgramaController