import React, { useState, useEffect } from 'react';
import { DollarSign, X, Save } from 'lucide-react';
import Card from '../../ui/Card';

export function PvpEditModal({ 
  isOpen, 
  onClose, 
  onSave,
  productoId,
  productoNombre,
  pvpInicial = 0
}) {
  const [pvp, setPvp] = useState(pvpInicial);

  useEffect(() => {
    if (isOpen) {
      setPvp(pvpInicial);
    }
  }, [isOpen, pvpInicial]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(productoId, pvp);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="max-w-md w-full bg-white">
        <div className="border-b border-slate-200 pb-4 mb-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-amber-600" />
              Definir PVP del Producto
            </h3>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-slate-600" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} aria-label="Formulario para editar el PVP del producto">
          <div className="space-y-4">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <p className="text-sm text-amber-800" id="nota-pvp">
                <strong>Nota:</strong> Este PVP se aplicará a todas las ventas de este producto. Es el precio que paga el cliente, no la comisión.
              </p>
            </div>

            <div>
              <label className="text-sm text-slate-500" id="label-producto" htmlFor="pvp-producto-nombre">Producto</label>
              <p className="font-medium text-slate-800" id="pvp-producto-nombre" tabIndex={0} aria-labelledby="label-producto">
                {productoNombre}
              </p>
            </div>

            <div>
              <label className="text-sm text-slate-500" htmlFor="pvp-input">
                PVP (Precio de Venta al Público) *
              </label>
              <div className="relative">
                <input
                  id="pvp-input"
                  type="number"
                  step="0.01"
                  min="0"
                  className="border border-slate-200 rounded-lg px-3 py-2 w-full pr-8 focus:outline-none focus:ring-2 focus:ring-amber-400"
                  value={pvp}
                  onChange={(e) => setPvp(e.target.value)}
                  placeholder="45.00"
                  required
                  aria-label="Precio de venta al público"
                  aria-describedby="nota-pvp"
                  autoFocus
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" aria-hidden="true">
                  €
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Ejemplo: Fibra 1GB = 45€/mes, Fibra 300MB = 30€/mes
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors"
              aria-label="Cancelar edición de PVP"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-lg hover:from-amber-600 hover:to-amber-700 transition-all"
              aria-label="Guardar PVP"
            >
              <Save className="w-4 h-4" aria-hidden="true" />
              Guardar PVP
            </button>
          </div>
        </form>
      </Card>
    </div>
  );
}
