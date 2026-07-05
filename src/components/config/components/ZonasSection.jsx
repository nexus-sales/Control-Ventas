import React, { useState, useCallback } from "react";
import { Globe, MapPin, Plus, Edit3, Trash2, X, Save } from "lucide-react";
import { useData, useAuth } from "../../../context/AppContexts";

const IMPUESTO_TIPOS = ["IVA", "IGIC", "IPSI"];

function ZonaEditModal({ zona, onSave, onClose }) {
    const [form, setForm] = useState(zona || {
        nombre: "",
        codigo: "",
        impuesto_tipo: "IVA",
        impuesto_pct: 21,
        descripcion: "",
    });
    const [error, setError] = useState("");

    const handleSave = () => {
        if (!form.nombre?.trim()) {
            setError("El nombre de la zona es obligatorio");
            return;
        }
        const pct = Number(form.impuesto_pct);
        if (!Number.isFinite(pct) || pct < 0) {
            setError("El % de impuesto debe ser un número >= 0");
            return;
        }
        onSave({
            ...form,
            id: form.id || `zona_${Date.now()}`,
            nombre: form.nombre.trim(),
            codigo: form.codigo?.trim() || "",
            descripcion: form.descripcion?.trim() || "",
            // impuesto_pct se guarda como fracción (0.21 = 21%), igual que el
            // resto de campos "pct_*" del proyecto (ver normalizeFactor en
            // calculos.js) — admite tanto "21" como "0.21" al escribir.
            impuesto_pct: pct > 1 ? pct / 100 : pct,
            activo: true,
        });
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-900 text-slate-800 dark:text-gray-100 border border-slate-200 dark:border-gray-700 rounded-xl shadow-xl p-6 w-full max-w-lg">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <Globe className="w-6 h-6 text-[var(--brand-primary)]" />
                        {zona ? "Editar Zona" : "Nueva Zona"}
                    </h2>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-gray-800">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {error && (
                    <div className="mb-4 p-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-400/40 rounded-xl text-red-700 dark:text-red-300 text-sm">
                        {error}
                    </div>
                )}

                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-500 dark:text-gray-400">Nombre *</label>
                            <input
                                className="w-full border border-slate-200 dark:border-gray-700 rounded-xl px-3 py-2 bg-white dark:bg-gray-800"
                                value={form.nombre}
                                onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
                                placeholder="Ej: Canarias"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-500 dark:text-gray-400">Código</label>
                            <input
                                className="w-full border border-slate-200 dark:border-gray-700 rounded-xl px-3 py-2 bg-white dark:bg-gray-800"
                                value={form.codigo}
                                onChange={e => setForm(f => ({ ...f, codigo: e.target.value }))}
                                placeholder="Ej: CAN"
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-500 dark:text-gray-400">Tipo de impuesto</label>
                            <select
                                className="w-full border border-slate-200 dark:border-gray-700 rounded-xl px-3 py-2 bg-white dark:bg-gray-800"
                                value={form.impuesto_tipo}
                                onChange={e => setForm(f => ({ ...f, impuesto_tipo: e.target.value }))}
                            >
                                {IMPUESTO_TIPOS.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-500 dark:text-gray-400">% Impuesto</label>
                            <input
                                type="number" min="0" step="0.01"
                                className="w-full border border-slate-200 dark:border-gray-700 rounded-xl px-3 py-2 bg-white dark:bg-gray-800"
                                value={form.impuesto_pct}
                                onChange={e => setForm(f => ({ ...f, impuesto_pct: e.target.value }))}
                            />
                        </div>
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 dark:text-gray-400">Descripción</label>
                        <input
                            className="w-full border border-slate-200 dark:border-gray-700 rounded-xl px-3 py-2 bg-white dark:bg-gray-800"
                            value={form.descripcion}
                            onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))}
                        />
                    </div>
                </div>

                <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-slate-100 dark:border-gray-800">
                    <button onClick={onClose} className="px-6 py-2 border border-slate-300 dark:border-gray-700 rounded-xl text-slate-600 dark:text-gray-200 hover:bg-slate-50 dark:hover:bg-gray-800">
                        Cancelar
                    </button>
                    <button onClick={handleSave} className="flex items-center gap-2 px-6 py-2 bg-[var(--brand-primary)] text-white rounded-xl hover:opacity-90">
                        <Save className="w-4 h-4" />
                        Guardar
                    </button>
                </div>
            </div>
        </div>
    );
}

