-- ============================================================================
-- Verificación (y limpieza opcional) de triggers legacy sobre auth.users
-- ============================================================================
--
-- Contexto: emergency-profiles-fix.sql, docs/supabase_complete_setup.sql y
-- supabase-privacidad-cv.sql definen, entre ellos, hasta 3 triggers
-- distintos sobre auth.users (on_auth_user_created,
-- on_auth_user_created_cv_restrictive) además del real y correcto
-- (on_auth_user_created_cv, definido en supabase-setup-cv-REAL.sql:553-554).
--
-- public.profiles es la tabla de identidad COMPARTIDA entre todas las apps
-- de este proyecto Supabase — si alguno de esos triggers legacy sigue
-- instalado, cualquier persona que se registre en CUALQUIER app queda con
-- rol='admin', activo=true sin aprobación de nadie, lo cual contradice el
-- modelo de aprobación manual que el resto de la auditoría da por hecho.
--
-- PASO 1 — Ejecuta esto primero (solo lectura, no modifica nada):
-- ============================================================================

SELECT tgname AS trigger_name, tgenabled AS habilitado
FROM pg_trigger
WHERE tgrelid = 'auth.users'::regclass
  AND NOT tgisinternal;

-- Resultado esperado (solo esto, nada más):
--   on_auth_user_created_cv | O
--
-- Si aparece "on_auth_user_created" o "on_auth_user_created_cv_restrictive",
-- continúa con el PASO 2.

-- ============================================================================
-- PASO 2 — Solo si el PASO 1 mostró un trigger legacy, descomenta y ejecuta
-- las líneas correspondientes (no toca on_auth_user_created_cv, el real):
-- ============================================================================

-- DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
-- DROP FUNCTION IF EXISTS public.handle_new_user();

-- DROP TRIGGER IF EXISTS on_auth_user_created_cv_restrictive ON auth.users;
-- DROP FUNCTION IF EXISTS public.handle_new_user_cv_restrictive();

-- ============================================================================
-- PASO 3 — Verificación adicional: confirma que profiles no tiene ninguna
-- fila reciente con rol='admin' que no reconozcas (evidencia de que el
-- trigger legacy ya se disparó antes de limpiarlo):
-- ============================================================================

-- SELECT id, email, rol, activo, created_at
-- FROM public.profiles
-- WHERE rol = 'admin'
-- ORDER BY created_at DESC;
