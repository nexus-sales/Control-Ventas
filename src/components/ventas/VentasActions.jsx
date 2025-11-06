import React from 'react';
import { Plus, Trash2, AlertCircle } from 'lucide-react';
import Card from '../ui/Card';

export function VentasActions({
  ventasCount,
  selectedIds,
  onNewVenta,
  onDeleteSelected,
  isSupabaseAvailable,
  isAdmin = true,
  ventasSinPvp = 0
}) {
  return (
    <div className="space-y-4">
      {/* Aviso si hay productos sin PVP */}
      {ventasSinPvp > 0 && isAdmin && (
        <Card className="bg-amber-50 border-amber-200">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-amber-800 font-medium">
                Atención: Productos sin PVP definido
              </p>
              <p className="text-amber-700 text-sm mt-1">
                Hay {ventasSinPvp} ventas con productos que no tienen PVP definido. 
                Puedes definir el PVP haciendo clic en el botón de edición en la columna PVP de cada venta.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Acciones principales */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <h3 className="text-lg font-semibold text-slate-800">
            Gestión de Ventas ({ventasCount})
          </h3>
          {isSupabaseAvailable && (
            <span className="text-green-600 text-sm flex items-center gap-1">
              🟢 Supabase conectado
            </span>
          )}
        </div>
        
        <div className="flex gap-2">
          {isAdmin && selectedIds.length > 0 && (
            <button
              onClick={onDeleteSelected}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-rose-500 to-rose-600 text-white rounded-xl hover:from-rose-600 hover:to-rose-700 transition-all shadow-lg"
            >
              <Trash2 className="w-4 h-4" />
              Eliminar seleccionadas ({selectedIds.length})
            </button>
          )}
          <button
            onClick={onNewVenta}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-sky-500 to-sky-600 text-white rounded-xl hover:from-sky-600 hover:to-sky-700 transition-all shadow-lg hover:shadow-xl"
          >
            <Plus className="w-5 h-5" />
            Nueva Venta
          </button>
        </div>
      </div>
    </div>
  );
}
