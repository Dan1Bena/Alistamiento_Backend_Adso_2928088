const SabanaService = require('../services/sabana.service');

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
        ok: true,
        mensaje: 'RAPs disponibles obtenidos exitosamente',
        data: raps
      });
    } catch (error) {
      console.error('Error en obtenerRapsDisponibles:', error);
      
      if (error.message === 'Ficha no encontrada' || error.message === 'La ficha no tiene un programa asociado') {
        return res.status(404).json({
          ok: false,
          mensaje: error.message
        });
      }

      return res.status(500).json({
        ok: false,
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
        ok: true,
        mensaje: 'RAPs asignados obtenidos exitosamente',
        data: raps
      });
    } catch (error) {
      console.error('Error en obtenerRapsAsignados:', error);
      
      if (error.message === 'El trimestre no pertenece a la ficha especificada') {
        return res.status(404).json({
          ok: false,
          mensaje: error.message
        });
      }

      return res.status(500).json({
        ok: false,
        mensaje: 'Error al obtener RAPs asignados: ' + error.message
      });
    }
  }

  /**
   * POST /raps/asignar
   * Asigna un RAP a un trimestre
   * Body: { id_rap, id_trimestre, id_ficha (para validación) }
   */
  async asignarRap(req, res) {
    try {
      const { id_rap, id_trimestre, id_ficha } = req.body;

      // Validaciones de entrada
      if (!id_rap || isNaN(parseInt(id_rap))) {
        return res.status(400).json({
          ok: false,
          mensaje: 'ID de RAP inválido'
        });
      }

      if (!id_trimestre || isNaN(parseInt(id_trimestre))) {
        return res.status(400).json({
          ok: false,
          mensaje: 'ID de trimestre inválido'
        });
      }

      if (!id_ficha || isNaN(parseInt(id_ficha))) {
        return res.status(400).json({
          ok: false,
          mensaje: 'ID de ficha inválido'
        });
      }

      // Validar que el RAP pertenece al programa de la ficha
      const pertenecePrograma = await this.sabanaService.validarRapPertenecePrograma(
        parseInt(id_rap),
        parseInt(id_ficha)
      );

      if (!pertenecePrograma) {
        return res.status(400).json({
          ok: false,
          mensaje: 'El RAP no pertenece al programa de esta ficha'
        });
      }

      // Validar que el RAP no esté ya asignado al trimestre
      const yaAsignado = await this.sabanaService.validarRapYaAsignado(
        parseInt(id_rap),
        parseInt(id_trimestre)
      );

      if (yaAsignado) {
        return res.status(400).json({
          ok: false,
          mensaje: 'El RAP ya está asignado a este trimestre'
        });
      }

      // Asignar el RAP al trimestre
      const resultado = await this.sabanaService.asignarRapTrimestre(
        parseInt(id_rap),
        parseInt(id_trimestre)
      );

      return res.json({
        ok: true,
        mensaje: 'RAP asignado exitosamente al trimestre',
        data: resultado
      });
    } catch (error) {
      console.error('Error en asignarRap:', error);
      
      return res.status(500).json({
        ok: false,
        mensaje: 'Error al asignar RAP: ' + error.message
      });
    }
  }

  /**
   * DELETE /raps/quitar
   * Quita un RAP de un trimestre
   * Body: { id_rap, id_trimestre }
   */
  async quitarRap(req, res) {
    try {
      const { id_rap, id_trimestre } = req.body;

      // Validaciones de entrada
      if (!id_rap || isNaN(parseInt(id_rap))) {
        return res.status(400).json({
          ok: false,
          mensaje: 'ID de RAP inválido'
        });
      }

      if (!id_trimestre || isNaN(parseInt(id_trimestre))) {
        return res.status(400).json({
          ok: false,
          mensaje: 'ID de trimestre inválido'
        });
      }

      // Validar que el RAP esté asignado al trimestre
      const yaAsignado = await this.sabanaService.validarRapYaAsignado(
        parseInt(id_rap),
        parseInt(id_trimestre)
      );

      if (!yaAsignado) {
        return res.status(404).json({
          ok: false,
          mensaje: 'El RAP no está asignado a este trimestre'
        });
      }

      // Quitar el RAP del trimestre (esto también recalcula las horas automáticamente)
      await this.sabanaService.quitarRapTrimestre(
        parseInt(id_rap),
        parseInt(id_trimestre)
      );

      return res.json({
        ok: true,
        mensaje: 'RAP quitado exitosamente del trimestre'
      });
    } catch (error) {
      console.error('Error en quitarRap:', error);
      
      return res.status(500).json({
        ok: false,
        mensaje: 'Error al quitar RAP: ' + error.message
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
        ok: true,
        mensaje: 'Sabana base obtenida exitosamente',
        data: datos
      });
    } catch (error) {
      console.error('Error en obtenerSabanaBase:', error);
      
      if (error.message === 'Ficha no encontrada') {
        return res.status(404).json({
          ok: false,
          mensaje: error.message
        });
      }

      return res.status(500).json({
        ok: false,
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
        ok: true,
        mensaje: 'Sabana matriz obtenida exitosamente',
        data: datos
      });
    } catch (error) {
      console.error('Error en obtenerSabanaMatriz:', error);
      
      if (error.message === 'Ficha no encontrada') {
        return res.status(404).json({
          ok: false,
          mensaje: error.message
        });
      }

      return res.status(500).json({
        ok: false,
        mensaje: 'Error al obtener sabana matriz: ' + error.message
      });
    }
  }
}

module.exports = SabanaController;

