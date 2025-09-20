const db = require('../config/conexion_db');

class RolesController {
    async obtenerRoles(req, res) {
        try {
            const [roles] = await db.query(`
             SELECT r.id_rol, r.nombre,
             COUNT (u.id_usuarios) AS cantidad_usuarios
             FROM roles r
             LEFT JOIN usuarios u ON r.id_rol = u.id_rol
             GROUP BY r.id_rol, r.nombre
            `);
            res.json(roles);
        } catch (error) {
            res.status(500).json({ error: 'Error al obtener los roles' });
        }
    }

    async obtenerRolPorId(req, res) {
        const { id } = req.params;
        try {
            const [rolRows] = await db.query('SELECT * FROM roles WHERE id_rol = ?', [id]);

            if (rolRows.length === 0) {
                return res.status(404).json({ error: 'Rol no encontrado' });
            }

            const rol = rolRows[0];

            // Traemos Los Permisos De Ese Rol
            const [permisos] = await db.query(
                `SELECT p.id_permiso, p.nombre
                FROM roles_permisos rp
                JOIN permisos p ON rp.id_permiso = p.id_permiso
                WHERE rp.id_rol = ?`,
                [rol.id_rol]
            );

            rol.permisos = permisos.map(p => ({ id: p.id_permiso, nombre: p.nombre }));

            res.json(rol);
        } catch (error) {
            res.status(500).json({ error: 'Error al obtener rol con permisos' });
        }
    }

    async agregarRol(req, res) {
        const { nombre, permisos } = req.body; //Permisos: [1, 2, 3]
        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();

            //Insertamos El Rol
            const [result] = await connection.query(
                'INSERT INTO roles (nombre) VALUES (?)',
                [nombre]
            );
            const idRol = result.insertId;

            //Insertamos Los Permisos Asociados Al Rol
            if (permisos && permisos.length > 0) {
                const values = permisos.map(id_permiso => [idRol, id_permiso]);
                await connection.query(
                    'INSERT INTO roles_permisos (id_rol, id_permiso) VALUES ?',
                    [values]
                );
            }

            await connection.commit();
            res.json({ mensaje: 'Rol Agregado Correctamente', id_rol: idRol });
        } catch (error) {
            await connection.rollback();
            res.status(500).json({ error: 'Error Al Agregar Rol Con Permisos' });
        } finally {
            connection.release();
        }
    }

    async actualizarRol(req, res) {
        const { id } = req.params;
        const { nombre, permisos } = req.body;
        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();

            //Actualizamos El Nombre Del Rol
            await connection.query(
                'UPDATE roles SET nombre = ? WHERE id_rol = ?',
                [nombre, id]
            );

            //Borramos Los Permisos Anteriores
            await connection.query('DELETE FROM roles_permisos WHERE id_rol = ?', [id]);

            //Insertamos Los Nuevos Permisos
            if (permisos && permisos.length > 0) {
                const values = permisos.map(id_permiso => [id, id_permiso]);
                await connection.query(
                    'INSERT INTO roles_permisos (id_rol, id_permiso) VALUES ?',
                    [values]
                );
            }

            await connection.commit();
            res.json({ mensaje: 'Rol Actualizado Correctamente' });
        } catch (error) {
            await connection.rollback();
            res.status(500).json({ error: 'Error Al Actualizar Rol Con Permisos' });
        } finally {
            connection.release();
        }
    }

    async eliminarRol(req, res) {
        const { id } = req.params;
        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();

            //Eliminar Permisos Asociados
            await connection.query('DELETE FROM roles_permisos WHERE id_rol = ?', [id]);

            //Eliminar El Rol
            const [result] = await connection.query('DELETE FROM roles WHERE id_rol = ?', [id]);

            await connection.commit();
            res.json({ mensaje: 'Rol Eliminado Correctamente' });
        } catch (error) {
            await connection.rollback();
            res.status(500).json({ error: 'Error Al Eliminar Rol' });
        } finally {
            connection.release();
        }
    }
}

module.exports = new RolesController();