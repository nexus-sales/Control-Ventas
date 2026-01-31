import React, { useState, useCallback, useMemo } from "react";
import {
    Settings2, Plus, Trash2, CheckCircle, XCircle,
    Type, Hash, Calendar, List
} from "lucide-react";
import { crearCampoPersonalizado, ejemploCampoPersonalizado } from '../../../data/customFieldsModel';
import Card from "../../ui/Card";

const CustomFieldsSection = React.memo(() => {
    // Cargar campos desde localStorage o usar ejemplo por defecto
    const [campos, setCampos] = useState(() => {
        try {
            const saved = localStorage.getItem("customFields");
            return saved ? JSON.parse(saved) : [ejemploCampoPersonalizado];
        } catch (e) {
            console.error("Error cargando campos personalizados:", e);
            return [ejemploCampoPersonalizado];
        }
    });

    // Guardar cambios en localStorage
    React.useEffect(() => {
        try {
            localStorage.setItem("customFields", JSON.stringify(campos));
            // Disparar evento para que otros componentes (como VentaFormModal) se enteren
            window.dispatchEvent(new Event('customFieldsUpdated'));
        } catch (e) {
            console.error("Error guardando campos personalizados:", e);
        }
    }, [campos]);
    const [nuevoCampo, setNuevoCampo] = useState({
        nombre: '',
        tipo: 'texto',
        modulo: 'ventas',
        opciones: '',
        requerido: false,
        orden: 1,
        activo: true,
    });

    const tipos = useMemo(() => [
        { value: 'texto', label: 'Texto', icon: Type },
        { value: 'numero', label: 'Número', icon: Hash },
        { value: 'fecha', label: 'Fecha', icon: Calendar },
        { value: 'select', label: 'Selección', icon: List }
    ], []);

    const modulos = useMemo(() => [
        { value: 'ventas', label: 'Ventas' },
        { value: 'productos', label: 'Productos' },
        { value: 'operadores', label: 'Operadores' }
    ], []);

    const handleChange = useCallback((e) => {
        const { name, value, type, checked } = e.target;
        setNuevoCampo(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    }, []);

    const handleAddCampo = useCallback((e) => {
        e.preventDefault();
        if (!nuevoCampo.nombre.trim()) {
            alert('El nombre del campo es requerido');
            return;
        }
        if (campos.some(c => c.nombre.toLowerCase() === nuevoCampo.nombre.toLowerCase())) {
            alert('Ya existe un campo con ese nombre');
            return;
        }
        const opcionesArr = nuevoCampo.tipo === 'select'
            ? nuevoCampo.opciones.split(',').map(o => o.trim()).filter(o => o)
            : [];
        if (nuevoCampo.tipo === 'select' && opcionesArr.length === 0) {
            alert('Debes especificar al menos una opción para campos de selección');
            return;
        }
        const campo = crearCampoPersonalizado({
            ...nuevoCampo,
            opciones: opcionesArr,
            orden: campos.length + 1
        });
        setCampos(prev => [...prev, campo]);
        setNuevoCampo({
            nombre: '', tipo: 'texto', modulo: 'ventas', opciones: '',
            requerido: false, orden: campos.length + 2, activo: true
        });
    }, [nuevoCampo, campos]);

    const handleDeleteCampo = useCallback((id) => {
        if (window.confirm('¿Estás seguro de que quieres eliminar este campo?')) {
            setCampos(prev => prev.filter(c => c.id !== id));
        }
    }, []);

    const handleToggleActive = useCallback((id) => {
        setCampos(prev => prev.map(c =>
            c.id === id ? { ...c, activo: !c.activo } : c
        ));
    }, []);

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div>
                <h3 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                    <Settings2 className="w-7 h-7 text-purple-600" />
                    Campos Personalizados
                </h3>
                <p className="text-slate-500 dark:text-gray-400 mt-1">Añade información extra a tus ventas, productos o operadores de forma flexible.</p>
            </div>

            <Card className="border-slate-200 dark:border-gray-800 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm overflow-hidden shadow-xl">
                <div className="bg-slate-50 dark:bg-gray-800/50 p-4 border-b border-slate-200 dark:border-gray-800">
                    <h4 className="font-bold text-slate-700 dark:text-gray-200 flex items-center gap-2">
                        <Plus className="w-4 h-4 text-green-500" />
                        Configurar Nuevo Campo
                    </h4>
                </div>

                <form onSubmit={handleAddCampo} className="p-6 space-y-6">
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-400 dark:text-gray-500 uppercase ml-1">Nombre del campo</label>
                            <input
                                className="w-full border border-slate-200 dark:border-gray-700 rounded-xl px-4 py-2.5 bg-white dark:bg-gray-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none"
                                name="nombre"
                                placeholder="Ej: Código de Instalación"
                                value={nuevoCampo.nombre}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-400 dark:text-gray-500 uppercase ml-1">Tipo de Dato</label>
                            <select
                                className="w-full border border-slate-200 dark:border-gray-700 rounded-xl px-4 py-2.5 bg-white dark:bg-gray-800 text-slate-900 dark:text-white"
                                name="tipo"
                                value={nuevoCampo.tipo}
                                onChange={handleChange}
                            >
                                {tipos.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                            </select>
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-400 dark:text-gray-500 uppercase ml-1">Módulo Destino</label>
                            <select
                                className="w-full border border-slate-200 dark:border-gray-700 rounded-xl px-4 py-2.5 bg-white dark:bg-gray-800 text-slate-900 dark:text-white"
                                name="modulo"
                                value={nuevoCampo.modulo}
                                onChange={handleChange}
                            >
                                {modulos.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                            </select>
                        </div>
                    </div>

                    {nuevoCampo.tipo === 'select' && (
                        <div className="animate-in slide-in-from-top-2 duration-300">
                            <label className="text-xs font-bold text-slate-400 dark:text-gray-500 uppercase ml-1">Opciones de Selección</label>
                            <input
                                className="w-full border border-slate-200 dark:border-gray-700 rounded-xl px-4 py-2.5 bg-white dark:bg-gray-800 text-slate-900 dark:text-white placeholder-slate-400"
                                name="opciones"
                                placeholder="Valor 1, Valor 2, Valor 3..."
                                value={nuevoCampo.opciones}
                                onChange={handleChange}
                            />
                            <p className="text-[10px] text-slate-400 mt-1 ml-1 font-medium italic">Escribe las opciones separadas por comas.</p>
                        </div>
                    )}

                    <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-gray-800">
                        <label className="flex items-center gap-3 cursor-pointer group">
                            <div className="relative">
                                <input
                                    type="checkbox"
                                    name="requerido"
                                    checked={nuevoCampo.requerido}
                                    onChange={handleChange}
                                    className="sr-only peer"
                                />
                                <div className="w-10 h-5 bg-slate-200 dark:bg-gray-700 rounded-full peer peer-checked:bg-purple-600 transition-colors"></div>
                                <div className="absolute left-1 top-1 w-3 h-3 bg-white rounded-full peer-checked:translate-x-5 transition-transform"></div>
                            </div>
                            <span className="text-sm font-bold text-slate-600 dark:text-gray-300 group-hover:text-purple-600 transition-colors">Campo obligatorio</span>
                        </label>

                        <button
                            className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-2.5 rounded-xl font-bold transition-all shadow-lg hover:shadow-purple-500/20 active:scale-95 flex items-center gap-2"
                            type="submit"
                        >
                            <Plus className="w-4 h-4" />
                            Crear Campo
                        </button>
                    </div>
                </form>
            </Card>

            <div className="space-y-4">
                <h4 className="text-lg font-bold text-slate-800 dark:text-white px-1">Campos Configurador</h4>
                <div className="grid gap-3">
                    {campos.map(campo => {
                        const TipoIcon = tipos.find(t => t.value === campo.tipo)?.icon || Type;
                        return (
                            <Card key={campo.id} className={`p-4 border-slate-200 dark:border-gray-800 transition-all ${campo.activo ? 'bg-white dark:bg-gray-900' : 'bg-slate-50 dark:bg-gray-950 opacity-60'}`}>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-slate-100 dark:bg-gray-800 rounded-xl text-slate-500">
                                            <TipoIcon className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-300">{campo.modulo}</span>
                                                {campo.requerido && <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-300">REQUERIDO</span>}
                                                <h5 className="font-bold text-slate-900 dark:text-white">{campo.nombre}</h5>
                                            </div>
                                            <p className="text-xs text-slate-500 dark:text-gray-400 mt-0.5 lowercase capitalize-first">
                                                Tipo: {campo.tipo} {campo.opciones?.length > 0 && `(${campo.opciones.join(", ")})`}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <button
                                            onClick={() => handleToggleActive(campo.id)}
                                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black transition-colors ${campo.activo
                                                ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                                                : 'bg-slate-200 dark:bg-gray-800 text-slate-500 dark:text-gray-500'
                                                }`}
                                        >
                                            {campo.activo ? <CheckCircle className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                                            {campo.activo ? 'ACTIVO' : 'INACTIVO'}
                                        </button>

                                        <button
                                            className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                                            onClick={() => handleDeleteCampo(campo.id)}
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            </Card>
                        );
                    })}
                </div>
            </div>
        </div>
    );
});

export default CustomFieldsSection;
