-- ====================================================================
-- SCRIPT PARA CREAR TODAS LAS TABLAS PRINCIPALES EN SUPABASE
-- ====================================================================
-- Ejecutar este script en el SQL Editor de Supabase Dashboard
-- después de haber ejecutado supabase_complete_setup.sql

-- 1. TABLA OPERADORES
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.operadores (
    id TEXT PRIMARY KEY,
    nombre TEXT NOT NULL,
    sector TEXT DEFAULT 'telefonia',
    codigo TEXT,
    contacto TEXT,
    telefono TEXT,
    email TEXT,
    observaciones TEXT,
    fecha_alta DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para operadores
CREATE INDEX IF NOT EXISTS idx_operadores_sector ON public.operadores(sector);
CREATE INDEX IF NOT EXISTS idx_operadores_codigo ON public.operadores(codigo);

-- 2. TABLA ZONAS
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.zonas (
    id TEXT PRIMARY KEY,
    nombre TEXT NOT NULL,
    codigo TEXT,
    impuesto_tipo TEXT DEFAULT 'IVA',
    impuesto_pct DECIMAL(5,4) DEFAULT 0.21,
    descripcion TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para zonas
CREATE INDEX IF NOT EXISTS idx_zonas_codigo ON public.zonas(codigo);

-- 3. TABLA COLABORADORES
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.colaboradores (
    id TEXT PRIMARY KEY,
    nombre TEXT NOT NULL,
    nivel TEXT DEFAULT 'BASIC',
    comision_personalizada DECIMAL(10,2),
    comision_tipo_personalizada TEXT,
    fecha_alta DATE DEFAULT CURRENT_DATE,
    telefono TEXT,
    email TEXT,
    direccion TEXT,
    cif_dni TEXT,
    tipo_fiscal TEXT DEFAULT 'AUTONOMO',
    irpf DECIMAL(5,4) DEFAULT 0,
    pct_colaborador DECIMAL(5,4) DEFAULT 0.50,
    zona_id TEXT REFERENCES public.zonas(id),
    estado TEXT DEFAULT 'ACTIVO',
    irpf_calculado DECIMAL(10,2),
    exento_impuestos BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    observaciones TEXT,
    rol TEXT DEFAULT 'colaborador'
);

-- Índices para colaboradores
CREATE INDEX IF NOT EXISTS idx_colaboradores_nivel ON public.colaboradores(nivel);
CREATE INDEX IF NOT EXISTS idx_colaboradores_zona ON public.colaboradores(zona_id);
CREATE INDEX IF NOT EXISTS idx_colaboradores_estado ON public.colaboradores(estado);

-- 4. TABLA PRODUCTOS
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.productos (
    id TEXT PRIMARY KEY,
    operador_id TEXT REFERENCES public.operadores(id),
    nombre TEXT NOT NULL,
    familia TEXT DEFAULT 'importado',
    pvp DECIMAL(10,2) DEFAULT 50.0,
    comision_tipo TEXT DEFAULT 'porcentaje',
    comision_valor DECIMAL(10,6) DEFAULT 0.15,
    codigo_producto TEXT,
    descripcion TEXT,
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    fecha_alta DATE DEFAULT CURRENT_DATE,
    fecha_baja DATE,
    contacto TEXT,
    email TEXT,
    telefono TEXT,
    observaciones TEXT,
    historial JSONB DEFAULT '[]'
);

-- Índices para productos
CREATE INDEX IF NOT EXISTS idx_productos_operador ON public.productos(operador_id);
CREATE INDEX IF NOT EXISTS idx_productos_familia ON public.productos(familia);
CREATE INDEX IF NOT EXISTS idx_productos_activo ON public.productos(activo);
CREATE INDEX IF NOT EXISTS idx_productos_codigo ON public.productos(codigo_producto);

-- 5. TABLA VENTAS
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.ventas (
    id TEXT PRIMARY KEY,
    fecha DATE NOT NULL,
    cliente TEXT NOT NULL,
    cif TEXT,
    colaborador_id TEXT REFERENCES public.colaboradores(id),
    zona_id TEXT REFERENCES public.zonas(id),
    producto_id TEXT REFERENCES public.productos(id),
    operador_id TEXT REFERENCES public.operadores(id),
    pvp DECIMAL(10,2) NOT NULL,
    cantidad INTEGER DEFAULT 1,
    estado TEXT DEFAULT 'PENDIENTE',
    mes INTEGER,
    año INTEGER,
    extras JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para ventas
CREATE INDEX IF NOT EXISTS idx_ventas_fecha ON public.ventas(fecha);
CREATE INDEX IF NOT EXISTS idx_ventas_colaborador ON public.ventas(colaborador_id);
CREATE INDEX IF NOT EXISTS idx_ventas_zona ON public.ventas(zona_id);
CREATE INDEX IF NOT EXISTS idx_ventas_producto ON public.ventas(producto_id);
CREATE INDEX IF NOT EXISTS idx_ventas_operador ON public.ventas(operador_id);
CREATE INDEX IF NOT EXISTS idx_ventas_estado ON public.ventas(estado);
CREATE INDEX IF NOT EXISTS idx_ventas_mes_año ON public.ventas(mes, año);

-- 6. TABLA NIVELES
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.niveles (
    id TEXT PRIMARY KEY,
    nombre TEXT NOT NULL,
    pct_colaborador_default DECIMAL(5,4) DEFAULT 0.50,
    porcentaje DECIMAL(5,4) DEFAULT 0.50,
    comision_tipo TEXT DEFAULT 'porcentaje',
    comision_valor DECIMAL(5,4) DEFAULT 0.50,
    tipo TEXT DEFAULT 'COMERCIAL',
    pct_telefonia DECIMAL(5,4) DEFAULT 0.50,
    pct_energia DECIMAL(5,4) DEFAULT 0.50,
    fijo_seguridad DECIMAL(10,2) DEFAULT 225,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. TABLA REGLAS
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.reglas (
    id TEXT PRIMARY KEY,
    nombre TEXT NOT NULL,
    descripcion TEXT,
    tipo TEXT,
    condiciones JSONB DEFAULT '[]',
    acciones JSONB DEFAULT '[]',
    activa BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. TABLA LIQUIDACIONES
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.liquidaciones (
    id TEXT PRIMARY KEY,
    colaborador_id TEXT REFERENCES public.colaboradores(id),
    mes INTEGER NOT NULL,
    año INTEGER NOT NULL,
    fecha_desde DATE,
    fecha_hasta DATE,
    total_ventas DECIMAL(10,2) DEFAULT 0,
    total_comisiones DECIMAL(10,2) DEFAULT 0,
    estado TEXT DEFAULT 'PENDIENTE',
    observaciones TEXT,
    detalle JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para liquidaciones
CREATE INDEX IF NOT EXISTS idx_liquidaciones_colaborador ON public.liquidaciones(colaborador_id);
CREATE INDEX IF NOT EXISTS idx_liquidaciones_mes_año ON public.liquidaciones(mes, año);
CREATE INDEX IF NOT EXISTS idx_liquidaciones_estado ON public.liquidaciones(estado);

-- 9. HABILITAR ROW LEVEL SECURITY EN TODAS LAS TABLAS
-- ====================================================================
ALTER TABLE public.operadores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.zonas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.colaboradores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.productos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ventas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.niveles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reglas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.liquidaciones ENABLE ROW LEVEL SECURITY;

-- 10. POLÍTICAS DE SEGURIDAD BÁSICAS
-- ====================================================================

-- Operadores: Solo usuarios autenticados pueden leer y escribir
DROP POLICY IF EXISTS "Authenticated users can read operadores" ON public.operadores;
CREATE POLICY "Authenticated users can read operadores" ON public.operadores
    FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users can write operadores" ON public.operadores;
CREATE POLICY "Authenticated users can write operadores" ON public.operadores
    FOR ALL USING (auth.role() = 'authenticated');

-- Zonas: Solo usuarios autenticados pueden leer y escribir
DROP POLICY IF EXISTS "Authenticated users can read zonas" ON public.zonas;
CREATE POLICY "Authenticated users can read zonas" ON public.zonas
    FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users can write zonas" ON public.zonas;
CREATE POLICY "Authenticated users can write zonas" ON public.zonas
    FOR ALL USING (auth.role() = 'authenticated');

-- Colaboradores: Solo usuarios autenticados pueden leer y escribir
DROP POLICY IF EXISTS "Authenticated users can read colaboradores" ON public.colaboradores;
CREATE POLICY "Authenticated users can read colaboradores" ON public.colaboradores
    FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users can write colaboradores" ON public.colaboradores;
CREATE POLICY "Authenticated users can write colaboradores" ON public.colaboradores
    FOR ALL USING (auth.role() = 'authenticated');

-- Productos: Solo usuarios autenticados pueden leer y escribir
DROP POLICY IF EXISTS "Authenticated users can read productos" ON public.productos;
CREATE POLICY "Authenticated users can read productos" ON public.productos
    FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users can write productos" ON public.productos;
CREATE POLICY "Authenticated users can write productos" ON public.productos
    FOR ALL USING (auth.role() = 'authenticated');

-- Ventas: Solo usuarios autenticados pueden leer y escribir
DROP POLICY IF EXISTS "Authenticated users can read ventas" ON public.ventas;
CREATE POLICY "Authenticated users can read ventas" ON public.ventas
    FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users can write ventas" ON public.ventas;
CREATE POLICY "Authenticated users can write ventas" ON public.ventas
    FOR ALL USING (auth.role() = 'authenticated');

-- Niveles: Solo usuarios autenticados pueden leer y escribir
DROP POLICY IF EXISTS "Authenticated users can read niveles" ON public.niveles;
CREATE POLICY "Authenticated users can read niveles" ON public.niveles
    FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users can write niveles" ON public.niveles;
CREATE POLICY "Authenticated users can write niveles" ON public.niveles
    FOR ALL USING (auth.role() = 'authenticated');

-- Reglas: Solo usuarios autenticados pueden leer y escribir
DROP POLICY IF EXISTS "Authenticated users can read reglas" ON public.reglas;
CREATE POLICY "Authenticated users can read reglas" ON public.reglas
    FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users can write reglas" ON public.reglas;
CREATE POLICY "Authenticated users can write reglas" ON public.reglas
    FOR ALL USING (auth.role() = 'authenticated');

-- Liquidaciones: Solo usuarios autenticados pueden leer y escribir
DROP POLICY IF EXISTS "Authenticated users can read liquidaciones" ON public.liquidaciones;
CREATE POLICY "Authenticated users can read liquidaciones" ON public.liquidaciones
    FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users can write liquidaciones" ON public.liquidaciones;
CREATE POLICY "Authenticated users can write liquidaciones" ON public.liquidaciones
    FOR ALL USING (auth.role() = 'authenticated');

-- 11. FUNCIONES DE ACTUALIZACIÓN AUTOMÁTICA
-- ====================================================================

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para actualización automática de updated_at
DROP TRIGGER IF EXISTS update_operadores_updated_at ON public.operadores;
CREATE TRIGGER update_operadores_updated_at
    BEFORE UPDATE ON public.operadores
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_zonas_updated_at ON public.zonas;
CREATE TRIGGER update_zonas_updated_at
    BEFORE UPDATE ON public.zonas
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_colaboradores_updated_at ON public.colaboradores;
CREATE TRIGGER update_colaboradores_updated_at
    BEFORE UPDATE ON public.colaboradores
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_productos_updated_at ON public.productos;
CREATE TRIGGER update_productos_updated_at
    BEFORE UPDATE ON public.productos
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_ventas_updated_at ON public.ventas;
CREATE TRIGGER update_ventas_updated_at
    BEFORE UPDATE ON public.ventas
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_niveles_updated_at ON public.niveles;
CREATE TRIGGER update_niveles_updated_at
    BEFORE UPDATE ON public.niveles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_reglas_updated_at ON public.reglas;
CREATE TRIGGER update_reglas_updated_at
    BEFORE UPDATE ON public.reglas
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_liquidaciones_updated_at ON public.liquidaciones;
CREATE TRIGGER update_liquidaciones_updated_at
    BEFORE UPDATE ON public.liquidaciones
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 12. FUNCIÓN PARA CALCULAR MES Y AÑO AUTOMÁTICAMENTE EN VENTAS
-- ====================================================================
CREATE OR REPLACE FUNCTION public.calculate_mes_año()
RETURNS TRIGGER AS $$
BEGIN
    NEW.mes = EXTRACT(MONTH FROM NEW.fecha);
    NEW.año = EXTRACT(YEAR FROM NEW.fecha);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS calculate_ventas_mes_año ON public.ventas;
CREATE TRIGGER calculate_ventas_mes_año
    BEFORE INSERT OR UPDATE ON public.ventas
    FOR EACH ROW EXECUTE FUNCTION public.calculate_mes_año();

-- ====================================================================
-- FIN DEL SCRIPT
-- ====================================================================

-- Para verificar que todas las tablas se crearon correctamente:
-- SELECT table_name FROM information_schema.tables 
-- WHERE table_schema = 'public' 
-- AND table_name IN ('operadores', 'zonas', 'colaboradores', 'productos', 'ventas', 'niveles', 'reglas', 'liquidaciones');

-- Para verificar las columnas de una tabla específica:
-- SELECT column_name, data_type, is_nullable, column_default 
-- FROM information_schema.columns 
-- WHERE table_schema = 'public' AND table_name = 'productos' 
-- ORDER BY ordinal_position;