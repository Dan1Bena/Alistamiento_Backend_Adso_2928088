const db = require('../config/conexion_db');

class RolesPermisoController {
  // Obtener todas las relaciones rol-permiso
  async obtenerRolesPermisos(req, res) {
    try {
      const [rolesPermisos] = await db.query(`
        SELECT 
          rp.id_roles_permiso, 
          rp.id_rol, 
          r.nombre AS rol, 
          p.id_permiso, 
          p.nombre AS permiso
        FROM roles_permiso rp
        JOIN roles r ON rp.id_rol = r.id_rol
        JOIN permisos p ON rp.id_permiso = p.id_permiso
      `);
      res.json(rolesPermisos);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error al obtener roles-permisos' });
    }
  }

  // Obtener permisos de un rol específico
  async obtenerPermisosDeRol(req, res) {
    const { idrol } = req.params;
    try {
      const [rolesPermisos] = await db.query(`
        SELECT 
          rp.id_roles_permiso, 
          rp.id_rol, 
          r.nombre AS rol, 
          p.id_permiso, 
          p.nombre AS permiso
        FROM roles_permiso rp
        JOIN roles r ON rp.id_rol = r.id_rol
        JOIN permisos p ON rp.id_permiso = p.id_permiso
        WHERE rp.id_rol = ?
      `, [idrol]);
      res.json(rolesPermisos);
    } catch (error) {
      console.error("Error en obtenerPermisosDeRol:", error);
      res.status(500).json({ error: 'Error al obtener permisos del rol' });
    }
  }

  // Obtener una relación específica por ID
  async obtenerRolPermisoPorId(req, res) {
    const { id } = req.params;
    try {
      const [rolPermiso] = await db.query(`
        SELECT 
          rp.id_roles_permiso, 
          r.nombre AS rol, 
          p.nombre AS permiso
        FROM roles_permiso rp
        JOIN roles r ON rp.id_rol = r.id_rol
        JOIN permisos p ON rp.id_permiso = p.id_permiso
        WHERE rp.id_roles_permiso = ?
      `, [id]);

      if (rolPermiso.length === 0) {
        return res.status(404).json({ error: 'Relación rol-permiso no encontrada' });
      }
      res.json(rolPermiso[0]);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error al obtener relación rol-permiso' });
    }
  }

  // Asignar un permiso a un rol
  async agregarRolPermiso(req, res) {
    const { id_rol, id_permiso } = req.body;

    if (!id_rol || !id_permiso) {
      return res.status(400).json({ error: 'id_rol e id_permiso son obligatorios' });
    }

    try {
      await db.query(`
        INSERT INTO roles_permiso (id_rol, id_permiso) VALUES (?, ?)
      `, [id_rol, id_permiso]);
      res.json({ mensaje: 'Permiso asignado al rol correctamente' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error al asignar permiso al rol' });
    }
  }

  // Actualizar relación rol-permiso
  async actualizarRolPermiso(req, res) {
    const { id } = req.params;
    const { id_rol, id_permiso } = req.body;

    if (!id_rol || !id_permiso) {
      return res.status(400).json({ error: 'id_rol e id_permiso son obligatorios' });
    }

    try {
      const [result] = await db.query(`
        UPDATE roles_permiso SET id_rol = ?, id_permiso = ? WHERE id_roles_permiso = ?
      `, [id_rol, id_permiso, id]);

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'Relación rol-permiso no encontrada' });
      }

      res.json({ mensaje: 'Relación rol-permiso actualizada correctamente' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error al actualizar relación rol-permiso' });
    }
  }

  // Eliminar relación rol-permiso
  async eliminarRolPermiso(req, res) {
    const { id } = req.params;
    try {
      const [result] = await db.query('DELETE FROM roles_permiso WHERE id_roles_permiso = ?', [id]);
      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'Relación rol-permiso no encontrada' });
      }
      res.json({ mensaje: 'Relación rol-permiso eliminada correctamente' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error al eliminar relación rol-permiso' });
    }
  }
}

module.exports = RolesPermisoController;
