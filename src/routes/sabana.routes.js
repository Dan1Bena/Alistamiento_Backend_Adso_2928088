const express = require('express');
const SabanaController = require('../controllers/sabana.controller');

const router = express.Router();
const sabanaController = new SabanaController();

/**
 * Rutas para el módulo de alistamiento de RAPs (Sabana)
 * 
 * Endpoints disponibles:
 * - GET    /raps/disponibles/:id_ficha          - Listar RAPs disponibles
 * - GET    /raps/asignados/:id_ficha/:id_trimestre - Listar RAPs asignados
 * - POST   /raps/asignar                        - Asignar RAP a trimestre
 * - DELETE /raps/quitar                         - Quitar RAP de trimestre
 * - GET    /sabana/:id_ficha                    - Consultar sabana base
 * - GET    /sabana/matriz/:id_ficha              - Consultar sabana matriz
 */

// RAPs disponibles (no asignados a ningún trimestre de la ficha)
router.get('/raps/disponibles/:id_ficha', (req, res) => 
  sabanaController.obtenerRapsDisponibles(req, res)
);

// RAPs asignados a un trimestre específico
router.get('/raps/asignados/:id_ficha/:id_trimestre', (req, res) => 
  sabanaController.obtenerRapsAsignados(req, res)
);

// Asignar un RAP a un trimestre
router.post('/raps/asignar', (req, res) => 
  sabanaController.asignarRap(req, res)
);

// Quitar un RAP de un trimestre
router.delete('/raps/quitar', (req, res) => 
  sabanaController.quitarRap(req, res)
);

// Consultar vista sabana base
router.get('/sabana/:id_ficha', (req, res) => 
  sabanaController.obtenerSabanaBase(req, res)
);

// Consultar vista sabana matriz
router.get('/sabana/matriz/:id_ficha', (req, res) => 
  sabanaController.obtenerSabanaMatriz(req, res)
);

module.exports = router;

