-- ============================================================================
-- EJEMPLOS DE CONSULTAS Y OPERACIONES PARA CONTROL DE VENTAS (CV)
-- Proyecto Supabase: MIsapp
-- ============================================================================
-- Este script contiene ejemplos prácticos de consultas y operaciones
-- que puedes usar en tu aplicación o para pruebas
-- ============================================================================

-- ============================================================================
-- 1. GESTIÓN DE USUARIOS
-- ============================================================================

-- Ver todos los usuarios CV (solo admin)
SELECT 
    u.nombre_completo,
    u.email,
    u.rol,
    u.activo,
    u.app_access,
    u.created_at,
    au.last_sign_in_at
FROM public.usuarios_cv u
LEFT JOIN auth.users au ON au.id = u.user_id
ORDER BY u.created_at DESC;

-- Ver usuarios pendientes de activación
SELECT 
    nombre_completo,
    email,
    created_at,
    EXTRACT(DAY FROM NOW() - created_at) as dias_pendiente
FROM public.usuarios_cv
WHERE activo = false
ORDER BY created_at DESC;

-- Activar un usuario específico
SELECT public.toggle_usuario_cv_activo(
    (SELECT user_id FROM public.usuarios_cv WHERE email = 'usuario@ejemplo.com'),
    true
);

-- Promover un usuario a admin
SELECT public.cambiar_rol_usuario_cv(
    (SELECT user_id FROM public.usuarios_cv WHERE email = 'usuario@ejemplo.com'),
    'admin'
);

-- Ver información del usuario actual
SELECT * FROM public.usuario_actual_cv;

-- ============================================================================
-- 2. GESTIÓN DE CLIENTES
-- ============================================================================

-- Crear un nuevo cliente
INSERT INTO public.clientes_cv (
    nombre,
    cif_nif,
    email,
    telefono,
    direccion,
    ciudad,
    provincia,
    codigo_postal,
    tipo_cliente,
    estado,
    created_by
) VALUES (
    'Empresa Ejemplo S.L.',
    'B12345678',
    'contacto@ejemplo.com',
    '+34 600 123 456',
    'Calle Principal 123',
    'Madrid',
    'Madrid',
    '28001',
    'empresa',
    'activo',
    auth.uid()
);

-- Ver todos los clientes activos
SELECT 
    c.nombre,
    c.cif_nif,
    c.email,
    c.telefono,
    c.ciudad,
    c.tipo_cliente,
    c.estado,
    u.nombre_completo as creado_por,
    c.created_at
FROM public.clientes_cv c
LEFT JOIN public.usuarios_cv u ON u.user_id = c.created_by
WHERE c.estado = 'activo'
ORDER BY c.nombre;

-- Buscar clientes por nombre o CIF
SELECT 
    nombre,
    cif_nif,
    email,
    telefono,
    estado
FROM public.clientes_cv
WHERE 
    nombre ILIKE '%ejemplo%'
    OR cif_nif ILIKE '%B12345%'
ORDER BY nombre;

-- Estadísticas de clientes por tipo
SELECT 
    tipo_cliente,
    COUNT(*) as total,
    COUNT(CASE WHEN estado = 'activo' THEN 1 END) as activos,
    COUNT(CASE WHEN estado = 'potencial' THEN 1 END) as potenciales
FROM public.clientes_cv
GROUP BY tipo_cliente;

-- ============================================================================
-- 3. GESTIÓN DE PRODUCTOS
-- ============================================================================

-- Crear un nuevo producto
INSERT INTO public.productos_cv (
    codigo,
    nombre,
    descripcion,
    categoria,
    precio_base,
    comision_porcentaje,
    comision_fija,
    activo
) VALUES (
    'ENERGIA-002',
    'Contrato Energía Gas',
    'Contrato de suministro de gas natural',
    'energia',
    0.00,
    3.50,
    0.00,
    true
);

-- Ver todos los productos activos
SELECT 
    codigo,
    nombre,
    categoria,
    precio_base,
    comision_porcentaje,
    comision_fija
FROM public.productos_cv
WHERE activo = true
ORDER BY categoria, nombre;

