// Lógica de negocio: IRPF, comisiones (fijas/porcentaje), reglas, utilidades de fecha

// Mejoras: validación de fechas, robustez en cálculos, comentarios aclaratorios

export function yearsBetween(aISO, bISO) {
  if (!aISO || !bISO) return 0;
  const a = new Date(aISO);
  const b = new Date(bISO);
  if (isNaN(a.getTime()) || isNaN(b.getTime())) return 0;
  return (b - a) / (1000 * 60 * 60 * 24 * 365.25);
}

/**
 * Calcula el porcentaje de IRPF aplicable a un colaborador, como factor 0-1.
 * EMPRESA, AUTONOMO_ESPECIAL, EXENTO y cualquier CIF de empresa quedan exentos (0).
 * AUTONOMO paga 7% con menos de 2 años de antigüedad, 15% en adelante.
 *
 * `fechaReferencia` es obligatorio y es quien fija el momento en que se evalúa la
 * antigüedad: para una venta debe ser `venta.fecha`, no la fecha actual del sistema.
 * Así el tramo de IRPF de una venta queda congelado a cuándo se hizo, igual que ya
 * se congela `comision_base` — y no cambia si la liquidación se recalcula más tarde.
 * Única función de IRPF del repo: unifica getIrpfPctByAntiguedad, getIrpfPercentage
 * (calculos.js) y calcularIRPF (liquidacionesUtils.js, colaboradores).
 *
 * @param {object} colaborador
 * @param {string} colaborador.tipo_fiscal - AUTONOMO | AUTONOMO_ESPECIAL | EMPRESA | EXENTO
 * @param {string} colaborador.fecha_alta - Fecha de alta en formato ISO.
 * @param {string} [colaborador.cif_dni] - CIF/DNI para distinguir personas de empresas.
 * @param {string} fechaReferencia - Fecha ISO respecto a la que se mide la antigüedad.
 * @returns {number} Factor de IRPF (0, 0.07 o 0.15).
 */
export function getIrpfPct(colaborador, fechaReferencia) {
  if (!colaborador) return 0;
  const tipo = (colaborador.tipo_fiscal || colaborador.tipo || "").toString().toUpperCase();
  const esCIF = colaborador.cif_dni?.toUpperCase()?.match(/^[ABCDEFGHJNPQRSUVW]/);
  if (esCIF || tipo === "EMPRESA" || tipo === "AUTONOMO_ESPECIAL" || tipo === "EXENTO") return 0;
  if (tipo !== "AUTONOMO") return 0;
  return yearsBetween(colaborador.fecha_alta, fechaReferencia) >= 2 ? 0.15 : 0.07;
}

// Obtener comisión del colaborador (fija o porcentaje)
// Exportada para que las pantallas que muestran pct_telefonia/pct_energia como "%"
// (Reglas, NivelesTable, Colaboradores, ColaboradorEditModal) apliquen la misma
// normalización que ya usa el cálculo de comisión: si el valor guardado es > 1
// (p. ej. 100 en vez de 1 porque alguien escribió "100" pensando en "100%"), se
// interpreta como puntos porcentuales en vez de mostrarse literalmente *100 (10000%).
export const normalizeFactor = (valor) => {
  if (valor === null || valor === undefined) return null;
  const numeric = Number(valor);
  if (!isFinite(numeric) || numeric < 0) return null;
  return numeric > 1 ? numeric / 100 : numeric;
};

// La columna real en colaboradores_cv es nivel_id. Antes de este fix, el
// alta manual (ColaboradorEditModal.jsx) guardaba el campo como "nivel", y la
// autocreación por importación (useImportGestion.js) lo guardaba como
// "nivelId" — ninguno de los dos coincidía con la columna real, así que todo
// colaborador (manual o importado) fallaba al sincronizar con Supabase
// (PGRST204 "columna no encontrada"). Se unifica a nivel_id en los sitios que
// escriben el dato; esta función prioriza nivel_id pero conserva los dos
// nombres antiguos como fallback de lectura, para no perder la asignación de
// nivel de colaboradores ya guardados en local antes de este fix.
export function getColaboradorNivelId(colab) {
  return colab?.nivel_id ?? colab?.nivel ?? colab?.nivelId ?? null;
}

