const SabanaService = require('../services/sabana.service');
const db = require('../config/conexion_db');

/**
 * Controlador para gestionar el alistamiento de RAPs
 * Maneja las peticiones HTTP y delega la lógica de negocio al servicio
 */
class SabanaController {
  constructor() {
    this.sabanaService = new SabanaService();
  }

  /**
   * GET /raps/disponibles/:id_ficha
   * Lista RAPs del programa que aún no están asignados a ningún trimestre de esa ficha
   */
  async obtenerRapsDisponibles(req, res) {
    try {
      const { id_ficha } = req.params;

      if (!id_ficha || isNaN(parseInt(id_ficha))) {
        return res.status(400).json({
          ok: false,
          mensaje: 'ID de ficha inválido'
        });
      }

      const raps = await this.sabanaService.obtenerRapsDisponibles(parseInt(id_ficha));

      return res.json({
        success: true,
        mensaje: 'RAPs disponibles obtenidos exitosamente',
        data: raps
      });
    } catch (error) {
      console.error('Error en obtenerRapsDisponibles:', error);

      if (error.message === 'Ficha no encontrada' || error.message === 'La ficha no tiene un programa asociado') {
        return res.status(404).json({
          success: false,
          mensaje: error.message
        });
      }

      return res.status(500).json({
        success: false,
        mensaje: 'Error al obtener RAPs disponibles: ' + error.message
      });
    }
  }

  /**
   * GET /raps/asignados/:id_ficha/:id_trimestre
   * Lista RAPs asignados en un trimestre particular
   */
  async obtenerRapsAsignados(req, res) {
    try {
      const { id_ficha, id_trimestre } = req.params;

      if (!id_ficha || isNaN(parseInt(id_ficha))) {
        return res.status(400).json({
          ok: false,
          mensaje: 'ID de ficha inválido'
        });
      }

      if (!id_trimestre || isNaN(parseInt(id_trimestre))) {
        return res.status(400).json({
          ok: false,
          mensaje: 'ID de trimestre inválido'
        });
      }

      const raps = await this.sabanaService.obtenerRapsAsignados(
        parseInt(id_ficha),
        parseInt(id_trimestre)
      );

      return res.json({
        success: true,
        mensaje: 'RAPs asignados obtenidos exitosamente',
        data: raps
      });
    } catch (error) {
      console.error('Error en obtenerRapsAsignados:', error);

      if (error.message === 'El trimestre no pertenece a la ficha especificada') {
        return res.status(404).json({
          success: false,
          mensaje: error.message
        });
      }

      return res.status(500).json({
        success: false,
        mensaje: 'Error al obtener RAPs asignados: ' + error.message
      });
    }
  }

  /**
   * POST /api/sabana/assign
   * Asigna un RAP a un trimestre
   * Body: { id_rap, id_trimestre, id_ficha, move? (opcional) }
   */
  async asignarRap(req, res) {
    try {
      const { id_rap, id_trimestre, id_ficha, move } = req.body;

      // Validaciones...
      const idRap = parseInt(id_rap);
      const idTrimestre = parseInt(id_trimestre);
      const idFicha = parseInt(id_ficha);

      // Solo una llamada al procedure que maneja todo
      await this.sabanaService.asignarRapTrimestre(idRap, idTrimestre, idFicha, move);

      // Obtener sabana actualizada
      const sabana = await this.sabanaService.obtenerSabanaMatriz(idFicha);

      return res.status(200).json({
        success: true,
        mensaje: 'RAP asignado exitosamente al trimestre',
        sabana: sabana
      });

    } catch (error) {
      console.error('Error en asignarRap:', error);
      return res.status(500).json({
        success: false,
        mensaje: 'Error al asignar RAP: ' + error.message
      });
    }
  }

