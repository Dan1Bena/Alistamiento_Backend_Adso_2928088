const db = require('../config/conexion_db');

class PermisosController {
  async obtenerPermisos(req, res) {
    try {
      const [permisos] = await db.query('SELECT * FROM permisos');
      res.json(permisos);
    } catch (error) {
      res.status(500).json({ error: 'Error al obtener permisos' });
    }
  }

  async obtenerPermisoPorId(req, res) {
    const { id } = req.params;
    try {
      const [permiso] = await db.query('SELECT * FROM permisos WHERE id_permiso = ?', [id]);
      if (permiso.length === 0) {
        return res.status(404).json({ error: 'Permiso no encontrado' });
      }
      res.json(permiso[0]);
    } catch (error) {
      res.status(500).json({ error: 'Error al obtener permiso' });
    }
  }

  async agregarPermiso(req, res) {
    const { nombre, descripcion } = req.body;
    try {
      await db.query('INSERT INTO permisos (nombre, descripcion) VALUES (?, ?)', [nombre, descripcion]);
      res.json({ mensaje: 'Permiso agregado correctamente' });
    } catch (error) {
      res.status(500).json({ error: 'Error al agregar permiso' });
    }
  }

  async actualizarPermiso(req, res) {
    const { id } = req.params;
    const { nombre, descripcion } = req.body;
    try {
      await db.query('UPDATE permisos SET nombre = ?, descripcion = ? WHERE id_permiso = ?', [nombre, descripcion, id]);
      res.json({ mensaje: 'Permiso actualizado correctamente' });
    } catch (error) {
      res.status(500).json({ error: 'Error al actualizar permiso' });
    }
  }

  async eliminarPermiso(req, res) {
    const { id } = req.params;
    try {
      await db.query('DELETE FROM permisos WHERE id_permiso = ?', [id]);
      res.json({ mensaje: 'Permiso eliminado correctamente' });
    } catch (error) {
      res.status(500).json({ error: 'Error al eliminar permiso' });
    }
  }
}

module.exports = PermisosController;
