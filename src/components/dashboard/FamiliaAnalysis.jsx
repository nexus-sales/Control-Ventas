import React from "react";
import { Target } from "lucide-react";

function euro(n) {
  return (n ?? 0).toFixed(2) + " €";
}

export default function FamiliaAnalysis({ byFamilia, hayDatos }) {
  return (
    <div className="space-y-3">
      {byFamilia.length > 0 ? (
        byFamilia.map(([familia, data]) => (
          <div key={familia} className="flex items-center justify-between p-3 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-gray-700 dark:to-gray-600 rounded-xl">
            <div>
              <p className="text-sm font-medium text-slate-700 dark:text-gray-200">{familia}</p>
              <p className="text-xs text-slate-500 dark:text-gray-400">{data.ventas} productos vendidos</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold text-slate-800 dark:text-gray-200">{euro(data.facturacion)}</p>
              {hayDatos && data.margen > 0 && (
                <p className="text-xs text-slate-600 dark:text-gray-400">Margen: {euro(data.margen)}</p>
              )}
            </div>
          </div>
        ))
      ) : (
        <div className="text-center py-8">
          <Target className="w-12 h-12 mx-auto text-slate-300 dark:text-gray-600 mb-4" />
          <h3 className="text-lg font-medium text-slate-600 dark:text-gray-400 mb-2">Sin datos por familia</h3>
          <p className="text-slate-500 dark:text-gray-500 text-sm mb-4">Clasifica tus productos por familia para ver este análisis</p>
        </div>
      )}
    </div>
  );
}
