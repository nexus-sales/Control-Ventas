# Control de Ventas - Aplicación Híbrida Local + Supabase

## 🚀 Funcionalidades Restauradas

### ✅ Autenticación Dual
- **Login Local**: Usando contraseña por defecto `admin123`
- **Login Supabase**: Con email y contraseña (requiere configuración)

### ✅ Almacenamiento Híbrido
- **Almacenamiento Local**: Funciona sin conexión usando LocalStorage
- **Supabase**: Sincronización automática cuando está disponible
- **Botón de Sincronización**: Sincronizar datos manualmente

### ✅ Indicadores de Estado
- **Icono de Base de Datos**: Muestra si está usando "Solo Local" o "Supabase + Local"
- **Botón de Sincronización**: Solo aparece cuando Supabase está disponible

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

### Modo Solo Local (Sin Supabase)
- ✅ Funciona completamente offline
- ✅ Datos guardados en LocalStorage del navegador
- ✅ Login con contraseña local: `admin123`

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
- **Toggle Local/Supabase**: Cambiar entre métodos de autenticación
- **Campo Email**: Solo aparece en modo Supabase
- **Mostrar/Ocultar Contraseña**: Botón de visibilidad

### Sidebar
- **Botón Sincronizar**: Solo visible con Supabase conectado
- **Estado de BD**: Indica qué almacenamiento está activo
- **Animación**: El icono de sincronización gira durante el proceso

## 🔄 Proceso de Sincronización

1. **Automática**: Al guardar datos (si Supabase está disponible)
2. **Manual**: Usando el botón "Sincronizar" 
3. **Bidireccional**: Local ↔ Supabase
4. **Con Reintentos**: 3 intentos automáticos en caso de fallo

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