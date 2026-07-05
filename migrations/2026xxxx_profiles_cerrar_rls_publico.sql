-- Migración CRÍTICA: cerrar el acceso público de escritura/borrado en
-- `public.profiles` (tabla de identidad compartida entre TODAS las apps de
-- este proyecto Supabase — Control de Ventas, locuciones, orders_hp, etc.).
--
-- HALLAZGO (verificado en vivo con `supabase db query --linked`, solo
-- lectura, sin modificar nada): profiles tiene RLS activado pero con 9
-- políticas acumuladas, y dos de ellas son `qual: true` / `with_check: true`
-- para el rol `public` (que en Postgres cubre tanto `anon` como
-- `authenticated`, es decir: CUALQUIERA, incluso sin sesión):
--
--   - "Allow anonymous upsert"       ALL     qual=true  with_check=true
--   - "Enable update for all users"  UPDATE  qual=true
--
-- Las políticas RLS se combinan con OR: aunque también existan políticas
-- correctas restringidas a auth.uid() = id, basta con que UNA política sea
-- `true` para que cualquiera pueda insertar, modificar o BORRAR cualquier
-- fila de profiles (rol, permissions, is_blocked, email, teléfono... de
-- cualquier usuario de cualquiera de las apps) sin autenticarse. Confirmado
-- explotable: una petición REST con solo la clave pública (sin sesión de
-- usuario) ya devolvía filas completas de profiles ajenos.
--
-- Esta migración deja profiles con: lectura pública (se sigue necesitando —
-- varias apps, incluida esta, leen nombre/email de otros usuarios), y
-- escritura/borrado restringidos a auth.uid() = id (cada usuario solo puede
-- tocar su propia fila). También limpia 2 políticas de lectura duplicadas
-- (funcionalmente idénticas a la que se conserva), sin cambiar su efecto.
--
-- ⚠️ Antes de ejecutar: si alguna otra app de este proyecto depende de
-- escribir en profiles SIN sesión de usuario autenticado (poco probable,
-- pero es infraestructura compartida), revísalo antes de aplicar esto —
-- después de esta migración, esa escritura anónima dejará de funcionar.

-- 1. Quitar las dos políticas que permiten escritura/borrado sin restricción.
DROP POLICY IF EXISTS "Allow anonymous upsert" ON public.profiles;
DROP POLICY IF EXISTS "Enable update for all users" ON public.profiles;

-- 2. Quitar 2 de las 3 políticas de lectura pública duplicadas (mismo efecto
--    que la que se conserva: "profiles_read_simple").
DROP POLICY IF EXISTS "Enable read access for all users" ON public.profiles;
DROP POLICY IF EXISTS "Lectura publica profiles" ON public.profiles;

-- Quedan intactas (no las toca esta migración):
--   "profiles_read_simple"        SELECT  qual=true              (lectura pública)
--   "Users can view own profile"  SELECT  auth.uid() = id         (redundante con la anterior, inofensiva)
--   "Users can insert own profile" INSERT  auth.uid() = id
--   "Users can update own profile" UPDATE  auth.uid() = id
--   "profiles_write_self"         ALL     auth.uid() = id

-- Verificación post-migración: debe listar solo 7 políticas, ninguna con
-- qual=true salvo la de SELECT.
-- SELECT policyname, cmd, qual, with_check
-- FROM pg_policies WHERE schemaname='public' AND tablename='profiles'
-- ORDER BY cmd, policyname;
