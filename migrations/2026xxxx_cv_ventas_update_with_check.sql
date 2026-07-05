-- ============================================================================
-- Alinea cv_ventas_update con el resto de políticas UPDATE (que sí llevan
-- WITH CHECK además de USING). No es explotable hoy (puede_editar_cv() no
-- depende de los datos de la fila), pero mantiene la política consistente
-- con cv_colaboradores_update / cv_productos_update / cv_operadores_update.
-- ============================================================================

DROP POLICY IF EXISTS "cv_ventas_update" ON public.ventas_cv;
CREATE POLICY "cv_ventas_update" ON public.ventas_cv
  FOR UPDATE USING (puede_editar_cv()) WITH CHECK (puede_editar_cv());
