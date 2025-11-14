import React from "react";
import { Target } from "lucide-react";
function euro(n) { return (n ?? 0).toFixed(2) + " €"; }
export default function TopProductosPanel({ topProductos, hayDatos, periodoAnalisis }) {
  return (
    <div className="space-y-3">
      {topProductos.length > 0 ? (
        topProductos.map((producto, index) => (
          <div key={producto.id} className="flex items-center justify-between p-3 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-gray-700 dark:to-gray-600 rounded-xl">
            <div className="flex items-center space-x-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-slate-700 dark:text-gray-200 text-sm font-bold ${index === 0 ? "bg-gradient-to-br from-emerald-200 to-emerald-300 dark:from-emerald-600 dark:to-emerald-700" : index === 1 ? "bg-gradient-to-br from-sky-200 to-sky-300 dark:from-sky-600 dark:to-sky-700" : "bg-gradient-to-br from-purple-200 to-purple-300 dark:from-purple-600 dark:to-purple-700"}`}>{index + 1}</div>
              <div>
                <p className="text-sm font-medium text-slate-700 dark:text-gray-200">{producto.nombre}</p>
                <p className="text-xs text-slate-500 dark:text-gray-400">{producto.familia} • {producto.ventas} vendidos</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold text-slate-800 dark:text-gray-200">{euro(producto.facturacion)}</p>
              {hayDatos && producto.margen > 0 && (
                <p className="text-xs text-slate-600 dark:text-gray-400">Margen: {euro(producto.margen)}</p>
              )}
            </div>
          </div>
        ))
      ) : (
        <div className="text-center py-8">
          <Target className="w-12 h-12 mx-auto text-slate-300 dark:text-gray-600 mb-4" />
          <h3 className="text-lg font-medium text-slate-600 dark:text-gray-400 mb-2">Sin datos de productos</h3>
          <p className="text-slate-500 dark:text-gray-500 text-sm mb-4">Registra ventas de productos para ver el ranking</p>
        </div>
      )}
    </div>
  );
}
