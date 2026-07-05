// src/utils/importValidation.js
// Funciones puras para validación de datos de importación

// =============================================================================
// MAPEO DE CAMPOS EXCEL → CAMPOS INTERNOS DE LA APP
// =============================================================================
// Cada clave es el nombre interno del campo en la app/ventaBase.
// El array de valores son los posibles encabezados del Excel que se reconocen.
// La función autoguessMapping usa esto para auto-detectar el mapeo.
//
// Campos con columna directa en ventas_cv (se guardan en Supabase directamente):
//   fecha, cliente, cif, colaborador_id, zona_id, producto_id, operador_id,
//   pvp, cantidad, estado, numeracion, telefono_fijo, telefono_movil,
//   observaciones, documento (mes/año también tienen columna propia, pero
//   además los recalcula el trigger de BD a partir de fecha)
//
// Todo lo demás (IRPF, SECTOR, MARGEN, COMISION, etc.) va al campo extras JSONB
// automáticamente vía la opción guardarExtras=true del importador.

export const MAPEO_CAMPOS = {
  // ── Fechas ────────────────────────────────────────────────────────────────
  // Excel: "FECHA ENVIO" → norm → "fecha_envio" → coincide con "FECHA_ENVIO"
  fecha: ["FECHA", "fecha", "date", "FECHA_ALTA", "FECHA_ENVIO", "FECHA ENVIO", "FECHA_ACTIVACION"],
  mes:   ["MES", "mes", "month"],
  año:   ["AÑO", "año", "year", "YEAR", "ANO"],

  // ── Cliente / Identificación ───────────────────────────────────────────────
  cliente: ["CLIENTE", "cliente", "razon_social", "nombre_cliente", "company"],
  cif:     ["CIF/DNI", "cif", "nif", "dni", "vat", "tax_id", "CIF_DNI"],

  // ── Relaciones (se resuelven a IDs internos) ───────────────────────────────
  colaborador_id: ["COLABORADOR", "colaborador", "comercial", "agente", "vendedor"],
  zona_id:        ["ZONA", "zona", "region", "territory", "zona_geografica"],
  producto_id:    ["PRODUCTO", "producto", "product", "servicio", "tarifa"],
  operador_id:    ["OPERADOR", "operador", "operator", "compania", "proveedor_principal"],

  // ── Valores económicos de la venta ─────────────────────────────────────────
  pvp:      ["PVP", "pvp", "precio", "price"],
  cantidad: ["CANTIDAD", "cantidad", "qty", "units", "unidades"],
  estado:   ["ESTADO", "estado", "status", "state"],

  // ── Campos con columna directa en ventas_cv ────────────────────────────────
  numeracion:    ["NUMERACION", "numeracion", "numero", "NUMERACIÓN", "num_linea", "num_contrato"],
  telefono_fijo: ["FIJO", "fijo", "telefono_fijo", "TELEFONO FIJO", "TELEFONO_FIJO", "tel_fijo", "fixed_phone"],
  telefono_movil:["MOVIL", "movil", "telefono_movil", "TELEFONO MOVIL", "TELEFONO_MOVIL", "MÓVIL", "tel_movil", "mobile"],
  observaciones: ["OBSERVACIONES", "observaciones", "notas", "notes", "remarks", "comentarios"],

  // ── Referencia de contrato en papel (columna propia en ventas_cv, distinta
  //    de numeracion) ──────────────────────────────────────────────────────
  documento: ["DOCUMENTO", "documento", "doc", "num_doc", "tipo_doc"],

  // ── Campos financieros/calculados (van a extras JSONB, se listan aquí solo
  //    para que la UI del importador los muestre y permita re-mapear si procede)
  comision_base:  ["COMISION BASE", "COMISION_BASE", "comision_base"],
  escala:         ["ESCALA", "escala", "scale"],
  margen:         ["MARGEN", "margen", "margin"],
  comision:       ["COMISION", "comision", "commission"],
  retrocomision:  ["RETROCOMISION", "retrocomision", "retro"],
  factura:        ["FACTURA", "factura", "invoice", "num_factura"],
  importe:        ["IMPORTE", "importe", "amount"],
  irpf:           ["IRPF", "irpf", "irpf_retencion"],
  irpf1:          ["IRPF1", "irpf1"],
  impuesto:       ["IMPUESTO", "impuesto"],
  impuestos:      ["IMPUESTOS", "impuestos", "iva", "tax"],
  total:          ["TOTAL", "total", "total_factura"],
  beneficio_previsto: ["BENEFICIO PREVISTO", "BENEFICIO_PREVISTO", "beneficio"],
  pagos:          ["PAGOS", "pagos", "payments"],
  fecha_pago:     ["FECHA PAGO", "FECHA_PAGO", "fecha_pago", "payment_date"],
  sector:         ["SECTOR", "sector"],
  telefonia:      ["TELEFONIA", "telefonia", "TELEFONÍA"],
  seguridad:      ["SEGURIDAD", "seguridad"],
  energia:        ["ENERGIA", "energia", "ENERGÍA"],
  fecha_baja:     ["FECHA DE BAJA", "FECHA_BAJA", "fecha_baja", "baja_date"],
  fecha_activacion:["FECHA ACTIVACION", "FECHA_ACTIVACION", "activacion"],
  tipo:           ["TIPO", "tipo", "type"],
  operador_donante:["OPERADOR DONANTE", "OPERADOR_DONANTE", "donante"],
  id_pedido:      ["ID PEDIDO", "ID_PEDIDO", "id_pedido", "order_id"],
  id_cliente:     ["ID CLIENTE", "ID_CLIENTE", "id_cliente", "customer_id"],
  proveedor:      ["PROVEEDOR", "proveedor", "provider", "supplier"],
};

