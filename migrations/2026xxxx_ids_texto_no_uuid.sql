-- Migración: cambiar id (y las foreign keys que apuntan a él) de UUID a TEXT
-- en las tablas que la app rellena con IDs legibles generados en el cliente.
--
-- HALLAZGO: ningún dato de esta app ha sincronizado nunca con Supabase, ni por
-- importación de Excel ni por alta manual. Confirmado en vivo (lectura +
-- inserts de prueba con la service_role key, sin dejar filas escritas):
--   POST colaboradores_cv {"id":"colab_test_diagnostico_0001", ...}
--     -> 22P02 invalid input syntax for type uuid
--   POST ventas_cv {"id":"venta_cliente1_12345678_0001", ...}
--     -> 22P02 invalid input syntax for type uuid
--   POST niveles_cv {"id":"GOLD", ...}
--     -> 22P02 invalid input syntax for type uuid
--
-- Causa: el esquema (supabase-setup-cv-REAL.sql) define id UUID PRIMARY KEY en
-- todas las tablas _cv, pero la app entera usa IDs de texto legibles como
-- identificador local (useImportGestion.js genera "colab_juanperez_...",
-- "venta_cliente1_..."; los niveles se crean a mano con id tipo "GOLD" desde
-- NivelEditModal.jsx). syncCollectionToSupabase (AppContexts.jsx) manda ese id
-- tal cual en el upsert, y Postgres lo rechaza siempre — el guardado local
-- funciona, la subida a Supabase no ha funcionado nunca para estas 9 tablas.
--
-- Alcance: operadores_cv, zonas_cv, niveles_cv, colaboradores_cv, productos_cv,
-- ventas_cv, reglas_cv, liquidaciones_cv, decomisiones_cv. NO toca
-- usuarios_cv (su id/user_id son de Supabase Auth, no los genera la app) ni
-- empresa_config_cv/custom_fields_cv (la app no los sincroniza hoy: 'empresas'
-- en STORAGE_KEYS apunta a una tabla "empresas_cv" que ni siquiera existe —
-- aparte, revisar si hace falta corregir ese nombre de tabla).
--
-- Todas las tablas afectadas están vacías en producción (confirmado en el
-- diagnóstico de esta sesión), así que USING id::text no pierde ningún dato
-- real. Las únicas filas existentes son las semillas de niveles_cv y zonas_cv
-- que inserta el propio script de setup (BASIC/STANDARD/PREMIUM/VIP,
-- Península/Canarias/Ceuta/Melilla) con id UUID autogenerado. La sección 5
-- las borra: si no se borran, cuando la app sincronice sus propios niveles/
-- zonas (con id tipo "BASIC" o "zona_canarias_...") creará filas NUEVAS junto
-- a estas semillas en vez de sustituirlas, y quedarían duplicadas por nombre.
--
-- IMPORTANTE — dependencia externa a este SQL: antes de que la app sincronice
-- zonas por primera vez, corrige cv_zonas_v3 en localStorage (consola del
-- navegador, en la pestaña de la app) para que CANARIAS/PENINSULA tengan
-- impuesto_tipo/impuesto_pct correctos — si no, sincronizarán sin ese dato y
-- baseFromPVP (calculos.js) las tratará como impuesto 0. Esto es aparte de
-- este archivo, no lo hace este SQL.
--
-- IMPORTANTE: ejecuta esto en una única transacción (el editor SQL de
-- Supabase ya lo hace por defecto al pegar todo el bloque de una vez).

-- ============================================================================
-- 1. Quitar todas las foreign keys de las tablas que referencian las columnas
--    que vamos a retipar. Se buscan dinámicamente para no depender de que los
--    nombres de constraint autogenerados por Postgres coincidan con lo que
--    creó el script original.
-- ============================================================================
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
        EXECUTE format('ALTER TABLE %s DROP CONSTRAINT %I', r.tbl, r.conname);
    END LOOP;
END $$;

-- ============================================================================
-- 2. Cambiar id y las FKs de UUID a TEXT. USING id::text conserva el valor
--    (una UUID también es una cadena válida) para las filas semilla que ya
--    existan.
-- ============================================================================
ALTER TABLE public.operadores_cv   ALTER COLUMN id TYPE TEXT USING id::text;
ALTER TABLE public.zonas_cv        ALTER COLUMN id TYPE TEXT USING id::text;
ALTER TABLE public.niveles_cv      ALTER COLUMN id TYPE TEXT USING id::text;

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

