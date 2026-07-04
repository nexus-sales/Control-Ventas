-- Migración: añadir la columna "documento" a ventas_cv.
--
-- HALLAZGO: syncCollectionToSupabase manda "documento" en cada upsert de
-- ventas_cv (viene de VentaFormModal.jsx, campo "Contrato nº / Doc" — un
-- campo real y distinto de "numeracion", que ya tiene su propia columna).
-- La columna nunca existió en el esquema, así que todo intento de
-- sincronizar una venta fallaba con PGRST204 "Could not find the
-- 'documento' column of 'ventas_cv' in the schema cache" — confirmado en
-- vivo en la consola del navegador.
--
-- Nullable, sin default: es un campo opcional (referencia de contrato en
-- papel), igual que numeracion/observaciones.
--
-- Renombra este archivo con la fecha real antes de ejecutarlo si sigues una
-- convención de versionado de migraciones (ej. supabase migration new).

ALTER TABLE public.ventas_cv
  ADD COLUMN IF NOT EXISTS documento TEXT;

COMMENT ON COLUMN public.ventas_cv.documento IS
  'Referencia de contrato en papel u otro documento asociado a la venta. Opcional, distinto de numeracion (línea/recurso).';

-- Verificación post-migración:
-- SELECT column_name, data_type, is_nullable
-- FROM information_schema.columns
-- WHERE table_name = 'ventas_cv' AND column_name = 'documento';
