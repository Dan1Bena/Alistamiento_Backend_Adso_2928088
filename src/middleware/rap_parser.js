class RapParser {
    /**
     * Normaliza texto para comparación (sin acentos, mayúsculas)
     */
    static normalizar(texto) {
        if (!texto) return '';
        return texto
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '') // Quitar acentos
            .toUpperCase()
            .replace(/\n/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
    }

    /**
     * Extrae los items de una sección (líneas que empiezan con *)
     */
    static extraerBloque(texto) {
        if (!texto) return '';

        const items = texto
            .split('\n')
            .map(l => l.trim())
            .filter(l => l.startsWith('*'))
            .map(l => l.replace(/^\*\s*/, '').trim());

        if (items.length === 0) return '';

        return items.join('\n');   // si quieres bullets usa join(' • ')
    }
    /**
     * Detecta si el texto tiene estructura con títulos de sección
     */
    static tieneTitulosSecciones(textoCompleto) {
        if (!textoCompleto) return false;

        // Buscar patrón: TEXTO EN MAYÚSCULAS LARGO + ":"
        const patronTitulo = /\n[A-ZÑÁÉÍÓÚ][A-ZÑÁÉÍÓÚ\s]{20,}:/;
        return patronTitulo.test(textoCompleto);
    }

    /**
     * Parsea conocimientos CON títulos de sección (ej: Construcción Software)
     */
    static parsearConTitulos(textoCompleto, listaRaps) {
        const resultado = {};

        // Normalizar RAPs para búsqueda
        const rapsNormalizados = listaRaps.map(rap => ({
            original: rap,
            normalizado: this.normalizar(rap),
            clave: this.normalizar(rap.replace(/^\d+\s+/, '').substring(0, 40))
        }));

        // Dividir el texto en secciones
        const secciones = textoCompleto.split(/\n(?=[A-ZÑÁÉÍÓÚ][A-ZÑÁÉÍÓÚ\s]{15,}:)/);

        for (const seccion of secciones) {
            if (!seccion.trim()) continue;

            const lineas = seccion.split('\n');
            const titulo = lineas[0].trim().replace(/:$/, '');
            const tituloNorm = this.normalizar(titulo);

            // Buscar a qué RAP pertenece
            const rapEncontrado = rapsNormalizados.find(rap =>
                tituloNorm.includes(rap.clave) || rap.clave.includes(tituloNorm)
            );

            if (rapEncontrado) {
                const bloque = this.extraerBloque(seccion);
                if (bloque.length > 0) {
                    resultado[rapEncontrado.original] = bloque;
                }
            }
        }

        return resultado;
    }

    /**
     * Parsea conocimientos SIN títulos (ej: Inglés)
     * Distribuye los items equitativamente entre los RAPs
     */
    static parsearSinTitulos(textoCompleto, listaRaps) {
        const resultado = {};

        const texto = this.extraerBloque(textoCompleto);
        if (!texto) return resultado;

        // dividir equitativamente en líneas pero devolver bloques
        const lineas = texto.split('\n');
        const total = lineas.length;
        const porRap = Math.ceil(total / listaRaps.length);

        for (let i = 0; i < listaRaps.length; i++) {
            const ini = i * porRap;
            const fin = Math.min(ini + porRap, total);
            const subset = lineas.slice(ini, fin);

            resultado[listaRaps[i]] = subset.join('\n');
        }

        return resultado;
    }

    /**
     * Divide el texto de conocimientos/criterios en bloques por RAP
     * AUTO-DETECTA el formato y usa el parser apropiado
     * 
     * @param {string} textoCompleto - Texto con todos los conocimientos
     * @param {Array<string>} listaRaps - Array de denominaciones de RAPs
     * @returns {Object} { "denominacion_rap": ["item1", "item2", ...] }
     */
    static parsearPorRap(textoCompleto, listaRaps) {
        if (!textoCompleto || !listaRaps || listaRaps.length === 0) {
            return {};
        }

        // 🔍 AUTO-DETECTAR formato
        if (this.tieneTitulosSecciones(textoCompleto)) {
            console.log('  📋 Formato CON títulos detectado');
            return this.parsearConTitulos(textoCompleto, listaRaps);
        } else {
            console.log('  📋 Formato SIN títulos detectado (distribución equitativa)');
            return this.parsearSinTitulos(textoCompleto, listaRaps);
        }
    }

    /**
     * Procesa una competencia completa y retorna RAPs estructurados
     * 
     * @param {Object} competencia - Objeto competencia del extractor Python
     * @returns {Array} Array de RAPs con sus conocimientos/criterios
     */
    static procesarCompetencia(competencia) {
        const raps = competencia.resultados_aprendizaje || [];

        if (raps.length === 0) {
            console.warn(`⚠️  Competencia sin RAPs`);
            return [];
        }

        console.log(`\n📚 Procesando competencia: ${competencia.competencia}`);
        console.log(`   RAPs: ${raps.length}`);

        // Parsear cada tipo de conocimiento/criterio
        const conocimientosProcesoPorRap = this.parsearPorRap(
            competencia.conocimientos_proceso,
            raps
        );

        const conocimientosSaberPorRap = this.parsearPorRap(
            competencia.conocimientos_saber,
            raps
        );

        const criteriosPorRap = this.parsearPorRap(
            competencia.criterios_evaluacion,
            raps
        );

        // Construir array de RAPs estructurados
        return raps.map((rap, index) => {
            // Limpiar saltos de línea en el RAP
            const rapLimpio = rap.replace(/\n/g, ' ').trim();

            // Extraer código del RAP
            const match = rapLimpio.match(/^(\d{1,2})\s+(.+)/);
            const codigo = match ? match[1].padStart(2, '0') : String(index + 1).padStart(2, '0');
            const denominacion = match ? match[2].trim() : rapLimpio;

            return {
                codigo,
                denominacion,
                conocimientos_proceso: conocimientosProcesoPorRap[rap] || "",
                conocimientos_saber: conocimientosSaberPorRap[rap] || "",
                criterios_evaluacion: criteriosPorRap[rap] || ""
            };
        });
    }
}

module.exports = RapParser;