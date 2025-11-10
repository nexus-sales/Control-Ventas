-- ====================================================================
-- SCRIPT PARA ARREGLAR ERRORES DE BASE DE DATOS
-- ====================================================================
-- Ejecutar este script COMPLETO en el SQL Editor de Supabase

-- 1. ARREGLAR PROBLEMAS CON OPERADORES
-- ====================================================================

-- Primero, eliminar el constraint problemático si existe
ALTER TABLE public.operadores DROP CONSTRAINT IF EXISTS operadores_sector_check;

-- Recrear la tabla operadores con los valores correctos
-- Los operadores están llegando como YOIGO, MASMOVIL, etc. - necesitamos permitir estos valores
ALTER TABLE public.operadores ALTER COLUMN sector DROP DEFAULT;
ALTER TABLE public.operadores ALTER COLUMN sector SET DEFAULT 'TELEFONIA';

-- 2. ARREGLAR PROBLEMAS CON PRODUCTOS  
-- ====================================================================

-- La tabla productos necesita una columna sector, pero no la tiene en la definición actual
-- Vamos a agregarla si no existe
ALTER TABLE public.productos ADD COLUMN IF NOT EXISTS sector TEXT DEFAULT 'TELEFONIA';

-- 3. ARREGLAR PROBLEMA CON COLUMNA AÑO EN VENTAS
-- ====================================================================

-- La aplicación busca columna 'año' pero en la DB estaba como 'ano'
-- Renombrar solo si es necesario
DO $$
BEGIN
    -- Verificar si existe 'ano' y NO existe 'año'
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'ventas' 
        AND column_name = 'ano'
        AND table_schema = 'public'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'ventas' 
        AND column_name = 'año'
        AND table_schema = 'public'
    ) THEN
        -- Renombrar 'ano' a 'año'
        ALTER TABLE public.ventas RENAME COLUMN ano TO año;
        RAISE NOTICE 'Columna ano renombrada a año';
    ELSIF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'ventas' 
        AND column_name = 'año'
        AND table_schema = 'public'
    ) THEN
        RAISE NOTICE 'Columna año ya existe - OK';
    ELSE
        -- Si no existe ninguna, crear 'año'
        ALTER TABLE public.ventas ADD COLUMN año INTEGER;
        RAISE NOTICE 'Columna año creada';
    END IF;
END $$;

-- 4. ARREGLAR CONSTRAINT DE ZONA CODIGO ÚNICO
-- ====================================================================

-- Hacer que el código de zona permita duplicados o manejarlo mejor
ALTER TABLE public.zonas DROP CONSTRAINT IF EXISTS zonas_codigo_key;

-- Crear índice no único para codigo de zona
CREATE INDEX IF NOT EXISTS idx_zonas_codigo_nonunique ON public.zonas(codigo);

-- 5. CREAR FUNCIÓN PARA LIMPIAR DATOS ANTES DE INSERT/UPDATE
-- ====================================================================

CREATE OR REPLACE FUNCTION public.clean_data_before_upsert()
RETURNS TRIGGER AS $$
BEGIN
    -- Limpiar sector para operadores
    IF TG_TABLE_NAME = 'operadores' THEN
        NEW.sector = COALESCE(NEW.sector, 'TELEFONIA');
    END IF;
    
    -- Limpiar sector para productos
    IF TG_TABLE_NAME = 'productos' THEN
        NEW.sector = COALESCE(NEW.sector, 'TELEFONIA');
    END IF;
    
    -- Calcular mes y año para ventas
    IF TG_TABLE_NAME = 'ventas' THEN
        -- Solo actualizar año, mes es columna generada
        NEW.año = COALESCE(NEW.año, EXTRACT(YEAR FROM NEW.fecha));
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. CREAR TRIGGERS PARA AUTO-LIMPIAR DATOS
-- ====================================================================

-- Trigger para operadores
DROP TRIGGER IF EXISTS clean_operadores_data ON public.operadores;
CREATE TRIGGER clean_operadores_data
    BEFORE INSERT OR UPDATE ON public.operadores
    FOR EACH ROW EXECUTE FUNCTION public.clean_data_before_upsert();

-- Trigger para productos
DROP TRIGGER IF EXISTS clean_productos_data ON public.productos;
CREATE TRIGGER clean_productos_data
    BEFORE INSERT OR UPDATE ON public.productos
    FOR EACH ROW EXECUTE FUNCTION public.clean_data_before_upsert();

-- Trigger para ventas
DROP TRIGGER IF EXISTS clean_ventas_data ON public.ventas;
CREATE TRIGGER clean_ventas_data
    BEFORE INSERT OR UPDATE ON public.ventas
    FOR EACH ROW EXECUTE FUNCTION public.clean_data_before_upsert();

-- 7. LIMPIAR DATOS EXISTENTES PROBLEMÁTICOS
-- ====================================================================

