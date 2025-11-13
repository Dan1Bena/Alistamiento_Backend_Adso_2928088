const express = require('express');
const ProgramasController = require('../controllers/programas.controller');

const router = express.Router();
const programasController = new ProgramasController();

router.get('/', (req, res) => programasController.obtenerProgramas(req, res));

module.exports = router;