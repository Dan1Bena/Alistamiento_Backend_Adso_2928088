# API de Sabana - Tarjetas RAP Arrastrables (Trello-like)

## Descripción

Esta API permite gestionar la asignación de RAPs (Resultados de Aprendizaje) a trimestres de fichas de formación, implementando una funcionalidad similar a Trello donde las tarjetas (RAPs) pueden ser arrastradas entre diferentes trimestres.

## Base de Datos

### Requisitos Previos

Antes de usar la API, ejecutar el script SQL de actualización:

```sql
-- Ejecutar: src/db/update_sabana_procedures.sql
```

Este script asegura:
- Estructura correcta de la tabla `rap_trimestre` (PK, índice único `uk_rap_trimestre_ficha`)
- Columna `id_ficha` en `rap_trimestre`
- Columna `id_instructor` en `rap_trimestre` (opcional)
- Procedimientos almacenados actualizados con validaciones

### Procedimientos Almacenados

1. **`asignar_rap_trimestre(p_id_rap, p_id_trimestre, p_id_ficha)`**
   - Valida pertenencia RAP->programa->ficha
   - Valida pertenencia trimestre->ficha
   - Inserta/actualiza usando `ON DUPLICATE KEY UPDATE` con alias `newVals`
   - Calcula horas automáticamente

2. **`recalcular_horas_rap(p_id_rap, p_id_ficha)`**
   - Recalcula horas_trimestre y horas_semana para todas las asignaciones del RAP en la ficha

3. **`quitar_rap_trimestre(p_id_rap, p_id_trimestre, p_id_ficha)`**
   - Elimina la asignación y recalcula horas automáticamente

## Endpoints

### Base URL
```
/api
```

---

## 1. Obtener Trimestres por Ficha

Obtiene la lista de trimestres disponibles para una ficha.

**Endpoint:** `GET /api/sabana/trimestres/:id_ficha`

**Parámetros URL:**
- `id_ficha` (number, requerido): ID de la ficha

**Respuesta Exitosa (200):**
```json
{
  "success": true,
  "mensaje": "Trimestres obtenidos exitosamente",
  "data": [
    {
      "id_trimestre": 1,
      "no_trimestre": 1,
      "fase": "ANÁLISIS"
    },
    {
      "id_trimestre": 2,
      "no_trimestre": 2,
      "fase": "ANÁLISIS"
    }
  ]
}
```

**Errores:**
- `400`: ID de ficha inválido
- `500`: Error del servidor

---

## 2. Asignar RAP a Trimestre

Asigna un RAP a un trimestre específico. Si `move=true`, elimina asignaciones previas del mismo RAP en otros trimestres de la misma ficha.

**Endpoint:** `POST /api/sabana/assign`

**Body (JSON):**
```json
{
  "id_rap": 1,
  "id_trimestre": 2,
  "id_ficha": 1,
  "move": false  // opcional, default: false
}
```

**Campos:**
- `id_rap` (number, requerido): ID del RAP
- `id_trimestre` (number, requerido): ID del trimestre
- `id_ficha` (number, requerido): ID de la ficha
- `move` (boolean, opcional): Si es `true`, elimina asignaciones previas del RAP en otros trimestres

**Respuesta Exitosa (200):**
```json
{
  "success": true,
  "mensaje": "RAP asignado exitosamente al trimestre",
  "sabana": [
    {
      "id_ficha": 1,
      "id_competencia": 1,
      "codigo_norma": "220501032",
      "nombre_competencia": "Desarrollar software...",
      "id_rap": 1,
      "codigo_rap": "01",
      "descripcion_rap": "Analizar requerimientos...",
      "t1_htrim": 0,
      "t1_hsem": 0,
      "t2_htrim": 50,
      "t2_hsem": 4.55,
      "total_horas": 50
    }
  ]
}
```

**Errores:**
- `400`: Parámetros inválidos, RAP no pertenece al programa, trimestre no pertenece a ficha
- `500`: Error del servidor

**Notas:**
- Ejecuta en transacción: asignación + recálculo de horas
- Retorna la sabana matriz completa actualizada

---

## 3. Desasignar RAP de Trimestre

Quita un RAP de un trimestre específico.

**Endpoint:** `DELETE /api/sabana/unassign`

**Body (JSON):**
```json
{
  "id_rap": 1,
  "id_trimestre": 2,
  "id_ficha": 1
}
```

**Campos:**
- `id_rap` (number, requerido): ID del RAP
- `id_trimestre` (number, requerido): ID del trimestre
- `id_ficha` (number, requerido): ID de la ficha

**Respuesta Exitosa (200):**
```json
{
  "success": true,
  "mensaje": "RAP quitado exitosamente del trimestre",
  "sabana": [
    // Array completo de sabana matriz actualizada
  ]
}
```

