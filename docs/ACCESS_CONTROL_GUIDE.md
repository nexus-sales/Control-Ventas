# Sistema de Control de Acceso - Control de Ventas

## 📋 Resumen

El sistema de control de acceso implementado proporciona una capa de seguridad robusta que controla quién puede acceder a la aplicación basándose en emails autorizados, roles de usuario y un sistema de solicitudes.

## 🏗️ Arquitectura

### Componentes Principales

1. **`accessControl.js`** - Lógica central del sistema
2. **`AccessDeniedScreen.jsx`** - Interfaz para usuarios no autorizados
3. **`AccessRequestsManager.jsx`** - Panel de administración
4. **`GuardedRoute.jsx`** - Protección de rutas
5. **`AuthContext.jsx`** - Integración con autenticación

## 🔐 Funcionalidades

### Control de Acceso
- ✅ **Verificación por email**: Solo emails autorizados pueden acceder
- ✅ **Sistema de roles**: admin, user, pending, blocked
- ✅ **Permisos granulares**: Control específico por funcionalidad
- ✅ **Solicitudes automáticas**: Los usuarios pueden solicitar acceso

### Panel de Administración
- ✅ **Gestión de solicitudes**: Aprobar/rechazar/eliminar
- ✅ **Estadísticas**: Contadores de solicitudes por estado
- ✅ **Acciones en lote**: Operaciones múltiples
- ✅ **Interfaz intuitiva**: Diseño limpio y funcional

### Experiencia de Usuario
- ✅ **Pantallas informativas**: Mensajes claros de estado
- ✅ **Formularios de solicitud**: Proceso simple para pedir acceso
- ✅ **Animaciones**: Transiciones suaves
- ✅ **Modo oscuro**: Soporte completo

## 📝 Configuración

### Emails Autorizados
```javascript
// En accessControl.js
const AUTHORIZED_EMAILS = [
  'info@luzmatel.com',
  // Agregar más emails aquí
];
```

### Emails de Administrador
```javascript
const ADMIN_EMAILS = [
  'info@luzmatel.com',
  // Agregar más admins aquí
];
```

## 🚀 Uso

### Proteger una Ruta
```jsx
import { GuardedRoute } from './components/auth/GuardedRoute';

<GuardedRoute roles={['admin']} permission="manage_users">
  <AdminPanel />
</GuardedRoute>
```

### Verificar Permisos en Componente
```jsx
import { useAuth } from './hooks/useAuth';

function MyComponent() {
  const { hasAccess, userRole, isAdmin } = useAuth();
  
  if (!hasAccess) return <div>Sin acceso</div>;
  
  return (
    <div>
      {isAdmin() && <AdminButton />}
    </div>
  );
}
```

### Panel de Administración
```jsx
import AccessRequestsManager from './components/admin/AccessRequestsManager';

<AccessRequestsManager userEmail={user.email} />
```

## 🔧 API del Sistema

### Funciones Principales

#### `isEmailAuthorized(email)`
Verifica si un email tiene acceso autorizado.

#### `getUserRole(email)`
Obtiene el rol de un usuario basado en su email.

#### `checkUserPermission(email, permission)`
Verifica si un usuario tiene un permiso específico.

#### `AccessRequestManager.addRequest(email, name, reason)`
Agrega una nueva solicitud de acceso.

#### `AccessRequestManager.getAllRequests()`
Obtiene todas las solicitudes de acceso.

#### `AccessRequestManager.updateRequestStatus(id, status, reason)`
Actualiza el estado de una solicitud.

### Estados de Solicitud
- `pending`: En espera de revisión
- `approved`: Aprobada por administrador
- `rejected`: Rechazada por administrador

## 🎯 Flujo de Trabajo

### Para Usuarios Nuevos
1. Usuario intenta hacer login
2. Si no está autorizado → Pantalla de acceso denegado
3. Usuario puede solicitar acceso
4. Administrador revisa y aprueba/rechaza
5. Usuario recibe notificación del estado

### Para Administradores
1. Acceso al panel de gestión
2. Revisión de solicitudes pendientes
3. Aprobación/rechazo con motivos
4. Gestión de usuarios existentes

## 🛡️ Seguridad

- **Verificación dual**: Email + perfil de usuario
- **Cierre automático**: Sesión cerrada si se pierde acceso
- **Rate limiting**: Prevención de spam en solicitudes
- **Validación client-side**: Feedback inmediato
- **Almacenamiento local**: Datos temporales no sensibles

## 🔍 Depuración

### Verificar Estado de Usuario
```javascript
// En consola del navegador
console.log('Estado de acceso:', window.__accessControlState);
```

### Ejecutar Pruebas
```javascript
import './test/accessControlTest.js';
```

### Limpiar Datos de Prueba
```javascript
import { cleanupTestData } from './test/accessControlTest.js';
cleanupTestData();
```

## 📊 Métricas

El sistema registra automáticamente:
- Número de solicitudes por estado
- Emails con intentos de acceso
- Historial de aprobaciones/rechazos
- Tiempo de respuesta de administradores

## 🔄 Mantenimiento

### Agregar Nuevo Usuario Autorizado
1. Editar `AUTHORIZED_EMAILS` en `accessControl.js`
2. Asignar rol apropiado en `getUserRole()`
3. Definir permisos en `ROLE_PERMISSIONS`

### Configurar Nuevos Permisos
1. Agregar permiso a `PERMISSIONS`
2. Asignar a roles en `ROLE_PERMISSIONS`
3. Usar en componentes con `checkUserPermission()`

## 🚨 Solución de Problemas

### Usuario Autorizado No Puede Acceder
- Verificar email exacto en `AUTHORIZED_EMAILS`
- Comprobar rol asignado en `getUserRole()`
- Revisar permisos en `ROLE_PERMISSIONS`

### Panel de Admin No Aparece
- Verificar email en `ADMIN_EMAILS`
- Comprobar que el componente verifica `isAdminEmail()`

### Solicitudes No Se Guardan
- Verificar LocalStorage del navegador
- Comprobar límite en `maxRequestsPerEmail`
- Revisar consola por errores JavaScript

## 📚 Próximas Mejoras

- [ ] Integración con base de datos
- [ ] Notificaciones por email
- [ ] Autenticación de dos factores
- [ ] Logs de auditoría
- [ ] API REST para gestión externa
- [ ] Importación/exportación de usuarios

---

**Versión**: 1.0.0  
**Última actualización**: Noviembre 2025  
**Autor**: Sistema de Control de Ventas