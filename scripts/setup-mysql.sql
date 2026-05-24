-- =========================================================
-- SETUP MySQL - Control Carrera 5K / 10K
-- Ejecutar como root
-- =========================================================

-- 1. Crear base de datos
CREATE DATABASE IF NOT EXISTS controlcarrera
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE controlcarrera;

-- =========================================================
-- 3. Tabla participantes
-- =========================================================
CREATE TABLE IF NOT EXISTS participantes (
    id               INT           NOT NULL,
    numero_corredor  INT,
    nombre_completo  VARCHAR(150)  NOT NULL,
    categoria        VARCHAR(10)   NOT NULL CHECK (categoria IN ('5K','10K')),
    talla_tshirt     VARCHAR(5)    NOT NULL CHECK (talla_tshirt IN ('XS','S','M','L','XL','XXL')),
    estado           VARCHAR(20)   NOT NULL DEFAULT 'Activo' CHECK (estado IN ('Activo','Cancelado')),
    fecha_inscripcion DATETIME     DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =========================================================
-- 4. Tabla pagos
-- =========================================================
CREATE TABLE IF NOT EXISTS pagos (
    id               INT            NOT NULL,
    participante_id  INT            NOT NULL,
    monto            DECIMAL(10,2)  NOT NULL DEFAULT 0,
    metodo_pago      VARCHAR(30)    CHECK (metodo_pago IN ('Efectivo','Transferencia')),
    estado_pago      VARCHAR(20)    NOT NULL DEFAULT 'Pendiente' CHECK (estado_pago IN ('Pendiente','Pagado','Anulado')),
    fecha_pago       DATETIME,
    observacion      VARCHAR(500),
    PRIMARY KEY (id),
    CONSTRAINT fk_pagos_participante FOREIGN KEY (participante_id) REFERENCES participantes(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =========================================================
-- 5. Tabla kits
-- =========================================================
CREATE TABLE IF NOT EXISTS kits (
    id               INT          NOT NULL,
    participante_id  INT          NOT NULL,
    kit_entregado    TINYINT(1)   NOT NULL DEFAULT 0,
    fecha_entrega    DATETIME,
    observacion      VARCHAR(500),
    PRIMARY KEY (id),
    CONSTRAINT fk_kits_participante FOREIGN KEY (participante_id) REFERENCES participantes(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =========================================================
-- 6. Tabla usuarios
-- =========================================================
CREATE TABLE IF NOT EXISTS usuarios (
    id                 INT          NOT NULL,
    username           VARCHAR(50)  NOT NULL UNIQUE,
    password_hash      TEXT         NOT NULL,
    nombre_completo    VARCHAR(150) NOT NULL,
    rol                VARCHAR(30)  NOT NULL DEFAULT 'Administrador' CHECK (rol IN ('Administrador','Usuario')),
    estado             VARCHAR(20)  NOT NULL DEFAULT 'Activo' CHECK (estado IN ('Activo','Inactivo')),
    fecha_registro     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    two_factor_secret  TEXT,
    two_factor_enabled TINYINT(1)   NOT NULL DEFAULT 0,
    PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

SELECT 'MySQL - controlcarrera configurado correctamente.' AS resultado;