-- Ver productos por categoría
SELECT 
    categoria,
    COUNT(*) as total_productos,
    AVG(comision_porcentaje) as comision_promedio
FROM public.productos_cv
WHERE activo = true
GROUP BY categoria;

-- ============================================================================
-- 4. GESTIÓN DE VENTAS
-- ============================================================================

-- Crear una nueva venta
WITH nueva_venta AS (
    INSERT INTO public.ventas_cv (
        numero_venta,
        cliente_id,
        vendedor_id,
        fecha_venta,
        estado,
        total_venta,
        total_comision,
        notas
    ) VALUES (
        'VTA-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0'),
        (SELECT id FROM public.clientes_cv WHERE nombre ILIKE '%ejemplo%' LIMIT 1),
        auth.uid(),
        NOW(),
        'pendiente',
        0.00,
        0.00,
        'Venta de ejemplo'
    )
    RETURNING id, numero_venta
)
SELECT * FROM nueva_venta;

-- Agregar detalles a una venta
INSERT INTO public.detalles_venta_cv (
    venta_id,
    producto_id,
    cantidad,
    precio_unitario,
    subtotal,
    comision
)
SELECT 
    (SELECT id FROM public.ventas_cv WHERE numero_venta = 'VTA-20260213-0001'),
    p.id,
    1,
    p.precio_base,
    p.precio_base * 1,
    p.precio_base * (p.comision_porcentaje / 100) + p.comision_fija
FROM public.productos_cv p
WHERE p.codigo = 'ENERGIA-001';

-- Actualizar totales de venta
UPDATE public.ventas_cv v
SET 
    total_venta = (
        SELECT COALESCE(SUM(subtotal), 0)
        FROM public.detalles_venta_cv
        WHERE venta_id = v.id
    ),
    total_comision = (
        SELECT COALESCE(SUM(comision), 0)
        FROM public.detalles_venta_cv
        WHERE venta_id = v.id
    )
WHERE v.numero_venta = 'VTA-20260213-0001';

-- Ver ventas con detalles
SELECT 
    v.numero_venta,
    v.fecha_venta,
    v.estado,
    c.nombre as cliente,
    u.nombre_completo as vendedor,
    v.total_venta,
    v.total_comision,
    COUNT(dv.id) as num_productos
FROM public.ventas_cv v
LEFT JOIN public.clientes_cv c ON c.id = v.cliente_id
LEFT JOIN public.usuarios_cv u ON u.user_id = v.vendedor_id
LEFT JOIN public.detalles_venta_cv dv ON dv.venta_id = v.id
GROUP BY v.id, v.numero_venta, v.fecha_venta, v.estado, c.nombre, u.nombre_completo, v.total_venta, v.total_comision
ORDER BY v.fecha_venta DESC;

-- Ver detalles de una venta específica
SELECT 
    v.numero_venta,
    v.fecha_venta,
    c.nombre as cliente,
    p.nombre as producto,
    dv.cantidad,
    dv.precio_unitario,
    dv.subtotal,
    dv.comision
FROM public.ventas_cv v
JOIN public.detalles_venta_cv dv ON dv.venta_id = v.id
LEFT JOIN public.clientes_cv c ON c.id = v.cliente_id
LEFT JOIN public.productos_cv p ON p.id = dv.producto_id
WHERE v.numero_venta = 'VTA-20260213-0001';

-- Confirmar una venta
UPDATE public.ventas_cv
SET estado = 'confirmada'
WHERE numero_venta = 'VTA-20260213-0001';

-- ============================================================================
-- 5. GESTIÓN DE COMISIONES
-- ============================================================================

-- Crear comisión desde una venta
INSERT INTO public.comisiones_cv (
    venta_id,
    vendedor_id,
    monto_comision,
    estado_pago,
    notas
)
SELECT 
    id,
    vendedor_id,
    total_comision,
    'pendiente',
    'Comisión de venta ' || numero_venta
FROM public.ventas_cv
WHERE numero_venta = 'VTA-20260213-0001'
AND estado = 'confirmada';

