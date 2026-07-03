import { Edit2, Trash2 } from "lucide-react";
import { normalizeFactor } from "../../utils/calculos";

export default function NivelesTable({ niveles, onEdit, onDelete }) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white border border-slate-200 rounded-xl">
        <thead>
          <tr className="bg-slate-50">
            <th className="py-2 px-4 text-left text-xs font-semibold text-slate-600">ID</th>
            <th className="py-2 px-4 text-left text-xs font-semibold text-slate-600">Nombre</th>
            <th className="py-2 px-4 text-left text-xs font-semibold text-slate-600">Tipo</th>
            <th className="py-2 px-4 text-left text-xs font-semibold text-slate-600">Telefonía (%)</th>
            <th className="py-2 px-4 text-left text-xs font-semibold text-slate-600">Energía (%)</th>
            <th className="py-2 px-4 text-left text-xs font-semibold text-slate-600">Seguridad (€)</th>
            <th className="py-2 px-4 text-xs font-semibold text-slate-600">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {niveles.map((nivel) => (
            <tr key={nivel.id} className="border-t border-slate-100 hover:bg-slate-50">
              <td className="py-2 px-4 text-sm">{nivel.id}</td>
              <td className="py-2 px-4 text-sm">{nivel.nombre}</td>
              <td className="py-2 px-4 text-sm">{nivel.tipo}</td>
              <td className="py-2 px-4 text-sm">{((normalizeFactor(nivel.pct_telefonia) ?? 0) * 100).toFixed(0)}%</td>
              <td className="py-2 px-4 text-sm">{((normalizeFactor(nivel.pct_energia) ?? 0) * 100).toFixed(0)}%</td>
              <td className="py-2 px-4 text-sm">€{nivel.fijo_seguridad}</td>
              <td className="py-2 px-4 flex gap-2">
                <button
                  onClick={() => onEdit(nivel)}
                  className="p-2 rounded-lg bg-emerald-100 text-emerald-700 hover:bg-emerald-200 transition-colors"
                  title="Editar"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onDelete(nivel.id)}
                  className="p-2 rounded-lg bg-rose-100 text-rose-700 hover:bg-rose-200 transition-colors"
                  title="Eliminar"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
