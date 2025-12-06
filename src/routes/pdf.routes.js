const express = require('express');
const router = express.Router();
const PdfController = require('../controllers/pdf.controller');
const upload = require('../middleware/upload');

const pdfController = new PdfController();

// POST /api/pdf/procesar
// Cuerpo: multipart/form-data con campo "archivo" y opcionalmente "tipo"
router.post('/procesar/programa', 
    upload.single('archivo'), 
    (req, res) => pdfController.procesarPdf(req, res)
);

router.post('/procesar/proyecto', 
    upload.single('archivo'), 
    (req, res) => pdfController.procesarProyecto(req, res)
);

module.exports = router;