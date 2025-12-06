// routes/sabana.routes.js
const express = require('express');
const SabanaController = require('../controllers/sabana.controller');

const router = express.Router();
const sabanaController = new SabanaController();

/**
 * Rutas para el módulo de alistamiento de RAPs (Sabana)
 */

// ============================================
// CONSULTAS
// ============================================

router.get('/sabana/trimestres/:id_ficha', (req, res) =>
  sabanaController.obtenerTrimestres(req, res)
);

router.get('/raps/disponibles/:id_ficha', (req, res) =>
  sabanaController.obtenerRapsDisponibles(req, res)
);

router.get('/raps/asignados/:id_ficha/:id_trimestre', (req, res) =>
  sabanaController.obtenerRapsAsignados(req, res)
);

router.get('/sabana/:id_ficha', (req, res) =>
  sabanaController.obtenerSabanaBase(req, res)
);

router.get('/sabana/matriz/:id_ficha', (req, res) =>
  sabanaController.obtenerSabanaMatriz(req, res)
);

// ============================================
// OPERACIONES PRINCIPALES
// ============================================

router.post('/sabana/assign', (req, res) =>
  sabanaController.asignarRap(req, res)
);

router.delete('/sabana/unassign', (req, res) =>
  sabanaController.quitarRap(req, res)
);

router.patch('/sabana/update-hours', (req, res) =>
  sabanaController.actualizarHoras(req, res)
);

// ============================================
// GESTIÓN DE INSTRUCTORES
// ============================================

router.patch('/sabana/assign-instructor', (req, res) =>
  sabanaController.asignarInstructor(req, res)
);

router.delete('/sabana/unassign-instructor', (req, res) =>
  sabanaController.desasignarInstructor(req, res)
);

router.get('/sabana/instructores/:id_ficha', (req, res) =>
  sabanaController.obtenerInstructoresPorFicha(req, res)
);

// ============================================
// ENDPOINTS LEGACY (mantener compatibilidad)
// ============================================

router.post('/raps/asignar', (req, res) =>
  sabanaController.asignarRap(req, res)
);

router.delete('/raps/quitar', (req, res) =>
  sabanaController.quitarRap(req, res)
);

// ============================================
// INFORMACIÓN COMPLETA DE RAPS
// ============================================

router.get('/raps/:id/saberes', (req, res) =>
  sabanaController.obtenerSaberes(req, res)
);

router.get('/raps/:id/procesos', (req, res) =>
  sabanaController.obtenerProcesos(req, res)
);

router.get('/raps/:id/criterios', (req, res) =>
  sabanaController.obtenerCriterios(req, res)
);

module.exports = router;