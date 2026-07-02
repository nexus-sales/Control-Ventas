-- Migración CRÍTICA: bloquear auto-escalación de privilegios en usuarios_cv.
--
-- cv_usuarios_update (supabase-setup-cv-REAL.sql) es:
--   USING (es_admin_cv() OR user_id = auth.uid())
-- Sin WITH CHECK que restrinja columnas, cualquier usuario autenticado —incluso
-- recién registrado, con activo=false— puede ejecutar contra su propia fila:
--   UPDATE usuarios_cv SET rol='admin', activo=true, app_access=ARRAY['CV']
--   WHERE user_id = auth.uid();
-- y RLS lo permite, porque la condición solo mira DE QUIÉN es la fila, no QUÉ
-- columnas cambian. Postgres RLS no puede comparar contra OLD en un WITH CHECK
-- (solo ve la fila NEW), así que la restricción por columna se hace con un
-- trigger BEFORE UPDATE, no ampliando la política.
--
-- Verificado en el código (src/): fetchProfile solo hace INSERT (ya cubierto por
-- cv_usuarios_insert_own, que fuerza rol='user'/activo=false/app_access=[]).
-- UserManagement.jsx sí hace UPDATE de rol/activo, pero solo se monta en la ruta
-- /admin/administracion (requireAdmin) — es_admin_cv() cubre ese flujo sin
-- cambios. app_access no se actualiza en ningún sitio del código actual.
--
-- Renombra este archivo con la fecha real antes de ejecutarlo si sigues una
-- convención de versionado de migraciones.

CREATE OR REPLACE FUNCTION prevent_self_escalation_usuarios_cv()
RETURNS TRIGGER AS $$
BEGIN
    IF NOT es_admin_cv() THEN
        IF NEW.rol IS DISTINCT FROM OLD.rol
           OR NEW.activo IS DISTINCT FROM OLD.activo
           OR NEW.app_access IS DISTINCT FROM OLD.app_access THEN
            RAISE EXCEPTION 'No tienes permiso para modificar rol, activo o app_access de tu propio perfil.';
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_prevent_self_escalation_usuarios_cv ON public.usuarios_cv;
CREATE TRIGGER trg_prevent_self_escalation_usuarios_cv
    BEFORE UPDATE ON public.usuarios_cv
    FOR EACH ROW
    EXECUTE FUNCTION prevent_self_escalation_usuarios_cv();

-- ============================================================================
-- ⚠️ AVISO OPERATIVO IMPORTANTE antes de aplicar:
-- Los triggers de Postgres se ejecutan SIEMPRE, incluso con service_role o como
-- superusuario (a diferencia de las políticas RLS, que sí se saltan con
-- service_role). Si ejecutas SQL directo en el editor de Supabase para
-- promocionar un usuario a admin (en vez de hacerlo desde la pantalla de
-- Administración logueado en la app), corres como `postgres`, sin sesión de
-- `auth`, así que auth.uid() es NULL y es_admin_cv() da false — este trigger
-- TE BLOQUEARÍA A TI TAMBIÉN en ese caso. Vía de escape si lo necesitas:
--
--    SET session_replication_role = replica;  -- suspende triggers en la sesión
--    UPDATE usuarios_cv SET rol = 'admin', activo = true WHERE user_id = '...';
--    SET session_replication_role = DEFAULT;  -- reactiva triggers
--
-- (requiere permisos de superusuario, que el editor SQL de Supabase sí tiene).
-- A partir de esta migración, gestiona rol/activo/app_access desde la pantalla
-- de Administración de la app (autenticada como admin), no por SQL directo,
-- salvo que necesites esa vía de escape puntualmente.
-- ============================================================================

-- CASOS DE PRUEBA MANUAL (ejecutar autenticado con las sesiones correspondientes
-- — vía la app, o con el endpoint REST usando el JWT del usuario de prueba, para
-- que auth.uid() resuelva de verdad. No sirve probarlo como `postgres` en el
-- editor SQL: ahí SIEMPRE fallaría el caso 1, incluso si fueras admin).
-- ============================================================================

-- 1. DEBE FALLAR — auto-escalación de un usuario NO admin sobre su propia fila.
--    Ejecutar autenticado como un usuario con rol='user' (o recién registrado,
--    activo=false):
--
--    UPDATE usuarios_cv SET rol = 'admin', activo = true, app_access = ARRAY['CV']
--    WHERE user_id = auth.uid();
--
--    Resultado esperado: ERROR — "No tienes permiso para modificar rol, activo
--    o app_access de tu propio perfil."

-- 2. DEBE SEGUIR FUNCIONANDO — un usuario no admin edita un campo no sensible
--    de su propia fila (ajustar el nombre de columna si tu esquema usa otro,
--    p.ej. nombre_completo):
--
--    UPDATE usuarios_cv SET nombre_completo = 'Nombre de prueba'
--    WHERE user_id = auth.uid();
--
--    Resultado esperado: éxito, 1 fila actualizada.

-- 3. DEBE SEGUIR FUNCIONANDO — un admin real edita rol/activo de OTRO usuario
--    (flujo real de UserManagement.jsx). Ejecutar autenticado como un usuario
--    con rol='admin' y activo=true:
--
--    UPDATE usuarios_cv SET rol = 'admin' WHERE user_id = '<uuid-de-otro-usuario>';
--
--    Resultado esperado: éxito, 1 fila actualizada.

-- ============================================================================
-- Verificación post-migración: confirmar que el trigger y la función existen.
-- ============================================================================
-- SELECT tgname, tgrelid::regclass, tgenabled
-- FROM pg_trigger
-- WHERE tgname = 'trg_prevent_self_escalation_usuarios_cv';
