import React from "react";

export default function LiquidacionesGenerar({ periodo, setPeriodo, generar, setToast, showInactivos, setShowInactivos }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <label htmlFor="periodo" className="sr-only">Seleccionar periodo</label>
        <input
          id="periodo"
          type="month"
          className="border rounded-xl px-3 py-2"
          value={periodo}
          onChange={e => setPeriodo(e.target.value)}
          aria-label="Seleccionar periodo"
        />
        <button
          onClick={() => {
            generar();
            setToast && setToast({ message: 'Intentando generar liquidaciones...', type: 'info' });
          }}
          className="px-4 py-2 rounded-xl bg-emerald-500 text-white hover:bg-emerald-600 transition-colors"
          aria-label="Generar liquidaciones para el periodo seleccionado"
          role="button"
        >
          Generar Liquidaciones
        </button>
      </div>
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="showInactivos"
          checked={showInactivos}
          onChange={e => setShowInactivos(e.target.checked)}
          className="rounded"
          aria-checked={showInactivos}
          aria-label="Incluir colaboradores dados de baja en el período"
        />
        <label htmlFor="showInactivos" className="text-sm text-slate-600">
          Incluir colaboradores dados de baja en el período
        </label>
      </div>
    </div>
  );
}