// Antes de este fix, esta pantalla solo listaba zonas (sin nombre/codigo/
// descripcion, ni siquiera el % de impuesto) y no había ningún alta/edición/
// baja — la única vía real para crear una zona era importarla desde Excel.
// La sección sugería "gestión" pero no permitía gestionar nada.
const ZonasSection = React.memo(({ zonas = [] }) => {
    const { setZonas } = useData();
    const { profile } = useAuth();
    const puedeEditar = profile?.rol !== 'viewer';
    const [modalZona, setModalZona] = useState(null);

    // Asegurar que las zonas sean únicas por nombre
    const uniqueZonas = Array.from(new Map(zonas.map(z => [z.nombre, z])).values());

    const handleSaveZona = useCallback((zona) => {
        setZonas(prev => {
            const existe = prev.some(z => z.id === zona.id);
            return existe ? prev.map(z => (z.id === zona.id ? zona : z)) : [zona, ...prev];
        });
        setModalZona(null);
    }, [setZonas]);

    const handleDeleteZona = useCallback((zona) => {
        if (window.confirm(`¿Eliminar la zona "${zona.nombre}"? Las ventas que ya la usan conservarán la referencia.`)) {
            setZonas(prev => prev.filter(z => z.id !== zona.id));
        }
    }, [setZonas]);

    return (
        <section className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {modalZona && (
                <ZonaEditModal
                    zona={modalZona.id ? modalZona : null}
                    onSave={handleSaveZona}
                    onClose={() => setModalZona(null)}
                />
            )}

            <div className="flex items-center justify-between gap-3 mb-2">
                <div className="flex items-center gap-3">
                    <div className="bg-[var(--brand-primary)]/10 p-2 rounded-lg text-[var(--brand-primary)]">
                        <Globe className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="text-2xl font-bold text-slate-800 dark:text-white">Zonas Fiscales</h3>
                        <p className="text-sm text-slate-500 dark:text-gray-400">Regiones configuradas para gestión de impuestos y precios.</p>
                    </div>
                </div>
                {puedeEditar && (
                    <button
                        onClick={() => setModalZona({})}
                        className="flex items-center gap-2 px-5 py-2.5 bg-[var(--brand-primary)] text-white rounded-xl hover:opacity-90 transition-all shadow-lg text-xs font-bold uppercase tracking-widest"
                    >
                        <Plus className="w-4 h-4" />
                        Nueva Zona
                    </button>
                )}
            </div>

            {uniqueZonas.length === 0 ? (
                <div className="text-center py-12 bg-slate-50 dark:bg-gray-800/50 rounded-2xl border-2 border-dashed border-slate-200 dark:border-gray-700">
                    <MapPin className="w-12 h-12 text-slate-300 dark:text-gray-600 mx-auto mb-3" />
                    <p className="text-slate-500 dark:text-gray-400">No hay zonas fiscales registradas en el sistema.</p>
                </div>
            ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {uniqueZonas.map(zona => (
                        <div
                            key={zona.id}
                            className="group p-5 rounded-2xl bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 hover:border-[var(--brand-primary)]/50 hover:shadow-xl hover:shadow-[var(--brand-primary)]/5 transition-all duration-300"
                        >
                            <div className="flex items-start justify-between mb-3">
                                <div className="font-bold text-lg text-slate-900 dark:text-white group-hover:text-[var(--brand-primary)] transition-colors">
                                    {zona.nombre}
                                </div>
                                {zona.codigo && (
                                    <span className="bg-slate-100 dark:bg-gray-700 text-slate-500 dark:text-gray-300 px-2 py-0.5 rounded text-[10px] font-black tracking-widest">
                                        {zona.codigo}
                                    </span>
                                )}
                            </div>

                            {zona.descripcion && (
                                <p className="text-sm text-slate-500 dark:text-gray-400 line-clamp-2 italic mb-4">
                                    "{zona.descripcion}"
                                </p>
                            )}

                            <div className="flex items-center justify-between pt-4 border-t border-slate-50 dark:border-gray-700/50">
                                <span className="text-xs font-bold text-slate-500 dark:text-gray-400">
                                    {zona.impuesto_tipo || 'IVA'} {((Number(zona.impuesto_pct) || 0) * 100).toFixed(0)}%
                                </span>
                                {puedeEditar && (
                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => setModalZona(zona)}
                                            className="p-1.5 rounded-lg text-slate-400 hover:text-[var(--brand-primary)] hover:bg-slate-100 dark:hover:bg-gray-700"
                                            title="Editar"
                                        >
                                            <Edit3 className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDeleteZona(zona)}
                                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-slate-100 dark:hover:bg-gray-700"
                                            title="Eliminar"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </section>
    );
});

export default ZonasSection;
