# 🏗️ Diagrama de Arquitectura - Control de Ventas (CV)

## 📊 Diagrama de Relaciones entre Tablas

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        SISTEMA CONTROL DE VENTAS (CV)                   │
│                         Proyecto Supabase: MIsapp                       │
└─────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────┐
│                      CAPA DE AUTENTICACIÓN                               │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌─────────────────┐         ┌──────────────────────┐                  │
│  │   auth.users    │────────▶│   usuarios_cv        │                  │
│  │  (Supabase)     │         │  - id                │                  │
│  │  - id           │         │  - user_id (FK)      │                  │
│  │  - email        │         │  - nombre_completo   │                  │
│  │  - password     │         │  - email             │                  │
│  └─────────────────┘         │  - rol               │                  │
│                              │  - activo            │                  │
│                              │  - app_access[]      │                  │
│                              └──────────────────────┘                  │
│                                        │                                │
│                                        │                                │
│                              ┌──────────────────────┐                  │
│                              │ emails_permitidos_cv │                  │
│                              │  - email             │                  │
│                              │  - rol_predeterminado│                  │
│                              │  - activo_por_defecto│                  │
│                              └──────────────────────┘                  │
└──────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────┐
│                      CAPA DE DATOS MAESTROS                              │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌──────────────────────┐              ┌──────────────────────┐         │
│  │   clientes_cv        │              │   productos_cv       │         │
│  │  - id                │              │  - id                │         │
│  │  - nombre            │              │  - codigo            │         │
│  │  - cif_nif           │              │  - nombre            │         │
│  │  - email             │              │  - categoria         │         │
│  │  - telefono          │              │  - precio_base       │         │
│  │  - direccion         │              │  - comision_%        │         │
│  │  - tipo_cliente      │              │  - comision_fija     │         │
│  │  - estado            │              │  - activo            │         │
│  │  - created_by (FK)   │              └──────────────────────┘         │
│  └──────────────────────┘                        │                      │
│           │                                      │                      │
│           │                                      │                      │
└───────────┼──────────────────────────────────────┼──────────────────────┘
            │                                      │
            │                                      │
┌───────────┼──────────────────────────────────────┼──────────────────────┐
│           │         CAPA DE TRANSACCIONES        │                      │
├───────────┼──────────────────────────────────────┼──────────────────────┤
│           │                                      │                      │
│           ▼                                      │                      │
│  ┌──────────────────────┐                       │                      │
│  │   ventas_cv          │◀──────────────────────┘                      │
│  │  - id                │                                               │
│  │  - numero_venta      │                                               │
│  │  - cliente_id (FK)   │                                               │
│  │  - vendedor_id (FK)  │                                               │
│  │  - fecha_venta       │                                               │
│  │  - estado            │                                               │
│  │  - total_venta       │                                               │
│  │  - total_comision    │                                               │
│  └──────────────────────┘                                               │
│           │                                                             │
│           │                                                             │
│           ├──────────────────┐                                          │
│           │                  │                                          │
│           ▼                  ▼                                          │
│  ┌──────────────────┐  ┌──────────────────┐                            │
│  │ detalles_venta_cv│  │  comisiones_cv   │                            │
│  │  - id            │  │  - id            │                            │
│  │  - venta_id (FK) │  │  - venta_id (FK) │                            │
│  │  - producto_id   │  │  - vendedor_id   │                            │
│  │  - cantidad      │  │  - monto_comision│                            │
│  │  - precio_unit.  │  │  - estado_pago   │                            │
│  │  - subtotal      │  │  - fecha_pago    │                            │
│  │  - comision      │  └──────────────────┘                            │
│  └──────────────────┘                                                   │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────┐
│                      CAPA DE CRM Y SEGUIMIENTO                           │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌──────────────────────┐              ┌──────────────────────┐         │
│  │  oportunidades_cv    │              │   actividades_cv     │         │
│  │  - id                │              │  - id                │         │
│  │  - titulo            │              │  - tipo              │         │
│  │  - cliente_id (FK)   │◀─────────────│  - asunto            │         │
│  │  - vendedor_id (FK)  │              │  - descripcion       │         │
│  │  - etapa             │              │  - cliente_id (FK)   │         │
│  │  - valor_estimado    │              │  - oportunidad_id    │         │
│  │  - probabilidad      │              │  - usuario_id (FK)   │         │
│  │  - fecha_cierre_est. │              │  - fecha_actividad   │         │
│  │  - fecha_cierre_real │              │  - completada        │         │
│  └──────────────────────┘              └──────────────────────┘         │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

