import { Edit2, Trash2 } from "lucide-react";

export default function ReglasTable({ reglas, operadores, productos, onEdit, onDelete }) {
  const getNombre = (arr, id) => arr.find((el) => el.id === id)?.nombre || "-";
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white border border-slate-200 rounded-xl">
        <thead>
          <tr className="bg-slate-50">
            <th className="py-2 px-4 text-left text-xs font-semibold text-slate-600">ID</th>
            <th className="py-2 px-4 text-left text-xs font-semibold text-slate-600">Nombre</th>
            <th className="py-2 px-4 text-left text-xs font-semibold text-slate-600">Operador</th>
            <th className="py-2 px-4 text-left text-xs font-semibold text-slate-600">Producto</th>
            <th className="py-2 px-4 text-left text-xs font-semibold text-slate-600">Sector</th>
            <th className="py-2 px-4 text-xs font-semibold text-slate-600">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {reglas.map((regla) => (
            <tr key={regla.id} className="border-t border-slate-100 hover:bg-slate-50">
              <td className="py-2 px-4 text-sm">{regla.id}</td>
              <td className="py-2 px-4 text-sm">{regla.nombre}</td>
              <td className="py-2 px-4 text-sm">{getNombre(operadores, regla.operador_id)}</td>
              <td className="py-2 px-4 text-sm">{getNombre(productos, regla.producto_id)}</td>
              <td className="py-2 px-4 text-sm capitalize">{regla.sector}</td>
              <td className="py-2 px-4 flex gap-2">
                <button
                  onClick={() => onEdit(regla)}
                  className="p-2 rounded-lg bg-emerald-100 text-emerald-700 hover:bg-emerald-200 transition-colors"
                  title="Editar"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onDelete(regla.id)}
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