  /**
   * DELETE /api/sabana/unassign
   * Quita un RAP de un trimestre
   * Body: { id_rap, id_trimestre, id_ficha }
   */
  async quitarRap(req, res) {
    try {
      const { id_rap, id_trimestre, id_ficha } = req.body;

      // Validaciones de entrada
      if (!id_rap || isNaN(parseInt(id_rap))) {
        return res.status(400).json({
          success: false,
          mensaje: 'ID de RAP inválido'
        });
      }

      if (!id_trimestre || isNaN(parseInt(id_trimestre))) {
        return res.status(400).json({
          success: false,
          mensaje: 'ID de trimestre inválido'
        });
      }

      if (!id_ficha || isNaN(parseInt(id_ficha))) {
        return res.status(400).json({
          success: false,
          mensaje: 'ID de ficha inválido'
        });
      }

      const idRap = parseInt(id_rap);
      const idTrimestre = parseInt(id_trimestre);
      const idFicha = parseInt(id_ficha);

      // Validar que el trimestre pertenece a la ficha
      const trimestrePertenece = await this.sabanaService.validarTrimestrePerteneceFicha(
        idTrimestre,
        idFicha
      );

      if (!trimestrePertenece) {
        return res.status(400).json({
          success: false,
          mensaje: 'El trimestre no pertenece a esta ficha'
        });
      }

      // Quitar el RAP del trimestre (el procedimiento recalcula horas automáticamente)
      await this.sabanaService.quitarRapTrimestre(idRap, idTrimestre, idFicha);

      // Obtener sabana matriz actualizada
      const sabana = await this.sabanaService.obtenerSabanaMatriz(idFicha);

      return res.json({
        success: true,
        mensaje: 'RAP quitado exitosamente del trimestre',
        sabana: sabana
      });
    } catch (error) {
      console.error('Error en quitarRap:', error);

      if (error.message.includes('no existe') ||
        error.message.includes('no pertenece')) {
        return res.status(400).json({
          success: false,
          mensaje: error.message
        });
      }

      return res.status(500).json({
        success: false,
        mensaje: 'Error al quitar RAP: ' + error.message
      });
    }
  }

  /**
   * PATCH /api/sabana/update-hours
   * Actualiza las horas de un RAP-trimestre
   * Body: { id_rap_trimestre, horas_trimestre, id_ficha }
   */
  async actualizarHoras(req, res) {
    const connection = await db.getConnection();

    try {
      const { id_rap_trimestre, horas_trimestre, id_ficha } = req.body;

      // Validaciones de entrada
      if (!id_rap_trimestre || isNaN(parseInt(id_rap_trimestre))) {
        return res.status(400).json({
          success: false,
          mensaje: 'ID de rap_trimestre inválido'
        });
      }

      if (horas_trimestre === undefined || horas_trimestre === null || isNaN(parseFloat(horas_trimestre))) {
        return res.status(400).json({
          success: false,
          mensaje: 'horas_trimestre inválido'
        });
      }

      if (!id_ficha || isNaN(parseInt(id_ficha))) {
        return res.status(400).json({
          success: false,
          mensaje: 'ID de ficha inválido'
        });
      }

      const idRapTrimestre = parseInt(id_rap_trimestre);
      const horasTrimestre = parseFloat(horas_trimestre);
      const horasSemana = horasTrimestre / 11;
      const idFicha = parseInt(id_ficha);

      // Validar que el registro existe y pertenece a la ficha
      const [registros] = await connection.query(
        `SELECT id_rap_trimestre, id_ficha 
         FROM rap_trimestre 
         WHERE id_rap_trimestre = ?`,
        [idRapTrimestre]
      );

      if (registros.length === 0) {
        return res.status(404).json({
          success: false,
          mensaje: 'Registro rap_trimestre no encontrado'
        });
      }

      if (registros[0].id_ficha !== idFicha) {
        return res.status(400).json({
          success: false,
          mensaje: 'El registro no pertenece a esta ficha'
        });
      }

      // Actualizar horas
      await connection.query(
        `UPDATE rap_trimestre 
         SET horas_trimestre = ?, horas_semana = ?
         WHERE id_rap_trimestre = ?`,
        [horasTrimestre, horasSemana, idRapTrimestre]
      );

      // Obtener registro actualizado
      const [resultados] = await connection.query(
        `SELECT 
          rt.id_rap_trimestre,
          rt.id_rap,
          rt.id_trimestre,
          rt.id_ficha,
          rt.horas_trimestre,
          rt.horas_semana,
          rt.estado,
          rt.id_instructor
         FROM rap_trimestre rt
         WHERE rt.id_rap_trimestre = ?`,
        [idRapTrimestre]
      );

      return res.json({
        success: true,
        mensaje: 'Horas actualizadas exitosamente',
        data: resultados[0]
      });
    } catch (error) {
      console.error('Error en actualizarHoras:', error);

      return res.status(500).json({
        success: false,
        mensaje: 'Error al actualizar horas: ' + error.message
      });
    } finally {
      connection.release();
    }
  }

