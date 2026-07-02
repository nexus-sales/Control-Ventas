-- Migración: cerrar el hueco de RLS del rol 'viewer' (hallazgo ALTO del Auditor).
-- usuarios_cv.rol admite 'admin' | 'user' | 'viewer', pero tiene_acceso_cv() solo
-- comprueba activo + app_access, no el rol — un 'viewer' puede hoy insertar,
-- actualizar y borrar exactamente igual que un 'user' en las 9 tablas de abajo.
--
-- Renombra este archivo con la fecha real antes de ejecutarlo si sigues una
-- convención de versionado de migraciones (ej. supabase migration new).
--
-- IMPORTANTE: revisa el aviso al final del archivo antes de aplicar.

-- ============================================================================
-- 1. FUNCIÓN puede_editar_cv() — misma comprobación que tiene_acceso_cv(),
--    excluyendo explícitamente rol = 'viewer'.
-- ============================================================================
CREATE OR REPLACE FUNCTION puede_editar_cv()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.usuarios_cv
        WHERE user_id = auth.uid()
        AND 'CV' = ANY(app_access)
        AND activo = true
        AND rol != 'viewer'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 2. Reemplazar la política FOR ALL de cada tabla por 4 políticas separadas:
--    SELECT sigue abierto a tiene_acceso_cv() (viewer puede seguir leyendo);
--    INSERT/UPDATE/DELETE pasan a puede_editar_cv() (viewer queda bloqueado).
--    Postgres no permite combinar INSERT+UPDATE+DELETE en una sola política
--    (FOR admite un único comando o ALL), así que son 3 políticas de escritura
--    por tabla, no una — sigue el mismo patrón que ya usa cv_ventas_* en el
--    esquema base.
-- ============================================================================

-- COLABORADORES
DROP POLICY IF EXISTS "cv_colaboradores_all" ON public.colaboradores_cv;
DROP POLICY IF EXISTS "cv_colaboradores_select" ON public.colaboradores_cv;
CREATE POLICY "cv_colaboradores_select" ON public.colaboradores_cv FOR SELECT USING (tiene_acceso_cv());
DROP POLICY IF EXISTS "cv_colaboradores_insert" ON public.colaboradores_cv;
CREATE POLICY "cv_colaboradores_insert" ON public.colaboradores_cv FOR INSERT WITH CHECK (puede_editar_cv());
DROP POLICY IF EXISTS "cv_colaboradores_update" ON public.colaboradores_cv;
CREATE POLICY "cv_colaboradores_update" ON public.colaboradores_cv FOR UPDATE USING (puede_editar_cv()) WITH CHECK (puede_editar_cv());
DROP POLICY IF EXISTS "cv_colaboradores_delete" ON public.colaboradores_cv;
CREATE POLICY "cv_colaboradores_delete" ON public.colaboradores_cv FOR DELETE USING (puede_editar_cv());

-- PRODUCTOS
DROP POLICY IF EXISTS "cv_productos_all" ON public.productos_cv;
DROP POLICY IF EXISTS "cv_productos_select" ON public.productos_cv;
CREATE POLICY "cv_productos_select" ON public.productos_cv FOR SELECT USING (tiene_acceso_cv());
DROP POLICY IF EXISTS "cv_productos_insert" ON public.productos_cv;
CREATE POLICY "cv_productos_insert" ON public.productos_cv FOR INSERT WITH CHECK (puede_editar_cv());
DROP POLICY IF EXISTS "cv_productos_update" ON public.productos_cv;
CREATE POLICY "cv_productos_update" ON public.productos_cv FOR UPDATE USING (puede_editar_cv()) WITH CHECK (puede_editar_cv());
DROP POLICY IF EXISTS "cv_productos_delete" ON public.productos_cv;
CREATE POLICY "cv_productos_delete" ON public.productos_cv FOR DELETE USING (puede_editar_cv());