export function getColaboradorComision(colab, niveles, comisionBruta, producto) {
  if (!colab) return comisionBruta * 0.5;

  const sector = producto?.sector?.toUpperCase();

  // Si tiene comisión personalizada, usarla (siempre sobre la base)
  if (
    colab.comision_personalizada !== null &&
    colab.comision_personalizada !== undefined
  ) {
    if (colab.comision_tipo_personalizada === "fijo") {
      return Number(colab.comision_personalizada) || 0;
    } else if (colab.comision_tipo_personalizada === "porcentaje") {
      const factorPersonalizado = normalizeFactor(colab.comision_personalizada);
      return factorPersonalizado !== null ? comisionBruta * factorPersonalizado : 0;
    }
  }

  const nivelId = getColaboradorNivelId(colab);
  const nivel = niveles.find((n) => n.id === nivelId);
  if (!nivel) return comisionBruta * 0.5; // Fallback 50%

  if (sector === "TELEFONIA") {
    const factorTelefonia = normalizeFactor(
      colab.pct_telefonia ?? nivel.pct_telefonia ?? nivel.pct_colaborador_default
    );
    if (factorTelefonia !== null) return comisionBruta * factorTelefonia;
  } else if (sector === "ENERGIA") {
    const factorEnergia = normalizeFactor(
      colab.pct_energia ?? nivel.pct_energia ?? nivel.pct_colaborador_default
    );
    if (factorEnergia !== null) return comisionBruta * factorEnergia;
  } else if (sector === "SEGURIDAD") {
    const fijoSeguridad = colab.fijo_seguridad ?? nivel.fijo_seguridad;
    if (fijoSeguridad !== undefined && fijoSeguridad !== null) {
      return Number(fijoSeguridad) || 0;
    }
  }

  if (nivel.comision_tipo === "fijo") {
    return Number(nivel.comision_valor) || 0;
  }

  if (nivel.comision_tipo === "porcentaje") {
    const factorNivel = normalizeFactor(nivel.comision_valor);
    if (factorNivel !== null) {
      return comisionBruta * factorNivel;
    }
  }

  return comisionBruta * 0.5;
}

// Resuelve { fija, porcentaje } para un producto/venta, salvando el hueco
// entre dos modelos de datos reales que coexisten hoy:
// - Local (ProductoModal.jsx, soporta comision_tipo "mixto"): guarda
//   comision_fija y comision_porcentaje por separado, para poder tener las
//   dos a la vez.
// - Supabase (productos_cv): solo tiene comision_valor, un único número — no
//   hay columna comision_fija ni comision_porcentaje en el esquema real, así
//   que un producto cargado desde Supabase nunca las tiene.
// Se prioriza el modelo local (si existe, cubre "mixto"); si no, se deriva
// fija/porcentaje a partir de comision_valor según comision_tipo.
function resolveComisionFijaYPorcentaje(producto, venta) {
  if (venta?.comision_fija !== undefined || venta?.comision_porcentaje !== undefined) {
    return { fija: venta.comision_fija ?? 0, porcentaje: venta.comision_porcentaje ?? 0 };
  }
  if (producto.comision_fija !== undefined || producto.comision_porcentaje !== undefined) {
    return { fija: producto.comision_fija ?? 0, porcentaje: producto.comision_porcentaje ?? 0 };
  }

  const tipo = venta?.comision_tipo || producto.comision_tipo;
  const valor = Number(venta?.comision_valor ?? producto.comision_valor) || 0;
  if (tipo === "fijo") return { fija: valor, porcentaje: 0 };
  if (tipo === "porcentaje") return { fija: 0, porcentaje: valor };
  return { fija: 0, porcentaje: 0 };
}

