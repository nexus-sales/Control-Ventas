import { useState } from "react";
import { Layers, X, Phone, Zap, Shield, Save } from "lucide-react";

export default function NivelEditModal({ nivel, onSave, onClose }) {
  const [draft, setDraft] = useState(
    nivel ? {
      // Fallback genérico para sectores fuera de Telefonía/Energía/Seguridad
      // (getColaboradorComision, calculos.js) — un nivel guardado antes de
      // este fix puede no tener estos dos campos; se completan aquí también
      // al editar, no solo al crear, para no dejar el <input> sin valor.
      comision_tipo: "porcentaje",
      comision_valor: 0.5,
      ...nivel,
    } : {
      id: "",
      nombre: "",
      pct_telefonia: 0.5,
      pct_energia: 0.5,
      fijo_seguridad: 15,
      comision_tipo: "porcentaje",
      comision_valor: 0.5,
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
    if (
      isNaN(Number(draft.pct_telefonia)) || isNaN(Number(draft.pct_energia)) ||
      isNaN(Number(draft.fijo_seguridad)) || isNaN(Number(draft.comision_valor))
    ) {
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
      comision_valor: Number(draft.comision_valor),
      descripcion: draft.descripcion?.trim() || "",
    };

    onSave(cleanedData, true);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 text-slate-800 dark:text-gray-100 border border-slate-200 dark:border-gray-700 rounded-xl shadow-2xl p-6 w-full max-w-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-2 hover:bg-slate-100 dark:hover:bg-gray-800 rounded-full text-slate-500 dark:text-gray-400"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-xl font-bold mb-6 text-slate-800 dark:text-gray-100 flex items-center gap-2">
          <Layers className="w-6 h-6 text-emerald-600" />
          {nivel ? `Editar Nivel: ${nivel.nombre}` : 'Nuevo Nivel'}
        </h2>

        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-xl text-red-700 dark:text-red-300 text-sm">
            {error}
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-4 mb-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 dark:text-gray-300">ID del Nivel *</label>
            <input
              className="border border-slate-200 dark:border-gray-700 rounded-xl px-3 py-2 w-full bg-white dark:bg-gray-800 text-slate-900 dark:text-gray-100 placeholder-slate-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-400 dark:focus:ring-emerald-500"
              placeholder="GOLD"
              value={draft.id}
              onChange={(e) => setDraft(d => ({ ...d, id: e.target.value.toUpperCase() }))}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 dark:text-gray-300">Nombre *</label>
            <input
              className="border border-slate-200 dark:border-gray-700 rounded-xl px-3 py-2 w-full bg-white dark:bg-gray-800 text-slate-900 dark:text-gray-100 placeholder-slate-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-400 dark:focus:ring-emerald-500"
              placeholder="Gold"
              value={draft.nombre}
              onChange={(e) => setDraft(d => ({ ...d, nombre: e.target.value }))}
            />
          </div>
        </div>

        <div className="space-y-2 mb-6">
          <label className="text-sm font-medium text-slate-700 dark:text-gray-300">Tipo</label>
          <select
            className="border border-slate-200 dark:border-gray-700 rounded-xl px-3 py-2 w-full bg-white dark:bg-gray-800 text-slate-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-400 dark:focus:ring-emerald-500"
            value={draft.tipo}
            onChange={(e) => setDraft(d => ({ ...d, tipo: e.target.value }))}
          >
            <option value="COMERCIAL">Comercial</option>
            <option value="SUPERVISOR">Supervisor</option>
            <option value="MANAGER">Manager</option>
          </select>
        </div>

        {/* Comisiones por sector */}
        <div className="mb-6 p-4 bg-slate-50 dark:bg-gray-800/50 border border-slate-200 dark:border-gray-700 rounded-xl">
          <h3 className="font-semibold text-slate-800 dark:text-gray-100 mb-4">Comisiones por Sector</h3>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-gray-300 flex items-center gap-2">
                <Phone className="w-4 h-4 text-blue-600" />
                Telefonía (%)
              </label>
              <input
                className="border border-slate-200 dark:border-gray-700 rounded-xl px-3 py-2 w-full bg-white dark:bg-gray-800 text-slate-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-400 dark:focus:ring-emerald-500"
                type="number"
                step="0.01"
                min="0"
                max="1"
                placeholder="0.75"
                value={draft.pct_telefonia}
                onChange={(e) => setDraft(d => ({ ...d, pct_telefonia: e.target.value }))}
              />
              <p className="text-xs text-slate-500 dark:text-gray-400">Ej: 0.75 = 75%</p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-gray-300 flex items-center gap-2">
                <Zap className="w-4 h-4 text-yellow-600" />
                Energía (%)
              </label>
              <input
                className="border border-slate-200 dark:border-gray-700 rounded-xl px-3 py-2 w-full bg-white dark:bg-gray-800 text-slate-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-400 dark:focus:ring-emerald-500"
                type="number"
                step="0.01"
                min="0"
                max="1"
                placeholder="0.60"
                value={draft.pct_energia}
                onChange={(e) => setDraft(d => ({ ...d, pct_energia: e.target.value }))}
              />
              <p className="text-xs text-slate-500 dark:text-gray-400">Ej: 0.60 = 60%</p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-gray-300 flex items-center gap-2">
                <Shield className="w-4 h-4 text-green-600" />
                Seguridad (€ fijo)
              </label>
              <input
                className="border border-slate-200 dark:border-gray-700 rounded-xl px-3 py-2 w-full bg-white dark:bg-gray-800 text-slate-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-400 dark:focus:ring-emerald-500"
                type="number"
                step="1"
                min="0"
                placeholder="15"
                value={draft.fijo_seguridad}
                onChange={(e) => setDraft(d => ({ ...d, fijo_seguridad: e.target.value }))}
              />
              <p className="text-xs text-slate-500 dark:text-gray-400">Ej: 15 = 15€</p>
            </div>
          </div>
        </div>

        {/* Fallback para sectores fuera de Telefonía/Energía/Seguridad
            (getColaboradorComision, calculos.js) — sin esto, esos sectores
            caían siempre al 50% fijo sin poder configurarse. */}
        <div className="mb-6 p-4 bg-slate-50 dark:bg-gray-800/50 border border-slate-200 dark:border-gray-700 rounded-xl">
          <h3 className="font-semibold text-slate-800 dark:text-gray-100 mb-1">Comisión Genérica</h3>
          <p className="text-xs text-slate-500 dark:text-gray-400 mb-4">Se aplica a cualquier sector que no sea Telefonía, Energía o Seguridad.</p>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-gray-300">Tipo</label>
              <select
                className="border border-slate-200 dark:border-gray-700 rounded-xl px-3 py-2 w-full bg-white dark:bg-gray-800 text-slate-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-400 dark:focus:ring-emerald-500"
                value={draft.comision_tipo}
                onChange={(e) => setDraft(d => ({ ...d, comision_tipo: e.target.value }))}
              >
                <option value="porcentaje">Porcentaje</option>
                <option value="fijo">Importe Fijo</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-gray-300">
                Valor {draft.comision_tipo === 'fijo' ? '(€)' : '(0-1)'}
              </label>
              <input
                className="border border-slate-200 dark:border-gray-700 rounded-xl px-3 py-2 w-full bg-white dark:bg-gray-800 text-slate-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-400 dark:focus:ring-emerald-500"
                type="number"
                step="0.01"
                min="0"
                placeholder={draft.comision_tipo === 'fijo' ? '15' : '0.50'}
                value={draft.comision_valor}
                onChange={(e) => setDraft(d => ({ ...d, comision_valor: e.target.value }))}
              />
            </div>
          </div>
        </div>

        <div className="space-y-2 mb-6">
          <label className="text-sm font-medium text-slate-700 dark:text-gray-300">Descripción</label>
          <textarea
            className="border border-slate-200 dark:border-gray-700 rounded-xl px-3 py-2 w-full bg-white dark:bg-gray-800 text-slate-900 dark:text-gray-100 placeholder-slate-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-400 dark:focus:ring-emerald-500"
            rows="2"
            placeholder="Descripción opcional del nivel"
            value={draft.descripcion}
            onChange={(e) => setDraft(d => ({ ...d, descripcion: e.target.value }))}
          />
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-slate-300 dark:border-gray-600 rounded-xl text-slate-600 dark:text-gray-200 hover:bg-slate-50 dark:hover:bg-gray-800"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl hover:from-emerald-600 hover:to-emerald-700 dark:from-emerald-600 dark:to-emerald-700 dark:hover:from-emerald-700 dark:hover:to-emerald-800 flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            Guardar Nivel
          </button>
        </div>
      </div>
    </div>
  );
}
