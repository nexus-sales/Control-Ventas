import React from "react";
import { Users } from "lucide-react";
function euro(n) { return (n ?? 0).toFixed(2) + " €"; }
export default function TopColaboradoresPanel({ topColaboradores, hayDatos }) {
  return (
    <div className="space-y-3">
      {topColaboradores.length > 0 ? (
        topColaboradores.map((colab, index) => (
          <div key={colab.id} className="flex items-center justify-between p-3 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-gray-700 dark:to-gray-600 rounded-xl">
            <div className="flex items-center space-x-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-slate-700 dark:text-gray-200 text-sm font-bold ${index === 0 ? "bg-gradient-to-br from-yellow-200 to-yellow-300 dark:from-yellow-600 dark:to-yellow-700" : index === 1 ? "bg-gradient-to-br from-slate-200 to-slate-300 dark:from-gray-500 dark:to-gray-600" : "bg-gradient-to-br from-orange-200 to-orange-300 dark:from-orange-600 dark:to-orange-700"}`}>{index + 1}</div>
              <div>
                <p className="text-sm font-medium text-slate-700 dark:text-gray-200">{colab.nombre}</p>
                <p className="text-xs text-slate-500 dark:text-gray-400">{colab.ventas} ventas</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold text-slate-800 dark:text-gray-200">{euro(colab.facturacion)}</p>
              {hayDatos && colab.neto > 0 && (
                <p className="text-xs text-slate-600 dark:text-gray-400">Neto: {euro(colab.neto)}</p>
              )}
            </div>
          </div>
        ))
      ) : (
        <div className="text-center py-8">
          <Users className="w-12 h-12 mx-auto text-slate-300 dark:text-gray-600 mb-4" />
          <h3 className="text-lg font-medium text-slate-600 dark:text-gray-400 mb-2">Sin datos de colaboradores</h3>
          <p className="text-slate-500 dark:text-gray-500 text-sm mb-4">Registra ventas asignadas a colaboradores</p>
        </div>
      )}
    </div>
  );
}
