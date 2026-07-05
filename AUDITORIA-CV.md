# Auditoría de código — Control de Ventas

**Fecha:** 2026-07-05 · **Alcance:** `src/` completo (103 archivos, ~20.000 líneas) · **Metodología:** 5 agentes de solo lectura en paralelo, uno por módulo cohesionado (ver más abajo), con síntesis y deduplicación manual después.

**Resultado:** 51 hallazgos (5 críticos, 10 altos, 21 medios, 15 de código muerto). **Los 51 están resueltos** en el commit `87725084` (y el reset de esquema de Supabase que lo precedió), salvo que se indique lo contrario.

---

## Metodología: los 5 bloques

No se repartió el código por número de archivos, sino por acoplamiento real (mantener juntos los archivos que se citan entre sí):

| Bloque | Alcance |
|---|---|
| 1 | `context/`, `hooks/`, `lib/` — capa de datos y sincronización |
| 2 | `components/ventas/**`, `utils/calculos.js` — entidad central y su motor de cálculo |
| 3 | `components/gestion/**`, `components/colaboradores/**`, `components/reglas/**` — entidades de configuración |
| 4 | `components/config/**`, `components/admin/**`, `components/auth/**` — permisos y ajustes globales |
| 5 | `components/liquidaciones/**`, `components/dashboard/**`, UI compartida |

---

## 🔴 Críticos (5/5 resueltos)

1. **Reglas de comisión nunca se aplicaban.** `evaluateRules` (calculos.js) comparaba `r.nivel` en vez de `r.nivel_id` (columna real de `reglas_cv`), y `ReglaEditModal.jsx` ni siquiera exponía tipo/valor/nivel/prioridad. — *Arreglado: motor corregido + formulario completo.*
2. **Los campos personalizados se perdían al crear una venta nueva.** `addVenta` (useVentasGestion.js) sobreescribía el objeto `customFields` correcto con uno vacío. — *Arreglado.*
3. **Las liquidaciones perdían todos sus importes al sincronizar.** El esquema de `liquidaciones_cv` y la lista blanca de sync no coincidían con los campos reales que genera `generar()`. — *Arreglado: tabla recreada + lista blanca corregida (ver `migrations/2026xxxx_liquidaciones_decomisiones_esquema_real.sql`).*
4. **Las decomisiones perdían datos y además crasheaban la pantalla.** Mismo patrón que el anterior + `TypeError` por `importe_decomision` undefined. — *Arreglado.*
5. **La comisión personalizada por colaborador no sincronizaba ni la leía el cálculo real.** El panel "Esquema Especial" escribía campos inventados en vez de `pct_telefonia`/`pct_energia`/`fijo_seguridad`. — *Arreglado.*

## 🟠 Altos (10/10 resueltos)

1. **Motor de comisión del formulario de venta duplicado y divergente** del real (`calculos.js`). — *Unificado: ahora llama a `computeVenta`.*
2. **Borrar una venta de la tabla sin confirmación.** — *Arreglado: `window.confirm`.*
3. **Fallos de sync al guardar/editar venta nunca llegaban a avisar.** `saveCollectionData` devolvía éxito siempre. — *Arreglado: propaga el resultado real + toast atribuido a la venta.*
4. **"¿Olvidaste la clave?" no enviaba ningún correo.** — *Conectado a Supabase Auth (`resetPasswordForEmail`/`updateUser`).*
5. **Sistema de permisos legacy paralelo** (emails hardcodeados, desconectado del rol real). — *Retirado (`accessControl.js`, `useAuthGestion.js` eliminados).*
6. **Mensaje de acceso denegado no distinguía cuenta pendiente de error de red.** — *Arreglado: `resolveAccessDeniedInfo` en `AppCVv2.jsx`.*
7. **Config→Empresa editable por cualquier rol** aunque el backend exige admin. — *Restringido en la UI.*
8. **Sector heredado de un operador rompía el selector** (mayúsculas vs minúsculas). — *Normalizado.*
9. **Cálculo de meses de decomisión fallaba en la frontera exacta** del compromiso pactado (división por 30.44 días). — *Arreglado con aritmética de calendario + test de regresión.*
10. **Un admin podía autobloquearse** sin confirmación ni vía de recuperación. — *Arreglado: confirmación explícita en `UserManagement.jsx`.*

## 🟡 Medios (21/21 resueltos)

1. `ESTADOS_VALIDOS` del formulario no cubría estados reales del importador (`PENDIENTE VALIDAR`, `PENDIENTE INSTALACION`) — corrupción silenciosa al editar.
2. Filtro rápido "Hoy" en Ventas no filtraba nada (`fecha: 'today'` no existe como filtro real).
3. Historial de comisiones de producto se duplicaba en cada guardado, no solo al cerrar vigencia.
4. Producto con comisión "mixta" mostraba 0€ en tabla y CSV.
5. "Estado Agente" del colaborador (Inactivo/Suspendido) no tenía ningún efecto — solo miraba `fecha_baja`.
6. `glassStyles` usado sin invocar en 4 sitios — estilos "glass" rotos.
7. `resolveId` de la previsualización de importación divergía del resolveId real (comparación case-sensitive vs normalizada).
8. `loadCollectionData` tragaba errores de lectura de Supabase en silencio.
9. Backup de emergencia incompleto (solo 4 de 10 colecciones).
10. "Solicitar Acceso" en la pantalla de acceso denegado era un no-op total.
11. `CustomFieldsSection` no ocultaba edición a rol `viewer`.
12. "Zonas" en Configuración era de solo lectura pese a sugerir gestión completa.
13. Ruta `/admin/administracion` inalcanzable desde la navegación y duplicada de `/gestion`.
14. Estados "activos/liquidables" inconsistentes entre Dashboard y Liquidaciones (`ACTIVADA` no mapeaba igual).
15. Fallback de reglas de decomisión incompleto (todo-o-nada por objeto, no por campo) — producía `NaN` en silencio.
16. Condición de carrera en `AuthProvider` (dos rutas de carga de perfil sin guard de desmontaje).
17. Fallback de campos personalizados en la importación roto (`get(field.nombre)` nunca resolvía nada).
18. `NivelEditModal` no exponía `comision_tipo`/`comision_valor` (fallback genérico al 50%).
19. `pct_colaborador` era un campo huérfano (se guardaba pero no se usaba en el cálculo real).
20. Validación de comisiones negativas incompleta en `ProductoModal` (solo cubría `comision_valor`).
21. El total de decomisiones se calculaba para el PDF de liquidación pero nunca se mostraba.

