-- =============================================================
-- migrate-sqlserver.sql
-- Crea las tablas alumnos_vendedores y boletos_preventa
-- en SQL Server (ControlCarrera).
-- Ejecutar: sqlcmd -S localhost -E -d ControlCarrera -i scripts/migrate-sqlserver.sql
-- =============================================================

USE ControlCarrera;
GO

-- ─── alumnos_vendedores ───────────────────────────────────────
-- DROP si existe (para re-ejecutar limpio)
IF OBJECT_ID('dbo.boletos_preventa', 'U') IS NOT NULL
    DROP TABLE dbo.boletos_preventa;
GO
IF OBJECT_ID('dbo.alumnos_vendedores', 'U') IS NOT NULL
    DROP TABLE dbo.alumnos_vendedores;
GO

CREATE TABLE dbo.alumnos_vendedores (
    id                   UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
    nombre               NVARCHAR(500)    NOT NULL,
    apellidos            NVARCHAR(500)    NOT NULL,
    telefono_estudiante  VARCHAR(8)       NULL,
    nombre_encargado     NVARCHAR(500)    NOT NULL,
    telefono_encargado   NVARCHAR(50)     NOT NULL,
    grado                NVARCHAR(100)    NOT NULL,
    jornada              NVARCHAR(100)    NOT NULL,
    modalidad            NVARCHAR(100)    NOT NULL,
    fecha_nacimiento     DATE             NOT NULL,
    curso_extra_id       UNIQUEIDENTIFIER NULL,
    tipo_estudiante      NVARCHAR(50)     NOT NULL DEFAULT 'REGULAR',
    uid_tarjeta          NVARCHAR(500)    NULL,
    estado               NVARCHAR(20)     NOT NULL DEFAULT 'Activo',
    fecha_registro       DATETIME2        NOT NULL DEFAULT GETDATE(),
    CONSTRAINT UQ_alumnos_uid_tarjeta UNIQUE (uid_tarjeta)
);
GO

-- ─── boletos_preventa ────────────────────────────────────────
CREATE TABLE dbo.boletos_preventa (
    id                  INT              NOT NULL PRIMARY KEY,
    numero_boleto       INT              NULL,
    alumno_id           UNIQUEIDENTIFIER NOT NULL,
    participante_id     INT              NULL,
    categoria           NVARCHAR(10)     NULL,
    estado_boleto       NVARCHAR(20)     NOT NULL DEFAULT 'Asignado',
    nombre_comprador    NVARCHAR(150)    NULL,
    talla_tshirt        NVARCHAR(5)      NULL,
    monto               DECIMAL(10,2)    NULL,
    metodo_pago         NVARCHAR(30)     NULL,
    fecha_asignacion    DATETIME2        NOT NULL DEFAULT GETDATE(),
    fecha_confirmacion  DATETIME2        NULL,
    observacion         NVARCHAR(500)    NULL,
    CONSTRAINT FK_boleto_alumno       FOREIGN KEY (alumno_id)       REFERENCES dbo.alumnos_vendedores(id) ON DELETE CASCADE,
    CONSTRAINT FK_boleto_participante FOREIGN KEY (participante_id) REFERENCES dbo.participantes(id)
);
GO

PRINT 'Tablas alumnos_vendedores y boletos_preventa creadas correctamente en SQL Server.';
GO
