-- Migración: cerrar el hueco de RLS del rol 'viewer' en ventas_cv.
-- Complementa migrations/2026xxxx_rls_viewer_no_escritura.sql (que ya creó
-- puede_editar_cv() y cubrió las otras 9 tablas). ventas_cv quedó fuera de esa
-- migración porque su DELETE ya estaba bien (es_admin_cv()), pero su INSERT y
-- UPDATE siguen usando tiene_acceso_cv() — un rol='viewer' podría hoy dar de
-- alta o editar ventas igual que un 'user'.
--
-- Requiere que puede_editar_cv() ya exista (creada en la migración anterior).
-- Renombra este archivo con la fecha real antes de ejecutarlo si sigues una
-- convención de versionado de migraciones.

-- SELECT: sin cambios, sigue abierto a tiene_acceso_cv() (viewer puede seguir leyendo).
-- DELETE: sin cambios, sigue restringido a es_admin_cv().

-- INSERT
DROP POLICY IF EXISTS "cv_ventas_insert" ON public.ventas_cv;
CREATE POLICY "cv_ventas_insert" ON public.ventas_cv FOR INSERT WITH CHECK (puede_editar_cv());

-- UPDATE
DROP POLICY IF EXISTS "cv_ventas_update" ON public.ventas_cv;
CREATE POLICY "cv_ventas_update" ON public.ventas_cv FOR UPDATE USING (puede_editar_cv());

-- ============================================================================
-- Verificación post-migración: confirmar que ventas_cv queda con SELECT/DELETE
-- sin cambiar y INSERT/UPDATE ya en puede_editar_cv().
-- ============================================================================
-- SELECT tablename, policyname, cmd, qual, with_check
-- FROM pg_policies
-- WHERE schemaname = 'public' AND tablename = 'ventas_cv'
-- ORDER BY cmd;