-- Ver comisiones pendientes de pago
SELECT 
    c.monto_comision,
    c.created_at,
    v.numero_venta,
    v.fecha_venta,
    cl.nombre as cliente,
    u.nombre_completo as vendedor
FROM public.comisiones_cv c
JOIN public.ventas_cv v ON v.id = c.venta_id
JOIN public.usuarios_cv u ON u.user_id = c.vendedor_id
LEFT JOIN public.clientes_cv cl ON cl.id = v.cliente_id
WHERE c.estado_pago = 'pendiente'
ORDER BY c.created_at DESC;

-- Ver comisiones por vendedor
SELECT 
    u.nombre_completo as vendedor,
    COUNT(*) as num_comisiones,
    SUM(CASE WHEN c.estado_pago = 'pendiente' THEN c.monto_comision ELSE 0 END) as pendiente,
    SUM(CASE WHEN c.estado_pago = 'pagada' THEN c.monto_comision ELSE 0 END) as pagado,
    SUM(c.monto_comision) as total
FROM public.comisiones_cv c
JOIN public.usuarios_cv u ON u.user_id = c.vendedor_id
GROUP BY u.nombre_completo
ORDER BY total DESC;

-- Marcar comisión como pagada
UPDATE public.comisiones_cv
SET 
    estado_pago = 'pagada',
    fecha_pago = NOW()
WHERE id = 'uuid-de-la-comision';

-- ============================================================================
-- 6. GESTIÓN DE OPORTUNIDADES (PIPELINE)
-- ============================================================================

-- Crear una nueva oportunidad
INSERT INTO public.oportunidades_cv (
    titulo,
    cliente_id,
    vendedor_id,
    etapa,
    valor_estimado,
    probabilidad,
    fecha_cierre_estimada,
    notas
) VALUES (
    'Oportunidad Energía Empresa XYZ',
    (SELECT id FROM public.clientes_cv WHERE nombre ILIKE '%ejemplo%' LIMIT 1),
    auth.uid(),
    'contacto_inicial',
    5000.00,
    20,
    NOW() + INTERVAL '30 days',
    'Cliente interesado en cambiar de proveedor'
);

-- Ver pipeline completo
SELECT 
    o.titulo,
    o.etapa,
    o.valor_estimado,
    o.probabilidad,
    o.fecha_cierre_estimada,
    c.nombre as cliente,
    u.nombre_completo as vendedor,
    EXTRACT(DAY FROM o.fecha_cierre_estimada - NOW()) as dias_hasta_cierre
FROM public.oportunidades_cv o
LEFT JOIN public.clientes_cv c ON c.id = o.cliente_id
LEFT JOIN public.usuarios_cv u ON u.user_id = o.vendedor_id
WHERE o.etapa NOT IN ('ganada', 'perdida')
ORDER BY o.fecha_cierre_estimada ASC;

-- Ver oportunidades por etapa
SELECT 
    etapa,
    COUNT(*) as cantidad,
    SUM(valor_estimado) as valor_total,
    AVG(probabilidad) as probabilidad_promedio
FROM public.oportunidades_cv
WHERE etapa NOT IN ('ganada', 'perdida')
GROUP BY etapa
ORDER BY 
    CASE etapa
        WHEN 'contacto_inicial' THEN 1
        WHEN 'calificacion' THEN 2
        WHEN 'propuesta' THEN 3
        WHEN 'negociacion' THEN 4
        WHEN 'cierre' THEN 5
    END;

-- Mover oportunidad a siguiente etapa
UPDATE public.oportunidades_cv
SET 
    etapa = 'propuesta',
    probabilidad = 60
WHERE id = 'uuid-de-la-oportunidad';

-- Cerrar oportunidad como ganada y crear venta
WITH oportunidad_ganada AS (
    UPDATE public.oportunidades_cv
    SET 
        etapa = 'ganada',
        fecha_cierre_real = NOW()
    WHERE id = 'uuid-de-la-oportunidad'
    RETURNING *
)
INSERT INTO public.ventas_cv (
    numero_venta,
    cliente_id,
    vendedor_id,
    fecha_venta,
    estado,
    total_venta,
    notas
)
SELECT 
    'VTA-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0'),
    cliente_id,
    vendedor_id,
    NOW(),
    'pendiente',
    valor_estimado,
    'Venta generada desde oportunidad: ' || titulo
