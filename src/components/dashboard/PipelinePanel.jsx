import React from "react";
import { AlertCircle } from "lucide-react";
export default function PipelinePanel({ byEstado, total }) {
  const estados = [
    { label: "Borradores", count: byEstado.Borrador || 0, color: "bg-amber-300 dark:bg-amber-600", textColor: "text-amber-800 dark:text-amber-200" },
    { label: "Confirmadas", count: byEstado.Confirmada || 0, color: "bg-emerald-300 dark:bg-emerald-600", textColor: "text-emerald-800 dark:text-emerald-200" },
    { label: "Cerradas", count: byEstado.Cerrada || 0, color: "bg-sky-300 dark:bg-sky-600", textColor: "text-sky-800 dark:text-sky-200" },
    { label: "Liquidadas", count: byEstado.Liquidada || 0, color: "bg-purple-300 dark:bg-purple-600", textColor: "text-purple-800 dark:text-purple-200" },
  ];
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {estados.map((item) => (
        <div key={item.label} className="text-center p-4 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-gray-700 dark:to-gray-800 rounded-xl">
          <div className={`w-12 h-12 mx-auto mb-2 rounded-full ${item.color} flex items-center justify-center`}>
            <span className={`text-lg font-bold ${item.textColor}`}>{item.count}</span>
          </div>
          <p className="text-sm font-medium text-slate-700 dark:text-gray-200">{item.label}</p>
          <p className="text-xs text-slate-500 dark:text-gray-400">
            {total > 0 ? ((item.count / total) * 100).toFixed(1) : 0}% del total
          </p>
        </div>
      ))}
    </div>
  );
}