**Errores:**
- `400`: Parámetros inválidos, asignación no existe, trimestre no pertenece a ficha
- `500`: Error del servidor

**Notas:**
- El procedimiento almacenado recalcula horas automáticamente
- Retorna la sabana matriz completa actualizada

---

## 4. Actualizar Horas de RAP-Trimestre

Actualiza manualmente las horas de un RAP asignado a un trimestre.

**Endpoint:** `PATCH /api/sabana/update-hours`

**Body (JSON):**
```json
{
  "id_rap_trimestre": 5,
  "horas_trimestre": 60,
  "id_ficha": 1
}
```

**Campos:**
- `id_rap_trimestre` (number, requerido): ID del registro en `rap_trimestre`
- `horas_trimestre` (number, requerido): Nuevas horas por trimestre
- `id_ficha` (number, requerido): ID de la ficha (para validación)

**Respuesta Exitosa (200):**
```json
{
  "success": true,
  "mensaje": "Horas actualizadas exitosamente",
  "data": {
    "id_rap_trimestre": 5,
    "id_rap": 1,
    "id_trimestre": 2,
    "id_ficha": 1,
    "horas_trimestre": 60,
    "horas_semana": 5.45,
    "estado": "Planeado",
    "id_instructor": null
  }
}
```

**Errores:**
- `400`: Parámetros inválidos, registro no encontrado, registro no pertenece a ficha
- `404`: Registro no encontrado
- `500`: Error del servidor

**Notas:**
- `horas_semana` se calcula automáticamente: `horas_trimestre / 11`

---

## 5. Asignar Instructor a Tarjeta

Asigna un instructor a una tarjeta RAP-trimestre específica.

**Endpoint:** `PATCH /api/sabana/assign-instructor`

**Body (JSON):**
```json
{
  "id_rap_trimestre": 5,
  "id_instructor": 3
}
```

**Campos:**
- `id_rap_trimestre` (number, requerido): ID del registro en `rap_trimestre`
- `id_instructor` (number, requerido): ID del instructor

**Respuesta Exitosa (200):**
```json
{
  "success": true,
  "mensaje": "Instructor asignado exitosamente",
  "data": {
    "id_rap_trimestre": 5,
    "id_rap": 1,
    "id_trimestre": 2,
    "id_ficha": 1,
    "horas_trimestre": 50,
    "horas_semana": 4.55,
    "estado": "Planeado",
    "id_instructor": 3,
    "nombre_instructor": "Juan Pérez"
  }
}
```

**Errores:**
- `400`: Parámetros inválidos, instructor no encontrado, instructor no está activo
- `500`: Error del servidor

**Notas:**
- Valida que el instructor existe y está en estado "Activo"
- El estado se mantiene o se establece en "Planeado" si es null

---

## 6. Obtener RAPs Disponibles

Obtiene los RAPs del programa que aún no están asignados a ningún trimestre de la ficha.

**Endpoint:** `GET /api/raps/disponibles/:id_ficha`

**Parámetros URL:**
- `id_ficha` (number, requerido): ID de la ficha

**Respuesta Exitosa (200):**
```json
{
  "success": true,
  "mensaje": "RAPs disponibles obtenidos exitosamente",
  "data": [
    {
      "id_rap": 5,
      "codigo": "03",
      "denominacion": "Implementar funcionalidades...",
      "duracion": 100,
      "id_competencia": 1,
      "nombre_competencia": "Desarrollar software...",
      "codigo_norma": "220501032"
    }
  ]
}
```

---

## 7. Obtener RAPs Asignados

Obtiene los RAPs asignados a un trimestre específico.

**Endpoint:** `GET /api/raps/asignados/:id_ficha/:id_trimestre`

**Parámetros URL:**
- `id_ficha` (number, requerido): ID de la ficha
- `id_trimestre` (number, requerido): ID del trimestre

**Respuesta Exitosa (200):**
```json
{
  "success": true,
  "mensaje": "RAPs asignados obtenidos exitosamente",
  "data": [
    {
      "id_rap": 1,
      "codigo": "01",
      "denominacion": "Analizar requerimientos...",
      "duracion": 100,
      "horas_trimestre": 50,
      "horas_semana": 4.55,
      "estado": "Planeado",
      "id_competencia": 1,
      "nombre_competencia": "Desarrollar software...",
      "codigo_norma": "220501032",
      "no_trimestre": 2,
      "fase": "ANÁLISIS"
    }
  ]
}
```

---

## 8. Obtener Sabana Base

Obtiene la vista `v_sabana_base` filtrada por ficha.

