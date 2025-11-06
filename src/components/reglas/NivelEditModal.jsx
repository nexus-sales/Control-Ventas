import { useState } from "react";
import { Layers, X, Phone, Zap, Shield, Save } from "lucide-react";

export default function NivelEditModal({ nivel, onSave, onClose }) {
  const [draft, setDraft] = useState(
    nivel || {
      id: "",
      nombre: "",
      pct_telefonia: 0.5,
      pct_energia: 0.5,
      fijo_seguridad: 15,
      descripcion: "",
      tipo: "COMERCIAL",
    }
  );
  const [error, setError] = useState("");

  const handleSave = () => {
    if (!draft.id.trim() || !draft.nombre.trim()) {
      setError("ID y nombre son obligatorios");
      return;
    }
    if (isNaN(Number(draft.pct_telefonia)) || isNaN(Number(draft.pct_energia)) || isNaN(Number(draft.fijo_seguridad))) {
      setError("Los valores de comisión deben ser números");
      return;
    }

    const cleanedData = {
      ...draft,
      id: draft.id.trim().toUpperCase(),
      nombre: draft.nombre.trim(),
      pct_telefonia: Number(draft.pct_telefonia),
      pct_energia: Number(draft.pct_energia),
      fijo_seguridad: Number(draft.fijo_seguridad),
      descripcion: draft.descripcion?.trim() || "",
    };

    onSave(cleanedData, true);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-2 hover:bg-slate-100 rounded-full"
        >
          <X className="w-5 h-5 text-slate-500" />
        </button>

        <h2 className="text-xl font-bold mb-6 text-slate-800 flex items-center gap-2">
          <Layers className="w-6 h-6 text-emerald-600" />
          {nivel ? `Editar Nivel: ${nivel.nombre}` : 'Nuevo Nivel'}
        </h2>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
            {error}
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-4 mb-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">ID del Nivel *</label>
            <input
              className="border border-slate-200 rounded-xl px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-emerald-400"
              placeholder="GOLD"
              value={draft.id}
              onChange={(e) => setDraft(d => ({ ...d, id: e.target.value.toUpperCase() }))}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Nombre *</label>
            <input
              className="border border-slate-200 rounded-xl px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-emerald-400"
              placeholder="Gold"
              value={draft.nombre}
              onChange={(e) => setDraft(d => ({ ...d, nombre: e.target.value }))}
            />
          </div>
        </div>

        <div className="space-y-2 mb-6">
          <label className="text-sm font-medium text-slate-700">Tipo</label>
          <select
            className="border border-slate-200 rounded-xl px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-emerald-400"
            value={draft.tipo}
            onChange={(e) => setDraft(d => ({ ...d, tipo: e.target.value }))}
          >
            <option value="COMERCIAL">Comercial</option>
            <option value="SUPERVISOR">Supervisor</option>
            <option value="MANAGER">Manager</option>
          </select>
        </div>

        {/* Comisiones por sector */}
        <div className="mb-6 p-4 bg-slate-50 border border-slate-200 rounded-xl">
          <h3 className="font-semibold text-slate-800 mb-4">Comisiones por Sector</h3>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                <Phone className="w-4 h-4 text-blue-600" />
                Telefonía (%)
              </label>
              <input
                className="border border-slate-200 rounded-xl px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-emerald-400"
                type="number"
                step="0.01"
                min="0"
                max="1"
                placeholder="0.75"
                value={draft.pct_telefonia}
                onChange={(e) => setDraft(d => ({ ...d, pct_telefonia: e.target.value }))}
              />
              <p className="text-xs text-slate-500">Ej: 0.75 = 75%</p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                <Zap className="w-4 h-4 text-yellow-600" />
                Energía (%)
              </label>
              <input
                className="border border-slate-200 rounded-xl px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-emerald-400"
                type="number"
                step="0.01"
                min="0"
                max="1"
                placeholder="0.60"
                value={draft.pct_energia}
                onChange={(e) => setDraft(d => ({ ...d, pct_energia: e.target.value }))}
              />
              <p className="text-xs text-slate-500">Ej: 0.60 = 60%</p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                <Shield className="w-4 h-4 text-green-600" />
                Seguridad (€ fijo)
              </label>
              <input
                className="border border-slate-200 rounded-xl px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-emerald-400"
                type="number"
                step="1"
                min="0"
                placeholder="15"
                value={draft.fijo_seguridad}
                onChange={(e) => setDraft(d => ({ ...d, fijo_seguridad: e.target.value }))}
              />
              <p className="text-xs text-slate-500">Ej: 15 = 15€</p>
            </div>
          </div>
        </div>

        <div className="space-y-2 mb-6">
          <label className="text-sm font-medium text-slate-700">Descripción</label>
          <textarea
            className="border border-slate-200 rounded-xl px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-emerald-400"
            rows="2"
            placeholder="Descripción opcional del nivel"
            value={draft.descripcion}
            onChange={(e) => setDraft(d => ({ ...d, descripcion: e.target.value }))}
          />
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-slate-300 rounded-xl text-slate-600 hover:bg-slate-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl hover:from-emerald-600 hover:to-emerald-700 flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            Guardar Nivel
          </button>
        </div>
      </div>
    </div>
  );
}
