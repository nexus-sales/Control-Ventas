import { useState, useMemo, useCallback } from 'react';
import { useData } from '../context/AppContexts';
import { getColaboradorNivelId } from '../utils/calculos';
import { escapeCsvCell } from '../utils/csv';

// Filtros iniciales para gestión de ventas
const INITIAL_FILTERS = {
  texto: "",
  search: "",
  colaborador_id: "",
  zona_id: "",
  operador_id: "",
  producto_id: "",
  estado: "",
  desde: "",
  hasta: "",
  mesAno: "",
  sinPvp: false,
  montoMin: "",
  montoMax: "",
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
 * Hook CORREGIDO específicamente para funcionar con VentaFormModalNuevo.jsx
 * 🎯 CORRECCIONES: 
 * - Mejor resolución de nombres para mostrar en tablas
 * - Datos enriquecidos para evitar búsquedas repetidas en componentes
 * - Funciones de resolución que manejan tanto IDs legibles como crípticos
 * - Eliminación de todos los warnings de ESLint
 */
export function useVentasGestion(customFields = []) {
  const {
    data,
    setVentas,
    setProductos
  } = useData();

  // =================== ESTADO CONSOLIDADO ===================
  const [state, setState] = useState({
    // 🔍 FILTROS
    filtros: INITIAL_FILTERS,

    // ✅ SELECCIÓN MÚLTIPLE
    selectedIds: [],
    selectAll: false,

    // 📊 UI STATES
    isExporting: false,
    isProcessing: false,
  });

  // =================== 🎯 DATOS MEMOIZADOS MEJORADOS ===================
  // 🎯 MEJORA: Usar useMemo para evitar warnings de ESLint
  const ventas = useMemo(() =>
    Array.isArray(data?.ventas) ? data.ventas : [],
    [data?.ventas]
  );

  const productos = useMemo(() =>
    Array.isArray(data?.productos) ? data.productos : [],
    [data?.productos]
  );

  const colaboradores = useMemo(() =>
    Array.isArray(data?.colaboradores) ? data.colaboradores : [],
    [data?.colaboradores]
  );

  const zonas = useMemo(() =>
    Array.isArray(data?.zonas) ? data.zonas : [],
    [data?.zonas]
  );

  const operadores = useMemo(() =>
    Array.isArray(data?.operadores) ? data.operadores : [],
    [data?.operadores]
  );

  // 🎯 NUEVA: Helper para extraer nombre legible de un ID críptico
  const extractReadableName = useCallback((id, fallback = '') => {
    if (!id || typeof id !== 'string') return fallback;

    // Si tiene formato de ID generado automáticamente, extraer la parte legible
    const patterns = [
      /^(prod|colab|zona|oper|c)_([a-zA-Z0-9]+)_\d+/,  // Nuevo formato: prod_nombreproducto_1234
      /^(prod|colab|zona|oper|c)_\d+_([a-zA-Z0-9]+)$/   // Formato críptico: c_176400078164_fzrk5j
    ];

    for (const pattern of patterns) {
      const match = id.match(pattern);
      if (match) {
        // Si el segundo grupo tiene contenido legible, usarlo
        const namePart = match[2];
        if (namePart && namePart.length > 2 && !/^\w{6}$/.test(namePart)) {
          // Convertir camelCase o formato comprimido a legible
          return namePart
            .replace(/([a-z])([A-Z])/g, '$1 $2') // camelCase
            .replace(/([a-z])(\d)/g, '$1 $2')    // letras seguidas de números
            .toUpperCase();
        }
      }
    }

    return id;
  }, []);

  // 🎯 MEJORA: Indexadores optimizados con nombres resueltos
  const indexers = useMemo(() => ({
    productos: Object.fromEntries(productos.map(p => [p.id, p])),
    colaboradores: Object.fromEntries(colaboradores.map(c => [c.id, c])),
    zonas: Object.fromEntries(zonas.map(z => [z.id, z])),
    operadores: Object.fromEntries(operadores.map(o => [o.id, o])),
  }), [productos, colaboradores, zonas, operadores]);

  // 🎯 NUEVAS: Funciones de resolución inteligentes para componentes
  const getNombreProducto = useCallback((producto_id) => {
    if (!producto_id) return '';

    // 1. Buscar por ID exacto
    const producto = indexers.productos[producto_id];
    if (producto?.nombre && producto.nombre !== producto.id) {
      return producto.nombre;
    }

    // 2. Si no tiene nombre o el nombre es igual al ID, intentar extraer del ID
    if (producto && (!producto.nombre || producto.nombre === producto.id)) {
      const extractedName = extractReadableName(producto.id);
      if (extractedName !== producto.id) {
        return extractedName;
      }
    }

    // 3. Extraer directamente del ID si no se encontró el producto
    const extractedName = extractReadableName(producto_id);
    return extractedName !== producto_id ? extractedName : (producto_id || 'Sin producto');
  }, [indexers.productos, extractReadableName]);

  const getNombreColaborador = useCallback((colaborador_id) => {
    if (!colaborador_id) return '';

    const colaborador = indexers.colaboradores[colaborador_id];
    if (colaborador?.nombre && colaborador.nombre !== colaborador.id) {
      return colaborador.nombre;
    }

    if (colaborador && (!colaborador.nombre || colaborador.nombre === colaborador.id)) {
      const extractedName = extractReadableName(colaborador.id);
      if (extractedName !== colaborador.id) {
        return extractedName;
      }
    }

    const extractedName = extractReadableName(colaborador_id);
    return extractedName !== colaborador_id ? extractedName : (colaborador_id || 'Sin colaborador');
  }, [indexers.colaboradores, extractReadableName]);

  const getNombreZona = useCallback((zona_id) => {
    if (!zona_id) return '';

    const zona = indexers.zonas[zona_id];
    if (zona?.nombre && zona.nombre !== zona.id) {
      return zona.nombre;
    }

    if (zona && (!zona.nombre || zona.nombre === zona.id)) {
      const extractedName = extractReadableName(zona.id);
      if (extractedName !== zona.id) {
        return extractedName;
      }
    }

    const extractedName = extractReadableName(zona_id);
    return extractedName !== zona_id ? extractedName : (zona_id || 'Sin zona');
  }, [indexers.zonas, extractReadableName]);

  const getNombreOperador = useCallback((operador_id) => {
    if (!operador_id) return '';

    const operador = indexers.operadores[operador_id];
    if (operador?.nombre && operador.nombre !== operador.id) {
      return operador.nombre;
    }

    if (operador?.codigo && operador.codigo !== operador.id) {
      return operador.codigo;
    }

    if (operador && (!operador.nombre || operador.nombre === operador.id)) {
      const extractedName = extractReadableName(operador.id);
      if (extractedName !== operador.id) {
        return extractedName;
      }
    }

    const extractedName = extractReadableName(operador_id);
    return extractedName !== operador_id ? extractedName : '';
  }, [indexers.operadores, extractReadableName]);

  // 🎯 MEJORA: Función para enriquecer ventas con nombres precalculados
  const enrichVenta = useCallback((venta) => {
    if (!venta || typeof venta !== 'object') return venta;

    const producto = indexers.productos[venta.producto_id];
    const operador_id = producto?.operador_id || venta.operador_id;

    return {
      ...venta,
      // 🎯 MEJORA: Nombres precalculados usando las funciones de resolución
      productoNombre: getNombreProducto(venta.producto_id),
      colaboradorNombre: getNombreColaborador(venta.colaborador_id),
      zonaNombre: getNombreZona(venta.zona_id),
      operadorNombre: getNombreOperador(operador_id),

      // 🎯 MEJORA: PVP resuelto correctamente
      pvpResuelto: producto?.pvp || venta.pvp || 0,

      // 🎯 MEJORA: Datos adicionales útiles
      colaboradorNivel: getColaboradorNivelId(indexers.colaboradores[venta.colaborador_id]) || '',
      zonaActiva: indexers.zonas[venta.zona_id]?.activo ?? true,
      productoActivo: producto?.activo ?? true,
      operadorActivo: indexers.operadores[operador_id]?.activo ?? true,

      // 🎯 NUEVA: Información de operador desde producto
      operador_id: operador_id,
    };
  }, [indexers, getNombreProducto, getNombreColaborador, getNombreZona, getNombreOperador]);

  // =================== 🔍 FUNCIONES DE FILTRADO MEJORADAS ===================

  // Actualizar filtro específico
  const updateFilter = useCallback((key, value) => {
    setState(prev => ({
      ...prev,
      filtros: { ...prev.filtros, [key]: value },
      // 🎯 MEJORA: Auto-limpiar selección al cambiar filtros
      selectedIds: [],
      selectAll: false,
    }));
  }, []);

  // Actualizar múltiples filtros
  const updateFilters = useCallback((newFilters) => {
    setState(prev => ({
      ...prev,
      filtros: { ...prev.filtros, ...newFilters },
      selectedIds: [],
      selectAll: false,
    }));
  }, []);

  // Limpiar todos los filtros
  const clearFilters = useCallback(() => {
    setState(prev => ({
      ...prev,
      filtros: INITIAL_FILTERS,
      selectedIds: [],
      selectAll: false,
    }));
  }, []);

  // 🎯 MEJORA: Ventas filtradas y enriquecidas optimizadas
  const ventasFiltradas = useMemo(() => {
    const { filtros } = state;
    if (!ventas.length) return [];

    return ventas
      .map(enrichVenta) // 🎯 MEJORA: Enriquecer primero
      .filter((venta) => {
        if (!venta?.id) return false;

        const producto = indexers.productos[venta.producto_id];
        const pvpValue = venta.pvpResuelto || 0;
        const fecha = venta.fecha?.slice(0, 10) || '';

        // 🎯 MEJORA: Usar early return para mejor performance
        if (filtros.operador_id && (producto?.operador_id !== filtros.operador_id && venta.operador_id !== filtros.operador_id)) return false;
        if (filtros.colaborador_id && venta.colaborador_id !== filtros.colaborador_id) return false;
        if (filtros.zona_id && venta.zona_id !== filtros.zona_id) return false;
        if (filtros.producto_id && venta.producto_id !== filtros.producto_id) return false;
        if (filtros.desde && fecha < filtros.desde) return false;
        if (filtros.hasta && fecha > filtros.hasta) return false;
        if (filtros.mesAno && fecha.slice(0, 7) !== filtros.mesAno) return false;
        if (filtros.estado && venta.estado !== filtros.estado) return false;
        if (filtros.sinPvp && pvpValue > 0) return false;
        if (filtros.montoMin && pvpValue < Number(filtros.montoMin)) return false;
        if (filtros.montoMax && pvpValue > Number(filtros.montoMax)) return false;

        // 🎯 MEJORA: Búsqueda de texto mejorada (incluye nombres resueltos)
        const textQuery = (filtros.texto || filtros.search || "").trim().toLowerCase();
        if (textQuery) {
          const searchableText = [
            venta.cliente,
            venta.cif,
            venta.numeracion,
            venta.documento,
            venta.productoNombre,     // 🎯 NUEVA
            venta.colaboradorNombre, // 🎯 NUEVA
            venta.zonaNombre,        // 🎯 NUEVA
            venta.operadorNombre     // 🎯 NUEVA
          ].join(' ').toLowerCase();
          if (!searchableText.includes(textQuery)) return false;
        }

        return true;
      });
  }, [ventas, state, enrichVenta, indexers.productos]);

  // =================== ✅ FUNCIONES DE SELECCIÓN ===================

  // Manejar selección individual
  const handleSelect = useCallback((id) => {
    setState(prev => ({
      ...prev,
      selectedIds: prev.selectedIds.includes(id)
        ? prev.selectedIds.filter(x => x !== id)
        : [...prev.selectedIds, id],
      // 🎯 MEJORA: Auto-actualizar selectAll
      selectAll: false,
    }));
  }, []);

  // Manejar selección global (mejorada)
  const handleSelectAll = useCallback(() => {
    setState(prev => {
      const allCurrentIds = ventasFiltradas.map(v => v.id);
      const allSelected = allCurrentIds.length > 0 &&
        allCurrentIds.every(id => prev.selectedIds.includes(id));

      return {
        ...prev,
        selectedIds: allSelected ? [] : allCurrentIds,
        selectAll: !allSelected,
      };
    });
  }, [ventasFiltradas]);

  // Limpiar selección
  const clearSelection = useCallback(() => {
    setState(prev => ({
      ...prev,
      selectedIds: [],
      selectAll: false,
    }));
  }, []);

  // Helpers de selección
  const isSelected = useCallback((id) => state.selectedIds.includes(id), [state.selectedIds]);

  const getSelectedVentas = useCallback(() =>
    ventasFiltradas.filter(v => state.selectedIds.includes(v.id))
    , [ventasFiltradas, state.selectedIds]);

  // =================== ⚡ OPERACIONES CRUD ===================

  // 🎯 MEJORA: Agregar venta con ID más legible
  // Devuelve { id, synced }: el guardado local ya ocurrió cuando esta promesa
  // resuelve (es instantáneo), `synced` solo indica si además llegó a
  // Supabase — permite a quien llama avisar del fallo remoto sin bloquear el
  // cierre del formulario en él (ver handleSaveVenta en VentasPage.jsx).
  const addVenta = useCallback(async (ventaData) => {
    // 🎯 MEJORA: ID más legible para ventas
    const clienteSlug = ventaData.cliente ?
      ventaData.cliente.slice(0, 8).replace(/[^a-zA-Z0-9]/g, '').toLowerCase() :
      'cliente';
    const timestamp = Date.now().toString().slice(-4); // Solo últimos 4 dígitos
    const id = `venta_${clienteSlug}_${timestamp}`;

    // Separar campos personalizados
    const customFieldsData = {};
    const standardFields = {};

    Object.entries(ventaData).forEach(([key, value]) => {
      if (key.startsWith('cf_')) {
        customFieldsData[key] = value;
      } else {
        standardFields[key] = value;
      }
    });

    const nuevaVenta = {
      id,
      ...standardFields,
      // standardFields.customFields ya trae el objeto anidado que arma
      // VentaFormModal (dataToSave.customFields); customFieldsData son
      // props sueltas cf_* de nivel superior, si las hubiera. Se fusionan
      // en vez de que una pise a la otra — antes esta línea sobreescribía
      // siempre con customFieldsData (normalmente {}), perdiendo los
      // campos personalizados de cualquier venta nueva.
      customFields: { ...(standardFields.customFields || {}), ...customFieldsData },
      pvp: Number(ventaData.pvp || 0),
      cantidad: Number(ventaData.cantidad || 1),
      fecha: ventaData.fecha || new Date().toISOString().slice(0, 10),
      estado: ventaData.estado || "PENDIENTE",
    };

    const synced = await setVentas(prev => [nuevaVenta, ...prev]);
    return { id, synced };
  }, [setVentas]);

  // Actualizar venta existente. Devuelve `synced` con el mismo criterio que
  // addVenta: el guardado local ya ocurrió cuando resuelve, `synced` solo
  // indica si además llegó a Supabase.
  const updateVenta = useCallback(async (ventaId, changes) => {
    const synced = await setVentas(prev =>
      prev.map(venta =>
        venta.id === ventaId
          ? {
            ...venta,
            ...changes,
            pvp: Number(changes.pvp ?? venta.pvp ?? 0),
          }
          : venta
      )
    );
    return synced;
  }, [setVentas]);

  // Eliminar venta individual
  const deleteVenta = useCallback((ventaId) => {
    setVentas(prev => prev.filter(v => v.id !== ventaId));

    // 🎯 MEJORA: Limpiar de selección automáticamente
    setState(prev => ({
      ...prev,
      selectedIds: prev.selectedIds.filter(id => id !== ventaId),
    }));
  }, [setVentas]);

  // 🎯 MEJORA: Eliminar múltiples ventas optimizada
  const deleteMultipleVentas = useCallback((ventaIds = null) => {
    const idsToDelete = ventaIds || state.selectedIds;

    if (idsToDelete.length === 0) return false;

    if (!window.confirm(
      `¿Seguro que quieres eliminar ${idsToDelete.length} ventas seleccionadas?`
    )) {
      return false;
    }

    setState(prev => ({ ...prev, isProcessing: true }));

    try {
      setVentas(prev => prev.filter(v => !idsToDelete.includes(v.id)));
      clearSelection();
      return true;
    } catch (error) {
      console.error('Error eliminando ventas:', error);
      return false;
    } finally {
      setState(prev => ({ ...prev, isProcessing: false }));
    }
  }, [state.selectedIds, setVentas, clearSelection]);

  // Cambiar estado de venta(s)
  const updateEstado = useCallback((ventaId, estado) => {
    if (Array.isArray(ventaId)) {
      // Múltiples ventas
      setVentas(prev =>
        prev.map(v => ventaId.includes(v.id) ? { ...v, estado } : v)
      );
    } else {
      // Venta individual
      setVentas(prev =>
        prev.map(v => v.id === ventaId ? { ...v, estado } : v)
      );
    }
  }, [setVentas]);

  // Actualizar PVP de producto
  const updateProductPvp = useCallback((productoId, pvp) => {
    setProductos(prev =>
      prev.map(p => p.id === productoId ? { ...p, pvp: Number(pvp) } : p)
    );
  }, [setProductos]);

  // =================== 📊 EXPORTACIÓN ===================

  const exportarDatos = useCallback((ventasCalc = null) => {
    setState(prev => ({ ...prev, isExporting: true }));

    const ventasToExport = ventasCalc || (state.selectedIds.length ? getSelectedVentas() : ventasFiltradas);

    try {
      // 🎯 MEJORA: Cabeceras dinámicas según campos personalizados
      const baseHeaders = [
        'Fecha', 'Cliente', 'CIF', 'Producto', 'Colaborador', 'Zona', 'Operador',
        'PVP', 'Cantidad', 'Comisión Base', 'Comisión Neta', 'Estado',
        'Documento', 'Numeración', 'Teléfono', 'Observaciones'
      ];

      const customHeaders = Array.isArray(customFields)
        ? customFields.map(f => f.nombre)
        : [];

      const headers = [...baseHeaders, ...customHeaders];

      const datosExport = ventasToExport.map(venta => {
        // 🎯 MEJORA: Usar nombres precalculados cuando están disponibles
        const nombreProducto = venta.productoNombre || getNombreProducto(venta.producto_id);
        const nombreColaborador = venta.colaboradorNombre || getNombreColaborador(venta.colaborador_id);
        const nombreZona = venta.zonaNombre || getNombreZona(venta.zona_id);
        const nombreOperador = venta.operadorNombre || getNombreOperador(venta.operador_id);

        // Datos base
        const row = {
          'Fecha': formatDate(venta.fecha),
          'Cliente': venta.cliente || '',
          'CIF': venta.cif || '',
          'Producto': nombreProducto,
          'Colaborador': nombreColaborador,
          'Zona': nombreZona,
          'Operador': nombreOperador,
          'PVP': venta.pvpResuelto || venta.pvp || 0,
          'Cantidad': venta.cantidad || 1,
          'Comisión Base': venta._calc?.ok ? venta._calc.detalle.comBruta : 0,
          'Comisión Neta': venta._calc?.ok ? venta._calc.detalle.netoColab : 0,
          'Estado': venta.estado || '',
          'Documento': venta.documento || '',
          'Numeración': venta.numeracion || '',
          'Teléfono': venta.telefono_movil || venta.telefono_fijo || '',
          'Observaciones': venta.observaciones || '',
        };

        // Campos personalizados
        if (Array.isArray(customFields)) {
          customFields.forEach(field => {
            row[field.nombre] = venta.customFields?.[`cf_${field.id}`] || '';
          });
        }

        return row;
      });

      // 🎯 MEJORA: CSV más robusto con escape de comillas
      const csvContent = [
        headers.join(','),
        ...datosExport.map(row =>
          headers.map(header => escapeCsvCell(row[header])).join(',')
        )
      ].join('\n');

      // Descargar con nombre descriptivo
      const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
      const filename = `ventas_${state.selectedIds.length ? 'seleccionadas' : 'filtradas'}_${timestamp}.csv`;

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);

      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      return true;
    } catch (error) {
      console.error('Error en exportación:', error);
      return false;
    } finally {
      setState(prev => ({ ...prev, isExporting: false }));
    }
  }, [state.selectedIds, ventasFiltradas, customFields, getSelectedVentas, getNombreProducto, getNombreColaborador, getNombreZona, getNombreOperador]);

  // =================== 🛠️ HELPERS Y VALIDACIONES ===================

  const isVentaBlocked = useCallback((venta) => {
    return ["CANCELADA", "BAJA", "RECHAZADA"].includes(venta?.estado);
  }, []);

  // 🎯 MEJORA: Draft inicial más inteligente
  const createInitialDraft = useCallback(() => ({
    fecha: new Date().toISOString().slice(0, 10),
    cliente: "",
    cif: "",
    producto_id: productos[0]?.id || "",
    zona_id: zonas[0]?.id || "",
    colaborador_id: colaboradores[0]?.id || "",
    operador_id: operadores[0]?.id || "",
    pvp: 0,
    cantidad: 1,
    estado: "PENDIENTE",
    documento: "",
    numeracion: "",
    telefono_fijo: "",
    telefono_movil: "",
    observaciones: "",
  }), [productos, zonas, colaboradores, operadores]);

  // =================== 📊 ESTADÍSTICAS CALCULADAS MEJORADAS ===================

  const stats = useMemo(() => {
    const hasActiveFilters = Object.values(state.filtros).some(v =>
      v !== "" && v !== false && v !== null && v !== undefined
    );

    return {
      // Filtros
      hasActiveFilters,
      // Selección
      hasSelection: state.selectedIds.length > 0,
      selectionCount: state.selectedIds.length,
      isAllSelected: state.selectedIds.length > 0 &&
        state.selectedIds.length === ventasFiltradas.length,
      // Contadores
      filteredCount: ventasFiltradas.length,
      totalCount: ventas.length,
      // Estados UI
      isExporting: state.isExporting,
      isProcessing: state.isProcessing,
      // 🎯 MEJORA: Métricas de negocio
      selectedValue: getSelectedVentas().reduce((sum, v) => {
        return sum + (v.pvpResuelto || v.pvp || 0);
      }, 0),
      filteredValue: ventasFiltradas.reduce((sum, v) => {
        return sum + (v.pvpResuelto || v.pvp || 0);
      }, 0),
      // 🎯 NUEVAS: Estadísticas por entidad
      entitiesCount: {
        productos: productos.length,
        colaboradores: colaboradores.length,
        zonas: zonas.length,
        operadores: operadores.length,
      }
    };
  }, [state, ventasFiltradas, ventas, productos, colaboradores, zonas, operadores, getSelectedVentas]);

  // =================== 📤 RETURN CONSOLIDADO ===================

  return {
    // 📊 ESTADO Y DATOS
    filtros: state.filtros,
    ventasFiltradas,
    stats,

    // 🔍 FILTROS
    updateFilter,
    updateFilters,
    clearFilters,

    // ✅ SELECCIÓN
    selectedIds: state.selectedIds,
    handleSelect,
    handleSelectAll,
    clearSelection,
    isSelected,
    getSelectedVentas,

    // ⚡ OPERACIONES
    addVenta,
    updateVenta,
    deleteVenta,
    deleteMultipleVentas,
    updateEstado,
    updateProductPvp,

    // 🛠️ HELPERS
    isVentaBlocked,
    createInitialDraft,

    // 📊 EXPORTACIÓN
    exportarDatos,

    // 🎯 NUEVAS: FUNCIONES DE RESOLUCIÓN
    getNombreProducto,
    getNombreColaborador,
    getNombreZona,
    getNombreOperador,
    enrichVenta,
    extractReadableName,

    // 🎯 NUEVAS: DATOS PARA COMPONENTES
    allData: {
      productos,
      colaboradores,
      zonas,
      operadores,
    },
    indexers,
  };
}

export default useVentasGestion;