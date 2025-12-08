import React, { useState } from "react";
import { X, Settings, Percent } from "lucide-react";

export default function OperadorEditModal({ operador, onSave, onClose }) {
  const [draft, setDraft] = useState(
    operador ? {
      ...operador,
      reglas_decomision: operador.reglas_decomision || {
        antes_6_meses: 100,
        despues_6_meses: 50,
        limite_meses: 6
      }
    } : {
      nombre: "",
      sector: "telefonia",
      codigo: "",
      contacto: "",
      telefono: "",
      email: "",
      fecha_alta: "",
      fecha_baja: "",
      observaciones: "",
      reglas_decomision: {
        antes_6_meses: 100,
        despues_6_meses: 50,
        limite_meses: 6
      },
      historial: [],
    }
  );

  const [error, setError] = useState("");

  const handleSave = () => {
    // LOG ELIMINADO
    
    if (!draft.nombre?.trim()) {
      setError("El nombre del operador es obligatorio");
      return;
    }

    const { antes_6_meses, despues_6_meses, limite_meses } = draft.reglas_decomision;
    if (antes_6_meses < 0 || antes_6_meses > 100) {
      setError("El porcentaje antes del límite debe estar entre 0 y 100");
      return;
    }
    if (despues_6_meses < 0 || despues_6_meses > 100) {
      setError("El porcentaje después del límite debe estar entre 0 y 100");
      return;
    }
    if (limite_meses < 1 || limite_meses > 24) {
      setError("El límite de meses debe estar entre 1 y 24");
      return;
    }

    // Si no existe id, generamos uno único (UUID simple)
    let operadorId = draft.id || `op-${Date.now()}-${Math.floor(Math.random()*10000)}`;

    const cleanedData = {
      ...draft,
      id: operadorId,
      nombre: draft.nombre.trim(),
      codigo: draft.codigo?.trim().toUpperCase() || "",
      contacto: draft.contacto?.trim() || "",
      email: draft.email?.trim() || "",
      telefono: draft.telefono?.trim() || "",
      reglas_decomision: {
        antes_6_meses: Number(draft.reglas_decomision.antes_6_meses) || 100,
        despues_6_meses: Number(draft.reglas_decomision.despues_6_meses) || 50,
        limite_meses: Number(draft.reglas_decomision.limite_meses) || 6
      }
    };

    onSave(cleanedData, true);
  };

  return (
    <div className="fixed inset-0 bg-black/40 dark:bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white dark:bg-darkCard rounded-xl shadow-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto relative text-slate-800 dark:text-darkText transition-colors">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full"
        >
          <X className="w-5 h-5 text-slate-500" />
        </button>

        <h2 className="text-xl font-bold mb-6 text-slate-800 dark:text-white">
          {operador ? `Editar Operador: ${operador.nombre}` : 'Crear Nuevo Operador'}
        </h2>

        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-xl text-red-700 dark:text-red-300 text-sm">
            {error}
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-4 mb-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Nombre *</label>
            <input
              className="border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-xl px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-green-400"
              value={draft.nombre}
              onChange={(e) => {
                setDraft((d) => ({ ...d, nombre: e.target.value }));
                setError("");
              }}
              placeholder="Ej: O2, VODAFONE, ORANGE..."
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Sector *</label>
            <select
              className="border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-xl px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-green-400"
              value={draft.sector}
              onChange={(e) => setDraft((d) => ({ ...d, sector: e.target.value }))}
            >
              <option value="telefonia">Telefonía</option>
              <option value="energia">Energía</option>
              <option value="seguridad">Seguridad</option>
              <option value="internet">Internet</option>
              <option value="seguros">Seguros</option>
              <option value="otros">Otros</option>
            </select>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Código</label>
            <input
              className="border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-xl px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-green-400"
              value={draft.codigo || ''}
              onChange={(e) => setDraft((d) => ({ ...d, codigo: e.target.value }))}
              placeholder="Código interno"
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Contacto</label>
            <input
              className="border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-xl px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-green-400"
              value={draft.contacto || ''}
              onChange={(e) => setDraft((d) => ({ ...d, contacto: e.target.value }))}
              placeholder="Persona de contacto"
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Teléfono</label>
            <input
              className="border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-xl px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-green-400"
              value={draft.telefono || ''}
              onChange={(e) => setDraft((d) => ({ ...d, telefono: e.target.value }))}
              placeholder="Teléfono de contacto"
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Email</label>
            <input
              type="email"
              className="border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-xl px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-green-400"
              value={draft.email || ''}
              onChange={(e) => setDraft((d) => ({ ...d, email: e.target.value }))}
              placeholder="email@operador.com"
            />
          </div>
        </div>

        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-xl">
          <div className="flex items-center mb-3">
            <Settings className="w-5 h-5 mr-2 text-red-600 dark:text-red-400" />
            <h3 className="font-semibold text-red-800 dark:text-red-300">Reglas de Decomisión</h3>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Antes de {draft.reglas_decomision.limite_meses} meses (%)
              </label>
              <input
                className="border border-red-200 dark:border-red-600 dark:bg-red-900/20 dark:text-white rounded-xl px-3 py-2 w-full"
                type="number"
                min="0"
                max="100"
                value={draft.reglas_decomision.antes_6_meses}
                onChange={(e) =>
                  setDraft((d) => ({ 
                    ...d, 
                    reglas_decomision: { 
                      ...d.reglas_decomision, 
                      antes_6_meses: e.target.value 
                    } 
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Después de {draft.reglas_decomision.limite_meses} meses (%)
              </label>
              <input
                className="border border-red-200 dark:border-red-600 dark:bg-red-900/20 dark:text-white rounded-xl px-3 py-2 w-full"
                type="number"
                min="0"
                max="100"
                value={draft.reglas_decomision.despues_6_meses}
                onChange={(e) =>
                  setDraft((d) => ({ 
                    ...d, 
                    reglas_decomision: { 
                      ...d.reglas_decomision, 
                      despues_6_meses: e.target.value 
                    } 
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Límite (meses)</label>
              <input
                className="border border-red-200 dark:border-red-600 dark:bg-red-900/20 dark:text-white rounded-xl px-3 py-2 w-full"
                type="number"
                min="1"
                max="24"
                value={draft.reglas_decomision.limite_meses}
                onChange={(e) =>
                  setDraft((d) => ({ 
                    ...d, 
                    reglas_decomision: { 
                      ...d.reglas_decomision, 
                      limite_meses: e.target.value 
                    } 
                  }))
                }
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-600">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-xl text-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-700"
          >
            Guardar Cambios
          </button>
        </div>
      </div>
    </div>
  );
}