import React from "react";
import { MapPin } from "lucide-react";

function euro(n) {
  return (n ?? 0).toFixed(2) + " €";
}

export default function GeoDistributionPanel({ byZona, hayDatos }) {
  return (
    <div className="space-y-3">
      {byZona.length > 0 ? (
        byZona.map(([zona, data]) => (
          <div key={zona} className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 rounded-xl">
            <div className="flex items-center space-x-3">
              <MapPin className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <div>
                <p className="text-sm font-medium text-slate-700 dark:text-gray-200">{zona}</p>
                <p className="text-xs text-slate-500 dark:text-gray-400">{data.ventas} ventas</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold text-slate-800 dark:text-gray-200">{euro(data.facturacion)}</p>
              <p className="text-xs text-slate-600 dark:text-gray-400">Impuestos: {euro(data.impuestos)}</p>
            </div>
          </div>
        ))
      ) : (
        <div className="text-center py-8">
          <MapPin className="w-12 h-12 mx-auto text-blue-300 dark:text-blue-600 mb-4" />
          <h3 className="text-lg font-medium text-slate-600 dark:text-gray-400 mb-2">Sin datos geográficos</h3>
          <p className="text-slate-500 dark:text-gray-500 text-sm mb-4">Define zonas y asígnalas a tus ventas</p>
        </div>
      )}
    </div>
  );
}
