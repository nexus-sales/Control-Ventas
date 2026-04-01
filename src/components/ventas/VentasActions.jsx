import React from 'react';
import { Plus, Trash2, AlertCircle, ShoppingBag, Sparkles } from 'lucide-react';
import { glassStyles } from '../../utils/designUtils';
import { cn } from '../../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

export function VentasActions({
  ventasCount: _ventasCount,
  selectedIds,
  onNewVenta,
  onDeleteSelected,
  isAdmin = true,
  ventasSinPvp = 0
}) {
  return (
    <div className="space-y-6">
      {/* Aviso si hay productos sin PVP */}
      <AnimatePresence>
        {ventasSinPvp > 0 && isAdmin && (
          <motion.div
            initial={{ opacity: 0, height: 0, y: -20 }}
            animate={{ opacity: 1, height: 'auto', y: 0 }}
            exit={{ opacity: 0, height: 0, y: -20 }}
            className={cn(
              glassStyles(),
              "bg-amber-500/5 border-amber-500/20 dark:bg-amber-500/5 p-5 rounded-[2rem] flex items-start gap-4 shadow-xl shadow-amber-500/5"
            )}
          >
            <div className="p-3 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl shadow-lg shadow-amber-500/20">
              <AlertCircle className="w-6 h-6 text-white flex-shrink-0 animate-pulse" />
            </div>
            <div className="flex-1">
              <p className="text-amber-800 dark:text-amber-200 font-black text-sm uppercase tracking-[2px]">
                Configuración Requerida
              </p>
              <p className="text-amber-700/80 dark:text-amber-400/80 text-xs mt-1 font-bold leading-relaxed max-w-2xl">
                Se han detectado <span className="text-amber-900 dark:text-amber-100 font-black decoration-double underline">{ventasSinPvp} operaciones</span> con valoración pendiente (PVP 0.00€).
                Es fundamental regularizar estos valores para garantizar la integridad de las liquidaciones.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Barra de Herramientas */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 bg-slate-100/30 dark:bg-white/[0.02] p-2 rounded-[2.5rem] border border-slate-200/50 dark:border-white/5 backdrop-blur-sm">
        <div className="flex items-center gap-5 px-6 py-2">
          <div className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-900 flex items-center justify-center shadow-lg border border-slate-200/50 dark:border-slate-800">
            <ShoppingBag className="w-6 h-6 text-blue-500" />
          </div>
          <div>
            <h3 className="text-xl font-black text-slate-800 dark:text-white tracking-widest uppercase"> Terminal</h3>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[3px]">Acciones de Registro</p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full lg:w-auto p-2">
          <AnimatePresence>
            {isAdmin && selectedIds.length > 0 && (
              <motion.button
                initial={{ opacity: 0, scale: 0.9, x: 20 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.9, x: 20 }}
                onClick={onDeleteSelected}
                className="flex-1 lg:flex-none justify-center flex items-center gap-2 px-8 py-4 bg-rose-500 text-white rounded-[1.5rem] hover:bg-rose-600 transition-all shadow-xl shadow-rose-500/20 active:scale-95 text-[10px] font-black uppercase tracking-[2px]"
              >
                <Trash2 className="w-4 h-4" />
                Purgar Selección ({selectedIds.length})
              </motion.button>
            )}
          </AnimatePresence>

          <motion.button
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={onNewVenta}
            className="flex-1 lg:flex-none justify-center flex items-center gap-3 px-10 py-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-700 text-white rounded-[1.5rem] shadow-2xl shadow-blue-500/30 hover:shadow-blue-500/40 transition-all text-[10px] font-black uppercase tracking-[3px] group"
          >
            <div className="relative">
              <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-500" />
              <Sparkles className="w-3 h-3 text-yellow-300 absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            Registrar Operación
          </motion.button>
        </div>
      </div>
    </div>
  );
}

