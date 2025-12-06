-- Script completo para MySQL Workbench
-- Crea la base de datos Alistamiento_DB y todas las tablas y relaciones según el modelo entregado.
-- Motor: InnoDB, Codificación: utf8mb4

CREATE DATABASE alistamiento_db;
USE alistamiento_db;

CREATE TABLE permisos (
    id_permiso INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL
    );

    CREATE TABLE roles (
    id_rol INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL
    );

    -- Insertar roles iniciales
    INSERT INTO roles (nombre) VALUES ('Administrador');
    INSERT INTO roles (nombre) VALUES ('Instructor');
    INSERT INTO roles (nombre) VALUES ('Gestor');

    CREATE TABLE roles_permisos (
    id_roles_permiso INT AUTO_INCREMENT PRIMARY KEY,
    id_permiso INT NOT NULL,
    id_rol INT NOT NULL,
    FOREIGN KEY (id_permiso) REFERENCES permisos (id_permiso) ON DELETE RESTRICT ON UPDATE CASCADE,
    FOREIGN KEY (id_rol) REFERENCES roles (id_rol) ON DELETE RESTRICT ON UPDATE CASCADE
    );

    CREATE TABLE programa_formacion (
    id_programa INT AUTO_INCREMENT PRIMARY KEY,
    codigo_programa VARCHAR(20),
    nombre_programa TEXT NOT NULL,
    vigencia TEXT,
    tipo_programa VARCHAR(50),
    version_programa VARCHAR(10),
    horas_totales INT,
    horas_etapa_lectiva INT,
    horas_etapa_productiva INT
    );

    CREATE TABLE fichas (
    id_ficha INT AUTO_INCREMENT PRIMARY KEY,
    id_programa INT, -- FK a Programa_formacion
    codigo_ficha VARCHAR(20),
    modalidad VARCHAR(20),
    jornada ENUM("Diurna","Nocturna"),
    ambiente VARCHAR(10),
    fecha_inicio DATE,
    fecha_final DATE,
    cantidad_trimestre INT,
    FOREIGN KEY (id_programa) REFERENCES programa_formacion (id_programa) ON DELETE SET NULL ON UPDATE CASCADE
    );

    CREATE TABLE instructores (
    id_instructor INT AUTO_INCREMENT PRIMARY KEY,
    id_rol INT, -- FK a Roles
    nombre VARCHAR(150) NOT NULL,
    email VARCHAR(150),
    contrasena VARCHAR(200),
    cedula VARCHAR(50),
    estado ENUM("Activo", "Deshabilitado"),
    primer_acceso TINYINT DEFAULT 1,
    FOREIGN KEY (id_rol) REFERENCES roles (id_rol) ON DELETE SET NULL ON UPDATE CASCADE
    );

    -- Insertar instructor administrador inicial
    INSERT INTO instructores (id_rol, nombre, email, contrasena, cedula, estado)
    VALUES (1, 'Admin', 'administracion@sena.edu.co', '$2a$10$tksuZTKKUcHP63p8QvD0LOPTPT8PmJeTw25tnrLIkPNpIsLg5e7G.', '1234567890', '1');
    -- contraseña de administracion@sena.edu.co es = 12345678

    CREATE TABLE instructor_ficha (
    id_instructor_ficha INT AUTO_INCREMENT PRIMARY KEY,
    id_instructor INT NOT NULL,
    id_ficha INT NOT NULL,
    rol varchar(15),
    FOREIGN KEY (id_instructor) REFERENCES instructores (id_instructor) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (id_ficha) REFERENCES fichas (id_ficha) ON DELETE CASCADE ON UPDATE CASCADE
    );

    CREATE TABLE competencias (
    id_competencia INT AUTO_INCREMENT PRIMARY KEY,
    id_programa INT, -- FK a Programa_formacion
    codigo_norma TEXT,
    duracion_maxima INT,
    nombre_competencia TEXT,
    unidad_competencia TEXT,
    FOREIGN KEY (id_programa) REFERENCES programa_formacion (id_programa) ON DELETE SET NULL ON UPDATE CASCADE
    );

    CREATE TABLE fases (
    id_fase INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(30) NOT NULL
    );

    CREATE TABLE proyectos (
    id_proyecto INT AUTO_INCREMENT PRIMARY KEY,
    id_programa INT, -- FK a Programa_formacion
    codigo_proyecto TEXT,
    nombre_proyecto TEXT,
    codigo_programa VARCHAR(20),
    centro_formacion TEXT,
    regional TEXT,
    FOREIGN KEY (id_programa) REFERENCES programa_formacion (id_programa) ON DELETE SET NULL ON UPDATE CASCADE
    );

    CREATE TABLE planeacion_pedagogica (
    id_planeacion INT AUTO_INCREMENT PRIMARY KEY,
    id_ficha INT, -- FK a Ficha
    observaciones TEXT,
    fecha_creacion DATE,
    FOREIGN KEY (id_ficha) REFERENCES fichas (id_ficha) ON DELETE CASCADE ON UPDATE CASCADE
    );

    CREATE TABLE guia_aprendizaje (
    id_guia INT AUTO_INCREMENT PRIMARY KEY,
    id_planeacion INT, -- FK a Planeacion_Pedagogica
    titulo TEXT,
    version VARCHAR(10),
    fecha_creacion DATE,
    FOREIGN KEY (id_planeacion) REFERENCES planeacion_pedagogica (id_planeacion) ON DELETE CASCADE ON UPDATE CASCADE
    );

    CREATE TABLE trimestre (
    id_trimestre INT AUTO_INCREMENT PRIMARY KEY,
    id_ficha INT, -- FK a fichas
    no_trimestre INT,
    fase VARCHAR(30),
    FOREIGN KEY (id_ficha) REFERENCES fichas (id_ficha) ON DELETE CASCADE ON UPDATE CASCADE
    );

    CREATE TABLE raps (
    id_rap INT AUTO_INCREMENT PRIMARY KEY,
    id_competencia INT,
    denominacion TEXT,
    duracion INT,
    codigo VARCHAR(20),
    FOREIGN KEY (id_competencia) REFERENCES competencias (id_competencia) ON DELETE SET NULL ON UPDATE CASCADE
    );

    CREATE TABLE actividades_proyecto (
    id_actividad INT AUTO_INCREMENT PRIMARY KEY,
    fase VARCHAR(100), -- ANALISIS, DESARROLLO, etc.
    nombre_actividad TEXT NOT NULL
    );

    -- Esta tabla relaciona las actividades de proyecto con los RAPs
    CREATE TABLE actividad_rap (
    id_actividad INT,
    id_rap INT,
    PRIMARY KEY (id_actividad, id_rap),
    FOREIGN KEY (id_actividad) REFERENCES actividades_proyecto(id_actividad),
    FOREIGN KEY (id_rap) REFERENCES raps(id_rap)
    );

    CREATE TABLE conocimiento_proceso (
    id_conocimiento_proceso INT AUTO_INCREMENT PRIMARY KEY,
    id_rap INT, -- FK a RAPs
    nombre MEDIUMTEXT NOT NULL,
    FOREIGN KEY (id_rap) REFERENCES raps (id_rap) ON DELETE CASCADE ON UPDATE CASCADE
    );

    CREATE TABLE conocimiento_saber (
    id_conocimiento_saber INT AUTO_INCREMENT PRIMARY KEY,
    id_rap INT, -- FK a RAPs
    nombre MEDIUMTEXT NOT NULL,
    FOREIGN KEY (id_rap) REFERENCES raps (id_rap) ON DELETE CASCADE ON UPDATE CASCADE
    );

    CREATE TABLE criterios_evaluacion (
    id_criterio_evaluacion INT AUTO_INCREMENT PRIMARY KEY,
    id_rap INT, -- FK a RAPs
    nombre MEDIUMTEXT NOT NULL,
    FOREIGN KEY (id_rap) REFERENCES raps (id_rap) ON DELETE CASCADE ON UPDATE CASCADE
);

