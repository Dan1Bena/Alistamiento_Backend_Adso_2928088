const db = require('../config/conexion_db');

/**
 * Servicio para gestionar el alistamiento de RAPs (Resultados de Aprendizaje)
 * Maneja la lógica de negocio para asignación, consulta y gestión de RAPs por ficha y trimestre
 */
class SabanaService {
  /**
   * Obtiene los RAPs disponibles (no asignados a ningún trimestre) de una ficha
   * @param {number} id_ficha - ID de la ficha
   * @returns {Promise<Array>} Lista de RAPs disponibles
   */
  async obtenerRapsDisponibles(id_ficha) {
    try {
      // Primero obtener el programa de la ficha
      const [fichas] = await db.query(
        `SELECT id_programa FROM fichas WHERE id_ficha = ?`,
        [id_ficha]
      );

      if (fichas.length === 0) {
        throw new Error('Ficha no encontrada');
      }

      const id_programa = fichas[0].id_programa;

      if (!id_programa) {
        throw new Error('La ficha no tiene un programa asociado');
      }

      // Obtener todos los trimestres de la ficha
      const [trimestres] = await db.query(
        `SELECT t.id_trimestre 
         FROM trimestre t
         JOIN planeacion_pedagogica pp ON t.id_planeacion = pp.id_planeacion
         WHERE pp.id_ficha = ?`,
        [id_ficha]
      );

      const ids_trimestres = trimestres.map(t => t.id_trimestre);

      // Si no hay trimestres, retornar todos los RAPs del programa
      if (ids_trimestres.length === 0) {
        const [raps] = await db.query(
          `SELECT 
            r.id_rap,
            r.codigo,
            r.denominacion,
            r.duracion,
            c.id_competencia,
            c.nombre_competencia,
            c.codigo_norma
           FROM raps r
           JOIN competencias c ON r.id_competencia = c.id_competencia
           WHERE c.id_programa = ?
           ORDER BY r.codigo`,
          [id_programa]
        );
        return raps;
      }

      // Obtener RAPs del programa que NO están asignados a ningún trimestre de esta ficha
      // Construir placeholders para el array de trimestres
      const placeholders = ids_trimestres.map(() => '?').join(',');
      const [raps] = await db.query(
        `SELECT 
          r.id_rap,
          r.codigo,
          r.denominacion,
          r.duracion,
          c.id_competencia,
          c.nombre_competencia,
          c.codigo_norma
         FROM raps r
         JOIN competencias c ON r.id_competencia = c.id_competencia
         WHERE c.id_programa = ?
           AND r.id_rap NOT IN (
             SELECT DISTINCT rt.id_rap 
             FROM rap_trimestre rt 
             WHERE rt.id_trimestre IN (${placeholders})
           )
         ORDER BY r.codigo`,
        [id_programa, ...ids_trimestres]
      );

      return raps;
    } catch (error) {
      console.error('Error en obtenerRapsDisponibles:', error);
      throw error;
    }
  }

  /**
   * Obtiene los RAPs asignados a un trimestre específico de una ficha
   * @param {number} id_ficha - ID de la ficha
   * @param {number} id_trimestre - ID del trimestre
   * @returns {Promise<Array>} Lista de RAPs asignados al trimestre
   */
  async obtenerRapsAsignados(id_ficha, id_trimestre) {
    try {
      // Validar que el trimestre pertenece a la ficha
      const [trimestres] = await db.query(
        `SELECT t.id_trimestre 
         FROM trimestre t
         JOIN planeacion_pedagogica pp ON t.id_planeacion = pp.id_planeacion
         WHERE pp.id_ficha = ? AND t.id_trimestre = ?`,
        [id_ficha, id_trimestre]
      );

      if (trimestres.length === 0) {
        throw new Error('El trimestre no pertenece a la ficha especificada');
      }

      // Obtener RAPs asignados al trimestre
      const [raps] = await db.query(
        `SELECT 
          r.id_rap,
          r.codigo,
          r.denominacion,
          r.duracion,
          rt.horas_trimestre,
          rt.horas_semana,
          rt.estado,
          c.id_competencia,
          c.nombre_competencia,
          c.codigo_norma,
          t.no_trimestre,
          t.fase
         FROM rap_trimestre rt
         JOIN raps r ON rt.id_rap = r.id_rap
         JOIN competencias c ON r.id_competencia = c.id_competencia
         JOIN trimestre t ON rt.id_trimestre = t.id_trimestre
         WHERE rt.id_trimestre = ?
         ORDER BY r.codigo`,
        [id_trimestre]
      );

      return raps;
    } catch (error) {
      console.error('Error en obtenerRapsAsignados:', error);
      throw error;
    }
  }