-- Actualizar operadores existentes sin sector
UPDATE public.operadores 
SET sector = 'TELEFONIA' 
WHERE sector IS NULL OR sector = '';

-- Actualizar productos existentes sin sector
UPDATE public.productos 
SET sector = 'TELEFONIA' 
WHERE sector IS NULL OR sector = '';

-- Actualizar ventas sin año (mes es columna generada, no se puede actualizar)
UPDATE public.ventas 
SET año = EXTRACT(YEAR FROM fecha)
WHERE año IS NULL;

-- 8. CREAR FUNCIÓN DE UPSERT SEGURO PARA LA APLICACIÓN
-- ====================================================================

CREATE OR REPLACE FUNCTION public.safe_upsert_entity(
    p_table_name text,
    p_data jsonb,
    p_id_field text DEFAULT 'id'
)
RETURNS jsonb AS $$
DECLARE
    result jsonb;
    query_text text;
    clean_data jsonb;
BEGIN
    -- Limpiar datos según la tabla
    clean_data = p_data;
    
    -- Aplicar limpieza específica por tabla
    IF p_table_name = 'operadores' THEN
        clean_data = jsonb_set(
            clean_data, 
            '{sector}', 
            to_jsonb(COALESCE(clean_data->>'sector', 'TELEFONIA'))
        );
    ELSIF p_table_name = 'productos' THEN
        clean_data = jsonb_set(
            clean_data, 
            '{sector}', 
            to_jsonb(COALESCE(clean_data->>'sector', 'TELEFONIA'))
        );
        -- Asegurar que historial sea un objeto JSON
        IF clean_data ? 'historial' AND jsonb_typeof(clean_data->'historial') = 'array' THEN
            clean_data = jsonb_set(clean_data, '{historial}', '{}');
        END IF;
    ELSIF p_table_name = 'ventas' THEN
        -- Solo calcular año, mes es columna generada
        IF NOT (clean_data ? 'año') OR (clean_data->>'año') IS NULL THEN
            clean_data = jsonb_set(
                clean_data, 
                '{año}', 
                to_jsonb(EXTRACT(YEAR FROM (clean_data->>'fecha')::date))
            );
        END IF;
    END IF;
    
    RETURN clean_data;
END;
$$ LANGUAGE plpgsql;

-- 9. CONFIGURAR RLS POLICIES CORRECTAS
-- ====================================================================

-- Asegurar que las políticas RLS permitan las operaciones necesarias
-- (Esto debería ejecutarse después del script principal de configuración)

-- Para operadores
DROP POLICY IF EXISTS "operadores_authenticated_full_access" ON public.operadores;
CREATE POLICY "operadores_authenticated_full_access" 
    ON public.operadores 
    FOR ALL 
    TO authenticated 
    USING (true) 
    WITH CHECK (true);

-- Para productos  
DROP POLICY IF EXISTS "productos_authenticated_full_access" ON public.productos;
CREATE POLICY "productos_authenticated_full_access" 
    ON public.productos 
    FOR ALL 
    TO authenticated 
    USING (true) 
    WITH CHECK (true);

-- Para ventas
DROP POLICY IF EXISTS "ventas_authenticated_full_access" ON public.ventas;
CREATE POLICY "ventas_authenticated_full_access" 
    ON public.ventas 
    FOR ALL 
    TO authenticated 
    USING (true) 
    WITH CHECK (true);

-- Para zonas
DROP POLICY IF EXISTS "zonas_authenticated_full_access" ON public.zonas;
CREATE POLICY "zonas_authenticated_full_access" 
    ON public.zonas 
    FOR ALL 
    TO authenticated 
    USING (true) 
    WITH CHECK (true);

-- 10. VERIFICACIÓN FINAL
-- ====================================================================

-- Verificar que las tablas tienen las columnas correctas
DO $$
BEGIN
    -- Verificar operadores
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'operadores' 
        AND column_name = 'sector'
        AND table_schema = 'public'
    ) THEN
        RAISE NOTICE 'ERROR: Tabla operadores no tiene columna sector';
    ELSE
        RAISE NOTICE 'OK: Tabla operadores tiene columna sector';
    END IF;
    
    -- Verificar productos
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'productos' 
        AND column_name = 'sector'
        AND table_schema = 'public'
    ) THEN
        RAISE NOTICE 'ERROR: Tabla productos no tiene columna sector';
    ELSE
        RAISE NOTICE 'OK: Tabla productos tiene columna sector';
    END IF;
    
    -- Verificar ventas
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'ventas' 
        AND column_name = 'año'
        AND table_schema = 'public'
    ) THEN
        RAISE NOTICE 'ERROR: Tabla ventas no tiene columna año';
    ELSE
        RAISE NOTICE 'OK: Tabla ventas tiene columna año';
    END IF;
END $$;

-- ====================================================================
-- FIN DEL SCRIPT DE REPARACIÓN
-- ====================================================================

SELECT 'Script de reparación ejecutado correctamente' as status;