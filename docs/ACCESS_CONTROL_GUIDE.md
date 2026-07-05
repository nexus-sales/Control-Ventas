# Sistema de Control de Acceso - Control de Ventas

> Este documento describía un sistema legacy (`accessControl.js`, listas de
> emails hardcodeadas, `AccessRequestsManager.jsx`, `GuardedRoute.jsx`,
> `AuthContext.jsx`) que fue retirado por completo en la auditoría de
> 2026-07-05 (ver `AUDITORIA-CV.md`, hallazgo Alto #5) por estar desconectado
> del control de acceso real. Ninguno de esos archivos existe ya. Lo que
> sigue describe el modelo vigente.

## 📋 Resumen

El acceso se controla en dos capas: **Postgres/RLS** (la autoridad real,
en Supabase) y la **UI de React** (que solo refleja ese estado y nunca
decide por su cuenta).

## 🏗️ Dónde vive cada pieza

1. **`usuarios_cv`** (tabla en Supabase) — un registro por usuario con
   `rol` (`admin` / `user` / `viewer`), `activo` (bool) y `app_access`
   (array de apps permitidas). Se crea automáticamente al registrarse vía
   el trigger `on_auth_user_created_cv` (`rol='user', activo=false` por
   defecto — pendiente de aprobación).
2. **`profiles`** (tabla compartida entre apps, sin sufijo `_cv`) —
   identidad básica (`nombre`, `email`), no permisos.
3. **Funciones RLS** (`supabase-setup-cv-REAL.sql`): `tiene_acceso_cv()`,
   `puede_editar_cv()` (excluye rol `viewer`), `es_admin_cv()` — deciden a
   nivel de fila qué puede leer/escribir/borrar cada usuario en cada tabla
   `_cv`. Esta es la única autoridad real; nada en el cliente puede saltarla.
4. **`src/AppCVv2.jsx`** (`ProtectedRoute`) — lee `isActive`/`hasAppAccess`
   del contexto de auth y bloquea la navegación si no se cumplen; usa
   `resolveAccessDeniedInfo()` para mostrar el motivo real (perfil nulo por
   error de red vs. cuenta pendiente vs. sin acceso a esta app en concreto).
5. **`src/components/auth/AccessDeniedScreen.jsx`** — pantalla honesta con
   el motivo real; no tiene ningún formulario de "solicitar acceso" (el
   anterior no hacía nada — ver `AUDITORIA-CV.md`, hallazgo Medio #10).
6. **`src/components/admin/UserManagement.jsx`** — panel de admin real
   para activar/desactivar usuarios y cambiar roles, con guard contra
   que un admin se autobloquee.

## 🔐 Flujo para un usuario nuevo

1. Se registra desde la pantalla de login (`supabase.auth.signUp`).
2. El trigger lo crea en `usuarios_cv` con `activo=false`.
3. Ve `AccessDeniedScreen` con el motivo "cuenta pendiente de aprobación".
4. Un admin lo activa desde `UserManagement.jsx` (o, en el primer arranque
   de una instalación nueva, vía SQL directo — ver `INICIO-RAPIDO.md`).
5. Al recargar, `ProtectedRoute` deja pasar.

## 🛡️ Seguridad

- La autorización real está en las políticas RLS de Postgres, no en el
  cliente — ningún `if` de React puede otorgar acceso que RLS no conceda.
- `puede_editar_cv()` excluye explícitamente el rol `viewer` de cualquier
  INSERT/UPDATE/DELETE en las tablas `_cv`.
- Ver `AUDITORIA-CV.md` para el historial de hallazgos de seguridad
  relacionados con este sistema (incluida la limpieza de RLS pública en
  `profiles`).

## 🚨 Solución de problemas

### Un usuario autorizado no puede acceder
Verifica su fila en `usuarios_cv`: `activo` debe ser `true` y `app_access`
debe incluir esta app.

### El panel de admin no aparece
Verifica que `profile.rol === 'admin'` para ese usuario en `usuarios_cv`.

---

**Última actualización:** 2026-07-05
