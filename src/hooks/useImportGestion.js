import { useState, useEffect, useMemo, useCallback } from "react";
import { useData } from "../context/AppContexts";
import {
  autoguessMapping,
  validateRow,
  applyDefaults,
  parseDate,
  parseNumber,
} from "../utils/importValidation";

// =================== CONFIGURACIÓN Y CONSTANTES ===================

// Detecta separador probable en CSV
const detectSeparator = (line) => {
  const counts = [",", ";", "\t"].map((s) => [
    s,
    (line.match(new RegExp(`\\${s}`, "g")) || []).length,
  ]);
  counts.sort((a, b) => b[1] - a[1]);
  return counts[0][1] > 0 ? counts[0][0] : ",";
};

// 🎯 MEJORA: Normalización mejorada para búsquedas case-insensitive
const normalizeNameSearch = (name) => {
  if (!name || typeof name !== "string") return "";
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/['`´']/g, "")
    .trim()
    .toUpperCase();
};

// 🎯 CORRECCIÓN CRÍTICA: Generador de IDs únicos sin duplicados
let globalIdCounter = Date.now() % 10000; // Contador único basado en timestamp

const generateReadableId = (prefix, name, existingIds = new Set()) => {
  // Crear base legible del nombre
  const nameBase = name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9\s]/g, "")
    .trim()
    .replace(/\s+/g, '')
    .toLowerCase()
    .slice(0, 8); // Máximo 8 caracteres para dejar espacio

  // SOLUCIÓN: Timestamp completo + contador incremental para garantizar unicidad
  globalIdCounter += 1;
  const now = Date.now();
  const uniqueSuffix = `${now.toString().slice(-8)}_${globalIdCounter.toString().padStart(4, '0')}`;
  
  let candidateId = `${prefix}_${nameBase}_${uniqueSuffix}`;
  
  // Verificación adicional contra existingIds
  let attempt = 1;
  while (existingIds.has(candidateId)) {
    candidateId = `${prefix}_${nameBase}_${uniqueSuffix}_${attempt}`;
    attempt++;
    if (attempt > 50) {
      // Fallback extremo para casos raros
      candidateId = `${prefix}_${nameBase}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
      break;
    }
  }
  
  // Registrar el nuevo ID
  existingIds.add(candidateId);
  
  // Log para debug (opcional)
  console.log(`✅ ID único generado: ${candidateId}`);
  
  return candidateId;
};

// Helper para formatear fecha
const formatDate = (dateStr) => {
  if (!dateStr) return "";
  try {
    if (dateStr.match(/^\d{2}\/\d{2}\/\d{4}$/)) return dateStr;
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  } catch {
    return dateStr;
  }
};

/**
 * Hook CORREGIDO para gestión completa de importación
 * 🎯 CORRECCIÓN PRINCIPAL: IDs legibles y únicos + Sin warnings ESLint
 * Mantiene toda la funcionalidad existente pero con IDs comprensibles y únicos
 */
export function useImportGestion({
  modulo = "ventas",
} = {}) {
  // =================== CONTEXTO Y DATOS ===================

  const { 
    data, 
    setVentas, 
    setProductos, 
    setOperadores, 
    setColaboradores, 
    setZonas, 
  } = useData();

  // 🎯 MEJORA: Memoizar datos para evitar warnings de ESLint
  const productos = useMemo(() => 
    Array.isArray(data?.productos) ? data.productos : [], 
    [data?.productos]
  );
  
  const operadores = useMemo(() => 
    Array.isArray(data?.operadores) ? data.operadores : [], 
    [data?.operadores]
  );
  
  const colaboradores = useMemo(() => 
    Array.isArray(data?.colaboradores) ? data.colaboradores : [], 
    [data?.colaboradores]
  );
  
  const zonas = useMemo(() => 
    Array.isArray(data?.zonas) ? data.zonas : [], 
    [data?.zonas]
  );

  const autoCreacionDisponible = useMemo(() => !!(
    setProductos &&
    setOperadores &&
    setColaboradores &&
    setZonas
  ), [setProductos, setOperadores, setColaboradores, setZonas]);

  // =================== ESTADO CONSOLIDADO ===================

  const [state, setState] = useState({
    // 📥 IMPORTACIÓN
    headers: [],
    rows: [],
    mapping: {},
    resumenImportacion: null,
    isLoading: false,
    isImporting: false,

    // ⚙️ CONFIGURACIONES
    crearAutomaticamente: true,
    resolverNombres: true,
    guardarExtras: true,

    // 🗂️ CAMPOS PERSONALIZADOS
    customFields: [],
    customFieldsLoaded: false,

    // 📊 EXPORTACIÓN
    isExporting: false,
  });

  // =================== 🗂️ GESTIÓN DE CAMPOS PERSONALIZADOS ===================

  const loadCustomFields = useCallback(
    (targetModulo = modulo) => {
      try {
        const raw = localStorage.getItem("customFields");
        const allFields = raw ? JSON.parse(raw) : [];
        const moduleFields = allFields.filter(
          (f) => f.modulo === targetModulo && f.activo
        );

        setState((prev) => ({
          ...prev,
          customFields: moduleFields,
          customFieldsLoaded: true,
        }));

        return moduleFields;
      } catch {
        setState((prev) => ({
          ...prev,
          customFields: [],
          customFieldsLoaded: true,
        }));
        return [];
      }
    },
    [modulo]
  );

  useEffect(() => {
    loadCustomFields();
  }, [loadCustomFields]);

  const saveCustomFields = useCallback(
    (fields) => {
      try {
        const raw = localStorage.getItem("customFields");
        const allFields = raw ? JSON.parse(raw) : [];

        const otherModuleFields = allFields.filter((f) => f.modulo !== modulo);
        const newFields = [...otherModuleFields, ...fields];

        localStorage.setItem("customFields", JSON.stringify(newFields));

        setState((prev) => ({
          ...prev,
          customFields: fields.filter((f) => f.activo),
        }));

        return true;
      } catch {
        return false;
      }
    },
    [modulo]
  );

  // =================== 📊 DATOS MEMOIZADOS MEJORADOS ===================

  const indexers = useMemo(
    () => {
      // 🎯 MEJORA: Seguimiento de IDs existentes para evitar duplicados
      const allExistingIds = new Set([
        ...productos.map(p => p.id),
        ...colaboradores.map(c => c.id),
        ...zonas.map(z => z.id),
        ...operadores.map(o => o.id)
      ]);

      return {
        productos: {
          byId: Object.fromEntries(productos.map((p) => [p.id, p])),
          byName: Object.fromEntries(
            productos.map((p) => [normalizeNameSearch(p.nombre), p])
          ),
        },
        zonas: {
          byId: Object.fromEntries(zonas.map((z) => [z.id, z])),
          byName: Object.fromEntries(
            zonas.map((z) => [normalizeNameSearch(z.nombre), z])
          ),
        },
        colaboradores: {
          byId: Object.fromEntries(colaboradores.map((c) => [c.id, c])),
          byName: Object.fromEntries(
            colaboradores.map((c) => [normalizeNameSearch(c.nombre), c])
          ),
        },
        operadores: {
          byId: Object.fromEntries(operadores.map((o) => [o.id, o])),
          byName: Object.fromEntries(
            operadores.map((o) => [normalizeNameSearch(o.nombre || ""), o])
          ),
          byCodigo: Object.fromEntries(
            operadores.map((o) => [normalizeNameSearch(o.codigo || ""), o])
          ),
        },
        existingIds: allExistingIds, // 🎯 NUEVO: Para evitar duplicados
      };
    },
    [productos, operadores, colaboradores, zonas]
  );

  // Estadísticas de validación
  const validationStats = useMemo(() => {
    const { rows, mapping, crearAutomaticamente, resolverNombres } = state;

    if (!rows.length || !Object.keys(mapping).length) {
      return { total: 0, valid: 0, invalid: 0, warnings: 0 };
    }

    let valid = 0;
    let invalid = 0;
    let warnings = 0;

    rows.forEach((row) => {
      const result = validateRow(row, mapping, {
        modoAutomatico: crearAutomaticamente,
        indexers,
        resolverNombres: resolverNombres,
      });

      if (result.isValid) {
        valid++;
        if (result.warnings?.length) warnings++;
      } else {
        invalid++;
      }
    });

    return { total: rows.length, valid, invalid, warnings };
  }, [state, indexers]);

  // =================== 📥 FUNCIONES DE CARGA DE ARCHIVOS ===================

  const loadFile = useCallback(async (file) => {
    if (!file) throw new Error("No se proporcionó archivo");

    setState((prev) => ({ ...prev, isLoading: true }));

    try {
      const ext = file.name.toLowerCase().split(".").pop();
      const buffer = await file.arrayBuffer();
      let headers = [];
      let rows = [];

      if (ext === "csv") {
        let text;
        try {
          text = new TextDecoder("utf-8").decode(new Uint8Array(buffer));
        } catch {
          try {
            text = new TextDecoder("iso-8859-1").decode(new Uint8Array(buffer));
          } catch {
            text = new TextDecoder("windows-1252").decode(
              new Uint8Array(buffer)
            );
          }
        }

        const lines = text
          .split(/\r?\n/)
          .filter((l) => l.trim().length > 0);
        if (lines.length === 0) throw new Error("Archivo CSV vacío");

        const separator = detectSeparator(lines[0]);
        headers = lines[0]
          .split(separator)
          .map((h) => h.trim().replace(/["\r\n]/g, ""));

        rows = lines
          .slice(1)
          .map((line) => {
            try {
              const columns = line.split(separator);
              const obj = {};
              headers.forEach((header, colIndex) => {
                const value = (columns[colIndex] ?? "")
                  .trim()
                  .replace(/["\r\n]/g, "");
                obj[header] = value;
              });
              return obj;
            } catch {
              return null;
            }
          })
          .filter(Boolean);
      } else if (["xlsx", "xls"].includes(ext)) {
        const ExcelJS = (await import("exceljs")).default;
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(buffer);

        const worksheet = workbook.worksheets[0];
        if (!worksheet)
          throw new Error("No se encontró ninguna hoja en el archivo Excel");

        worksheet.eachRow((row, rowNumber) => {
          try {
            const values = row.values.slice(1);

            if (rowNumber === 1) {
              headers = values.map((value) =>
                String(value ?? "").trim().replace(/[\r\n]/g, "")
              );
            } else {
              const obj = {};
              headers.forEach((header, headerIndex) => {
                let cellValue = values[headerIndex] ?? "";

                if (cellValue instanceof Date) {
                  cellValue = cellValue.toISOString().slice(0, 10);
                } else if (
                  typeof cellValue === "object" &&
                  cellValue.result !== undefined
                ) {
                  cellValue = cellValue.result;
                } else if (typeof cellValue === "number") {
                  cellValue = cellValue.toString();
                }

                obj[header] = String(cellValue).trim();
              });

              if (Object.values(obj).some((val) => val.length > 0)) {
                rows.push(obj);
              }
            }
          } catch {
            // Ignorar filas con errores de parsing
          }
        });
      } else {
        throw new Error(
          "Formato de archivo no soportado. Use .xlsx, .xls o .csv"
        );
      }

      if (!headers.length) throw new Error("No se encontraron encabezados");
      if (!rows.length) throw new Error("No se encontraron datos");

      const autoMapping = autoguessMapping(headers);

      setState((prev) => ({
        ...prev,
        headers,
        rows,
        mapping: autoMapping,
        resumenImportacion: null,
      }));

      return { headers, rows, mapping: autoMapping };
    } finally {
      setState((prev) => ({ ...prev, isLoading: false }));
    }
  }, []);

  // =================== 🔍 FUNCIONES DE VALIDACIÓN ===================

  const resolveId = useCallback((value, indexer) => {
    if (!value) return null;
    const raw = String(value).trim();

    if (indexer.byId?.[raw]) return raw;

    if (indexer.byName) {
      const normalizedValue = normalizeNameSearch(raw);
      const found = indexer.byName[normalizedValue];
      if (found) return found.id;
    }

    if (indexer.byCodigo) {
      const normalizedValue = normalizeNameSearch(raw);
      const found = indexer.byCodigo[normalizedValue];
      if (found) return found.id;
    }

    return null;
  }, []);

  const validateSingleRow = useCallback(
    (rowIndex) => {
      if (!state.rows[rowIndex]) return null;

      return validateRow(state.rows[rowIndex], state.mapping, {
        modoAutomatico: state.crearAutomaticamente,
        indexers,
        resolverNombres: state.resolverNombres,
      });
    },
    [state, indexers]
  );

  // =================== 📤 IMPORTACIÓN CORREGIDA CON IDS LEGIBLES ===================

  const importarDatos = useCallback(
    async (modo = "normal") => {
      if (!state.rows.length) throw new Error("No hay datos para importar");

      setState((prev) => ({ ...prev, isImporting: true, isLoading: true }));

      try {
        const nuevasVentas = [];
        const erroresDetallados = [];
        let rechazadas = 0;

        // 🎯 MEJORA: Buffers con IDs legibles y prevención de duplicados
        const productosToCreateByName = {};
        const zonasToCreateByName = {};
        const colaboradoresToCreateByName = {};
        const operadoresToCreateByName = {};

        const productosNuevos = new Set();
        const zonasNuevas = new Set();
        const colaboradoresNuevos = new Set();
        const operadoresNuevos = new Set();

        // 🎯 NUEVA: Helper para crear entidad con ID legible
        const createEntityWithReadableId = (type, name, additionalData = {}) => {
          const prefixMap = {
            productos: 'prod',
            colaboradores: 'colab',
            zonas: 'zona',
            operadores: 'oper'
          };
          
          const newId = generateReadableId(
            prefixMap[type], 
            name, 
            indexers.existingIds
          );
          
          const baseData = {
            id: newId,
            nombre: name.trim(),
            activo: true,
          };

          // Agregar datos específicos por tipo
          switch(type) {
            case 'colaboradores':
              return {
                ...baseData,
                nivelId: 'NIVEL_COLABORADOR',
                pct_colaborador_default: 0.15,
                tipo_fiscal: 'Autónomo',
                irpf_retencion: 'Exento',
                ...additionalData
              };
            case 'productos':
              return {
                ...baseData,
                codigo: name.slice(0, 10).toUpperCase(),
                pvp: Number(additionalData.pvp || 50.0),
                comision_tipo: 'porcentaje',
                comision_valor: 15.0,
                ...additionalData
              };
            case 'zonas':
              return {
                ...baseData,
                descripcion: `Zona ${name}`,
                ...additionalData
              };
            case 'operadores':
              return {
                ...baseData,
                codigo: name.slice(0, 10).toUpperCase(),
                sector: 'telefonia',
                ...additionalData
              };
            default:
              return { ...baseData, ...additionalData };
          }
        };

        for (let index = 0; index < state.rows.length; index++) {
          const row = state.rows[index];

          const get = (key) => {
            const value = row[state.mapping[key]];
            return value ? String(value).trim() : null;
          };

          const fecha =
            parseDate(get("fecha")) || new Date().toISOString().slice(0, 10);
          const cliente = get("cliente") || `Cliente ${index + 1}`;
          const colaboradorNombre = get("colaborador_id");

          if (!cliente || !colaboradorNombre) {
            rechazadas++;
            erroresDetallados.push({
              fila: index + 1,
              errores: ["Faltan datos mínimos: cliente o colaborador"],
            });
            continue;
          }

          // -------- COLABORADOR --------
          let colaborador_id = resolveId(
            colaboradorNombre,
            indexers.colaboradores
          );
          if (!colaborador_id && state.crearAutomaticamente) {
            const norm = normalizeNameSearch(colaboradorNombre);
            if (!colaboradoresToCreateByName[norm]) {
              colaboradoresToCreateByName[norm] = createEntityWithReadableId(
                'colaboradores',
                colaboradorNombre
              );
              colaboradoresNuevos.add(colaboradorNombre);
            }
            colaborador_id = colaboradoresToCreateByName[norm].id;
          }

          // -------- ZONA --------
          const zonaNombre = get("zona_id");
          let zona_id = resolveId(zonaNombre, indexers.zonas);
          if (!zona_id && state.crearAutomaticamente && zonaNombre) {
            const norm = normalizeNameSearch(zonaNombre);
            if (!zonasToCreateByName[norm]) {
              zonasToCreateByName[norm] = createEntityWithReadableId(
                'zonas',
                zonaNombre
              );
              zonasNuevas.add(zonaNombre);
            }
            zona_id = zonasToCreateByName[norm].id;
          }
          if (!zona_id && zonas[0]?.id) {
            zona_id = zonas[0].id;
          }

          // -------- PRODUCTO --------
          const productoNombre = get("producto_id");
          let producto_id = resolveId(productoNombre, indexers.productos);
          if (!producto_id && state.crearAutomaticamente && productoNombre) {
            const norm = normalizeNameSearch(productoNombre);
            if (!productosToCreateByName[norm]) {
              productosToCreateByName[norm] = createEntityWithReadableId(
                'productos',
                productoNombre,
                {
                  pvp: Number(parseNumber(get("pvp")) || 50.0),
                }
              );
              productosNuevos.add(productoNombre);
            }
            producto_id = productosToCreateByName[norm].id;
          }
          if (!producto_id && productos[0]?.id) {
            producto_id = productos[0].id;
          }

          // -------- OPERADOR --------
          const operadorNombre = get("operador_id");
          let operador_id = resolveId(operadorNombre, indexers.operadores);
          if (!operador_id && state.crearAutomaticamente && operadorNombre) {
            const norm = normalizeNameSearch(operadorNombre);
            if (!operadoresToCreateByName[norm]) {
              operadoresToCreateByName[norm] = createEntityWithReadableId(
                'operadores',
                operadorNombre
              );
              operadoresNuevos.add(operadorNombre);
            }
            operador_id = operadoresToCreateByName[norm].id;
          }
          if (!operador_id && operadores[0]?.id) {
            operador_id = operadores[0].id;
          }

          if (!colaborador_id || !zona_id) {
            rechazadas++;
            erroresDetallados.push({
              fila: index + 1,
              errores: [
                `No se pudo resolver: ${
                  !colaborador_id ? "colaborador" : "zona"
                }`,
              ],
            });
            continue;
          }

          // 🎯 MEJORA: ID de venta también más legible
          const clienteSlug = cliente.slice(0, 8).replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
          const ventaId = generateReadableId('venta', clienteSlug, indexers.existingIds);

          const ventaBase = {
            id: ventaId,
            fecha,
            cliente: cliente.slice(0, 255),
            cif: (get("cif") || "").slice(0, 20),
            colaborador_id,
            zona_id,
            producto_id,
            operador_id,
            pvp: Number(parseNumber(get("pvp")) || 50.0),
            cantidad: Number(parseNumber(get("cantidad")) || 1),
            estado: (get("estado") || "Confirmada").slice(0, 50),
            documento: (get("documento") || "").slice(0, 100),
            numeracion: (get("numeracion") || "").slice(0, 50),
            telefono_fijo: (get("telefono_fijo") || "").slice(0, 20),
            telefono_movil: (get("telefono_movil") || "").slice(0, 20),
            observaciones: (get("observaciones") || "").slice(0, 500),
          };

          // Campos personalizados
          if (state.customFields.length > 0) {
            const customFieldsData = {};
            state.customFields.forEach((field) => {
              const fieldValue = get(`cf_${field.id}`) || get(field.nombre) || "";
              if (fieldValue) {
                customFieldsData[`cf_${field.id}`] = fieldValue;
              }
            });

            if (Object.keys(customFieldsData).length > 0) {
              ventaBase.customFields = customFieldsData;
            }
          }

          let ventaFinal = applyDefaults(ventaBase, modo === "inteligente");

          // Guardar extras
          if (state.guardarExtras) {
            const extras = {};
            Object.keys(row).forEach((key) => {
              extras[key] = row[key];
            });
            if (Object.keys(extras).length > 0) {
              ventaFinal.extras = extras;
            }
          }

          nuevasVentas.push(ventaFinal);
        }

        // 🎯 MEJORA: Auto-creación con orden correcto y mejor logging
        if (state.crearAutomaticamente && autoCreacionDisponible) {
          console.log('🎯 Creando entidades con IDs legibles:', {
            operadores: Object.keys(operadoresToCreateByName).length,
            productos: Object.keys(productosToCreateByName).length,
            zonas: Object.keys(zonasToCreateByName).length,
            colaboradores: Object.keys(colaboradoresToCreateByName).length,
          });

          if (setOperadores && Object.keys(operadoresToCreateByName).length > 0) {
            setOperadores((prev) => [
              ...Object.values(operadoresToCreateByName),
              ...prev,
            ]);
          }
          if (setProductos && Object.keys(productosToCreateByName).length > 0) {
            setProductos((prev) => [
              ...Object.values(productosToCreateByName),
              ...prev,
            ]);
          }
          if (setZonas && Object.keys(zonasToCreateByName).length > 0) {
            setZonas((prev) => [
              ...Object.values(zonasToCreateByName),
              ...prev,
            ]);
          }
          if (
            setColaboradores &&
            Object.keys(colaboradoresToCreateByName).length > 0
          ) {
            setColaboradores((prev) => [
              ...Object.values(colaboradoresToCreateByName),
              ...prev,
            ]);
          }
        }

        // Guardar ventas con delay para asegurar que las entidades se crearon
        if (nuevasVentas.length > 0 && setVentas) {
          setTimeout(() => {
            setVentas((prev) => {
              const idsNuevas = new Set(nuevasVentas.map((v) => v.id));
              const prevFiltrado = prev.filter((v) => !idsNuevas.has(v.id));
              return [...nuevasVentas, ...prevFiltrado];
            });
          }, 200);
        }

        const resumen = {
          ventasCreadas: nuevasVentas.length,
          ventasRechazadas: rechazadas,
          errores: erroresDetallados.map(
            (e) => `Fila ${e.fila}: ${e.errores.join("; ")}`
          ),
          modo,
          timestamp: new Date().toISOString(),

          // 🎯 MEJORA: Resumen detallado con ejemplos de IDs legibles
          productosCreados: productosNuevos.size,
          productosNuevos: Array.from(productosNuevos),
          productosIds: Object.values(productosToCreateByName).map(p => p.id),
          colaboradoresCreados: colaboradoresNuevos.size,
          colaboradoresNuevos: Array.from(colaboradoresNuevos),
          colaboradoresIds: Object.values(colaboradoresToCreateByName).map(c => c.id),
          zonasCreadas: zonasNuevas.size,
          zonasNuevas: Array.from(zonasNuevas),
          zonasIds: Object.values(zonasToCreateByName).map(z => z.id),
          operadoresCreados: operadoresNuevos.size,
          operadoresNuevos: Array.from(operadoresNuevos),
          operadoresIds: Object.values(operadoresToCreateByName).map(o => o.id),
        };

        setState((prev) => ({ ...prev, resumenImportacion: resumen }));

        // 🎯 NUEVO: Log de resultado para debug
        console.log('✅ Importación completada con IDs legibles:', {
          ventasCreadas: resumen.ventasCreadas,
          ejemplosIds: {
            productos: resumen.productosIds.slice(0, 3),
            colaboradores: resumen.colaboradoresIds.slice(0, 3),
            zonas: resumen.zonasIds.slice(0, 3),
          }
        });

        return resumen;
      } finally {
        setState((prev) => ({ ...prev, isImporting: false, isLoading: false }));
      }
    },
    [
      state,
      indexers,
      zonas,
      productos,
      operadores,
      setVentas,
      autoCreacionDisponible,
      setProductos,
      setZonas,
      setColaboradores,
      setOperadores,
      resolveId,
    ]
  );

  // =================== 🔄 FUNCIONES DE COMPATIBILIDAD ===================

  const importNormal = useCallback(
    () => importarDatos("normal"),
    [importarDatos]
  );
  const importInteligente = useCallback(
    () => importarDatos("inteligente"),
    [importarDatos]
  );
  const importSimplificado = useCallback(
    () => importarDatos("simplificado"),
    [importarDatos]
  );

  // =================== 📊 EXPORTACIÓN AVANZADA ===================

  const exportarDatos = useCallback(
    async (datos = [], options = {}) => {
      const {
        incluirCustomFields = true,
        formato = "csv",
        nombreArchivo = null,
      } = options;

      setState((prev) => ({ ...prev, isExporting: true }));

      try {
        const baseHeaders = [
          "Fecha",
          "Cliente",
          "CIF",
          "Producto",
          "Colaborador",
          "Zona",
          "Operador",
          "PVP",
          "Cantidad",
          "Estado",
          "Documento",
          "Numeración",
          "Teléfono Fijo",
          "Teléfono Móvil",
          "Observaciones",
        ];

        let headers = [...baseHeaders];

        if (incluirCustomFields && state.customFields.length > 0) {
          const customHeaders = state.customFields.map((f) => f.nombre);
          headers = [...headers, ...customHeaders];
        }

        const datosExport = datos.map((item) => {
          const producto = productos.find((p) => p?.id === item.producto_id);
          const colaborador = colaboradores.find(
            (c) => c?.id === item.colaborador_id
          );
          const zona = zonas.find((z) => z?.id === item.zona_id);
          const operador = operadores.find(
            (op) => op?.id === (producto?.operador_id || item.operador_id)
          );

          const row = {
            Fecha: formatDate(item.fecha),
            Cliente: item.cliente || "",
            CIF: item.cif || "",
            Producto: producto?.nombre || "",
            Colaborador: colaborador?.nombre || "",
            Zona: zona?.nombre || "",
            Operador: operador?.nombre || "",
            PVP: producto?.pvp || item.pvp || 0,
            Cantidad: item.cantidad || 1,
            Estado: item.estado || "",
            Documento: item.documento || "",
            Numeración: item.numeracion || "",
            "Teléfono Fijo": item.telefono_fijo || "",
            "Teléfono Móvil": item.telefono_movil || "",
            Observaciones: item.observaciones || "",
          };

          if (incluirCustomFields && state.customFields.length > 0) {
            state.customFields.forEach((field) => {
              row[field.nombre] =
                item.customFields?.[`cf_${field.id}`] || "";
            });
          }

          return row;
        });

        let contenido;
        let mimeType;
        let extension;

        if (formato === "csv") {
          contenido = [
            headers.join(","),
            ...datosExport.map((row) =>
              headers
                .map((header) => {
                  const value = String(row[header] || "");
                  return `"${value.replace(/"/g, '""')}"`;
                })
                .join(",")
            ),
          ].join("\n");
          mimeType = "text/csv;charset=utf-8;";
          extension = "csv";
        } else {
          throw new Error("Formato no soportado");
        }

        const timestamp = new Date()
          .toISOString()
          .slice(0, 19)
          .replace(/:/g, "-");
        const filename =
          nombreArchivo || `${modulo}_export_${timestamp}.${extension}`;

        const blob = new Blob([contenido], { type: mimeType });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);

        link.setAttribute("href", url);
        link.setAttribute("download", filename);
        link.style.visibility = "hidden";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        return { success: true, filename, records: datosExport.length };
      } finally {
        setState((prev) => ({ ...prev, isExporting: false }));
      }
    },
    [state.customFields, modulo, productos, colaboradores, zonas, operadores]
  );

  // =================== 🛠️ FUNCIONES DE CONFIGURACIÓN ===================

  const updateConfig = useCallback((key, value) => {
    setState((prev) => ({
      ...prev,
      [key]: value,
    }));
  }, []);

  const updateMapping = useCallback((newMapping) => {
    setState((prev) => ({
      ...prev,
      mapping: { ...prev.mapping, ...newMapping },
    }));
  }, []);

  const clearData = useCallback(() => {
    setState((prev) => ({
      ...prev,
      headers: [],
      rows: [],
      mapping: {},
      resumenImportacion: null,
    }));
  }, []);

  // =================== 📊 ESTADÍSTICAS Y ESTADO ===================

  const stats = useMemo(
    () => ({
      hasData: state.rows.length > 0,
      isLoading: state.isLoading,
      isImporting: state.isImporting,
      isExporting: state.isExporting,
      ...validationStats,
      customFieldsCount: state.customFields.length,
      customFieldsLoaded: state.customFieldsLoaded,
      config: {
        crearAutomaticamente: state.crearAutomaticamente,
        resolverNombres: state.resolverNombres,
        guardarExtras: state.guardarExtras,
      },
    }),
    [state, validationStats]
  );

  // =================== 📤 RETURN CONSOLIDADO ===================

  return {
    // Estado
    state: {
      headers: state.headers,
      rows: state.rows,
      mapping: state.mapping,
      resumenImportacion: state.resumenImportacion,
    },
    stats,

    headers: state.headers,
    rows: state.rows,
    mapping: state.mapping,
    setMapping: updateMapping,
    isLoading: state.isLoading,
    resumenImportacion: state.resumenImportacion,
    crearAutomaticamente: state.crearAutomaticamente,
    setCrearAutomaticamente: (value) =>
      updateConfig("crearAutomaticamente", value),
    resolverNombres: state.resolverNombres,
    setResolverNombres: (value) => updateConfig("resolverNombres", value),
    guardarExtras: state.guardarExtras,
    setGuardarExtras: (value) => updateConfig("guardarExtras", value),
    validationStats,

    loadFile,
    clearData,

    validateSingleRow,

    importNormal,
    importInteligente,
    importSimplificado,
    importarDatos,

    updateConfig,
    updateMapping,

    customFields: state.customFields,
    loadCustomFields,
    saveCustomFields,

    exportarDatos,

    resolveId,
    normalizeNameSearch,
    formatDate,
    generateReadableId,
  };
}

export default useImportGestion;