FROM oportunidad_ganada;

-- ============================================================================
-- 7. GESTIÓN DE ACTIVIDADES
-- ============================================================================

-- Registrar una llamada
INSERT INTO public.actividades_cv (
    tipo,
    asunto,
    descripcion,
    cliente_id,
    oportunidad_id,
    usuario_id,
    fecha_actividad,
    completada
) VALUES (
    'llamada',
    'Seguimiento propuesta comercial',
    'Cliente solicita más información sobre tarifas',
    (SELECT id FROM public.clientes_cv WHERE nombre ILIKE '%ejemplo%' LIMIT 1),
    NULL,
    auth.uid(),
    NOW(),
    true
);

-- Crear una tarea pendiente
INSERT INTO public.actividades_cv (
    tipo,
    asunto,
    descripcion,
    cliente_id,
    usuario_id,
    fecha_actividad,
    completada
) VALUES (
    'tarea',
    'Enviar propuesta comercial',
    'Preparar y enviar propuesta personalizada',
    (SELECT id FROM public.clientes_cv WHERE nombre ILIKE '%ejemplo%' LIMIT 1),
    auth.uid(),
    NOW() + INTERVAL '2 days',
    false
);

-- Ver actividades pendientes
SELECT 
    a.tipo,
    a.asunto,
    a.descripcion,
    a.fecha_actividad,
    c.nombre as cliente,
    EXTRACT(DAY FROM a.fecha_actividad - NOW()) as dias_restantes
FROM public.actividades_cv a
LEFT JOIN public.clientes_cv c ON c.id = a.cliente_id
WHERE a.completada = false
AND a.usuario_id = auth.uid()
ORDER BY a.fecha_actividad ASC;

-- Ver historial de actividades de un cliente
SELECT 
    a.tipo,
    a.asunto,
    a.descripcion,
    a.fecha_actividad,
    a.completada,
    u.nombre_completo as usuario
FROM public.actividades_cv a
LEFT JOIN public.usuarios_cv u ON u.user_id = a.usuario_id
WHERE a.cliente_id = 'uuid-del-cliente'
ORDER BY a.fecha_actividad DESC;

-- Marcar actividad como completada
UPDATE public.actividades_cv
SET completada = true
WHERE id = 'uuid-de-la-actividad';

-- ============================================================================
-- 8. REPORTES Y ESTADÍSTICAS
-- ============================================================================

-- Resumen de ventas por mes
SELECT 
    TO_CHAR(fecha_venta, 'YYYY-MM') as mes,
    COUNT(*) as num_ventas,
    SUM(total_venta) as total_vendido,
    SUM(total_comision) as total_comisiones,
    AVG(total_venta) as ticket_promedio
FROM public.ventas_cv
WHERE estado IN ('confirmada', 'completada')
GROUP BY TO_CHAR(fecha_venta, 'YYYY-MM')
ORDER BY mes DESC;

-- Top vendedores del mes
SELECT 
    u.nombre_completo as vendedor,
    COUNT(v.id) as num_ventas,
    SUM(v.total_venta) as total_vendido,
    SUM(v.total_comision) as comisiones_generadas
FROM public.ventas_cv v
JOIN public.usuarios_cv u ON u.user_id = v.vendedor_id
WHERE 
    v.estado IN ('confirmada', 'completada')
    AND v.fecha_venta >= DATE_TRUNC('month', NOW())
GROUP BY u.nombre_completo
ORDER BY total_vendido DESC;

-- Productos más vendidos
SELECT 
    p.nombre as producto,
    p.categoria,
    COUNT(dv.id) as veces_vendido,
    SUM(dv.cantidad) as cantidad_total,
    SUM(dv.subtotal) as ingresos_totales