-- OPERADORES
DROP POLICY IF EXISTS "cv_operadores_all" ON public.operadores_cv;
DROP POLICY IF EXISTS "cv_operadores_select" ON public.operadores_cv;
CREATE POLICY "cv_operadores_select" ON public.operadores_cv FOR SELECT USING (tiene_acceso_cv());
DROP POLICY IF EXISTS "cv_operadores_insert" ON public.operadores_cv;
CREATE POLICY "cv_operadores_insert" ON public.operadores_cv FOR INSERT WITH CHECK (puede_editar_cv());
DROP POLICY IF EXISTS "cv_operadores_update" ON public.operadores_cv;
CREATE POLICY "cv_operadores_update" ON public.operadores_cv FOR UPDATE USING (puede_editar_cv()) WITH CHECK (puede_editar_cv());
DROP POLICY IF EXISTS "cv_operadores_delete" ON public.operadores_cv;
CREATE POLICY "cv_operadores_delete" ON public.operadores_cv FOR DELETE USING (puede_editar_cv());

-- ZONAS
DROP POLICY IF EXISTS "cv_zonas_all" ON public.zonas_cv;
DROP POLICY IF EXISTS "cv_zonas_select" ON public.zonas_cv;
CREATE POLICY "cv_zonas_select" ON public.zonas_cv FOR SELECT USING (tiene_acceso_cv());
DROP POLICY IF EXISTS "cv_zonas_insert" ON public.zonas_cv;
CREATE POLICY "cv_zonas_insert" ON public.zonas_cv FOR INSERT WITH CHECK (puede_editar_cv());
DROP POLICY IF EXISTS "cv_zonas_update" ON public.zonas_cv;
CREATE POLICY "cv_zonas_update" ON public.zonas_cv FOR UPDATE USING (puede_editar_cv()) WITH CHECK (puede_editar_cv());
DROP POLICY IF EXISTS "cv_zonas_delete" ON public.zonas_cv;
CREATE POLICY "cv_zonas_delete" ON public.zonas_cv FOR DELETE USING (puede_editar_cv());

-- NIVELES
DROP POLICY IF EXISTS "cv_niveles_all" ON public.niveles_cv;
DROP POLICY IF EXISTS "cv_niveles_select" ON public.niveles_cv;
CREATE POLICY "cv_niveles_select" ON public.niveles_cv FOR SELECT USING (tiene_acceso_cv());
DROP POLICY IF EXISTS "cv_niveles_insert" ON public.niveles_cv;
CREATE POLICY "cv_niveles_insert" ON public.niveles_cv FOR INSERT WITH CHECK (puede_editar_cv());
DROP POLICY IF EXISTS "cv_niveles_update" ON public.niveles_cv;
CREATE POLICY "cv_niveles_update" ON public.niveles_cv FOR UPDATE USING (puede_editar_cv()) WITH CHECK (puede_editar_cv());
DROP POLICY IF EXISTS "cv_niveles_delete" ON public.niveles_cv;
CREATE POLICY "cv_niveles_delete" ON public.niveles_cv FOR DELETE USING (puede_editar_cv());

-- REGLAS
DROP POLICY IF EXISTS "cv_reglas_all" ON public.reglas_cv;
DROP POLICY IF EXISTS "cv_reglas_select" ON public.reglas_cv;
CREATE POLICY "cv_reglas_select" ON public.reglas_cv FOR SELECT USING (tiene_acceso_cv());
DROP POLICY IF EXISTS "cv_reglas_insert" ON public.reglas_cv;
CREATE POLICY "cv_reglas_insert" ON public.reglas_cv FOR INSERT WITH CHECK (puede_editar_cv());
DROP POLICY IF EXISTS "cv_reglas_update" ON public.reglas_cv;
CREATE POLICY "cv_reglas_update" ON public.reglas_cv FOR UPDATE USING (puede_editar_cv()) WITH CHECK (puede_editar_cv());
DROP POLICY IF EXISTS "cv_reglas_delete" ON public.reglas_cv;
CREATE POLICY "cv_reglas_delete" ON public.reglas_cv FOR DELETE USING (puede_editar_cv());

