# Control Ventas

Herramienta moderna para la gestión y control de ventas, colaboradores y liquidaciones con **sistema híbrido de almacenamiento** (Supabase + Local).

## 🚀 Características principales

- **Sistema Híbrido de Datos**: Funciona online (Supabase) y offline (LocalStorage)
- **Sincronización Automática**: Los datos locales se sincronizan con la nube automáticamente
- **Registro de Usuarios**: Crea cuentas nuevas en Supabase o trabaja en modo local
- Gestión completa de ventas, colaboradores, productos y zonas
- Importación y exportación masiva desde Excel/CSV
- Liquidaciones automáticas y cálculo de comisiones
- Panel de control y estadísticas en tiempo real
- PWA: Instalación en escritorio y móvil
- Accesibilidad y buenas prácticas SEO

## 🔄 Funcionamiento del Sistema Híbrido

### **Modo Online (Supabase)**
- **Con Internet**: Todos los datos se guardan en la nube
- **Colaborativo**: Varios usuarios pueden acceder a los mismos datos
- **Seguro**: Autenticación y respaldo en la nube
- **Sincronizado**: Cambios visibles en todos los dispositivos

### **Modo Offline (Local)**
- **Sin Internet**: Todos los datos se guardan en el navegador
- **Independiente**: Trabajas sin conexión
- **Rápido**: No depende de la velocidad de internet
- **Privado**: Los datos solo están en tu dispositivo

### **Flujo de Trabajo Recomendado**

1. **Sin Conexión a Internet**:
   - Haz clic en **"Usar Local"**
   - Trabaja normalmente (crear ventas, gestionar productos, etc.)
   - Todos los datos se guardan automáticamente en tu navegador

2. **Con Conexión a Internet**:
   - Haz clic en **"Usar Supabase"**
   - El sistema detecta automáticamente los datos locales
   - **Sincronización automática**: Los datos locales se suben a la nube
   - Usa el **botón "Sincronizar"** para forzar la sincronización manual

3. **Cambio de Modos**:
   - Puedes alternar entre Supabase y Local cuando quieras
   - Los datos se mantienen seguros en ambos sistemas
   - La sincronización es bidireccional y automática

## 👤 Sistema de Autenticación

### **Registro de Nuevos Usuarios (Supabase)**
- **Crear Cuenta**: Usa email, contraseña y nombre opcional
- **Verificación**: Confirma tu email para activar la cuenta
- **Seguridad**: Contraseñas encriptadas y gestión segura de sesiones

### **Inicio de Sesión**
- **Supabase**: Con email y contraseña de tu cuenta en la nube
- **Local**: Acceso directo sin necesidad de cuenta

### **Gestión de Sesiones**
- **Persistencia**: Las sesiones se mantienen entre navegaciones
- **Seguridad**: Cierre automático por inactividad (configurable)
- **Multi-dispositivo**: Accede desde cualquier dispositivo con tu cuenta

## 📊 Características de Negocio

### **Gestión de Ventas**
- Registro completo de transacciones
- Seguimiento por colaborador, producto y zona
- Estadísticas y métricas en tiempo real
- Filtros avanzados y búsqueda

### **Liquidaciones Automáticas**
- Cálculo automático de comisiones
- Configuración flexible de reglas de negocio
- Reportes detallados por período
- Exportación a Excel/PDF

### **Importación Masiva**
- Soporte para archivos Excel y CSV
- Mapeo inteligente de columnas
- Validación automática de datos
- Vista previa antes de importar

## 💾 Gestión de Datos

### **Respaldo y Seguridad**
- **Supabase**: Respaldo automático en la nube
- **Local**: Exportación manual de datos
- **Sincronización**: Merge inteligente sin pérdida de datos
- **Versionado**: Historial de cambios (en desarrollo)

### **Rendimiento**
- **Caché Local**: Datos frecuentes en memoria
- **Lazy Loading**: Carga progresiva de datos grandes
- **Optimización**: Consultas eficientes y paginadas
- **Offline First**: Funciona sin conexión

## 🛠️ Instalación y desarrollo

1. Clona el repositorio:
   ```sh
   git clone <URL_DEL_REPO>
   cd control-ventas
   ```
2. Instala dependencias:
   ```sh
   npm install
   ```
3. Inicia el entorno de desarrollo:
   ```sh
   npm run dev
   ```

## 🚀 Deploy y Producción

### **Build Local**

```sh
npm run build
```

Los archivos finales estarán en la carpeta `dist/`.

### **Deploy en Vercel (Recomendado)**

1. **Instalar Vercel CLI**:
   ```sh
   npm install -g vercel
   ```

2. **Deploy inicial**:
   ```sh
   vercel
   ```

3. **Configurar variables de entorno en Vercel**:
   ```sh
   vercel env add VITE_SUPABASE_URL
   vercel env add VITE_SUPABASE_ANON_KEY
   ```

4. **Deploy automático**:
   - Conecta tu repositorio de GitHub
   - Cada push a main se despliega automáticamente
   - Branch previews para testing

### **Características de Vercel**

- ✅ **Zero-config deployment** para Vite
- ✅ **Edge Network global** para máximo rendimiento
- ✅ **SSL automático** y custom domains
- ✅ **Analytics integrado** para monitoreo
- ✅ **Security headers** automáticos
- ✅ **Branch previews** para testing
- ✅ **Rollbacks instantáneos**

### **URL de Producción**

Una vez deployado, tu aplicación estará disponible en:
```
https://control-ventas-tu-usuario.vercel.app
```

## ⚙️ Configuración

### **Variables de entorno**

Crea un archivo `.env` en la raíz del proyecto con las siguientes variables:

