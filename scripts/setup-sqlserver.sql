-- =========================================================
-- SETUP SQL SERVER - Control Carrera 5K / 10K
-- Ejecutar como SA o con permisos de sysadmin
-- =========================================================

-- 1. Crear base de datos
IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = 'ControlCarrera')
BEGIN
    CREATE DATABASE ControlCarrera;
END
GO

USE ControlCarrera;
GO

-- =========================================================
-- 2. Crear login y usuario de aplicacion
-- =========================================================
IF NOT EXISTS (SELECT name FROM sys.server_principals WHERE name = 'carrera_app')
BEGIN
    CREATE LOGIN carrera_app WITH PASSWORD = 'Carrera2026!@#';
END
GO

IF NOT EXISTS (SELECT name FROM sys.database_principals WHERE name = 'carrera_app')
BEGIN
    CREATE USER carrera_app FOR LOGIN carrera_app;
END
GO

ALTER ROLE db_datareader ADD MEMBER carrera_app;
ALTER ROLE db_datawriter ADD MEMBER carrera_app;
GO

-- =========================================================
-- 3. Tabla participantes
-- =========================================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'participantes')
BEGIN
    CREATE TABLE participantes (
        id               INT PRIMARY KEY,
        numero_corredor  INT,
        nombre_completo  NVARCHAR(150) NOT NULL,
        categoria        NVARCHAR(10)  NOT NULL CHECK (categoria IN ('5K', '10K')),
        talla_tshirt     NVARCHAR(5)   NOT NULL CHECK (talla_tshirt IN ('XS','S','M','L','XL','XXL')),
        estado           NVARCHAR(20)  NOT NULL DEFAULT 'Activo' CHECK (estado IN ('Activo','Cancelado')),
        fecha_inscripcion DATETIME2    DEFAULT GETDATE()
    );
END
GO

-- =========================================================
-- 4. Tabla pagos
-- =========================================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'pagos')
BEGIN
    CREATE TABLE pagos (
        id               INT PRIMARY KEY,
        participante_id  INT           NOT NULL,
        monto            DECIMAL(10,2) NOT NULL DEFAULT 0,
        metodo_pago      NVARCHAR(30)  CHECK (metodo_pago IN ('Efectivo','Transferencia')),
        estado_pago      NVARCHAR(20)  NOT NULL DEFAULT 'Pendiente' CHECK (estado_pago IN ('Pendiente','Pagado','Anulado')),
        fecha_pago       DATETIME2,
        observacion      NVARCHAR(500),
        CONSTRAINT fk_pagos_participante FOREIGN KEY (participante_id) REFERENCES participantes(id)
    );
END
GO

-- =========================================================
-- 5. Tabla kits
-- =========================================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'kits')
BEGIN
    CREATE TABLE kits (
        id               INT PRIMARY KEY,
        participante_id  INT          NOT NULL,
        kit_entregado    BIT          NOT NULL DEFAULT 0,
        fecha_entrega    DATETIME2,
        observacion      NVARCHAR(500),
        CONSTRAINT fk_kits_participante FOREIGN KEY (participante_id) REFERENCES participantes(id)
    );
END
GO

-- =========================================================
-- 6. Tabla usuarios
-- =========================================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'usuarios')
BEGIN
    CREATE TABLE usuarios (
        id               INT PRIMARY KEY,
        username         NVARCHAR(50)  NOT NULL UNIQUE,
        password_hash    NVARCHAR(MAX) NOT NULL,
        nombre_completo  NVARCHAR(150) NOT NULL,
        rol              NVARCHAR(30)  NOT NULL DEFAULT 'Administrador' CHECK (rol IN ('Administrador','Usuario')),
        estado           NVARCHAR(20)  NOT NULL DEFAULT 'Activo' CHECK (estado IN ('Activo','Inactivo')),
        fecha_registro   DATETIME2     NOT NULL DEFAULT GETDATE(),
        two_factor_secret   NVARCHAR(MAX),
        two_factor_enabled  BIT        NOT NULL DEFAULT 0
    );
END
GO

-- =========================================================
-- 7. Grants adicionales para carrera_app
-- =========================================================
GRANT SELECT, INSERT, UPDATE, DELETE ON participantes TO carrera_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON pagos        TO carrera_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON kits         TO carrera_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON usuarios     TO carrera_app;
GO

PRINT 'SQL Server - ControlCarrera configurado correctamente.';
GO
