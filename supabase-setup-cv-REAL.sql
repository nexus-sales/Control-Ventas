-- ============================================================================
-- CONFIGURACIÓN COMPLETA DE TABLAS PARA CONTROL DE VENTAS (CV)
-- Proyecto Supabase: MisApp
-- Todas las tablas usan sufijo _cv para diferenciarse de otras apps
--
-- Versión: 3.0 — RESET COMPLETO (2026-07-04)
-- Este script sustituye a supabase-setup-cv-REAL.sql v2.0 y a TODAS las
-- migraciones incrementales en migrations/ (que quedan como archivo histórico
-- de diagnóstico, no hace falta volver a aplicarlas). Consolida:
--   - El esquema base original.
--   - migrations/2026xxxx_ids_texto_no_uuid.sql (ids TEXT, no UUID).
--   - migrations/2026xxxx_operadores_productos_reglas_columnas_faltantes.sql.
--   - migrations/2026xxxx_ventas_customfields.sql,
--     2026xxxx_ventas_documento.sql, 2026xxxx_ventas_fecha_baja_periodo_compromiso.sql.
--   - migrations/2026xxxx_fix_trigger_updated_at_typo.sql (el trigger de abajo
--     ya usa NEW.updated_at correctamente — la causa raíz de que nada
--     sincronizara en producción era un typo NEW.updatedAt en esta función).
--   - migrations/2026xxxx_rls_viewer_no_escritura*.sql (política puede_editar_cv()).
--   - migrations/2026xxxx_trigger_bloquear_autoescalada_usuarios_cv.sql.
--   - Corrige además dos tablas que nunca coincidieron con lo que la app
--     realmente envía (ver detalle en cada tabla): empresa_config_cv y
--     custom_fields_cv.
--
-- ⚠️ EJECUTAR ESTO BORRA TODOS LOS DATOS ACTUALES EN SUPABASE de esta app.
-- Después de ejecutarlo: entra en la app, inicia sesión y usa "Sincronizar
-- ahora" para volver a subir los datos que cada dispositivo tenga en local.
-- ============================================================================

