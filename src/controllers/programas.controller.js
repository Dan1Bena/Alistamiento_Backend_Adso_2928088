const db = require('../config/conexion_db');

class ProgramaController {
    //Obtener Todos Los Programas
    async obtenerProgramas(req, res) {
        try {
            const [programas] = await db.query(
                `SELECT p.id_programa, p.
                FROM programa_formacion p
                LEFT JOIN roles r ON i.id_rol = r.id_rol
                LEFT JOIN roles_permisos rp ON r.id_rol = rp.id_rol
                LEFT JOIN permisos p ON rp.id_permiso = p.id_permiso
                GROUP BY i.id_instructor, i.nombre, i.email, r.nombre`
            );

            res.json(instructores);
        } catch (error) {
            console.error(error);
            res.status(500).json({ mensaje: 'Error al obtener usuarios' });
        }
    }
}

module.exports = ProgramaController