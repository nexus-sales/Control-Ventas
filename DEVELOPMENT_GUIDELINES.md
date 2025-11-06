# Guía de Desarrollo y Estándares del Proyecto

Este documento establece las directrices técnicas, estándares de código y arquitectura para el desarrollo de esta aplicación. Su cumplimiento es obligatorio para mantener la calidad, seguridad y mantenibilidad del software.

---

## 1. Stack Tecnológico y Versiones

-   **Node.js**: `v20.x`
-   **React**: `v18.x`
-   **Vite**: `v5.x` (Bundler y servidor de desarrollo)
-   **TailwindCSS**: `v3.x` (Framework CSS)
-   **Sistema Operativo (Desarrollo/Producción)**: Linux (Ubuntu 22.04 LTS preferido).
-   **Objetivo de Despliegue**: Contenedores Docker.

---

## 2. Estándares de Código

-   **Lenguaje**: JavaScript (ES2022) con sintaxis JSX. Se recomienda migrar a **TypeScript** en el futuro.
-   **Linter**: ESLint con la configuración `eslint-config-react-app`.
-   **Formateador**: Prettier para un estilo de código consistente.
-   **Hooks Pre-commit**: Se utilizará `husky` junto con `lint-staged` para asegurar que el código cumpla con los estándares de linting y formato antes de cada commit.
    -   `lint-staged` ejecutará automáticamente Prettier y ESLint sobre los archivos modificados.
-   **Alias de Rutas**: Las rutas de importación deben ser absolutas desde `src/` para evitar anidamientos complejos (`../../`). Esto se configura en `vite.config.js`.

---

## 3. Validación y Saneado en los Bordes

-   **Validación de Datos**: Toda entrada de datos externa (formularios, APIs, importaciones) debe ser validada usando una librería como **Zod** o **Yup**.
-   **Seguridad en Base de Datos**: Aunque actualmente se usa un mock local, en la transición a una base de datos (como Supabase/Postgres), todo acceso debe realizarse a través de un ORM o consultas parametrizadas para prevenir inyecciones SQL.
-   **Renderizado de HTML**: Cualquier contenido generado por el usuario que se renderice en la UI debe ser saneado para prevenir ataques XSS.
-   **Límites de Carga**: Se deben establecer límites en el tamaño de los payloads (ej. subida de archivos, JSON en peticiones) y aplicar un `rate-limit` básico en los endpoints de la API para prevenir abusos.

---

## 4. Seguridad por Defecto (OWASP)

-   **HTTPS**: El despliegue en producción debe forzar HTTPS.
-   **Cookies**: Las cookies de sesión/autenticación deben configurarse como `HttpOnly`, `Secure` y `SameSite=Strict` o `Lax`.
-   **CORS**: La política de CORS en la API debe ser explícita, permitiendo únicamente los orígenes de la aplicación cliente.
-   **Cabeceras de Seguridad**: Implementar cabeceras como `Content-Security-Policy` (CSP), `Strict-Transport-Security` (HSTS), y `X-Content-Type-Options`.
-   **Manejo de Errores**: Nunca exponer `stack traces` o mensajes de error detallados en entornos de producción.
-   **Autenticación**: Utilizar JWT con tokens de corta duración y un mecanismo de `refresh tokens` con rotación para mantener la sesión segura.

---

## 5. Gestión de Secretos y Configuración

-   **No Hardcodear Secretos**: Ninguna clave de API, contraseña o secreto debe estar en el código fuente.
-   **Variables de Entorno**:
    -   Utilizar archivos `.env` para la configuración local.
    -   Debe existir un archivo `.env.example` en el repositorio con todas las variables necesarias, pero sin sus valores.
    -   Las variables de entorno deben ser validadas al inicio de la aplicación usando un esquema (ej. con Zod) para asegurar que todas las configuraciones requeridas están presentes ("fail-fast").

---

