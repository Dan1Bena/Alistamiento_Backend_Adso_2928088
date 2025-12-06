// routes/planeaciones.routes.js - VERSIÓN COMPLETA
const express = require('express');
const router = express.Router();
const db = require('../config/conexion_db');

// POST /api/planeaciones - Crear nueva planeación pedagógica
router.post('/', async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    const {
      id_ficha,
      trimestre,
      raps,
      info_ficha,
      fecha_creacion,
      instructor
    } = req.body;

    console.log('📥 Recibiendo planeación:', { 
      id_ficha, 
      trimestre, 
      raps_count: raps.length,
      instructor: instructor?.nombre 
    });

    // Validaciones básicas
    if (!id_ficha || !trimestre || !raps || raps.length === 0) {
      return res.status(400).json({
        success: false,
        mensaje: 'Datos incompletos: se requiere ficha, trimestre y al menos un RAP'
      });
    }

    await connection.beginTransaction();

    // 1. Insertar en planeacion_pedagogica
    const [resultPlaneacion] = await connection.execute(
      `INSERT INTO planeacion_pedagogica 
       (id_ficha, observaciones, fecha_creacion) 
       VALUES (?, ?, ?)`,
      [
        id_ficha,
        `Planeación Trimestre ${trimestre} - Ficha ${id_ficha} - ${new Date().toLocaleDateString()}`,
        new Date(fecha_creacion)
      ]
    );

    const idPlaneacion = resultPlaneacion.insertId;
    console.log(`✅ Planeación creada con ID: ${idPlaneacion}`);

    // 2. Insertar cada RAP en detalle_planeacion_pedagogica
    let rapsGuardados = 0;
    
    for (const rap of raps) {
      console.log(`📝 Guardando RAP ${rap.id_rap} en planeación...`);
      
      const [resultDetalle] = await connection.execute(
        `INSERT INTO detalle_planeacion_pedagogica 
         (id_planeacion, id_rap, codigo_rap, nombre_rap, competencia, horas_trimestre,
          actividades_aprendizaje, duracion_directa, duracion_independiente, 
          descripcion_evidencia, estrategias_didacticas, ambientes_aprendizaje,
          materiales_formacion, observaciones, saberes_conceptos, saberes_proceso, criterios_evaluacion) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          idPlaneacion,
          rap.id_rap,
          rap.codigo_rap,
          rap.nombre_rap,
          rap.competencia,
          rap.horas_trimestre,
          rap.actividades_aprendizaje || '',
          rap.duracion_directa || 0,
          rap.duracion_independiente || 0,
          rap.descripcion_evidencia || '',
          rap.estrategias_didacticas || '',
          rap.ambientes_aprendizaje || '',
          rap.materiales_formacion || '',
          rap.observaciones || '',
          rap.saberes_conceptos || '',
          rap.saberes_proceso || '',
          rap.criterios_evaluacion || ''
        ]
      );
      
      rapsGuardados++;
      console.log(`✅ RAP ${rap.codigo_rap} guardado en detalle ID: ${resultDetalle.insertId}`);
    }

    await connection.commit();

    res.json({
      success: true,
      mensaje: `Planeación pedagógica guardada exitosamente con ${rapsGuardados} RAPs`,
      data: {
        id_planeacion: idPlaneacion,
        total_raps: rapsGuardados,
        trimestre: trimestre,
        ficha: id_ficha
      }
    });

  } catch (error) {
    await connection.rollback();
    console.error('💥 Error guardando planeación:', error);
    
    res.status(500).json({
      success: false,
      mensaje: 'Error interno del servidor al guardar planeación',
      error: error.message
    });
  } finally {
    connection.release();
  }
});

// GET /api/planeaciones/ficha/:id_ficha - Obtener planeaciones por ficha
router.get('/ficha/:id_ficha', async (req, res) => {
  try {
    const { id_ficha } = req.params;

    const [planeaciones] = await db.execute(
      `SELECT pp.*, COUNT(dpp.id_detalle) as total_raps
       FROM planeacion_pedagogica pp
       LEFT JOIN detalle_planeacion_pedagogica dpp ON pp.id_planeacion = dpp.id_planeacion
       WHERE pp.id_ficha = ?
       GROUP BY pp.id_planeacion
       ORDER BY pp.fecha_creacion DESC`,
      [id_ficha]
    );

    res.json({
      success: true,
      data: planeaciones
    });

  } catch (error) {
    console.error('Error obteniendo planeaciones:', error);
    res.status(500).json({
      success: false,
      mensaje: 'Error obteniendo planeaciones'
    });
  }

  // DELETE /api/planeaciones/:id - Eliminar planeación y sus detalles
router.delete('/:id', async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    const { id } = req.params;
    console.log(`🗑️ Solicitando eliminar planeación ID: ${id}`);

    await connection.beginTransaction();

    // 1. Primero eliminar los detalles de la planeación
    const [resultDetalles] = await connection.execute(
      'DELETE FROM detalle_planeacion_pedagogica WHERE id_planeacion = ?',
      [id]
    );
    console.log(`✅ Eliminados ${resultDetalles.affectedRows} detalles de planeación`);

    // 2. Luego eliminar la planeación principal
    const [resultPlaneacion] = await connection.execute(
      'DELETE FROM planeacion_pedagogica WHERE id_planeacion = ?',
      [id]
    );

    if (resultPlaneacion.affectedRows === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        mensaje: 'Planeación no encontrada'
      });
    }

    await connection.commit();
    console.log(`✅ Planeación ${id} eliminada exitosamente`);

    res.json({
      success: true,
      mensaje: 'Planeación eliminada exitosamente',
      data: {
        id_planeacion: parseInt(id),
        detalles_eliminados: resultDetalles.affectedRows
      }
    });

  } catch (error) {
    await connection.rollback();
    console.error('💥 Error eliminando planeación:', error);
    
    res.status(500).json({
      success: false,
      mensaje: 'Error interno del servidor al eliminar planeación',
      error: error.message
    });
  } finally {
    connection.release();
  }
});
});

module.exports = router;