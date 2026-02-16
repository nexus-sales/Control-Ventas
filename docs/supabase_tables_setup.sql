-- ============================================================================
-- ⚠️  ARCHIVO OBSOLETO - NO USAR
-- ============================================================================
--
-- Este archivo está DEPRECADO.
--
-- Usa el archivo principal en la raíz del proyecto:
--   📁 supabase-setup-cv-REAL.sql
--
-- Ese archivo contiene:
--   ✅ Todas las tablas con sufijo _cv (para evitar conflictos con MIsapp)
--   ✅ Campos actualizados según la aplicación
--   ✅ Trigger para crear perfil de usuario automáticamente
--   ✅ Políticas RLS de seguridad
--   ✅ Datos iniciales (niveles y zonas)
--
-- ============================================================================

-- Si quieres ejecutar este script de todas formas, aquí tienes una versión
-- simplificada que solo crea la tabla usuarios_cv (la única que usa la app actualmente)

-- TABLA DE USUARIOS CV (para autenticación y permisos)
CREATE TABLE IF NOT EXISTS public.usuarios_cv (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
    nombre_completo TEXT,
    email TEXT NOT NULL,
    rol TEXT NOT NULL DEFAULT 'user' CHECK (rol IN ('admin', 'user', 'viewer')),
    activo BOOLEAN DEFAULT true,
    app_access TEXT[] DEFAULT ARRAY['CV']::TEXT[],
    metadata JSONB DEFAULT '{}'::JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_usuarios_cv_user_id ON public.usuarios_cv(user_id);
CREATE INDEX IF NOT EXISTS idx_usuarios_cv_email ON public.usuarios_cv(email);

-- Habilitar RLS
ALTER TABLE public.usuarios_cv ENABLE ROW LEVEL SECURITY;

-- Política para que usuarios puedan ver su propio perfil
DROP POLICY IF EXISTS "usuarios_cv_select_own" ON public.usuarios_cv;
CREATE POLICY "usuarios_cv_select_own" ON public.usuarios_cv FOR SELECT
    USING (user_id = auth.uid());

-- Política para que admins puedan gestionar todos los usuarios
DROP POLICY IF EXISTS "usuarios_cv_admin_all" ON public.usuarios_cv;
CREATE POLICY "usuarios_cv_admin_all" ON public.usuarios_cv FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.usuarios_cv
            WHERE user_id = auth.uid() AND rol = 'admin'
        )
    );

-- Trigger para crear perfil automáticamente al registrarse
CREATE OR REPLACE FUNCTION create_user_profile_cv()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.usuarios_cv (user_id, email, nombre_completo, rol, activo, app_access)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
        'user',
        true,
        ARRAY['CV']::TEXT[]
    )
    ON CONFLICT (user_id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created_cv ON auth.users;
CREATE TRIGGER on_auth_user_created_cv
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION create_user_profile_cv();

-- ============================================================================
-- Para la configuración COMPLETA, usa: supabase-setup-cv-REAL.sql
-- ============================================================================
