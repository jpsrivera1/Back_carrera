-- =============================================================
-- fix-cupos-trigger.sql
-- Corrige el trigger de validación de cupos en Supabase
-- para que SOLO cuente participantes con estado = 'Activo'.
--
-- El trigger anterior contaba TODOS los registros (incluyendo
-- cancelados), bloqueando incorrectamente nuevas inscripciones
-- aunque hubiera cupos reales disponibles.
--
-- Ejecutar en: Supabase SQL Editor (PostgreSQL)
-- =============================================================

-- ─── DIAGNÓSTICO PREVIO ─────────────────────────────────────
-- (Opcional) Ver cuántos participantes hay por estado:
-- SELECT estado, COUNT(*) AS total FROM participantes GROUP BY estado;

-- ─── 1. Reemplazar la función del trigger ───────────────────
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
    RAISE EXCEPTION 'No hay cupos disponibles. El límite máximo general es de 200 cupos.';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ─── 2. Verificar que el trigger sigue enlazado ─────────────
-- Si el trigger fue eliminado, volver a crearlo:
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'trg_check_cupos'
      AND tgrelid = 'participantes'::regclass
  ) THEN
    CREATE TRIGGER trg_check_cupos
    BEFORE INSERT ON participantes
    FOR EACH ROW
    EXECUTE FUNCTION check_cupos_disponibles();
  END IF;
END;
$$;