-- Sábana de asignación de RAPs a trimestres y fichas
CREATE TABLE rap_trimestre (
    id_rap_trimestre INT AUTO_INCREMENT PRIMARY KEY,
    id_rap INT NOT NULL,
    id_ficha INT NOT NULL,
    id_trimestre INT NOT NULL,
    id_instructor INT NULL,
    horas_trimestre INT NULL,
    horas_semana FLOAT NULL,
    estado ENUM('Planeado', 'En curso', 'Finalizado') DEFAULT 'Planeado',
    instructor_asignado VARCHAR(50) NULL,
    FOREIGN KEY (id_rap) REFERENCES raps(id_rap) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (id_ficha) REFERENCES fichas(id_ficha) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (id_trimestre) REFERENCES trimestre(id_trimestre) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (id_instructor) REFERENCES instructores(id_instructor) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE detalle_planeacion_pedagogica (
    id_detalle INT AUTO_INCREMENT PRIMARY KEY,
    id_planeacion INT NOT NULL,
    id_rap INT NOT NULL,
    codigo_rap VARCHAR(20),
    nombre_rap TEXT,
    competencia TEXT,
    horas_trimestre INT,
    -- Datos pedagógicos
    actividades_aprendizaje TEXT,
    duracion_directa INT,
    duracion_independiente INT,
    descripcion_evidencia TEXT,
    estrategias_didacticas VARCHAR(100),
    ambientes_aprendizaje VARCHAR(100),
    materiales_formacion TEXT,
    observaciones TEXT,
    -- Información de saberes y criterios
    saberes_conceptos TEXT,
    saberes_proceso TEXT,
    criterios_evaluacion TEXT,
    -- Auditoría
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_planeacion) REFERENCES planeacion_pedagogica(id_planeacion) ON DELETE CASCADE,
    FOREIGN KEY (id_rap) REFERENCES raps(id_rap) ON DELETE CASCADE
);

