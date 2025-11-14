import React from "react";
import { BarChart3, PieChart, Award } from "lucide-react";
function euro(n) { return (n ?? 0).toFixed(2) + " €"; }
export default function ProductividadPanel({ colaboradores, total, topColaboradores, topProductos, facturacionTotal, margen, comBruta, hayDatos }) {
  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-gray-700 dark:to-gray-600 p-4 rounded-xl">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-semibold text-slate-700 dark:text-gray-200">Productividad por Colaborador</h4>
          <BarChart3 className="w-4 h-4 text-slate-600 dark:text-gray-400" />
        </div>
        <div className="text-2xl font-bold text-slate-800 dark:text-gray-200 mb-1">
          {colaboradores.length > 0 && total > 0 
            ? (total / topColaboradores.length || 1).toFixed(1)
            : 0
          } ventas
        </div>
        <p className="text-xs text-slate-500 dark:text-gray-400">Promedio por colaborador activo</p>
      </div>
      <div className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-gray-700 dark:to-gray-600 p-4 rounded-xl">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-semibold text-slate-700 dark:text-gray-200">Facturación por Producto</h4>
          <PieChart className="w-4 h-4 text-slate-600 dark:text-gray-400" />
        </div>
        <div className="text-2xl font-bold text-slate-800 dark:text-gray-200 mb-1">
          {topProductos.length > 0 
            ? euro(facturacionTotal / topProductos.length)
            : euro(0)
          }
        </div>
        <p className="text-xs text-slate-500 dark:text-gray-400">Promedio por producto vendido</p>
      </div>
      {hayDatos && (
        <div className="bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/30 p-4 rounded-xl">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold text-slate-700 dark:text-gray-200">Eficiencia de Margen</h4>
            <Award className="w-4 h-4 text-green-600 dark:text-green-400" />
          </div>
          <div className="text-2xl font-bold text-slate-800 dark:text-gray-200 mb-1">
            {comBruta > 0 ? ((margen / comBruta) * 100).toFixed(1) : 0}%
          </div>
          <p className="text-xs text-slate-500 dark:text-gray-400">Margen empresa vs comisión bruta</p>
        </div>
      )}
    </div>
  );
}
