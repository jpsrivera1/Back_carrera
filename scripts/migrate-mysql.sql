-- =============================================================
-- migrate-mysql.sql
-- Crea las tablas alumnos_vendedores y boletos_preventa
-- en MySQL (controlcarrera).
-- Ejecutar: node scripts/run-mysql-migrate.js
-- =============================================================

-- ─── alumnos_vendedores ───────────────────────────────────────
DROP TABLE IF EXISTS boletos_preventa;
DROP TABLE IF EXISTS alumnos_vendedores;

CREATE TABLE alumnos_vendedores (
    id                   CHAR(36)     NOT NULL DEFAULT (UUID()) PRIMARY KEY,
    nombre               TEXT         NOT NULL,
    apellidos            TEXT         NOT NULL,
    telefono_estudiante  VARCHAR(8)   NULL,
    nombre_encargado     TEXT         NOT NULL,
    telefono_encargado   TEXT         NOT NULL,
    grado                VARCHAR(100) NOT NULL,
    jornada              VARCHAR(100) NOT NULL,
    modalidad            VARCHAR(100) NOT NULL,
    fecha_nacimiento     DATE         NOT NULL,
    curso_extra_id       CHAR(36)     NULL,
    tipo_estudiante      VARCHAR(50)  NOT NULL DEFAULT 'REGULAR',
    uid_tarjeta          VARCHAR(255) NULL,
    estado               VARCHAR(20)  NOT NULL DEFAULT 'Activo',
    fecha_registro       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT UQ_alumnos_uid_tarjeta UNIQUE (uid_tarjeta)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── boletos_preventa ────────────────────────────────────────
CREATE TABLE boletos_preventa (
    id                  INT          NOT NULL PRIMARY KEY,
    numero_boleto       INT          NULL,
    alumno_id           CHAR(36)     NOT NULL,
    participante_id     INT          NULL,
    categoria           VARCHAR(10)  NULL,
    estado_boleto       VARCHAR(20)  NOT NULL DEFAULT 'Asignado',
    nombre_comprador    VARCHAR(150) NULL,
    talla_tshirt        VARCHAR(5)   NULL,
    monto               DECIMAL(10,2) NULL,
    metodo_pago         VARCHAR(30)  NULL,
    fecha_asignacion    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_confirmacion  DATETIME     NULL,
    observacion         VARCHAR(500) NULL,
    CONSTRAINT fk_boleto_alumno       FOREIGN KEY (alumno_id)       REFERENCES alumnos_vendedores(id) ON DELETE CASCADE,
    CONSTRAINT fk_boleto_participante FOREIGN KEY (participante_id) REFERENCES participantes(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