## 6. Arquitectura Clara y Separada

El proyecto sigue una arquitectura de capas para separar responsabilidades:

1.  **Capa de UI (Componentes React)**: Ubicada en `src/components`. Es responsable de la presentación y la interacción con el usuario. No debe contener lógica de negocio compleja.
2.  **Capa de Lógica de UI (Hooks)**: Ubicada en `src/hooks`. Abstrae la lógica compleja de los componentes, como el manejo de estado, filtros, paginación, etc.
3.  **Capa de Estado Global (Context)**: Ubicada en `src/context`. Gestiona el estado compartido de la aplicación.
4.  **Capa de Servicios**: Ubicada en `src/services`. Encapsula la comunicación con APIs externas o la base de datos. Provee una interfaz clara para que el resto de la aplicación interactúe con los datos.
5.  **DTOs (Data Transfer Objects)**: Se deben definir tipos claros para los objetos de datos que fluyen entre las capas, especialmente entre los servicios y la UI.

---

## 7. Gestión de Dependencias

-   **Versiones Fijadas**: Todas las dependencias en `package.json` deben tener versiones exactas (pineadas) para evitar builds inconsistentes. Utiliza `npm install --save-exact`.
-   **Auditoría**: Ejecutar `npm audit` o `pnpm audit` regularmente para detectar y solucionar vulnerabilidades en las dependencias.
-   **Evitar Dependencias Innecesarias**: Reemplazar "helper" triviales (ej. `is-array`) por código propio cuando sea razonable para reducir la superficie de ataque y el tamaño del bundle.

---

## 8. Testing

-   **Testing Unitario**: Utilizar **Vitest** o **Jest** para probar funciones puras, utilidades (`src/utils`) y lógica de negocio compleja en los servicios (`src/services`).
-   **Testing de Integración**: Probar la interacción entre los servicios y la capa de datos (repositorios/ORM) para asegurar que la comunicación es correcta.
-   **Testing End-to-End (E2E)**: Utilizar **Playwright** o **Cypress** para probar los flujos de usuario más críticos (ej. login, creación de una venta, liquidación).
-   **Cobertura de Código**: La ejecución de los tests en el pipeline de CI debe generar un reporte de cobertura, con un umbral mínimo aceptable (ej. 70%).

---

## 9. Errores y Observabilidad

-   **Manejo Global de Errores**: Implementar un `ErrorBoundary` en React para capturar errores de renderizado y un manejador global para promesas no capturadas.
-   **Logs Estructurados**: Utilizar una librería como `pino` o `winston` para generar logs en formato JSON, facilitando su análisis.
-   **Correlación de Peticiones**: Cada petición a la API debe tener un ID único (`X-Request-ID`) que se propague a través de los logs para facilitar el seguimiento.
-   **Métricas y Health Checks**: Exponer un endpoint de `healthcheck` (ej. `/health`) y monitorizar métricas básicas como latencia de API y tasa de errores.

---

## 10. CI/CD y Definition of Done (DoD)

-   **Pipeline de CI (Integración Continua)**: En cada push a `main` o en cada Pull Request, el pipeline debe ejecutar los siguientes pasos:
    1.  `type-check` (si se usa TypeScript)
    2.  `lint`
    3.  `test`
    4.  `build`
    5.  Análisis de secretos y vulnerabilidades (SAST).

-   **Definition of Done (DoD) para una Tarea/Feature**:
    -   El código cumple con todos los estándares definidos en este documento.
    -   Se han añadido los tests necesarios (unitarios, integración).
    -   El `README.md` ha sido actualizado si se han añadido nuevos scripts, variables de entorno o instrucciones de setup.
    -   El archivo `.env.example` está actualizado.
    -   Se ha verificado que la aplicación funciona correctamente en un entorno de desarrollo (`npm run dev`).
    -   Se ha probado el flujo crítico de la nueva funcionalidad de forma manual o con un test E2E.
