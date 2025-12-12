import { useState } from "react";
import { X, Layers } from "lucide-react";

export default function ReglaEditModal({ regla, onSave, onClose, operadores, productos }) {
  const [draft, setDraft] = useState(
    regla || {
      id: "",
      nombre: "",
      operador_id: "",
      producto_id: "",
      sector: "telefonia",
      descripcion: "",
      activo: true,
    }
  );
  const [error, setError] = useState("");

  const handleSave = () => {
    if (!draft.id.trim() || !draft.nombre.trim()) {
      setError("ID y nombre son obligatorios");
      return;
    }
    if (!draft.operador_id || !draft.producto_id) {
      setError("Debes seleccionar operador y producto");
      return;
    }
    const cleanedData = {
      ...draft,
      id: draft.id.trim().toUpperCase(),
      nombre: draft.nombre.trim(),
      descripcion: draft.descripcion?.trim() || "",
    };
    onSave(cleanedData, true);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 dark:bg-slate-900/80 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl p-6 w-full max-w-2xl relative border border-transparent dark:border-slate-700">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full"
        >
          <X className="w-5 h-5 text-slate-500 dark:text-slate-300" />
        </button>
        <h2 className="text-xl font-bold mb-6 text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <Layers className="w-6 h-6 text-emerald-600" />
          {regla ? `Editar Regla: ${regla.nombre}` : 'Nueva Regla'}
        </h2>
        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-400/40 rounded-xl text-red-700 dark:text-red-300 text-sm">
            {error}
          </div>
        )}
        <div className="grid md:grid-cols-2 gap-4 mb-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-200">ID de la Regla *</label>
            <input
              className="border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-emerald-400 dark:bg-slate-950 dark:text-slate-100"
              placeholder="R001"
              value={draft.id}
              onChange={(e) => setDraft(d => ({ ...d, id: e.target.value.toUpperCase() }))}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Nombre *</label>
            <input
              className="border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-emerald-400 dark:bg-slate-950 dark:text-slate-100"
              placeholder="Regla ejemplo"
              value={draft.nombre}
              onChange={(e) => setDraft(d => ({ ...d, nombre: e.target.value }))}
            />
          </div>
        </div>
        <div className="grid md:grid-cols-2 gap-4 mb-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Operador *</label>
            <select
              className="border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-emerald-400 dark:bg-slate-950 dark:text-slate-100"
              value={draft.operador_id}
              onChange={(e) => setDraft(d => ({ ...d, operador_id: e.target.value }))}
            >
              <option value="">Selecciona operador</option>
              {operadores.map(op => (
                <option key={op.id} value={op.id}>{op.nombre}</option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Producto *</label>
            <select
              className="border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-emerald-400 dark:bg-slate-950 dark:text-slate-100"
              value={draft.producto_id}
              onChange={(e) => setDraft(d => ({ ...d, producto_id: e.target.value }))}
            >
              <option value="">Selecciona producto</option>
              {productos.map(pr => (
                <option key={pr.id} value={pr.id}>{pr.nombre}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="space-y-2 mb-6">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Sector</label>
          <select
            className="border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-emerald-400 dark:bg-slate-950 dark:text-slate-100"
            value={draft.sector}
            onChange={(e) => setDraft(d => ({ ...d, sector: e.target.value }))}
          >
            <option value="telefonia">Telefonía</option>
            <option value="energia">Energía</option>
            <option value="seguridad">Seguridad</option>
          </select>
        </div>
        <div className="space-y-2 mb-6">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Descripción</label>
          <textarea
            className="border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-emerald-400 dark:bg-slate-950 dark:text-slate-100"
            rows="2"
            placeholder="Descripción opcional de la regla"
            value={draft.descripcion}
            onChange={(e) => setDraft(d => ({ ...d, descripcion: e.target.value }))}
          />
        </div>
        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-xl text-slate-600 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl hover:from-emerald-600 hover:to-emerald-700 flex items-center gap-2"
          >
            Guardar Regla
          </button>
        </div>
      </div>
    </div>
  );
}
