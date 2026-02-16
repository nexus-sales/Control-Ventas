-- ============================================================================
-- CONFIGURACIÓN COMPLETA DE TABLAS PARA CONTROL DE VENTAS (CV)
-- Proyecto Supabase: MIsapp
-- Todas las tablas usan sufijo _cv para diferenciarse de otras apps
-- Versión: 2.0 - Actualizada con todos los campos necesarios
-- ============================================================================

-- ============================================================================
-- 1. EXTENSIONES NECESARIAS
-- ============================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- 2. TABLA DE OPERADORES CV
-- Representa las empresas/operadores (Vodafone, Orange, Endesa, etc.)
-- ============================================================================
DROP TABLE IF EXISTS public.operadores_cv CASCADE;
CREATE TABLE public.operadores_cv (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre TEXT NOT NULL,
    sector TEXT DEFAULT 'TELEFONIA', -- TELEFONIA, ENERGIA, SEGURIDAD, OTRO
    codigo TEXT,
    contacto TEXT,
    telefono TEXT,
    email TEXT,
    color TEXT, -- Para UI
    activo BOOLEAN DEFAULT true,
    observaciones TEXT,
    metadata JSONB DEFAULT '{}'::JSONB,
    fecha_alta DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_operadores_cv_nombre ON public.operadores_cv(nombre);
CREATE INDEX idx_operadores_cv_sector ON public.operadores_cv(sector);
CREATE INDEX idx_operadores_cv_activo ON public.operadores_cv(activo);

-- ============================================================================
-- 3. TABLA DE ZONAS CV
-- Zonas geográficas con configuración de impuestos
-- ============================================================================
DROP TABLE IF EXISTS public.zonas_cv CASCADE;
CREATE TABLE public.zonas_cv (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre TEXT NOT NULL,
    codigo TEXT,
    impuesto_tipo TEXT DEFAULT 'IVA', -- IVA, IGIC, etc.
    impuesto_pct DECIMAL(5,4) DEFAULT 0.21, -- 21% por defecto
    descripcion TEXT,
    activo BOOLEAN DEFAULT true,
    metadata JSONB DEFAULT '{}'::JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_zonas_cv_nombre ON public.zonas_cv(nombre);
CREATE INDEX idx_zonas_cv_activo ON public.zonas_cv(activo);

-- ============================================================================
-- 4. TABLA DE NIVELES CV
-- Niveles de colaboradores con sus porcentajes de comisión
-- ============================================================================
DROP TABLE IF EXISTS public.niveles_cv CASCADE;
CREATE TABLE public.niveles_cv (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre TEXT NOT NULL,
    descripcion TEXT,
    tipo TEXT DEFAULT 'COMERCIAL', -- COMERCIAL, COORDINADOR, JEFE_EQUIPO

    -- Porcentajes por defecto
    pct_colaborador_default DECIMAL(5,4) DEFAULT 0.50, -- 50%

    -- Porcentajes por sector
    pct_telefonia DECIMAL(5,4) DEFAULT 0.50,
    pct_energia DECIMAL(5,4) DEFAULT 0.50,
    fijo_seguridad DECIMAL(10,2) DEFAULT 225.00, -- Comisión fija para seguridad

    -- Comisión genérica (tipo y valor)
    comision_tipo TEXT DEFAULT 'porcentaje', -- 'porcentaje' o 'fijo'
    comision_valor DECIMAL(10,6) DEFAULT 0.50,

    orden INTEGER DEFAULT 0,
    activo BOOLEAN DEFAULT true,
    metadata JSONB DEFAULT '{}'::JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_niveles_cv_nombre ON public.niveles_cv(nombre);
CREATE INDEX idx_niveles_cv_orden ON public.niveles_cv(orden);
CREATE INDEX idx_niveles_cv_activo ON public.niveles_cv(activo);

-- ============================================================================
-- 5. TABLA DE COLABORADORES CV
-- Comerciales/agentes que realizan ventas
-- ============================================================================
DROP TABLE IF EXISTS public.colaboradores_cv CASCADE;
CREATE TABLE public.colaboradores_cv (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre TEXT NOT NULL,
    apellidos TEXT,
    email TEXT,
    telefono TEXT,
    direccion TEXT,
    cif_dni TEXT, -- Para distinguir autónomos de empresas

    -- Configuración fiscal
    tipo_fiscal TEXT DEFAULT 'AUTONOMO', -- AUTONOMO, AUTONOMO_ESPECIAL, EMPRESA
    irpf DECIMAL(5,4) DEFAULT 0, -- Porcentaje IRPF (0.07, 0.15, etc.)
    exento_impuestos BOOLEAN DEFAULT false,

    -- Relaciones
    nivel_id UUID REFERENCES public.niveles_cv(id),
    zona_id UUID REFERENCES public.zonas_cv(id),

    -- Comisiones personalizadas (sobreescriben nivel)
    comision_personalizada DECIMAL(10,2),
    comision_tipo_personalizada TEXT, -- 'fijo' o 'porcentaje'
    pct_colaborador DECIMAL(5,4) DEFAULT 0.50,

    -- Porcentajes por sector (sobreescriben nivel)
    pct_telefonia DECIMAL(5,4),
    pct_energia DECIMAL(5,4),
    fijo_seguridad DECIMAL(10,2),

    -- Estado y metadata
    estado TEXT DEFAULT 'ACTIVO', -- ACTIVO, INACTIVO, BAJA
    activo BOOLEAN DEFAULT true,
    fecha_alta DATE DEFAULT CURRENT_DATE,
    fecha_baja DATE,
    observaciones TEXT,
    rol TEXT DEFAULT 'colaborador', -- colaborador, coordinador, admin

    metadata JSONB DEFAULT '{}'::JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_colaboradores_cv_nombre ON public.colaboradores_cv(nombre);
CREATE INDEX idx_colaboradores_cv_nivel ON public.colaboradores_cv(nivel_id);
CREATE INDEX idx_colaboradores_cv_zona ON public.colaboradores_cv(zona_id);
CREATE INDEX idx_colaboradores_cv_estado ON public.colaboradores_cv(estado);
CREATE INDEX idx_colaboradores_cv_activo ON public.colaboradores_cv(activo);

-- ============================================================================
-- 6. TABLA DE PRODUCTOS CV
-- Productos/servicios que se venden
-- ============================================================================
DROP TABLE IF EXISTS public.productos_cv CASCADE;
CREATE TABLE public.productos_cv (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre TEXT NOT NULL,
    codigo TEXT,
    descripcion TEXT,

    -- Categorización
    operador_id UUID REFERENCES public.operadores_cv(id),
    sector TEXT DEFAULT 'TELEFONIA', -- TELEFONIA, ENERGIA, SEGURIDAD
    familia TEXT DEFAULT 'importado', -- Fibra, Móvil, Luz, Gas, Alarma, etc.

    -- Precios y comisiones
    pvp DECIMAL(10,2) DEFAULT 0, -- Precio venta al público
    comision_tipo TEXT DEFAULT 'porcentaje', -- 'porcentaje' o 'fijo'
    comision_valor DECIMAL(10,6) DEFAULT 0.15, -- Valor de la comisión

    -- Estado
    activo BOOLEAN DEFAULT true,
    fecha_alta DATE DEFAULT CURRENT_DATE,
    fecha_baja DATE,

    -- Contacto del producto (si aplica)
    contacto TEXT,
    email TEXT,
    telefono TEXT,
    observaciones TEXT,

    -- Historial de cambios
    historial JSONB DEFAULT '[]'::JSONB,
    metadata JSONB DEFAULT '{}'::JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_productos_cv_nombre ON public.productos_cv(nombre);
CREATE INDEX idx_productos_cv_codigo ON public.productos_cv(codigo);
CREATE INDEX idx_productos_cv_operador ON public.productos_cv(operador_id);
CREATE INDEX idx_productos_cv_sector ON public.productos_cv(sector);
CREATE INDEX idx_productos_cv_familia ON public.productos_cv(familia);
CREATE INDEX idx_productos_cv_activo ON public.productos_cv(activo);

-- ============================================================================
-- 7. TABLA DE VENTAS CV
-- Registro de ventas realizadas
-- ============================================================================
DROP TABLE IF EXISTS public.ventas_cv CASCADE;
CREATE TABLE public.ventas_cv (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Datos de la venta
    fecha DATE NOT NULL,
    cliente TEXT NOT NULL,
    cif TEXT, -- CIF/DNI del cliente
    telefono_movil TEXT,
    telefono_fijo TEXT,

    -- Relaciones
    colaborador_id UUID REFERENCES public.colaboradores_cv(id),
    producto_id UUID REFERENCES public.productos_cv(id),
    operador_id UUID REFERENCES public.operadores_cv(id),
    zona_id UUID REFERENCES public.zonas_cv(id),

    -- Valores económicos
    pvp DECIMAL(10,2) NOT NULL DEFAULT 0,
    cantidad INTEGER DEFAULT 1,

    -- Estado de la venta
    estado TEXT DEFAULT 'PENDIENTE', -- PENDIENTE, CONFIRMADA, CERRADA, LIQUIDADA, CANCELADA, INCIDENCIA

    -- Campos calculados (para optimizar consultas)
    mes INTEGER,
    año INTEGER,

    -- Campos adicionales
    observaciones TEXT,
    numeracion TEXT, -- Número de línea, contrato, etc.

    -- Datos extra dinámicos
    extras JSONB DEFAULT '{}'::JSONB,
    metadata JSONB DEFAULT '{}'::JSONB,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ventas_cv_fecha ON public.ventas_cv(fecha);
CREATE INDEX idx_ventas_cv_colaborador ON public.ventas_cv(colaborador_id);
CREATE INDEX idx_ventas_cv_producto ON public.ventas_cv(producto_id);
CREATE INDEX idx_ventas_cv_operador ON public.ventas_cv(operador_id);
CREATE INDEX idx_ventas_cv_zona ON public.ventas_cv(zona_id);
CREATE INDEX idx_ventas_cv_estado ON public.ventas_cv(estado);
CREATE INDEX idx_ventas_cv_mes_año ON public.ventas_cv(mes, año);
CREATE INDEX idx_ventas_cv_cliente ON public.ventas_cv(cliente);

-- ============================================================================
-- 8. TABLA DE REGLAS CV
-- Reglas de comisiones especiales
-- ============================================================================
DROP TABLE IF EXISTS public.reglas_cv CASCADE;
CREATE TABLE public.reglas_cv (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre TEXT NOT NULL,
    descripcion TEXT,
    tipo TEXT CHECK (tipo IN ('porcentaje', 'fija', 'escalonada', 'bonus')),

    -- Condiciones de aplicación
    producto_id UUID REFERENCES public.productos_cv(id),
    operador_id UUID REFERENCES public.operadores_cv(id),
    nivel_id UUID REFERENCES public.niveles_cv(id),
    zona_id UUID REFERENCES public.zonas_cv(id),

    -- Valor de la regla
    valor DECIMAL(10,2),

    -- Condiciones complejas en JSON
    condiciones JSONB DEFAULT '{}'::JSONB,
    acciones JSONB DEFAULT '[]'::JSONB,

    -- Prioridad y estado
    prioridad INTEGER DEFAULT 0,
    activo BOOLEAN DEFAULT true,

    metadata JSONB DEFAULT '{}'::JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_reglas_cv_producto ON public.reglas_cv(producto_id);
CREATE INDEX idx_reglas_cv_operador ON public.reglas_cv(operador_id);
CREATE INDEX idx_reglas_cv_nivel ON public.reglas_cv(nivel_id);
CREATE INDEX idx_reglas_cv_activo ON public.reglas_cv(activo);

-- ============================================================================
-- 9. TABLA DE LIQUIDACIONES CV
-- Liquidaciones de comisiones a colaboradores
-- ============================================================================
DROP TABLE IF EXISTS public.liquidaciones_cv CASCADE;
CREATE TABLE public.liquidaciones_cv (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    colaborador_id UUID REFERENCES public.colaboradores_cv(id),

    -- Período
    mes INTEGER NOT NULL,
    año INTEGER NOT NULL,
    fecha_desde DATE,
    fecha_hasta DATE,

    -- Totales
    total_ventas DECIMAL(10,2) DEFAULT 0,
    total_comisiones DECIMAL(10,2) DEFAULT 0,
    total_irpf DECIMAL(10,2) DEFAULT 0,
    total_neto DECIMAL(10,2) DEFAULT 0,

    -- Estado
    estado TEXT DEFAULT 'PENDIENTE', -- PENDIENTE, CALCULADA, PAGADA, CANCELADA
    fecha_pago DATE,

    -- Detalles
    detalle JSONB DEFAULT '[]'::JSONB, -- Array de ventas incluidas
    observaciones TEXT,

    metadata JSONB DEFAULT '{}'::JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_liquidaciones_cv_colaborador ON public.liquidaciones_cv(colaborador_id);
CREATE INDEX idx_liquidaciones_cv_mes_año ON public.liquidaciones_cv(mes, año);
CREATE INDEX idx_liquidaciones_cv_estado ON public.liquidaciones_cv(estado);

-- ============================================================================
-- 10. TABLA DE DECOMISIONES CV
-- Registro de anulaciones/devoluciones de comisiones
-- ============================================================================
DROP TABLE IF EXISTS public.decomisiones_cv CASCADE;
CREATE TABLE public.decomisiones_cv (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    venta_id UUID REFERENCES public.ventas_cv(id),
    colaborador_id UUID REFERENCES public.colaboradores_cv(id),

    fecha DATE NOT NULL,
    motivo TEXT,
    importe DECIMAL(10,2) NOT NULL,

    estado TEXT DEFAULT 'PENDIENTE', -- PENDIENTE, APLICADA, CANCELADA

    metadata JSONB DEFAULT '{}'::JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_decomisiones_cv_venta ON public.decomisiones_cv(venta_id);
CREATE INDEX idx_decomisiones_cv_colaborador ON public.decomisiones_cv(colaborador_id);
CREATE INDEX idx_decomisiones_cv_fecha ON public.decomisiones_cv(fecha);

-- ============================================================================
-- 11. TABLA DE CONFIGURACIÓN DE EMPRESA CV
-- ============================================================================
DROP TABLE IF EXISTS public.empresa_config_cv CASCADE;
CREATE TABLE public.empresa_config_cv (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre TEXT,
    cif TEXT,
    direccion TEXT,
    telefono TEXT,
    email TEXT,
    logo_url TEXT,
    configuracion JSONB DEFAULT '{}'::JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Solo permitir un registro de configuración
CREATE UNIQUE INDEX idx_empresa_config_cv_singleton ON public.empresa_config_cv ((1));

-- ============================================================================
-- 12. TABLA DE CAMPOS PERSONALIZADOS CV
-- ============================================================================
DROP TABLE IF EXISTS public.custom_fields_cv CASCADE;
CREATE TABLE public.custom_fields_cv (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entidad TEXT NOT NULL CHECK (entidad IN ('venta', 'colaborador', 'producto', 'cliente')),
    nombre TEXT NOT NULL,
    tipo TEXT NOT NULL CHECK (tipo IN ('texto', 'numero', 'fecha', 'select', 'checkbox')),
    opciones JSONB DEFAULT '[]'::JSONB,
    requerido BOOLEAN DEFAULT false,
    activo BOOLEAN DEFAULT true,
    orden INTEGER DEFAULT 0,
    metadata JSONB DEFAULT '{}'::JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_custom_fields_cv_entidad ON public.custom_fields_cv(entidad);
CREATE INDEX idx_custom_fields_cv_activo ON public.custom_fields_cv(activo);

-- ============================================================================
-- 13. TABLA DE USUARIOS CV (para autenticación y permisos)
-- ============================================================================
DROP TABLE IF EXISTS public.usuarios_cv CASCADE;
CREATE TABLE public.usuarios_cv (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
    nombre_completo TEXT,
    email TEXT NOT NULL,
    rol TEXT NOT NULL DEFAULT 'user' CHECK (rol IN ('admin', 'user', 'viewer')),
    activo BOOLEAN DEFAULT true,
    app_access TEXT[] DEFAULT ARRAY['CV']::TEXT[],
    metadata JSONB DEFAULT '{}'::JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_usuarios_cv_user_id ON public.usuarios_cv(user_id);
CREATE INDEX idx_usuarios_cv_email ON public.usuarios_cv(email);
CREATE INDEX idx_usuarios_cv_rol ON public.usuarios_cv(rol);

-- ============================================================================
-- 14. FUNCIONES DE ACTUALIZACIÓN AUTOMÁTICA
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Función para calcular mes y año automáticamente en ventas
CREATE OR REPLACE FUNCTION calculate_mes_año_cv()
RETURNS TRIGGER AS $$
BEGIN
    NEW.mes = EXTRACT(MONTH FROM NEW.fecha);
    NEW.año = EXTRACT(YEAR FROM NEW.fecha);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 15. TRIGGERS
-- ============================================================================

-- Triggers para updated_at
DROP TRIGGER IF EXISTS update_ventas_cv_updated_at ON public.ventas_cv;
CREATE TRIGGER update_ventas_cv_updated_at BEFORE UPDATE ON public.ventas_cv
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_colaboradores_cv_updated_at ON public.colaboradores_cv;
CREATE TRIGGER update_colaboradores_cv_updated_at BEFORE UPDATE ON public.colaboradores_cv
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_productos_cv_updated_at ON public.productos_cv;
CREATE TRIGGER update_productos_cv_updated_at BEFORE UPDATE ON public.productos_cv
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_operadores_cv_updated_at ON public.operadores_cv;
CREATE TRIGGER update_operadores_cv_updated_at BEFORE UPDATE ON public.operadores_cv
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_zonas_cv_updated_at ON public.zonas_cv;
CREATE TRIGGER update_zonas_cv_updated_at BEFORE UPDATE ON public.zonas_cv
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_niveles_cv_updated_at ON public.niveles_cv;
CREATE TRIGGER update_niveles_cv_updated_at BEFORE UPDATE ON public.niveles_cv
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_reglas_cv_updated_at ON public.reglas_cv;
CREATE TRIGGER update_reglas_cv_updated_at BEFORE UPDATE ON public.reglas_cv
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_liquidaciones_cv_updated_at ON public.liquidaciones_cv;
CREATE TRIGGER update_liquidaciones_cv_updated_at BEFORE UPDATE ON public.liquidaciones_cv
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_decomisiones_cv_updated_at ON public.decomisiones_cv;
CREATE TRIGGER update_decomisiones_cv_updated_at BEFORE UPDATE ON public.decomisiones_cv
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_usuarios_cv_updated_at ON public.usuarios_cv;
CREATE TRIGGER update_usuarios_cv_updated_at BEFORE UPDATE ON public.usuarios_cv
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_empresa_config_cv_updated_at ON public.empresa_config_cv;
CREATE TRIGGER update_empresa_config_cv_updated_at BEFORE UPDATE ON public.empresa_config_cv
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger para calcular mes/año en ventas
DROP TRIGGER IF EXISTS calculate_ventas_cv_mes_año ON public.ventas_cv;
CREATE TRIGGER calculate_ventas_cv_mes_año BEFORE INSERT OR UPDATE ON public.ventas_cv
    FOR EACH ROW EXECUTE FUNCTION calculate_mes_año_cv();

-- ============================================================================
-- 16. TRIGGER PARA CREAR PERFIL DE USUARIO AUTOMÁTICAMENTE
-- ============================================================================

CREATE OR REPLACE FUNCTION create_user_profile_cv()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.usuarios_cv (user_id, email, nombre_completo, rol, activo, app_access)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
        'user',
        true,
        ARRAY['CV']::TEXT[]
    )
    ON CONFLICT (user_id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created_cv ON auth.users;
CREATE TRIGGER on_auth_user_created_cv
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION create_user_profile_cv();

-- ============================================================================
-- 17. HABILITAR ROW LEVEL SECURITY (RLS)
-- ============================================================================

ALTER TABLE public.ventas_cv ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.colaboradores_cv ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.productos_cv ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.operadores_cv ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.zonas_cv ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.niveles_cv ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reglas_cv ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.liquidaciones_cv ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.decomisiones_cv ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.empresa_config_cv ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_fields_cv ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usuarios_cv ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 18. POLÍTICAS RLS
-- ============================================================================

-- Función para verificar acceso a CV
CREATE OR REPLACE FUNCTION tiene_acceso_cv()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.usuarios_cv
        WHERE user_id = auth.uid()
        AND 'CV' = ANY(app_access)
        AND activo = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para verificar si es admin
CREATE OR REPLACE FUNCTION es_admin_cv()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.usuarios_cv
        WHERE user_id = auth.uid()
        AND rol = 'admin'
        AND activo = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- POLÍTICAS PARA TODAS LAS TABLAS
-- ============================================================================

-- VENTAS
DROP POLICY IF EXISTS "cv_ventas_select" ON public.ventas_cv;
CREATE POLICY "cv_ventas_select" ON public.ventas_cv FOR SELECT USING (tiene_acceso_cv());

DROP POLICY IF EXISTS "cv_ventas_insert" ON public.ventas_cv;
CREATE POLICY "cv_ventas_insert" ON public.ventas_cv FOR INSERT WITH CHECK (tiene_acceso_cv());

DROP POLICY IF EXISTS "cv_ventas_update" ON public.ventas_cv;
CREATE POLICY "cv_ventas_update" ON public.ventas_cv FOR UPDATE USING (tiene_acceso_cv());

DROP POLICY IF EXISTS "cv_ventas_delete" ON public.ventas_cv;
CREATE POLICY "cv_ventas_delete" ON public.ventas_cv FOR DELETE USING (es_admin_cv());

-- COLABORADORES
DROP POLICY IF EXISTS "cv_colaboradores_all" ON public.colaboradores_cv;
CREATE POLICY "cv_colaboradores_all" ON public.colaboradores_cv FOR ALL USING (tiene_acceso_cv());

-- PRODUCTOS
DROP POLICY IF EXISTS "cv_productos_all" ON public.productos_cv;
CREATE POLICY "cv_productos_all" ON public.productos_cv FOR ALL USING (tiene_acceso_cv());

-- OPERADORES
DROP POLICY IF EXISTS "cv_operadores_all" ON public.operadores_cv;
CREATE POLICY "cv_operadores_all" ON public.operadores_cv FOR ALL USING (tiene_acceso_cv());

-- ZONAS
DROP POLICY IF EXISTS "cv_zonas_all" ON public.zonas_cv;
CREATE POLICY "cv_zonas_all" ON public.zonas_cv FOR ALL USING (tiene_acceso_cv());

-- NIVELES
DROP POLICY IF EXISTS "cv_niveles_all" ON public.niveles_cv;
CREATE POLICY "cv_niveles_all" ON public.niveles_cv FOR ALL USING (tiene_acceso_cv());

-- REGLAS
DROP POLICY IF EXISTS "cv_reglas_all" ON public.reglas_cv;
CREATE POLICY "cv_reglas_all" ON public.reglas_cv FOR ALL USING (tiene_acceso_cv());

-- LIQUIDACIONES
DROP POLICY IF EXISTS "cv_liquidaciones_all" ON public.liquidaciones_cv;
CREATE POLICY "cv_liquidaciones_all" ON public.liquidaciones_cv FOR ALL USING (tiene_acceso_cv());

-- DECOMISIONES
DROP POLICY IF EXISTS "cv_decomisiones_all" ON public.decomisiones_cv;
CREATE POLICY "cv_decomisiones_all" ON public.decomisiones_cv FOR ALL USING (tiene_acceso_cv());

-- EMPRESA CONFIG
DROP POLICY IF EXISTS "cv_empresa_select" ON public.empresa_config_cv;
CREATE POLICY "cv_empresa_select" ON public.empresa_config_cv FOR SELECT USING (tiene_acceso_cv());

DROP POLICY IF EXISTS "cv_empresa_modify" ON public.empresa_config_cv;
CREATE POLICY "cv_empresa_modify" ON public.empresa_config_cv FOR ALL USING (es_admin_cv());

-- CUSTOM FIELDS
DROP POLICY IF EXISTS "cv_custom_fields_all" ON public.custom_fields_cv;
CREATE POLICY "cv_custom_fields_all" ON public.custom_fields_cv FOR ALL USING (tiene_acceso_cv());

-- USUARIOS
DROP POLICY IF EXISTS "cv_usuarios_select_own" ON public.usuarios_cv;
CREATE POLICY "cv_usuarios_select_own" ON public.usuarios_cv FOR SELECT
    USING (user_id = auth.uid() OR es_admin_cv());

-- Permitir que usuarios autenticados creen su PROPIO perfil (solo una vez, solo su user_id)
DROP POLICY IF EXISTS "cv_usuarios_insert_own" ON public.usuarios_cv;
CREATE POLICY "cv_usuarios_insert_own" ON public.usuarios_cv FOR INSERT
    WITH CHECK (user_id = auth.uid());

-- Solo admins pueden modificar o eliminar perfiles
DROP POLICY IF EXISTS "cv_usuarios_update" ON public.usuarios_cv;
CREATE POLICY "cv_usuarios_update" ON public.usuarios_cv FOR UPDATE
    USING (es_admin_cv() OR user_id = auth.uid());

DROP POLICY IF EXISTS "cv_usuarios_delete" ON public.usuarios_cv;
CREATE POLICY "cv_usuarios_delete" ON public.usuarios_cv FOR DELETE USING (es_admin_cv());

-- ============================================================================
-- 19. DATOS INICIALES
-- ============================================================================

-- Insertar configuración de empresa vacía
INSERT INTO public.empresa_config_cv (nombre) VALUES ('Mi Empresa') ON CONFLICT DO NOTHING;

-- Insertar niveles por defecto
INSERT INTO public.niveles_cv (nombre, descripcion, pct_colaborador_default, pct_telefonia, pct_energia, fijo_seguridad, orden)
VALUES
    ('BASIC', 'Nivel básico de entrada', 0.40, 0.40, 0.40, 200, 1),
    ('STANDARD', 'Nivel estándar', 0.50, 0.50, 0.50, 225, 2),
    ('PREMIUM', 'Nivel premium', 0.60, 0.60, 0.60, 250, 3),
    ('VIP', 'Nivel VIP', 0.70, 0.70, 0.70, 300, 4)
ON CONFLICT DO NOTHING;

-- Insertar zonas por defecto
INSERT INTO public.zonas_cv (nombre, impuesto_tipo, impuesto_pct)
VALUES
    ('Península', 'IVA', 0.21),
    ('Canarias', 'IGIC', 0.07),
    ('Ceuta', 'IPSI', 0.10),
    ('Melilla', 'IPSI', 0.10)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- FIN DEL SCRIPT
-- ============================================================================

-- Para verificar que todas las tablas se crearon correctamente:
-- SELECT table_name FROM information_schema.tables
-- WHERE table_schema = 'public'
-- AND table_name LIKE '%_cv'
-- ORDER BY table_name;