-- ============================================================================
-- 3. Quitar el DEFAULT uuid_generate_v4() de los id — a partir de ahora el id
--    siempre lo genera el cliente (generateReadableId, o el texto que escribe
--    el admin en el caso de niveles), Postgres ya no debe intentar rellenarlo.
-- ============================================================================
ALTER TABLE public.operadores_cv    ALTER COLUMN id DROP DEFAULT;
ALTER TABLE public.zonas_cv         ALTER COLUMN id DROP DEFAULT;
ALTER TABLE public.niveles_cv       ALTER COLUMN id DROP DEFAULT;
ALTER TABLE public.colaboradores_cv ALTER COLUMN id DROP DEFAULT;
ALTER TABLE public.productos_cv     ALTER COLUMN id DROP DEFAULT;
ALTER TABLE public.ventas_cv        ALTER COLUMN id DROP DEFAULT;
ALTER TABLE public.reglas_cv        ALTER COLUMN id DROP DEFAULT;
ALTER TABLE public.liquidaciones_cv ALTER COLUMN id DROP DEFAULT;
ALTER TABLE public.decomisiones_cv  ALTER COLUMN id DROP DEFAULT;

-- ============================================================================
-- 4. Recrear las foreign keys, ahora TEXT contra TEXT.
-- ============================================================================
ALTER TABLE public.colaboradores_cv
    ADD CONSTRAINT colaboradores_cv_nivel_id_fkey FOREIGN KEY (nivel_id) REFERENCES public.niveles_cv(id),
    ADD CONSTRAINT colaboradores_cv_zona_id_fkey  FOREIGN KEY (zona_id)  REFERENCES public.zonas_cv(id);

ALTER TABLE public.productos_cv
    ADD CONSTRAINT productos_cv_operador_id_fkey FOREIGN KEY (operador_id) REFERENCES public.operadores_cv(id);

ALTER TABLE public.ventas_cv
    ADD CONSTRAINT ventas_cv_colaborador_id_fkey FOREIGN KEY (colaborador_id) REFERENCES public.colaboradores_cv(id),
    ADD CONSTRAINT ventas_cv_producto_id_fkey    FOREIGN KEY (producto_id)    REFERENCES public.productos_cv(id),
    ADD CONSTRAINT ventas_cv_operador_id_fkey    FOREIGN KEY (operador_id)    REFERENCES public.operadores_cv(id),
    ADD CONSTRAINT ventas_cv_zona_id_fkey        FOREIGN KEY (zona_id)        REFERENCES public.zonas_cv(id);

ALTER TABLE public.reglas_cv
    ADD CONSTRAINT reglas_cv_producto_id_fkey FOREIGN KEY (producto_id) REFERENCES public.productos_cv(id),
    ADD CONSTRAINT reglas_cv_operador_id_fkey FOREIGN KEY (operador_id) REFERENCES public.operadores_cv(id),
    ADD CONSTRAINT reglas_cv_nivel_id_fkey    FOREIGN KEY (nivel_id)    REFERENCES public.niveles_cv(id),
    ADD CONSTRAINT reglas_cv_zona_id_fkey     FOREIGN KEY (zona_id)     REFERENCES public.zonas_cv(id);

ALTER TABLE public.liquidaciones_cv
    ADD CONSTRAINT liquidaciones_cv_colaborador_id_fkey FOREIGN KEY (colaborador_id) REFERENCES public.colaboradores_cv(id);

ALTER TABLE public.decomisiones_cv
    ADD CONSTRAINT decomisiones_cv_venta_id_fkey       FOREIGN KEY (venta_id)       REFERENCES public.ventas_cv(id),
    ADD CONSTRAINT decomisiones_cv_colaborador_id_fkey FOREIGN KEY (colaborador_id) REFERENCES public.colaboradores_cv(id);

-- ============================================================================
-- 5. Borrar las semillas de niveles_cv y zonas_cv (id UUID-como-texto,
--    huérfano). Ambas tablas están confirmadas sin ninguna fila real
--    enganchada a estos IDs todavía (colaboradores_cv/ventas_cv siguen
--    vacías), así que no hay ninguna FK real que se quede colgada al
--    borrarlas.
-- ============================================================================
DELETE FROM public.niveles_cv WHERE nombre IN ('BASIC','STANDARD','PREMIUM','VIP');
DELETE FROM public.zonas_cv WHERE nombre IN ('Península','Canarias','Ceuta','Melilla');

-- ============================================================================
-- PENDIENTE APARTE (no lo hace este SQL, no bloquea esta migración):
--
-- 1. 'empresas' en STORAGE_KEYS (AppContexts.jsx) sincroniza contra una tabla
--    "empresas_cv" que no existe en este esquema (solo existe
--    "empresa_config_cv", singleton, con su propia política RLS). Cualquier
--    guardado de esa colección falla con 404 de PostgREST, no con el error de
--    UUID de esta migración — es un problema aparte, sin tocar todavía.
--
-- 2. 'clientes' en STORAGE_KEYS apunta a "clientes_cv", que tampoco existe en
--    este esquema — mismo tipo de problema que el punto 1, sin tocar.
-- ============================================================================
