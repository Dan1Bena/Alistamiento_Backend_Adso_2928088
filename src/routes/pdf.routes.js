// routes/pdf.routes.js
const express = require('express');
const router = express.Router();
const PdfController = require('../controllers/pdf.controller');
const upload = require('../middleware/upload');

const pdfController = new PdfController();

// Ruta para obtener programas
router.get('/programas', (req, res) => pdfController.obtenerProgramas(req, res));

// Ruta para programa de formación
router.post('/procesar/programa', 
    upload.single('file'),
    (req, res) => pdfController.procesarPdf(req, res)
);

// Ruta para proyecto formativo
router.post('/procesar/proyecto', 
    upload.single('file'),
    (req, res) => pdfController.procesarProyecto(req, res)
);

module.exports = router;