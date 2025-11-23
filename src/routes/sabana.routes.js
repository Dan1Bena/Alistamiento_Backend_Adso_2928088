const express = require('express');
const SabanaController = require('../controllers/sabana.controller');

const router = express.Router();
const sabanaController = new SabanaController();

/**
 * Rutas para el módulo de alistamiento de RAPs (Sabana)
 * Funcionalidad de tarjetas RAP arrastrables por trimestres (Trello-like)
 * 
 * Endpoints disponibles:
 * 
 * CONSULTAS:
 * - GET    /sabana/trimestres/:id_ficha         - Obtener trimestres de una ficha
 * - GET    /raps/disponibles/:id_ficha          - Listar RAPs disponibles
 * - GET    /raps/asignados/:id_ficha/:id_trimestre - Listar RAPs asignados
 * - GET    /sabana/:id_ficha                    - Consultar sabana base
 * - GET    /sabana/matriz/:id_ficha             - Consultar sabana matriz
 * 
 * OPERACIONES:
 * - POST   /sabana/assign                       - Asignar RAP a trimestre
 * - DELETE /sabana/unassign                     - Quitar RAP de trimestre
 * - PATCH  /sabana/update-hours                 - Actualizar horas de RAP-trimestre
 * - PATCH  /sabana/assign-instructor             - Asignar instructor a tarjeta
 */

// ============================================
// CONSULTAS
// ============================================

// Obtener trimestres de una ficha
router.get('/sabana/trimestres/:id_ficha', (req, res) => 
  sabanaController.obtenerTrimestres(req, res)
);

// RAPs disponibles (no asignados a ningún trimestre de la ficha)
router.get('/raps/disponibles/:id_ficha', (req, res) => 
  sabanaController.obtenerRapsDisponibles(req, res)
);

// RAPs asignados a un trimestre específico
router.get('/raps/asignados/:id_ficha/:id_trimestre', (req, res) => 
  sabanaController.obtenerRapsAsignados(req, res)
);

// Consultar vista sabana base
router.get('/sabana/:id_ficha', (req, res) => 
  sabanaController.obtenerSabanaBase(req, res)
);

// Consultar vista sabana matriz
router.get('/sabana/matriz/:id_ficha', (req, res) => 
  sabanaController.obtenerSabanaMatriz(req, res)
);

// ============================================
// OPERACIONES (Trello-like)
// ============================================

// Asignar un RAP a un trimestre (nuevo endpoint)
router.post('/sabana/assign', (req, res) => 
  sabanaController.asignarRap(req, res)
);

// Quitar un RAP de un trimestre (nuevo endpoint)
router.delete('/sabana/unassign', (req, res) => 
  sabanaController.quitarRap(req, res)
);

// Actualizar horas de un RAP-trimestre
router.patch('/sabana/update-hours', (req, res) => 
  sabanaController.actualizarHoras(req, res)
);

// Asignar instructor a una tarjeta RAP-trimestre
router.patch('/sabana/assign-instructor', (req, res) => 
  sabanaController.asignarInstructor(req, res)
);

// ============================================
// ENDPOINTS LEGACY (mantener compatibilidad)
// ============================================

// Asignar un RAP a un trimestre (legacy)
router.post('/raps/asignar', (req, res) => 
  sabanaController.asignarRap(req, res)
);

// Quitar un RAP de un trimestre (legacy)
router.delete('/raps/quitar', (req, res) => 
  sabanaController.quitarRap(req, res)
);

module.exports = router;

