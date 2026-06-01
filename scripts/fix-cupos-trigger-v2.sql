-- =============================================================
-- fix-cupos-trigger-v2.sql  (DROP + RECREATE completo)
-- Elimina y recrea el trigger de validacion de cupos en Supabase
-- para que SOLO cuente participantes con estado = 'Activo'.
--
-- Ejecutar en: Supabase SQL Editor (PostgreSQL)
-- =============================================================

-- PASO 0: DIAGNOSTICO — ver cuantos participantes hay por estado
-- SELECT estado, COUNT(*) AS total FROM participantes GROUP BY estado;

-- PASO 0b: Ver todos los triggers sobre la tabla participantes
-- SELECT tgname, tgenabled FROM pg_trigger
-- WHERE tgrelid = 'participantes'::regclass;

-- PASO 1: Eliminar TODOS los posibles triggers de cupos (nombres variantes)
DROP TRIGGER IF EXISTS trg_check_cupos         ON participantes;
DROP TRIGGER IF EXISTS trg_check_cupos_insert  ON participantes;
DROP TRIGGER IF EXISTS check_cupos             ON participantes;
DROP TRIGGER IF EXISTS trg_cupos               ON participantes;
DROP TRIGGER IF EXISTS trigger_check_cupos     ON participantes;

-- PASO 2: Reemplazar la funcion del trigger
CREATE OR REPLACE FUNCTION check_cupos_disponibles()
RETURNS TRIGGER AS $$
DECLARE
  total_activos INT;
BEGIN
  -- Contar SOLO participantes activos (excluye Cancelado)
  SELECT COUNT(*) INTO total_activos
  FROM participantes
  WHERE estado = 'Activo';

  IF total_activos >= 200 THEN
    RAISE EXCEPTION 'No hay cupos disponibles. El limite maximo general es de 200 cupos.';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- PASO 3: Recrear el trigger limpio
CREATE TRIGGER trg_check_cupos
BEFORE INSERT ON participantes
FOR EACH ROW
EXECUTE FUNCTION check_cupos_disponibles();
