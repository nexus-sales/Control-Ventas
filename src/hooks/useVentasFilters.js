import { useState, useMemo, useCallback } from 'react';
import { useCustomFieldsExport } from './useCustomFieldsExport';

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

export function useVentasFilters(ventas, productos = []) {
  // Hook para obtener los campos personalizados activos del módulo ventas
  const customFields = useCustomFieldsExport('ventas');
  const [filtros, setFiltros] = useState(INITIAL_FILTERS);

  // Función para limpiar filtros
  const clearFilters = useCallback(() => {
    setFiltros(INITIAL_FILTERS);
  }, []);

  // Ventas filtradas
  const ventasFiltradas = useMemo(() => {
    if (!Array.isArray(ventas)) return [];
    
    return ventas.filter((v) => {
      if (!v) return false;
      
      const prod = productos.find((p) => p?.id === v.producto_id);
      const pvpValue = prod?.pvp || v.pvp || 0;
      const fecha = v.fecha?.slice(0, 10) || '';
      
      // Filtro por operador
      const okOper = filtros.operador_id
        ? prod?.operador_id === filtros.operador_id
        : true;
      
      // Filtro por colaborador
      const okColab = filtros.colaborador_id
        ? v.colaborador_id === filtros.colaborador_id
        : true;
      
      // Filtro por zona
      const okZona = filtros.zona_id ? v.zona_id === filtros.zona_id : true;
      
      // Filtro por producto
      const okProducto = filtros.producto_id ? v.producto_id === filtros.producto_id : true;
      
      // Filtro por fechas
      const okDesde = filtros.desde ? fecha >= filtros.desde : true;
      const okHasta = filtros.hasta ? fecha <= filtros.hasta : true;
      
      // Filtro por mes/año
      const okMesAno = filtros.mesAno ? 
        fecha.slice(0, 7) === filtros.mesAno : true;
      
      // Filtro por estado
      const okEstado = filtros.estado ? v.estado === filtros.estado : true;
      
      // Filtro por texto (búsqueda)
      const okTexto = filtros.texto
        ? (v.cliente || "").toLowerCase().includes(filtros.texto.toLowerCase()) ||
          (v.cif || "").toLowerCase().includes(filtros.texto.toLowerCase()) ||
          (v.numeracion || "").toLowerCase().includes(filtros.texto.toLowerCase()) ||
          (v.documento || "").toLowerCase().includes(filtros.texto.toLowerCase())
        : true;
      
      // Filtro sin PVP
      const okSinPvp = filtros.sinPvp ? pvpValue === 0 : true;
      
      // Filtro por monto
      const okMontoMin = filtros.montoMin ? pvpValue >= Number(filtros.montoMin) : true;
      const okMontoMax = filtros.montoMax ? pvpValue <= Number(filtros.montoMax) : true;
      
      return (
        okOper &&
        okColab &&
        okZona &&
        okProducto &&
        okDesde &&
        okHasta &&
        okMesAno &&
        okEstado &&
        okTexto &&
        okSinPvp &&
        okMontoMin &&
        okMontoMax
      );
    });
  }, [ventas, filtros, productos]);

  // Función para exportar datos
  const exportarDatos = useCallback((ventasCalc, colaboradores = [], zonas = []) => {
    // Construir cabeceras base
    const baseHeaders = [
      'Fecha', 'Cliente', 'CIF', 'Producto', 'Colaborador', 'Zona', 'PVP',
      'Comisión Base', 'Comisión Neta', 'Estado', 'Documento', 'Numeración'
    ];
    // Añadir cabeceras de campos personalizados
    const customHeaders = customFields.map(f => f.nombre);
    const headers = [...baseHeaders, ...customHeaders];

    const datosExport = ventasCalc.map(v => {
      const prod = productos.find(p => p?.id === v.producto_id);
      const colab = colaboradores.find(c => c?.id === v.colaborador_id);
      const zona = zonas.find(z => z?.id === v.zona_id);
      // Base
      const row = {
        Fecha: formatDate(v.fecha),
        Cliente: v.cliente || '',
        CIF: v.cif || '',
        Producto: prod?.nombre || '',
        Colaborador: colab?.nombre || '',
        Zona: zona?.nombre || '',
        PVP: prod?.pvp || v.pvp || 0,
        'Comisión Base': v._calc?.ok ? v._calc.detalle.comBruta : 0,
        'Comisión Neta': v._calc?.ok ? v._calc.detalle.netoColab : 0,
        Estado: v.estado || '',
        Documento: v.documento || '',
        Numeración: v.numeracion || ''
      };
      // Campos personalizados
      if (Array.isArray(customFields)) {
        customFields.forEach(f => {
          row[f.nombre] = v.customFields?.[`cf_${f.id}`] || '';
        });
      }
      return row;
    });

    // Crear CSV
    const csvContent = [
      headers.join(','),
      ...datosExport.map(row => headers.map(header => `"${row[header]}"`).join(','))
    ].join('\n');

    // Descargar
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `ventas_${new Date().toISOString().slice(0, 10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [productos, customFields]);

  // Actualizar filtro específico
  const updateFilter = useCallback((key, value) => {
    setFiltros(prev => ({ ...prev, [key]: value }));
  }, []);

  // Actualizar múltiples filtros
  const updateFilters = useCallback((newFilters) => {
    setFiltros(prev => ({ ...prev, ...newFilters }));
  }, []);

  return {
    filtros,
    setFiltros,
    updateFilter,
    updateFilters,
    clearFilters,
    ventasFiltradas,
    exportarDatos,
    hasActiveFilters: Object.values(filtros).some(v => 
      v !== "" && v !== false && v !== null && v !== undefined
    )
  };
}

// Helper para formatear fecha
function formatDate(dateStr) {
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
}