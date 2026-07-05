# 🚀 INICIO RÁPIDO - Control de Ventas (CV)

## ⚡ Configurar la base de datos desde cero

### 📝 Paso 1: Accede a Supabase

1. Ve a **https://supabase.com** e inicia sesión
2. Selecciona el proyecto: **MIsapp**
3. Abre **SQL Editor** (icono de base de datos en el menú lateral)

---

### 📊 Paso 2: Ejecuta el script principal

1. Abre el archivo **`supabase-setup-cv-REAL.sql`** (en la raíz del repo — es el único script de esquema que hay que ejecutar; crea todas las tablas `_cv`, las funciones RLS, los triggers y las políticas de seguridad)
2. Copia TODO el contenido y pégalo en el SQL Editor de Supabase
3. Ejecuta (**Run** / Ctrl+Enter) y espera a **"Success. No rows returned"**

Si el repo tiene migraciones más recientes en `migrations/` (fechadas después de tu última ejecución), aplícalas también, en orden por fecha.

---

### ✅ Paso 3: Verifica la instalación

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name LIKE '%_cv'
ORDER BY table_name;
```

**Deberías ver estas 12 tablas:** `colaboradores_cv`, `custom_fields_cv`, `decomisiones_cv`, `empresa_config_cv`, `liquidaciones_cv`, `niveles_cv`, `operadores_cv`, `productos_cv`, `reglas_cv`, `usuarios_cv`, `ventas_cv`, `zonas_cv`.

---

### 🔑 Paso 4: Credenciales de Supabase

Añade esto a tu `.env` (en Supabase: **Settings → API**):

```env
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-anon-key-aqui
```

`VITE_SUPABASE_ANON_KEY` es la clave **anon/public** — nunca uses aquí la `service_role key`.

---

### 🎉 Paso 5: Regístrate y promociónate a admin

1. Arranca la app (`npm run dev`) y regístrate desde la pantalla de login
2. El trigger `on_auth_user_created_cv` te crea automáticamente en `usuarios_cv` con `rol='user', activo=false` (pendiente de aprobación) — es el comportamiento esperado, no un error
3. Vuelve al SQL Editor y actívate como admin:

```sql
UPDATE public.usuarios_cv
SET rol = 'admin', activo = true
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'tu-email@ejemplo.com');
```

4. Recarga la app — ya tienes acceso completo

---

## 📚 Documentación relacionada

- **`DIAGRAMA-ARQUITECTURA-CV.md`** — diagrama de la arquitectura de datos
- **`AUDITORIA-CV.md`** — estado de las auditorías de código realizadas
- **`supabase-ejemplos-consultas-cv.sql`** — ejemplos de consultas útiles

---

## 🆘 Solución de problemas

### Error: "permission denied for table..."
**Causa:** RLS está bloqueando el acceso.
**Solución:** Verifica que tu usuario tenga fila en `usuarios_cv` con `activo = true` y el `rol` adecuado para la acción.

### No veo mis datos tras registrarme
**Causa:** el trigger te crea con `activo = false` por diseño — necesitas que un admin (o tú mismo vía SQL, ver Paso 5) te active.

### El trigger no crea el usuario automáticamente
**Causa:** verifica que el trigger esté instalado:
```sql
SELECT tgname FROM pg_trigger WHERE tgrelid = 'auth.users'::regclass AND NOT tgisinternal;
```
Debería aparecer únicamente `on_auth_user_created_cv`. Si ves otro trigger legacy, revisa `migrations/2026xxxx_verificar_trigger_legacy_auth_users.sql`.

---

**Última actualización:** 2026-07-05
**Proyecto:** Control de Ventas (CV) - MIsapp
