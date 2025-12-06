const db = require('../config/conexion_db');

class ProgramaController {
    // Obtener Todos Los Programas
    async obtenerProgramas(req, res) {
        try {
            const [programas] = await db.query(
                `SELECT 
                    p.id_programa, 
                    p.codigo_programa, 
                    p.nombre_programa, 
                    COUNT(f.id_ficha) AS total_fichas
                FROM programa_formacion p
                LEFT JOIN fichas f ON f.id_programa = p.id_programa
                GROUP BY p.id_programa`
            );

            res.json(programas);
        } catch (error) {
            console.error(error);
            res.status(500).json({ mensaje: 'Error al obtener programas' });
        }
    }

    async eliminarPrograma(req, res) {
        const connection = await db.getConnection();
        
        try {
            const { id } = req.params;

            console.log(`🔄 [1/10] Iniciando eliminación del programa ID: ${id}`);

            // 1. Verificar que exista el programa
            const [existe] = await connection.query(
                "SELECT id_programa, nombre_programa FROM programa_formacion WHERE id_programa = ?",
                [id]
            );

            if (existe.length === 0) {
                return res.status(404).json({ 
                    success: false, 
                    mensaje: "Programa no encontrado" 
                });
            }

            const programa = existe[0];
            console.log(`🔍 [2/10] Programa: ${programa.nombre_programa}`);

            // 2. Obtener todas las fichas relacionadas
            const [fichas] = await connection.query(
                "SELECT id_ficha, codigo_ficha FROM fichas WHERE id_programa = ?",
                [id]
            );

            const fichasAEliminar = fichas.map(f => f.id_ficha);
            console.log(`📊 [3/10] Fichas encontradas: ${fichas.length}`);

            // 3. Iniciar transacción
            await connection.beginTransaction();
            console.log("🔄 Transacción iniciada");

            try {
                // 4. Desactivar restricciones de clave foránea temporalmente
                await connection.query("SET FOREIGN_KEY_CHECKS = 0");
                console.log("🔓 Restricciones FOREIGN KEY desactivadas");

                // 5. Si hay fichas, eliminar todos sus datos relacionados
                if (fichasAEliminar.length > 0) {
                    console.log("🗑️ [4/10] Eliminando datos relacionados de las fichas...");
                    
                    // Construir placeholders para arrays
                    const placeholders = fichasAEliminar.map(() => '?').join(',');
                    
                    // 5a. Eliminar asignaciones de instructores a fichas
                    console.log("   📝 Eliminando instructor_ficha...");
                    await connection.query(
                        `DELETE FROM instructor_ficha WHERE id_ficha IN (${placeholders})`,
                        fichasAEliminar
                    );
                    
                    // 5b. Obtener trimestres de las fichas
                    console.log("   📝 Obteniendo trimestres de fichas...");
                    const [trimestresFichas] = await connection.query(
                        `SELECT id_trimestre FROM trimestre WHERE id_ficha IN (${placeholders})`,
                        fichasAEliminar
                    );
                    
                    if (trimestresFichas.length > 0) {
                        const idsTrimestres = trimestresFichas.map(t => t.id_trimestre);
                        const trimPlaceholders = idsTrimestres.map(() => '?').join(',');
                        
                        // Eliminar RAPs asignados a estos trimestres
                        console.log("   📝 Eliminando rap_trimestre...");
                        await connection.query(
                            `DELETE FROM rap_trimestre WHERE id_trimestre IN (${trimPlaceholders})`,
                            idsTrimestres
                        );
                        
                        // Eliminar trimestres de las fichas
                        console.log("   📝 Eliminando trimestres...");
                        await connection.query(
                            `DELETE FROM trimestre WHERE id_ficha IN (${placeholders})`,
                            fichasAEliminar
                        );
                    }
                    
                    // 5c. Eliminar planeaciones pedagógicas relacionadas
                    console.log("   📝 Eliminando planeacion_pedagogica...");
                    await connection.query(
                        `DELETE FROM planeacion_pedagogica WHERE id_ficha IN (${placeholders})`,
                        fichasAEliminar
                    );
                    
                    // 5d. Eliminar las fichas
                    console.log("   📝 Eliminando fichas...");
                    await connection.query(
                        "DELETE FROM fichas WHERE id_programa = ?",
                        [id]
                    );
                    
                    console.log(`✅ ${fichas.length} fichas eliminadas`);
                }

                // 6. Obtener competencias del programa
                console.log("🗑️ [5/10] Obteniendo competencias del programa...");
                const [competencias] = await connection.query(
                    "SELECT id_competencia FROM competencias WHERE id_programa = ?",
                    [id]
                );

                const competenciasIds = competencias.map(c => c.id_competencia);
                console.log(`🔍 Competencias encontradas: ${competenciasIds.length}`);

                // 7. Si hay competencias, eliminar datos relacionados
                if (competenciasIds.length > 0) {
                    const compPlaceholders = competenciasIds.map(() => '?').join(',');
                    
                    // 7a. Obtener RAPs de estas competencias
                    console.log("🗑️ [6/10] Obteniendo RAPs de las competencias...");
                    const [raps] = await connection.query(
                        `SELECT id_rap FROM raps WHERE id_competencia IN (${compPlaceholders})`,
                        competenciasIds
                    );
                    
                    const rapsIds = raps.map(r => r.id_rap);
                    console.log(`🔍 RAPs encontrados: ${rapsIds.length}`);
                    
                    if (rapsIds.length > 0) {
                        const rapPlaceholders = rapsIds.map(() => '?').join(',');
                        
                        // 7b. Primero eliminar actividades relacionadas con los RAPs
                        console.log("🗑️ [7/10] Eliminando actividades relacionadas con RAPs...");
                        await connection.query(
                            `DELETE FROM actividad_rap WHERE id_rap IN (${rapPlaceholders})`,
                            rapsIds
                        );
                        
                        // 7c. Eliminar saberes relacionados
                        console.log("🗑️ [8/10] Eliminando saberes de concepto...");
                        await connection.query(
                            `DELETE FROM conocimiento_saber WHERE id_rap IN (${rapPlaceholders})`,
                            rapsIds
                        );
                        
                        // 7d. Eliminar procesos relacionados
                        console.log("🗑️ [9/10] Eliminando saberes de proceso...");
                        await connection.query(
                            `DELETE FROM conocimiento_proceso WHERE id_rap IN (${rapPlaceholders})`,
                            rapsIds
                        );
                        
                        // 7e. Eliminar criterios de evaluación
                        console.log("🗑️ [10/10] Eliminando criterios de evaluación...");
                        await connection.query(
                            `DELETE FROM criterios_evaluacion WHERE id_rap IN (${rapPlaceholders})`,
                            rapsIds
                        );
                        
                        // 7f. Finalmente eliminar los RAPs
                        console.log("🗑️ Eliminando RAPs...");
                        await connection.query(
                            `DELETE FROM raps WHERE id_competencia IN (${compPlaceholders})`,
                            competenciasIds
                        );
                        
                        console.log(`✅ ${rapsIds.length} RAPs eliminados`);
                    }
                }

                // 8. Eliminar competencias del programa
                console.log("🗑️ Eliminando competencias del programa...");
                if (competenciasIds.length > 0) {
                    const compPlaceholders = competenciasIds.map(() => '?').join(',');
                    await connection.query(
                        `DELETE FROM competencias WHERE id_competencia IN (${compPlaceholders})`,
                        competenciasIds
                    );
                } else {
                    await connection.query(
                        "DELETE FROM competencias WHERE id_programa = ?",
                        [id]
                    );
                }

                // 9. Finalmente, eliminar el programa
                console.log("🗑️ Eliminando programa...");
                const [resultPrograma] = await connection.query(
                    "DELETE FROM programa_formacion WHERE id_programa = ?",
                    [id]
                );

                // 10. Reactivar restricciones y confirmar transacción
                await connection.query("SET FOREIGN_KEY_CHECKS = 1");
                await connection.commit();
                console.log("✅ Transacción confirmada y restricciones reactivadas");

                res.json({
                    success: true,
                    mensaje: "✅ Programa y todos sus datos relacionados eliminados correctamente",
                    programa: programa.nombre_programa,
                    fichasEliminadas: fichas.length,
                    competenciasEliminadas: competenciasIds.length,
                    rapsEliminados: competenciasIds.length > 0 ? 'Todos los RAPs de las competencias' : 0,
                    detallesFichas: fichas.map(f => f.codigo_ficha)
                });

            } catch (error) {
                // Rollback en caso de error y reactivar restricciones
                await connection.rollback();
                await connection.query("SET FOREIGN_KEY_CHECKS = 1");
                
                console.error("❌ Error en transacción, rollback realizado");
                console.error("❌ Código de error:", error.code);
                console.error("❌ Mensaje SQL:", error.sqlMessage);
                console.error("❌ Consulta SQL:", error.sql);
                throw error;
            }

        } catch (error) {
            console.error("❌ Error detallado al eliminar programa:");
            console.error("❌ Código:", error.code);
            console.error("❌ Mensaje:", error.message);
            console.error("❌ SQL Message:", error.sqlMessage);
            
            let mensajeError = "Error al eliminar programa";
            
            if (error.code === 'ER_BAD_FIELD_ERROR') {
                mensajeError = "Error en la estructura de la base de datos";
            } else if (error.code === 'ER_ROW_IS_REFERENCED_2' || error.code === 'ER_ROW_IS_REFERENCED') {
                mensajeError = "No se puede eliminar el programa porque tiene datos relacionados que deben eliminarse primero";
            }
            
            res.status(500).json({
                success: false,
                mensaje: mensajeError,
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        } finally {
            if (connection) {
                connection.release();
            }
        }
    }

    // Método para obtener programa por ID
    async obtenerProgramaPorId(req, res) {
        try {
            const { id } = req.params;
            
            const [programa] = await db.query(
                `SELECT 
                    p.id_programa, 
                    p.codigo_programa, 
                    p.nombre_programa,
                    COUNT(f.id_ficha) AS total_fichas
                FROM programa_formacion p
                LEFT JOIN fichas f ON f.id_programa = p.id_programa
                WHERE p.id_programa = ?
                GROUP BY p.id_programa`,
                [id]
            );

            if (programa.length === 0) {
                return res.status(404).json({ mensaje: 'Programa no encontrado' });
            }

            res.json(programa[0]);
        } catch (error) {
            console.error(error);
            res.status(500).json({ mensaje: 'Error al obtener programa' });
        }
    }

    // Método para agregar programa
    async agregarPrograma(req, res) {
        try {
            const { codigo_programa, nombre_programa } = req.body;

            if (!codigo_programa || !nombre_programa) {
                return res.status(400).json({ 
                    mensaje: 'Código y nombre del programa son requeridos' 
                });
            }

            const [result] = await db.query(
                "INSERT INTO programa_formacion (codigo_programa, nombre_programa) VALUES (?, ?)",
                [codigo_programa, nombre_programa]
            );

            res.status(201).json({
                mensaje: 'Programa creado exitosamente',
                id_programa: result.insertId,
                codigo_programa,
                nombre_programa
            });
        } catch (error) {
            console.error(error);
            
            if (error.code === 'ER_DUP_ENTRY') {
                return res.status(400).json({ 
                    mensaje: 'El código del programa ya existe' 
                });
            }
            
            res.status(500).json({ mensaje: 'Error al crear programa' });
        }
    }

    // Método para actualizar programa
    async actualizarPrograma(req, res) {
        try {
            const { id } = req.params;
            const { codigo_programa, nombre_programa } = req.body;

            const [existe] = await db.query(
                "SELECT id_programa FROM programa_formacion WHERE id_programa = ?",
                [id]
            );

            if (existe.length === 0) {
                return res.status(404).json({ mensaje: "Programa no encontrado" });
            }

            await db.query(
                "UPDATE programa_formacion SET codigo_programa = ?, nombre_programa = ? WHERE id_programa = ?",
                [codigo_programa, nombre_programa, id]
            );

            res.json({ 
                mensaje: "Programa actualizado correctamente",
                id_programa: id,
                codigo_programa,
                nombre_programa
            });
        } catch (error) {
            console.error(error);
            
            if (error.code === 'ER_DUP_ENTRY') {
                return res.status(400).json({ 
                    mensaje: 'El código del programa ya existe' 
                });
            }
            
            res.status(500).json({ mensaje: "Error al actualizar programa" });
        }
    }
}

module.exports = ProgramaController;