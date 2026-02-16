# 🚀 INICIO RÁPIDO - Control de Ventas (CV)

## ⚡ Configuración en 5 Minutos

### 📝 Paso 1: Accede a Supabase (1 min)
1. Abre tu navegador
2. Ve a: **https://supabase.com**
3. Inicia sesión
4. Selecciona el proyecto: **MIsapp**
5. Haz clic en **SQL Editor** (icono de base de datos en el menú lateral)

---

### 📊 Paso 2: Ejecuta el Script Principal (2 min)

1. Abre el archivo: **`supabase-setup-cv.sql`**
2. Selecciona TODO el contenido (Ctrl+A)
3. Copia (Ctrl+C)
4. Pega en el SQL Editor de Supabase (Ctrl+V)
5. Haz clic en el botón **"Run"** (o presiona Ctrl+Enter)
6. Espera a que aparezca: ✅ **"Success. No rows returned"**

---

### 🔐 Paso 3: Configura la Autenticación (2 min)

1. Abre el archivo: **`supabase-auth-config-cv.sql`**
2. **⚠️ IMPORTANTE**: Busca esta línea (casi al final del archivo):
   ```sql
   VALUES ('tu-email@ejemplo.com', 'admin', true, 'Administrador principal del sistema CV')
   ```
3. **Reemplaza** `'tu-email@ejemplo.com'` con **TU EMAIL REAL**
4. Selecciona TODO el contenido (Ctrl+A)
5. Copia (Ctrl+C)
6. Pega en el SQL Editor de Supabase (Ctrl+V)
7. Haz clic en **"Run"**
8. Espera a que aparezca: ✅ **"Success"**

---

### ✅ Paso 4: Verifica la Instalación (30 seg)

Ejecuta esta consulta en el SQL Editor:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE '%_cv'
ORDER BY table_name;
```

**Deberías ver 9 tablas:**
- ✅ actividades_cv
- ✅ clientes_cv
- ✅ comisiones_cv
- ✅ detalles_venta_cv
- ✅ emails_permitidos_cv
- ✅ oportunidades_cv
- ✅ productos_cv
- ✅ usuarios_cv
- ✅ ventas_cv

---

### 🎉 Paso 5: ¡Listo para Usar!

Tu base de datos está configurada. Ahora puedes:

1. **Registrarte** en tu aplicación (serás automáticamente admin)
2. **Conectar tu frontend** con Supabase
3. **Empezar a crear** clientes, productos y ventas

---

## 🔑 Credenciales de Supabase

Necesitarás estas credenciales en tu aplicación:

```env
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-anon-key-aqui
```

**¿Dónde encontrarlas?**
1. En Supabase, ve a **Settings** (⚙️)
2. Haz clic en **API**
3. Copia:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon/public key** → `VITE_SUPABASE_ANON_KEY`

---

## 📱 Próximos Pasos

### Opción A: Conectar tu Aplicación Existente

Si ya tienes una aplicación, agrega estas credenciales a tu archivo `.env`:

```env
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-anon-key-aqui
```

### Opción B: Crear Nueva Aplicación

Si vas a crear una nueva aplicación, instala el cliente de Supabase:

```bash
npm install @supabase/supabase-js
```

Luego crea el cliente:

```javascript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

---

## 🧪 Prueba Rápida

Ejecuta esta consulta para verificar que todo funciona:

```sql
-- Ver productos de ejemplo
SELECT * FROM public.productos_cv;

-- Debería mostrar 3 productos:
-- ENERGIA-001, TELEFONIA-001, ALARMA-001
```

---

## 📚 Documentación Completa

Para más detalles, consulta estos archivos:

1. **RESUMEN-ARCHIVOS-SQL.md** - Resumen de todos los archivos
2. **SUPABASE-SETUP-README.md** - Documentación completa
3. **DIAGRAMA-ARQUITECTURA-CV.md** - Diagramas visuales
4. **supabase-ejemplos-consultas-cv.sql** - Ejemplos de consultas

---

## ❓ Preguntas Frecuentes

### ¿Qué pasa si ya tengo usuarios en Supabase?

Usa el archivo **`supabase-migracion-usuarios-cv.sql`** para migrarlos.

### ¿Cómo agrego más usuarios?

Hay 3 formas:

**1. Registro normal** (recomendado)
- El usuario se registra en tu app
- Se crea automáticamente en `usuarios_cv` como **inactivo**
- Tú (admin) lo activas manualmente

