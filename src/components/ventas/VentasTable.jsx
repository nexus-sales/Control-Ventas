import React, { useState, useMemo, useCallback } from 'react';
import { Edit3, Eye, X, Check, Package, CreditCard as CardIcon } from 'lucide-react';
import { glassStyles, sectionTitleStyles } from '../../utils/designUtils';
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
 * 🎯 COMPONENTE PREMIUM: VentasTable con Glassmorphism
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
      ACTIVO: "bg-emerald-100/50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800",
      PENDIENTE: "bg-amber-100/50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border border-amber-200 dark:border-amber-800",
      "PENDIENTE VALIDAR": "bg-yellow-100/50 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-800",
      SCORING: "bg-blue-100/50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border border-blue-200 dark:border-blue-800",
      INCIDENCIA: "bg-orange-100/50 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 border border-orange-200 dark:border-orange-800",
      INSTALACION: "bg-indigo-100/50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800",
      ENVIADA: "bg-cyan-100/50 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-800",
      "PENDIENTE INSTALACION": "bg-purple-100/50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 border border-purple-200 dark:border-purple-800",
      CITADA: "bg-lime-100/50 text-lime-700 dark:bg-lime-900/30 dark:text-lime-400 border border-lime-200 dark:border-lime-800",
      TRAMITACION: "bg-sky-100/50 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400 border border-sky-200 dark:border-sky-800",
      CANCELADA: "bg-red-100/50 text-red-700 dark:bg-red-900/30 dark:text-red-400 border border-red-200 dark:border-red-800",
      BAJA: "bg-gray-100/50 text-gray-700 dark:bg-gray-700/30 dark:text-gray-400 border border-gray-200 dark:border-gray-800",
      "OFERTA FIRMADA": "bg-green-100/50 text-green-700 dark:bg-green-900/30 dark:text-green-400 border border-green-200 dark:border-green-800",
    };
    return estilos[estado] || "bg-slate-100/50 text-slate-700 dark:bg-gray-700/30 dark:text-gray-400";
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
    return false;
  }, []);

  if (!hasValidData) {
    return (
      <div className={`${glassStyles} p-12 text-center`}>
        <div aria-live="polite" className="sr-only">
          {ariaMessage}
        </div>
        <h2 className={sectionTitleStyles}>Lista de Ventas</h2>
        <div className="flex flex-col items-center justify-center">
          <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
            <Package className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-bold text-slate-600 dark:text-slate-300 mb-2">No hay ventas</h3>
          <p className="text-slate-500 dark:text-slate-400 max-w-sm">
            No se encontraron ventas con los filtros actuales. Intenta ajustar los criterios de búsqueda.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`${glassStyles} overflow-hidden p-0`}>
      <div aria-live="polite" className="sr-only">
        {ariaMessage}
      </div>

      <div className="p-6 pb-2">
        <div className="flex items-center justify-between mb-4">
          <h2 className={sectionTitleStyles}>Listado de Ventas <span className="text-sm font-normal text-slate-500 ml-2">({ventasCalc.length})</span></h2>

          {/* Indicadores de estado de datos */}
          <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-900/50 px-3 py-1.5 rounded-lg">
            <span>Prod: {productos.length}</span>
            <span className="w-1 h-3 bg-slate-200 dark:bg-slate-700 mx-1"></span>
            <span>Colab: {colaboradores.length}</span>
            <span className="w-1 h-3 bg-slate-200 dark:bg-slate-700 mx-1"></span>
            <span>Zona: {zonas.length}</span>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table
          className="min-w-full text-xs md:text-sm"
          role="table"
          aria-label="Tabla de ventas"
        >
          <thead className="bg-slate-50/80 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 backdrop-blur-sm sticky top-0 z-10">
            <tr className="text-left text-slate-500 dark:text-slate-400 uppercase tracking-widest text-[10px] font-bold">
              <th className="px-4 py-3 w-10">
                <input
                  type="checkbox"
                  checked={Boolean(isAllSelected)}
                  onChange={onSelectAll}
                  aria-label="Seleccionar todas las ventas"
                  className="rounded border-slate-300 text-sky-500 focus:ring-sky-500 bg-white/50"
                />
              </th>
              <th className="px-4 py-3">Fecha</th>
              <th className="px-4 py-3">Cliente</th>
              <th className="px-4 py-3">Producto</th>
              <th className="px-4 py-3 hidden md:table-cell">Zona</th>
              <th className="px-4 py-3 hidden lg:table-cell">Colaborador</th>
              <th className="px-4 py-3 hidden xl:table-cell">Operador</th>
              <th className="px-4 py-3 text-right">PVP</th>
              <th className="px-4 py-3 text-right hidden lg:table-cell">Comisión</th>
              <th className="px-4 py-3 text-right font-black">Neto</th>
              <th className="px-4 py-3 text-center">Estado</th>
              <th className="px-4 py-3 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
            {ventasCalc.map((venta, idx) => {
              const estadoLabel = venta.estado || "SIN ESTADO";
              const comisionBase = venta._calc?.detalle?.comBase || 0;
              const comisionBruta = venta._calc?.detalle?.comBruta || 0;
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
                  className="bg-white/40 dark:bg-slate-800/20 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors group"
                >
                  <td className="px-4 py-3 align-middle">
                    <input
                      type="checkbox"
                      checked={Boolean(selectedIds?.includes(venta.id))}
                      onChange={() => onSelect && onSelect(venta.id)}
                      aria-label={`Seleccionar venta ${venta.id}`}
                      className="rounded border-slate-300 text-sky-500 focus:ring-sky-500 bg-white/50"
                    />
                  </td>
                  <td className="px-4 py-3 align-middle text-slate-600 dark:text-slate-300 font-medium whitespace-nowrap">
                    {formatDate(venta.fecha)}
                  </td>
                  <td className="px-4 py-3 align-middle">
                    <div className="text-slate-900 dark:text-white font-bold uppercase tracking-tight text-xs leading-tight mb-0.5">
                      {venta.cliente || "Sin cliente"}
                    </div>
                    {venta.cif && (
                      <div className="text-[10px] bg-slate-100 dark:bg-slate-900 text-slate-500 inline-block px-1.5 rounded">{venta.cif}</div>
                    )}
                  </td>
                  <td className="px-4 py-3 align-middle text-slate-700 dark:text-slate-300">
                    <div className="max-w-[150px] truncate text-xs font-medium" title={nombreProducto}>
                      {nombreProducto}
                    </div>
                  </td>
                  <td className="px-4 py-3 align-middle text-slate-500 dark:text-slate-400 hidden md:table-cell">
                    <div className="max-w-[120px] truncate text-xs" title={nombreZona}>
                      {nombreZona}
                    </div>
                  </td>
                  <td className="px-4 py-3 align-middle text-slate-600 dark:text-slate-300 hidden lg:table-cell">
                    <div className="max-w-[140px] truncate text-xs" title={nombreColaborador}>
                      {nombreColaborador}
                    </div>
                  </td>
                  <td className="px-4 py-3 align-middle text-slate-500 dark:text-slate-400 hidden xl:table-cell">
                    <div className="max-w-[120px] truncate text-xs" title={nombreOperador}>
                      {nombreOperador}
                    </div>
                  </td>
                  <td className="px-4 py-3 align-middle text-right font-bold text-slate-800 dark:text-slate-200">
                    {formatCurrency(pvpValue)}
                  </td>
                  <td className="px-4 py-3 align-middle text-right text-indigo-600 dark:text-indigo-400 font-medium text-xs hidden lg:table-cell">
                    {formatCurrency(comisionBase)}
                  </td>
                  <td className="px-4 py-3 align-middle text-right">
                    <span className="text-emerald-600 dark:text-emerald-400 font-black">
                      {formatCurrency(neto)}
                    </span>
                  </td>
                  <td className="px-4 py-3 align-middle text-center">
                    <span
                      className={`inline-flex items-center justify-center px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shadow-sm ${getEstadoStyle(
                        estadoLabel
                      )}`}
                    >
                      {estadoLabel}
                    </span>
                  </td>
                  <td className="px-4 py-3 align-middle">
                    <div className="flex items-center justify-center gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => onView && onView(venta)}
                        className="p-1.5 rounded-lg bg-white dark:bg-slate-700 text-sky-500 shadow-sm hover:scale-110 transition-transform"
                        title="Ver detalles"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      {isAdmin && (
                        <>
                          <button
                            onClick={() => onEdit && onEdit(venta)}
                            className="p-1.5 rounded-lg bg-white dark:bg-slate-700 text-amber-500 shadow-sm hover:scale-110 transition-transform"
                            title="Editar venta"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onDelete && onDelete(venta.id)}
                            className="p-1.5 rounded-lg bg-white dark:bg-slate-700 text-rose-500 shadow-sm hover:scale-110 transition-transform"
                            title="Eliminar venta"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onActivate && onActivate(venta.id)}
                            className="p-1.5 rounded-lg bg-white dark:bg-slate-700 text-emerald-500 shadow-sm hover:scale-110 transition-transform"
                            title="Activar venta"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
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
    </div>
  );
}

export default VentasTable;