import React from "react";
import { Calendar } from "lucide-react";

function euro(n) {
  return (n ?? 0).toFixed(2) + " €";
}

export default function EvolucionTemporalPanel({ evolucionTemporal, periodoEvolucion, hayDatos }) {
  return (
    <div className="h-80 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-gray-700 dark:to-gray-800 rounded-xl p-4">
      {evolucionTemporal.length > 0 ? (
        <div className="h-full flex flex-col">
          <div className="text-xs text-slate-500 dark:text-gray-400 mb-4">
            {periodoEvolucion === 'anual' ? 'Por años' : periodoEvolucion === 'trimestral' ? 'Por trimestres' : 'Por meses'} •
            Total: {euro(evolucionTemporal.reduce((sum, [, data]) => sum + data.facturacion, 0))}
          </div>
          <div className="flex-1 space-y-2">
            {evolucionTemporal.map(([periodo, data]) => {
              const maxFacturacion = Math.max(...evolucionTemporal.map(([, d]) => d.facturacion));
              const percentage = maxFacturacion > 0 ? (data.facturacion / maxFacturacion) * 100 : 0;
              let displayName = periodo;
              if (periodoEvolucion === 'semestral') {
                displayName = new Date(periodo + '-01').toLocaleDateString('es-ES', { month: 'short', year: '2-digit' });
              } else if (periodoEvolucion === 'anual') {
                displayName = periodo;
              }
              return (
                <div key={periodo} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600 dark:text-gray-400 font-medium">{displayName}</span>
                    <div className="text-right">
                      <span className="font-semibold text-slate-800 dark:text-gray-200">{data.ventas}</span>
                      <span className="text-slate-500 dark:text-gray-400 ml-1">ventas</span>
                    </div>
                  </div>
                  <div className="flex justify-between text-xs text-slate-500 dark:text-gray-400 mb-1">
                    <span>Facturación: {euro(data.facturacion)}</span>
                    {hayDatos && data.margen > 0 && (
                      <span>Margen: {euro(data.margen)}</span>
                    )}
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-gray-600 rounded-full h-3">
                    <div
                      className="bg-gradient-to-r from-emerald-400 to-emerald-500 h-3 rounded-full transition-all duration-700 flex items-center justify-end pr-2"
                      style={{ width: `${Math.max(percentage, 8)}%` }}
                    >
                      {percentage > 25 && (
                        <span className="text-xs text-white font-medium">
                          {percentage.toFixed(0)}%
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="text-center py-8">
          <Calendar className="w-12 h-12 mx-auto text-slate-300 dark:text-gray-600 mb-4" />
          <h3 className="text-lg font-medium text-slate-600 dark:text-gray-400 mb-2">Sin datos temporales</h3>
          <p className="text-slate-500 dark:text-gray-500 text-sm mb-4">Registra ventas con fechas para ver la evolución</p>
        </div>
      )}
    </div>
  );
}