-- Inicio procedimiento para asignar RAP a trimestre
DELIMITER $$

CREATE PROCEDURE asignar_rap_trimestre(
    IN p_id_rap INT,
    IN p_id_trimestre INT,
    IN p_id_ficha INT
)
BEGIN
	DECLARE v_duracion_competencia INT DEFAULT 0;
    DECLARE v_raps_competencia INT DEFAULT 0;
    DECLARE v_trimestres INT DEFAULT 0;
    DECLARE v_horas_trimestre FLOAT DEFAULT 0;
    DECLARE v_horas_semana FLOAT DEFAULT 0;
    DECLARE v_id_competencia INT DEFAULT 0;

    -- 1 Obtener la competencia dueña del RAP
    SELECT id_competencia INTO v_id_competencia
    FROM raps
    WHERE id_rap = p_id_rap;

    -- Validación de seguridad
    IF v_id_competencia IS NULL THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'El RAP no tiene competencia asociada';
    END IF;

    -- 2 Traer duración total de la competencia
    SELECT duracion_maxima INTO v_duracion_competencia
    FROM competencias
    WHERE id_competencia = v_id_competencia;

    -- 3 Número de RAPs que tiene esa competencia
    SELECT COUNT(*) INTO v_raps_competencia
    FROM raps
    WHERE id_competencia = v_id_competencia;
    
    -- 4 cuántos trimestres tiene asignado el RAP
    SELECT COUNT(*) INTO v_trimestres
    FROM rap_trimestre
    WHERE id_rap = p_id_rap;

    IF v_trimestres = 0 THEN
        SET v_trimestres = 1;
    END IF;

    -- 5 Cálculo oficial SENA
    SET v_horas_trimestre = v_duracion_competencia / v_raps_competencia / v_trimestres ;
    SET v_horas_semana = v_horas_trimestre / 11;

    -- 6 Insertar o actualizar
    INSERT INTO rap_trimestre (id_rap, id_trimestre, id_ficha, horas_trimestre, horas_semana, estado)
    VALUES (p_id_rap, p_id_trimestre, p_id_ficha, v_horas_trimestre, v_horas_semana, 'Planeado')
    ON DUPLICATE KEY UPDATE
        horas_trimestre = v_horas_trimestre,
        horas_semana = v_horas_semana,
		estado = 'Planeado';
