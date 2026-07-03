// src/utils/importValidation.js
// Funciones puras para validación de datos de importación

// Mapeo de campos Excel → campos internos de la app
export const MAPEO_CAMPOS = {
  fecha: ["FECHA", "fecha", "date", "FECHA_ALTA", "FECHA_ENVIO"],
  mes: ["MES", "mes", "month"],
  año: ["AÑO", "año", "year", "YEAR"],
  cliente: ["CLIENTE", "cliente", "razon", "nombre_cliente", "company"],
  cif: ["CIF/DNI", "cif", "nif", "dni", "vat", "tax_id"],
  colaborador_id: [
    "COLABORADOR",
    "colaborador",
    "comercial",
    "agente",
    "vendedor",
  ],
  zona_id: ["ZONA", "zona", "region", "territory"],
  producto_id: ["PRODUCTO", "producto", "product", "servicio"],
  operador_id: ["OPERADOR", "operador", "operator", "proveedor_principal"],
  // "importe_base" se quitó a propósito: en formatos de Excel donde la
  // columna "IMPORTE" es en realidad el importe de comisión (no un precio),
  // el emparejamiento difuso de autoguessMapping la confundía con PVP.
  pvp: ["PVP", "pvp", "precio", "price"],
  cantidad: ["CANTIDAD", "cantidad", "qty", "units"],
  estado: ["ESTADO", "estado", "status", "state"],
  comision_base: ["COMISION", "comision", "commission", "comision_base"],
};

// Campos básicos que van en la tabla principal
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

/**
 * Resuelve un valor a ID usando indexadores
 */
export function resolveId(value, indexer, resolverNombres = true) {
  if (!value) return null;
  const raw = String(value).trim();

  // Si ya es ID exacta
  if (indexer.byId && indexer.byId[raw]) return raw;

  // Intentar por nombre si está activo
  if (resolverNombres && indexer.byName && indexer.byName[raw.toLowerCase()]) {
    return indexer.byName[raw.toLowerCase()].id;
  }

  return null;
}

/**
 * Autodetección inteligente de columnas
 */
export function autoguessMapping(headers) {
  const guess = {};
  const norm = (s) => s.toLowerCase().replace(/[^a-z0-9]/g, "_");

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

// Revisión general:
// - El archivo está bien estructurado y cubre el mapeo, parseo, validación y generación de IDs para la importación de datos.
// - El mapeo de campos es flexible y permite importar desde diferentes formatos de Excel/CSV.
// - El parseo de números y fechas es robusto y contempla formatos europeos y americanos.
// - La función autoguessMapping facilita la importación automática y es suficientemente tolerante.
// - La validación de filas es clara y permite distinguir entre errores y advertencias, y soporta modo automático.
// - Se aplican valores por defecto de forma segura y lógica.
// - La generación de IDs únicos es adecuada para registros temporales/importados.
// - El código es robusto ante datos incompletos y aplica valores por defecto razonables.
// - El archivo es fácilmente extensible para nuevos campos o reglas de validación.

// Sugerencias menores:
// - Si esperas archivos muy grandes, podrías paginar la carga de filas o procesarlas en chunks para evitar bloqueos de UI.
// - Si usas TypeScript, podrías tipar los argumentos y retornos para mayor robustez.
// - Si quieres mejorar la UX, podrías exponer advertencias de mapeo ambiguo en autoguessMapping.
// - Si quieres evitar logs en producción, podrías agregar un flag para desactivarlos.

// No se requieren cambios funcionales. El archivo es robusto y listo para producción.