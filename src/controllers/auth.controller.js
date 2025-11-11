const db = require('../config/conexion_db');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

class AuthController {
  async login(req, res) {
    const { email, password } = req.body;

    try {
      // 🔹 Buscar instructor por correo
      const [instructores] = await db.query(
        `SELECT i.*, r.nombre AS rol
         FROM instructores i
         LEFT JOIN roles r ON i.id_rol = r.id_rol
         WHERE i.email = ?`,
        [email]
      );

      if (instructores.length === 0) {
        return res.status(401).json({ error: 'Instructor no encontrado' });
      }

      const instructor = instructores[0];

      // 🔹 Verificar contraseña
      const esValida = await bcrypt.compare(password, instructor.contrasena);
      if (!esValida) {
        return res.status(401).json({ error: 'Contraseña incorrecta' });
      }

      // 🔹 Obtener permisos del rol (si los tiene)
      const [permisos] = await db.query(
        `SELECT p.nombre AS permiso
         FROM roles_permisos rp
         JOIN permisos p ON rp.id_permiso = p.id_permiso
         WHERE rp.id_rol = ?`,
        [instructor.id_rol]
      );

      // 🔹 Generar token JWT
      const token = jwt.sign(
        { id: instructor.id_instructor, rol: instructor.rol },
        'secreto_super_seguro',
        { expiresIn: '2h' }
      );

      // 🔹 Respuesta al frontend
      res.json({
        mensaje: 'Inicio de sesión exitoso',
        token,
        instructor: {
          id: instructor.id_instructor,
          nombre: instructor.nombre,
          email: instructor.email,
          rol: instructor.rol || 'Sin rol',
          permisos: permisos.map(p => p.permiso)
        }
      });
    } catch (error) {
      console.error('Error en login:', error);
      res.status(500).json({ error: 'Error del servidor' });
    }
  }
}

module.exports = new AuthController();
