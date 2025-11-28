const express = require('express');
const FichasController = require('../controllers/fichas.controller');

const router = express.Router();
const fichasController = new FichasController();

router.get("/instructor/:id_instructor", fichasController.obtenerFichasInstructor);
router.get('/todas', (req, res) => fichasController.obtenerTodasLasFichas(req, res));
router.get('/', (req, res) => fichasController.obtenerTodasLasFichas(req, res));
router.get('/:id_programa', (req, res) => fichasController.obtenerFichasPorProgramas(req, res));
router.post('/', (req, res) => fichasController.agregarFichas(req, res));
router.delete('/:id', (req, res) => fichasController.eliminarFicha(req, res));
router.put("/:id", (req, res) => fichasController.actualizarFicha(req, res));

module.exports = router;