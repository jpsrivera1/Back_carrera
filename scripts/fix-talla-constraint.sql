-- =============================================================
-- fix-talla-constraint.sql
-- Actualiza el constraint de talla_tshirt en la tabla participantes
-- para incluir tallas numéricas de niño: 4, 6, 8, 10, 12, 14
--
-- Ejecutar en: Supabase SQL Editor (PostgreSQL)
-- =============================================================

-- 1. Eliminar el constraint actual
ALTER TABLE participantes
  DROP CONSTRAINT IF EXISTS participantes_talla_tshirt_check;

-- 2. Agregar el nuevo constraint con tallas numéricas y de letra
ALTER TABLE participantes
  ADD CONSTRAINT participantes_talla_tshirt_check
  CHECK (talla_tshirt IN ('4','6','8','10','12','14','XS','S','M','L','XL','XXL'));