## 🔄 Flujo de Datos Principal

```
1. REGISTRO DE USUARIO
   ┌─────────────┐
   │ Usuario se  │
   │ registra    │
   └──────┬──────┘
          │
          ▼
   ┌─────────────┐      ┌──────────────┐
   │ auth.users  │─────▶│ Trigger      │
   │ (Supabase)  │      │ automático   │
   └─────────────┘      └──────┬───────┘
                               │
                               ▼
                        ┌──────────────┐
                        │ usuarios_cv  │
                        │ (perfil)     │
                        └──────────────┘

2. PROCESO DE VENTA
   ┌─────────────┐
   │ Crear       │
   │ Cliente     │
   └──────┬──────┘
          │
          ▼
   ┌─────────────┐      ┌──────────────┐
   │ clientes_cv │      │ oportunidades│
   │             │◀─────│ _cv          │
   └──────┬──────┘      └──────────────┘
          │                    │
          │                    │ (Ganada)
          │                    │
          ▼                    ▼
   ┌─────────────┐      ┌──────────────┐
   │ ventas_cv   │◀─────│ Conversión   │
   │             │      └──────────────┘
   └──────┬──────┘
          │
          ├──────────────┬────────────────┐
          │              │                │
          ▼              ▼                ▼
   ┌──────────┐   ┌──────────┐    ┌──────────┐
   │ detalles │   │comisiones│    │actividades│
   │ _venta_cv│   │ _cv      │    │ _cv      │
   └──────────┘   └──────────┘    └──────────┘

3. SEGUIMIENTO Y CRM
   ┌─────────────┐
   │ Cliente     │
   │ potencial   │
   └──────┬──────┘
          │
          ▼
   ┌─────────────┐
   │ oportunidad │
   │ _cv         │
   └──────┬──────┘
          │
          ├──────────────┐
          │              │
          ▼              ▼
   ┌──────────┐   ┌──────────┐
   │actividades│   │ Etapas   │
   │ _cv      │   │ Pipeline │
   └──────────┘   └────┬─────┘
                       │
                       ▼
                  ┌─────────┐
                  │ Ganada? │
                  └────┬────┘
                       │
                  ┌────┴────┐
                  │         │
                 Sí        No
                  │         │
                  ▼         ▼
              ┌──────┐  ┌──────┐
              │Venta │  │Perdida│
              └──────┘  └──────┘
```

## 🔐 Capas de Seguridad (RLS)

```
┌────────────────────────────────────────────────────────────┐
│                    USUARIO AUTENTICADO                     │
│                      (auth.uid())                          │
└────────────────────────┬───────────────────────────────────┘
                         │
                         ▼
              ┌──────────────────────┐
              │ ¿Existe en           │
              │ usuarios_cv?         │
              └──────┬───────────────┘
                     │
              ┌──────┴──────┐
              │             │
             Sí            No
              │             │
              ▼             ▼
    ┌─────────────────┐  ┌──────────┐
    │ ¿Activo = true? │  │ DENEGADO │
    └────────┬────────┘  └──────────┘
             │
      ┌──────┴──────┐
      │             │
     Sí            No
      │             │
      ▼             ▼
┌──────────┐  ┌──────────┐
│ ¿'CV' en │  │ DENEGADO │
│app_access│  └──────────┘
└────┬─────┘
     │
┌────┴────┐
│         │
Sí       No
│         │
▼         ▼
┌─────┐ ┌──────────┐
│ACCESO│ │ DENEGADO │
│SEGÚN│ └──────────┘
│ ROL │
└──┬──┘
   │
   ├────────────┬────────────┐
   │            │            │
   ▼            ▼            ▼
┌──────┐   ┌──────┐    ┌────────┐
│ADMIN │   │ USER │    │ VIEWER │
│      │   │      │    │        │
│Todo  │   │Sus   │    │ Solo   │
│acceso│   │datos │    │lectura │
└──────┘   └──────┘    └────────┘
```