-- ============================================================================
-- 1. EXTENSIONES NECESARIAS
-- ============================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp"; -- solo la usa usuarios_cv.id (Auth)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- 2. TABLA DE OPERADORES CV
-- ============================================================================
DROP TABLE IF EXISTS public.operadores_cv CASCADE;
CREATE TABLE public.operadores_cv (
    id TEXT PRIMARY KEY, -- generado por la app (generateReadableId), no por Postgres
    nombre TEXT NOT NULL,
    sector TEXT DEFAULT 'TELEFONIA', -- TELEFONIA, ENERGIA, SEGURIDAD, OTRO
    codigo TEXT,
    contacto TEXT,
    telefono TEXT,
    email TEXT,
    color TEXT, -- Para UI
    activo BOOLEAN DEFAULT true,
    observaciones TEXT,

    -- Reglas de decomisión (OperadorModal.jsx)
    reglas_decomision JSONB DEFAULT '{}'::JSONB,
    fecha_actualizacion TIMESTAMPTZ,

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
-- ============================================================================
DROP TABLE IF EXISTS public.zonas_cv CASCADE;
CREATE TABLE public.zonas_cv (
    id TEXT PRIMARY KEY,
    nombre TEXT NOT NULL,
    codigo TEXT,
    impuesto_tipo TEXT DEFAULT 'IVA', -- IVA, IGIC, IPSI
    impuesto_pct DECIMAL(5,4) DEFAULT 0.21,
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
-- ============================================================================
DROP TABLE IF EXISTS public.niveles_cv CASCADE;
CREATE TABLE public.niveles_cv (
    id TEXT PRIMARY KEY,
    nombre TEXT NOT NULL,
    descripcion TEXT,
    tipo TEXT DEFAULT 'COMERCIAL', -- COMERCIAL, COORDINADOR, JEFE_EQUIPO

    pct_colaborador_default DECIMAL(5,4) DEFAULT 0.50,
    pct_telefonia DECIMAL(5,4) DEFAULT 0.50,
    pct_energia DECIMAL(5,4) DEFAULT 0.50,
    fijo_seguridad DECIMAL(10,2) DEFAULT 225.00,

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
-- ============================================================================
DROP TABLE IF EXISTS public.colaboradores_cv CASCADE;
CREATE TABLE public.colaboradores_cv (
    id TEXT PRIMARY KEY,
    nombre TEXT NOT NULL,
    apellidos TEXT,
    email TEXT,
    telefono TEXT,
    direccion TEXT,
    cif_dni TEXT,

    tipo_fiscal TEXT DEFAULT 'AUTONOMO', -- AUTONOMO, AUTONOMO_ESPECIAL, EMPRESA
    irpf DECIMAL(5,4) DEFAULT 0,
    exento_impuestos BOOLEAN DEFAULT false,

    nivel_id TEXT REFERENCES public.niveles_cv(id),
    zona_id TEXT REFERENCES public.zonas_cv(id),

    comision_personalizada DECIMAL(10,2),
    comision_tipo_personalizada TEXT, -- 'fijo' o 'porcentaje'
    pct_colaborador DECIMAL(5,4) DEFAULT 0.50,

    pct_telefonia DECIMAL(5,4),
    pct_energia DECIMAL(5,4),
    fijo_seguridad DECIMAL(10,2),

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
-- ============================================================================
DROP TABLE IF EXISTS public.productos_cv CASCADE;
CREATE TABLE public.productos_cv (
    id TEXT PRIMARY KEY,
    nombre TEXT NOT NULL,
    codigo TEXT,
    descripcion TEXT,

    operador_id TEXT REFERENCES public.operadores_cv(id),
    sector TEXT DEFAULT 'TELEFONIA',
    familia TEXT DEFAULT 'importado',

    pvp DECIMAL(10,2) DEFAULT 0,
    comision_tipo TEXT DEFAULT 'porcentaje', -- 'porcentaje', 'fijo' o 'mixto'
    comision_valor DECIMAL(10,6) DEFAULT 0.15,

    -- Vigencia e histórico de comisiones (ProductoModal.jsx, modo "mixto")
    comision_vigencia_desde DATE,
    comision_vigencia_hasta DATE,
    comision_cliente_nuevo DECIMAL(12,4),
    comision_cliente_existente DECIMAL(12,4),
    comision_portabilidad DECIMAL(12,4),
    comision_alta_nueva DECIMAL(12,4),
    comision_fija DECIMAL(12,4),
    comision_porcentaje DECIMAL(12,4),
    comisiones_historial JSONB DEFAULT '[]'::JSONB,
    fecha_actualizacion TIMESTAMPTZ,

    activo BOOLEAN DEFAULT true,
    fecha_alta DATE DEFAULT CURRENT_DATE,
    fecha_baja DATE,

    contacto TEXT,
    email TEXT,
    telefono TEXT,
    observaciones TEXT,

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
-- ============================================================================
DROP TABLE IF EXISTS public.ventas_cv CASCADE;
CREATE TABLE public.ventas_cv (
    id TEXT PRIMARY KEY,

    fecha DATE NOT NULL,
    cliente TEXT NOT NULL,
    cif TEXT,
    telefono_movil TEXT,
    telefono_fijo TEXT,

    colaborador_id TEXT REFERENCES public.colaboradores_cv(id),
    producto_id TEXT REFERENCES public.productos_cv(id),
    operador_id TEXT REFERENCES public.operadores_cv(id),
    zona_id TEXT REFERENCES public.zonas_cv(id),

    pvp DECIMAL(10,2) NOT NULL DEFAULT 0,
    cantidad INTEGER DEFAULT 1,

    estado TEXT DEFAULT 'PENDIENTE',

    mes INTEGER,
    año INTEGER,

    observaciones TEXT,
    numeracion TEXT,
    documento TEXT, -- referencia de contrato en papel, distinta de numeracion

    -- Decomisiones (calcularDecomisiones() en liquidacionesUtils.js)
    fecha_baja DATE,
    periodo_compromiso INTEGER,

    -- Campos personalizados (Config → Campos personalizados, módulo 'ventas').
    -- Nombre en camelCase con comillas dobles: Postgres pliega a minúsculas
    -- los identificadores sin comillas, y supabase-js siempre pide esta
    -- columna exactamente como "customFields".
    "customFields" JSONB DEFAULT '{}'::JSONB,

    extras JSONB DEFAULT '{}'::JSONB,
    metadata JSONB DEFAULT '{}'::JSONB,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON COLUMN public.ventas_cv.documento IS
  'Referencia de contrato en papel u otro documento asociado a la venta. Opcional, distinto de numeracion (línea/recurso).';
COMMENT ON COLUMN public.ventas_cv.fecha_baja IS
  'Fecha en que el cliente canceló el servicio de esta venta, si aplica. NULL mientras el cliente sigue activo o no se ha registrado la baja.';
COMMENT ON COLUMN public.ventas_cv.periodo_compromiso IS
  'Meses de permanencia pactados con el operador para esta venta. NULL si no aplica o no se ha registrado.';

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
-- ============================================================================
DROP TABLE IF EXISTS public.reglas_cv CASCADE;
CREATE TABLE public.reglas_cv (
    id TEXT PRIMARY KEY,
    nombre TEXT NOT NULL,
    descripcion TEXT,
    tipo TEXT CHECK (tipo IN ('porcentaje', 'fija', 'escalonada', 'bonus')),
    sector TEXT, -- ReglaEditModal.jsx

    producto_id TEXT REFERENCES public.productos_cv(id),
    operador_id TEXT REFERENCES public.operadores_cv(id),
    nivel_id TEXT REFERENCES public.niveles_cv(id),
    zona_id TEXT REFERENCES public.zonas_cv(id),

    valor DECIMAL(10,2),

    condiciones JSONB DEFAULT '{}'::JSONB,
    acciones JSONB DEFAULT '[]'::JSONB,

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
-- Columnas alineadas EXACTAMENTE con el objeto que genera generar() en
-- LiquidacionesPage.jsx: { id, periodo, colaborador_id, colaborador_tipo,
-- colaborador_nombre, zona_fiscal, bruto, irpf, impuesto_zona, decomisiones,
-- neto, total_con_impuesto, estado, fecha_generacion, notas,
-- ventas_incluidas, decomisiones_incluidas }. El esquema anterior (mes/año,
-- total_ventas, total_comisiones, detalle...) no tenía NINGUNO de estos
-- nombres — CAMPOS_VALIDOS.liquidaciones dejaba pasar solo id/colaborador_id/
-- estado, así que cualquier sincronización + recarga vaciaba los importes
-- reales de toda liquidación generada.
-- ============================================================================
DROP TABLE IF EXISTS public.liquidaciones_cv CASCADE;
CREATE TABLE public.liquidaciones_cv (
    id TEXT PRIMARY KEY,
    periodo TEXT NOT NULL, -- 'YYYY-MM'
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

-- ============================================================================
-- 10. TABLA DE DECOMISIONES CV
-- Columnas alineadas EXACTAMENTE con calcularDecomisiones() en
-- liquidacionesUtils.js: { venta_id, cliente_nombre, operador_id,
-- operador_nombre, colaborador_id, fecha_venta, fecha_baja,
-- meses_comprometidos, meses_transcurridos, porcentaje_cumplido,
-- regla_aplicada, porcentaje_decomision, comision_original,
-- importe_decomision, estado } + fecha_generacion (añadido al guardar en
-- LiquidacionesPage.jsx). El esquema anterior (fecha/motivo/importe) no
-- coincidía con ninguno de estos nombres.
-- ============================================================================
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

-- ============================================================================
-- 11. TABLA DE CONFIGURACIÓN DE EMPRESA CV
-- Columnas alineadas EXACTAMENTE con el objeto que envía ConfigSections.jsx:
-- { id, nombre, cif, direccion, telefono, email, web, logoUrl, colorCorporativo }
-- (antes la tabla tenía logo_url en vez de logoUrl y no tenía web ni
-- colorCorporativo — cualquier guardado de empresa fallaba con PGRST204).
-- ============================================================================
DROP TABLE IF EXISTS public.empresa_config_cv CASCADE;
CREATE TABLE public.empresa_config_cv (
    id TEXT PRIMARY KEY,
    nombre TEXT,
    cif TEXT,
    direccion TEXT,
    telefono TEXT,
    email TEXT,
    web TEXT,
    "logoUrl" TEXT,
    "colorCorporativo" TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 12. TABLA DE CAMPOS PERSONALIZADOS CV
-- Columnas alineadas EXACTAMENTE con customFieldsModel.js / CustomFieldsSection.jsx:
-- { id, nombre, tipo, modulo, opciones, requerido, orden, activo, creado_en, actualizado_en }
-- (antes la tabla tenía "entidad" NOT NULL con CHECK en valores que la app
-- nunca envía — 'venta'/'colaborador'/'producto'/'cliente' en vez de
-- 'ventas'/'productos'/'operadores' — y created_at/updated_at en vez de
-- creado_en/actualizado_en: cualquier alta de campo personalizado fallaba).
-- creado_en/actualizado_en los pone la app (crearCampoPersonalizado), por eso
-- esta tabla no lleva el trigger genérico de updated_at.
-- ============================================================================
DROP TABLE IF EXISTS public.custom_fields_cv CASCADE;
CREATE TABLE public.custom_fields_cv (
    id TEXT PRIMARY KEY,
    nombre TEXT NOT NULL,
    tipo TEXT NOT NULL CHECK (tipo IN ('texto', 'numero', 'fecha', 'select', 'checkbox')),
    modulo TEXT NOT NULL CHECK (modulo IN ('ventas', 'productos', 'operadores')),
    opciones JSONB DEFAULT '[]'::JSONB,
    requerido BOOLEAN DEFAULT false,
    orden INTEGER DEFAULT 0,
    activo BOOLEAN DEFAULT true,
    creado_en TIMESTAMPTZ DEFAULT NOW(),
    actualizado_en TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_custom_fields_cv_modulo ON public.custom_fields_cv(modulo);
CREATE INDEX idx_custom_fields_cv_activo ON public.custom_fields_cv(activo);

-- ============================================================================
-- 13. TABLA DE USUARIOS CV (rol y permisos específicos de esta app)
-- No la toca la migración de ids TEXT: su id/user_id son de Supabase Auth.
--
-- NO duplica nombre/email: este proyecto Supabase es infraestructura
-- compartida entre varias apps, y `public.profiles` (sin sufijo _cv, id =
-- auth.users.id) ya es la identidad maestra con esos datos, mantenida por
-- el resto del ecosistema. usuarios_cv solo guarda lo específico de Control
-- de Ventas: rol, activo, app_access. La app une ambas tablas en el cliente
-- (fetchProfile en AppContexts.jsx, fetchUsers en UserManagement.jsx).
-- ============================================================================
DROP TABLE IF EXISTS public.usuarios_cv CASCADE;
CREATE TABLE public.usuarios_cv (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
    rol TEXT NOT NULL DEFAULT 'user' CHECK (rol IN ('admin', 'user', 'viewer')),
    activo BOOLEAN DEFAULT true,
    app_access TEXT[] DEFAULT ARRAY['CV']::TEXT[],
    metadata JSONB DEFAULT '{}'::JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_usuarios_cv_user_id ON public.usuarios_cv(user_id);
CREATE INDEX idx_usuarios_cv_rol ON public.usuarios_cv(rol);

-- ============================================================================
-- 14. FUNCIONES DE ACTUALIZACIÓN AUTOMÁTICA
-- ============================================================================

-- OJO: NEW.updated_at, no NEW.updatedAt. Esta función la comparte el trigger
-- de las ~10 tablas _cv con columna updated_at — un typo aquí (como el que
-- hubo en producción: NEW.updatedAt, que Postgres plegaba a "updatedat", una
-- columna inexistente) hace fallar CUALQUIER UPDATE o upsert con
-- ON CONFLICT DO UPDATE en TODAS ellas a la vez con 42703.
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Calcula mes y año automáticamente en ventas a partir de fecha
CREATE OR REPLACE FUNCTION calculate_mes_año_cv()
RETURNS TRIGGER AS $$
BEGIN
    NEW.mes = EXTRACT(MONTH FROM NEW.fecha);
    NEW.año = EXTRACT(YEAR FROM NEW.fecha);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 15. TRIGGERS updated_at (custom_fields_cv queda fuera: usa creado_en/
--     actualizado_en, gestionados por la app, no por esta función)
-- ============================================================================
CREATE TRIGGER update_ventas_cv_updated_at BEFORE UPDATE ON public.ventas_cv
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_colaboradores_cv_updated_at BEFORE UPDATE ON public.colaboradores_cv
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_productos_cv_updated_at BEFORE UPDATE ON public.productos_cv
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_operadores_cv_updated_at BEFORE UPDATE ON public.operadores_cv
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_zonas_cv_updated_at BEFORE UPDATE ON public.zonas_cv
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_niveles_cv_updated_at BEFORE UPDATE ON public.niveles_cv
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reglas_cv_updated_at BEFORE UPDATE ON public.reglas_cv
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_liquidaciones_cv_updated_at BEFORE UPDATE ON public.liquidaciones_cv
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_decomisiones_cv_updated_at BEFORE UPDATE ON public.decomisiones_cv
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_usuarios_cv_updated_at BEFORE UPDATE ON public.usuarios_cv
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_empresa_config_cv_updated_at BEFORE UPDATE ON public.empresa_config_cv
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger para calcular mes/año en ventas
CREATE TRIGGER calculate_ventas_cv_mes_año BEFORE INSERT OR UPDATE ON public.ventas_cv
    FOR EACH ROW EXECUTE FUNCTION calculate_mes_año_cv();

-- ============================================================================
-- 16. TRIGGER PARA CREAR PERFIL DE USUARIO AUTOMÁTICAMENTE
-- ============================================================================

CREATE OR REPLACE FUNCTION create_user_profile_cv()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.usuarios_cv (user_id, rol, activo, app_access)
    VALUES (NEW.id, 'user', false, ARRAY[]::TEXT[])
    ON CONFLICT (user_id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created_cv ON auth.users;
CREATE TRIGGER on_auth_user_created_cv
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION create_user_profile_cv();

-- ============================================================================
-- 17. TRIGGER ANTI-AUTOESCALADA EN usuarios_cv
-- Sin esto, cualquier usuario autenticado podría hacer
-- UPDATE usuarios_cv SET rol='admin', activo=true WHERE user_id=auth.uid()
-- y RLS (que solo mira DE QUIÉN es la fila, no QUÉ columnas cambian) lo
-- dejaría pasar. RLS no puede comparar contra OLD en un WITH CHECK, así que
-- esto se hace con un trigger BEFORE UPDATE.
-- ============================================================================

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

CREATE TRIGGER trg_prevent_self_escalation_usuarios_cv
    BEFORE UPDATE ON public.usuarios_cv
    FOR EACH ROW
    EXECUTE FUNCTION prevent_self_escalation_usuarios_cv();

-- ⚠️ Nota operativa: los triggers de Postgres se ejecutan SIEMPRE, incluso
-- corriendo como `postgres` en el editor SQL de Supabase (auth.uid() es NULL
-- ahí, así que es_admin_cv() da false y este trigger TE BLOQUEARÍA a ti
-- también si intentas promocionar un admin por SQL directo). Gestiona
-- rol/activo/app_access desde la pantalla de Administración de la app
-- (autenticado como admin). Vía de escape si hace falta:
--   SET session_replication_role = replica;
--   UPDATE usuarios_cv SET rol = 'admin', activo = true WHERE user_id = '...';
--   SET session_replication_role = DEFAULT;

-- ============================================================================
-- 18. HABILITAR ROW LEVEL SECURITY (RLS)
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
-- 19. FUNCIONES DE ACCESO
-- ============================================================================

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

-- puede_editar_cv(): igual que tiene_acceso_cv() pero excluye rol='viewer'.
-- Un 'viewer' puede leer (SELECT sigue en tiene_acceso_cv()) pero no
-- insertar/actualizar/borrar.
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
-- 20. POLÍTICAS RLS
-- SELECT abierto a cualquiera con acceso a CV (incluye viewer).
-- INSERT/UPDATE/DELETE requieren puede_editar_cv() (bloquea viewer), salvo
-- donde se indica lo contrario (ventas DELETE y empresa modify: solo admin).
-- ============================================================================

-- VENTAS
CREATE POLICY "cv_ventas_select" ON public.ventas_cv FOR SELECT USING (tiene_acceso_cv());
CREATE POLICY "cv_ventas_insert" ON public.ventas_cv FOR INSERT WITH CHECK (puede_editar_cv());
CREATE POLICY "cv_ventas_update" ON public.ventas_cv FOR UPDATE USING (puede_editar_cv()) WITH CHECK (puede_editar_cv());
CREATE POLICY "cv_ventas_delete" ON public.ventas_cv FOR DELETE USING (es_admin_cv());

-- COLABORADORES
CREATE POLICY "cv_colaboradores_select" ON public.colaboradores_cv FOR SELECT USING (tiene_acceso_cv());
CREATE POLICY "cv_colaboradores_insert" ON public.colaboradores_cv FOR INSERT WITH CHECK (puede_editar_cv());
CREATE POLICY "cv_colaboradores_update" ON public.colaboradores_cv FOR UPDATE USING (puede_editar_cv()) WITH CHECK (puede_editar_cv());
CREATE POLICY "cv_colaboradores_delete" ON public.colaboradores_cv FOR DELETE USING (puede_editar_cv());

-- PRODUCTOS
CREATE POLICY "cv_productos_select" ON public.productos_cv FOR SELECT USING (tiene_acceso_cv());
CREATE POLICY "cv_productos_insert" ON public.productos_cv FOR INSERT WITH CHECK (puede_editar_cv());
CREATE POLICY "cv_productos_update" ON public.productos_cv FOR UPDATE USING (puede_editar_cv()) WITH CHECK (puede_editar_cv());
CREATE POLICY "cv_productos_delete" ON public.productos_cv FOR DELETE USING (puede_editar_cv());

-- OPERADORES
CREATE POLICY "cv_operadores_select" ON public.operadores_cv FOR SELECT USING (tiene_acceso_cv());
CREATE POLICY "cv_operadores_insert" ON public.operadores_cv FOR INSERT WITH CHECK (puede_editar_cv());
CREATE POLICY "cv_operadores_update" ON public.operadores_cv FOR UPDATE USING (puede_editar_cv()) WITH CHECK (puede_editar_cv());
CREATE POLICY "cv_operadores_delete" ON public.operadores_cv FOR DELETE USING (puede_editar_cv());

-- ZONAS
CREATE POLICY "cv_zonas_select" ON public.zonas_cv FOR SELECT USING (tiene_acceso_cv());
CREATE POLICY "cv_zonas_insert" ON public.zonas_cv FOR INSERT WITH CHECK (puede_editar_cv());
CREATE POLICY "cv_zonas_update" ON public.zonas_cv FOR UPDATE USING (puede_editar_cv()) WITH CHECK (puede_editar_cv());
CREATE POLICY "cv_zonas_delete" ON public.zonas_cv FOR DELETE USING (puede_editar_cv());

-- NIVELES
CREATE POLICY "cv_niveles_select" ON public.niveles_cv FOR SELECT USING (tiene_acceso_cv());
CREATE POLICY "cv_niveles_insert" ON public.niveles_cv FOR INSERT WITH CHECK (puede_editar_cv());
CREATE POLICY "cv_niveles_update" ON public.niveles_cv FOR UPDATE USING (puede_editar_cv()) WITH CHECK (puede_editar_cv());
CREATE POLICY "cv_niveles_delete" ON public.niveles_cv FOR DELETE USING (puede_editar_cv());

-- REGLAS
CREATE POLICY "cv_reglas_select" ON public.reglas_cv FOR SELECT USING (tiene_acceso_cv());
CREATE POLICY "cv_reglas_insert" ON public.reglas_cv FOR INSERT WITH CHECK (puede_editar_cv());
CREATE POLICY "cv_reglas_update" ON public.reglas_cv FOR UPDATE USING (puede_editar_cv()) WITH CHECK (puede_editar_cv());
CREATE POLICY "cv_reglas_delete" ON public.reglas_cv FOR DELETE USING (puede_editar_cv());

-- LIQUIDACIONES
CREATE POLICY "cv_liquidaciones_select" ON public.liquidaciones_cv FOR SELECT USING (tiene_acceso_cv());
CREATE POLICY "cv_liquidaciones_insert" ON public.liquidaciones_cv FOR INSERT WITH CHECK (puede_editar_cv());
CREATE POLICY "cv_liquidaciones_update" ON public.liquidaciones_cv FOR UPDATE USING (puede_editar_cv()) WITH CHECK (puede_editar_cv());
CREATE POLICY "cv_liquidaciones_delete" ON public.liquidaciones_cv FOR DELETE USING (puede_editar_cv());

-- DECOMISIONES
CREATE POLICY "cv_decomisiones_select" ON public.decomisiones_cv FOR SELECT USING (tiene_acceso_cv());
CREATE POLICY "cv_decomisiones_insert" ON public.decomisiones_cv FOR INSERT WITH CHECK (puede_editar_cv());
CREATE POLICY "cv_decomisiones_update" ON public.decomisiones_cv FOR UPDATE USING (puede_editar_cv()) WITH CHECK (puede_editar_cv());
CREATE POLICY "cv_decomisiones_delete" ON public.decomisiones_cv FOR DELETE USING (puede_editar_cv());

-- EMPRESA CONFIG (solo admin puede escribir, cualquiera con acceso puede leer)
CREATE POLICY "cv_empresa_select" ON public.empresa_config_cv FOR SELECT USING (tiene_acceso_cv());
CREATE POLICY "cv_empresa_modify" ON public.empresa_config_cv FOR ALL USING (es_admin_cv());

-- CUSTOM FIELDS
CREATE POLICY "cv_custom_fields_select" ON public.custom_fields_cv FOR SELECT USING (tiene_acceso_cv());
CREATE POLICY "cv_custom_fields_insert" ON public.custom_fields_cv FOR INSERT WITH CHECK (puede_editar_cv());
CREATE POLICY "cv_custom_fields_update" ON public.custom_fields_cv FOR UPDATE USING (puede_editar_cv()) WITH CHECK (puede_editar_cv());
CREATE POLICY "cv_custom_fields_delete" ON public.custom_fields_cv FOR DELETE USING (puede_editar_cv());

-- USUARIOS
CREATE POLICY "cv_usuarios_select_own" ON public.usuarios_cv FOR SELECT
    USING (user_id = auth.uid() OR es_admin_cv());

-- Permitir que usuarios autenticados creen su PROPIO perfil (solo una vez, solo su user_id)
CREATE POLICY "cv_usuarios_insert_own" ON public.usuarios_cv FOR INSERT
    WITH CHECK (
        user_id = auth.uid()
        AND rol = 'user'
        AND activo = false
        AND COALESCE(array_length(app_access, 1), 0) = 0
    );

-- Solo admins pueden modificar o eliminar perfiles (además del trigger anti-autoescalada)
CREATE POLICY "cv_usuarios_update" ON public.usuarios_cv FOR UPDATE
    USING (es_admin_cv() OR user_id = auth.uid())
    WITH CHECK (es_admin_cv() OR user_id = auth.uid());

CREATE POLICY "cv_usuarios_delete" ON public.usuarios_cv FOR DELETE USING (es_admin_cv());

-- ============================================================================
-- FIN DEL SCRIPT
-- ============================================================================

-- Para verificar que todas las tablas se crearon correctamente:
-- SELECT table_name FROM information_schema.tables
-- WHERE table_schema = 'public'
-- AND table_name LIKE '%_cv'
-- ORDER BY table_name;
