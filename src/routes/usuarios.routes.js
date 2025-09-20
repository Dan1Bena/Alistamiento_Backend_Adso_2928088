const express = require('express');
const UsuariosController = require('../controllers/usuarios.controller');

const router = express.Router();
const usuariosController = new UsuariosController();

router.get('/', (req, res) => usuariosController.obtenerUsuarios(req, res));
router.get('/:id', (req, res) => usuariosController.obtenerUsuarioPorId(req, res));
router.post('/', (req, res) => usuariosController.agregarUsuario(req, res));
router.put('/:id', (req, res) => usuariosController.actualizarUsuario(req, res));
router.delete('/:id', (req, res) => usuariosController.eliminarUsuario(req, res));  

module.exports = router;
