-- Migración: ventas_cv no tiene columna para los "campos personalizados"
-- (Config → Campos personalizados, módulo 'ventas'). VentaFormModal.jsx y
-- useImportGestion.js envían dataToSave.customFields / ventaBase.customFields
-- cuando hay algún campo personalizado relleno, pero esa columna nunca se
-- creó — mismo patrón que operadores_cv/productos_cv/reglas_cv (ver
-- 2026xxxx_operadores_productos_reglas_columnas_faltantes.sql), aquí en
-- ventas_cv. Cualquier upsert de ventas cuyo array incluya una sola venta con
-- customFields relleno hace fallar el lote COMPLETO de golpe.
--
-- OJO con las comillas: el nombre que usa el código JS es "customFields"
-- (camelCase), no "custom_fields". Postgres pliega a minúsculas los
-- identificadores SIN comillas, así que hay que crear la columna con
-- comillas dobles para conservar las mayúsculas exactas — si no, quedaría
-- como "customfields" (todo minúsculas) y PostgREST seguiría sin encontrarla,
-- porque las peticiones de supabase-js siempre piden el nombre entre
-- comillas (columns=...%22customFields%22...), que en Postgres es una
-- comparación sensible a mayúsculas/minúsculas.
ALTER TABLE public.ventas_cv
  ADD COLUMN IF NOT EXISTS "customFields" JSONB DEFAULT '{}'::jsonb;