## 📊 Estados y Flujos

### Estados de Venta
```
┌──────────┐
│PENDIENTE │ ← Estado inicial
└────┬─────┘
     │
     ▼
┌──────────┐
│CONFIRMADA│ ← Venta confirmada
└────┬─────┘
     │
     ├──────────┐
     │          │
     ▼          ▼
┌──────────┐ ┌──────────┐
│COMPLETADA│ │CANCELADA │
└──────────┘ └──────────┘
```

### Etapas de Oportunidad
```
┌─────────────────┐
│CONTACTO_INICIAL │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  CALIFICACION   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   PROPUESTA     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  NEGOCIACION    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│     CIERRE      │
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
┌────────┐ ┌────────┐
│ GANADA │ │PERDIDA │
└────────┘ └────────┘
```

### Estados de Comisión
```
┌──────────┐
│PENDIENTE │ ← Comisión generada
└────┬─────┘
     │
     ├──────────┐
     │          │
     ▼          ▼
┌──────────┐ ┌──────────┐
│  PAGADA  │ │CANCELADA │
└──────────┘ └──────────┘
```

## 🎯 Roles y Permisos

```
┌─────────────────────────────────────────────────────────────┐
│                         ADMIN                               │
├─────────────────────────────────────────────────────────────┤
│ ✅ Ver todos los datos                                      │
│ ✅ Crear/Editar/Eliminar usuarios                           │
│ ✅ Gestionar productos                                      │
│ ✅ Ver todas las ventas                                     │
│ ✅ Gestionar comisiones                                     │
│ ✅ Ver todas las oportunidades                              │
│ ✅ Acceso completo a reportes                               │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                         USER                                │
├─────────────────────────────────────────────────────────────┤
│ ✅ Ver su propio perfil                                     │
│ ✅ Ver/Crear clientes                                       │
│ ✅ Ver productos activos                                    │
│ ✅ Crear/Ver sus propias ventas                             │
│ ✅ Ver sus propias comisiones                               │
│ ✅ Gestionar sus oportunidades                              │
│ ✅ Registrar actividades                                    │
│ ❌ No puede ver datos de otros vendedores                   │
│ ❌ No puede gestionar usuarios                              │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                        VIEWER                               │
├─────────────────────────────────────────────────────────────┤
│ ✅ Ver su propio perfil                                     │
│ ✅ Ver clientes                                             │
│ ✅ Ver productos                                            │
│ ✅ Ver ventas (limitado)                                    │
│ ❌ No puede crear/editar datos                              │
│ ❌ No puede ver comisiones                                  │
└─────────────────────────────────────────────────────────────┘
```

## 🔧 Triggers Automáticos

