// Lógica de negocio: IRPF, comisiones (fijas/porcentaje), reglas, utilidades de fecha

// Mejoras: validación de fechas, robustez en cálculos, comentarios aclaratorios

export function yearsBetween(aISO, bISO) {
  if (!aISO || !bISO) return 0;
  const a = new Date(aISO);
  const b = new Date(bISO);
  if (isNaN(a.getTime()) || isNaN(b.getTime())) return 0;
  return (b - a) / (1000 * 60 * 60 * 24 * 365.25);
}

// IRPF 15% si antigüedad ≥ 2 años, si no 7%
export function getIrpfPctByAntiguedad(colab, refDateISO) {
  if (!colab?.fecha_alta || !refDateISO) return 0.15;
  return yearsBetween(colab.fecha_alta, refDateISO) >= 2 ? 0.15 : 0.07;
}

/**
 * Calcula el porcentaje de IRPF aplicable a un colaborador.
 * Devuelve un valor entre 0 y 1 (ej: 0.07 para 7%).
 * @param {object} colaborador - El objeto colaborador.
 * @param {string} colaborador.tipo_fiscal - Ej: 'AUTONOMO', 'EMPRESA'.
 * @param {string} colaborador.fecha_alta - Fecha de alta en formato ISO.
 * @param {string} [colaborador.cif_dni] - CIF/DNI para distinguir personas de empresas.
 * @returns {number} El porcentaje de IRPF como un factor (0.07, 0.15, etc.).
 */
export function getIrpfPercentage({ tipo_fiscal, fecha_alta, cif_dni }) {
  const esCIF = cif_dni?.toUpperCase().match(/^[ABCDEFGHJNPQRSUVW]/);
  if (esCIF || tipo_fiscal === "EMPRESA") return 0;
  if (tipo_fiscal === "AUTONOMO_ESPECIAL") return 0;
  if (tipo_fiscal === "AUTONOMO") {
    const añosTranscurridos = yearsBetween(fecha_alta, new Date().toISOString());
    return añosTranscurridos < 2 ? 0.07 : 0.15;
  }
  return 0;
}

// Obtener comisión del colaborador (fija o porcentaje)
export function getColaboradorComision(colab, niveles, comisionBruta) {
  if (!colab) return comisionBruta * 0.5;
  // Si tiene comisión personalizada, usarla
  if (
    colab.comision_personalizada !== null &&
    colab.comision_personalizada !== undefined
  ) {
    if (colab.comision_tipo_personalizada === "fijo") {
      return Number(colab.comision_personalizada) || 0;
    } else if (colab.comision_tipo_personalizada === "porcentaje") {
      return comisionBruta * (Number(colab.comision_personalizada) || 0);
    }
  }
  // Si no, usar la del nivel
  const nivel = niveles.find((n) => n.id === colab.nivel);
  if (!nivel) return comisionBruta * 0.5; // Fallback 50%
  if (nivel.comision_tipo === "fijo") {
    return Number(nivel.comision_valor) || 0;
  } else if (nivel.comision_tipo === "porcentaje") {
    return comisionBruta * (Number(nivel.comision_valor) || 0);
  }
  return 0;
}

// Obtener comisión base del producto (fija o porcentaje)
export function getProductoComisionBase(producto, pvp) {
  if (!producto) return 0;
  if (producto.comision_tipo === "fijo") {
    return Number(producto.comision_valor) || 0;
  } else if (producto.comision_tipo === "porcentaje") {
    return (Number(producto.comision_valor) || 0) * (Number(pvp) || 0);
  }
  return 0;
}

// DEPRECATED: Mantener por compatibilidad pero marcar como obsoleta
export function findNivelPct(colab, niveles) {
  // LOG ELIMINADO
  if (typeof colab?.pct_colaborador === "number") return colab.pct_colaborador;
  return (
    niveles.find((n) => n.id === colab?.nivel)?.pct_colaborador_default ?? 0.5
  );
}

export function baseFromPVP(pvp, impuesto_pct) {
  const p = Number(pvp) || 0;
  const imp = Number(impuesto_pct) || 0;
  return imp > 0 ? p / (1 + imp) : p;
}

// Evalúa reglas por operador/producto/nivel con prioridad
export function evaluateRules({
  reglas,
  operador_id,
  producto_id,
  nivel,
  refBase,
  refComOper,
}) {
  if (!Array.isArray(reglas)) return 0;
  return reglas
    .filter(
      (r) =>
        r.operador_id === operador_id &&
        (r.producto_id == null || r.producto_id === producto_id) &&
        r.nivel === nivel,
    )
    .sort((a, b) => (b.prioridad || 0) - (a.prioridad || 0))
    .reduce(
      (acc, r) =>
        acc +
        (r.tipo === "%"
          ? (r.pct_sobre === "ComisiónOperador" ? refComOper : refBase) *
            Number(r.valor)
          : Number(r.valor)),
      0,
    );
}