END $$

DELIMITER;

-- Inicio procedimiento para recalcular horas de un RAP en una ficha
DELIMITER $$

CREATE PROCEDURE recalcular_horas_rap(
    IN p_id_rap INT,
    IN p_id_ficha INT
)
BEGIN
    DECLARE v_duracion_competencia INT;
    DECLARE v_raps_competencia INT;
    DECLARE v_id_competencia INT;
    DECLARE v_trimestres_competencia INT;

    -- Competencia del RAP
    SELECT id_competencia INTO v_id_competencia
    FROM raps WHERE id_rap = p_id_rap;

    -- Duración máxima competencia
    SELECT duracion_maxima INTO v_duracion_competencia
    FROM competencias WHERE id_competencia = v_id_competencia;

    -- Total RAPs de esa competencia
    SELECT COUNT(*) INTO v_raps_competencia
    FROM raps WHERE id_competencia = v_id_competencia;

    -- Total trimestres asignados a ese RAP en esa ficha
    SELECT COUNT(*) INTO v_trimestres_competencia
    FROM rap_trimestre
    WHERE id_rap = p_id_rap AND id_ficha = p_id_ficha;

    IF v_trimestres_competencia = 0 THEN
        SET v_trimestres_competencia = 1;
    END IF;

    -- Calcular horas por trimestre y por semana
    UPDATE rap_trimestre
    SET
        horas_trimestre = v_duracion_competencia / v_raps_competencia / v_trimestres_competencia,
        horas_semana = (v_duracion_competencia / v_raps_competencia / v_trimestres_competencia) / 11
    WHERE id_rap = p_id_rap AND id_ficha = p_id_ficha;
END $$
DELIMITER ;


-- Inicio procedimiento para quitar asignación de RAP a trimestre
DELIMITER $$

CREATE PROCEDURE quitar_rap_trimestre(
    IN p_id_rap INT,
    IN p_id_trimestre INT,
    IN p_id_ficha INT
)
BEGIN
    -- Eliminar asignación del trimestre
    DELETE FROM rap_trimestre
    WHERE id_rap = p_id_rap
    AND id_trimestre = p_id_trimestre
    AND id_ficha = p_id_ficha;

    -- Recalcular horas del RAP en esa ficha
    CALL recalcular_horas_rap(p_id_rap, p_id_ficha);
END $$
DELIMITER ;

-- Vistas para la sábana de asignación de RAPs a trimestres y fichas
CREATE OR REPLACE VIEW v_sabana_base AS
SELECT 
    f.id_ficha,
    c.id_competencia,
    c.codigo_norma,
    c.nombre_competencia,
    c.duracion_maxima,
    r.id_rap,
    r.codigo AS codigo_rap,
    r.denominacion AS descripcion_rap,
    r.duracion AS duracion_rap,
    t.id_trimestre,
    t.no_trimestre,
    t.fase AS nombre_fase,
    rt.id_rap_trimestre,
    rt.horas_trimestre,
    rt.horas_semana,
    rt.estado,
    rt.id_instructor,
    instr.nombre AS instructor_asignado

