const db = require('../config/conexion_db');

class PermisosController {
    async obtenerPermisos(req, res) {
        try {
            const [permisos] = await db.query('SELECT * FROM permisos');
            res.json(permisos);
        } catch (error) {
            res.status(500).json({ error: 'Error Al Obtener Permisos' });
        }
    }

    async obtenerPermisosPorId(req, res) {
        const { id } = req.params;
        try {
            const [permisos] = await db.query('SELECT * FROM permisos WHERE id_permiso = ?', [id]);
            if (permisos.length === 0) {
                return res.status(404).json({ error: 'Permiso No Encontrado' });
            }
            res.json(permisos[0]);
        } catch (error) {
            res.status(500).json({ error: 'Error Al Obtener Permiso' });
        }
    }

    async agregarPermiso(req, res) {
        const { nombre, descripcion } = req.body;
        try {
            await db.query('INSERT INTO permisos (nombre, descripcion) VALUES (?, ?)', [nombre, descripcion]);
            res.json({ mensaje: 'Permiso Agregado Exitosamente' });
        } catch (error) {
            res.status(500).json({ error: 'Error Al Agregar Permiso' });
        }
    }

    async actualizarPermiso(req, res) {
        const { id } = req.params;
        const { nombre, descripcion } = req.body;
        try {
            await db.query('UPDATE permisos SET nombre = ?, descripcion = ? WHERE id_permiso = ?', [nombre, descripcion, id]);
            res.json({ mensaje: 'Permiso Actualizado Exitosamente' });
        } catch (error) {
            res.status(500).json({ error: 'Error Al Actualizar Permiso' });
        }
    }

    async eliminarPermiso(req, res) {
        const { id } = req.params;
        try {
            await db.query('DELETE FROM permisos WHERE id_permiso = ?', [id]);
            res.json({ mensaje: 'Permiso Eliminado Exitosamente' });
        } catch (error) {
            res.status(500).json({ error: 'Error Al Eliminar Permiso' });
        }
    }
}

module.exports = new PermisosController();