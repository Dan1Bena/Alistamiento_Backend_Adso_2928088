const express = require('express');
const ProgramaController = require('../controllers/programas.controller');

const router = express.Router();
const programaController = new ProgramaController();

router.get('/', (req, res) => programaController.obtenerProgramas(req, res));
router.get('/:id', (req, res) => programaController.obtenerProgramaPorId(req, res)); // 🔥 Quitar ?.
router.post('/', (req, res) => programaController.agregarPrograma(req, res));       // 🔥 Quitar ?.
router.put('/:id', (req, res) => programaController.actualizarPrograma(req, res)); // 🔥 Quitar ?.
router.delete('/:id', (req, res) => programaController.eliminarPrograma(req, res));

module.exports = router;
