const express = require('express');
const FichasController = require('../controllers/fichas.controller');

const router = express.Router();
const fichasController = new FichasController();

router.get('/:id_programa', (req, res) => fichasController.obtenerFichasPorProgramas(req, res));
router.post('/', (req, res) => fichasController.agregarFichas(req, res));


module.exports = router;