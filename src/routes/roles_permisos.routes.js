const express = require('express');
const RolesPermisoController = require('../controllers/roles_permisos.controller');

const router = express.Router();
const rolPermisoController = new RolPermisoController();

router.get('/', (req, res) => rolPermisoController.obtenerRolPermisos(req, res));
router.get('/rol/idrol', (req, res) => rolPermisoController.obtenerPermisosDeRol(req, res));
router.get('/:id', (req, res) => rolPermisoController.obtenerRolPermisoPorId(req, res));
router.post('/', (req, res) => rolPermisoController.agregarRolPermiso(req, res));
router.put('/:id', (req, res) => rolPermisoController.actualizarRolPermiso(req, res));
router.delete('/:id', (req, res) => rolPermisoController.eliminarRolPermiso(req, res));

module.exports = router;
