import React, { useState, useMemo, useCallback } from 'react';
import { Edit3, Eye, X, Check, Package, CreditCard as CardIcon, ShieldCheck, Zap, MoreHorizontal, User, MapPin, Calendar, ArrowRight } from 'lucide-react';
import { glassStyles, sectionTitleStyles } from '../../utils/designUtils';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../lib/utils';
import { BorderBeam } from '../ui/BorderBeam';

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
  isAdmin = true,
  resolveProductoName,
  resolveColaboradorName,
  resolveZonaName,
  resolveOperadorName,
}) {
  const indexers = useMemo(() => ({
    productos: Object.fromEntries(productos.map(p => [p.id, p])),
    colaboradores: Object.fromEntries(colaboradores.map(c => [c.id, c])),
    zonas: Object.fromEntries(zonas.map(z => [z.id, z])),
    operadores: Object.fromEntries(operadores.map(o => [o.id, o])),
  }), [productos, colaboradores, zonas, operadores]);

  const getNombreProducto = useCallback((venta) => {
    if (venta.productoNombre && venta.productoNombre !== venta.producto_id) return venta.productoNombre;
    return indexers.productos[venta.producto_id]?.nombre || venta.producto_id || "Sin producto";
  }, [indexers.productos]);

  const getNombreZona = useCallback((venta) => {
    if (venta.zonaNombre && venta.zonaNombre !== venta.zona_id) return venta.zonaNombre;
    return indexers.zonas[venta.zona_id]?.nombre || venta.zona_id || "Global";
  }, [indexers.zonas]);

  const getNombreColaborador = useCallback((venta) => {
    if (venta.colaboradorNombre && venta.colaboradorNombre !== venta.colaborador_id) return venta.colaboradorNombre;
    return indexers.colaboradores[venta.colaborador_id]?.nombre || venta.colaborador_id || "-";
  }, [indexers.colaboradores]);

  const getNombreOperador = useCallback((venta) => {
    if (venta.operadorNombre) return venta.operadorNombre;
    return indexers.operadores[venta.operador_id]?.nombre || venta.operador_id || "-";
  }, [indexers.operadores]);

  const getEstadoStyle = useCallback((estado) => {
    const estilos = {
      ACTIVO: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.15)]",
      PENDIENTE: "bg-amber-500/10 text-amber-500 border-amber-500/20",
      SCORING: "bg-blue-500/10 text-blue-500 border-blue-500/20",
      INCIDENCIA: "bg-rose-500/10 text-rose-500 border-rose-500/20 shadow-[0_0_15px_rgba(244,63,94,0.15)]",
      CANCELADA: "bg-slate-500/10 text-slate-500 border-slate-500/20 grayscale",
    };
    return estilos[estado] || "bg-slate-500/10 text-slate-500 border-slate-500/20";
  }, []);

  if (!ventasCalc || ventasCalc.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className={cn(glassStyles(), "p-24 text-center rounded-[3rem] border-dashed border-2 border-slate-200 dark:border-white/5")}
      >
        <div className="flex flex-col items-center justify-center space-y-6">
          <div className="w-24 h-24 rounded-[2rem] bg-slate-100 dark:bg-white/[0.03] flex items-center justify-center shadow-inner">
            <Package className="w-10 h-10 text-slate-300 dark:text-slate-700" />
          </div>
          <div className="space-y-2">
            <h3 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tighter">Radar sin detecciones</h3>
            <p className="text-slate-500 dark:text-slate-400 max-w-sm font-medium mx-auto">
              No se han encontrado registros que coincidan con los parámetros de búsqueda actuales.
            </p>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(glassStyles(), "relative overflow-hidden p-0 rounded-[3rem] border border-white/20 dark:border-white/5 shadow-2xl")}
    >
      <div className="overflow-x-auto">
        <table className="w-full border-separate border-spacing-0">
          <thead>
            <tr className="bg-slate-50/50 dark:bg-white/[0.02] border-b border-slate-200 dark:border-white/5">
              <th className="px-8 py-6 text-left w-12 text-center">
                <input
                  type="checkbox"
                  checked={Boolean(isAllSelected)}
                  onChange={onSelectAll}
                  className="w-5 h-5 rounded-lg border-2 border-slate-200 dark:border-white/10 bg-transparent text-blue-600 focus:ring-blue-500/20 transition-all cursor-pointer"
                />
              </th>
              <th className="px-6 py-6 text-left text-[10px] font-black uppercase tracking-[4px] text-slate-400 dark:text-slate-500">
                <div className="flex items-center gap-2">
                  <User className="w-3 h-3" /> Titular / Expediente
                </div>
              </th>
              <th className="px-6 py-6 text-left text-[10px] font-black uppercase tracking-[4px] text-slate-400 dark:text-slate-500">
                <div className="flex items-center gap-2">
                  <Package className="w-3 h-3" /> Servicio
                </div>
              </th>
              <th className="px-6 py-6 text-left text-[10px] font-black uppercase tracking-[4px] text-slate-400 dark:text-slate-500 hidden xl:table-cell">
                <div className="flex items-center gap-2">
                  <MapPin className="w-3 h-3" /> Ubicación
                </div>
              </th>
              <th className="px-6 py-6 text-right text-[10px] font-black uppercase tracking-[4px] text-slate-400 dark:text-slate-500">Valores Core</th>
              <th className="px-6 py-6 text-center text-[10px] font-black uppercase tracking-[4px] text-slate-400 dark:text-slate-500">Status Master</th>
              <th className="px-8 py-6 text-center text-[10px] font-black uppercase tracking-[4px] text-slate-400 dark:text-slate-500">Control</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-white/5">
            {ventasCalc.map((venta, idx) => {
              const pvpValue = venta.pvpResuelto || indexers.productos[venta.producto_id]?.pvp || 0;
              const neto = venta._calc?.detalle?.netoColab || 0;
              const estadoStyle = getEstadoStyle(venta.estado);

              return (
                <motion.tr
                  key={venta.id || idx}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.03, ease: "easeOut" }}
                  whileHover={{ backgroundColor: "var(--brand-primary)", opacity: 0.05 }}
                  className="group relative transition-all duration-300"
                >
                  <td className="px-8 py-6 text-center">
                    <input
                      type="checkbox"
                      checked={Boolean(selectedIds?.includes(venta.id))}
                      onChange={() => onSelect && onSelect(venta.id)}
                      className="w-5 h-5 rounded-lg border-2 border-slate-200 dark:border-white/10 bg-transparent text-[var(--brand-primary)] focus:ring-[var(--brand-primary)]/20 transition-all cursor-pointer"
                    />
                  </td>

                  <td className="px-6 py-6">
                    <div className="flex flex-col gap-2">
                      <div className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-tight group-hover:text-[var(--brand-primary)] transition-colors">
                        {venta.cliente || "EXP_SIN_NOMBRE"}
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-white/[0.04] px-2 py-0.5 rounded-full border border-slate-200 dark:border-white/5 flex items-center gap-1">
                          <Calendar className="w-2.5 h-2.5" />
                          {formatDate(venta.fecha)}
                        </span>
                        {venta.cif && <span className="text-[10px] font-bold text-slate-400 tracking-widest opacity-60">· {venta.cif}</span>}
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-6">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-[1rem] bg-[var(--brand-primary)]/10 flex items-center justify-center border border-[var(--brand-primary)]/20 group-hover:scale-110 transition-transform duration-500 shadow-inner">
                        <Package className="w-5 h-5 text-[var(--brand-primary)]/70" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-black text-slate-700 dark:text-slate-300 truncate max-w-[200px]" title={getNombreProducto(venta)}>
                          {getNombreProducto(venta)}
                        </span>
                        <span className="text-[9px] font-black text-slate-400/80 uppercase tracking-[2px] mt-0.5">{getNombreOperador(venta)}</span>
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-6 hidden xl:table-cell">
                    <div className="flex flex-col gap-1.5">
                      <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <MapPin className="w-3 h-3 opacity-50 text-sky-500" />
                        {getNombreZona(venta)}
                      </span>
                      <span className="text-[9px] font-bold text-slate-400 uppercase truncate max-w-[150px]">
                        {getNombreColaborador(venta)}
                      </span>
                    </div>
                  </td>

                  <td className="px-6 py-6 text-right">
                    <div className="flex flex-col items-end gap-1">
                      <span className="text-sm font-black text-slate-800 dark:text-slate-100 tracking-tight">{formatCurrency(pvpValue)}</span>
                      <div className="px-2 py-0.5 bg-emerald-500/10 rounded-lg flex items-center gap-1.5 group-hover:scale-105 transition-transform duration-300 border border-emerald-500/10">
                        <Zap className="w-2.5 h-2.5 text-emerald-500" />
                        <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400">{formatCurrency(neto)}</span>
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-6 text-center">
                    <span className={cn(
                      "inline-flex items-center justify-center px-4 py-2 rounded-[1.25rem] text-[9px] font-black uppercase tracking-[2px] border transition-all duration-300 group-hover:shadow-lg",
                      estadoStyle
                    )}>
                      {venta.estado || "N/A"}
                    </span>
                  </td>

                  <td className="px-8 py-6 text-center">
                    <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-2 group-hover:translate-x-0">
                      <motion.button
                        whileHover={{ scale: 1.1, backgroundColor: "rgba(var(--brand-primary-rgb), 0.1)" }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => onView && onView(venta)}
                        className="p-3 rounded-2xl bg-white/50 dark:bg-white/[0.03] text-slate-500 dark:text-slate-400 hover:text-[var(--brand-primary)] border border-slate-200 dark:border-white/5 shadow-sm"
                      >
                        <Eye className="w-4 h-4" />
                      </motion.button>

                      {isAdmin && (
                        <div className="flex items-center gap-2 border-l border-slate-200 dark:border-white/5 pl-2">
                          <motion.button
                            whileHover={{ scale: 1.1, backgroundColor: "rgba(var(--brand-primary-rgb), 0.1)" }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => onEdit && onEdit(venta)}
                            className="p-3 rounded-2xl bg-white/50 dark:bg-white/[0.03] text-[var(--brand-primary)] border border-[var(--brand-primary)]/10 shadow-sm"
                          >
                            <Edit3 className="w-4 h-4" />
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.1, rotate: 90, backgroundColor: "rgba(244, 63, 94, 0.1)" }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => onDelete && onDelete(venta.id)}
                            className="p-3 rounded-2xl bg-rose-500/5 text-rose-500 border border-rose-500/10 shadow-sm"
                          >
                            <X className="w-4 h-4" />
                          </motion.button>
                        </div>
                      )}
                    </div>
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="p-8 bg-slate-50/80 dark:bg-white/[0.01] border-t border-slate-200 dark:border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-[var(--brand-primary)] animate-pulse" />
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-[4px]">Core v3.0 // Master Interface</span>
        </div>
        <div className="flex items-center gap-6">
          <div className="h-4 w-px bg-slate-200 dark:bg-white/10" />
          <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest hidden sm:block">
            Total Vista: {formatCurrency(ventasCalc.reduce((acc, v) => acc + (v.pvpResuelto || 0), 0))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default VentasTable;
