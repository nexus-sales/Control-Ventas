-- Migración: añadir columnas que la app ya envía en los upserts de
-- operadores_cv, productos_cv y reglas_cv pero que nunca se crearon en el
-- esquema (supabase-setup-cv-REAL.sql).
--
-- HALLAZGO: OperadorModal.jsx, ProductoModal.jsx y ReglaEditModal.jsx
-- incorporaron campos nuevos (reglas de decomisión, vigencia/histórico de
-- comisiones, sector de la regla) sin que nunca se creara la migración
-- correspondiente. supabase-js construye el upsert con la unión de todas las
-- claves de los objetos a enviar; si UNA sola clave no existe como columna,
-- PostgREST responde 400 "Could not find the '<columna>' column of '<tabla>'
-- in the schema cache" y rechaza el lote COMPLETO (no solo esa fila) — por
-- eso ninguna importación, alta o edición de operadores/productos/reglas
-- llegaba a guardarse en Supabase, aunque el guardado local sí funcionara.
--
-- IMPORTANTE: ejecuta esto en una única transacción (el editor SQL de
-- Supabase ya lo hace por defecto al pegar todo el bloque de una vez).
-- Todos los ALTER usan IF NOT EXISTS, así que es seguro re-ejecutar este
-- archivo si ya se aplicó parcialmente.

-- ============================================================================
-- 1. operadores_cv — reglas de decomisión (OperadorModal.jsx)
-- ============================================================================
ALTER TABLE public.operadores_cv
  ADD COLUMN IF NOT EXISTS reglas_decomision JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS fecha_actualizacion TIMESTAMPTZ;

-- ============================================================================
-- 2. productos_cv — vigencia e histórico de comisiones (ProductoModal.jsx)
-- ============================================================================
ALTER TABLE public.productos_cv
  ADD COLUMN IF NOT EXISTS comision_vigencia_desde DATE,
  ADD COLUMN IF NOT EXISTS comision_vigencia_hasta DATE,
  ADD COLUMN IF NOT EXISTS comision_cliente_nuevo DECIMAL(12,4),
  ADD COLUMN IF NOT EXISTS comision_cliente_existente DECIMAL(12,4),
  ADD COLUMN IF NOT EXISTS comision_portabilidad DECIMAL(12,4),
  ADD COLUMN IF NOT EXISTS comision_alta_nueva DECIMAL(12,4),
  ADD COLUMN IF NOT EXISTS comision_fija DECIMAL(12,4),
  ADD COLUMN IF NOT EXISTS comision_porcentaje DECIMAL(12,4),
  ADD COLUMN IF NOT EXISTS comisiones_historial JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS fecha_actualizacion TIMESTAMPTZ;

-- ============================================================================
-- 3. reglas_cv — sector (ReglaEditModal.jsx)
-- ============================================================================
ALTER TABLE public.reglas_cv
  ADD COLUMN IF NOT EXISTS sector TEXT;
