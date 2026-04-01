import React, { useState } from 'react';
import { Eye, X, Edit3, User, Briefcase, MapPin, Calendar, CreditCard, PieChart, Info, Sparkles, ShieldCheck, Clock, AlertCircle, Phone, ShoppingBag } from 'lucide-react';
import { euro } from '../../../utils/designUtils';
import { cn } from '../../../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import Modal from '../../ui/Modal';

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

const InfoChip = ({ icon: Icon, label, value, color = "blue" }) => {
  const colorClasses = {
    blue: "text-blue-600 bg-blue-500/10 border-blue-500/20",
    emerald: "text-emerald-600 bg-emerald-500/10 border-emerald-500/20",
    amber: "text-amber-600 bg-amber-500/10 border-amber-500/20",
    purple: "text-purple-600 bg-purple-500/10 border-purple-500/20",
    slate: "text-slate-600 bg-slate-500/10 border-slate-500/20"
  };

  return (
    <div className={cn("p-4 rounded-3xl border flex items-center gap-4 transition-all hover:shadow-lg", colorClasses[color] || colorClasses.blue)}>
      <div className="p-2.5 rounded-2xl bg-white dark:bg-slate-900 shadow-inner">
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-[10px] font-black uppercase tracking-[2px] opacity-70 mb-0.5">{label}</p>
        <p className="text-sm font-black text-slate-800 dark:text-white truncate">{value || '---'}</p>
      </div>
    </div>
  );
};


