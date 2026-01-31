---
name: Lógica de Comisiones
description: Guía completa para implementar y mantener la lógica de cálculo de comisiones del sistema Control Ventas
---

# 💼 Skill: Lógica de Comisiones

Este skill documenta toda la lógica de negocio relacionada con el cálculo de comisiones en el sistema **Control Ventas**. Úsalo como referencia para implementar nuevas funcionalidades o corregir bugs relacionados con comisiones.

---

## 📁 Archivos Clave

| Archivo | Descripción |
|---------|-------------|
| `src/utils/calculos.js` | **Motor principal** - Contiene todas las funciones de cálculo |
| `src/components/liquidaciones/liquidacionesUtils.js` | Decomisiones y liquidaciones |
| `src/components/Reglas.jsx` | UI para gestionar niveles y reglas |
| `src/components/reglas/` | Modales de edición de niveles y reglas |
| `src/services/entityCreator.js` | Creación de entidades con campos de comisión |

---

## 🧮 Flujo de Cálculo de Comisiones

### 1. Función Principal: `computeVenta()`

Esta es la función central que calcula todos los valores de una venta:

```javascript
computeVenta({
  venta,        // Objeto venta
  productos,    // Catálogo de productos
  operadores,   // Operadores (Movistar, Vodafone, etc.)
  zonas,        // Zonas fiscales (Península, Canarias, etc.)
  colaboradores,// Lista de colaboradores
  niveles,      // Niveles de comisión
  reglas,       // Reglas especiales por operador/producto
})
```

### 2. Orden de Cálculo

```
┌─────────────────────────────────────────────────────────────────────┐
│  1. PVP → Base (sin impuestos)                                      │
│     base = pvp / (1 + impuesto_pct)                                 │
├─────────────────────────────────────────────────────────────────────┤
│  2. Comisión Base del Producto                                      │
│     - Fija: comision_fija                                           │
│     - Porcentaje: (comision_porcentaje / 100) * base                │
│     - Mixta: fija + (porcentaje * base)                             │
├─────────────────────────────────────────────────────────────────────┤
│  3. Reglas Adicionales                                              │
│     extra = evaluateRules() → bonos/ajustes por operador/producto   │
├─────────────────────────────────────────────────────────────────────┤
│  4. Comisión Bruta Total                                            │
│     comBruta = max(0, comBase + extra)                              │
├─────────────────────────────────────────────────────────────────────┤
│  5. Parte del Colaborador                                           │
│     parteColab = getColaboradorComision(colab, niveles, comBase)    │
├─────────────────────────────────────────────────────────────────────┤
│  6. IRPF (solo autónomos)                                           │
│     irpf = parteColab * (antigüedad >= 2 años ? 0.15 : 0.07)        │
├─────────────────────────────────────────────────────────────────────┤
│  7. Neto Colaborador                                                │
│     netoColab = parteColab - irpf                                   │
├─────────────────────────────────────────────────────────────────────┤
│  8. Margen Empresa                                                  │
│     margenEmpresa = comBruta - netoColab                            │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 💰 Tipos de Comisión

### A. Comisión del Producto

Definida en el catálogo de productos:

| Tipo | Campo | Fórmula |
|------|-------|---------|
| `fijo` | `comision_fija` | Valor fijo en € |
| `porcentaje` | `comision_porcentaje` | `(valor / 100) * base` |
| `mixto` | Ambos | `fija + (porcentaje * base)` |

### B. Comisión del Colaborador

Jerarquía de prioridad (primera que aplique):

1. **Comisión Personalizada** (si `comision_personalizada` está definida)
   - `comision_tipo_personalizada === 'fijo'` → Valor fijo
   - `comision_tipo_personalizada === 'porcentaje'` → `comBase * factor`

2. **Por Sector** (según producto)
   - TELEFONÍA: `pct_telefonia` del colaborador o nivel
   - ENERGÍA: `pct_energia` del colaborador o nivel
   - SEGURIDAD: `fijo_seguridad` del nivel (siempre fijo)

3. **Por Nivel** (fallback genérico)
   - `comision_tipo === 'fijo'` → Valor fijo
   - `comision_tipo === 'porcentaje'` → `comBase * factor`

4. **Fallback Final**: `comBase * 0.5` (50%)

---

## 🏛️ Estructura de Niveles

Los niveles definen esquemas de comisión reutilizables:

```javascript
{
  id: "uuid",
  nombre: "Senior",
  comision_tipo: "porcentaje",      // 'fijo' | 'porcentaje'
  comision_valor: 60,               // 60% si porcentaje, 60€ si fijo
  pct_colaborador_default: 0.6,     // Fallback general
  pct_telefonia: 0.55,              // % para sector telefonía
  pct_energia: 0.60,                // % para sector energía
  fijo_seguridad: 50,               // € fijos para seguridad
}
```

---

## 📋 Reglas Especiales

Las reglas aplican bonos o ajustes adicionales:

```javascript
{
  id: "uuid",
  operador_id: "op-movistar",       // Obligatorio
  producto_id: null,                // null = todos los productos
  nivel: "junior",                  // Nivel del colaborador
  tipo: "%",                        // '%' o 'fijo'
  valor: 5,                         // 5% o 5€
  pct_sobre: "ComisiónOperador",    // 'ComisiónOperador' o 'Base'
  prioridad: 1,                     // Mayor prioridad primero
}
```

### Evaluación de Reglas

```javascript
evaluateRules({
  reglas,           // Todas las reglas
  operador_id,      // Filtrar por operador
  producto_id,      // Filtrar por producto (o null)
  nivel,            // Nivel del colaborador
  refBase,          // Base para cálculos sobre 'Base'
  refComOper,       // comBase para cálculos sobre 'ComisiónOperador'
})
```

---

## 💸 Cálculo de IRPF

Solo aplica a colaboradores tipo **AUTÓNOMO**:

```javascript
// Exentos de IRPF:
// - Empresas (tipo_fiscal === 'EMPRESA')
// - CIF (cif_dni empieza con A-H, J-N, P-S, U-W)
// - AUTONOMO_ESPECIAL
// - EXENTO