## ⚪ Código muerto (15/15 resueltos)

1. `src/utils/supabase.js` — archivo vacío duplicado, 0 usos.
2. `LS_KEYS` en `constants.js` — la mayoría de claves sin uso, duplicaban `STORAGE_KEYS` real.
3. `ejemploCampoPersonalizado` — verificado en uso real, **no era código muerto** (falso positivo del agente, descartado).
4. 4 funciones de `storage.js` sin ningún uso.
5. `accessControl.js` — eliminado junto con el hallazgo A5.
6. `useAuthGestion` con doble instancia — resuelto al eliminar el archivo (A5).
7. Props muertas en `VentasTable` (`onActivate`, 4× `resolveNombre*`).
8. Prop muerta `ventasCount` en `VentasActions`.
9. Tendencia `"+12%"` hardcodeada en `VentasStats`.
10. `ReglasTable.jsx`/`NivelesTable.jsx` nunca importados — eliminados.
11. `ColaboradoresTable.jsx` nunca importado — eliminado.
12. "Acuerdos" decía "LocalStorage" pero era solo `useState` — ahora persiste de verdad.
13. `_debug.comision_colaborador_es_personalizada` con comprobación distinta a la real.
14. `StatusWidgets` con destructuring de campos inexistentes — resuelto al eliminar el componente `OfflineStatus` (nunca se renderizaba).
15. Comentarios desincronizados sobre `documento` (decían que era solo local, ya tenía columna real).

---

## Notas

- El único hallazgo que resultó ser un **falso positivo tras verificación** fue el código-muerto #3 (`ejemploCampoPersonalizado`); se descartó en vez de "arreglarlo".
- Commit con todos los arreglos: `87725084` — `fix: reset de esquema Supabase y cierre de auditoría completa (51 hallazgos)`.

## Corrección sobre el estado de los tests (2ª pasada, 2026-07-05)

La nota original de este documento decía que 2 tests de `offlineSyncHelpers.test.js` fallaban por "un problema preexistente, sin relación, de un trabajo sin commitear anterior a esta auditoría". Eso era incorrecto: una segunda pasada de auditoría (rol Fontanero) hizo `git blame` sobre las líneas exactas y confirmó que el fallback fila-a-fila que rompía esos tests se añadió **en el propio commit `87725084`**, no antes. El comportamiento del fallback es correcto (mejora real: si falla el upsert en lote, reintenta cada fila individualmente); solo las aserciones de los tests habían quedado desactualizadas. Corregido en la misma segunda pasada — ver más abajo.

## Segunda pasada — Fontanero + Auditor (2026-07-05)

Tras el cierre de los 51 hallazgos, se convocó una segunda ronda con los roles Fontanero (higiene/funcionamiento) y Auditor (seguridad) para verificar que las correcciones no introdujeron regresiones y cubrir superficies que la primera pasada no exploró a fondo (huecos, seguridad). Todo lo encontrado se resolvió en la misma sesión:

- **Crítico:** closures obsoletas en `CustomFieldsSection.jsx` que perdían campos personalizados en silencio; script `npm run healthcheck` roto (eliminado, sin uso real); 2 tests desactualizados en `offlineSyncHelpers.test.js` (ver arriba); duplicación de decomisiones al regenerar liquidaciones con un colaborador tardío; trigger legacy en `auth.users` que intentaba auto-promocionar a admin en la tabla `profiles` compartida — **verificado en la base real (2026-07-05): estaba instalado y habilitado junto a otro trigger legacy (`on_auth_user_created_cv_restrictive`) que además fallaba por referenciar columnas inexistentes (`nombre_completo`/`email` en `usuarios_cv`, `rol`/`activo` en `profiles`, que en realidad se llaman distinto). Ambos se eliminaron con `migrations/2026xxxx_verificar_trigger_legacy_auth_users.sql`. Se confirmó además, revisando `profiles`, que la escalada nunca llegó a completarse: los 3 únicos `admin` comparten un mismo `created_at` (semilla manual del 2026-01-28), y todos los registros posteriores vía `signUp` quedaron correctamente en `role='user'`. Sin evidencia de explotación real.**
- **Alto (seguridad):** inyección de fórmulas CSV en los exportadores de ventas, productos y operadores (el de liquidaciones ya estaba protegido) — unificado en `src/utils/csv.js`.
- **Medio:** `AUTH_BYPASS` atado a `import.meta.env.DEV`; scripts `format`/`format:check` (placebo pese a tener Prettier instalado); `.sql` obsoletos marcados; `.gitignore` sin excluir `supabase/.temp/`; política `cv_ventas_update` sin `WITH CHECK`.
- **Huecos de documentación:** `INICIO-RAPIDO.md` y `docs/ACCESS_CONTROL_GUIDE.md` describían un esquema de base de datos y un sistema de permisos que ya no existen; estructura de `README.md` desactualizada.
