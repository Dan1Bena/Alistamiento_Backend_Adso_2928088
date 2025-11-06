const db = require('../config/conexion_db');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

class AuthController {
    async login(req, res) {
        const { email, password } = req.body;

        try {
            //Buscar instructor Por Email
            const [instructores] = await db.query('SELECT * FROM instructores WHERE email = ?', [email]);

            if (instructores.length === 0) {
                return res.status(401).json({ error: 'instructor No Encontrado' });
            }

            const instructor = instructores[0];

            //Verificar Contraseña con bcrypt
            const esValida = await bcrypt.compare(password, instructor.contrasena);
            if (!esValida) {
                return res.status(401).json({ error: 'Contraseña Incorrecta' });
            }

            //Obtener Rol Y Permisos Del Usuario
            const [rolDatos] = await db.query(
                `SELECT r.nombre AS rol, p.nombre AS permiso
                FROM roles r
                JOIN roles_permisos rp ON r.id_rol = rp.id_rol
                JOIN permisos p ON rp.id_permiso = p.id_permiso
                WHERE r.id_rol = ?`,
                [instructor.id_rol]
            );

            //Generar JWT
            const token = jwt.sign(
                { id: instructor.id_instructor, rol: instructor.id_rol },
                'secreto_super_seguro',
                { expiresIn: '2h' }
            );

            res.json({
                mensaje: 'Inicio de Sesión Exitoso',
                token,
                instructor: {
                    id: instructor.id_instructor,
                    nombre: instructor.nombre,
                    email: instructor.email,
                    rol: rolDatos[0]?.rol || 'Sin rol',
                    permisos: rolDatos.map(p => p.permiso)
                }
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Error del Servidor' });
        }
    }
}

module.exports = new AuthController();