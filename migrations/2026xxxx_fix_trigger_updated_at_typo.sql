-- Fix: la función update_updated_at_column() (usada por el trigger
-- "update_<tabla>_updated_at" en TODAS las tablas _cv) tenía en producción
-- un typo: `NEW.updatedAt` en vez de `NEW.updated_at`. Postgres pliega los
-- identificadores sin comillas a minúsculas, así que `updatedAt` se convertía
-- en `updatedat` — una columna que no existe en ninguna tabla — y el trigger
-- fallaba con 42703 "record 'new' has no field 'updatedat'" cada vez que un
-- UPDATE (o un upsert con ON CONFLICT DO UPDATE) tocaba una fila.
--
-- HALLAZGO (2026-07-04, sesión de diagnóstico en vivo): esto es la causa raíz
-- real de que nada se sincronizara — no las columnas que se añadieron en
-- 2026xxxx_operadores_productos_reglas_columnas_faltantes.sql (esas también
-- hacían falta, pero no eran el bloqueo principal). Como el trigger dispara
-- en UPDATE, cualquier `upsert` cuyo array incluyera aunque fuera una sola
-- fila ya existente fallaba, y ese fallo abortaba el INSERT/UPDATE completo
-- del lote — arrastrando también a las filas nuevas que sí habrían
-- funcionado solas. Por eso parecía que "nada" se guardaba en Supabase:
-- casi cualquier guardado real (edición, importación con auto-creación,
-- alta de reglas) mezclaba filas nuevas y filas repetidas en el mismo envío.
--
-- No se sabe cómo llegó `updatedAt` a producción (no está en
-- supabase-setup-cv-REAL.sql, que sí usa `NEW.updated_at` correctamente) —
-- probablemente un CREATE OR REPLACE FUNCTION suelto ejecutado manualmente
-- en algún momento, o una función generada por el Table Editor de Supabase.
--
-- Como es una única función compartida por el trigger de las ~10 tablas _cv
-- (ventas, colaboradores, productos, operadores, zonas, niveles, reglas,
-- liquidaciones, decomisiones, custom_fields), este único CREATE OR REPLACE
-- corrige el guardado en todas ellas a la vez.
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