-- LIQUIDACIONES
DROP POLICY IF EXISTS "cv_liquidaciones_all" ON public.liquidaciones_cv;
DROP POLICY IF EXISTS "cv_liquidaciones_select" ON public.liquidaciones_cv;
CREATE POLICY "cv_liquidaciones_select" ON public.liquidaciones_cv FOR SELECT USING (tiene_acceso_cv());
DROP POLICY IF EXISTS "cv_liquidaciones_insert" ON public.liquidaciones_cv;
CREATE POLICY "cv_liquidaciones_insert" ON public.liquidaciones_cv FOR INSERT WITH CHECK (puede_editar_cv());
DROP POLICY IF EXISTS "cv_liquidaciones_update" ON public.liquidaciones_cv;
CREATE POLICY "cv_liquidaciones_update" ON public.liquidaciones_cv FOR UPDATE USING (puede_editar_cv()) WITH CHECK (puede_editar_cv());
DROP POLICY IF EXISTS "cv_liquidaciones_delete" ON public.liquidaciones_cv;
CREATE POLICY "cv_liquidaciones_delete" ON public.liquidaciones_cv FOR DELETE USING (puede_editar_cv());

-- DECOMISIONES
DROP POLICY IF EXISTS "cv_decomisiones_all" ON public.decomisiones_cv;
DROP POLICY IF EXISTS "cv_decomisiones_select" ON public.decomisiones_cv;
CREATE POLICY "cv_decomisiones_select" ON public.decomisiones_cv FOR SELECT USING (tiene_acceso_cv());
DROP POLICY IF EXISTS "cv_decomisiones_insert" ON public.decomisiones_cv;
CREATE POLICY "cv_decomisiones_insert" ON public.decomisiones_cv FOR INSERT WITH CHECK (puede_editar_cv());
DROP POLICY IF EXISTS "cv_decomisiones_update" ON public.decomisiones_cv;
CREATE POLICY "cv_decomisiones_update" ON public.decomisiones_cv FOR UPDATE USING (puede_editar_cv()) WITH CHECK (puede_editar_cv());
DROP POLICY IF EXISTS "cv_decomisiones_delete" ON public.decomisiones_cv;
CREATE POLICY "cv_decomisiones_delete" ON public.decomisiones_cv FOR DELETE USING (puede_editar_cv());

-- CUSTOM FIELDS
DROP POLICY IF EXISTS "cv_custom_fields_all" ON public.custom_fields_cv;
DROP POLICY IF EXISTS "cv_custom_fields_select" ON public.custom_fields_cv;
CREATE POLICY "cv_custom_fields_select" ON public.custom_fields_cv FOR SELECT USING (tiene_acceso_cv());
DROP POLICY IF EXISTS "cv_custom_fields_insert" ON public.custom_fields_cv;
CREATE POLICY "cv_custom_fields_insert" ON public.custom_fields_cv FOR INSERT WITH CHECK (puede_editar_cv());
DROP POLICY IF EXISTS "cv_custom_fields_update" ON public.custom_fields_cv;
CREATE POLICY "cv_custom_fields_update" ON public.custom_fields_cv FOR UPDATE USING (puede_editar_cv()) WITH CHECK (puede_editar_cv());
DROP POLICY IF EXISTS "cv_custom_fields_delete" ON public.custom_fields_cv;
CREATE POLICY "cv_custom_fields_delete" ON public.custom_fields_cv FOR DELETE USING (puede_editar_cv());

-- ============================================================================
-- Verificación post-migración: confirmar que ya no queda ninguna política "_all"
-- en las 9 tablas (si aparece alguna, el DROP de arriba falló o el nombre no
-- coincidía con el de tu base real).
-- ============================================================================
-- SELECT tablename, policyname, cmd
-- FROM pg_policies
-- WHERE schemaname = 'public'
--   AND tablename IN ('colaboradores_cv','productos_cv','operadores_cv','zonas_cv',
--                      'niveles_cv','reglas_cv','liquidaciones_cv','decomisiones_cv',
--                      'custom_fields_cv')
-- ORDER BY tablename, cmd;

-- ============================================================================
-- Fuera de alcance de esta migración (no lo toco, solo lo dejo anotado):
-- ventas_cv no está en la lista de 9 tablas que diste. Ahora mismo sus políticas
-- de INSERT/UPDATE también usan tiene_acceso_cv() (no es_admin_cv), así que un
-- 'viewer' hoy también podría insertar/editar ventas — solo el DELETE de ventas
-- ya estaba restringido a es_admin_cv(). Si quieres cerrarlo igual, dímelo y
-- preparo una migración aparte para cv_ventas_insert/cv_ventas_update.
-- ============================================================================
