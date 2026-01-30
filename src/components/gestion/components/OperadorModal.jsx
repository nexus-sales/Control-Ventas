import React, { useState, useCallback } from "react";
import {
    Building, X, Save
} from "lucide-react";

const OperadorModal = React.memo(({ operador, onSave, onClose }) => {
    const [form, setForm] = useState(
        operador ? {
            ...operador,
            reglas_decomision: {
                antes_6_meses: 100,
                despues_6_meses: 50,
                limite_meses: 6,
                ...operador.reglas_decomision
            }
        } : {
            nombre: "",
            codigo: "",
            sector: "",
            contacto: "",
            email: "",
            telefono: "",
            fecha_alta: new Date().toISOString().slice(0, 10),
            reglas_decomision: {
                antes_6_meses: 100,
                despues_6_meses: 50,
                limite_meses: 6
            }
        }
    );

    const [errors, setErrors] = useState({});

    const validate = useCallback(() => {
        const newErrors = {};
        if (!form.nombre?.trim()) newErrors.nombre = "Nombre es obligatorio";
        if (form.reglas_decomision.antes_6_meses < 0 || form.reglas_decomision.antes_6_meses > 100) {
            newErrors.antes_6_meses = "Debe estar entre 0 y 100";
        }
        if (form.reglas_decomision.despues_6_meses < 0 || form.reglas_decomision.despues_6_meses > 100) {
            newErrors.despues_6_meses = "Debe estar entre 0 y 100";
        }
        if (form.reglas_decomision.limite_meses < 1 || form.reglas_decomision.limite_meses > 24) {
            newErrors.limite_meses = "Debe estar entre 1 y 24";
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    }, [form]);

    const handleSave = useCallback(() => {
        if (!validate()) {
            return;
        }

        const operadorId = form.id || `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        const cleanForm = {
            ...form,
            id: operadorId,
            nombre: form.nombre.trim(),
            codigo: form.codigo?.trim().toUpperCase() || '',
            sector: form.sector || '',
            contacto: form.contacto?.trim() || '',
            email: form.email?.trim() || '',
            telefono: form.telefono?.trim() || '',
            reglas_decomision: {
                antes_6_meses: Number(form.reglas_decomision.antes_6_meses),
                despues_6_meses: Number(form.reglas_decomision.despues_6_meses),
                limite_meses: Number(form.reglas_decomision.limite_meses)
            },
            fecha_actualizacion: new Date().toISOString(),
            activo: true
        };

        onSave(cleanForm);
        onClose();
    }, [form, validate, onSave, onClose]);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-900 text-slate-800 dark:text-gray-100 border border-slate-200 dark:border-gray-700 rounded-xl shadow-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold flex items-center gap-2 text-slate-900 dark:text-white">
                        <Building className="w-6 h-6 text-purple-500" />
                        {operador ? 'Editar Operador' : 'Nuevo Operador'}
                    </h2>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-gray-800 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-gray-200">Nombre *</label>
                            <input
                                type="text"
                                className={`w-full border rounded-xl px-3 py-2 bg-white dark:bg-gray-800 text-slate-800 dark:text-gray-100 ${errors.nombre ? 'border-red-300 dark:border-red-400' : 'border-slate-200 dark:border-gray-700'}`}
                                value={form.nombre}
                                onChange={e => setForm(prev => ({ ...prev, nombre: e.target.value }))}
                                placeholder="Nombre de la empresa"
                            />
                            {errors.nombre && <p className="text-xs text-red-600 mt-1">{errors.nombre}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-gray-200">Código</label>
                            <input
                                type="text"
                                className="w-full border border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-slate-800 dark:text-gray-100 rounded-xl px-3 py-2"
                                value={form.codigo}
                                onChange={e => setForm(prev => ({ ...prev, codigo: e.target.value }))}
                                placeholder="Ej: VF"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-gray-200">Sector</label>
                            <select
                                className="w-full border border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-slate-800 dark:text-gray-100 rounded-xl px-3 py-2"
                                value={form.sector}
                                onChange={e => setForm(prev => ({ ...prev, sector: e.target.value }))}
                            >
                                <option value="">Seleccionar sector</option>
                                <option value="telefonia">Telefonía</option>
                                <option value="energia">Energía</option>
                                <option value="seguridad">Seguridad/Alarmas</option>
                                <option value="internet">Internet</option>
                                <option value="seguros">Seguros</option>
                                <option value="otros">Otros</option>
                            </select>
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

                        <div>
                            <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-gray-200">Teléfono</label>
                            <input
                                type="tel"
                                className="w-full border border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-slate-800 dark:text-gray-100 rounded-xl px-3 py-2"
                                value={form.telefono}
                                onChange={e => setForm(prev => ({ ...prev, telefono: e.target.value }))}
                            />
                        </div>
                    </div>

                    <div className="border-t border-slate-100 dark:border-gray-800 pt-6">
                        <h3 className="text-lg font-semibold mb-4 text-slate-900 dark:text-white">Reglas de Decomisión</h3>
                        <div className="grid md:grid-cols-3 gap-4 bg-slate-50 dark:bg-gray-800/50 p-4 rounded-xl">
                            <div>
                                <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-gray-200">Antes {form.reglas_decomision.limite_meses}M (%)</label>
                                <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    step="0.01"
                                    className={`w-full border rounded-xl px-3 py-2 bg-white dark:bg-gray-800 text-slate-800 dark:text-gray-100 ${errors.antes_6_meses ? 'border-red-300 dark:border-red-400' : 'border-slate-200 dark:border-gray-700'}`}
                                    value={form.reglas_decomision.antes_6_meses}
                                    onChange={e => setForm(prev => ({
                                        ...prev,
                                        reglas_decomision: { ...prev.reglas_decomision, antes_6_meses: e.target.value }
                                    }))}
                                />
                                {errors.antes_6_meses && <p className="text-xs text-red-600 mt-1">{errors.antes_6_meses}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-gray-200">Después {form.reglas_decomision.limite_meses}M (%)</label>
                                <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    step="0.01"
                                    className={`w-full border rounded-xl px-3 py-2 bg-white dark:bg-gray-800 text-slate-800 dark:text-gray-100 ${errors.despues_6_meses ? 'border-red-300 dark:border-red-400' : 'border-slate-200 dark:border-gray-700'}`}
                                    value={form.reglas_decomision.despues_6_meses}
                                    onChange={e => setForm(prev => ({
                                        ...prev,
                                        reglas_decomision: { ...prev.reglas_decomision, despues_6_meses: e.target.value }
                                    }))}
                                />
                                {errors.despues_6_meses && <p className="text-xs text-red-600 mt-1">{errors.despues_6_meses}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-gray-200">Meses Límite</label>
                                <input
                                    type="number"
                                    min="1"
                                    max="24"
                                    className={`w-full border rounded-xl px-3 py-2 bg-white dark:bg-gray-800 text-slate-800 dark:text-gray-100 ${errors.limite_meses ? 'border-red-300 dark:border-red-400' : 'border-slate-200 dark:border-gray-700'}`}
                                    value={form.reglas_decomision.limite_meses}
                                    onChange={e => setForm(prev => ({
                                        ...prev,
                                        reglas_decomision: { ...prev.reglas_decomision, limite_meses: e.target.value }
                                    }))}
                                />
                                {errors.limite_meses && <p className="text-xs text-red-600 mt-1">{errors.limite_meses}</p>}
                            </div>
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
                        className="flex items-center gap-2 px-6 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-shadow hover:shadow-lg"
                    >
                        <Save className="w-4 h-4" />
                        Guardar
                    </button>
                </div>
            </div>
        </div>
    );
});

export default OperadorModal;
