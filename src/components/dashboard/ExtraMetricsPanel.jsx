import React from "react";
import { Euro, TrendingUp, Award, PieChart } from "lucide-react";
function euro(n) { return (n ?? 0).toFixed(2) + " €"; }
export default function ExtraMetricsPanel({ ticketMedio, irpfMedio, total, byEstado, margen, facturacionTotal, hayDatos }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <div className="flex items-center justify-between p-3 bg-gradient-to-r from-amber-50 to-amber-100 dark:from-amber-900/30 dark:to-amber-800/30 rounded-xl">
        <div>
          <p className="text-sm font-medium text-slate-700 dark:text-gray-200">Ticket Medio</p>
          <p className="text-xl font-bold text-slate-800 dark:text-gray-200">{euro(ticketMedio)}</p>
          <p className="text-xs text-slate-500 dark:text-gray-400">Por venta</p>
        </div>
        <Euro className="w-6 h-6 text-amber-600 dark:text-amber-400" />
      </div>
      <div className="flex items-center justify-between p-3 bg-gradient-to-r from-indigo-50 to-indigo-100 dark:from-indigo-900/30 dark:to-indigo-800/30 rounded-xl">
        <div>
          <p className="text-sm font-medium text-slate-700 dark:text-gray-200">IRPF Medio</p>
          <p className="text-xl font-bold text-slate-800 dark:text-gray-200">{hayDatos ? `${irpfMedio.toFixed(1)}%` : "N/A"}</p>
          <p className="text-xs text-slate-500 dark:text-gray-400">Retención fiscal</p>
        </div>
        <TrendingUp className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
      </div>
      <div className="flex items-center justify-between p-3 bg-gradient-to-r from-emerald-50 to-emerald-100 dark:from-emerald-900/30 dark:to-emerald-800/30 rounded-xl">
        <div>
          <p className="text-sm font-medium text-slate-700 dark:text-gray-200">Tasa Cierre</p>
          <p className="text-xl font-bold text-slate-800 dark:text-gray-200">{total > 0 ? (((byEstado.Cerrada || 0) / total) * 100).toFixed(1) : 0}%</p>
          <p className="text-xs text-slate-500 dark:text-gray-400">Conversión a cerrado</p>
        </div>
        <Award className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
      </div>
      <div className="flex items-center justify-between p-3 bg-gradient-to-r from-rose-50 to-rose-100 dark:from-rose-900/30 dark:to-rose-800/30 rounded-xl">
        <div>
          <p className="text-sm font-medium text-slate-700 dark:text-gray-200">Rentabilidad</p>
          <p className="text-xl font-bold text-slate-800 dark:text-gray-200">{hayDatos && facturacionTotal > 0 ? `${((margen / facturacionTotal) * 100).toFixed(1)}%` : "N/A"}</p>
          <p className="text-xs text-slate-500 dark:text-gray-400">Margen sobre ventas</p>
        </div>
        <PieChart className="w-6 h-6 text-rose-600 dark:text-rose-400" />
      </div>
    </div>
  );
}
