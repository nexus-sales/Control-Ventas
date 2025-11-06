import React, { useState } from "react";
import Card from "../ui/Card";
import { MapPin, Plus, Save, Edit3, X, Check, Trash2 } from "lucide-react";

// Modal avanzado para editar zona
function ZonaEditModal({ zona, onSave, onClose }) {
  const [draft, setDraft] = useState(
    zona ? {
      nombre: zona.nombre || "",
      codigo: zona.codigo || "",
      impuesto_tipo: zona.impuesto_tipo || "",
      impuesto_pct: zona.impuesto_pct || "",
      descripcion: zona.descripcion || "",
      historial: zona.historial || [],
      id: zona.id
    } : {
      nombre: "",
      codigo: "",
      impuesto_tipo: "",
      impuesto_pct: "",
      descripcion: "",
      historial: [],
    },
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-lg relative">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-2 hover:bg-slate-100 rounded-full"
        >
          <X className="w-5 h-5 text-slate-500" />
        </button>
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <MapPin className="w-6 h-6 text-blue-500" /> Editar Zona
        </h2>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">
              Nombre *
            </label>
            <input
              className="border border-slate-200 rounded-xl px-3 py-2 w-full"
              value={draft.nombre || ""}
              onChange={(e) =>
                setDraft((d) => ({ ...d, nombre: e.target.value }))
              }
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Código</label>
            <input
              className="border border-slate-200 rounded-xl px-3 py-2 w-full"
              value={draft.codigo || ""}
              onChange={(e) =>
                setDraft((d) => ({ ...d, codigo: e.target.value }))
              }
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">
              Tipo de Impuesto
            </label>
            <select
              className="border border-slate-200 rounded-xl px-3 py-2 w-full"
              value={draft.impuesto_tipo || ""}
              onChange={(e) => setDraft((d) => ({ ...d, impuesto_tipo: e.target.value }))}
            >
              <option value="">Seleccionar</option>
              <option value="IVA">IVA</option>
              <option value="IGIC">IGIC</option>
              <option value="OTROS">Otros</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">
              Porcentaje (%)
            </label>
            <input
              className="border border-slate-200 rounded-xl px-3 py-2 w-full"
              type="number"
              step="0.01"
              value={draft.impuesto_pct || ""}
              onChange={(e) => setDraft((d) => ({ ...d, impuesto_pct: e.target.value }))}
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-medium text-slate-700">
              Descripción
            </label>
            <textarea
              className="border border-slate-200 rounded-xl px-3 py-2 w-full"
              value={draft.descripcion || ""}
              onChange={(e) =>
                setDraft((d) => ({ ...d, descripcion: e.target.value }))
              }
            />
          </div>
        </div>
        <div className="mt-6">
          <div className="text-xs font-semibold text-slate-500 mb-1">
            Historial de cambios
          </div>
          <div className="max-h-32 overflow-y-auto border rounded bg-slate-50 p-2 text-xs">
            {Array.isArray(zona?.historial) && zona.historial.length === 0 && (
              <div className="text-slate-400">Sin historial</div>
            )}
            {Array.isArray(zona?.historial) &&
              zona.historial.map((h, i) => (
                <div key={i} className="mb-1 border-b last:border-b-0 pb-1">
                  <div className="text-slate-600">
                    {new Date(h.fecha).toLocaleString()}{" "}
                    <span className="text-slate-400">({h.usuario})</span>
                  </div>
                  <ul className="ml-2 list-disc">
                    {Object.entries(h.cambios).map(([campo, val]) => (
                      <li key={campo}>
                        <b>{campo}:</b>{" "}
                        <span className="text-red-600">
                          {String(val.antes)}
                        </span>{" "}
                        →{" "}
                        <span className="text-green-700">
                          {String(val.despues)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-slate-300 rounded-xl text-slate-600 hover:bg-slate-50"
          >
            Cancelar
          </button>
          <button
            onClick={() => {
              // Limpiar y preparar los datos antes de guardar
              const cleanedData = {
                ...draft,
                nombre: draft.nombre?.trim(),
                codigo: draft.codigo?.trim() || null,
                impuesto_tipo: draft.impuesto_tipo || null,
                impuesto_pct: draft.impuesto_pct ? parseFloat(draft.impuesto_pct) : null,
                descripcion: draft.descripcion?.trim() || null,
              };
              onSave(cleanedData, true);
              onClose();
            }}
            className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700"
          >
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ZonasSection({ zonas, setZonas }) {
  const [showZonaForm, setShowZonaForm] = useState(false);
  const [zDraft, setZDraft] = useState({
    nombre: "",
    codigo: "",
    impuesto_tipo: "",
    impuesto_pct: "",
    descripcion: "",
    historial: [],
  });
  const [modalZona, setModalZona] = useState(null);

  const addZona = () => {
    if (!zDraft.nombre?.trim()) return;
    
    // Limpiar y preparar los datos
    const newZona = {
      ...zDraft,
      id: Date.now().toString(), // Supabase usa texto para el id
      nombre: zDraft.nombre.trim(),
      codigo: zDraft.codigo?.trim() || null,
      impuesto_tipo: zDraft.impuesto_tipo || null,
      impuesto_pct: zDraft.impuesto_pct ? parseFloat(zDraft.impuesto_pct) : null,
      descripcion: zDraft.descripcion?.trim() || null,
      historial: []
    };
    
    setZonas(prev => [...prev, newZona]);
    setZDraft({
      nombre: "",
      codigo: "",
      impuesto_tipo: "",
      impuesto_pct: "",
      descripcion: "",
      historial: [],
    });
    setShowZonaForm(false);
  };

  const handleModalZonaSave = (zona, shouldClose) => {
    setZonas(prev => prev.map((z) => (z.id === zona.id ? zona : z)));
    if (shouldClose) setModalZona(null);
  };

  const rmZona = (id) => {
    setZonas(prev => prev.filter((z) => z.id !== id));
  };

  return (
    <div className="space-y-6">
      {/* Estadísticas */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 dark:bg-gradient-to-br dark:from-indigo-900 dark:to-indigo-800 dark:border-indigo-700 dark:shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-600 dark:text-indigo-200 text-sm font-medium">Total Zonas</p>
              <p className="text-2xl font-bold text-blue-800 dark:text-white">{zonas.length}</p>
            </div>
            <MapPin className="w-8 h-8 text-blue-600 dark:text-indigo-300" />
          </div>
        </Card>
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 dark:bg-gradient-to-br dark:from-green-900 dark:to-green-800 dark:border-green-700 dark:shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-600 dark:text-green-200 text-sm font-medium">Con IVA</p>
              <p className="text-2xl font-bold text-green-800 dark:text-white">
                {zonas.filter(z => z.impuesto_tipo === 'IVA').length}
              </p>
            </div>
            <div className="text-green-600 dark:text-green-200 text-lg font-bold">IVA</div>
          </div>
        </Card>
        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200 dark:bg-gradient-to-br dark:from-orange-900 dark:to-orange-800 dark:border-orange-700 dark:shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-600 dark:text-orange-200 text-sm font-medium">Con IGIC</p>
              <p className="text-2xl font-bold text-orange-800 dark:text-white">
                {zonas.filter(z => z.impuesto_tipo === 'IGIC').length}
              </p>
            </div>
            <div className="text-orange-600 dark:text-orange-200 text-lg font-bold">IGIC</div>
          </div>
        </Card>
      </div>

      {/* Botón nueva zona */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-slate-800">Zonas Fiscales</h3>
        <button
          onClick={() => setShowZonaForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all shadow-lg"
        >
          <Plus className="w-4 h-4" />
          Nueva Zona
        </button>
      </div>

      {/* Formulario nueva zona */}
      {showZonaForm && (
        <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <MapPin className="w-5 h-5 mr-2 text-blue-600" />
              <h4 className="font-semibold text-blue-800">Nueva Zona</h4>
            </div>
            <button
              onClick={() => setShowZonaForm(false)}
              className="p-2 hover:bg-red-100 rounded-lg transition-colors"
            >
              <X className="w-4 h-4 text-red-500" />
            </button>
          </div>
          <div className="grid md:grid-cols-2 gap-4 mb-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">
                Nombre *
              </label>
              <input
                className="border border-slate-200 rounded-xl px-3 py-2 w-full"
                value={zDraft.nombre || ""}
                onChange={(e) =>
                  setZDraft((d) => ({ ...d, nombre: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">
                Código
              </label>
              <input
                className="border border-slate-200 rounded-xl px-3 py-2 w-full"
                value={zDraft.codigo || ""}
                onChange={(e) =>
                  setZDraft((d) => ({ ...d, codigo: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">
                Tipo de Impuesto
              </label>
              <select
                className="border border-slate-200 rounded-xl px-3 py-2 w-full"
                value={zDraft.impuesto_tipo || ""}
                onChange={(e) =>
                  setZDraft((d) => ({ ...d, impuesto_tipo: e.target.value }))
                }
              >
                <option value="">Seleccionar</option>
                <option value="IVA">IVA</option>
                <option value="IGIC">IGIC</option>
                <option value="OTROS">Otros</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">
                Porcentaje (%)
              </label>
              <input
                className="border border-slate-200 rounded-xl px-3 py-2 w-full"
                type="number"
                step="0.01"
                value={zDraft.impuesto_pct || ""}
                onChange={(e) =>
                  setZDraft((d) => ({ ...d, impuesto_pct: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium text-slate-700">
                Descripción
              </label>
              <textarea
                className="border border-slate-200 rounded-xl px-3 py-2 w-full"
                value={zDraft.descripcion || ""}
                onChange={(e) =>
                  setZDraft((d) => ({ ...d, descripcion: e.target.value }))
                }
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <button
              onClick={() => setShowZonaForm(false)}
              className="px-4 py-2 border border-slate-300 rounded-xl text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={addZona}
              disabled={!zDraft.nombre}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              Guardar
            </button>
          </div>
        </Card>
      )}

      {/* Tabla zonas */}
      <Card className="dark:bg-darkAccent/60 dark:border-darkAccent/40 dark:shadow-xl">
        <div className="overflow-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-slate-500 bg-slate-50 dark:bg-darkAccent/30">
                <th className="py-4 px-4 font-medium dark:text-indigo-200">Nombre</th>
                <th className="py-4 px-4 font-medium dark:text-indigo-200">Código</th>
                <th className="py-4 px-4 font-medium dark:text-indigo-200">Tipo Impuesto</th>
                <th className="py-4 px-4 font-medium dark:text-indigo-200">Porcentaje (%)</th>
                <th className="py-4 px-4 font-medium dark:text-indigo-200">Descripción</th>
                <th className="py-4 px-4 font-medium dark:text-indigo-200">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {zonas.map((z, index) => {
                const isEven = index % 2 === 0;
                return (
                  <tr
                    key={z.id}
                    className={`border-t transition-colors ${isEven ? "bg-slate-25 dark:bg-darkAccent/10" : "bg-white dark:bg-darkAccent/20"} hover:bg-blue-50 dark:hover:bg-indigo-900/30`}
                  >
                    <td className="py-4 px-4">
                      <div className="font-medium text-slate-700 dark:text-white">
                        {z.nombre}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-slate-600 dark:text-indigo-200">{z.codigo || "—"}</span>
                    </td>
                    <td className="py-4 px-4">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        z.impuesto_tipo === 'IVA' 
                          ? 'bg-blue-100 text-blue-800 dark:bg-indigo-800 dark:text-indigo-100' 
                          : z.impuesto_tipo === 'IGIC'
                          ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100'
                      }`}>
                        {z.impuesto_tipo || "—"}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-slate-600 dark:text-indigo-200">{z.impuesto_pct ? `${z.impuesto_pct}%` : "—"}</span>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-slate-600 text-sm dark:text-indigo-200">{z.descripcion ? (z.descripcion.length > 50 ? z.descripcion.substring(0, 50) + "..." : z.descripcion) : "—"}</span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => setModalZona(z)}
                          className="p-2 rounded-lg bg-amber-100 text-amber-700 hover:bg-amber-200 dark:bg-yellow-900/40 dark:text-yellow-200 dark:hover:bg-yellow-900/60 transition-colors"
                          title="Editar"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => rmZona(z.id)}
                          className="p-2 rounded-lg bg-rose-100 text-rose-700 hover:bg-rose-200 dark:bg-pink-900/40 dark:text-pink-200 dark:hover:bg-pink-900/60 transition-colors"
                          title="Eliminar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {zonas.length === 0 && (
            <div className="text-center py-12">
              <MapPin className="w-16 h-16 mx-auto text-slate-300 dark:text-indigo-900 mb-4" />
              <h3 className="text-lg font-medium text-slate-600 dark:text-white mb-2">
                No hay zonas configuradas
              </h3>
              <p className="text-slate-500 dark:text-indigo-200 mb-4">Crea tu primera zona fiscal</p>
              <button
                onClick={() => setShowZonaForm(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 dark:bg-indigo-700 dark:hover:bg-indigo-800 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Nueva Zona
              </button>
            </div>
          )}
        </div>
      </Card>

      {/* Modal edición zona */}
      {modalZona && (
        <ZonaEditModal
          zona={modalZona}
          onSave={handleModalZonaSave}
          onClose={() => setModalZona(null)}
        />
      )}
    </div>
  );
}
