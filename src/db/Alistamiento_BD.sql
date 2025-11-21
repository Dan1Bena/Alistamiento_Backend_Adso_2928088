-- Script completo para MySQL Workbench
-- Crea la base de datos Alistamiento_DB y todas las tablas y relaciones según el modelo entregado.
-- Motor: InnoDB, Codificación: utf8mb4

DROP DATABASE IF EXISTS alistamiento_db;
CREATE DATABASE alistamiento_db
DEFAULT CHARACTER SET = utf8mb4
DEFAULT COLLATE = utf8mb4_general_ci;
USE alistamiento_db;

-- ======================
-- Tablas (sin FK todavía)
-- ======================

CREATE TABLE permisos (
  id_permiso INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE roles (
  id_rol INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE roles_permisos (
  id_roles_permiso INT AUTO_INCREMENT PRIMARY KEY,
  id_permiso INT NOT NULL,
  id_rol INT NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE instructores (
  id_instructor INT AUTO_INCREMENT PRIMARY KEY,
  id_rol INT, -- FK a Roles
  nombre VARCHAR(150) NOT NULL,
  email VARCHAR(150),
  contrasena VARCHAR(200),
  cedula VARCHAR(50),
  estado ENUM("Activo", "Deshabilitado"),
  primer_acceso TINYINT DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE instructor_ficha (
  id_instructor_ficha INT AUTO_INCREMENT PRIMARY KEY,
  id_instructor INT NOT NULL,
  id_ficha INT NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE fichas (
  id_ficha INT AUTO_INCREMENT PRIMARY KEY,
  id_programa INT, -- FK a Programa_formacion
  codigo_ficha VARCHAR(20),
  modalidad VARCHAR(20),
  jornada ENUM("Diurna","Nocturna"),
  ambiente VARCHAR(10),
  fecha_inicio DATE,
  fecha_final DATE,
  cantidad_trimestre INT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE competencias (
  id_competencia INT AUTO_INCREMENT PRIMARY KEY,
  id_programa INT, -- FK a Programa_formacion
  codigo_norma TEXT,
  duracion_maxima INT,
  nombre_competencia TEXT,
  unidad_competencia TEXT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE fases (
  id_fase INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(30) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE proyectos (
  id_proyecto INT AUTO_INCREMENT PRIMARY KEY,
  id_programa INT, -- FK a Programa_formacion
  codigo_proyecto TEXT,
  nombre_proyecto TEXT,
  codigo_programa VARCHAR(20),
  centro_formacion TEXT,
  regional TEXT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE planeacion_pedagogica (
  id_planeacion INT AUTO_INCREMENT PRIMARY KEY,
  id_ficha INT, -- FK a Ficha
  observaciones TEXT,
  fecha_creacion DATE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE guia_aprendizaje (
  id_guia INT AUTO_INCREMENT PRIMARY KEY,
  id_planeacion INT, -- FK a Planeacion_Pedagogica
  titulo TEXT,
  version VARCHAR(10),
  fecha_creacion DATE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE trimestre (
  id_trimestre INT AUTO_INCREMENT PRIMARY KEY,
  id_planeacion INT, -- FK a Planeacion_Pedagogica
  no_trimestre INT,
  fase VARCHAR(30)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE raps (
  id_rap INT AUTO_INCREMENT PRIMARY KEY,
  id_competencia INT,
  denominacion TEXT,
  duracion INT,
  codigo VARCHAR(20)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE actividades_proyecto (
  id_actividad INT AUTO_INCREMENT PRIMARY KEY,
  fase VARCHAR(100), -- ANALISIS, DESARROLLO, etc.
  nombre_actividad TEXT NOT NULL
);

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
  nombre MEDIUMTEXT NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE conocimiento_saber (
  id_conocimiento_saber INT AUTO_INCREMENT PRIMARY KEY,
  id_rap INT, -- FK a RAPs
  nombre MEDIUMTEXT NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE criterios_evaluacion (
  id_criterio_evaluacion INT AUTO_INCREMENT PRIMARY KEY,
  id_rap INT, -- FK a RAPs
  nombre MEDIUMTEXT NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE rap_trimestre (
    id_rap_trimestre INT AUTO_INCREMENT PRIMARY KEY,
    id_rap INT NOT NULL,
    id_trimestre INT NOT NULL,
    horas_trimestre INT NULL,
    horas_semana FLOAT NULL,
    estado ENUM('Planeado', 'En curso', 'Finalizado') DEFAULT 'Planeado',
    
    FOREIGN KEY (id_rap) REFERENCES raps(id_rap) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (id_trimestre) REFERENCES trimestre(id_trimestre) ON DELETE CASCADE ON UPDATE CASCADE
);


-- ======================
-- Agregar constraints FK (integridad referencial)
-- ======================

-- Roles_permiso -> Permisos, Roles
ALTER TABLE roles_permisos
  ADD CONSTRAINT fk_rolespermiso_permiso
    FOREIGN KEY (id_permiso) REFERENCES permisos (id_permiso)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT fk_rolespermiso_rol
    FOREIGN KEY (id_rol) REFERENCES roles (id_rol)
    ON DELETE RESTRICT ON UPDATE CASCADE;

-- Instructores -> Roles
ALTER TABLE instructores
  ADD CONSTRAINT fk_instructores_rol
    FOREIGN KEY (id_rol) REFERENCES roles (id_rol)
    ON DELETE SET NULL ON UPDATE CASCADE;

-- instructor_ficha -> instructores, Fichas
ALTER TABLE instructor_ficha
  ADD CONSTRAINT fk_instructorficha_instructor
    FOREIGN KEY (id_instructor) REFERENCES instructores (id_instructor)
    ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT fk_instructorficha_ficha
    FOREIGN KEY (id_ficha) REFERENCES fichas (id_ficha)
    ON DELETE CASCADE ON UPDATE CASCADE;

-- Fichas -> Programa_formacion
ALTER TABLE fichas
  ADD CONSTRAINT fk_ficha_programa
    FOREIGN KEY (id_programa) REFERENCES programa_formacion (id_programa)
    ON DELETE SET NULL ON UPDATE CASCADE;

-- Competencia -> Programa_formacion, RAPs
ALTER TABLE competencias
  ADD CONSTRAINT fk_competencia_programa
    FOREIGN KEY (id_programa) REFERENCES programa_formacion (id_programa)
    ON DELETE SET NULL ON UPDATE CASCADE;

-- Proyectos -> Programa_formacion, Fases
ALTER TABLE proyectos
  ADD CONSTRAINT fk_proyectos_programa
    FOREIGN KEY (id_programa) REFERENCES programa_formacion (id_programa)
    ON DELETE SET NULL ON UPDATE CASCADE;
    
ALTER TABLE raps
  ADD CONSTRAINT fk_rap_competencia
    FOREIGN KEY (id_competencia) REFERENCES competencias (id_competencia)
    ON DELETE SET NULL ON UPDATE CASCADE;

-- Planeacion_Pedagogica -> Ficha
ALTER TABLE planeacion_pedagogica
  ADD CONSTRAINT fk_planeacion_ficha
    FOREIGN KEY (id_ficha) REFERENCES fichas (id_ficha)
    ON DELETE CASCADE ON UPDATE CASCADE;

-- Guia_Aprendizaje -> Planeacion_Pedagogica
ALTER TABLE guia_aprendizaje
  ADD CONSTRAINT fk_guia_planeacion
    FOREIGN KEY (id_planeacion) REFERENCES planeacion_pedagogica (id_planeacion)
    ON DELETE CASCADE ON UPDATE CASCADE;

-- Trimestre -> Planeacion_Pedagogica
ALTER TABLE trimestre
  ADD CONSTRAINT fk_trimestre_planeacion
    FOREIGN KEY (id_planeacion) REFERENCES planeacion_pedagogica (id_planeacion)
    ON DELETE CASCADE ON UPDATE CASCADE;

-- Conocimiento_Proceso, Conocimiento_Saber, Criterios_Evaluacion -> RAPs
ALTER TABLE conocimiento_proceso
  ADD CONSTRAINT fk_conproc_rap
    FOREIGN KEY (id_rap) REFERENCES raps (id_rap)
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE conocimiento_saber
  ADD CONSTRAINT fk_consaber_rap
    FOREIGN KEY (id_rap) REFERENCES raps (id_rap)
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE criterios_evaluacion
  ADD CONSTRAINT fk_criterios_rap
    FOREIGN KEY (id_rap) REFERENCES raps (id_rap)
    ON DELETE CASCADE ON UPDATE CASCADE;

DELIMITER $$

CREATE PROCEDURE asignar_rap_trimestre (
    IN p_id_rap INT,
    IN p_id_trimestre INT
)
BEGIN
    DECLARE v_duracion_competencia INT DEFAULT 0;
    DECLARE v_raps_competencia INT DEFAULT 1;
    DECLARE v_trimestres_competencia INT DEFAULT 1;
    DECLARE v_horas_trimestre FLOAT DEFAULT 0;
    DECLARE v_horas_semana FLOAT DEFAULT 0;
    DECLARE v_id_competencia INT DEFAULT NULL;

    -- Confirmar que el trimestre existe
    IF NOT EXISTS (SELECT 1 FROM trimestre WHERE id_trimestre = p_id_trimestre) THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'El trimestre no existe';
    END IF;

    -- Competencia del RAP
    SELECT id_competencia INTO v_id_competencia
    FROM raps
    WHERE id_rap = p_id_rap
    LIMIT 1;

    IF v_id_competencia IS NULL THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'El RAP no tiene competencia asociada';
    END IF;

    -- Duración de la competencia
    SELECT COALESCE(duracion_maxima,0) INTO v_duracion_competencia
    FROM competencias
    WHERE id_competencia = v_id_competencia;

    -- Cantidad de RAPs de esa competencia
    SELECT COALESCE(COUNT(*),1) INTO v_raps_competencia
    FROM raps
    WHERE id_competencia = v_id_competencia;

    -- Cantidad de trimestres asignados
    SELECT COALESCE(COUNT(*),0) INTO v_trimestres_competencia
    FROM rap_trimestre
    WHERE id_rap = p_id_rap;

    IF v_trimestres_competencia = 0 THEN
        SET v_trimestres_competencia = 1;
    END IF;

    -- Fórmula oficial SENA
    SET v_horas_trimestre = v_duracion_competencia / v_raps_competencia / v_trimestres_competencia;
    SET v_horas_semana = v_horas_trimestre / 11;

    -- Insert seguro
    INSERT INTO rap_trimestre (id_rap, id_trimestre, horas_trimestre, horas_semana, estado)
    VALUES (p_id_rap, p_id_trimestre, v_horas_trimestre, v_horas_semana, 'Planeado')
    AS newVals
    ON DUPLICATE KEY UPDATE
        horas_trimestre = newVals.horas_trimestre,
        horas_semana = newVals.horas_semana,
        estado = 'Planeado';

END $$

DELIMITER $$

CREATE PROCEDURE quitar_rap_trimestre (
    IN p_id_rap INT,
    IN p_id_trimestre INT
)
BEGIN
    DELETE FROM rap_trimestre
    WHERE id_rap = p_id_rap AND id_trimestre = p_id_trimestre;

    CALL recalcular_horas_rap(p_id_rap);
END $$

DELIMITER $$

DELIMITER $$

CREATE PROCEDURE recalcular_horas_rap (
    IN p_id_rap INT
)
BEGIN
    DECLARE v_duracion_competencia INT;
    DECLARE v_raps_competencia INT;
    DECLARE v_id_competencia INT;
    DECLARE v_trimestres_competencia INT;
    
    SELECT id_competencia INTO v_id_competencia
    FROM raps WHERE id_rap = p_id_rap;

    SELECT duracion_maxima INTO v_duracion_competencia
    FROM competencias WHERE id_competencia = v_id_competencia;

    SELECT COUNT(*) INTO v_raps_competencia
    FROM raps WHERE id_competencia = v_id_competencia;

    SELECT COUNT(*) INTO v_trimestres_competencia
    FROM rap_trimestre WHERE id_rap = p_id_rap;

    UPDATE rap_trimestre
    SET 
        horas_trimestre = v_duracion_competencia / v_raps_competencia / v_trimestres_competencia,
        horas_semana = (v_duracion_competencia / v_raps_competencia / v_trimestres_competencia) / 11
    WHERE id_rap = p_id_rap;
END $$

DELIMITER $$


CREATE OR REPLACE VIEW v_sabana_base AS
SELECT 
    f.id_ficha,
    p.id_proyecto,
    p.codigo_proyecto,
    p.nombre_proyecto,
    c.id_competencia,
    c.codigo_norma,
    c.nombre_competencia,
    c.duracion_maxima,
    r.id_rap,
    r.codigo AS codigo_rap,
    r.denominacion AS descripcion_rap,
    r.duracion AS duracion_rap,
    t.no_trimestre,
    rt.horas_trimestre,
    rt.horas_semana,
    t.fase AS nombre_fase,
    rt.estado
FROM fichas f
JOIN proyectos p ON f.id_programa = p.id_programa
JOIN competencias c ON p.id_programa = c.id_programa
JOIN raps r ON r.id_competencia = c.id_competencia
LEFT JOIN planeacion_pedagogica pp ON pp.id_ficha = f.id_ficha
LEFT JOIN trimestre t ON t.id_planeacion = pp.id_planeacion
LEFT JOIN rap_trimestre rt ON rt.id_trimestre = t.id_trimestre
ORDER BY c.id_competencia, t.no_trimestre, CAST(codigo_rap AS UNSIGNED);


CREATE OR REPLACE VIEW v_sabana_matriz AS
SELECT 
	id_ficha,
    id_proyecto,
    codigo_proyecto,
    nombre_proyecto,
    id_competencia,
    codigo_norma,
    nombre_competencia,
    duracion_maxima,
    id_rap,
    codigo_rap,
    descripcion_rap,
    duracion_rap,

    ROUND(MAX(CASE WHEN no_trimestre = 1 THEN horas_trimestre END)) AS t1_htrim,
    ROUND(MAX(CASE WHEN no_trimestre = 1 THEN horas_semana END)) AS t1_hsem,
    ROUND(MAX(CASE WHEN no_trimestre = 2 THEN horas_trimestre END)) AS t2_htrim,
    ROUND(MAX(CASE WHEN no_trimestre = 2 THEN horas_semana END)) AS t2_hsem,
    ROUND(MAX(CASE WHEN no_trimestre = 3 THEN horas_trimestre END)) AS t3_htrim,
    ROUND(MAX(CASE WHEN no_trimestre = 3 THEN horas_semana END)) AS t3_hsem,
    ROUND(MAX(CASE WHEN no_trimestre = 4 THEN horas_trimestre END)) AS t4_htrim,
    ROUND(MAX(CASE WHEN no_trimestre = 4 THEN horas_semana END)) AS t4_hsem,
    ROUND(MAX(CASE WHEN no_trimestre = 5 THEN horas_trimestre END)) AS t5_htrim,
    ROUND(MAX(CASE WHEN no_trimestre = 5 THEN horas_semana END)) AS t5_hsem,
    ROUND(MAX(CASE WHEN no_trimestre = 6 THEN horas_trimestre END)) AS t6_htrim,
    ROUND(MAX(CASE WHEN no_trimestre = 6 THEN horas_semana END)) AS t6_hsem,
    ROUND(MAX(CASE WHEN no_trimestre = 7 THEN horas_trimestre END)) AS t7_htrim,
    ROUND(MAX(CASE WHEN no_trimestre = 7 THEN horas_semana END)) AS t7_hsem,

    COALESCE(SUM(horas_trimestre), 0) AS total_horas

FROM v_sabana_base
GROUP BY 
    id_ficha, id_proyecto, codigo_proyecto, nombre_proyecto,
    id_competencia, codigo_norma, nombre_competencia, duracion_maxima,
    id_rap, codigo_rap, descripcion_rap, duracion_rap
ORDER BY 
    id_competencia,
    CAST(codigo_rap AS UNSIGNED),
    id_rap;
-- La vista v_sabana_matriz presenta los datos en formato matriz para análisis comparativo.

-- ======================
-- Verificación final
-- ======================

CALL asignar_rap_trimestre(1, 23);

CALL recalcular_horas_rap(1);

CALL quitar_rap_trimestre(1, );

select * from programa_formacion;
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
UPDATE instructores SET primer_acceso = 0 WHERE id_instructor = 1; -- Admin
UPDATE instructores SET primer_acceso = 1 WHERE id_instructor = 2; -- Instructor nuevo

INSERT INTO planeacion_pedagogica (
    id_ficha, 
    observaciones, 
    fecha_creacion
) VALUES (
    3, 
    'Planeación pedagógica del primer trimestre de la ficha 2928088. Se trabajarán competencias básicas de análisis y diseño de software. Los aprendices requieren refuerzo en lógica de programación.',
    '2024-01-15'
);

delete from trimestre;

INSERT INTO roles (nombre) VALUES ('Administrador');
INSERT INTO roles (nombre) VALUES ('Instructor');
INSERT INTO roles (nombre) VALUES ('Gestor');
INSERT INTO instructores (id_rol, nombre, email, contrasena, cedula, estado)
VALUES (2, 'Jace', 'instructor@sena.edu.co', '$2a$10$tksuZTKKUcHP63p8QvD0LOPTPT8PmJeTw25tnrLIkPNpIsLg5e7G.', '1007836815', '1');

INSERT INTO trimestre (id_planeacion, no_trimestre, fase)
VALUES 
(2, 1,'ANÁLISIS'),
(2, 2,'ANÁLISIS'),
(2, 3,'PLANEACIÓN'),
(2, 4,'EJECUCIÓN'),
(2, 5,'EJECUCIÓN'),
(2, 6,'EJECUCIÓN'),
(2, 7,'EVALUACIÓN');