```
┌─────────────────────────────────────────────────────────────┐
│                  TRIGGERS IMPLEMENTADOS                     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ 1. on_auth_user_created_cv                                 │
│    ├─ Tabla: auth.users                                    │
│    ├─ Evento: AFTER INSERT                                 │
│    └─ Acción: Crear perfil en usuarios_cv                  │
│                                                             │
│ 2. update_usuarios_cv_updated_at                           │
│    ├─ Tabla: usuarios_cv                                   │
│    ├─ Evento: BEFORE UPDATE                                │
│    └─ Acción: Actualizar updated_at                        │
│                                                             │
│ 3. update_clientes_cv_updated_at                           │
│    ├─ Tabla: clientes_cv                                   │
│    ├─ Evento: BEFORE UPDATE                                │
│    └─ Acción: Actualizar updated_at                        │
│                                                             │
│ 4. update_productos_cv_updated_at                          │
│    ├─ Tabla: productos_cv                                  │
│    ├─ Evento: BEFORE UPDATE                                │
│    └─ Acción: Actualizar updated_at                        │
│                                                             │
│ 5. update_ventas_cv_updated_at                             │
│    ├─ Tabla: ventas_cv                                     │
│    ├─ Evento: BEFORE UPDATE                                │
│    └─ Acción: Actualizar updated_at                        │
│                                                             │
│ 6. update_comisiones_cv_updated_at                         │
│    ├─ Tabla: comisiones_cv                                 │
│    ├─ Evento: BEFORE UPDATE                                │
│    └─ Acción: Actualizar updated_at                        │
│                                                             │
│ 7. update_oportunidades_cv_updated_at                      │
│    ├─ Tabla: oportunidades_cv                              │
│    ├─ Evento: BEFORE UPDATE                                │
│    └─ Acción: Actualizar updated_at                        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## 📈 Índices Optimizados

```
┌─────────────────────────────────────────────────────────────┐
│                    ÍNDICES CREADOS                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ usuarios_cv:                                                │
│  ├─ idx_usuarios_cv_user_id                                │
│  ├─ idx_usuarios_cv_email                                  │
│  └─ idx_usuarios_cv_rol                                    │
│                                                             │
│ clientes_cv:                                                │
│  ├─ idx_clientes_cv_nombre                                 │
│  ├─ idx_clientes_cv_cif                                    │
│  ├─ idx_clientes_cv_estado                                 │
│  └─ idx_clientes_cv_created_by                             │
│                                                             │
│ productos_cv:                                               │
│  ├─ idx_productos_cv_codigo                                │
│  ├─ idx_productos_cv_categoria                             │
│  └─ idx_productos_cv_activo                                │
│                                                             │
│ ventas_cv:                                                  │
│  ├─ idx_ventas_cv_numero                                   │
│  ├─ idx_ventas_cv_cliente                                  │
│  ├─ idx_ventas_cv_vendedor                                 │
│  ├─ idx_ventas_cv_fecha                                    │
│  └─ idx_ventas_cv_estado                                   │
│                                                             │
│ detalles_venta_cv:                                          │
│  ├─ idx_detalles_venta_cv_venta                            │
│  └─ idx_detalles_venta_cv_producto                         │
│                                                             │
│ comisiones_cv:                                              │
│  ├─ idx_comisiones_cv_venta                                │
│  ├─ idx_comisiones_cv_vendedor                             │
│  └─ idx_comisiones_cv_estado                               │
│                                                             │
│ oportunidades_cv:                                           │
│  ├─ idx_oportunidades_cv_cliente                           │
│  ├─ idx_oportunidades_cv_vendedor                          │
│  └─ idx_oportunidades_cv_etapa                             │
│                                                             │
│ actividades_cv:                                             │
│  ├─ idx_actividades_cv_cliente                             │
│  ├─ idx_actividades_cv_oportunidad                         │
│  ├─ idx_actividades_cv_usuario                             │
│  └─ idx_actividades_cv_fecha                               │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## 🎨 Leyenda

```
Símbolos utilizados en los diagramas:

┌─┐  Caja/Contenedor
│ │  Línea vertical
─    Línea horizontal
▶    Flecha/Relación
◀    Flecha inversa
FK   Foreign Key (Clave foránea)
✅   Permitido/Habilitado
❌   No permitido/Deshabilitado
```

---

**Nota:** Este diagrama representa la estructura completa del sistema Control de Ventas (CV) en Supabase. Todas las relaciones están implementadas con claves foráneas y políticas RLS para garantizar la seguridad de los datos.