**2. Pre-autorizar email**
```sql
INSERT INTO public.emails_permitidos_cv (email, rol_predeterminado, activo_por_defecto)
VALUES ('nuevo@ejemplo.com', 'user', true);
```

**3. Crear manualmente**
```sql
-- Primero obtén el UUID del usuario de auth.users
SELECT id FROM auth.users WHERE email = 'usuario@ejemplo.com';

-- Luego crea su perfil
INSERT INTO public.usuarios_cv (user_id, nombre_completo, email, rol, activo, app_access)
VALUES ('uuid-aqui', 'Nombre Usuario', 'usuario@ejemplo.com', 'user', true, ARRAY['CV']);
```

### ¿Cómo activo un usuario pendiente?

```sql
-- Ver usuarios pendientes
SELECT * FROM public.usuarios_cv WHERE activo = false;

-- Activar usuario
SELECT public.toggle_usuario_cv_activo(
    (SELECT user_id FROM public.usuarios_cv WHERE email = 'usuario@ejemplo.com'),
    true
);
```

### ¿Cómo hago a alguien admin?

```sql
SELECT public.cambiar_rol_usuario_cv(
    (SELECT user_id FROM public.usuarios_cv WHERE email = 'usuario@ejemplo.com'),
    'admin'
);
```

### ¿Cómo elimino todo y empiezo de nuevo?

```sql
-- ⚠️ CUIDADO: Esto borra TODOS los datos
DROP TABLE IF EXISTS public.actividades_cv CASCADE;
DROP TABLE IF EXISTS public.oportunidades_cv CASCADE;
DROP TABLE IF EXISTS public.comisiones_cv CASCADE;
DROP TABLE IF EXISTS public.detalles_venta_cv CASCADE;
DROP TABLE IF EXISTS public.ventas_cv CASCADE;
DROP TABLE IF EXISTS public.productos_cv CASCADE;
DROP TABLE IF EXISTS public.clientes_cv CASCADE;
DROP TABLE IF EXISTS public.emails_permitidos_cv CASCADE;
DROP TABLE IF EXISTS public.usuarios_cv CASCADE;

-- Luego vuelve a ejecutar los scripts desde el Paso 2
```

---

## 🆘 Solución de Problemas

### Error: "permission denied for table..."
**Causa:** RLS está bloqueando el acceso  
**Solución:** Verifica que tu usuario esté en `usuarios_cv` con `activo = true`

### Error: "duplicate key value violates unique constraint"
**Causa:** Intentas insertar un registro que ya existe  
**Solución:** Verifica que no exista antes de insertar

### No veo mis datos
**Causa:** RLS está filtrando según tu rol  
**Solución:** Verifica que seas admin o que estés viendo tus propios datos

### El trigger no crea usuarios automáticamente
**Causa:** El trigger puede no estar activo  
**Solución:** Vuelve a ejecutar la sección de triggers del script de autenticación

---

## 📞 Contacto y Soporte

Si tienes problemas:

1. ✅ Revisa la documentación completa: **SUPABASE-SETUP-README.md**
2. ✅ Consulta los ejemplos: **supabase-ejemplos-consultas-cv.sql**
3. ✅ Verifica los diagramas: **DIAGRAMA-ARQUITECTURA-CV.md**

---

## 🎯 Checklist Final

Antes de empezar a desarrollar, verifica:

- [ ] ✅ Ejecuté `supabase-setup-cv.sql`
- [ ] ✅ Ejecuté `supabase-auth-config-cv.sql` con mi email
- [ ] ✅ Veo las 9 tablas en Supabase
- [ ] ✅ Tengo las credenciales (URL y ANON_KEY)
- [ ] ✅ Agregué las credenciales a mi `.env`
- [ ] ✅ Probé una consulta simple
- [ ] ✅ Entiendo el sistema de roles (admin/user/viewer)

---

## 🚀 ¡Ahora sí, a Desarrollar!

Tu base de datos está lista. Características disponibles:

✅ Autenticación restrictiva (solo tú o admin)  
✅ Gestión de clientes  
✅ Catálogo de productos  
✅ Registro de ventas  
✅ Cálculo de comisiones  
✅ Pipeline de oportunidades (CRM)  
✅ Seguimiento de actividades  
✅ Reportes y estadísticas  
✅ Seguridad a nivel empresarial (RLS)  

**¡Empieza a construir tu aplicación! 💪**

---

**Última actualización:** 2026-02-13  
**Versión:** 1.0  
**Proyecto:** Control de Ventas (CV) - MIsapp
