import React from 'react';
import { Plus, Trash2, AlertCircle } from 'lucide-react';
import { glassStyles } from '../../utils/designUtils';

export function VentasActions({
  ventasCount,
  selectedIds,
  onNewVenta,
  onDeleteSelected,
  isAdmin = true,
  ventasSinPvp = 0
}) {
  return (
    <div className="space-y-4">
      {/* Aviso si hay productos sin PVP */}
      {ventasSinPvp > 0 && isAdmin && (
        <div className={`${glassStyles} bg-amber-50/50 border-amber-200/50 dark:bg-amber-900/20 dark:border-amber-700/30 p-4 rounded-2xl flex items-start gap-3`}>
          <div className="p-2 bg-amber-100 dark:bg-amber-900/50 rounded-xl">
            <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
          </div>
          <div>
            <p className="text-amber-900 dark:text-amber-100 font-bold text-sm uppercase tracking-wide">
              Atención: Productos sin PVP definido
            </p>
            <p className="text-amber-700 dark:text-amber-300 text-xs mt-1 font-medium leading-relaxed">
              Hay <span className="font-black">{ventasSinPvp}</span> ventas con productos que no tienen PVP definido.
              Puedes definir el PVP haciendo clic en el botón de edición en la columna PVP de cada venta.
            </p>
          </div>
        </div>
      )}

      {/* Acciones principales */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <h3 className="text-xl font-black text-slate-800 dark:text-white tracking-tight">
            Gestión de Ventas
          </h3>
        </div>

        <div className="flex gap-2 w-full sm:w-auto">
          {isAdmin && selectedIds.length > 0 && (
            <button
              onClick={onDeleteSelected}
              className="flex-1 sm:flex-none justify-center flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-rose-500 to-rose-600 text-white rounded-xl hover:from-rose-600 hover:to-rose-700 transition-all shadow-lg hover:shadow-rose-500/30 active:scale-95 text-xs font-bold uppercase tracking-widest"
            >
              <Trash2 className="w-4 h-4" />
              Eliminar ({selectedIds.length})
            </button>
          )}
          <button
            onClick={onNewVenta}
            className="flex-1 sm:flex-none justify-center flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-sky-500 to-blue-600 text-white rounded-xl hover:from-sky-600 hover:to-blue-700 transition-all shadow-lg hover:shadow-sky-500/30 active:scale-95 text-xs font-bold uppercase tracking-widest"
          >
            <Plus className="w-5 h-5" />
            Nueva Venta
          </button>
        </div>
      </div>
    </div>
  );
}