// Autónomos:
// - < 2 años de antigüedad: 7%
// - >= 2 años de antigüedad: 15%
```

---

## 🔴 Decomisiones (Penalizaciones)

Cuando un cliente se da de baja antes de cumplir su compromiso:

```javascript
calcularDecomisiones(ventas, clientes, operadores)
```

### Reglas por defecto del operador:

```javascript
reglas_decomision: {
  antes_6_meses: 100,     // 100% de penalización si baja antes de 6 meses
  despues_6_meses: 50,    // 50% de penalización proporcional después
  limite_meses: 6,        // Límite para regla "antes"
}
```

### Fórmula de Decomisión:

```
SI mesesTranscurridos < limite_meses:
    porcentajeDecomision = antes_6_meses / 100

SI NO:
    porcentajeCumplido = mesesTranscurridos / mesesComprometidos
    porcentajeDecomision = (100 - porcentajeCumplido*100) * (despues_6_meses/100) / 100

importeDecomision = comisionOriginal * porcentajeDecomision
```

---

## 🏝️ Zonas Fiscales

| Zona | Impuesto | Tasa |
|------|----------|------|
| Península | IVA | 21% |
| Canarias | IGIC | 7% |
| Ceuta/Melilla | Exento | 0% |

```javascript
// Cálculo de base desde PVP:
base = pvp / (1 + impuesto_pct)
```

---

## ✅ Checklist para Nuevas Implementaciones

Al añadir o modificar lógica de comisiones, verificar:

- [ ] ¿Se respeta la jerarquía de prioridades (personalizada → sector → nivel)?
- [ ] ¿Los porcentajes se normalizan correctamente (`> 1` → dividir por 100)?
- [ ] ¿Se usa `comBase` (no `comBruta`) como referencia para el colaborador?
- [ ] ¿El IRPF solo aplica a AUTÓNOMOS con las tasas correctas?
- [ ] ¿Las zonas fiscales aplican el impuesto correcto?
- [ ] ¿Las decomisiones usan las reglas del operador?
- [ ] ¿Se manejan correctamente los casos `null`/`undefined`?

---

## 🐛 Errores Comunes y Soluciones

### 1. Comisión = 0 inesperadamente

**Causa probable**: Datos incompletos (producto, operador, zona o colaborador no encontrado)

```javascript
if (!producto || !operador || !zona || !colab) {
  return { ok: false, error: "Datos incompletos" };
}
```

**Solución**: Verificar que todos los IDs referenciados existen en las entidades.

### 2. Porcentaje aplicado mal

**Causa probable**: El valor está como 60 en vez de 0.60

**Solución**: Usar `normalizeFactor()`:
```javascript
const normalizeFactor = (valor) => {
  if (valor > 1) return valor / 100;  // 60 → 0.60
  return valor;                        // 0.60 → 0.60
};
```

### 3. IRPF aplicado a empresas

**Causa probable**: No se detecta el CIF correctamente

```javascript
// Patrón correcto para CIF español:
const esCIF = cif_dni?.toUpperCase().match(/^[ABCDEFGHJNPQRSUVW]/);
```

---

## 📊 Ejemplo de Cálculo Completo

**Escenario**: Venta de Fibra 600Mb Movistar en Canarias

| Campo | Valor |
|-------|-------|
| PVP | 42€ |
| Zona | Canarias (IGIC 7%) |
| Tipo comisión producto | Fijo 35€ |
| Nivel colaborador | Senior (60%) |
| Antigüedad | 3 años |

**Cálculo**:
```
1. Base = 42 / 1.07 = 39.25€
2. comBase = 35€ (fijo)
3. extra = 0€ (sin reglas)
4. comBruta = 35€
5. parteColab = 35 * 0.60 = 21€
6. irpf = 21 * 0.15 = 3.15€ (autónomo >= 2 años)
7. netoColab = 21 - 3.15 = 17.85€
8. margenEmpresa = 35 - 17.85 = 17.15€
```

---

## 🔧 Funciones Auxiliares Importantes

```javascript
// Años entre dos fechas
yearsBetween(fechaISO_a, fechaISO_b)

// IRPF según antigüedad
getIrpfPctByAntiguedad(colaborador, fechaReferencia)

// Comisión base del producto
getProductoComisionBase(producto, pvp, venta)

// Comisión del colaborador
getColaboradorComision(colab, niveles, comisionBruta, producto)

// Evaluar reglas adicionales
evaluateRules({ reglas, operador_id, producto_id, nivel, refBase, refComOper })

// Base desde PVP
baseFromPVP(pvp, impuesto_pct)
```

---

## 📝 Notas Adicionales

1. **Valores congelados**: Cuando se guarda una venta, `comision_base` se "congela" para evitar que cambios en el catálogo afecten ventas pasadas.

2. **Sector del producto**: Determina qué campo de porcentaje usar del nivel (`pct_telefonia`, `pct_energia`, `fijo_seguridad`).

3. **Prioridad de reglas**: Las reglas con mayor `prioridad` se evalúan primero.

4. **Vigencia de comisiones**: Los productos pueden tener `comision_vigencia_desde` y `comision_vigencia_hasta` para aplicar comisiones especiales temporales.

---

*Última actualización: Enero 2026*
