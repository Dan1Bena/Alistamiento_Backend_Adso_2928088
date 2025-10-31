const express = require('express');
const router = express.Router();
const PdfController = require('../controllers/pdf.controller');
const upload = require('../middleware/upload');

const pdfController = new PdfController();

// POST /api/pdf/procesar
// Cuerpo: multipart/form-data con campo "archivo" y opcionalmente "tipo"
router.post('/procesar', 
    upload.single('archivo'), 
    (req, res) => pdfController.procesarPdf(req, res)
);

module.exports = router;