FROM fichas f
JOIN proyectos p ON f.id_programa = p.id_programa
JOIN competencias c ON c.id_programa = p.id_programa
JOIN raps r ON r.id_competencia = c.id_competencia
CROSS JOIN trimestre t
LEFT JOIN rap_trimestre rt 
        ON rt.id_rap = r.id_rap 
        AND rt.id_trimestre = t.id_trimestre 
        AND rt.id_ficha = f.id_ficha
LEFT JOIN instructores instr 
        ON instr.id_instructor = rt.id_instructor
ORDER BY c.id_competencia, CAST(r.codigo AS UNSIGNED), r.id_rap;

-- Vista matriz sábana
CREATE OR REPLACE VIEW v_sabana_matriz AS
SELECT 
    id_ficha,
    id_competencia,
    codigo_norma,
    nombre_competencia,
    duracion_maxima,
    id_rap,
    codigo_rap,
    descripcion_rap,
    duracion_rap,

    -- TRIMESTRE 1
    MAX(CASE WHEN no_trimestre = 1 THEN id_rap_trimestre END) AS t1_id_rap_trimestre,
    ROUND(MAX(CASE WHEN no_trimestre = 1 THEN horas_trimestre END)) AS t1_htrim,
    ROUND(MAX(CASE WHEN no_trimestre = 1 THEN horas_semana END)) AS t1_hsem,
    MAX(CASE WHEN no_trimestre = 1 THEN id_instructor END) AS t1_id_instructor,
    MAX(CASE WHEN no_trimestre = 1 THEN instructor_asignado END) AS t1_instructor,

    -- TRIMESTRE 2
    MAX(CASE WHEN no_trimestre = 2 THEN id_rap_trimestre END) AS t2_id_rap_trimestre,
    ROUND(MAX(CASE WHEN no_trimestre = 2 THEN horas_trimestre END)) AS t2_htrim,
    ROUND(MAX(CASE WHEN no_trimestre = 2 THEN horas_semana END)) AS t2_hsem,
    MAX(CASE WHEN no_trimestre = 2 THEN id_instructor END) AS t2_id_instructor,
    MAX(CASE WHEN no_trimestre = 2 THEN instructor_asignado END) AS t2_instructor,

    -- TRIMESTRE 3
    MAX(CASE WHEN no_trimestre = 3 THEN id_rap_trimestre END) AS t3_id_rap_trimestre,
    ROUND(MAX(CASE WHEN no_trimestre = 3 THEN horas_trimestre END)) AS t3_htrim,
    ROUND(MAX(CASE WHEN no_trimestre = 3 THEN horas_semana END)) AS t3_hsem,
    MAX(CASE WHEN no_trimestre = 3 THEN id_instructor END) AS t3_id_instructor,
    MAX(CASE WHEN no_trimestre = 3 THEN instructor_asignado END) AS t3_instructor,

    -- TRIMESTRE 4
    MAX(CASE WHEN no_trimestre = 4 THEN id_rap_trimestre END) AS t4_id_rap_trimestre,
    ROUND(MAX(CASE WHEN no_trimestre = 4 THEN horas_trimestre END)) AS t4_htrim,
    ROUND(MAX(CASE WHEN no_trimestre = 4 THEN horas_semana END)) AS t4_hsem,
    MAX(CASE WHEN no_trimestre = 4 THEN id_instructor END) AS t4_id_instructor,
    MAX(CASE WHEN no_trimestre = 4 THEN instructor_asignado END) AS t4_instructor,

    -- TRIMESTRE 5
    MAX(CASE WHEN no_trimestre = 5 THEN id_rap_trimestre END) AS t5_id_rap_trimestre,
    ROUND(MAX(CASE WHEN no_trimestre = 5 THEN horas_trimestre END)) AS t5_htrim,
    ROUND(MAX(CASE WHEN no_trimestre = 5 THEN horas_semana END)) AS t5_hsem,
    MAX(CASE WHEN no_trimestre = 5 THEN id_instructor END) AS t5_id_instructor,
    MAX(CASE WHEN no_trimestre = 5 THEN instructor_asignado END) AS t5_instructor,

    -- TRIMESTRE 6
    MAX(CASE WHEN no_trimestre = 6 THEN id_rap_trimestre END) AS t6_id_rap_trimestre,
    ROUND(MAX(CASE WHEN no_trimestre = 6 THEN horas_trimestre END)) AS t6_htrim,
    ROUND(MAX(CASE WHEN no_trimestre = 6 THEN horas_semana END)) AS t6_hsem,
    MAX(CASE WHEN no_trimestre = 6 THEN id_instructor END) AS t6_id_instructor,
    MAX(CASE WHEN no_trimestre = 6 THEN instructor_asignado END) AS t6_instructor,

    -- TRIMESTRE 7
    MAX(CASE WHEN no_trimestre = 7 THEN id_rap_trimestre END) AS t7_id_rap_trimestre,
    ROUND(MAX(CASE WHEN no_trimestre = 7 THEN horas_trimestre END)) AS t7_htrim,
    ROUND(MAX(CASE WHEN no_trimestre = 7 THEN horas_semana END)) AS t7_hsem,
    MAX(CASE WHEN no_trimestre = 7 THEN id_instructor END) AS t7_id_instructor,
    MAX(CASE WHEN no_trimestre = 7 THEN instructor_asignado END) AS t7_instructor,

    -- TRIMESTRE 8 (NOCTURNA)
    MAX(CASE WHEN no_trimestre = 8 THEN id_rap_trimestre END) AS t8_id_rap_trimestre,
    ROUND(MAX(CASE WHEN no_trimestre = 8 THEN horas_trimestre END)) AS t8_htrim,
    ROUND(MAX(CASE WHEN no_trimestre = 8 THEN horas_semana END)) AS t8_hsem,
    MAX(CASE WHEN no_trimestre = 8 THEN id_instructor END) AS t8_id_instructor,
    MAX(CASE WHEN no_trimestre = 8 THEN instructor_asignado END) AS t8_instructor,

    -- TRIMESTRE 9 (NOCTURNA)
    MAX(CASE WHEN no_trimestre = 9 THEN id_rap_trimestre END) AS t9_id_rap_trimestre,
    ROUND(MAX(CASE WHEN no_trimestre = 9 THEN horas_trimestre END)) AS t9_htrim,
    ROUND(MAX(CASE WHEN no_trimestre = 9 THEN horas_semana END)) AS t9_hsem,
    MAX(CASE WHEN no_trimestre = 9 THEN id_instructor END) AS t9_id_instructor,
    MAX(CASE WHEN no_trimestre = 9 THEN instructor_asignado END) AS t9_instructor,
    
    -- TOTAL HORAS
    COALESCE(SUM(horas_trimestre), 0) AS total_horas

FROM v_sabana_base
GROUP BY 
    id_ficha, id_competencia, codigo_norma, nombre_competencia,
    duracion_maxima, id_rap, codigo_rap, descripcion_rap, duracion_rap

ORDER BY 
    id_competencia,
    CAST(codigo_rap AS UNSIGNED),
    id_rap;

select * from roles;
select * from proyectos;
select * from competencias;
select * from raps;
select * from actividades_proyecto;
select * from actividad_rap;
select * from fichas;
select * from fases;
SELECT * FROM rap_trimestre;
SELECT * FROM v_sabana_base;
SELECT * FROM v_sabana_matriz;
SELECT * FROM instructores;
SELECT * FROM planeacion_pedagogica;
SELECT * FROM trimestre;
SELECT * FROM instructor_ficha;
UPDATE instructores SET primer_acceso = 0 WHERE id_instructor = 1; -- Admin
UPDATE instructores SET primer_acceso = 1 WHERE id_instructor = 2; -- Instructor nuevo
