const db = require('../config/conexion_db');
const bcrypt = require('bcrypt');
const { enviarCredenciales } = require("../services/emailService");

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
        const { id_rol = 2, nombre, email, contrasena, cedula, estado } = req.body;

        try {
            const hash = await bcrypt.hash(contrasena, 10);

            // Guardar usuario en BD
            const [result] = await db.query(
                'INSERT INTO instructores (id_rol, nombre, email, contrasena, cedula, estado) VALUES (?, ?, ?, ?, ?, ?)',
                [id_rol, nombre, email, hash, cedula, estado]
            );

            // 🔹 Enviar correo con credenciales (contraseña en texto plano)
            enviarCredenciales(email, nombre, contrasena);

            res.json({
                mensaje: "Instructor creado y correo enviado correctamente",
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

    async obtenerInstructorPorEmail(req, res) {
        const { email } = req.params;

        try {
            const [rows] = await db.query(
                `SELECT 
                id_instructor,
                nombre,
                email
            FROM instructores
            WHERE email = ?`,
                [email]
            );

            if (rows.length === 0) {
                return res.status(404).json({ mensaje: "Instructor no encontrado" });
            }

            res.json(rows[0]);

        } catch (error) {
            console.error("❌ Error al buscar instructor por email:", error);
            res.status(500).json({ mensaje: "Error interno al buscar instructor" });
        }
    }

    // Camila G.
    // Obtener fichas asignadas a un instructor
    async obtenerFichasPorInstructor(req, res) {
        const { id } = req.params;

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
                p.nombre_programa,
                p.codigo_programa
            FROM instructor_ficha inf
            INNER JOIN fichas f ON inf.id_ficha = f.id_ficha
            LEFT JOIN programa_formacion p ON f.id_programa = p.id_programa
            WHERE inf.id_instructor = ?`,
                [id]
            );

            res.json(fichas);
        } catch (error) {
            console.error("❌ Error al obtener fichas del instructor:", error);
            res.status(500).json({ error: "Error al obtener fichas del instructor" });
        }
    }
}
module.exports = InstructoresController;