export function VentaDetailModal({
  isOpen,
  onClose,
  onEdit,
  venta,
  productos = [],
  colaboradores = [],
  zonas = [],
  isVentaBlocked
}) {
  const [activeTab, setActiveTab] = useState('info');

  if (!venta) return null;

  // Funciones para obtener nombres por ID o desde campos precalculados
  const getProductoNombre = () =>
    venta.productoNombre ||
    productos.find((p) => p?.id === venta.producto_id)?.nombre ||
    venta.producto_id;

  const getZonaNombre = () =>
    venta.zonaNombre ||
    zonas.find((z) => z?.id === venta.zona_id)?.nombre ||
    venta.zona_id;

  const getColaboradorNombre = () =>
    venta.colaboradorNombre ||
    colaboradores.find((c) => c?.id === venta.colaborador_id)?.nombre ||
    venta.colaborador_id;

  const producto = productos.find((p) => p?.id === venta.producto_id);
  const pvpValue = producto?.pvp || venta.pvp || 0;
  const blocked = isVentaBlocked ? isVentaBlocked(venta) : false;

  const getEstadoBadge = (estado) => {
    const configs = {
      ACTIVO: { color: "bg-emerald-500", text: "Verificado", icon: ShieldCheck },
      PENDIENTE: { color: "bg-amber-500", text: "Pendiente", icon: Clock },
      CANCELADA: { color: "bg-rose-500", text: "Anulada", icon: X },
      INCIDENCIA: { color: "bg-orange-500", text: "Incidencia", icon: AlertCircle },
    };
    const config = configs[estado] || { color: "bg-slate-500", text: estado, icon: Info };

    return (
      <div className={cn("flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[2px] text-white shadow-lg", config.color)}>
        <config.icon className="w-3.5 h-3.5" />
        {config.text}
      </div>
    );
  };

  // Calcular comisiones correctamente
  const comisionBase = venta._calc?.detalle?.comBase || producto?.comision_valor || 0;
  const comisionBruta = venta._calc?.detalle?.comBruta || 0;
  const comisionNeta = venta._calc?.detalle?.netoColab || 0;
  const irpf = venta._calc?.detalle?.irpf || 0;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Expediente"
      subtitle={`Ref: ${venta.id?.slice(0, 8) || 'N/A'}`}
      headerExtra={getEstadoBadge(venta.estado)}
      icon={Eye}
      maxWidth="max-w-4xl"
    >
      <div className="flex flex-col h-full">
        {/* Navigation Tabs */}
        <div className="flex gap-8 border-b border-slate-200/50 dark:border-white/5 mb-8">
          {[
            { id: 'info', label: 'Operativa', icon: Briefcase },
            { id: 'comisiones', label: 'Liquidación', icon: CreditCard },
            { id: 'extras', label: 'Metadatos', icon: Sparkles },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-2 py-4 text-[10px] font-black uppercase tracking-[3px] border-b-2 transition-all relative",
                activeTab === tab.id
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-slate-400 hover:text-slate-600"
              )}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
              {activeTab === tab.id && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 shadow-[0_0_10px_rgba(37,99,235,0.5)]"
                />
              )}
            </button>
          ))}
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 min-h-0">
          <AnimatePresence mode="wait">
            {activeTab === 'info' && (
              <motion.div
                key="info"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="grid grid-cols-1 md:grid-cols-2 gap-8"
              >
                <div className="space-y-6">
                  <h4 className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[4px] text-slate-400">
                    <User className="w-3.5 h-3.5" /> Titular de la Operación
                  </h4>
                  <div className="grid grid-cols-1 gap-4">
                    <InfoChip icon={User} label="Cliente" value={venta.cliente} color="slate" />
                    <InfoChip icon={Info} label="DNI/CIF" value={venta.cif} color="blue" />
                    <div className="grid grid-cols-2 gap-4">
                      <InfoChip icon={Phone} label="Móvil" value={venta.telefono_movil} color="emerald" />
                      <InfoChip icon={Calendar} label="Fecha Registro" value={formatDate(venta.fecha)} color="amber" />
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <h4 className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[4px] text-slate-400">
                    <ShoppingBag className="w-3.5 h-3.5" /> Servicio Contratado
                  </h4>
                  <div className="grid grid-cols-1 gap-4">
                    <InfoChip icon={Briefcase} label="Producto Master" value={getProductoNombre()} color="purple" />
                    <div className="grid grid-cols-2 gap-4">
                      <InfoChip icon={MapPin} label="Región" value={getZonaNombre()} color="slate" />
                      <InfoChip icon={User} label="Agente" value={getColaboradorNombre()} color="blue" />
                    </div>
                  </div>
                </div>

                {venta.observaciones && (
                  <div className="col-span-1 md:col-span-2 space-y-3">
                    <h4 className="text-[10px] font-black uppercase tracking-[4px] text-slate-400 flex items-center gap-2">
                      <Info className="w-3.5 h-3.5" /> Observaciones del Sistema
                    </h4>
                    <div className="p-6 rounded-[2rem] bg-amber-500/5 border border-amber-500/10 text-slate-700 dark:text-amber-200/70 text-sm font-medium leading-relaxed italic">
                      "{venta.observaciones}"
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'comisiones' && (
              <motion.div
                key="comisiones"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="space-y-8"
              >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="p-6 rounded-[2rem] bg-blue-500/5 border border-blue-500/10 flex flex-col items-center text-center">
                    <p className="text-[10px] font-black uppercase tracking-[3px] text-blue-600 mb-2">Comisión Bruta</p>
                    <p className="text-3xl font-black text-slate-800 dark:text-white tracking-tighter">{euro(comisionBruta)}</p>
                  </div>
                  <div className="p-6 rounded-[2rem] bg-rose-500/5 border border-rose-500/10 flex flex-col items-center text-center">
                    <p className="text-[10px] font-black uppercase tracking-[3px] text-rose-600 mb-2">Soporte IRPF</p>
                    <p className="text-3xl font-black text-slate-800 dark:text-white tracking-tighter">-{euro(irpf)}</p>
                  </div>
                  <div className="p-6 rounded-[2rem] bg-emerald-500/5 border border-emerald-500/10 flex flex-col items-center text-center shadow-xl shadow-emerald-500/10">
                    <p className="text-[10px] font-black uppercase tracking-[3px] text-emerald-600 mb-2">Neto Agencia</p>
                    <p className="text-3xl font-black text-slate-800 dark:text-white tracking-tighter">{euro(comisionNeta)}</p>
                  </div>
                </div>

                <div className="p-8 rounded-[2.5rem] bg-slate-100/30 dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 space-y-6">
                  <h4 className="text-[10px] font-black uppercase tracking-[4px] text-slate-400">Desglose de Facturación</h4>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center px-4 py-2 hover:bg-white dark:hover:bg-slate-900 rounded-2xl transition-all">
                      <span className="text-sm font-bold text-slate-500 uppercase tracking-widest">Base de Producto</span>
                      <span className="text-sm font-black text-slate-800 dark:text-white tracking-[2px]">{euro(comisionBase)}</span>
                    </div>
                    <div className="flex justify-between items-center px-4 py-2 hover:bg-white dark:hover:bg-slate-900 rounded-2xl transition-all">
                      <span className="text-sm font-bold text-slate-500 uppercase tracking-widest">PVP Declarado</span>
                      <span className="text-sm font-black text-blue-600 tracking-[2px]">{euro(pvpValue)}</span>
                    </div>
                    <div className="h-px bg-slate-200 dark:bg-white/5 my-2" />
                    <div className="flex justify-between items-center px-4">
                      <span className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-[3px]">Margen Neto Final</span>
                      <span className="text-xl font-black text-emerald-600 tracking-[3px]">{euro(comisionNeta)}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'extras' && (
              <motion.div
                key="extras"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="space-y-6"
              >
                <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-[2.5rem] border border-dashed border-slate-300 dark:border-white/10">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {venta.extras && Object.keys(venta.extras).length > 0 ? (
                      Object.entries(venta.extras).map(([key, value]) => (
                        <div key={key} className="p-5 rounded-3xl bg-white dark:bg-slate-900 shadow-sm border border-slate-100 dark:border-white/5">
                          <p className="text-[9px] font-black uppercase tracking-[3px] text-slate-400 mb-1">{key}</p>
                          <p className="text-xs font-black text-slate-800 dark:text-white break-all">{String(value)}</p>
                        </div>
                      ))
                    ) : (
                      <div className="col-span-full py-20 text-center opacity-40">
                        <PieChart className="w-12 h-12 mx-auto mb-4" />
                        <p className="text-[10px] font-black uppercase tracking-[4px]">No existen metadatos adicionales</p>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer Actions */}
        <div className="mt-8 flex justify-end gap-4 pt-8 border-t border-slate-200/50 dark:border-white/5">
          {!blocked && onEdit && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                onClose();
                onEdit(venta);
              }}
              className="px-8 py-4 bg-blue-600 text-white rounded-[1.5rem] shadow-xl shadow-blue-600/20 hover:bg-blue-700 transition-all text-[10px] font-black uppercase tracking-[3px] flex items-center gap-3"
            >
              <Edit3 className="w-4 h-4" />
              Editar Expediente
            </motion.button>
          )}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onClose}
            className="px-8 py-4 bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-[1.5rem] hover:bg-slate-300 dark:hover:bg-slate-700 transition-all text-[10px] font-black uppercase tracking-[3px]"
          >
            Cerrar Terminal
          </motion.button>
        </div>
      </div>
    </Modal>
  );
}