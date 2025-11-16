import { useState, useMemo, useCallback } from 'react';
import { useData } from '../context/DataContext';

// Filtros iniciales para gestión de ventas
const INITIAL_FILTERS = {
  texto: "",
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
 * Hook consolidado para gestión completa de ventas
 * Integra: filtros, selección múltiple, operaciones CRUD y exportación
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

  // =================== DATOS MEMOIZADOS ===================
  const ventasData = useMemo(() => ({
    ventas: Array.isArray(data?.ventas) ? data.ventas : [],
    productos: Array.isArray(data?.productos) ? data.productos : [],
    colaboradores: Array.isArray(data?.colaboradores) ? data.colaboradores : [],
    zonas: Array.isArray(data?.zonas) ? data.zonas : [],
    operadores: Array.isArray(data?.operadores) ? data.operadores : [],
  }), [data]);

  // =================== 🔍 FUNCIONES DE FILTRADO ===================
  
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

  // 🎯 MEJORA: Ventas filtradas optimizadas
  const ventasFiltradas = useMemo(() => {
    const { ventas, productos } = ventasData;
    const { filtros } = state;
    
    if (!ventas.length) return [];
    
    return ventas.filter((venta) => {
      if (!venta?.id) return false;
      
      const producto = productos.find(p => p?.id === venta.producto_id);
      const pvpValue = producto?.pvp || venta.pvp || 0;
      const fecha = venta.fecha?.slice(0, 10) || '';
      
      // 🎯 MEJORA: Usar early return para mejor performance
      if (filtros.operador_id && producto?.operador_id !== filtros.operador_id) return false;
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
      
      // Búsqueda de texto (optimizada)
      if (filtros.texto) {
        const searchTerm = filtros.texto.toLowerCase();
        const searchableText = [
          venta.cliente,
          venta.cif,
          venta.numeracion,
          venta.documento
        ].join(' ').toLowerCase();
        
        if (!searchableText.includes(searchTerm)) return false;
      }
      
      return true;
    });
  }, [ventasData, state.filtros]);

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
  
  // 🎯 MEJORA: Agregar venta con validación
  const addVenta = useCallback((ventaData) => {
    const id = `v_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    
    // Separar campos personalizados
    const customFields = {};
    const standardFields = {};
    
    Object.entries(ventaData).forEach(([key, value]) => {
      if (key.startsWith('cf_')) {
        customFields[key] = value;
      } else {
        standardFields[key] = value;
      }
    });
    
    const nuevaVenta = {
      id,
      ...standardFields,
      customFields,
      pvp: Number(ventaData.pvp || 0),
      cantidad: Number(ventaData.cantidad || 1),
      fecha: ventaData.fecha || new Date().toISOString().slice(0, 10),
      estado: ventaData.estado || "PENDIENTE",
    };
    
    setVentas(prev => [nuevaVenta, ...prev]);
    return id;
  }, [setVentas]);

  // Actualizar venta existente
  const updateVenta = useCallback((ventaId, changes) => {
    setVentas(prev =>
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
      console.error('Error eliminando ventas múltiples:', error);
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

  // =================== 📊 EXPORTACIÓN MEJORADA ===================
  
  const exportarDatos = useCallback((ventasCalc = null) => {
    setState(prev => ({ ...prev, isExporting: true }));
    
    const ventasToExport = ventasCalc || (state.selectedIds.length ? getSelectedVentas() : ventasFiltradas);
    const { productos, colaboradores, zonas } = ventasData;
    
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
        const producto = productos.find(p => p?.id === venta.producto_id);
        const colaborador = colaboradores.find(c => c?.id === venta.colaborador_id);
        const zona = zonas.find(z => z?.id === venta.zona_id);
        const operador = ventasData.operadores.find(op => op?.id === producto?.operador_id);
        
        // Datos base
        const row = {
          'Fecha': formatDate(venta.fecha),
          'Cliente': venta.cliente || '',
          'CIF': venta.cif || '',
          'Producto': producto?.nombre || '',
          'Colaborador': colaborador?.nombre || '',
          'Zona': zona?.nombre || '',
          'Operador': operador?.nombre || '',
          'PVP': producto?.pvp || venta.pvp || 0,
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
          headers.map(header => {
            const value = String(row[header] || '');
            return `"${value.replace(/"/g, '""')}"`;
          }).join(',')
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
      console.error('Error exportando ventas:', error);
      return false;
    } finally {
      setState(prev => ({ ...prev, isExporting: false }));
    }
  }, [state.selectedIds, ventasFiltradas, ventasData, customFields, getSelectedVentas]);

  // =================== 🛠️ HELPERS Y VALIDACIONES ===================
  
  const isVentaBlocked = useCallback((venta) => {
    return ["CANCELADA", "BAJA", "RECHAZADA"].includes(venta?.estado);
  }, []);

  // 🎯 MEJORA: Draft inicial más inteligente
  const createInitialDraft = useCallback(() => ({
    fecha: new Date().toISOString().slice(0, 10),
    cliente: "",
    cif: "",
    producto_id: ventasData.productos[0]?.id || "",
    zona_id: ventasData.zonas[0]?.id || "",
    colaborador_id: ventasData.colaboradores[0]?.id || "",
    pvp: 0,
    cantidad: 1,
    estado: "PENDIENTE",
    documento: "",
    numeracion: "",
    telefono_fijo: "",
    telefono_movil: "",
    observaciones: "",
  }), [ventasData]);

  // =================== 📊 ESTADÍSTICAS CALCULADAS ===================
  
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
      totalCount: ventasData.ventas.length,
      
      // Estados UI
      isExporting: state.isExporting,
      isProcessing: state.isProcessing,
      
      // 🎯 MEJORA: Métricas de negocio
      selectedValue: getSelectedVentas().reduce((sum, v) => {
        const producto = ventasData.productos.find(p => p.id === v.producto_id);
        return sum + (producto?.pvp || v.pvp || 0);
      }, 0),
      
      filteredValue: ventasFiltradas.reduce((sum, v) => {
        const producto = ventasData.productos.find(p => p.id === v.producto_id);
        return sum + (producto?.pvp || v.pvp || 0);
      }, 0),
    };
  }, [state, ventasFiltradas, ventasData, getSelectedVentas]);

  // =================== 📤 RETURN CONSOLIDADO ===================
  
  return {
    // 📊 ESTADO Y DATOS
    state: state.filtros,
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
  };
}

export default useVentasGestion;