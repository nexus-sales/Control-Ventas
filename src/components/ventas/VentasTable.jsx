import React, { useState, useMemo, useCallback } from 'react';
import { Edit3, Eye, X, Check, Package, CreditCard as CardIcon } from 'lucide-react';
import Card from '../ui/Card';
import SectionTitle from '../ui/SectionTitle';
import '../../styles/table-optimizations.css';

// Función para formatear fecha
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

const formatCurrency = (value) => {
  const number = Number(value);
  if (!Number.isFinite(number)) return "-";
  return number.toLocaleString("es-ES", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

/**
 * 🎯 COMPONENTE CORREGIDO: VentasTable con DARK MODE COMPLETO
 * ✅ Dark mode aplicado siguiendo el patrón de DashboardPanels
 */
export function VentasTable({
  ventasCalc = [],
  productos = [],
  colaboradores = [],
  zonas = [],
  operadores = [], 
  selectedIds = [],
  onSelect,
  onSelectAll,
  isAllSelected,
  onEdit,
  onView,
  onDelete,
  onActivate,
  onDefinePvp,
  isAdmin = true,
  currentPage = 1,
  pageSize = 25,
  totalItems = 0,
  totalPages = 1,
  onPageChange,
  resolveProductoName,
  resolveColaboradorName,
  resolveZonaName,
  resolveOperadorName,
}) {
  const [ariaMessage, setAriaMessage] = useState("");

  // Memoizar indexadores
  const indexers = useMemo(() => ({
    productos: Object.fromEntries(productos.map(p => [p.id, p])),
    colaboradores: Object.fromEntries(colaboradores.map(c => [c.id, c])),
    zonas: Object.fromEntries(zonas.map(z => [z.id, z])),
    operadores: Object.fromEntries(operadores.map(o => [o.id, o])),
  }), [productos, colaboradores, zonas, operadores]);

  // Función para generar key único
  const generateUniqueKey = useCallback((venta, index) => {
    const baseKey = `venta-${index}`;
    const idPart = venta.id ? `id-${venta.id}` : `no-id`;
    const clientePart = venta.cliente ? `client-${venta.cliente.slice(0, 10)}` : 'no-client';
    const fechaPart = venta.fecha ? `date-${venta.fecha}` : 'no-date';
    
    const combinedStr = `${idPart}-${clientePart}-${fechaPart}`;
    const hash = combinedStr.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    
    return `${baseKey}-${Math.abs(hash)}`;
  }, []);

  // Helpers para mostrar nombres
  const getNombreProducto = useCallback((venta) => {
    if (venta.productoNombre && venta.productoNombre !== venta.producto_id) {
      return venta.productoNombre;
    }
    
    if (resolveProductoName) {
      const resolved = resolveProductoName(venta.producto_id);
      if (resolved && resolved !== venta.producto_id) {
        return resolved;
      }
    }
    
    const producto = indexers.productos[venta.producto_id];
    if (producto?.nombre) {
      return producto.nombre;
    }
    
    const productoFallback = productos.find(p => p?.id === venta.producto_id);
    if (productoFallback?.nombre) {
      return productoFallback.nombre;
    }
    
    const displayId = venta.producto_id || "";
    if (displayId.startsWith('prod_')) {
      const parts = displayId.split('_');
      return parts[1] || displayId;
    }
    
    return displayId || "Sin producto";
  }, [resolveProductoName, indexers.productos, productos]);

  const getNombreZona = useCallback((venta) => {
    if (venta.zonaNombre && venta.zonaNombre !== venta.zona_id) {
      return venta.zonaNombre;
    }
    
    if (resolveZonaName) {
      const resolved = resolveZonaName(venta.zona_id);
      if (resolved && resolved !== venta.zona_id) {
        return resolved;
      }
    }
    
    const zona = indexers.zonas[venta.zona_id];
    if (zona?.nombre) {
      return zona.nombre;
    }
    
    const zonaFallback = zonas.find(z => z?.id === venta.zona_id);
    if (zonaFallback?.nombre) {
      return zonaFallback.nombre;
    }
    
    const displayId = venta.zona_id || "";
    if (displayId.startsWith('zona_')) {
      const parts = displayId.split('_');
      return parts[1] || displayId;
    }
    
    return displayId || "Sin zona";
  }, [resolveZonaName, indexers.zonas, zonas]);

  const getNombreColaborador = useCallback((venta) => {
    if (venta.colaboradorNombre && venta.colaboradorNombre !== venta.colaborador_id) {
      return venta.colaboradorNombre;
    }
    
    if (resolveColaboradorName) {
      const resolved = resolveColaboradorName(venta.colaborador_id);
      if (resolved && resolved !== venta.colaborador_id) {
        return resolved;
      }
    }
    
    const colaborador = indexers.colaboradores[venta.colaborador_id];
    if (colaborador?.nombre) {
      return colaborador.nombre;
    }
    
    const colaboradorFallback = colaboradores.find(c => c?.id === venta.colaborador_id);
    if (colaboradorFallback?.nombre) {
      return colaboradorFallback.nombre;
    }
    
    const displayId = venta.colaborador_id || "";
    if (displayId.startsWith('colab_') || displayId.startsWith('c_')) {
      const parts = displayId.split('_');
      return parts[1] || displayId;
    }
    
    return displayId || "Sin colaborador";
  }, [resolveColaboradorName, indexers.colaboradores, colaboradores]);

  const getNombreOperador = useCallback((venta) => {
    if (venta.operadorNombre) {
      return venta.operadorNombre;
    }
    
    if (resolveOperadorName) {
      const resolved = resolveOperadorName(venta.operador_id);
      if (resolved) {
        return resolved;
      }
    }
    
    let operador = indexers.operadores[venta.operador_id];
    
    if (!operador && venta.producto_id) {
      const producto = indexers.productos[venta.producto_id];
      if (producto?.operador_id) {
        operador = indexers.operadores[producto.operador_id];
      }
    }
    
    if (operador?.nombre) {
      return operador.nombre;
    }
    
    if (venta.operador_id) {
      const operadorFallback = operadores.find(o => o?.id === venta.operador_id);
      if (operadorFallback?.nombre) {
        return operadorFallback.nombre;
      }
    }
    
    const displayId = venta.operador_id || "";
    if (displayId.startsWith('oper_') || displayId.startsWith('op_')) {
      const parts = displayId.split('_');
      return parts[1] || displayId;
    }
    
    return displayId || "-";
  }, [resolveOperadorName, indexers, operadores]);

  // PVP con resolución inteligente
  const getPvpVenta = useCallback((venta) => {
    if (venta.pvpResuelto > 0) {
      return venta.pvpResuelto;
    }
    
    if (venta.pvp > 0) {
      return venta.pvp;
    }
    
    const producto = indexers.productos[venta.producto_id];
    if (producto?.pvp > 0) {
      return producto.pvp;
    }
    
    if (venta._calc?.detalle?.producto?.pvp > 0) {
      return venta._calc.detalle.producto.pvp;
    }
    
    return 0;
  }, [indexers.productos]);

  // Función para obtener estilo del estado
  const getEstadoStyle = useCallback((estado) => {
    const estilos = {
      ACTIVO: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
      PENDIENTE: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
      "PENDIENTE VALIDAR": "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
      SCORING: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
      INCIDENCIA: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
      INSTALACION: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400",
      ENVIADA: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400",
      "PENDIENTE INSTALACION": "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
      CITADA: "bg-lime-100 text-lime-700 dark:bg-lime-900/30 dark:text-lime-400",
      TRAMITACION: "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400",
      CANCELADA: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
      BAJA: "bg-gray-100 text-gray-700 dark:bg-gray-700/30 dark:text-gray-400",
      "OFERTA FIRMADA": "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
      "PDTE FIRMA": "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400",
      RECHAZADA: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400",
      Confirmada: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
      "En Proceso": "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
      Instalada: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
    };
    return estilos[estado] || "bg-slate-100 text-slate-700 dark:bg-gray-700/30 dark:text-gray-400";
  }, []);

  // Feedback ARIA para cambios de página
  const handlePageChange = useCallback((newPage) => {
    if (onPageChange) onPageChange(newPage);
    setAriaMessage(`Página ${newPage}`);
  }, [onPageChange]);

  // Verificar si hay datos válidos
  const hasValidData = useMemo(() => 
    ventasCalc && Array.isArray(ventasCalc) && ventasCalc.length > 0,
    [ventasCalc]
  );

  const isDevMode = useMemo(() => {
    try {
      return typeof process !== 'undefined' && process.env?.NODE_ENV === 'development';
    } catch {
      return false;
    }
  }, []);

  if (!hasValidData) {
    return (
      <Card>
        <SectionTitle>Lista de Ventas</SectionTitle>
        <div aria-live="polite" className="sr-only">
          {ariaMessage}
        </div>
        <div className="text-center py-12">
          <Package className="w-16 h-16 mx-auto text-slate-300 dark:text-gray-600 mb-4" />
          <h3 className="text-lg font-medium text-slate-600 dark:text-gray-400 mb-2">No hay ventas</h3>
          <p className="text-slate-500 dark:text-gray-500">
            No se encontraron ventas con los filtros actuales.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <div aria-live="polite" className="sr-only">
        {ariaMessage}
      </div>
      <div className="flex items-center justify-between mb-4">
        <SectionTitle>Listado de Ventas ({ventasCalc.length})</SectionTitle>
        
        {/* Indicadores de estado de datos */}
        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-gray-400">
          <span>Productos: {productos.length}</span>
          <span>•</span>
          <span>Colaboradores: {colaboradores.length}</span>
          <span>•</span>
          <span>Zonas: {zonas.length}</span>
        </div>
      </div>

      {/* Paginación SUPERIOR */}
      {onPageChange && totalPages > 1 && (
        <div className="mb-4 p-3 bg-slate-50 dark:bg-gray-700 rounded-lg">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-3 text-sm">
            {/* Información de registros */}
            <div className="text-slate-600 dark:text-gray-300">
              Mostrando{" "}
              <span className="font-semibold text-slate-900 dark:text-gray-100">
                {((currentPage - 1) * pageSize) + 1} - {Math.min(currentPage * pageSize, totalItems)}
              </span>
              {" "}de{" "}
              <span className="font-semibold text-slate-900 dark:text-gray-100">{totalItems}</span> ventas
              {totalPages > 1 && (
                <span className="ml-2 text-slate-500 dark:text-gray-400">
                  (Página {currentPage} de {totalPages})
                </span>
              )}
            </div>
            
            {/* Controles de navegación */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePageChange(1)}
                disabled={currentPage <= 1}
                className="px-2 py-1 border border-slate-300 dark:border-gray-600 rounded text-xs disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-gray-600 transition-colors text-slate-700 dark:text-gray-200"
                title="Primera página"
              >
                ««
              </button>
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage <= 1}
                className="px-3 py-1 border border-slate-300 dark:border-gray-600 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-gray-600 transition-colors text-slate-700 dark:text-gray-200"
                title="Página anterior"
              >
                ‹ Anterior
              </button>
              
              {/* Páginas cercanas */}
              {totalPages <= 7 ? (
                [...Array(totalPages)].map((_, i) => {
                  const page = i + 1;
                  return (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={`px-3 py-1 border rounded text-sm transition-colors ${
                        page === currentPage
                          ? 'bg-blue-500 text-white border-blue-500 dark:bg-blue-600 dark:border-blue-600'
                          : 'border-slate-300 dark:border-gray-600 hover:bg-slate-100 dark:hover:bg-gray-600 text-slate-700 dark:text-gray-200'
                      }`}
                    >
                      {page}
                    </button>
                  );
                })
              ) : (
                <>
                  {currentPage > 3 && (
                    <>
                      <button
                        onClick={() => handlePageChange(1)}
                        className="px-3 py-1 border border-slate-300 dark:border-gray-600 rounded text-sm hover:bg-slate-100 dark:hover:bg-gray-600 transition-colors text-slate-700 dark:text-gray-200"
                      >
                        1
                      </button>
                      {currentPage > 4 && <span className="px-2 text-slate-500 dark:text-gray-400">...</span>}
                    </>
                  )}
                  
                  {[-2, -1, 0, 1, 2].map(offset => {
                    const page = currentPage + offset;
                    if (page < 1 || page > totalPages) return null;
                    return (
                      <button
                        key={page}
                        onClick={() => handlePageChange(page)}
                        className={`px-3 py-1 border rounded text-sm transition-colors ${
                          page === currentPage
                            ? 'bg-blue-500 text-white border-blue-500 dark:bg-blue-600 dark:border-blue-600'
                            : 'border-slate-300 dark:border-gray-600 hover:bg-slate-100 dark:hover:bg-gray-600 text-slate-700 dark:text-gray-200'
                        }`}
                      >
                        {page}
                      </button>
                    );
                  })}
                  
                  {currentPage < totalPages - 2 && (
                    <>
                      {currentPage < totalPages - 3 && <span className="px-2 text-slate-500 dark:text-gray-400">...</span>}
                      <button
                        onClick={() => handlePageChange(totalPages)}
                        className="px-3 py-1 border border-slate-300 dark:border-gray-600 rounded text-sm hover:bg-slate-100 dark:hover:bg-gray-600 transition-colors text-slate-700 dark:text-gray-200"
                      >
                        {totalPages}
                      </button>
                    </>
                  )}
                </>
              )}
              
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage >= totalPages}
                className="px-3 py-1 border border-slate-300 dark:border-gray-600 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-gray-600 transition-colors text-slate-700 dark:text-gray-200"
                title="Página siguiente"
              >
                Siguiente ›
              </button>
              <button
                onClick={() => handlePageChange(totalPages)}
                disabled={currentPage >= totalPages}
                className="px-2 py-1 border border-slate-300 dark:border-gray-600 rounded text-xs disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-gray-600 transition-colors text-slate-700 dark:text-gray-200"
                title="Última página"
              >
                »»
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table
          className="min-w-full border-separate border-spacing-y-2 text-xs md:text-sm"
          role="table"
          aria-label="Tabla de ventas"
        >
          <thead>
            <tr className="text-left text-slate-500 dark:text-gray-400 uppercase tracking-wide text-[11px] md:text-xs">
              <th className="px-2 md:px-4 py-2">
                <input
                  type="checkbox"
                  checked={Boolean(isAllSelected)}
                  onChange={onSelectAll}
                  aria-label="Seleccionar todas las ventas"
                  className="accent-sky-500"
                />
              </th>
              <th className="px-2 md:px-4 py-2">Fecha</th>
              <th className="px-2 md:px-4 py-2">Cliente</th>
              <th className="px-2 md:px-4 py-2">Producto</th>
              <th className="px-2 md:px-4 py-2">Zona</th>
              <th className="px-2 md:px-4 py-2">Colaborador</th>
              <th className="px-2 md:px-4 py-2">Operador</th>
              <th className="px-2 md:px-4 py-2 text-right">PVP</th>
              <th className="px-2 md:px-4 py-2 text-right">Comisión Base</th>
              <th className="px-2 md:px-4 py-2 text-right">Neto</th>
              <th className="px-2 md:px-4 py-2 text-center">Estado</th>
              <th className="px-2 md:px-4 py-2 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {ventasCalc.map((venta, idx) => {
              const estadoLabel = venta.estado || "SIN ESTADO";
              const comisionBase = venta._calc?.detalle?.comBruta || 0;
              const neto = venta._calc?.detalle?.netoColab || 0;
              
              const nombreProducto = getNombreProducto(venta);
              const nombreZona = getNombreZona(venta);
              const nombreColaborador = getNombreColaborador(venta);
              const nombreOperador = getNombreOperador(venta);
              const pvpValue = getPvpVenta(venta);

              const uniqueKey = generateUniqueKey(venta, idx);

              return (
                <tr
                  key={uniqueKey}
                  className="bg-white dark:bg-gray-800 shadow-sm hover:shadow-md dark:hover:shadow-gray-900/50 transition-shadow focus-within:ring-2 focus-within:ring-sky-200 dark:focus-within:ring-sky-800"
                >
                  <td className="px-2 md:px-4 py-3 align-middle">
                    <input
                      type="checkbox"
                      checked={Boolean(selectedIds?.includes(venta.id))}
                      onChange={() => onSelect && onSelect(venta.id)}
                      aria-label={`Seleccionar venta ${venta.id}`}
                      className="accent-sky-500"
                    />
                  </td>
                  <td className="px-2 md:px-4 py-3 align-middle text-slate-700 dark:text-gray-300 font-medium">
                    {formatDate(venta.fecha)}
                  </td>
                  <td className="px-2 md:px-4 py-3 align-middle">
                    <div className="text-slate-900 dark:text-gray-100 font-medium uppercase tracking-tight">
                      {venta.cliente || "Sin cliente"}
                    </div>
                    {venta.cif && (
                      <div className="text-[11px] text-slate-500 dark:text-gray-400">{venta.cif}</div>
                    )}
                    {isDevMode && venta.id && (
                      <div className="text-[10px] text-blue-500 dark:text-blue-400" title={`ID: ${venta.id}`}>
                        {venta.id.length > 20 ? `${venta.id.slice(0, 20)}...` : venta.id}
                      </div>
                    )}
                  </td>
                  <td className="px-2 md:px-4 py-3 align-middle text-slate-700 dark:text-gray-300">
                    <div className="max-w-[150px] truncate" title={nombreProducto}>
                      {nombreProducto}
                    </div>
                    {venta.productoCodigo && (
                      <div className="text-[10px] text-slate-400 dark:text-gray-500">{venta.productoCodigo}</div>
                    )}
                  </td>
                  <td className="px-2 md:px-4 py-3 align-middle text-slate-600 dark:text-gray-400">
                    <div className="max-w-[120px] truncate" title={nombreZona}>
                      {nombreZona}
                    </div>
                  </td>
                  <td className="px-2 md:px-4 py-3 align-middle text-slate-700 dark:text-gray-300">
                    <div className="max-w-[140px] truncate" title={nombreColaborador}>
                      {nombreColaborador}
                    </div>
                    {venta.colaboradorNivel && (
                      <div className="text-[10px] text-slate-400 dark:text-gray-500">{venta.colaboradorNivel}</div>
                    )}
                  </td>
                  <td className="px-2 md:px-4 py-3 align-middle text-slate-600 dark:text-gray-400">
                    <div className="max-w-[120px] truncate" title={nombreOperador}>
                      {nombreOperador}
                    </div>
                  </td>
                  <td className="px-2 md:px-4 py-3 align-middle text-right font-semibold text-slate-900 dark:text-gray-100">
                    {formatCurrency(pvpValue)}
                    {!venta.pvp && pvpValue > 0 && (
                      <div className="text-[10px] text-blue-500 dark:text-blue-400">desde producto</div>
                    )}
                  </td>
                  <td className="px-2 md:px-4 py-3 align-middle text-right text-indigo-600 dark:text-indigo-400 font-semibold">
                    {formatCurrency(comisionBase)}
                  </td>
                  <td className="px-2 md:px-4 py-3 align-middle text-right text-emerald-600 dark:text-emerald-400 font-semibold">
                    {formatCurrency(neto)}
                  </td>
                  <td className="px-2 md:px-4 py-3 align-middle">
                    <span
                      className={`inline-flex items-center justify-center px-2.5 py-1 rounded-full text-[11px] font-semibold ${getEstadoStyle(
                        estadoLabel
                      )}`}
                    >
                      {estadoLabel}
                    </span>
                  </td>
                  <td className="px-2 md:px-4 py-3 align-middle">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        onClick={() => onView && onView(venta)}
                        aria-label={`Ver detalles de venta ${venta.id}`}
                        className="p-2 rounded-lg bg-sky-50 dark:bg-sky-900/30 text-sky-600 dark:text-sky-400 hover:bg-sky-100 dark:hover:bg-sky-800/50 transition-colors"
                        title="Ver detalles"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {isAdmin && (
                        <>
                          <button
                            onClick={() => onEdit && onEdit(venta)}
                            aria-label={`Editar venta ${venta.id}`}
                            className="p-2 rounded-lg bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-800/50 transition-colors"
                            title="Editar venta"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onDelete && onDelete(venta.id)}
                            aria-label={`Eliminar venta ${venta.id}`}
                            className="p-2 rounded-lg bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-800/50 transition-colors"
                            title="Eliminar venta"
                          >
                            <X className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onActivate && onActivate(venta.id)}
                            aria-label={`Activar venta ${venta.id}`}
                            className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-800/50 transition-colors"
                            title="Activar venta"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          {venta.producto_id && (
                            <button
                              onClick={() =>
                                onDefinePvp &&
                                onDefinePvp(venta.producto_id, nombreProducto)
                              }
                              aria-label={`Definir PVP del producto de la venta ${venta.id}`}
                              className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-800/50 transition-colors"
                              title="Definir PVP del producto"
                            >
                              <CardIcon className="w-4 h-4" />
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Información de debug SOLO en desarrollo */}
      {isDevMode && (
        <div className="mt-4 p-2 bg-slate-50 dark:bg-gray-700 rounded text-xs text-slate-600 dark:text-gray-400">
          <strong>Debug Info:</strong> Productos: {productos.length}, 
          Colaboradores: {colaboradores.length}, 
          Zonas: {zonas.length}, 
          Operadores: {operadores.length}
          {ventasCalc.length > 0 && (
            <>
              {" | "}Ejemplo ID: {ventasCalc[0]?.id || 'No ID'}
              {" | "}Unique Keys: Generados dinámicamente
            </>
          )}
        </div>
      )}

      {/* Paginación inferior */}
      {onPageChange && totalPages > 1 && (
        <div className="mt-4 flex justify-between items-center text-sm text-slate-600 dark:text-gray-300">
          <div>
            Mostrando {((currentPage - 1) * pageSize) + 1} - {Math.min(currentPage * pageSize, totalItems)} de {totalItems} ventas
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage <= 1}
              className="px-3 py-1 border border-slate-300 dark:border-gray-600 rounded disabled:opacity-50 text-slate-700 dark:text-gray-200 hover:bg-slate-100 dark:hover:bg-gray-700"
            >
              Anterior
            </button>
            <span className="px-3 py-1 text-slate-700 dark:text-gray-200">
              Página {currentPage} de {totalPages}
            </span>
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage >= totalPages}
              className="px-3 py-1 border border-slate-300 dark:border-gray-600 rounded disabled:opacity-50 text-slate-700 dark:text-gray-200 hover:bg-slate-100 dark:hover:bg-gray-700"
            >
              Siguiente
            </button>
          </div>
        </div>
      )}
    </Card>
  );
}

export default VentasTable;