// =============================================================================
// CAMPOS QUE VAN DIRECTAMENTE A LA TABLA PRINCIPAL EN SUPABASE
// =============================================================================
export const CAMPOS_TABLA_PRINCIPAL = [
  "fecha",
  "mes",
  "año",
  "cliente",
  "cif",
  "colaborador_id",
  "zona_id",
  "producto_id",
  "operador_id",
  "pvp",
  "cantidad",
  "estado",
  "numeracion",
  "telefono_fijo",
  "telefono_movil",
  "observaciones",
];

/**
 * Parsea un número desde diferentes formatos
 */
export function parseNumber(value) {
  if (typeof value === "number") return value;
  if (value == null || value === "") return NaN;

  const s = String(value).trim().replace(/\s/g, "");
  const comma = s.includes(",");
  const dot = s.includes(".");
  let norm = s;

  if (comma && dot) {
    if (s.lastIndexOf(",") > s.lastIndexOf(".")) {
      // 1.234,56 → quita puntos, cambia coma por punto
      norm = s.replace(/\./g, "").replace(",", ".");
    } else {
      // 1,234.56 → quita comas
      norm = s.replace(/,/g, "");
    }
  } else if (comma && !dot) {
    norm = s.replace(",", ".");
  }

  const n = Number(norm);
  return Number.isFinite(n) ? n : NaN;
}

/**
 * Parsea una fecha desde diferentes formatos a YYYY-MM-DD
 */
export function parseDate(value) {
  if (!value) return null;
  const s = String(value).trim();

  // Si ya es formato ISO YYYY-MM-DD
  if (s.match(/^\d{4}-\d{2}-\d{2}$/)) return s;

  // Formato DD/MM/YYYY
  if (s.match(/^\d{1,2}\/\d{1,2}\/\d{4}$/)) {
    const [d, m, y] = s.split("/");
    return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }

  // Formato DD-MM-YYYY
  if (s.match(/^\d{1,2}-\d{1,2}-\d{4}$/)) {
    const [d, m, y] = s.split("-");
    return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }

  // Intenta parsear como fecha directamente
  const date = new Date(s);
  if (!isNaN(date.getTime())) {
    return date.toISOString().slice(0, 10);
  }

  return null;
}

// Normalización de nombres para búsqueda case/acento-insensible: quita
// tildes, apóstrofes y pliega a mayúsculas. Única implementación — antes
// useImportGestion.js tenía su propia copia local (idéntica) y el resolveId
// de más abajo usaba raw.toLowerCase() en su lugar; como los indexadores
// reales se construyen con ESTA normalización (en mayúsculas), buscar por
// raw.toLowerCase() casi nunca coincidía con ninguna clave real — la
// previsualización de importación marcaba como "no encontrado" filas que el
// import real sí resolvía bien.
export function normalizeNameSearch(name) {
  if (!name || typeof name !== "string") return "";
  return name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/['`´']/g, "")
    .trim()
    .toUpperCase();
}

/**
 * Resuelve un valor a ID usando indexadores (byId exacto, luego byName y
 * byCodigo normalizados con normalizeNameSearch) — mismo criterio que usa
 * la importación real en useImportGestion.js.
 */