  /**
 * PATCH /api/sabana/assign-instructor
 * Asigna un instructor a una tarjeta RAP-trimestre
 * Body: { id_rap_trimestre, id_instructor }
 */
  async asignarInstructor(req, res) {
    try {
      const { id_rap_trimestre, id_instructor } = req.body;

      // Validaciones de entrada
      if (!id_rap_trimestre || isNaN(parseInt(id_rap_trimestre))) {
        return res.status(400).json({
          success: false,
          mensaje: 'ID de rap_trimestre inválido'
        });
      }

      if (!id_instructor || isNaN(parseInt(id_instructor))) {
        return res.status(400).json({
          success: false,
          mensaje: 'ID de instructor inválido'
        });
      }

      const idRapTrimestre = parseInt(id_rap_trimestre);
      const idInstructor = parseInt(id_instructor);

      // Asignar instructor
      const resultado = await this.sabanaService.asignarInstructor(
        idRapTrimestre,
        idInstructor
      );

      return res.json({
        success: true,
        mensaje: 'Instructor asignado exitosamente',
        data: resultado
      });
    } catch (error) {
      console.error('Error en asignarInstructor:', error);

      if (error.message.includes('no encontrado') ||
        error.message.includes('no está activo')) {
        return res.status(400).json({
          success: false,
          mensaje: error.message
        });
      }

      return res.status(500).json({
        success: false,
        mensaje: 'Error al asignar instructor: ' + error.message
      });
    }
  }

  /**
   * DELETE /api/sabana/unassign-instructor
   * Desasigna un instructor de una tarjeta RAP-trimestre
   * Body: { id_rap_trimestre }
   */
  async desasignarInstructor(req, res) {
    try {
      const { id_rap_trimestre } = req.body;

      if (!id_rap_trimestre || isNaN(parseInt(id_rap_trimestre))) {
        return res.status(400).json({
          success: false,
          mensaje: 'ID de rap_trimestre inválido'
        });
      }

      const idRapTrimestre = parseInt(id_rap_trimestre);

      // Desasignar instructor
      const resultado = await this.sabanaService.desasignarInstructor(idRapTrimestre);

      return res.json({
        success: true,
        mensaje: 'Instructor desasignado exitosamente',
        data: resultado
      });
    } catch (error) {
      console.error('Error en desasignarInstructor:', error);
      return res.status(500).json({
        success: false,
        mensaje: 'Error al desasignar instructor: ' + error.message
      });
    }
  }

  /**
   * GET /api/sabana/instructores/:id_ficha
   * Obtiene los instructores activos para una ficha
   */
  async obtenerInstructoresPorFicha(req, res) {
    try {
      const { id_ficha } = req.params;

      if (!id_ficha || isNaN(parseInt(id_ficha))) {
        return res.status(400).json({
          success: false,
          mensaje: 'ID de ficha inválido'
        });
      }

      const instructores = await this.sabanaService.obtenerInstructoresPorFicha(
        parseInt(id_ficha)
      );

      return res.json({
        success: true,
        mensaje: 'Instructores obtenidos exitosamente',
        data: instructores
      });
    } catch (error) {
      console.error('Error en obtenerInstructoresPorFicha:', error);
      return res.status(500).json({
        success: false,
        mensaje: 'Error al obtener instructores: ' + error.message
      });
    }
  }

  /**
   * GET /api/sabana/trimestres/:id_ficha
   * Obtiene los trimestres de una ficha
   */
  async obtenerTrimestres(req, res) {
    try {
      const { id_ficha } = req.params;

      if (!id_ficha || isNaN(parseInt(id_ficha))) {
        return res.status(400).json({
          success: false,
          mensaje: 'ID de ficha inválido'
        });
      }

      const trimestres = await this.sabanaService.obtenerTrimestresPorFicha(
        parseInt(id_ficha)
      );

      return res.json({
        success: true,
        mensaje: 'Trimestres obtenidos exitosamente',
        data: trimestres
      });
    } catch (error) {
      console.error('Error en obtenerTrimestres:', error);

      return res.status(500).json({
        success: false,
        mensaje: 'Error al obtener trimestres: ' + error.message
      });
    }
  }