// Cálculo completo de una venta con soporte para comisiones fijas/porcentaje
export function computeVenta({
  venta,
  productos = [],
  operadores = [],
  zonas = [],
  colaboradores = [],
  niveles = [],
  reglas = [],
}) {
  // Validación robusta de datos
  const producto = productos.find((p) => p.id === venta.producto_id);
  const operador =
    producto && operadores.find((o) => o.id === producto.operador_id);
  const zona = zonas.find((z) => z.id === venta.zona_id);
  const colab = colaboradores.find((c) => c.id === venta.colaborador_id);

  if (!producto || !operador || !zona || !colab) {
    return { ok: false, error: "Datos incompletos" };
  }

  const pvp = Number(venta.pvp || producto.pvp || 0);
  const impuesto_pct = zona.impuesto_pct;
  const base = baseFromPVP(pvp, impuesto_pct);

  // Comisión base del producto (fija o porcentaje)
  let comOper = getProductoComisionBase(producto, base);

  // Evaluar reglas adicionales
  const extra = evaluateRules({
    reglas,
    operador_id: operador.id,
    producto_id: producto.id,
    nivel: colab.nivel,
    refBase: base,
    refComOper: comOper,
  });

  const comBruta = Math.max(0, comOper + extra);

  // Parte del colaborador (fija o porcentaje)
  const parteColab = getColaboradorComision(colab, niveles, comBruta);

  // Calcular IRPF y neto
  const irpf_pct = getIrpfPctByAntiguedad(colab, venta.fecha);
  const irpf = parteColab * irpf_pct;
  const netoColab = Math.max(0, parteColab - irpf);

  const costeEmpresa = netoColab;
  const margenEmpresa = Math.max(0, comBruta - costeEmpresa);

  // Para backward compatibility, calcular pctColab aproximado
  const pctColab = comBruta > 0 ? parteColab / comBruta : 0;

  return {
    ok: true,
    detalle: {
      zona,
      operador,
      producto,
      colaborador: colab,
      impuesto_pct,
      base,
      comOper,
      extra,
      comBruta,
      pctColab,
      parteColab,
      irpf_pct,
      irpf,
      netoColab,
      costeEmpresa,
      margenEmpresa,
      _debug: {
        comision_producto_tipo: producto.comision_tipo,
        comision_producto_valor: producto.comision_valor,
        comision_colaborador_es_personalizada:
          colab.comision_personalizada !== null,
        comision_colaborador_tipo:
          colab.comision_tipo_personalizada ||
          niveles.find((n) => n.id === colab.nivel)?.comision_tipo,
      },
    },
  };
}

/*
EJEMPLOS DE CÁLCULO CON LA NUEVA LÓGICA:

1. Venta: Fibra 1Gb (60€) - Ana Pérez (PREMIUM)
   - Base: 60€ / 1.21 = 49.59€
   - Comisión producto: 49.59€ × 10% = 4.96€
   - Regla PREMIUM: 49.59€ × 5% = 2.48€
   - Comisión bruta: 4.96€ + 2.48€ = 7.44€
   - Parte Ana (60% nivel PREMIUM): 7.44€ × 60% = 4.46€
   - IRPF (15%): 4.46€ × 15% = 0.67€
   - Neto Ana: 4.46€ - 0.67€ = 3.79€

2. Venta: Luz Pyme (121€) - María Ruiz (BASE)
   - Comisión producto: 15€ fijos (independiente del PVP)
   - Regla BASE: +5€ fijos adicionales
   - Comisión bruta: 15€ + 5€ = 20€
   - Parte María (25€ fijos nivel BASE): 25€
   - IRPF (7%): 25€ × 7% = 1.75€
   - Neto María: 25€ - 1.75€ = 23.25€

3. Venta: Kit Alarma (36.4€) - Luis Gómez (MASTER con override)
   - Base: 36.4€ / 1.21 = 30.08€
   - Comisión producto: 30.08€ × 8% = 2.41€
   - Comisión bruta: 2.41€ (sin reglas aplicables)
   - Parte Luis (30€ fijos override): 30€
   - IRPF (15%): 30€ × 15% = 4.5€
   - Neto Luis: 30€ - 4.5€ = 25.5€
*/
