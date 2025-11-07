-- ====================================================================
-- SCRIPT COMPLETO PARA CONFIGURAR CONTROL DE ACCESO EN SUPABASE
-- ====================================================================
-- Ejecutar este script en el SQL Editor de Supabase Dashboard

-- 1. CREAR TABLA DE PERFILES
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    nombre TEXT,
    rol TEXT DEFAULT 'pending' CHECK (rol IN ('admin', 'user', 'pending', 'blocked')),
    activo BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 2. CREAR TABLA DE SOLICITUDES DE ACCESO
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.access_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT NOT NULL,
    name TEXT NOT NULL,
    reason TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    rejection_reason TEXT,
    requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed_at TIMESTAMP WITH TIME ZONE,
    processed_by UUID REFERENCES auth.users(id)
);

-- Crear índice único condicional por separado
CREATE UNIQUE INDEX IF NOT EXISTS unique_pending_request 
ON public.access_requests(email) 
WHERE status = 'pending';

-- Habilitar Row Level Security
ALTER TABLE public.access_requests ENABLE ROW LEVEL SECURITY;

-- 3. POLÍTICAS DE SEGURIDAD PARA PROFILES
-- ====================================================================

-- Usuarios pueden ver su propio perfil
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

-- Usuarios pueden actualizar su propio perfil (campos limitados)
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- Admins pueden ver todos los perfiles
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles" ON public.profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND rol = 'admin' AND activo = true
        )
    );

-- Admins pueden actualizar todos los perfiles
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
CREATE POLICY "Admins can update all profiles" ON public.profiles
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND rol = 'admin' AND activo = true
        )
    );

-- 4. POLÍTICAS DE SEGURIDAD PARA ACCESS_REQUESTS
-- ====================================================================

-- Cualquiera puede crear solicitudes (usuarios no autenticados)
DROP POLICY IF EXISTS "Anyone can create access requests" ON public.access_requests;
CREATE POLICY "Anyone can create access requests" ON public.access_requests
    FOR INSERT WITH CHECK (true);

-- Usuarios pueden ver sus propias solicitudes
DROP POLICY IF EXISTS "Users can view own requests" ON public.access_requests;
CREATE POLICY "Users can view own requests" ON public.access_requests
    FOR SELECT USING (
        email = COALESCE(auth.email(), email)
    );

-- Admins pueden ver todas las solicitudes
DROP POLICY IF EXISTS "Admins can view all requests" ON public.access_requests;
CREATE POLICY "Admins can view all requests" ON public.access_requests
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND rol = 'admin' AND activo = true
        )
    );

-- Admins pueden actualizar solicitudes
DROP POLICY IF EXISTS "Admins can update requests" ON public.access_requests;
CREATE POLICY "Admins can update requests" ON public.access_requests
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND rol = 'admin' AND activo = true
        )
    );

-- Admins pueden eliminar solicitudes
DROP POLICY IF EXISTS "Admins can delete requests" ON public.access_requests;
CREATE POLICY "Admins can delete requests" ON public.access_requests
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND rol = 'admin' AND activo = true
        )
    );

-- 5. FUNCIÓN PARA CREAR PERFIL AUTOMÁTICAMENTE
-- ====================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    user_role TEXT := 'pending'; -- Por defecto pending
    is_active BOOLEAN := false;
    user_name TEXT;
BEGIN
    -- Extraer nombre del metadata o usar email
    user_name := COALESCE(
        NEW.raw_user_meta_data->>'nombre',
        NEW.raw_user_meta_data->>'name',
        NEW.raw_user_meta_data->>'full_name',
        split_part(NEW.email, '@', 1)
    );

    -- Verificar si el email está en la lista de admins
    IF NEW.email IN (
        'info@luzmatel.com', 
        'admin@luzmatel.com',
        'gerencia@luzmatel.com'
    ) THEN
        user_role := 'admin';
        is_active := true;
    -- Verificar si el email está en dominios autorizados
    ELSIF NEW.email LIKE '%@luzmatel.com' THEN
        user_role := 'user';
        is_active := true;
    -- Verificar solicitudes aprobadas
    ELSIF EXISTS (
        SELECT 1 FROM public.access_requests 
        WHERE email = NEW.email AND status = 'approved'
    ) THEN
        user_role := 'user';
        is_active := true;
    END IF;

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

-- 6. TRIGGER PARA CREAR PERFIL
-- ====================================================================
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 7. FUNCIÓN PARA APROBAR SOLICITUD
-- ====================================================================
CREATE OR REPLACE FUNCTION public.approve_access_request(request_id UUID)
RETURNS JSON AS $$
DECLARE
    request_record public.access_requests%ROWTYPE;
    result JSON;
