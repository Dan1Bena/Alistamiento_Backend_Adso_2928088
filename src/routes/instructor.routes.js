const express = require('express');
const InstructoresController= require('../controllers/instructores.controller');

const router = express.Router();
const instructoresController = new InstructoresController();

router.get('/', (req, res) => instructoresController.obtenerInstructores(req, res));
router.get('/:id', (req, res) => instructoresController.obtenerInstructorPorId(req, res));
router.get('/email/:email', instructoresController.obtenerInstructorPorEmail);
router.post('/', (req, res) => instructoresController.agregarInstructor(req, res));
router.put('/:id', (req, res) => instructoresController.actualizarInstructor(req, res));
router.delete('/:id', (req, res) => instructoresController.eliminarInstructor(req, res));

module.exports = router;
