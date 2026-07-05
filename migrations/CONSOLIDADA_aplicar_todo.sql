-- =============================================================================
-- MIGRACIÓN CONSOLIDADA CONTROL DE VENTAS
-- Aplica TODAS las columnas y cambios pendientes de una sola vez.
-- Seguro de re-ejecutar: usa IF NOT EXISTS donde aplica y bloques DO para FKs.
-- =============================================================================

-- ============================================================================
-- A. IDs TEXT (en lugar de UUID) en todas las tablas gestionadas por la app
-- ============================================================================

-- 1. Quitar TODAS las FKs de las tablas afectadas (para poder retipar los ids)
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN
        SELECT conname, conrelid::regclass AS tbl
        FROM pg_constraint
        WHERE contype = 'f'
        AND conrelid IN (
            'public.colaboradores_cv'::regclass,
            'public.productos_cv'::regclass,
            'public.ventas_cv'::regclass,
            'public.reglas_cv'::regclass,
            'public.liquidaciones_cv'::regclass,
            'public.decomisiones_cv'::regclass
        )
    LOOP
        EXECUTE format('ALTER TABLE %s DROP CONSTRAINT IF EXISTS %I', r.tbl, r.conname);
    END LOOP;
END $$;

-- 2. Cambiar columnas id (y FKs) de UUID a TEXT
ALTER TABLE public.operadores_cv    ALTER COLUMN id TYPE TEXT USING id::text;
ALTER TABLE public.zonas_cv         ALTER COLUMN id TYPE TEXT USING id::text;
ALTER TABLE public.niveles_cv       ALTER COLUMN id TYPE TEXT USING id::text;

ALTER TABLE public.colaboradores_cv ALTER COLUMN id       TYPE TEXT USING id::text;
ALTER TABLE public.colaboradores_cv ALTER COLUMN nivel_id TYPE TEXT USING nivel_id::text;
ALTER TABLE public.colaboradores_cv ALTER COLUMN zona_id  TYPE TEXT USING zona_id::text;

ALTER TABLE public.productos_cv ALTER COLUMN id          TYPE TEXT USING id::text;
ALTER TABLE public.productos_cv ALTER COLUMN operador_id TYPE TEXT USING operador_id::text;

ALTER TABLE public.ventas_cv ALTER COLUMN id             TYPE TEXT USING id::text;
ALTER TABLE public.ventas_cv ALTER COLUMN colaborador_id TYPE TEXT USING colaborador_id::text;
ALTER TABLE public.ventas_cv ALTER COLUMN producto_id    TYPE TEXT USING producto_id::text;
ALTER TABLE public.ventas_cv ALTER COLUMN operador_id    TYPE TEXT USING operador_id::text;
ALTER TABLE public.ventas_cv ALTER COLUMN zona_id        TYPE TEXT USING zona_id::text;

ALTER TABLE public.reglas_cv ALTER COLUMN id          TYPE TEXT USING id::text;
ALTER TABLE public.reglas_cv ALTER COLUMN producto_id TYPE TEXT USING producto_id::text;
ALTER TABLE public.reglas_cv ALTER COLUMN operador_id TYPE TEXT USING operador_id::text;
ALTER TABLE public.reglas_cv ALTER COLUMN nivel_id    TYPE TEXT USING nivel_id::text;
ALTER TABLE public.reglas_cv ALTER COLUMN zona_id     TYPE TEXT USING zona_id::text;

ALTER TABLE public.liquidaciones_cv ALTER COLUMN id             TYPE TEXT USING id::text;
ALTER TABLE public.liquidaciones_cv ALTER COLUMN colaborador_id TYPE TEXT USING colaborador_id::text;

ALTER TABLE public.decomisiones_cv ALTER COLUMN id             TYPE TEXT USING id::text;
ALTER TABLE public.decomisiones_cv ALTER COLUMN venta_id       TYPE TEXT USING venta_id::text;
ALTER TABLE public.decomisiones_cv ALTER COLUMN colaborador_id TYPE TEXT USING colaborador_id::text;