```env
# Configuración de Supabase (opcional)
VITE_SUPABASE_URL=tu_url_de_supabase
VITE_SUPABASE_ANON_KEY=tu_clave_anonima_de_supabase

# Configuración de la aplicación
VITE_APP_NAME=Control Ventas
VITE_APP_VERSION=2.0.0
```

### **Configuración de Supabase**

1. Crea un proyecto en [Supabase](https://supabase.com)
2. Copia la URL y la clave anónima a tu archivo `.env`
3. Configura las tablas necesarias (se crean automáticamente)
4. Habilita la autenticación por email

### **Modo Solo Local**

Si no quieres usar Supabase, simplemente:
- No configures las variables de entorno
- Usa siempre el botón "Usar Local"
- Todos los datos se guardarán en tu navegador

## Scripts útiles

- `npm run dev` — Inicia el servidor de desarrollo
- `npm run build` — Genera el build de producción
- `npm run lint` — Linting del código

## 📁 Estructura del proyecto

```
public/                    # Archivos estáticos y PWA
├── icons/                 # Iconos de la aplicación
├── manifest.json          # Configuración PWA
└── favicon.ico           # Favicon

src/
├── components/           # Componentes React organizados por funcionalidad
│   ├── auth/            # Autenticación (LoginScreen, GuardedRoute)
│   ├── common/          # Componentes comunes (Loading, ErrorBoundary, SyncButton)
│   ├── config/          # Configuración (Operadores, Productos, Zonas)
│   ├── layout/          # Layout (Header, Sidebar, LayoutShell)
│   ├── ui/              # Componentes UI reutilizables (Card, Toast, Pill)
│   └── ventas/          # Gestión de ventas y modales
├── context/             # Contextos React
│   ├── AuthContext.jsx  # Gestión de autenticación híbrida
│   └── DataContext.jsx  # Gestión de datos y sincronización
├── hooks/               # Custom hooks
│   ├── useAuth.js       # Hook de autenticación
│   ├── useData.js       # Hook de gestión de datos
│   └── useVentas*.js    # Hooks específicos de ventas
├── services/            # Servicios externos
│   └── supabaseService.js # Integración con Supabase
├── utils/               # Utilidades y helpers
│   ├── auth.js          # Funciones de autenticación local
│   ├── storage.js       # Gestión de LocalStorage
│   ├── calculos.js      # Cálculos de negocio
│   └── constants.js     # Constantes globales
└── lib/                 # Librerías externas
    └── supabaseClient.js # Cliente de Supabase
```

## 🔧 Troubleshooting y FAQ

### **Problemas Comunes**

**P: No puedo crear una cuenta en Supabase**
R: Verifica que las variables de entorno estén configuradas correctamente y que tu proyecto de Supabase tenga habilitada la autenticación por email.

**P: Mis datos locales desaparecieron**
R: Los datos locales se guardan en LocalStorage. Si limpias los datos del navegador, se perderán. Usa la sincronización con Supabase para respaldo.

**P: La sincronización no funciona**
R: Verifica tu conexión a internet y que las credenciales de Supabase sean correctas. Intenta cerrar sesión y volver a iniciar.

**P: ¿Puedo usar la app sin internet?**
R: ¡Sí! Usa el modo "Local" y podrás trabajar completamente offline. Cuando tengas internet, sincroniza tus datos.

### **Mejores Prácticas**

1. **Respaldo Regular**: Si usas solo modo local, exporta tus datos regularmente
2. **Sincronización**: Conecta a Supabase periódicamente para respaldar datos
3. **Navegadores**: Los datos locales son específicos por navegador
4. **Seguridad**: Usa contraseñas seguras para cuentas de Supabase

## 🔒 Seguridad y buenas prácticas

- **Autenticación**: Sistema seguro con hash de contraseñas
- **Autorización**: Control de acceso basado en roles (en desarrollo)
- **Encriptación**: Comunicación HTTPS con Supabase
- **Privacidad**: Datos locales solo en tu dispositivo
- **Cabeceras HTTP**: Configuración recomendada en `SECURITY_HEADERS.md`
- **Accesibilidad**: Labels, navegación por teclado, ARIA
- **SEO**: Metaetiquetas, manifest, robots.txt, sitemap.xml
- **Performance**: Bundle optimizado, lazy loading, code splitting

## 🛠️ Últimas Mejoras y Actualizaciones

### **Ordenación y Búsqueda de Ventas (Julio 2026)**
- **Ordenación por Titular/Expediente**: Habilitada la ordenación de la A a la Z (y viceversa) pulsando sobre la cabecera "Titular / Expediente" en la tabla maestra de ventas.
- **Búsqueda por texto corregida**: Se enlazó el input de búsqueda de la interfaz (`filtros.search`) con la lógica interna del listado filtrado (`filtros.texto`), permitiendo buscar de forma instantánea por cliente, CIF, numeración, documento, producto, zona, colaborador u operador.

### **Sincronización y Respaldo Centralizados (Julio 2026)**
- **Eliminación del Widget Flotante**: Se retiró el indicador flotante de la esquina superior derecha (`OfflineStatus`) para evitar que interfiriera con el botón de modo oscuro (sol/luna).
- **Nueva Pestaña de Sincronización en Ajustes**: Centralizadas todas las opciones de red y respaldos en **Configuración > Sincronización**, ofreciendo:
  - Indicador visual del estado de conexión (Online / Offline).
  - Información de última fecha/hora de sincronización y tamaño de la caché local en KB.
  - Contador de cambios pendientes de subir a Supabase.
  - Botón interactivo para forzar una sincronización manual con Supabase.
  - Botón de descarga de respaldo completo de datos locales (`Backup Local` en JSON).

## Licencia

[MIT](LICENSE)

---

¿Dudas o sugerencias? Abre un issue o contacta al autor.