BEGIN
    -- Verificar que el usuario actual es admin
    IF NOT EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND rol = 'admin' AND activo = true
    ) THEN
        RETURN json_build_object(
            'success', false, 
            'error', 'Solo los administradores pueden aprobar solicitudes'
        );
    END IF;

    -- Obtener la solicitud
    SELECT * INTO request_record
    FROM public.access_requests 
    WHERE id = request_id AND status = 'pending';

    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false, 
            'error', 'Solicitud no encontrada o ya procesada'
        );
    END IF;

    -- Actualizar solicitud
    UPDATE public.access_requests 
    SET 
        status = 'approved',
        processed_at = NOW(),
        processed_by = auth.uid()
    WHERE id = request_id;

    -- Verificar si el usuario ya existe
    IF EXISTS (SELECT 1 FROM public.profiles WHERE email = request_record.email) THEN
        -- Actualizar perfil existente
        UPDATE public.profiles 
        SET 
            rol = 'user',
            activo = true,
            updated_at = NOW()
        WHERE email = request_record.email;
    END IF;

    RETURN json_build_object(
        'success', true, 
        'message', 'Solicitud aprobada correctamente'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. FUNCIÓN PARA RECHAZAR SOLICITUD
-- ====================================================================
CREATE OR REPLACE FUNCTION public.reject_access_request(
    request_id UUID, 
    rejection_reason TEXT DEFAULT NULL
)
RETURNS JSON AS $$
BEGIN
    -- Verificar que el usuario actual es admin
    IF NOT EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND rol = 'admin' AND activo = true
    ) THEN
        RETURN json_build_object(
            'success', false, 
            'error', 'Solo los administradores pueden rechazar solicitudes'
        );
    END IF;

    -- Verificar que la solicitud existe y está pendiente
    IF NOT EXISTS (
        SELECT 1 FROM public.access_requests 
        WHERE id = request_id AND status = 'pending'
    ) THEN
        RETURN json_build_object(
            'success', false, 
            'error', 'Solicitud no encontrada o ya procesada'
        );
    END IF;

    -- Actualizar solicitud
    UPDATE public.access_requests 
    SET 
        status = 'rejected',
        rejection_reason = reject_access_request.rejection_reason,
        processed_at = NOW(),
        processed_by = auth.uid()
    WHERE id = request_id;

    RETURN json_build_object(
        'success', true, 
        'message', 'Solicitud rechazada correctamente'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. VISTA PARA ESTADÍSTICAS
-- ====================================================================
CREATE OR REPLACE VIEW public.access_requests_stats AS
SELECT 
    COUNT(*) as total_requests,
    COUNT(*) FILTER (WHERE status = 'pending') as pending_requests,
    COUNT(*) FILTER (WHERE status = 'approved') as approved_requests,
    COUNT(*) FILTER (WHERE status = 'rejected') as rejected_requests,
    COUNT(DISTINCT email) as unique_requesters,
    COUNT(*) FILTER (WHERE requested_at >= CURRENT_DATE - INTERVAL '7 days') as requests_last_week,
    COUNT(*) FILTER (WHERE requested_at >= CURRENT_DATE - INTERVAL '30 days') as requests_last_month
FROM public.access_requests;

-- 10. INSERTAR USUARIO ADMIN INICIAL (OPCIONAL)
-- ====================================================================
-- Descomenta y modifica según tus necesidades
/*
INSERT INTO auth.users (
    id,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    raw_user_meta_data
) VALUES (
    gen_random_uuid(),
    'info@luzmatel.com',
    crypt('tu_contraseña_temporal', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    '{"nombre": "Administrador Luzmatel"}'::jsonb
) ON CONFLICT (email) DO NOTHING;
*/

-- 11. FUNCIONES DE UTILIDAD ADICIONALES
-- ====================================================================

-- Función para obtener permisos de usuario
CREATE OR REPLACE FUNCTION public.get_user_permissions(user_email TEXT)
RETURNS JSON AS $$
DECLARE
    user_profile public.profiles%ROWTYPE;
    permissions JSON;
BEGIN
    SELECT * INTO user_profile
    FROM public.profiles
    WHERE email = user_email AND activo = true;

    IF NOT FOUND THEN
        RETURN json_build_object(
            'hasAccess', false,
            'role', null,
            'permissions', '[]'::json
        );
    END IF;

    -- Definir permisos según rol
    CASE user_profile.rol
        WHEN 'admin' THEN
            permissions := '["read", "write", "delete", "manage_users", "view_analytics", "manage_settings"]'::json;
        WHEN 'user' THEN
            permissions := '["read", "write"]'::json;
        ELSE
            permissions := '[]'::json;
    END CASE;

    RETURN json_build_object(
        'hasAccess', true,
        'role', user_profile.rol,
        'permissions', permissions,
        'isActive', user_profile.activo
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ====================================================================
-- FIN DEL SCRIPT
-- ====================================================================

-- Para verificar que todo se creó correctamente, ejecuta:
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('profiles', 'access_requests');
-- SELECT routine_name FROM information_schema.routines WHERE routine_schema = 'public' AND routine_name LIKE '%access%';