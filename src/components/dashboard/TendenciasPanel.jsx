import React from "react";
import { Calendar, TrendingUp, Target, Users } from "lucide-react";
export default function TendenciasPanel({ evolucionTemporal, periodoEvolucion, topProductos, topColaboradores }) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="bg-gradient-to-br from-cyan-50 to-cyan-100 dark:from-cyan-900/30 dark:to-cyan-800/30 p-4 rounded-xl">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-slate-700 dark:text-gray-200">Promedio por Período</span>
          <Calendar className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
        </div>
        <p className="text-lg font-bold text-slate-800 dark:text-gray-200">
          {evolucionTemporal.length > 0 
            ? (evolucionTemporal.reduce((sum, [, data]) => sum + data.ventas, 0) / evolucionTemporal.length).toFixed(1)
            : 0
          } ventas
        </p>
        <p className="text-xs text-slate-500 dark:text-gray-400">
          Por {periodoEvolucion === 'anual' ? 'año' : periodoEvolucion === 'trimestral' ? 'trimestre' : 'mes'}
        </p>
      </div>
      <div className="bg-gradient-to-br from-teal-50 to-teal-100 dark:from-teal-900/30 dark:to-teal-800/30 p-4 rounded-xl">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-slate-700 dark:text-gray-200">Mejor Período</span>
          <TrendingUp className="w-4 h-4 text-teal-600 dark:text-teal-400" />
        </div>
        <p className="text-lg font-bold text-slate-800 dark:text-gray-200">
          {evolucionTemporal.length > 0 
            ? Math.max(...evolucionTemporal.map(([, data]) => data.ventas))
            : 0
          } ventas
        </p>
        <p className="text-xs text-slate-500 dark:text-gray-400">
          {evolucionTemporal.length > 0 
            ? (() => {
                const mejorPeriodo = evolucionTemporal.find(([, data]) => 
                  data.ventas === Math.max(...evolucionTemporal.map(([, d]) => d.ventas))
                )?.[0];
                if (periodoEvolucion === 'semestral') {
                  return new Date(mejorPeriodo + '-01')?.toLocaleDateString('es-ES', { month: 'short', year: 'numeric' }) || '';
                } else if (periodoEvolucion === 'anual') {
                  return mejorPeriodo;
                } else {
                  return mejorPeriodo;
                }
              })()
            : 'N/A'
          }
        </p>
      </div>
      <div className="bg-gradient-to-br from-violet-50 to-violet-100 dark:from-violet-900/30 dark:to-violet-800/30 p-4 rounded-xl">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-slate-700 dark:text-gray-200">Productos Activos</span>
          <Target className="w-4 h-4 text-violet-600 dark:text-violet-400" />
        </div>
        <p className="text-lg font-bold text-slate-800 dark:text-gray-200">
          {topProductos.length}
        </p>
        <p className="text-xs text-slate-500 dark:text-gray-400">Con ventas</p>
      </div>
      <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/30 dark:to-orange-800/30 p-4 rounded-xl">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-slate-700 dark:text-gray-200">Colab. Activos</span>
          <Users className="w-4 h-4 text-orange-600 dark:text-orange-400" />
        </div>
        <p className="text-lg font-bold text-slate-800 dark:text-gray-200">
          {topColaboradores.length}
        </p>
        <p className="text-xs text-slate-500 dark:text-gray-400">Con ventas</p>
      </div>
    </div>
  );
}
