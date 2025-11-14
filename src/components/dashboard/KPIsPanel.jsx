import React from "react";
import { Euro, TrendingUp, Target, BarChart3 } from "lucide-react";

function euro(n) {
  return (n ?? 0).toFixed(2) + " €";
}

export default function KPIsPanel({ kpis, hayDatos, total, ticketMedio, facturacionTotal, byEstado, crecimiento }) {
  const { comBruta, comPagada, margen } = kpis;
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* KPI: Comisión Bruta / Facturación Total */}
      <div className="bg-gradient-to-br from-sky-200 to-sky-300 dark:from-sky-700 dark:to-sky-800 rounded-2xl p-6 text-slate-700 dark:text-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-slate-600 dark:text-gray-400 text-sm font-medium">
              {hayDatos ? "Comisión Bruta" : "Facturación Total"}
            </p>
            <p className="text-3xl font-bold">
              {hayDatos ? euro(comBruta) : euro(facturacionTotal)}
            </p>
            <p className="text-slate-600 dark:text-gray-400 text-xs mt-1">
              {hayDatos ? (
                `${crecimiento >= 0 ? "+" : ""}${crecimiento.toFixed(1)}% vs anterior`
              ) : (
                `${total} ventas registradas`
              )}
            </p>
          </div>
          <Euro className="w-8 h-8 text-slate-500 dark:text-gray-400" />
        </div>
      </div>
      {/* KPI: Comisión Pagada / Ticket Medio */}
      <div className="bg-gradient-to-br from-emerald-200 to-emerald-300 dark:from-emerald-700 dark:to-emerald-800 rounded-2xl p-6 text-slate-700 dark:text-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-slate-600 dark:text-gray-400 text-sm font-medium">
              {hayDatos ? "Comisión Pagada" : "Ticket Medio"}
            </p>
            <p className="text-3xl font-bold">
              {hayDatos ? euro(comPagada) : euro(ticketMedio)}
            </p>
            <p className="text-slate-600 dark:text-gray-400 text-xs mt-1">
              {hayDatos ? "A colaboradores (neto)" : "Por venta"}
            </p>
          </div>
          <TrendingUp className="w-8 h-8 text-slate-500 dark:text-gray-400" />
        </div>
      </div>
      {/* KPI: Margen Empresa / Ventas Cerradas */}
      <div className="bg-gradient-to-br from-purple-200 to-purple-300 dark:from-purple-700 dark:to-purple-800 rounded-2xl p-6 text-slate-700 dark:text-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-slate-600 dark:text-gray-400 text-sm font-medium">
              {hayDatos ? "Margen Empresa" : "Ventas Cerradas"}
            </p>
            <p className="text-3xl font-bold">
              {hayDatos ? euro(margen) : (byEstado.Cerrada || 0)}
            </p>
            <p className="text-slate-600 dark:text-gray-400 text-xs mt-1">
              {hayDatos ? (
                `${comBruta > 0 ? ((margen / comBruta) * 100).toFixed(0) : 0}% del total`
              ) : (
                `${total > 0 ? (((byEstado.Cerrada || 0) / total) * 100).toFixed(1) : 0}% del total`
              )}
            </p>
          </div>
          <Target className="w-8 h-8 text-slate-500 dark:text-gray-400" />
        </div>
      </div>
      {/* KPI: Ventas Totales / Ventas Liquidadas */}
      <div className="bg-gradient-to-br from-rose-200 to-rose-300 dark:from-rose-700 dark:to-rose-800 rounded-2xl p-6 text-slate-700 dark:text-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-slate-600 dark:text-gray-400 text-sm font-medium">
              {hayDatos ? "Ventas Totales" : "Ventas Liquidadas"}
            </p>
            <p className="text-3xl font-bold">
              {hayDatos ? total : (byEstado.Liquidada || 0)}
            </p>
            <p className="text-slate-600 dark:text-gray-400 text-xs mt-1">
              {hayDatos ? `Ticket: ${euro(ticketMedio)}` : "Completamente procesadas"}
            </p>
          </div>
          <BarChart3 className="w-8 h-8 text-slate-500 dark:text-gray-400" />
        </div>
      </div>
    </div>
  );
}
