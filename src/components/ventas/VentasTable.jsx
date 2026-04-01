import React, { useMemo, useCallback } from 'react';
import { Edit3, Eye, X, Package, Zap, User, MapPin, Calendar } from 'lucide-react';
import { cn } from '../../lib/utils';

const formatDate = (dateStr) => {
  if (!dateStr) return "";
  try {
    if (dateStr.match(/^\d{2}\/\d{2}\/\d{4}$/)) return dateStr;
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    return date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
  } catch { return dateStr; }
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

const ESTADO_STYLES = {
  ACTIVO:      "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800",
  PENDIENTE:   "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800",
  SCORING:     "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800",
  INCIDENCIA:  "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-900/20 dark:text-rose-400 dark:border-rose-800",
  CANCELADA:   "bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700",
  RECHAZADA:   "bg-rose-50 text-rose-600 border-rose-200 dark:bg-rose-900/20 dark:text-rose-400 dark:border-rose-800",
  BAJA:        "bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700",
};

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
  onActivate: _onActivate,
  isAdmin = true,
  resolveProductoName: _resolveProductoName,
  resolveColaboradorName: _resolveColaboradorName,
  resolveZonaName: _resolveZonaName,
  resolveOperadorName: _resolveOperadorName,
}) {
  const indexers = useMemo(() => ({
    productos:    Object.fromEntries(productos.map(p => [p.id, p])),
    colaboradores: Object.fromEntries(colaboradores.map(c => [c.id, c])),
    zonas:        Object.fromEntries(zonas.map(z => [z.id, z])),
    operadores:   Object.fromEntries(operadores.map(o => [o.id, o])),
  }), [productos, colaboradores, zonas, operadores]);

  const getNombreProducto = useCallback((v) =>
    v.productoNombre && v.productoNombre !== v.producto_id
      ? v.productoNombre
      : indexers.productos[v.producto_id]?.nombre || v.producto_id || "Sin producto",
    [indexers.productos]);

  const getNombreZona = useCallback((v) =>
    v.zonaNombre && v.zonaNombre !== v.zona_id
      ? v.zonaNombre
      : indexers.zonas[v.zona_id]?.nombre || v.zona_id || "Global",
    [indexers.zonas]);

  const getNombreColaborador = useCallback((v) =>
    v.colaboradorNombre && v.colaboradorNombre !== v.colaborador_id
      ? v.colaboradorNombre
      : indexers.colaboradores[v.colaborador_id]?.nombre || v.colaborador_id || "-",
    [indexers.colaboradores]);

  const getNombreOperador = useCallback((v) =>
    v.operadorNombre || indexers.operadores[v.operador_id]?.nombre || v.operador_id || "-",
    [indexers.operadores]);

  if (!ventasCalc || ventasCalc.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-16 text-center">
        <Package className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">No se encontraron registros</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
              <th className="px-4 py-3 w-10">
                <input
                  type="checkbox"
                  checked={Boolean(isAllSelected)}
                  onChange={onSelectAll}
                  className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                />
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                <div className="flex items-center gap-1.5"><User className="w-3.5 h-3.5" /> Titular / Expediente</div>
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                <div className="flex items-center gap-1.5"><Package className="w-3.5 h-3.5" /> Servicio</div>
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide hidden xl:table-cell">
                <div className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> Ubicación</div>
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Valores</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Estado</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {ventasCalc.map((venta, idx) => {
              const pvpValue = venta.pvpResuelto || indexers.productos[venta.producto_id]?.pvp || 0;
              const neto = venta._calc?.detalle?.netoColab || 0;
              const isSelected = Boolean(selectedIds?.includes(venta.id));
              const estadoStyle = ESTADO_STYLES[venta.estado] || ESTADO_STYLES.CANCELADA;

              return (
                <tr
                  key={venta.id || idx}
                  onClick={() => onSelect && onSelect(venta.id)}
                  className={cn(
                    "group transition-colors cursor-pointer select-none",
                    isSelected
                      ? "bg-indigo-50 dark:bg-indigo-900/20"
                      : "hover:bg-slate-50 dark:hover:bg-slate-800/50"
                  )}
                >
                  {/* Checkbox */}
                  <td className="px-4 py-3 text-center">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => {}}
                      onClick={(e) => e.stopPropagation()}
                      className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    />
                  </td>

                  {/* Titular */}
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-900 dark:text-white text-sm">
                      {venta.cliente || "Sin nombre"}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-slate-400 dark:text-slate-500 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(venta.fecha)}
                      </span>
                      {venta.cif && (
                        <span className="text-xs text-slate-400 dark:text-slate-500">· {venta.cif}</span>
                      )}
                    </div>
                  </td>

                  {/* Servicio */}
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-800 dark:text-slate-200 text-sm truncate max-w-[180px]">
                      {getNombreProducto(venta)}
                    </p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 uppercase">
                      {getNombreOperador(venta)}
                    </p>
                  </td>

                  {/* Ubicación */}
                  <td className="px-4 py-3 hidden xl:table-cell">
                    <p className="text-sm text-slate-600 dark:text-slate-300 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      {getNombreZona(venta)}
                    </p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 truncate max-w-[140px]">
                      {getNombreColaborador(venta)}
                    </p>
                  </td>

                  {/* Valores */}
                  <td className="px-4 py-3 text-right">
                    <p className="font-semibold text-slate-900 dark:text-white">{formatCurrency(pvpValue)}</p>
                    <p className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center justify-end gap-1 mt-0.5">
                      <Zap className="w-3 h-3" />
                      {formatCurrency(neto)}
                    </p>
                  </td>

                  {/* Estado */}
                  <td className="px-4 py-3 text-center">
                    <span className={cn(
                      "inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium border",
                      estadoStyle
                    )}>
                      {venta.estado || "N/A"}
                    </span>
                  </td>

                  {/* Acciones */}
                  <td className="px-4 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => onView && onView(venta)}
                        className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                        title="Ver detalle"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {isAdmin && (
                        <>
                          <button
                            onClick={() => onEdit && onEdit(venta)}
                            className="p-1.5 rounded-md text-indigo-500 hover:text-indigo-700 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors"
                            title="Editar"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onDelete && onDelete(venta.id)}
                            className="p-1.5 rounded-md text-rose-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30 transition-colors"
                            title="Eliminar"
                          >
                            <X className="w-4 h-4" />
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

      {/* Footer */}
      <div className="px-4 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/30 flex items-center justify-between">
        <span className="text-xs text-slate-400 dark:text-slate-500">
          {ventasCalc.length} registro{ventasCalc.length !== 1 ? 's' : ''}
        </span>
        <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
          Total vista: {formatCurrency(ventasCalc.reduce((acc, v) => acc + (v.pvpResuelto || 0), 0))}
        </span>
      </div>
    </div>
  );
}

export default VentasTable;
