-- ============================================================================
-- ⚠️  ARCHIVO OBSOLETO - NO EJECUTAR
-- ============================================================================
--
-- Define un segundo trigger sobre auth.users
-- (on_auth_user_created_cv_restrictive) que la app actual no espera y que
-- convive de forma confusa con el trigger real (on_auth_user_created_cv de
-- supabase-setup-cv-REAL.sql). Si se ejecutó alguna vez, verifica y limpia
-- con: migrations/2026xxxx_verificar_trigger_legacy_auth_users.sql
-- ============================================================================
-- ============================================================================
-- CONFIGURACIÓN DE PRIVACIDAD EXTREMA PARA CONTROL DE VENTAS (CV)
-- ============================================================================

-- 1. Función para que el registro sea restrictivo
CREATE OR REPLACE FUNCTION public.handle_new_user_cv_restrictive()
RETURNS TRIGGER AS $$
BEGIN
    -- Si es el primer usuario, lo hacemos ADMIN y ACTIVO
    IF NOT EXISTS (SELECT 1 FROM public.usuarios_cv) THEN
        INSERT INTO public.usuarios_cv (user_id, nombre_completo, email, rol, activo, app_access)
        VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email), NEW.email, 'admin', true, ARRAY['CV']);
    ELSE
        -- Los demás entran como 'user' y DESACTIVADOS (bloqueo total)
        INSERT INTO public.usuarios_cv (user_id, nombre_completo, email, rol, activo, app_access)
        VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email), NEW.email, 'user', false, ARRAY['CV']);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Activar el trigger de seguridad
DROP TRIGGER IF EXISTS on_auth_user_created_cv_restrictive ON auth.users;
CREATE TRIGGER on_auth_user_created_cv_restrictive
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_cv_restrictive();

-- 3. Tu acceso directo (OPCIONAL: pon tu email aquí para pre-autorizarte)
-- INSERT INTO public.emails_permitidos_cv (email, rol_predeterminado, activo_por_defecto)
-- VALUES ('TU-EMAIL@EJEMPLO.COM', 'admin', true) ON CONFLICT DO NOTHING;

-- 4. Función para verificar si alguien es Admin rápido
CREATE OR REPLACE FUNCTION public.soy_admin_cv()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.usuarios_cv 
    WHERE user_id = auth.uid() AND rol = 'admin' AND activo = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
