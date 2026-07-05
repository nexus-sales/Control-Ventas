-- Migración: usuarios_cv deja de duplicar nombre_completo/email.
--
-- CONTEXTO: este proyecto Supabase ("MisApp") es infraestructura compartida
-- entre varias apps (locuciones, orders_hp, salesGPV, Control de Ventas...).
-- La tabla `profiles` (sin sufijo _cv) es la identidad maestra compartida:
-- id = auth.users.id, con email/nombre/telefono/permissions ya mantenidos
-- por el resto del ecosistema. usuarios_cv NO debe duplicar esos datos —
-- solo guarda lo específico de esta app: rol, activo, app_access.
--
-- A partir de esta migración, la app lee nombre_completo/email uniendo
-- usuarios_cv (rol/activo/app_access) con profiles (nombre/email) en el
-- cliente — ver fetchProfile en AppContexts.jsx y fetchUsers en
-- UserManagement.jsx.

-- 1. Quitar las columnas duplicadas de usuarios_cv.
ALTER TABLE public.usuarios_cv DROP COLUMN IF EXISTS nombre_completo;
ALTER TABLE public.usuarios_cv DROP COLUMN IF EXISTS email;

-- 2. El trigger que crea el perfil al registrarse (create_user_profile_cv)
--    ya no debe escribir email/nombre_completo — solo rol/activo/app_access.
CREATE OR REPLACE FUNCTION create_user_profile_cv()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.usuarios_cv (user_id, rol, activo, app_access)
    VALUES (NEW.id, 'user', false, ARRAY[]::TEXT[])
    ON CONFLICT (user_id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Verificación post-migración:
-- SELECT column_name FROM information_schema.columns
-- WHERE table_name = 'usuarios_cv' ORDER BY column_name;
