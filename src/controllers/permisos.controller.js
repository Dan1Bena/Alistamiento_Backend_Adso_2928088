const db = require('../config/conexion_db');

class PermisosController {
  // Obtener todos los permisos
  async obtenerPermisos(req, res) {
    try {
      const [permisos] = await db.query('SELECT * FROM permisos');
      res.json(permisos);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error al obtener permisos' });
    }
  }

  // Obtener un permiso por ID
  async obtenerPermisoPorId(req, res) {
    const { id } = req.params;
    try {
      const [permiso] = await db.query('SELECT * FROM permisos WHERE id_permiso = ?', [id]);
      if (permiso.length === 0) {
        return res.status(404).json({ error: 'Permiso no encontrado' });
      }
      res.json(permiso[0]);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error al obtener permiso' });
    }
  }

  // Agregar un nuevo permiso
  async agregarPermiso(req, res) {
    const { nombre } = req.body;
    if (!nombre) {
      return res.status(400).json({ error: 'El nombre del permiso es obligatorio' });
    }

    try {
      await db.query('INSERT INTO permisos (nombre) VALUES (?)', [nombre]);
      res.json({ mensaje: 'Permiso agregado correctamente' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error al agregar permiso' });
    }
  }

  // Actualizar un permiso existente
  async actualizarPermiso(req, res) {
    const { id } = req.params;
    const { nombre } = req.body;
    if (!nombre) {
      return res.status(400).json({ error: 'El nombre del permiso es obligatorio' });
    }

    try {
      const [result] = await db.query('UPDATE permisos SET nombre = ? WHERE id_permiso = ?', [nombre, id]);
      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'Permiso no encontrado' });
      }
      res.json({ mensaje: 'Permiso actualizado correctamente' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error al actualizar permiso' });
    }
  }

  // Eliminar un permiso
  async eliminarPermiso(req, res) {
    const { id } = req.params;
    try {
      const [result] = await db.query('DELETE FROM permisos WHERE id_permiso = ?', [id]);
      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'Permiso no encontrado' });
      }
      res.json({ mensaje: 'Permiso eliminado correctamente' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error al eliminar permiso' });
    }
  }
}

module.exports = PermisosController;
