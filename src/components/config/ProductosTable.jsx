import React from "react";
import Card from "../ui/Card";
import { Edit3, Trash2 } from "lucide-react";

export default function ProductosTable({
  productos = [],
  customFields = [],
  operadores = [],
  onEdit,
  onDelete,
  getSectorIcon,
}) {
  return (
    <Card className="overflow-x-auto">
  <table className="min-w-full text-sm">
        <thead>
          <tr className="bg-slate-100 dark:bg-purple-900/30">
            <th className="px-3 py-2 text-left font-semibold text-slate-700 dark:text-purple-100">Nombre</th>
            <th className="px-3 py-2 text-left font-semibold text-slate-700 dark:text-pink-200">Familia</th>
            <th className="px-3 py-2 text-left font-semibold text-slate-700 dark:text-green-200">Operador</th>
            <th className="px-3 py-2 text-left font-semibold text-slate-700 dark:text-blue-200">PVP</th>
            <th className="px-3 py-2 text-left font-semibold text-slate-700 dark:text-yellow-200">Tipo Comisión</th>
            <th className="px-3 py-2 text-left font-semibold text-slate-700 dark:text-orange-200">Valor Comisión</th>
            {customFields.map(cf => (
              <th key={cf.id} className="px-3 py-2 text-left font-semibold text-slate-700 dark:text-teal-200">{cf.nombre}</th>
            ))}
            <th className="px-3 py-2 text-center font-semibold text-slate-700 dark:text-white">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {productos.length === 0 ? (
            <tr>
              <td colSpan={7 + customFields.length} className="text-center py-8 text-slate-400 dark:text-slate-200">No hay productos registrados.</td>
            </tr>
          ) : (
            productos.map(prod => (
              <tr key={prod.id} className="border-b border-slate-100 dark:border-purple-900/30">
                <td className="px-3 py-2 font-medium dark:text-purple-100">{prod.nombre}</td>
                <td className="px-3 py-2 dark:text-pink-200">{prod.familia}</td>
                <td className="px-3 py-2 flex items-center gap-2 dark:text-green-200">
                  {getSectorIcon && getSectorIcon(prod.operador_id)}
                  {operadores.find(op => op.id === prod.operador_id)?.nombre || "Sin operador"}
                </td>
                <td className="px-3 py-2 dark:text-blue-200">{prod.pvp}</td>
                <td className="px-3 py-2 dark:text-yellow-200">{prod.comision_tipo}</td>
                <td className="px-3 py-2 dark:text-orange-200">{prod.comision_valor}</td>
                {customFields.map(cf => (
                  <td key={cf.id} className="px-3 py-2 dark:text-teal-200">{prod.customFields?.[cf.id] ?? ""}</td>
                ))}
                <td className="px-3 py-2 text-center">
                  <button
                    className="inline-flex items-center px-2 py-1 text-blue-600 dark:text-purple-300 hover:underline mr-2"
                    onClick={() => onEdit && onEdit(prod)}
                    title="Editar"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    className="inline-flex items-center px-2 py-1 text-red-600 dark:text-pink-300 hover:underline"
                    onClick={() => onDelete && onDelete(prod.id)}
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
    </Card>
  );
}
