-- Migración CRÍTICA: liquidaciones_cv y decomisiones_cv nunca coincidían con
-- lo que la app realmente genera — cualquier sincronización + recarga vaciaba
-- los importes reales de las liquidaciones, y decomisiones además crasheaba
-- la pantalla (importe_decomision llegaba undefined → TypeError en
-- LiquidacionesComponents.jsx al hacer .toFixed(2)).
--
-- generar() en LiquidacionesPage.jsx produce:
--   { id, periodo, colaborador_id, colaborador_tipo, colaborador_nombre,
--     zona_fiscal, bruto, irpf, impuesto_zona, decomisiones, neto,
--     total_con_impuesto, estado, fecha_generacion, notas,
--     ventas_incluidas, decomisiones_incluidas }
-- calcularDecomisiones() en liquidacionesUtils.js produce:
--   { venta_id, cliente_nombre, operador_id, operador_nombre, colaborador_id,
--     fecha_venta, fecha_baja, meses_comprometidos, meses_transcurridos,
--     porcentaje_cumplido, regla_aplicada, porcentaje_decomision,
--     comision_original, importe_decomision, estado } + fecha_generacion
--     (añadido al guardar).
--
-- El esquema anterior (mes/año, total_ventas/total_comisiones/detalle para
-- liquidaciones; fecha/motivo/importe para decomisiones) no tenía NINGUNO de
-- estos nombres. Se recrean ambas tablas alineadas con el objeto real —
-- ambas están vacías en la práctica (el bug de CAMPOS_VALIDOS impedía que
-- llegara nada útil), así que no hay pérdida real de datos al recrearlas.

DROP TABLE IF EXISTS public.liquidaciones_cv CASCADE;
CREATE TABLE public.liquidaciones_cv (
    id TEXT PRIMARY KEY,
    periodo TEXT NOT NULL,
    colaborador_id TEXT REFERENCES public.colaboradores_cv(id),
    colaborador_tipo TEXT,
    colaborador_nombre TEXT,
    zona_fiscal TEXT,

    bruto DECIMAL(10,2) DEFAULT 0,
    irpf DECIMAL(10,2) DEFAULT 0,
    impuesto_zona DECIMAL(10,2) DEFAULT 0,
    decomisiones DECIMAL(10,2) DEFAULT 0,
    neto DECIMAL(10,2) DEFAULT 0,
    total_con_impuesto DECIMAL(10,2) DEFAULT 0,

    estado TEXT DEFAULT 'Generada',
    fecha_generacion TIMESTAMPTZ,
    notas TEXT,

    ventas_incluidas JSONB DEFAULT '[]'::JSONB,
    decomisiones_incluidas JSONB DEFAULT '[]'::JSONB,

    metadata JSONB DEFAULT '{}'::JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_liquidaciones_cv_colaborador ON public.liquidaciones_cv(colaborador_id);
CREATE INDEX idx_liquidaciones_cv_periodo ON public.liquidaciones_cv(periodo);
CREATE INDEX idx_liquidaciones_cv_estado ON public.liquidaciones_cv(estado);

ALTER TABLE public.liquidaciones_cv ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cv_liquidaciones_select" ON public.liquidaciones_cv FOR SELECT USING (tiene_acceso_cv());
CREATE POLICY "cv_liquidaciones_insert" ON public.liquidaciones_cv FOR INSERT WITH CHECK (puede_editar_cv());
CREATE POLICY "cv_liquidaciones_update" ON public.liquidaciones_cv FOR UPDATE USING (puede_editar_cv()) WITH CHECK (puede_editar_cv());
CREATE POLICY "cv_liquidaciones_delete" ON public.liquidaciones_cv FOR DELETE USING (puede_editar_cv());
CREATE TRIGGER update_liquidaciones_cv_updated_at BEFORE UPDATE ON public.liquidaciones_cv
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TABLE IF EXISTS public.decomisiones_cv CASCADE;
CREATE TABLE public.decomisiones_cv (
    id TEXT PRIMARY KEY,
    venta_id TEXT REFERENCES public.ventas_cv(id),
    cliente_nombre TEXT,
    operador_id TEXT REFERENCES public.operadores_cv(id),
    operador_nombre TEXT,
    colaborador_id TEXT REFERENCES public.colaboradores_cv(id),

    fecha_venta DATE,
    fecha_baja DATE,
    meses_comprometidos INTEGER,
    meses_transcurridos DECIMAL(6,2),
    porcentaje_cumplido INTEGER,
    regla_aplicada TEXT,
    porcentaje_decomision INTEGER,
    comision_original DECIMAL(10,2),
    importe_decomision DECIMAL(10,2),

    estado TEXT DEFAULT 'Pendiente',
    fecha_generacion TIMESTAMPTZ,

    metadata JSONB DEFAULT '{}'::JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_decomisiones_cv_venta ON public.decomisiones_cv(venta_id);
CREATE INDEX idx_decomisiones_cv_colaborador ON public.decomisiones_cv(colaborador_id);
CREATE INDEX idx_decomisiones_cv_fecha_venta ON public.decomisiones_cv(fecha_venta);

ALTER TABLE public.decomisiones_cv ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cv_decomisiones_select" ON public.decomisiones_cv FOR SELECT USING (tiene_acceso_cv());
CREATE POLICY "cv_decomisiones_insert" ON public.decomisiones_cv FOR INSERT WITH CHECK (puede_editar_cv());
CREATE POLICY "cv_decomisiones_update" ON public.decomisiones_cv FOR UPDATE USING (puede_editar_cv()) WITH CHECK (puede_editar_cv());
CREATE POLICY "cv_decomisiones_delete" ON public.decomisiones_cv FOR DELETE USING (puede_editar_cv());
CREATE TRIGGER update_decomisiones_cv_updated_at BEFORE UPDATE ON public.decomisiones_cv
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Verificación post-migración:
-- SELECT column_name FROM information_schema.columns WHERE table_name = 'liquidaciones_cv' ORDER BY column_name;
-- SELECT column_name FROM information_schema.columns WHERE table_name = 'decomisiones_cv' ORDER BY column_name;