**Endpoint:** `GET /api/sabana/:id_ficha`

**Parámetros URL:**
- `id_ficha` (number, requerido): ID de la ficha

**Respuesta Exitosa (200):**
```json
{
  "success": true,
  "mensaje": "Sabana base obtenida exitosamente",
  "data": [
    {
      "id_ficha": 1,
      "id_competencia": 1,
      "codigo_norma": "220501032",
      "nombre_competencia": "Desarrollar software...",
      "duracion_maxima": 200,
      "id_rap": 1,
      "codigo_rap": "01",
      "descripcion_rap": "Analizar requerimientos...",
      "duracion_rap": 100,
      "no_trimestre": 2,
      "nombre_fase": "ANÁLISIS",
      "horas_trimestre": 50,
      "horas_semana": 4.55,
      "estado": "Planeado"
    }
  ]
}
```

---

## 9. Obtener Sabana Matriz

Obtiene la vista `v_sabana_matriz` filtrada por ficha (formato matriz con columnas por trimestre).

**Endpoint:** `GET /api/sabana/matriz/:id_ficha`

**Parámetros URL:**
- `id_ficha` (number, requerido): ID de la ficha

**Respuesta Exitosa (200):**
```json
{
  "success": true,
  "mensaje": "Sabana matriz obtenida exitosamente",
  "data": [
    {
      "id_ficha": 1,
      "id_competencia": 1,
      "codigo_norma": "220501032",
      "nombre_competencia": "Desarrollar software...",
      "duracion_maxima": 200,
      "id_rap": 1,
      "codigo_rap": "01",
      "descripcion_rap": "Analizar requerimientos...",
      "duracion_rap": 100,
      "t1_htrim": 0,
      "t1_hsem": 0,
      "t2_htrim": 50,
      "t2_hsem": 4.55,
      "t3_htrim": 0,
      "t3_hsem": 0,
      "t4_htrim": 0,
      "t4_hsem": 0,
      "t5_htrim": 0,
      "t5_hsem": 0,
      "t6_htrim": 0,
      "t6_hsem": 0,
      "t7_htrim": 0,
      "t7_hsem": 0,
      "total_horas": 50
    }
  ]
}
```

---

## Formato de Respuestas

Todas las respuestas siguen un formato consistente:

**Éxito:**
```json
{
  "success": true,
  "mensaje": "Mensaje descriptivo",
  "data": {} // o [] según el endpoint
}
```

**Error:**
```json
{
  "success": false,
  "mensaje": "Descripción del error"
}
```

## Validaciones y Seguridad

1. **Pertenencia RAP-Programa-Ficha**: Todas las operaciones validan que el RAP pertenece al programa de la ficha
2. **Pertenencia Trimestre-Ficha**: Se valida que el trimestre pertenece a la ficha
3. **Transacciones**: Las operaciones que involucran múltiples statements usan transacciones
4. **Instructor Activo**: Al asignar instructor, se valida que esté en estado "Activo"
5. **Manejo de Errores**: Errores claros con códigos HTTP apropiados (400 para validación, 500 para errores del servidor)

## Consideraciones UX

- Los endpoints de asignación/desasignación retornan la sabana matriz completa para refrescar el frontend
- El parámetro `move=true` permite mover un RAP de un trimestre a otro eliminando la asignación previa
- El endpoint `/sabana/trimestres/:id_ficha` facilita la carga inicial de trimestres en el frontend

## Endpoints Legacy

Para mantener compatibilidad, se mantienen los endpoints anteriores:
- `POST /api/raps/asignar` → redirige a `POST /api/sabana/assign`
- `DELETE /api/raps/quitar` → redirige a `DELETE /api/sabana/unassign`

## Ejemplos de Uso

### Flujo Completo: Asignar RAP y Actualizar Horas

```javascript
// 1. Obtener trimestres disponibles
GET /api/sabana/trimestres/1

// 2. Asignar RAP al trimestre 2
POST /api/sabana/assign
{
  "id_rap": 1,
  "id_trimestre": 2,
  "id_ficha": 1
}

// 3. Actualizar horas manualmente si es necesario
PATCH /api/sabana/update-hours
{
  "id_rap_trimestre": 5,
  "horas_trimestre": 60,
  "id_ficha": 1
}

// 4. Asignar instructor
PATCH /api/sabana/assign-instructor
{
  "id_rap_trimestre": 5,
  "id_instructor": 3
}
```

### Mover RAP de un Trimestre a Otro

```javascript
POST /api/sabana/assign
{
  "id_rap": 1,
  "id_trimestre": 3,  // Nuevo trimestre
  "id_ficha": 1,
  "move": true  // Elimina asignación previa en trimestre 2
}
```