FROM public.detalles_venta_cv dv
JOIN public.productos_cv p ON p.id = dv.producto_id
JOIN public.ventas_cv v ON v.id = dv.venta_id
WHERE v.estado IN ('confirmada', 'completada')
GROUP BY p.nombre, p.categoria
ORDER BY veces_vendido DESC
LIMIT 10;

-- Tasa de conversión del pipeline
SELECT 
    COUNT(CASE WHEN etapa = 'ganada' THEN 1 END)::FLOAT / 
    NULLIF(COUNT(*), 0) * 100 as tasa_conversion,
    COUNT(*) as total_oportunidades,
    COUNT(CASE WHEN etapa = 'ganada' THEN 1 END) as ganadas,
    COUNT(CASE WHEN etapa = 'perdida' THEN 1 END) as perdidas,
    SUM(CASE WHEN etapa = 'ganada' THEN valor_estimado ELSE 0 END) as valor_ganado
FROM public.oportunidades_cv
WHERE created_at >= DATE_TRUNC('month', NOW());

-- Clientes con más actividad
SELECT 
    c.nombre as cliente,
    c.tipo_cliente,
    COUNT(DISTINCT v.id) as num_ventas,
    COUNT(DISTINCT o.id) as num_oportunidades,
    COUNT(DISTINCT a.id) as num_actividades,
    MAX(a.fecha_actividad) as ultima_actividad
FROM public.clientes_cv c
LEFT JOIN public.ventas_cv v ON v.cliente_id = c.id
LEFT JOIN public.oportunidades_cv o ON o.cliente_id = c.id
LEFT JOIN public.actividades_cv a ON a.cliente_id = c.id
GROUP BY c.nombre, c.tipo_cliente
ORDER BY num_actividades DESC
LIMIT 10;

-- ============================================================================
-- 9. MANTENIMIENTO Y LIMPIEZA
-- ============================================================================

-- Ver tamaño de las tablas
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
AND tablename LIKE '%_cv'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Limpiar oportunidades antiguas perdidas (más de 6 meses)
DELETE FROM public.oportunidades_cv
WHERE 
    etapa = 'perdida'
    AND updated_at < NOW() - INTERVAL '6 months';

-- Archivar ventas canceladas antiguas (mover a tabla de histórico si existe)
-- Nota: Primero deberías crear una tabla de histórico
UPDATE public.ventas_cv
SET metadata = jsonb_set(
    COALESCE(metadata, '{}'::jsonb),
    '{archivada}',
    'true'::jsonb
)
WHERE 
    estado = 'cancelada'
    AND updated_at < NOW() - INTERVAL '1 year';

-- ============================================================================
-- 10. CONSULTAS DE AUDITORÍA
-- ============================================================================

-- Ver últimas modificaciones en ventas
SELECT 
    v.numero_venta,
    v.estado,
    v.total_venta,
    v.updated_at,
    u.nombre_completo as modificado_por
FROM public.ventas_cv v
LEFT JOIN public.usuarios_cv u ON u.user_id = v.vendedor_id
ORDER BY v.updated_at DESC
LIMIT 20;

-- Ver usuarios que no han tenido actividad reciente
SELECT 
    u.nombre_completo,
    u.email,
    u.rol,
    MAX(v.fecha_venta) as ultima_venta,
    MAX(a.fecha_actividad) as ultima_actividad
FROM public.usuarios_cv u
LEFT JOIN public.ventas_cv v ON v.vendedor_id = u.user_id
LEFT JOIN public.actividades_cv a ON a.usuario_id = u.user_id
WHERE u.activo = true
GROUP BY u.nombre_completo, u.email, u.rol
HAVING 
    MAX(v.fecha_venta) < NOW() - INTERVAL '30 days'
    OR MAX(v.fecha_venta) IS NULL
ORDER BY ultima_venta DESC NULLS LAST;

-- ============================================================================
-- FIN DE EJEMPLOS
-- ============================================================================

-- NOTA: Recuerda reemplazar los UUIDs de ejemplo con los reales de tu base de datos
-- Para obtener UUIDs reales, usa consultas como:
-- SELECT id FROM public.clientes_cv WHERE nombre = 'Nombre del Cliente';
