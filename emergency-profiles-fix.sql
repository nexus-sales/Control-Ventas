-- ====================================================================
-- SCRIPT DE EMERGENCIA: CREAR SOLO TABLA PROFILES
-- ====================================================================
-- Ejecutar este script URGENTE en el SQL Editor de Supabase

-- 1. Crear tabla profiles
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    nombre TEXT,
    rol TEXT DEFAULT 'admin' CHECK (rol IN ('admin', 'user', 'pending', 'blocked')),
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Habilitar Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3. Política básica para permitir lectura del propio perfil
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

-- 4. Política básica para permitir actualización del propio perfil
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- 5. Función para crear perfil automáticamente
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    user_role TEXT := 'admin'; -- Por defecto admin para emergencia
    is_active BOOLEAN := true;
    user_name TEXT;
BEGIN
    -- Extraer nombre del metadata o usar email
    user_name := COALESCE(
        NEW.raw_user_meta_data->>'nombre',
        NEW.raw_user_meta_data->>'name',
        NEW.raw_user_meta_data->>'full_name',
        split_part(NEW.email, '@', 1)
    );

    -- Crear perfil
    INSERT INTO public.profiles (id, email, nombre, rol, activo)
    VALUES (
        NEW.id,
        NEW.email,
        user_name,
        user_role,
        is_active
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Trigger para crear perfil automáticamente
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 7. INSERTAR PERFIL PARA USUARIO EXISTENTE (EMERGENCIA)
-- Insertar perfil para el usuario que ya existe en auth.users
INSERT INTO public.profiles (id, email, nombre, rol, activo)
SELECT 
    id,
    email,
    COALESCE(raw_user_meta_data->>'name', split_part(email, '@', 1)) as nombre,
    'admin' as rol,
    true as activo
FROM auth.users 
WHERE email = 'info@luzmatel.com'
ON CONFLICT (id) DO UPDATE SET
    rol = EXCLUDED.rol,
    activo = EXCLUDED.activo,
    updated_at = NOW();

-- Verificar que todo funcionó
SELECT 'Tabla profiles creada correctamente' as status;
SELECT email, rol, activo FROM public.profiles WHERE email = 'info@luzmatel.com';