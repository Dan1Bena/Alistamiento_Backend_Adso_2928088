const db = require('../config/conexion_db');
const bcrypt = require('bcrypt');

class InstructoresController {
    //Obtener Todos Los Usuarios Con Su Rol
    async obtenerInstructores(req, res) {
        try {
            const [instructores] = await db.query(
                `SELECT i.id_instructor, i.nombre, i.email, r.nombre AS rol,
                    COALESCE(GROUP_CONCAT(p.nombre ORDER BY p.id_permiso SEPARATOR ', '), 'Sin Permisos') AS permisos
                FROM instructores i
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

    async obtenerInstructorPorId(req, res) {
        const { id } = req.params;
        try {
            const [instructor] = await db.query(
                `SELECT
                i.id_instructor,
                i.nombre,
                i.email,
                r.nombre AS rol,
                COALESCE(GROUP_CONCAT(p.nombre SEPARATOR ', '), 'Sin Permisos') AS permisos
            FROM instructores i
            LEFT JOIN roles r ON i.id_rol = r.id_rol
            LEFT JOIN roles_permisos rp ON r.id_rol = rp.id_rol
            LEFT JOIN permisos p ON rp.id_permiso = p.id_permiso
            WHERE i.id_instructor = ?
            GROUP BY i.id_instructor, i.nombre, i.email, r.nombre`,
                [id]
            );

            if (instructor.length === 0) {
                return res.status(404).json({ error: 'Usuario no encontrado' });
            }

            res.json(instructor[0]);
        } catch (error) {
            res.status(500).json({ error: 'Error al obtener usuario' });
        }
    }

    //Agregar Un Usuario Nuevo
    async agregarInstructor(req, res) {
        const { id_rol = 2, nombre, email, contrasena = "123456", cedula, estado } = req.body;
        try {
            const hash = await bcrypt.hash(contrasena, 10);

            const [result] = await db.query(
                'INSERT INTO instructores (id_rol, nombre, email, contrasena, cedula, estado) VALUES (?, ?, ?, ?, ?, ?)',
                [id_rol, nombre, email, hash, cedula, estado]
            );

            // Retornar el nuevo usuario creado (incluye los datos que React necesita)
            res.json({
                id_instructor: result.insertId,
                nombre,
                email,
                cedula,
                id_rol,
                estado
            });
        } catch (error) {
            console.error("❌ Error en agregarInstructor:", error);
            res.status(500).json({ mensaje: 'Error al agregar instructor' });
        }
    }


    //Actualizar Usuario (Opcionalmente Cambiar contrasena)
    async actualizarInstructor(req, res) {
        const { id } = req.params;
        const { nombre, email, contrasena, id_rol } = req.body;
        try {
            if (contrasena && contrasena.trim() !== '') {
                const hash = await bcrypt.hash(contrasena, 10);
                await db.query(
                    'UPDATE instructores SET nombre = ?, email = ?, contrasena = ?, id_rol = ? WHERE id_instructor = ?',
                    [nombre, email, hash, id_rol, id]
                );
            } else {
                await db.query(
                    'UPDATE instructores SET nombre = ?, email = ?, id_rol = ? WHERE id_instructor = ?',
                    [nombre, email, id_rol, id]
                );
            }
            res.json({ mensaje: 'Instructor actualizado exitosamente' });
        } catch (error) {
            res.status(500).json({ mensaje: 'Error al actualizar usuario' });
        }
    }

    //Eliminar Usuario
    async eliminarInstructor(req, res) {
        const { id } = req.params;
        try {
            await db.query('DELETE FROM instructores WHERE id_instructor = ?', [id]);
            res.json({ mensaje: 'Instructor eliminado exitosamente' });
        } catch (error) {
            res.status(500).json({ error: 'Error al eliminar usuario' });
        }
    }
}
module.exports = InstructoresController;