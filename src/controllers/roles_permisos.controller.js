const db = require('../config/conexion_db');

class RolPermisoController {
    // Obtener Todas Las Relaciones Rol-permisos
    async getAll(req, res) {
        try {
            const [rolPermisos] = await db.query(`
                SELECT rp.id_rol_permiso, rp.id_rol, r.nombre AS rol, p.nombre AS permiso
                FROM roles_permisos rp
                JOIN roles r ON rp.id_rol = r.id_rol
                JOIN permisos p ON rp.id_permiso = p.id_permiso
            `);
            res.json(rolPermisos);
        } catch (error) {
            res.status(500).json({ error: 'Error al obtener las relaciones rol-permisos' });
        }
    }

    async obteberPermisosDeRol(req, res) {
        const { idrol } = req.params;
        try {
            const [rolPermisos] = await db.query(`
                SELECT
                    p.id_rol_permiso,
                    p.id_rol,
                    r.nombre AS rol,
                    p.id_permiso,
                    pe.nombre AS permiso
                FROM roles_permisos rp
                JOIN roles r ON rp.id_rol = r.id_rol
                JOIN permisos pe ON rp.id_permiso = p.id_permiso
                WHERE rp.id_rol = ?
            `, [idrol]); //parametro

            res.json(rolPermisos);
        } catch (error) {
            console.error("Error En ObtenerPermisosDelRol:", error);
            res.status(500).json({ error: 'Error al obtener los permisos del rol' });
        }
    }


    // Obtener IUna Relacion Por ID
    async obtenerRolPermisosPorId(req, res) {
        const { id } = req.params;
        try {
            const [rolPermiso] = await db.query(`
                SELECT rp.id_rol_permiso, r.nombre AS rol, p.nombre AS permiso
                FROM roles_permisos rp
                JOIN roles r ON rp.id_rol = r.id_rol
                JOIN permisos p ON rp.id_permiso = p.id_permiso
                WHERE rp.id_rol_permiso = ?
            `, [id]);

            if (rolPermiso.length === 0) {
                return res.status(404).json({ error: 'Relación rol-permiso no encontrada' });
            }
            res.json(rolPermiso[0]);
        } catch (error) {
            res.status(500).json({ error: 'Error al obtener la relación rol-permiso' });
        }
    }

    //Asignar Un Permiso A Un Rol
    async agregarRolPermiso(req, res) {
        const { id_rol, permiso_id } = req.body;
        try {
            await db.query(
                'INSERT INTO rol_permisos (id_rol, permiso_id) VALUES (?, ?)',
                [id_rol, permiso_id]
            );
            res.status(201).json({ mensaje: 'Permiso asignado al rol exitosamente' });
        } catch (error) {
            res.status(500).json({ error: 'Error al asignar el permiso al rol' });
        }
    }

    // Actualizar Una Relacion (Cambiar El Permiso O El Rol Asociado)
    async actualizarRolPermiso(req, res) {
        const { id } = req.params;
        const { id_rol, permiso_id } = req.body;
        try {
            await db.query(
                'UPDATE rol_permisos SET id_rol = ?, permiso_id = ? WHERE id_rol_permiso = ?',
                [id_rol, permiso_id, id]
            );
            res.json({ mensaje: 'Relación rol-permiso actualizada exitosamente' });
        } catch (error) {
            res.status(500).json({ error: 'Error al actualizar la relación rol-permiso' });
        }
    }

    // Eliminar Una Relacion Rol-Permiso
    async eliminarRolPermiso(req, res) {
        const { id } = req.params;
        try {
            await db.query('DELETE FROM rol_permisos WHERE id_rol_permiso = ?', [id]);
            res.json({ mensaje: 'Relación rol-permiso eliminada exitosamente' });
        } catch (error) {
            res.status(500).json({ error: 'Error al eliminar la relación rol-permiso' });
        }
    }
}

module.exports = new RolPermisoController();