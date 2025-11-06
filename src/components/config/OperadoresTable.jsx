import React from "react";
import Card from "../ui/Card";
import { Edit3, Trash2 } from "lucide-react";

export default function OperadoresTable({
  operadores = [],
  customFields = [],
  getSectorIcon,
  getSectorColor,
  getSectorName,
  onEdit,
  onDelete,
  sectorStats = {},
}) {
  return (
    <Card className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="bg-slate-100 dark:bg-green-900/30">
            <th className="px-3 py-2 text-left font-semibold text-slate-700 dark:text-green-100">Nombre</th>
            <th className="px-3 py-2 text-left font-semibold text-slate-700 dark:text-blue-200">Sector</th>
            <th className="px-3 py-2 text-left font-semibold text-slate-700 dark:text-purple-200">Código</th>
            <th className="px-3 py-2 text-left font-semibold text-slate-700 dark:text-pink-200">Contacto</th>
            <th className="px-3 py-2 text-left font-semibold text-slate-700 dark:text-yellow-200">Teléfono</th>
            <th className="px-3 py-2 text-left font-semibold text-slate-700 dark:text-orange-200">Email</th>
            {customFields.map(cf => (
              <th key={cf.id} className="px-3 py-2 text-left font-semibold text-slate-700 dark:text-teal-200">{cf.nombre}</th>
            ))}
            <th className="px-3 py-2 text-center font-semibold text-slate-700 dark:text-white">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {operadores.length === 0 ? (
            <tr>
              <td colSpan={7 + customFields.length} className="text-center py-8 text-slate-400 dark:text-green-100">No hay operadores registrados.</td>
            </tr>
          ) : (
            operadores.map(op => (
              <tr key={op.id} className="border-b border-slate-100 dark:border-green-900/30">
                <td className="px-3 py-2 font-medium flex items-center gap-2 dark:text-green-100">
                  {getSectorIcon && getSectorIcon(op.sector)}
                  {op.nombre}
                </td>
                <td className={`px-3 py-2 ${getSectorColor ? getSectorColor(op.sector) : ''} rounded-full font-semibold dark:text-blue-200`}>{getSectorName ? getSectorName(op.sector) : op.sector}</td>
                <td className="px-3 py-2 dark:text-purple-200">{op.codigo}</td>
                <td className="px-3 py-2 dark:text-pink-200">{op.contacto}</td>
                <td className="px-3 py-2 dark:text-yellow-200">{op.telefono}</td>
                <td className="px-3 py-2 dark:text-orange-200">{op.email}</td>
                {customFields.map(cf => (
                  <td key={cf.id} className="px-3 py-2 dark:text-teal-200">{op.customFields?.[cf.id] ?? ""}</td>
                ))}
                <td className="px-3 py-2 text-center">
                  <button
                    className="inline-flex items-center px-2 py-1 text-blue-600 dark:text-blue-200 hover:underline mr-2"
                    onClick={() => onEdit && onEdit(op)}
                    title="Editar"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    className="inline-flex items-center px-2 py-1 text-red-600 dark:text-pink-300 hover:underline"
                    onClick={() => onDelete && onDelete(op.id)}
                    title="Eliminar"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
      {/* Estadísticas por sector (opcional) */}
      {sectorStats && Object.keys(sectorStats).length > 0 && (
        <div className="mt-4 flex gap-4 flex-wrap">
          {Object.entries(sectorStats).map(([sector, count]) => (
            <span key={sector} className="px-3 py-1 bg-slate-200 dark:bg-darkAccent/20 rounded-full text-xs text-slate-700 dark:text-darkText">
              {getSectorName ? getSectorName(sector) : sector}: {count}
            </span>
          ))}
        </div>
      )}
    </Card>
  );
}