export function resolveId(value, indexer, resolverNombres = true) {
  if (!value) return null;
  const raw = String(value).trim();

  // Si ya es ID exacta
  if (indexer.byId && indexer.byId[raw]) return raw;

  if (!resolverNombres) return null;

  const normalizedValue = normalizeNameSearch(raw);

  if (indexer.byName && indexer.byName[normalizedValue]) {
    return indexer.byName[normalizedValue].id;
  }

  if (indexer.byCodigo && indexer.byCodigo[normalizedValue]) {
    return indexer.byCodigo[normalizedValue].id;
  }

  return null;
}

/**
 * Autodetección inteligente de columnas
 * Normaliza tanto los encabezados del Excel como los nombres de referencia
 * del MAPEO_CAMPOS (espacios → guiones bajos, sin tildes, minúsculas) y
 * busca la mejor coincidencia por puntuación.
 */
export function autoguessMapping(headers) {
  const guess = {};
  const norm = (s) => s.toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")  // quitar tildes
    .replace(/[^a-z0-9]/g, "_");                        // no alfanum → _

  // Para cada campo interno, buscar la mejor coincidencia en headers
  Object.keys(MAPEO_CAMPOS).forEach((campoInterno) => {
    const posiblesNombres = MAPEO_CAMPOS[campoInterno];
    let mejorCoincidencia = null;
    let maxScore = 0;

    headers.forEach((header) => {
      const headerNorm = norm(header);
      posiblesNombres.forEach((posible) => {
        const posibleNorm = norm(posible);
        let score = 0;
        if (headerNorm === posibleNorm) score = 100;
        else if (headerNorm.includes(posibleNorm)) score = 80;
        else if (posibleNorm.includes(headerNorm)) score = 70;
        else if (headerNorm.includes(posibleNorm.slice(0, 4))) score = 50;

        if (score > maxScore) {
          maxScore = score;
          mejorCoincidencia = header;
        }
      });
    });

    if (mejorCoincidencia && maxScore >= 50) {
      guess[campoInterno] = mejorCoincidencia;
    }
  });

  // Asegurar campos mínimos si no se detectaron
  if (!guess.fecha && headers.length > 0) guess.fecha = headers[0];
  if (!guess.cliente && headers.length > 1) guess.cliente = headers[1];
  if (!guess.estado) guess.estado = "Confirmada";

  return guess;
}

/**
 * Valida una fila de datos
 */
export function validateRow(row, mapping, options = {}) {
  const {
    modoAutomatico = false,
    indexers = {},
    resolverNombres = true,
  } = options;

  const errors = [];
  const warnings = [];
  const get = (key) => row[mapping[key]];

  // Validaciones mínimas
  const fecha = get("fecha");
  const cliente = get("cliente");
  const colaborador = get("colaborador_id");

  if (!fecha) errors.push("fecha es requerida");
  if (!cliente) errors.push("cliente es requerido");
  if (!colaborador) errors.push("colaborador es requerido");

  // Validar fecha
  if (fecha && !parseDate(fecha)) {
    errors.push("formato de fecha inválido");
  }

  // Validaciones según modo
  if (!modoAutomatico) {
    // Modo normal: validar que las entidades existan
    if (
      colaborador &&
      !resolveId(colaborador, indexers.colaboradores, resolverNombres)
    ) {
      errors.push("colaborador no encontrado");
    }

    const producto = get("producto_id");
    if (producto && !resolveId(producto, indexers.productos, resolverNombres)) {
      errors.push("producto no encontrado");
    }

    const zona = get("zona_id");
    if (zona && !resolveId(zona, indexers.zonas, resolverNombres)) {
      errors.push("zona no encontrada");
    }
  }

  // Validar PVP. No se acepta "importe" como sustituto (en algunos formatos
  // de Excel esa columna es el importe de comisión, no un precio — usarla
  // como PVP corrompía el cálculo de comisión). Tampoco hay valor por
  // defecto: una fila sin PVP real se rechaza al importar, en cualquier
  // modo, así que aquí se marca como error siempre, no solo en modo manual.
  const pvp = parseNumber(get("pvp"));
  if (!Number.isFinite(pvp)) {
    errors.push("PVP es requerido (no se admite un valor por defecto ni se infiere de otra columna)");
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    hasDefaultValues: warnings.length > 0,
  };
}

/**
 * Genera un ID único para ventas
 */
export function generateUniqueId(prefix = "v", index = 0) {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 9);
  return `${prefix}_${timestamp}_${index}_${random}`;
}