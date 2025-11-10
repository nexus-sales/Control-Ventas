// src/hooks/useImportExcel.js
// Hook personalizado para toda la lógica de importación Excel/CSV

import { useState, useMemo, useCallback, useContext } from "react";
import { DataCtx } from "../context/contexts";
import { useAuth } from "./useAuth";
// import { supabase } from "../lib/supabaseClient";
import {
  autoguessMapping,
  validateRow,
  applyDefaults,
  generateUniqueId,
  parseDate,
  parseNumber,
  resolveId,
} from "../utils/importValidation";
import {
  recopilarEntidadesUnicas,
  createMissingEntitiesLocal,
} from "../services/entityCreator";

// Detecta separador probable en CSV
function detectSeparator(line) {
  const counts = [",", ";", "\t"].map((s) => [
    s,
    (line.match(new RegExp(`\\${s}`, "g")) || []).length,
  ]);
  counts.sort((a, b) => b[1] - a[1]);
  return counts[0][1] > 0 ? counts[0][0] : ",";
}

/**
 * Hook de importación Excel/CSV con integración y sincronización global.
 * Usa setters y funciones del DataContext para propagar cambios a toda la app.
 */
export function useImportExcel({
  productos = [],
  operadores = [],
  colaboradores = [],
  zonas = [],
  setVentas: propSetVentas,
  setProductos: propSetProductos,
  setOperadores: propSetOperadores,
  setColaboradores: propSetColaboradores,
  setZonas: propSetZonas,
  onImportSuccess,
}) {
  // Permite usar setters del contexto si no se pasan por props
  const dataCtx = useContext(DataCtx);
  const { startImporting, finishImporting } = useAuth();
  const setVentas = propSetVentas || dataCtx?.setVentas;
  const setProductos = propSetProductos || dataCtx?.setProductos;
  const setOperadores = propSetOperadores || dataCtx?.setOperadores;
  const setColaboradores = propSetColaboradores || dataCtx?.setColaboradores;
  const setZonas = propSetZonas || dataCtx?.setZonas;
  const refreshData = dataCtx?.refreshData;
  // Estados del hook
  const [headers, setHeaders] = useState([]);
  const [rows, setRows] = useState([]);
  const [mapping, setMapping] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [resumenImportacion, setResumenImportacion] = useState(null);

  // Configuraciones
  const [crearAutomaticamente, setCrearAutomaticamente] = useState(true);
  const [resolverNombres, setResolverNombres] = useState(true);
  const [guardarExtras, setGuardarExtras] = useState(true);

  // Indexadores para resolución de IDs
  const indexers = useMemo(
    () => ({
      productos: {
        byId: Object.fromEntries(productos.map((p) => [p.id, p])),
        byName: Object.fromEntries(
          productos.map((p) => [p.nombre.toLowerCase(), p]),
        ),
      },
      zonas: {
        byId: Object.fromEntries(zonas.map((z) => [z.id, z])),
        byName: Object.fromEntries(
          zonas.map((z) => [z.nombre.toLowerCase(), z]),
        ),
      },
      colaboradores: {
        byId: Object.fromEntries(colaboradores.map((c) => [c.id, c])),
        byName: Object.fromEntries(
          colaboradores.map((c) => [c.nombre.toLowerCase(), c]),
        ),
      },
      operadores: {
        byId: Object.fromEntries(operadores.map((o) => [o.id, o])),
        byName: Object.fromEntries(
          operadores.map((o) => [o.nombre?.toLowerCase() || "", o]),
        ),
      },
    }),
    [productos, operadores, colaboradores, zonas],
  );

  // Estadísticas de validación
  const validationStats = useMemo(() => {
    if (!rows.length || !Object.keys(mapping).length) {
      return { total: 0, valid: 0, invalid: 0 };
    }

    let valid = 0;
    let invalid = 0;

    rows.forEach((row) => {
      const result = validateRow(row, mapping, {
        modoAutomatico: crearAutomaticamente,
        indexers,
        resolverNombres,
      });

      if (result.isValid) valid++;
      else invalid++;
    });

    return { total: rows.length, valid, invalid };
  }, [rows, mapping, crearAutomaticamente, indexers, resolverNombres]);

  // Cargar archivo Excel/CSV - MEJORADO
  const loadFile = useCallback(async (file) => {
    if (!file) return;

    setIsLoading(true);
    try {
      const ext = file.name.toLowerCase().split(".").pop();
      const buffer = await file.arrayBuffer();

      if (ext === "csv") {
        // Procesar CSV con mejor manejo de encoding
        let text;
        try {
          text = new TextDecoder("utf-8").decode(new Uint8Array(buffer));
        } catch {
          text = new TextDecoder("windows-1252").decode(new Uint8Array(buffer));
        }

        const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);

        if (lines.length === 0) {
          throw new Error("Archivo CSV vacío");
        }

        const separator = detectSeparator(lines[0]);
        const csvHeaders = lines[0].split(separator).map((h) => h.trim().replace(/["\r\n]/g, ""));
        
        const csvRows = lines.slice(1).map((line, index) => {
          try {
            const columns = line.split(separator);
            const obj = {};
            csvHeaders.forEach((header, colIndex) => {
              const value = (columns[colIndex] ?? "").trim().replace(/["\r\n]/g, "");
              obj[header] = value;
            });
            return obj;
          } catch (error) {
            console.warn(`Error procesando línea ${index + 2}:`, error);
            return null;
          }
        }).filter(Boolean);

        setHeaders(csvHeaders);
        setRows(csvRows);
        setMapping(autoguessMapping(csvHeaders));
        
        console.log(`CSV cargado: ${csvHeaders.length} columnas, ${csvRows.length} filas`);
        
      } else if (["xlsx", "xls"].includes(ext)) {
        // Procesar Excel con mejor manejo de errores
        const ExcelJS = (await import("exceljs")).default;
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(buffer);

        const worksheet = workbook.worksheets[0];
        if (!worksheet) {
          throw new Error("No se encontró ninguna hoja en el archivo Excel");
        }

        const excelHeaders = [];
        const excelRows = [];

        worksheet.eachRow((row, rowNumber) => {
          try {
            const values = row.values.slice(1);

            if (rowNumber === 1) {
              values.forEach((value) => {
                const cleanHeader = String(value ?? "").trim().replace(/[\r\n]/g, "");
                excelHeaders.push(cleanHeader);
              });
            } else {
              const obj = {};
              excelHeaders.forEach((header, index) => {
                let cellValue = values[index] ?? "";
                
                if (cellValue instanceof Date) {
                  cellValue = cellValue.toISOString().slice(0, 10);
                } else if (typeof cellValue === "object" && cellValue.result) {
                  cellValue = cellValue.result;
                }
                
                obj[header] = String(cellValue).trim();
              });
              
              if (Object.values(obj).some(val => val.length > 0)) {
                excelRows.push(obj);
              }
            }
          } catch (error) {
            console.warn(`Error procesando fila ${rowNumber}:`, error);
          }
        });

        setHeaders(excelHeaders);
        setRows(excelRows);
        setMapping(autoguessMapping(excelHeaders));
        
        console.log(`Excel cargado: ${excelHeaders.length} columnas, ${excelRows.length} filas`);
        
      } else {
        throw new Error(
          "Formato de archivo no soportado. Use .xlsx, .xls o .csv",
        );
      }
    } catch (error) {
      console.error("Error cargando archivo:", error);
      throw new Error(`Error cargando archivo: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Validar una fila específica
  const validateSingleRow = useCallback(
    (rowIndex) => {
      if (!rows[rowIndex]) return null;

      return validateRow(rows[rowIndex], mapping, {
        modoAutomatico: crearAutomaticamente,
        indexers,
        resolverNombres,
      });
    },
    [rows, mapping, crearAutomaticamente, indexers, resolverNombres],
  );

  // Importación normal (sin creación automática) - MEJORADO CON PROTECCIÓN DE SESIÓN
  const importNormal = useCallback(async () => {
    if (!rows.length) throw new Error("No hay datos para importar");

    startImporting(); // 🔒 PROTEGER SESIÓN DURANTE IMPORTACIÓN
    setIsLoading(true);
    const nuevasVentas = [];
    const erroresDetallados = [];
    let rechazadas = 0;

    try {
      for (let index = 0; index < rows.length; index++) {
        const row = rows[index];
        const validation = validateRow(row, mapping, {
          modoAutomatico: false,
          indexers,
          resolverNombres,
        });

        if (!validation.isValid) {
          rechazadas++;
          erroresDetallados.push({
            fila: index + 1,
            errores: validation.errors,
            datos: row,
          });
          continue;
        }

        const get = (key) => {
          const value = row[mapping[key]];
          return value ? String(value).trim() : null;
        };

        const fecha =
          parseDate(get("fecha")) || new Date().toISOString().slice(0, 10);
        const cliente = get("cliente") || "Cliente sin especificar";
        const cif = get("cif") || "";

        const colaborador_id = resolveId(
          get("colaborador_id"),
          indexers.colaboradores,
          resolverNombres,
        );
        const zona_id =
          resolveId(get("zona_id"), indexers.zonas, resolverNombres) ||
          zonas[0]?.id;
        const producto_id =
          resolveId(get("producto_id"), indexers.productos, resolverNombres) ||
          productos[0]?.id;
        const operador_id = resolveId(
          get("operador_id"),
          indexers.operadores,
          resolverNombres,
        );

        if (!colaborador_id || !zona_id) {
          rechazadas++;
          erroresDetallados.push({
            fila: index + 1,
            errores: ["Colaborador o zona no encontrados"],
            datos: row,
          });
          continue;
        }

        let ventaCompleta = {
          id: generateUniqueId("v", index),
          fecha,
          cliente,
          cif,
          colaborador_id,
          zona_id,
          producto_id,
          operador_id,
          pvp: parseNumber(get("pvp")) || 0,
          cantidad: parseNumber(get("cantidad")) || 1,
          estado: get("estado") || "Confirmada",
        };

        ventaCompleta = applyDefaults(ventaCompleta, false);

        if (guardarExtras) {
          const extras = {};
          Object.keys(row).forEach(key => {
            const mappedField = Object.keys(mapping).find(field => mapping[field] === key);
            if (!mappedField && row[key] && row[key].toString().trim()) {
              extras[key] = row[key];
            }
          });
          
          if (Object.keys(extras).length > 0) {
            ventaCompleta.extras = extras;
          }
        }

        nuevasVentas.push(ventaCompleta);
      }

      if (nuevasVentas.length > 0) {
        console.log(`🔄 Guardando ${nuevasVentas.length} ventas en memoria (local)...`);
        console.log('Datos de ventas a guardar:', nuevasVentas);
        if (setVentas) {
          setVentas((prev) => {
            // Evitar duplicados por id
            const idsNuevas = new Set(nuevasVentas.map(v => v.id));
            const prevFiltrado = prev.filter(v => !idsNuevas.has(v.id));
            return [...nuevasVentas, ...prevFiltrado];
          });
        } else {
          console.warn('⚠️ setVentas no está disponible - no se actualiza estado local');
        }
        console.log(`✅ ${nuevasVentas.length} ventas guardadas exitosamente (local)`);
      } else {
        console.log('⚠️ No hay ventas nuevas para guardar');
      }

      // Refrescar datos globales tras importar
      if (refreshData) await refreshData();
      if (typeof onImportSuccess === 'function') onImportSuccess();
      return {
        ventasCreadas: nuevasVentas.length,
        ventasRechazadas: rechazadas,
        errores: erroresDetallados,
      };
    } catch (error) {
      console.error("Error en importación normal:", error);
      throw error;
    } finally {
      setIsLoading(false);
      finishImporting(); // 🔓 LIBERAR PROTECCIÓN DE SESIÓN
    }
  }, [rows, mapping, indexers, resolverNombres, zonas, productos, setVentas, guardarExtras, onImportSuccess, refreshData, startImporting, finishImporting]);

  // Importación inteligente (con creación automática) - CON PROTECCIÓN DE SESIÓN
  const importInteligente = useCallback(async () => {
    console.log('🚀 INICIANDO IMPORTACIÓN INTELIGENTE');
    console.log('Datos:', { 
      rowsLength: rows.length, 
      mappingKeys: Object.keys(mapping),
      crearAutomaticamente 
    });
    console.log('Setters disponibles:', {
      setProductos: !!setProductos,
      setOperadores: !!setOperadores,
      setColaboradores: !!setColaboradores,
      setZonas: !!setZonas,
    });

    if (!rows.length) throw new Error("No hay datos para importar");

    startImporting(); // 🔒 PROTEGER SESIÓN DURANTE IMPORTACIÓN INTELIGENTE
    setIsLoading(true);

    try {
      // 1. Recopilar entidades únicas
      console.log('📊 Paso 1: Recopilando entidades únicas...');
      const entidadesUnicas = recopilarEntidadesUnicas(rows, mapping);
      console.log('Entidades encontradas:', {
        colaboradores: entidadesUnicas.colaboradores.size,
        productos: entidadesUnicas.productos.size,
        operadores: entidadesUnicas.operadores.size,
        zonas: entidadesUnicas.zonas.size,
      });

      // 2. Crear entidades faltantes en local
      console.log('🏗️ Paso 2: Creando entidades faltantes (local)...');
      const { resumen, mapeos } = await createMissingEntitiesLocal(
        entidadesUnicas,
        { productos, operadores, colaboradores, zonas },
        { setProductos, setOperadores, setColaboradores, setZonas },
      );
      console.log('Resumen creación (local):', resumen);

      // 3. Crear ventas con los nuevos mapeos
      console.log('💼 Paso 3: Creando ventas...');
      const nuevasVentas = [];
      let rechazadas = 0;
      const erroresDetallados = [];

      for (let index = 0; index < rows.length; index++) {
        const row = rows[index];
        const get = (key) => {
          const value = row[mapping[key]];
          return value ? String(value).trim() : null;
        };

        const fecha = parseDate(get("fecha"));
        const cliente = get("cliente");
        const colaboradorNombre = get("colaborador_id");

        if (!fecha || !cliente || !colaboradorNombre) {
          console.log(`⚠️ Rechazando fila ${index + 1}: datos mínimos faltantes`);
          rechazadas++;
          erroresDetallados.push({
            fila: index + 1,
            errores: ["Faltan datos mínimos: fecha, cliente o colaborador"],
            datos: row,
          });
          continue;
        }

        const colaborador_id =
          mapeos.colaboradores[colaboradorNombre] ||
          mapeos.colaboradores[colaboradorNombre.toUpperCase()] ||
          resolveId(colaboradorNombre, indexers.colaboradores, resolverNombres);
        
        const zonaOriginal = get("zona_id");
        const zona_id =
          mapeos.zonas[zonaOriginal] ||
          mapeos.zonas[zonaOriginal?.toUpperCase()] ||
          resolveId(zonaOriginal, indexers.zonas, resolverNombres) ||
          zonas[0]?.id;
        
        const productoOriginal = get("producto_id");
        const producto_id =
          mapeos.productos[productoOriginal] ||
          mapeos.productos[productoOriginal?.toUpperCase()] ||
          resolveId(productoOriginal, indexers.productos, resolverNombres);
        
        const operadorOriginal = get("operador_id");
        const operador_id =
          mapeos.operadores[operadorOriginal] ||
          mapeos.operadores[operadorOriginal?.toUpperCase()] ||
          resolveId(operadorOriginal, indexers.operadores, resolverNombres);

        if (!colaborador_id) {
          console.log(`❌ Rechazando fila ${index + 1}: colaborador_id no resuelto`);
          console.log(`   - Colaborador original: "${colaboradorNombre}"`);
          console.log(`   - Mapeos disponibles:`, Object.keys(mapeos.colaboradores));
          console.log(`   - Indexers disponibles:`, Object.keys(indexers.colaboradores.byName));
          rechazadas++;
          erroresDetallados.push({
            fila: index + 1,
            errores: [`Colaborador '${colaboradorNombre}' no pudo ser resuelto`],
            datos: row,
          });
          continue;
        }

        if (!zona_id) {
          console.log(`❌ Rechazando fila ${index + 1}: zona_id no resuelto`);
          console.log(`   - Zona original: "${zonaOriginal}"`);
          console.log(`   - Mapeos disponibles:`, Object.keys(mapeos.zonas));
          console.log(`   - Indexers disponibles:`, Object.keys(indexers.zonas.byName));
          rechazadas++;
          erroresDetallados.push({
            fila: index + 1,
            errores: [`Zona '${zonaOriginal}' no pudo ser resuelta`],
            datos: row,
          });
          continue;
        }

        console.log(`✅ Fila ${index + 1}: IDs resueltos - colaborador: ${colaborador_id}, zona: ${zona_id}, producto: ${producto_id || 'N/A'}, operador: ${operador_id || 'N/A'}`);
        console.log(`   - Mapeos utilizados: colaborador desde ${mapeos.colaboradores[colaboradorNombre] ? 'mapeo' : 'indexer'}, zona desde ${mapeos.zonas[zonaOriginal] ? 'mapeo' : 'indexer'}`);

        let ventaCompleta = {
          id: generateUniqueId("v", index),
          fecha,
          cliente,
          cif: get("cif") || "",
          colaborador_id,
          zona_id,
          producto_id,
          operador_id,
          pvp: parseNumber(get("pvp")) || 50.0,
          cantidad: parseNumber(get("cantidad")) || 1,
          estado: get("estado") || "Confirmada",
        };

        ventaCompleta = applyDefaults(ventaCompleta, true);

        if (guardarExtras) {
          const extras = {};
          Object.keys(row).forEach(key => {
            const mappedField = Object.keys(mapping).find(field => mapping[field] === key);
            if (!mappedField && row[key] && row[key].toString().trim()) {
              extras[key] = row[key];
            }
          });
          
          if (Object.keys(extras).length > 0) {
            ventaCompleta.extras = extras;
          }
        }

        nuevasVentas.push(ventaCompleta);
        console.log(`💾 Venta ${index + 1} preparada para guardar:`, {
          id: ventaCompleta.id,
          cliente: ventaCompleta.cliente,
          colaborador_id: ventaCompleta.colaborador_id,
          zona_id: ventaCompleta.zona_id,
          pvp: ventaCompleta.pvp
        });
      }

      console.log(`💾 Guardando ${nuevasVentas.length} ventas en memoria (local)...`);
      if (nuevasVentas.length > 0) {
        console.log('📋 RESUMEN DE VENTAS A GUARDAR:');
        nuevasVentas.forEach((venta, i) => {
          console.log(`   ${i + 1}. ${venta.cliente} - ${venta.colaborador_id} - ${venta.zona_id} - €${venta.pvp}`);
        });
        
        if (setVentas) {
          console.log('🔄 Actualizando estado de ventas...');
          setVentas((prev) => {
            console.log(`   - Ventas anteriores: ${prev.length}`);
            // Evitar duplicados por id
            const idsNuevas = new Set(nuevasVentas.map(v => v.id));
            const prevFiltrado = prev.filter(v => !idsNuevas.has(v.id));
            const resultado = [...nuevasVentas, ...prevFiltrado];
            console.log(`   - Ventas después del merge: ${resultado.length} (${nuevasVentas.length} nuevas, ${prevFiltrado.length} existentes)`);
            return resultado;
          });
          console.log(`✅ ${nuevasVentas.length} ventas guardadas exitosamente en el estado local`);
        } else {
          console.warn('⚠️ setVentas no está disponible (inteligente) - no se actualiza estado local');
        }
      } else {
        console.log('⚠️ No hay ventas nuevas para guardar (inteligente)');
      }

      const resultadoFinal = {
        ...resumen,
        ventasCreadas: nuevasVentas.length,
        ventasRechazadas: rechazadas,
        errores: erroresDetallados,
      };

      console.log('✅ Importación inteligente completada:', resultadoFinal);
  // Refrescar datos globales tras importar
  if (refreshData) await refreshData();
  if (typeof onImportSuccess === 'function') onImportSuccess();
  setResumenImportacion(resultadoFinal);
  return resultadoFinal;
      
    } catch (error) {
      console.error('❌ Error en importación inteligente:', error);
      throw new Error(`Error en importación inteligente: ${error.message}`);
    } finally {
      setIsLoading(false);
      finishImporting(); // 🔓 LIBERAR PROTECCIÓN DE SESIÓN INTELIGENTE
    }
  }, [
    rows,
    mapping,
    productos,
    operadores,
    colaboradores,
    zonas,
    indexers,
    resolverNombres,
    setVentas,
    setProductos,
    setOperadores,
    setColaboradores,
    setZonas,
    crearAutomaticamente,
    guardarExtras,
    onImportSuccess,
    refreshData,
    startImporting,
    finishImporting,
  ]);

  // Limpiar datos
  const clearData = useCallback(() => {
    setHeaders([]);
    setRows([]);
    setMapping({});
    setResumenImportacion(null);
  }, []);

  return {
    headers,
    rows,
    mapping,
    setMapping,
    isLoading,
    resumenImportacion,
    crearAutomaticamente,
    setCrearAutomaticamente,
    resolverNombres,
    setResolverNombres,
    guardarExtras,
    setGuardarExtras,
    validationStats,
    loadFile,
    validateSingleRow,
    importNormal,
    importInteligente,
    clearData,
    onImportSuccess,
  };
}