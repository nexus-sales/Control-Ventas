# Solución para Errores de Importación - HTTP 400

## 🚨 Problema Identificado

Los errores 400 que estás experimentando se deben a que las tablas en Supabase no tienen las columnas correctas que la aplicación está intentando insertar. Específicamente:

### Errores encontrados:
- **Productos**: Intentando insertar columnas inexistentes como `fecha_alta`, `fecha_baja`, `contacto`, `email`, `telefono`, `observaciones`, `historial`
- **Operadores**: Faltan columnas para datos de contacto y fechas
- **Colaboradores**: Estructura inconsistente con los datos locales
- **Zonas**: Faltan columnas para configuración de impuestos

## 🔧 Solución Paso a Paso

### 1. Ejecutar Script SQL en Supabase

1. **Abre el Dashboard de Supabase**:
   - Ve a [supabase.com](https://supabase.com)
   - Entra en tu proyecto

2. **Ve al SQL Editor**:
   - En el menú lateral, busca "SQL Editor"
   - Haz clic en "New query"

3. **Ejecuta el script de tablas**:
   - Copia todo el contenido del archivo `docs/supabase_tables_setup.sql`
   - Pégalo en el editor SQL
   - Haz clic en "Run" para ejecutar

### 2. Verificar las Tablas Creadas

Ejecuta esta consulta para verificar que todas las tablas están creadas:

```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('operadores', 'zonas', 'colaboradores', 'productos', 'ventas', 'niveles', 'reglas', 'liquidaciones');
```

### 3. Verificar Columnas de una Tabla

Para verificar que las columnas están correctas, ejecuta:

```sql
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'productos' 
ORDER BY ordinal_position;
```

## 📋 Estructura Completa de Tablas

### Operadores
- `id`, `nombre`, `sector`, `codigo`, `contacto`, `telefono`, `email`, `observaciones`, `fecha_alta`, `created_at`, `updated_at`

### Zonas  
- `id`, `nombre`, `codigo`, `impuesto_tipo`, `impuesto_pct`, `descripcion`, `created_at`, `updated_at`

### Colaboradores
- `id`, `nombre`, `nivel`, `comision_personalizada`, `comision_tipo_personalizada`, `fecha_alta`, `telefono`, `email`, `direccion`, `cif_dni`, `tipo_fiscal`, `irpf`, `pct_colaborador`, `zona_id`, `estado`, `irpf_calculado`, `exento_impuestos`, `created_at`, `updated_at`, `observaciones`, `rol`

### Productos
- `id`, `operador_id`, `nombre`, `sector`, `familia`, `base`, `pvp`, `comision_tipo`, `comision_valor`, `codigo_producto`, `descripcion`, `activo`, `created_at`, `updated_at`, `fecha_alta`, `fecha_baja`, `contacto`, `email`, `telefono`, `observaciones`, `historial`

### Ventas
- `id`, `fecha`, `cliente`, `cif`, `colaborador_id`, `zona_id`, `producto_id`, `operador_id`, `pvp`, `cantidad`, `estado`, `mes`, `ano`, `extras`, `created_at`, `updated_at`

## 🔄 Después de Ejecutar el Script

1. **Refresca la aplicación** en tu navegador
2. **Intenta la importación de nuevo**
3. **Los errores 400 deberían desaparecer**

## 🛡️ Características Añadidas

- **Row Level Security (RLS)** activado en todas las tablas
- **Políticas de seguridad** para usuarios autenticados
- **Triggers automáticos** para actualizar `updated_at`
- **Índices optimizados** para mejor rendimiento
- **Relaciones entre tablas** correctamente configuradas

## ⚠️ Notas Importantes

1. **Respaldo**: Si ya tienes datos en Supabase, considera hacer un respaldo antes
2. **Orden de ejecución**: Ejecuta primero `supabase_complete_setup.sql` y después `supabase_tables_setup.sql`
3. **Permisos**: Asegúrate de tener permisos de administrador en el proyecto de Supabase

## 🧪 Probar la Solución

Después de ejecutar el script:

1. Intenta importar un archivo Excel pequeño
2. Verifica que no aparezcan errores 400 en la consola
3. Confirma que los datos se sincronizan correctamente con Supabase
4. Revisa que la aplicación funcione en modo online y offline

Si sigues teniendo problemas, revisa:
- Que el script se ejecutó completamente sin errores
- Que todas las tablas tienen las columnas correctas
- Que las políticas de seguridad permiten el acceso a tu usuario