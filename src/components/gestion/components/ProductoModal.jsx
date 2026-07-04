import React, { useState, useCallback, useMemo } from "react";
import {
    Package, X, Save
} from "lucide-react";
import { SECTORES, FAMILIAS_POR_SECTOR } from "../../../utils/constants";
import { sumarDia } from "../utils/gestionUtils";

const ProductoModal = React.memo(({ producto, onSave, onClose, operadores = [] }) => {
    const [form, setForm] = useState(
        producto ? {
            ...producto,
            sector: producto.sector || operadores.find(op => op.id === producto.operador_id)?.sector || "",
            comision_vigencia_desde: producto.comision_vigencia_desde || "",
            comision_vigencia_hasta: producto.comision_vigencia_hasta || "",
            comision_cliente_nuevo: producto.comision_cliente_nuevo ?? "",
            comision_cliente_existente: producto.comision_cliente_existente ?? "",
            comision_portabilidad: producto.comision_portabilidad ?? "",
            comision_alta_nueva: producto.comision_alta_nueva ?? "",
            comision_fija: producto.comision_fija ?? "",
            comision_porcentaje: producto.comision_porcentaje ?? "",
            comisiones_historial: Array.isArray(producto.comisiones_historial) ? producto.comisiones_historial : [],
        } : {
            operador_id: operadores[0]?.id || "",
            sector: operadores[0]?.sector || "",
            nombre: "",
            familia: "",
            pvp: "",
            comision_tipo: "porcentaje",
            comision_valor: "",
            comision_vigencia_desde: "",
            comision_vigencia_hasta: "",
            comision_cliente_nuevo: "",
            comision_cliente_existente: "",
            comision_portabilidad: "",
            comision_alta_nueva: "",
            comision_fija: "",
            comision_porcentaje: "",
            comisiones_historial: [],
            fecha_alta: new Date().toISOString().slice(0, 10),
            contacto: "",
            email: "",
            telefono: "",
            observaciones: "",
        }
    );

    const [errors, setErrors] = useState({});

    const familiasDisponibles = useMemo(() => {
        return form.sector ? FAMILIAS_POR_SECTOR[form.sector] || [] : [];
    }, [form.sector]);

    const validate = useCallback(() => {
        const newErrors = {};
        if (!form.nombre?.trim()) newErrors.nombre = "Nombre es obligatorio";
        if (!form.sector) newErrors.sector = "Sector es obligatorio";
        if (!form.operador_id) newErrors.operador_id = "Operador es obligatorio";
        if (!form.pvp || Number(form.pvp) <= 0) newErrors.pvp = "PVP debe ser mayor que 0";
        if (form.comision_valor && Number(form.comision_valor) < 0) newErrors.comision_valor = "Comisión no puede ser negativa";
        ["comision_cliente_nuevo", "comision_cliente_existente", "comision_portabilidad", "comision_alta_nueva"].forEach((campo) => {
            if (form[campo] !== "" && form[campo] !== null && form[campo] !== undefined && isNaN(Number(form[campo]))) {
                newErrors[campo] = "Debe ser numérico";
            }
        });
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    }, [form]);

    const appendSnapshot = useCallback((baseForm) => {
        const snapshotFecha = baseForm.comision_vigencia_desde || baseForm.fecha_alta || new Date().toISOString().slice(0, 10);
        const nowIso = new Date().toISOString();
        const snapshot = {
            id: `hist_${Date.now()}`,
            desde: snapshotFecha,
            hasta: baseForm.comision_vigencia_hasta || "",
            comision_tipo: baseForm.comision_tipo,
            comision_fija: baseForm.comision_fija,
            comision_porcentaje: baseForm.comision_porcentaje,
            comision_valor: baseForm.comision_valor,
            comision_cliente_nuevo: baseForm.comision_cliente_nuevo,
            comision_cliente_existente: baseForm.comision_cliente_existente,
            comision_portabilidad: baseForm.comision_portabilidad,
            comision_alta_nueva: baseForm.comision_alta_nueva,
            comision_vigencia_desde: baseForm.comision_vigencia_desde || "",
            comision_vigencia_hasta: baseForm.comision_vigencia_hasta || "",
            created_at: nowIso,
        };

        const historial = Array.isArray(baseForm.comisiones_historial) ? [...baseForm.comisiones_historial] : [];
        const last = historial[historial.length - 1];
        if (last && !last.hasta && snapshot.desde && last.desde && snapshot.desde > last.desde) {
            historial[historial.length - 1] = { ...last, hasta: last.hasta || snapshot.desde };
        }
        historial.push(snapshot);
        return historial;
    }, []);

    const handleSave = useCallback(() => {
        if (!validate()) return;

        const cleanForm = {
            ...form,
            id: form.id || `p_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            nombre: form.nombre.trim(),
            sector: form.sector || "",
            familia: form.familia?.trim() || "Sin clasificar",
            pvp: Number(form.pvp),
            comision_valor: form.comision_valor ? Number(form.comision_valor) : 0,
            comision_fija: form.comision_fija === "" ? 0 : Number(form.comision_fija),
            comision_porcentaje: form.comision_porcentaje === "" ? 0 : Number(form.comision_porcentaje),
            comision_vigencia_desde: form.comision_vigencia_desde || null,
            comision_vigencia_hasta: form.comision_vigencia_hasta || null,
            comision_cliente_nuevo: form.comision_cliente_nuevo === "" ? null : Number(form.comision_cliente_nuevo),
            comision_cliente_existente: form.comision_cliente_existente === "" ? null : Number(form.comision_cliente_existente),
            comision_portabilidad: form.comision_portabilidad === "" ? null : Number(form.comision_portabilidad),
            comision_alta_nueva: form.comision_alta_nueva === "" ? null : Number(form.comision_alta_nueva),
            activo: true,
            fecha_actualizacion: new Date().toISOString()
        };

        if (cleanForm.comision_tipo === 'fijo' && !cleanForm.comision_valor) {
            cleanForm.comision_valor = cleanForm.comision_fija;
        }
        if (cleanForm.comision_tipo === 'porcentaje' && !cleanForm.comision_valor) {
            cleanForm.comision_valor = cleanForm.comision_porcentaje;
        }

        cleanForm.comisiones_historial = appendSnapshot(cleanForm);

        onSave(cleanForm);
        onClose();
    }, [form, validate, onSave, onClose, appendSnapshot]);

    const handleNuevaVigencia = useCallback(() => {
        if (!form.comision_vigencia_hasta) {
            setErrors(prev => ({ ...prev, comision_vigencia_hasta: "Indica la fecha fin para cerrar la vigencia actual" }));
            return;
        }
        const cleanBase = {
            ...form,
            comision_fija: form.comision_fija === "" ? 0 : Number(form.comision_fija),
            comision_porcentaje: form.comision_porcentaje === "" ? 0 : Number(form.comision_porcentaje),
            comision_valor: form.comision_valor ? Number(form.comision_valor) : 0,
            comision_cliente_nuevo: form.comision_cliente_nuevo === "" ? "" : Number(form.comision_cliente_nuevo),
            comision_cliente_existente: form.comision_cliente_existente === "" ? "" : Number(form.comision_cliente_existente),
            comision_portabilidad: form.comision_portabilidad === "" ? "" : Number(form.comision_portabilidad),
            comision_alta_nueva: form.comision_alta_nueva === "" ? "" : Number(form.comision_alta_nueva),
            comisiones_historial: form.comisiones_historial,
        };
        const nuevoHist = appendSnapshot(cleanBase);
        const siguienteDesde = sumarDia(form.comision_vigencia_hasta) || "";
        setForm(prev => ({
            ...prev,
            comisiones_historial: nuevoHist,
            comision_vigencia_desde: siguienteDesde,
            comision_vigencia_hasta: "",
            comision_valor: "",
            comision_fija: "",
            comision_porcentaje: "",
            comision_cliente_nuevo: "",
            comision_cliente_existente: "",
            comision_portabilidad: "",
            comision_alta_nueva: "",
        }));
        setErrors(prev => ({ ...prev, comision_vigencia_hasta: undefined }));
    }, [form, appendSnapshot]);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-900 text-slate-800 dark:text-gray-100 border border-slate-200 dark:border-gray-700 rounded-xl shadow-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold flex items-center gap-2 text-slate-900 dark:text-white">
                        <Package className="w-6 h-6 text-green-500" />
                        {producto ? 'Editar Producto' : 'Nuevo Producto'}
                    </h2>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-gray-800 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-gray-200">Operador *</label>
                            <select
                                className={`w-full border rounded-xl px-3 py-2 bg-white dark:bg-gray-800 text-slate-800 dark:text-gray-100 ${errors.operador_id ? 'border-red-300 dark:border-red-400' : 'border-slate-200 dark:border-gray-700'}`}
                                value={form.operador_id}
                                onChange={e => {
                                    const selected = operadores.find(op => op.id === e.target.value);
                                    setForm(prev => ({ ...prev, operador_id: e.target.value, sector: selected?.sector || prev.sector, familia: '' }));
                                }}
                            >
                                <option value="">Seleccionar operador</option>
                                {operadores.map(op => (
                                    <option key={op.id} value={op.id}>{op.nombre}</option>
                                ))}
                            </select>
                            {errors.operador_id && <p className="text-xs text-red-600 mt-1">{errors.operador_id}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-gray-200">Sector *</label>
                            <select
                                className={`w-full border rounded-xl px-3 py-2 bg-white dark:bg-gray-800 text-slate-800 dark:text-gray-100 ${errors.sector ? 'border-red-300 dark:border-red-400' : 'border-slate-200 dark:border-gray-700'}`}
                                value={form.sector}
                                onChange={e => setForm(prev => ({ ...prev, sector: e.target.value, familia: '' }))}
                            >
                                <option value="">Seleccionar sector</option>
                                {Object.keys(SECTORES).map(key => (
                                    <option key={key} value={key}>{SECTORES[key]}</option>
                                ))}
                            </select>
                            {errors.sector && <p className="text-xs text-red-600 mt-1">{errors.sector}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-gray-200">Nombre *</label>
                            <input
                                type="text"
                                className={`w-full border rounded-xl px-3 py-2 bg-white dark:bg-gray-800 text-slate-800 dark:text-gray-100 ${errors.nombre ? 'border-red-300 dark:border-red-400' : 'border-slate-200 dark:border-gray-700'}`}
                                value={form.nombre}
                                onChange={e => setForm(prev => ({ ...prev, nombre: e.target.value }))}
                                placeholder="Nombre del producto"
                            />
                            {errors.nombre && <p className="text-xs text-red-600 mt-1">{errors.nombre}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-gray-200">Familia</label>
                            <input
                                list="familias-list"
                                className="w-full border border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-slate-800 dark:text-gray-100 rounded-xl px-3 py-2"
                                value={form.familia}
                                onChange={e => setForm(prev => ({ ...prev, familia: e.target.value }))}
                                placeholder={form.sector ? "Escribe o elige familia" : "Selecciona un sector primero"}
                                disabled={!form.sector}
                            />
                            <datalist id="familias-list">
                                {familiasDisponibles.map((fam) => (
                                    <option key={fam} value={fam} />
                                ))}
                            </datalist>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-gray-200">PVP (€) *</label>
                            <input
                                type="number"
                                min="0"
                                step="0.01"
                                className={`w-full border rounded-xl px-3 py-2 bg-white dark:bg-gray-800 text-slate-800 dark:text-gray-100 ${errors.pvp ? 'border-red-300 dark:border-red-400' : 'border-slate-200 dark:border-gray-700'}`}
                                value={form.pvp}
                                onChange={e => setForm(prev => ({ ...prev, pvp: e.target.value }))}
                            />
                            {errors.pvp && <p className="text-xs text-red-600 mt-1">{errors.pvp}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-gray-200">Tipo Comisión</label>
                            <select
                                className="w-full border border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-slate-800 dark:text-gray-100 rounded-xl px-3 py-2"
                                value={form.comision_tipo}
                                onChange={e => setForm(prev => ({ ...prev, comision_tipo: e.target.value }))}
                            >
                                <option value="porcentaje">Porcentaje (%)</option>
                                <option value="fijo">Importe Fijo (€)</option>
                                <option value="mixto">Mixto (Fijo + %)</option>
                            </select>
                        </div>

                        {(form.comision_tipo === 'fijo' || form.comision_tipo === 'mixto') && (
                            <div>
                                <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-gray-200">Importe Fijo (€)</label>
                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    className="w-full border border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-slate-800 dark:text-gray-100 rounded-xl px-3 py-2"
                                    value={form.comision_fija || ''}
                                    onChange={e => setForm(prev => ({ ...prev, comision_fija: e.target.value }))}
                                />
                            </div>
                        )}

                        {(form.comision_tipo === 'porcentaje' || form.comision_tipo === 'mixto') && (
                            <div>
                                <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-gray-200">Porcentaje Comisión (%)</label>
                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    className="w-full border border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-slate-800 dark:text-gray-100 rounded-xl px-3 py-2"
                                    value={form.comision_porcentaje || ''}
                                    onChange={e => setForm(prev => ({ ...prev, comision_porcentaje: e.target.value }))}
                                />
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-gray-200">Comisión vigente desde</label>
                            <input
                                type="date"
                                className="w-full border border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-slate-800 dark:text-gray-100 rounded-xl px-3 py-2"
                                value={form.comision_vigencia_desde}
                                onChange={e => setForm(prev => ({ ...prev, comision_vigencia_desde: e.target.value }))}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-gray-200">Comisión vigente hasta</label>
                            <input
                                type="date"
                                className="w-full border border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-slate-800 dark:text-gray-100 rounded-xl px-3 py-2"
                                value={form.comision_vigencia_hasta}
                                onChange={e => setForm(prev => ({ ...prev, comision_vigencia_hasta: e.target.value }))}
                            />
                            {errors.comision_vigencia_hasta && <p className="text-xs text-red-600 mt-1">{errors.comision_vigencia_hasta}</p>}
                            <div className="mt-2 flex gap-2">
                                <button
                                    type="button"
                                    onClick={handleNuevaVigencia}
                                    className="px-3 py-2 rounded-lg text-sm bg-slate-200 dark:bg-gray-700 text-slate-800 dark:text-gray-100 hover:bg-slate-300 dark:hover:bg-gray-600 transition-colors"
                                >
                                    Cerrar vigencia y añadir nueva
                                </button>
                            </div>
                        </div>

                        {String(form.sector || "").toUpperCase() === 'TELEFONIA' && (
                            <div className="md:col-span-2 border border-slate-200 dark:border-gray-700 rounded-xl p-4 space-y-3 bg-slate-50 dark:bg-gray-800/50">
                                <p className="text-sm font-semibold text-slate-700 dark:text-gray-200">Condiciones específicas Telefonía</p>
                                <div className="grid md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-gray-200">Cliente nuevo (% o €)</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            className="w-full border border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-slate-800 dark:text-gray-100 rounded-xl px-3 py-2"
                                            value={form.comision_cliente_nuevo}
                                            onChange={e => setForm(prev => ({ ...prev, comision_cliente_nuevo: e.target.value }))}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-gray-200">Cliente existente (% o €)</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            className="w-full border border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-slate-800 dark:text-gray-100 rounded-xl px-3 py-2"
                                            value={form.comision_cliente_existente}
                                            onChange={e => setForm(prev => ({ ...prev, comision_cliente_existente: e.target.value }))}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-gray-200">Alta nueva (% o €)</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            className="w-full border border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-slate-800 dark:text-gray-100 rounded-xl px-3 py-2"
                                            value={form.comision_alta_nueva}
                                            onChange={e => setForm(prev => ({ ...prev, comision_alta_nueva: e.target.value }))}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-gray-200">Portabilidad (% o €)</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            className="w-full border border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-slate-800 dark:text-gray-100 rounded-xl px-3 py-2"
                                            value={form.comision_portabilidad}
                                            onChange={e => setForm(prev => ({ ...prev, comision_portabilidad: e.target.value }))}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="md:col-span-2 border border-slate-200 dark:border-gray-700 rounded-xl p-4 bg-slate-50 dark:bg-gray-900/40">
                            <div className="flex items-center justify-between mb-3">
                                <p className="text-sm font-semibold text-slate-700 dark:text-gray-200">Historial de comisiones</p>
                                <span className="text-xs text-slate-500 dark:text-gray-400">Se cierra la vigencia anterior y se añade la nueva</span>
                            </div>
                            {(!form.comisiones_historial || form.comisiones_historial.length === 0) && (
                                <p className="text-xs text-slate-500">Sin entradas aún. Se creará una al guardar.</p>
                            )}
                            {form.comisiones_historial && form.comisiones_historial.length > 0 && (
                                <div className="space-y-2 max-h-44 overflow-y-auto text-xs text-slate-700 dark:text-gray-200 pr-2">
                                    {[...form.comisiones_historial].slice().reverse().map((h) => (
                                        <div key={h.id || `${h.desde}-${h.hasta}`} className="p-2 rounded-lg bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 shadow-sm">
                                            <div className="flex justify-between gap-2 border-b border-slate-100 dark:border-gray-700 pb-1 mb-1">
                                                <span className="font-semibold">{h.desde || '—'} → {h.hasta || '—'}</span>
                                                <span className="uppercase text-[10px] bg-slate-100 dark:bg-gray-700 px-1 rounded">{h.comision_tipo || form.comision_tipo}</span>
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                {h.comision_fija !== undefined && h.comision_fija !== "" && <span>Fijo: {h.comision_fija}€</span>}
                                                {h.comision_porcentaje !== undefined && h.comision_porcentaje !== "" && <span>%: {h.comision_porcentaje}%</span>}
                                                {h.comision_cliente_nuevo !== undefined && h.comision_cliente_nuevo !== "" && <span>Nuevo: {h.comision_cliente_nuevo}</span>}
                                                {h.comision_cliente_existente !== undefined && h.comision_cliente_existente !== "" && <span>Existente: {h.comision_cliente_existente}</span>}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-gray-200">Contacto</label>
                            <input
                                type="text"
                                className="w-full border border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-slate-800 dark:text-gray-100 rounded-xl px-3 py-2"
                                value={form.contacto}
                                onChange={e => setForm(prev => ({ ...prev, contacto: e.target.value }))}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-gray-200">Email</label>
                            <input
                                type="email"
                                className="w-full border border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-slate-800 dark:text-gray-100 rounded-xl px-3 py-2"
                                value={form.email}
                                onChange={e => setForm(prev => ({ ...prev, email: e.target.value }))}
                            />
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-gray-200">Observaciones</label>
                            <textarea
                                rows="3"
                                className="w-full border border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-slate-800 dark:text-gray-100 rounded-xl px-3 py-2"
                                value={form.observaciones}
                                onChange={e => setForm(prev => ({ ...prev, observaciones: e.target.value }))}
                            />
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-slate-100 dark:border-gray-800">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 border border-slate-300 dark:border-gray-700 rounded-xl text-slate-600 dark:text-gray-200 hover:bg-slate-50 dark:hover:bg-gray-800 transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleSave}
                        className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-shadow hover:shadow-lg"
                    >
                        <Save className="w-4 h-4" />
                        Guardar
                    </button>
                </div>
            </div>
        </div>
    );
});

export default ProductoModal;
