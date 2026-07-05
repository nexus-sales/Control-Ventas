# Control de Ventas - Aplicación Híbrida Local + Supabase

## 🚀 Funcionalidades Restauradas

### ✅ Autenticación Supabase
- **Login Supabase**: Con email y contraseña (requiere configuración)
- **Aprobación de acceso**: Las cuentas nuevas deben ser activadas por un administrador.

### ✅ Almacenamiento Híbrido
- **Almacenamiento Local**: Funciona sin conexión usando LocalStorage
- **Supabase**: Sincronización automática cuando está disponible
- **Botón de Sincronización**: Sincronizar datos manualmente

### ✅ Indicadores de Estado
- **Icono de Base de Datos**: Muestra si está usando "Solo Local" o "Supabase + Local"
- **Botón de Sincronización**: Solo aparece cuando Supabase está disponible
- **Badge de Cambios Pendientes**: Muestra cuántos guardados no han llegado aún a Supabase
- **Aviso de Fallo de Sincronización**: Notificación inmediata (toast) si un guardado no se pudo sincronizar con el servidor

## 🔧 Configuración de Supabase

### 1. Crear archivo `.env.local`
```bash
# Copiar desde .env.example
cp .env.example .env.local
```

### 2. Completar variables de entorno
```env
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu_clave_publica_aqui
```

### 3. Estructura de Base de Datos Supabase
La aplicación espera las siguientes tablas:
- `ventas`
- `colaboradores` 
- `niveles`
- `operadores`
- `productos`
- `zonas`
- `reglas`
- `liquidaciones`

## 🎯 Cómo Funciona

### Modo Local de Datos (Sin Supabase)
- ✅ Los datos ya cargados pueden consultarse desde LocalStorage del navegador
- ✅ El acceso sigue dependiendo de una sesión/autorización válida

### Modo Híbrido (Con Supabase)
- ✅ Datos sincronizados automáticamente
- ✅ Login con email/contraseña de Supabase
- ✅ Botón de sincronización manual
- ✅ Fallback a local si Supabase no está disponible

## 🚦 Estados de la Aplicación

1. **Iniciando**: Verifica conectividad con Supabase
2. **Solo Local**: Sin Supabase, funciona offline
3. **Híbrido**: Con Supabase + Local, sincronización activa

## 📱 Interfaz de Usuario

### Pantalla de Login
- **Campo Email**: Identifica la cuenta de Supabase
- **Mostrar/Ocultar Contraseña**: Botón de visibilidad

### Sidebar
- **Botón Sincronizar**: Solo visible con Supabase conectado
- **Estado de BD**: Indica qué almacenamiento está activo
- **Animación**: El icono de sincronización gira durante el proceso

## 🔄 Proceso de Sincronización

1. **Guardado local siempre**: Al guardar, los datos quedan en LocalStorage de inmediato, sin esperar al servidor
2. **Sincronización automática**: Si hay sesión y conexión, el mismo guardado intenta subirse a Supabase en segundo plano
3. **Aviso inmediato si falla**: Si la sincronización remota no se completa (sin sesión, sin conexión, error del servidor), aparece un aviso visible al momento y el cambio queda marcado como pendiente
4. **Reintento al reconectar**: Al recuperar conexión se reintentan automáticamente todos los cambios pendientes; los que tengan éxito se limpian de la cola y los que sigan fallando quedan para el siguiente intento
5. **Manual**: Usando el botón "Sincronizar"
6. **Bidireccional**: Local ↔ Supabase

## 🛠 Desarrollo

### Ejecutar en modo desarrollo
```bash
npm run dev
```

### Variables de entorno necesarias (opcional)
```env
VITE_SUPABASE_URL=tu_url_supabase
VITE_SUPABASE_ANON_KEY=tu_clave_anonima
```

## 📦 Dependencias Clave

- `@supabase/supabase-js`: Cliente de Supabase
- `react-router-dom`: Navegación
- `lucide-react`: Iconos
- `tailwindcss`: Estilos

## 🔒 Seguridad

- **Autenticación Local**: Hash simple para desarrollo
- **Supabase Auth**: Autenticación robusta con JWT
- **Variables de Entorno**: Credenciales no incluidas en el código

---

¡La aplicación ahora funciona tanto en modo local como con Supabase, brindando la mejor experiencia posible en ambos escenarios! 🎉
