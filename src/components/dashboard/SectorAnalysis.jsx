import React from "react";
import { PieChart } from "lucide-react";

function euro(n) {
  return (n ?? 0).toFixed(2) + " €";
}

export default function SectorAnalysis({ bySector, hayDatos }) {
  return (
    <div className="space-y-3">
      {bySector.length > 0 ? (
        bySector.map(([sector, data]) => (
          <div key={sector} className="flex items-center justify-between p-3 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-gray-700 dark:to-gray-600 rounded-xl">
            <div>
              <p className="text-sm font-medium text-slate-700 dark:text-gray-200 capitalize">{sector}</p>
              <p className="text-xs text-slate-500 dark:text-gray-400">{data.ventas} ventas</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold text-slate-800 dark:text-gray-200">{euro(data.facturacion)}</p>
              {hayDatos && data.bruto > 0 && (
                <p className="text-xs text-slate-600 dark:text-gray-400">Com: {euro(data.bruto)}</p>
              )}
            </div>
          </div>
        ))
      ) : (
        <div className="text-center py-8">
          <PieChart className="w-12 h-12 mx-auto text-slate-300 dark:text-gray-600 mb-4" />
          <h3 className="text-lg font-medium text-slate-600 dark:text-gray-400 mb-2">Sin datos por sector</h3>
          <p className="text-slate-500 dark:text-gray-500 text-sm mb-4">Añade operadores y productos para ver análisis por sector</p>
        </div>
      )}
    </div>
  );
}