  /**
   * Valida que un RAP pertenece al programa de una ficha
   * @param {number} id_rap - ID del RAP
   * @param {number} id_ficha - ID de la ficha
   * @returns {Promise<boolean>} true si el RAP pertenece al programa
   */
  async validarRapPertenecePrograma(id_rap, id_ficha) {
    try {
      const [resultados] = await db.query(
        `SELECT COUNT(*) as count
         FROM raps r
         JOIN competencias c ON r.id_competencia = c.id_competencia
         JOIN fichas f ON c.id_programa = f.id_programa
         WHERE r.id_rap = ? AND f.id_ficha = ?`,
        [id_rap, id_ficha]
      );

      return resultados[0].count > 0;
    } catch (error) {
      console.error('Error en validarRapPertenecePrograma:', error);
      throw error;
    }
  }

  /**
   * Valida que un RAP no esté ya asignado al trimestre
   * @param {number} id_rap - ID del RAP
   * @param {number} id_trimestre - ID del trimestre
   * @returns {Promise<boolean>} true si ya está asignado
   */
  async validarRapYaAsignado(id_rap, id_trimestre) {
    try {
      const [resultados] = await db.query(
        `SELECT COUNT(*) as count
         FROM rap_trimestre
         WHERE id_rap = ? AND id_trimestre = ?`,
        [id_rap, id_trimestre]
      );

      return resultados[0].count > 0;
    } catch (error) {
      console.error('Error en validarRapYaAsignado:', error);
      throw error;
    }
  }

  /**
   * Asigna un RAP a un trimestre usando el procedimiento almacenado
   * @param {number} id_rap - ID del RAP
   * @param {number} id_trimestre - ID del trimestre
   * @returns {Promise<Object>} Resultado de la asignación
   */
  async asignarRapTrimestre(id_rap, id_trimestre) {
    try {
      // Llamar al procedimiento almacenado
      await db.query('CALL asignar_rap_trimestre(?, ?)', [id_rap, id_trimestre]);

      // Obtener los datos actualizados del RAP asignado
      const [resultados] = await db.query(
        `SELECT 
          r.id_rap,
          r.codigo,
          r.denominacion,
          rt.horas_trimestre,
          rt.horas_semana,
          rt.estado
         FROM rap_trimestre rt
         JOIN raps r ON rt.id_rap = r.id_rap
         WHERE rt.id_rap = ? AND rt.id_trimestre = ?`,
        [id_rap, id_trimestre]
      );

      return resultados[0] || null;
    } catch (error) {
      console.error('Error en asignarRapTrimestre:', error);
      throw error;
    }
  }

  /**
   * Quita un RAP de un trimestre usando el procedimiento almacenado
   * @param {number} id_rap - ID del RAP
   * @param {number} id_trimestre - ID del trimestre
   * @returns {Promise<boolean>} true si se quitó exitosamente
   */
  async quitarRapTrimestre(id_rap, id_trimestre) {
    try {
      // Llamar al procedimiento almacenado que quita el RAP
      await db.query('CALL quitar_rap_trimestre(?, ?)', [id_rap, id_trimestre]);

      // Recalcular horas del RAP después de quitarlo
      await db.query('CALL recalcular_horas_rap(?)', [id_rap]);

      return true;
    } catch (error) {
      console.error('Error en quitarRapTrimestre:', error);
      throw error;
    }
  }

  /**
   * Obtiene la vista v_sabana_base filtrada por ficha
   * @param {number} id_ficha - ID de la ficha
   * @returns {Promise<Array>} Datos de la sabana base
   */
  async obtenerSabanaBase(id_ficha) {
    try {
      // Validar que la ficha existe
      const [fichas] = await db.query(
        `SELECT id_ficha FROM fichas WHERE id_ficha = ?`,
        [id_ficha]
      );

      if (fichas.length === 0) {
        throw new Error('Ficha no encontrada');
      }

      // La vista v_sabana_base ya incluye id_ficha, filtrar directamente
      const [resultados] = await db.query(
        `SELECT * FROM v_sabana_base 
         WHERE id_ficha = ?
         ORDER BY id_competencia, CAST(codigo_rap AS UNSIGNED), no_trimestre`,
        [id_ficha]
      );

      return resultados;
    } catch (error) {
      console.error('Error en obtenerSabanaBase:', error);
      throw error;
    }
  }

  /**
   * Obtiene la vista v_sabana_matriz filtrada por ficha
   * @param {number} id_ficha - ID de la ficha
   * @returns {Promise<Array>} Datos de la sabana matriz
   */
  async obtenerSabanaMatriz(id_ficha) {
    try {
      // Validar que la ficha existe
      const [fichas] = await db.query(
        `SELECT id_ficha FROM fichas WHERE id_ficha = ?`,
        [id_ficha]
      );

      if (fichas.length === 0) {
        throw new Error('Ficha no encontrada');
      }

      // La vista v_sabana_matriz ya incluye id_ficha, filtrar directamente
      const [resultados] = await db.query(
        `SELECT * FROM v_sabana_matriz 
         WHERE id_ficha = ?
         ORDER BY id_competencia, CAST(codigo_rap AS UNSIGNED)`,
        [id_ficha]
      );

      return resultados;
    } catch (error) {
      console.error('Error en obtenerSabanaMatriz:', error);
      throw error;
    }
  }
}

module.exports = SabanaService;

