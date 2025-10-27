-- Script completo para MySQL Workbench
-- Crea la base de datos Alistamiento_DB y todas las tablas y relaciones según el modelo entregado.
-- Motor: InnoDB, Codificación: utf8mb4

DROP DATABASE IF EXISTS Alistamiento_DB;
CREATE DATABASE Alistamiento_DB
DEFAULT CHARACTER SET = utf8mb4
DEFAULT COLLATE = utf8mb4_general_ci;
USE Alistamiento_DB;

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

CREATE TABLE roles_permiso (
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
  perfil_profesional VARCHAR(200)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE instructor_ficha (
  id_instructor_ficha INT AUTO_INCREMENT PRIMARY KEY,
  id_instructor INT NOT NULL,
  id_ficha INT NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE programa_formacion (
  id_programa INT AUTO_INCREMENT PRIMARY KEY,
  id_competencia INT,    -- FK potencial a Competencia
  id_proyecto INT,       -- FK potencial a Proyectos
  codigo_programa VARCHAR(100),
  nombre_programa VARCHAR(150) NOT NULL,
  vigencia VARCHAR(50),
  tipo_programa VARCHAR(80),
  version_programa VARCHAR(50),
  horas_totales INT,
  horas_etapa_lectiva INT,
  horas_etapa_productiva INT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE ficha (
  id_ficha INT AUTO_INCREMENT PRIMARY KEY,
  id_programa INT, -- FK a Programa_formacion
  codigo_ficha VARCHAR(100),
  modalidad VARCHAR(80),
  jornada VARCHAR(80),
  ambiente VARCHAR(100),
  fecha_inicio DATE,
  fecha_final DATE,
  cantidad_trimestre INT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE competencia (
  id_competencia INT AUTO_INCREMENT PRIMARY KEY,
  id_programa INT, -- FK a Programa_formacion
  id_rap INT,      -- FK a RAPs
  codigo_norma VARCHAR(100),
  perfil_instructor VARCHAR(200),
  duracion_maxima INT,
  nombre_competencia VARCHAR(200),
  unidad_competencia VARCHAR(150)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE fases (
  id_fase INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(150) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE proyectos (
  id_proyecto INT AUTO_INCREMENT PRIMARY KEY,
  id_programa INT, -- FK a Programa_formacion
  id_fase INT,     -- FK a Fases
  codigo_proyecto VARCHAR(100),
  nombre_proyecto VARCHAR(150),
  codigo_programa VARCHAR(100),
  centro_formacion VARCHAR(150),
  regional VARCHAR(150)
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
  titulo VARCHAR(200),
  version VARCHAR(50),
  fecha_creacion DATE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE trimestre (
  id_trimestre INT AUTO_INCREMENT PRIMARY KEY,
  id_planeacion INT, -- FK a Planeacion_Pedagogica
  no_trimestre INT,
  fase VARCHAR(100)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE raps (
  id_rap INT AUTO_INCREMENT PRIMARY KEY,
  denominacion VARCHAR(200),
  duracion INT,
  codigo VARCHAR(100)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE conocimiento_proceso (
  id_conocimiento_proceso INT AUTO_INCREMENT PRIMARY KEY,
  id_rap INT, -- FK a RAPs
  nombre VARCHAR(200) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE conocimiento_saber (
  id_conocimiento_saber INT AUTO_INCREMENT PRIMARY KEY,
  id_rap INT, -- FK a RAPs
  nombre VARCHAR(200) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE criterios_evaluacion (
  id_criterio_evaluacion INT AUTO_INCREMENT PRIMARY KEY,
  id_rap INT, -- FK a RAPs
  nombre VARCHAR(200) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ======================
-- Agregar constraints FK (integridad referencial)
-- ======================

-- Roles_permiso -> Permisos, Roles
ALTER TABLE roles_permiso
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

-- instructor_ficha -> instructores, Ficha
ALTER TABLE instructor_ficha
  ADD CONSTRAINT fk_instructorficha_instructor
    FOREIGN KEY (id_instructor) REFERENCES instructores (id_instructor)
    ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT fk_instructorficha_ficha
    FOREIGN KEY (id_ficha) REFERENCES Ficha (id_ficha)
    ON DELETE CASCADE ON UPDATE CASCADE;

-- Ficha -> Programa_formacion
ALTER TABLE ficha
  ADD CONSTRAINT fk_ficha_programa
    FOREIGN KEY (id_programa) REFERENCES programa_formacion (id_programa)
    ON DELETE SET NULL ON UPDATE CASCADE;

-- Programa_formacion -> (id_competencia) referencia a Competencia si existe
ALTER TABLE programa_formacion
  ADD CONSTRAINT fk_programa_competencia
    FOREIGN KEY (id_competencia) REFERENCES competencia (id_competencia)
    ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT fk_programa_proyecto
    FOREIGN KEY (id_proyecto) REFERENCES proyectos (id_proyecto)
    ON DELETE SET NULL ON UPDATE CASCADE;

-- Competencia -> Programa_formacion, RAPs
ALTER TABLE competencia
  ADD CONSTRAINT fk_competencia_programa
    FOREIGN KEY (id_programa) REFERENCES programa_formacion (id_programa)
    ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT fk_competencia_rap
    FOREIGN KEY (id_rap) REFERENCES raps (id_rap)
    ON DELETE SET NULL ON UPDATE CASCADE;

-- Proyectos -> Programa_formacion, Fases
ALTER TABLE proyectos
  ADD CONSTRAINT fk_proyectos_programa
    FOREIGN KEY (id_programa) REFERENCES programa_formacion (id_programa)
    ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT fk_proyectos_fase
    FOREIGN KEY (id_fase) REFERENCES fases (id_fase)
    ON DELETE SET NULL ON UPDATE CASCADE;

-- Planeacion_Pedagogica -> Ficha
ALTER TABLE planeacion_pedagogica
  ADD CONSTRAINT fk_planeacion_ficha
    FOREIGN KEY (id_ficha) REFERENCES ficha (id_ficha)
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

-- Relaciones adicionales solicitadas (FK declaradas aunque no estén conectadas visualmente)
-- Ejemplos: añadir columnas y FK hacia RAPs, Fases, Planeacion, Proyectos ya se hizo en tablas relevantes.
-- Si necesita más relaciones "extra", se pueden agregar aquí (dejamos los más significativos ya implementados).

-- ======================
-- Indexes (opcional, para mejorar consultas sobre FKs)
-- ======================
CREATE INDEX idx_ficha_programa ON ficha (id_programa);
CREATE INDEX idx_competencia_programa ON competencia (id_programa);
CREATE INDEX idx_competencia_rap ON competencia (id_rap);
CREATE INDEX idx_proyectos_programa ON proyectos (id_programa);
CREATE INDEX idx_proyectos_fase ON proyectos (id_fase);
CREATE INDEX idx_planeacion_ficha ON planeacion_pedagogica (id_ficha);
CREATE INDEX idx_guia_planeacion ON guia_aprendizaje (id_planeacion);
CREATE INDEX idx_trimestre_planeacion ON trimestre (id_planeacion);
CREATE INDEX idx_conproc_rap ON conocimiento_proceso (id_rap);
CREATE INDEX idx_consaber_rap ON conocimiento_saber (id_rap);
CREATE INDEX idx_criterios_rap ON criterios_evaluacion (id_rap);

-- ======================
-- Verificación final
-- ======================

SHOW TABLES;

DESCRIBE permisos;
DESCRIBE roles;
DESCRIBE roles_permiso;
DESCRIBE instructores;
DESCRIBE instructor_ficha;
DESCRIBE programa_formacion;
DESCRIBE ficha;
DESCRIBE competencia;
DESCRIBE fases;
DESCRIBE proyectos;
DESCRIBE planeacion_pedagogica;
DESCRIBE guia_aprendizaje;
DESCRIBE trimestre;
DESCRIBE raps;
DESCRIBE conocimiento_proceso;
DESCRIBE conocimiento_saber;
DESCRIBE criterios_evaluacion;