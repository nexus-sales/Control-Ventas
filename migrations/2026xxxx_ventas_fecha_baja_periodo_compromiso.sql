-- Migración: soporte de decomisiones sin entidad Cliente separada (Decisión 1 del Council).
-- calcularDecomisiones() ahora lee fecha_baja/periodo_compromiso directamente de la venta.
-- Renombra este archivo con la fecha real antes de ejecutarlo si sigues una convención
-- de versionado de migraciones (ej. supabase migration new).

ALTER TABLE public.ventas_cv
  ADD COLUMN IF NOT EXISTS fecha_baja DATE,
  ADD COLUMN IF NOT EXISTS periodo_compromiso INTEGER;

COMMENT ON COLUMN public.ventas_cv.fecha_baja IS
  'Fecha en que el cliente canceló el servicio de esta venta, si aplica. NULL mientras el cliente sigue activo o no se ha registrado la baja.';
COMMENT ON COLUMN public.ventas_cv.periodo_compromiso IS
  'Meses de permanencia pactados con el operador para esta venta. NULL si no aplica o no se ha registrado.';

-- Verificación post-migración:
-- SELECT column_name, data_type, is_nullable
-- FROM information_schema.columns
-- WHERE table_name = 'ventas_cv' AND column_name IN ('fecha_baja', 'periodo_compromiso');