// Obtener comisión base del producto (fija o porcentaje)
export function getProductoComisionBase(producto, pvp, venta) {
  if (!producto) return 0;

  const tipo = venta?.comision_tipo || producto.comision_tipo;
  // comision_base en venta ya viene “congelada” desde el alta/edición de la venta.
  const congelada = venta?.comision_base;

  // Si hay valor congelado y el tipo es fijo, úsalo tal cual.
  if (tipo === "fijo" && congelada !== undefined && congelada !== null) {
    return Number(congelada) || 0;
  }

  // Si hay valor congelado y el tipo es porcentaje, considéralo porcentaje y aplica sobre pvp/base.
  if (tipo === "porcentaje" && congelada !== undefined && congelada !== null) {
    return (Number(congelada) / 100) * (Number(pvp) || 0);
  }

  // Fallback a los campos originales del producto o la venta (porcentaje/fijo/mixto)
  const { fija, porcentaje } = resolveComisionFijaYPorcentaje(producto, venta);
  let total = 0;
  if (tipo === "fijo") {
    total = Number(fija) || 0;
  } else if (tipo === "porcentaje") {
    total = (Number(porcentaje) / 100) * (Number(pvp) || 0);
  } else if (tipo === "mixto") {
    total = Number(fija) + ((Number(porcentaje) / 100) * (Number(pvp) || 0));
  }
  return total;
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
        r.activo !== false &&
        r.operador_id === operador_id &&
        (r.producto_id == null || r.producto_id === producto_id) &&
        // nivel_id es la columna real de reglas_cv (antes se comparaba
        // r.nivel, que nunca existe en ninguna regla real — ninguna regla
        // llegaba a aplicarse nunca). Sin nivel_id asignado, la regla aplica
        // a cualquier nivel.
        (r.nivel_id == null || r.nivel_id === nivel),
    )
    .sort((a, b) => (b.prioridad || 0) - (a.prioridad || 0))
    .reduce(
      (acc, r) =>
        acc +
        // tipo real (CHECK de reglas_cv): 'porcentaje' | 'fija' | 'escalonada' | 'bonus'.
        // "escalonada"/"bonus" se tratan como importe fijo por ahora (no hay
        // lógica de tramos implementada); antes se comparaba contra "%", un
        // valor que el tipo real nunca tiene.
        (r.tipo === "porcentaje"
          ? (r.pct_sobre === "ComisiónOperador" ? refComOper : refBase) *
            Number(r.valor || 0)
          : Number(r.valor || 0)),
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

  // Comisión base del producto (fija o porcentaje) usando valores congelados de la venta si existen
  let comBase = getProductoComisionBase(producto, base, venta);

  // Evaluar reglas adicionales
  const extra = evaluateRules({
    reglas,
    operador_id: operador.id,
    producto_id: producto.id,
    nivel: getColaboradorNivelId(colab),
    refBase: base,
    refComOper: comBase,
  });

  const comBruta = Math.max(0, comBase + extra);

  // Parte del colaborador (fija o porcentaje, SIEMPRE sobre la comisión base)
  const parteColab = getColaboradorComision(colab, niveles, comBase, producto);

  // Calcular IRPF y neto
  const irpf_pct = getIrpfPct(colab, venta.fecha);
  const irpf = parteColab * irpf_pct;
  const netoColab = Math.max(0, parteColab - irpf);

  const costeEmpresa = netoColab;
  const margenEmpresa = Math.max(0, comBruta - costeEmpresa);

  // Para backward compatibility, calcular pctColab aproximado
  const pctColab = comBase > 0 ? parteColab / comBase : 0;

  return {
    ok: true,
    detalle: {
      zona,
      operador,
      producto,
      colaborador: colab,
      impuesto_pct,
      base,
      comBase,
      extra,
      comBruta,
      pctColab,
      parteColab,
      irpf_pct,
      irpf,
      netoColab,
      costeEmpresa,
      margenEmpresa,
      comision_fuera_vigencia: Boolean(venta.comision_fuera_vigencia),
      comision_vigencia_aplicada_desde: venta.comision_vigencia_aplicada_desde || producto.comision_vigencia_desde || null,
      comision_vigencia_aplicada_hasta: venta.comision_vigencia_aplicada_hasta || producto.comision_vigencia_hasta || null,
      _debug: {
        comision_producto_tipo: producto.comision_tipo,
        comision_producto_valor: producto.comision_valor,
        // Misma condición que el override real (líneas 73-76): un
        // colaborador sin el campo (undefined, típico de altas antiguas)
        // salía marcado aquí como "personalizada" solo por comprobar
        // !== null sin excluir undefined — desviaba el diagnóstico en
        // soporte, aunque no afectaba al cálculo real.
        comision_colaborador_es_personalizada:
          colab.comision_personalizada !== null && colab.comision_personalizada !== undefined,
        comision_colaborador_tipo:
          colab.comision_tipo_personalizada ||
          niveles.find((n) => n.id === getColaboradorNivelId(colab))?.comision_tipo,
      },
    },
  };
}

// Ejemplos de cálculo disponibles en la documentación técnica. Los comentarios aquí deben ser solo sintaxis válida de JavaScript.