-- 3. Quitar DEFAULT uuid_generate_v4() — la app genera los IDs, no Postgres
ALTER TABLE public.operadores_cv    ALTER COLUMN id DROP DEFAULT;
ALTER TABLE public.zonas_cv         ALTER COLUMN id DROP DEFAULT;
ALTER TABLE public.niveles_cv       ALTER COLUMN id DROP DEFAULT;
ALTER TABLE public.colaboradores_cv ALTER COLUMN id DROP DEFAULT;
ALTER TABLE public.productos_cv     ALTER COLUMN id DROP DEFAULT;
ALTER TABLE public.ventas_cv        ALTER COLUMN id DROP DEFAULT;
ALTER TABLE public.reglas_cv        ALTER COLUMN id DROP DEFAULT;
ALTER TABLE public.liquidaciones_cv ALTER COLUMN id DROP DEFAULT;
ALTER TABLE public.decomisiones_cv  ALTER COLUMN id DROP DEFAULT;

-- 4. Recrear FKs como TEXT → TEXT
--    (usando DO para que no falle si ya existen de una ejecución anterior)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'colaboradores_cv_nivel_id_fkey') THEN
        ALTER TABLE public.colaboradores_cv ADD CONSTRAINT colaboradores_cv_nivel_id_fkey
            FOREIGN KEY (nivel_id) REFERENCES public.niveles_cv(id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'colaboradores_cv_zona_id_fkey') THEN
        ALTER TABLE public.colaboradores_cv ADD CONSTRAINT colaboradores_cv_zona_id_fkey
            FOREIGN KEY (zona_id) REFERENCES public.zonas_cv(id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'productos_cv_operador_id_fkey') THEN
        ALTER TABLE public.productos_cv ADD CONSTRAINT productos_cv_operador_id_fkey
            FOREIGN KEY (operador_id) REFERENCES public.operadores_cv(id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ventas_cv_colaborador_id_fkey') THEN
        ALTER TABLE public.ventas_cv ADD CONSTRAINT ventas_cv_colaborador_id_fkey
            FOREIGN KEY (colaborador_id) REFERENCES public.colaboradores_cv(id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ventas_cv_producto_id_fkey') THEN
        ALTER TABLE public.ventas_cv ADD CONSTRAINT ventas_cv_producto_id_fkey
            FOREIGN KEY (producto_id) REFERENCES public.productos_cv(id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ventas_cv_operador_id_fkey') THEN
        ALTER TABLE public.ventas_cv ADD CONSTRAINT ventas_cv_operador_id_fkey
            FOREIGN KEY (operador_id) REFERENCES public.operadores_cv(id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ventas_cv_zona_id_fkey') THEN
        ALTER TABLE public.ventas_cv ADD CONSTRAINT ventas_cv_zona_id_fkey
            FOREIGN KEY (zona_id) REFERENCES public.zonas_cv(id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'reglas_cv_producto_id_fkey') THEN
        ALTER TABLE public.reglas_cv ADD CONSTRAINT reglas_cv_producto_id_fkey
            FOREIGN KEY (producto_id) REFERENCES public.productos_cv(id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'reglas_cv_operador_id_fkey') THEN
        ALTER TABLE public.reglas_cv ADD CONSTRAINT reglas_cv_operador_id_fkey
            FOREIGN KEY (operador_id) REFERENCES public.operadores_cv(id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'reglas_cv_nivel_id_fkey') THEN
        ALTER TABLE public.reglas_cv ADD CONSTRAINT reglas_cv_nivel_id_fkey
            FOREIGN KEY (nivel_id) REFERENCES public.niveles_cv(id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'reglas_cv_zona_id_fkey') THEN
        ALTER TABLE public.reglas_cv ADD CONSTRAINT reglas_cv_zona_id_fkey
            FOREIGN KEY (zona_id) REFERENCES public.zonas_cv(id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'liquidaciones_cv_colaborador_id_fkey') THEN
        ALTER TABLE public.liquidaciones_cv ADD CONSTRAINT liquidaciones_cv_colaborador_id_fkey
            FOREIGN KEY (colaborador_id) REFERENCES public.colaboradores_cv(id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'decomisiones_cv_venta_id_fkey') THEN
        ALTER TABLE public.decomisiones_cv ADD CONSTRAINT decomisiones_cv_venta_id_fkey
            FOREIGN KEY (venta_id) REFERENCES public.ventas_cv(id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'decomisiones_cv_colaborador_id_fkey') THEN
        ALTER TABLE public.decomisiones_cv ADD CONSTRAINT decomisiones_cv_colaborador_id_fkey
            FOREIGN KEY (colaborador_id) REFERENCES public.colaboradores_cv(id);
    END IF;
END $$;

-- 5. Borrar semillas antiguas (id UUID-como-texto) de niveles y zonas
--    La app las recreará con sus propios IDs al sincronizar.
DELETE FROM public.niveles_cv WHERE nombre IN ('BASIC','STANDARD','PREMIUM','VIP');
DELETE FROM public.zonas_cv   WHERE nombre IN ('Península','Canarias','Ceuta','Melilla');

-- ============================================================================
-- B. COLUMNAS EXTRA EN ventas_cv
-- ============================================================================

-- B1. documento — referencia de contrato en papel (distinto de numeracion)
ALTER TABLE public.ventas_cv ADD COLUMN IF NOT EXISTS documento TEXT;

-- B2. customFields — campos personalizados definidos en Config → Campos personalizados
--     OJO: nombre en camelCase con comillas dobles (Postgres es case-sensitive con comillas)
ALTER TABLE public.ventas_cv ADD COLUMN IF NOT EXISTS "customFields" JSONB DEFAULT '{}'::jsonb;

-- B3. fecha_baja / periodo_compromiso — para cálculo de decomisiones
ALTER TABLE public.ventas_cv ADD COLUMN IF NOT EXISTS fecha_baja         DATE;
ALTER TABLE public.ventas_cv ADD COLUMN IF NOT EXISTS periodo_compromiso INTEGER;

-- ============================================================================
-- C. COLUMNAS EXTRA EN operadores_cv, productos_cv, reglas_cv
-- ============================================================================

-- C1. operadores_cv — reglas de decomisión
ALTER TABLE public.operadores_cv ADD COLUMN IF NOT EXISTS reglas_decomision   JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.operadores_cv ADD COLUMN IF NOT EXISTS fecha_actualizacion TIMESTAMPTZ;

-- C2. productos_cv — vigencia e histórico de comisiones
ALTER TABLE public.productos_cv ADD COLUMN IF NOT EXISTS comision_vigencia_desde      DATE;
ALTER TABLE public.productos_cv ADD COLUMN IF NOT EXISTS comision_vigencia_hasta      DATE;
ALTER TABLE public.productos_cv ADD COLUMN IF NOT EXISTS comision_cliente_nuevo       DECIMAL(12,4);
ALTER TABLE public.productos_cv ADD COLUMN IF NOT EXISTS comision_cliente_existente   DECIMAL(12,4);
ALTER TABLE public.productos_cv ADD COLUMN IF NOT EXISTS comision_portabilidad        DECIMAL(12,4);
ALTER TABLE public.productos_cv ADD COLUMN IF NOT EXISTS comision_alta_nueva          DECIMAL(12,4);
ALTER TABLE public.productos_cv ADD COLUMN IF NOT EXISTS comision_fija                DECIMAL(12,4);
ALTER TABLE public.productos_cv ADD COLUMN IF NOT EXISTS comision_porcentaje          DECIMAL(12,4);
ALTER TABLE public.productos_cv ADD COLUMN IF NOT EXISTS comisiones_historial         JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.productos_cv ADD COLUMN IF NOT EXISTS fecha_actualizacion          TIMESTAMPTZ;

-- C3. reglas_cv — sector
ALTER TABLE public.reglas_cv ADD COLUMN IF NOT EXISTS sector TEXT;

-- ============================================================================
-- D. IDs TEXT en empresa_config_cv y custom_fields_cv
-- ============================================================================
ALTER TABLE public.empresa_config_cv ALTER COLUMN id TYPE TEXT USING id::text;
ALTER TABLE public.empresa_config_cv ALTER COLUMN id DROP DEFAULT;

ALTER TABLE public.custom_fields_cv ALTER COLUMN id TYPE TEXT USING id::text;
ALTER TABLE public.custom_fields_cv ALTER COLUMN id DROP DEFAULT;

-- ============================================================================
-- VERIFICACIÓN POST-MIGRACIÓN (descomentar y ejecutar aparte si quieres)
-- ============================================================================
-- SELECT column_name, data_type FROM information_schema.columns
-- WHERE table_name = 'ventas_cv' ORDER BY column_name;
--
-- SELECT table_name, column_name, data_type FROM information_schema.columns
-- WHERE table_name IN ('operadores_cv','zonas_cv','niveles_cv','colaboradores_cv',
--                      'productos_cv','ventas_cv')
-- AND column_name = 'id' ORDER BY table_name;