  /**
   * GET /sabana/:id_ficha
   * Consulta la vista v_sabana_base filtrada por ficha
   */
  async obtenerSabanaBase(req, res) {
    try {
      const { id_ficha } = req.params;

      if (!id_ficha || isNaN(parseInt(id_ficha))) {
        return res.status(400).json({
          ok: false,
          mensaje: 'ID de ficha inválido'
        });
      }

      const datos = await this.sabanaService.obtenerSabanaBase(parseInt(id_ficha));

      return res.json({
        success: true,
        mensaje: 'Sabana base obtenida exitosamente',
        data: datos
      });
    } catch (error) {
      console.error('Error en obtenerSabanaBase:', error);

      if (error.message === 'Ficha no encontrada') {
        return res.status(404).json({
          success: false,
          mensaje: error.message
        });
      }

      return res.status(500).json({
        success: false,
        mensaje: 'Error al obtener sabana base: ' + error.message
      });
    }
  }

  /**
   * GET /sabana/matriz/:id_ficha
   * Consulta la vista v_sabana_matriz filtrada por ficha
   */
  async obtenerSabanaMatriz(req, res) {
    try {
      const { id_ficha } = req.params;

      if (!id_ficha || isNaN(parseInt(id_ficha))) {
        return res.status(400).json({
          ok: false,
          mensaje: 'ID de ficha inválido'
        });
      }

      const datos = await this.sabanaService.obtenerSabanaMatriz(parseInt(id_ficha));

      return res.json({
        success: true,
        mensaje: 'Sabana matriz obtenida exitosamente',
        data: datos
      });
    } catch (error) {
      console.error('Error en obtenerSabanaMatriz:', error);

      if (error.message === 'Ficha no encontrada') {
        return res.status(404).json({
          success: false,
          mensaje: error.message
        });
      }

      return res.status(500).json({
        success: false,
        mensaje: 'Error al obtener sabana matriz: ' + error.message
      });
    }
  }

  // 🔥 NUEVOS MÉTODOS PARA INFORMACIÓN COMPLETA DE RAPS

  /**
   * GET /api/raps/:id/saberes
   * Obtener saberes de concepto de un RAP
   */
  async obtenerSaberes(req, res) {
    try {
      const { id } = req.params;

      if (!id || isNaN(parseInt(id))) {
        return res.status(400).json({
          success: false,
          mensaje: 'ID de RAP inválido'
        });
      }

      const [saberes] = await db.execute(
        'SELECT * FROM conocimiento_saber WHERE id_rap = ?',
        [parseInt(id)]
      );

      res.json({
        success: true,
        data: saberes
      });

    } catch (error) {
      console.error('Error obteniendo saberes:', error);
      res.status(500).json({
        success: false,
        error: 'Error obteniendo saberes',
        message: error.message
      });
    }
  }

  /**
   * GET /api/raps/:id/procesos
   * Obtener saberes de proceso de un RAP
   */
  async obtenerProcesos(req, res) {
    try {
      const { id } = req.params;

      if (!id || isNaN(parseInt(id))) {
        return res.status(400).json({
          success: false,
          mensaje: 'ID de RAP inválido'
        });
      }

      const [procesos] = await db.execute(
        'SELECT * FROM conocimiento_proceso WHERE id_rap = ?',
        [parseInt(id)]
      );

      res.json({
        success: true,
        data: procesos
      });

    } catch (error) {
      console.error('Error obteniendo procesos:', error);
      res.status(500).json({
        success: false,
        error: 'Error obteniendo procesos',
        message: error.message
      });
    }
  }

  /**
   * GET /api/raps/:id/criterios
   * Obtener criterios de evaluación de un RAP
   */
  async obtenerCriterios(req, res) {
    try {
      const { id } = req.params;

      if (!id || isNaN(parseInt(id))) {
        return res.status(400).json({
          success: false,
          mensaje: 'ID de RAP inválido'
        });
      }

      const [criterios] = await db.execute(
        'SELECT * FROM criterios_evaluacion WHERE id_rap = ?',
        [parseInt(id)]
      );

      res.json({
        success: true,
        data: criterios
      });

    } catch (error) {
      console.error('Error obteniendo criterios:', error);
      res.status(500).json({
        success: false,
        error: 'Error obteniendo criterios',
        message: error.message
      });
    }
  }
}

module.exports = SabanaController;