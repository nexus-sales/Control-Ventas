import React, { useState, useCallback } from "react";
import { Trash2, Shield, Lock, FileText, Download, Users, Briefcase } from "lucide-react";
import { CLAVE_GERENTE } from "../../../utils/constants";
import Card from "../../ui/Card";
import UserManagement from "../../admin/UserManagement";
import { useAuth } from "../../../context/AppContexts";

const AdministracionSection = React.memo(() => {
    const { isAdmin: isSupabaseAdmin } = useAuth();
    const OPERADORES = ["Telefonía", "Energía", "Seguridad"];

    const [activeTab, setActiveTab] = useState("usuarios"); // 'usuarios' o 'acuerdos'
    const [acuerdos, setAcuerdos] = useState([]);
    const [form, setForm] = useState({
        sector: "Telefonía",
        operador: "",
        nombre: "",
        comision: "",
        rapel: "",
        observaciones: "",
        archivo: null,
        archivoNombre: ""
    });
    const [clave, setClave] = useState("");
    const [acceso, setAcceso] = useState(false);
    const [errorClave, setErrorClave] = useState("");

    const handleClaveSubmit = useCallback((e) => {
        e.preventDefault();
        if (clave === CLAVE_GERENTE) {
            setAcceso(true);
            setErrorClave("");
        } else {
            setErrorClave("Clave incorrecta");
        }
    }, [clave]);

    const handleFormSubmit = useCallback((e) => {
        e.preventDefault();
        if (!form.operador.trim() || !form.nombre.trim() || !form.comision.trim()) {
            alert("Por favor, rellena los campos obligatorios.");
            return;
        }
        setAcuerdos(prev => [...prev, { ...form, id: Date.now() }]);
        setForm({
            sector: "Telefonía",
            operador: "",
            nombre: "",
            comision: "",
            rapel: "",
            observaciones: "",
            archivo: null,
            archivoNombre: ""
        });
    }, [form]);

    const handleDelete = useCallback((id) => {
        if (window.confirm("¿Seguro que quieres eliminar este acuerdo?")) {
            setAcuerdos(prev => prev.filter(a => a.id !== id));
        }
    }, []);

    // Si es admin de Supabase, saltamos la clave de gerente
    const tieneAcceso = acceso || isSupabaseAdmin;

    if (!tieneAcceso) {
        return (
            <div className="max-w-md mx-auto mt-16 p-8 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-gray-800">
                <div className="flex flex-col items-center mb-6">
                    <div className="bg-[var(--brand-primary)]/10 p-4 rounded-full mb-4">
                        <Lock className="w-8 h-8 text-[var(--brand-primary)]" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Área Restringida</h2>
                    <p className="text-slate-500 dark:text-gray-400 text-sm text-center mt-2">Introduce la clave de gerente o inicia sesión como administrador.</p>
                </div>

                <form onSubmit={handleClaveSubmit} className="space-y-4">
                    <div>
                        <input
                            type="password"
                            className="w-full border border-slate-300 dark:border-gray-700 rounded-xl px-4 py-3 bg-white dark:bg-gray-800 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-[var(--brand-primary)] focus:border-transparent transition-all outline-none"
                            placeholder="••••••••"
                            value={clave}
                            onChange={e => setClave(e.target.value)}
                            required
                            autoFocus
                        />
                    </div>
                    {errorClave && (
                        <div className="flex items-center gap-2 text-red-600 dark:text-red-400 text-sm bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
                            <span>⚠️ {errorClave}</span>
                        </div>
                    )}
                    <button
                        type="submit"
                        className="w-full bg-[var(--brand-primary)] hover:opacity-90 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-[var(--brand-primary)]/20 active:scale-[0.98]"
                    >
                        Validar Acceso
                    </button>
                </form>
            </div>
        );
    }

    return (
        <section className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500 pb-12">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h2 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                        <Shield className="w-8 h-8 text-[var(--brand-primary)]" />
                        Panel de Administración
                    </h2>
                    <p className="text-slate-500 dark:text-gray-400 mt-1">Gestión avanzada de usuarios y reglas de negocio.</p>
                </div>

                <div className="flex bg-slate-100 dark:bg-gray-800 p-1 rounded-xl border border-slate-200 dark:border-gray-700">
                    <button
                        onClick={() => setActiveTab("usuarios")}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === "usuarios"
                            ? "bg-white dark:bg-gray-700 text-[var(--brand-primary)] shadow-sm"
                            : "text-slate-500 dark:text-gray-400 hover:text-slate-700 dark:hover:text-white"
                            }`}
                    >
                        <Users className="w-4 h-4" />
                        Usuarios
                    </button>
                    <button
                        onClick={() => setActiveTab("acuerdos")}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === "acuerdos"
                            ? "bg-white dark:bg-gray-700 text-[var(--brand-primary)] shadow-sm"
                            : "text-slate-500 dark:text-gray-400 hover:text-slate-700 dark:hover:text-white"
                            }`}
                    >
                        <Briefcase className="w-4 h-4" />
                        Acuerdos
                    </button>
                </div>
            </div>

            {activeTab === "usuarios" ? (
                <UserManagement />
            ) : (
                <div className="space-y-8">
                    <Card className="border-slate-200 dark:border-gray-800 shadow-xl overflow-hidden">
                        <div className="bg-slate-50 dark:bg-gray-800/50 p-6 border-b border-slate-200 dark:border-gray-800">
                            <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                                <FileText className="w-5 h-5 text-green-500" />
                                Nuevo Registro de Acuerdo (Legacy)
                            </h3>
                        </div>

                        <form onSubmit={handleFormSubmit} className="p-6">
                            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-500 dark:text-gray-400 ml-1">SECTOR</label>
                                    <select
                                        className="w-full border border-slate-200 dark:border-gray-700 rounded-xl px-4 py-2.5 bg-white dark:bg-gray-800 text-slate-900 dark:text-white"
                                        value={form.sector}
                                        onChange={e => setForm(f => ({ ...f, sector: e.target.value }))}
                                    >
                                        {OPERADORES.map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-500 dark:text-gray-400 ml-1">OPERADOR *</label>
                                    <input
                                        type="text"
                                        className="w-full border border-slate-200 dark:border-gray-700 rounded-xl px-4 py-2.5 bg-white dark:bg-gray-800 text-slate-900 dark:text-white placeholder-slate-400"
                                        placeholder="Nombre del operador"
                                        value={form.operador}
                                        onChange={e => setForm(f => ({ ...f, operador: e.target.value }))}
                                        required
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-500 dark:text-gray-400 ml-1">NOMBRE ACUERDO *</label>
                                    <input
                                        type="text"
                                        className="w-full border border-slate-200 dark:border-gray-700 rounded-xl px-4 py-2.5 bg-white dark:bg-gray-800 text-slate-900 dark:text-white placeholder-slate-400"
                                        placeholder="Ej: Contrato Anual 2024"
                                        value={form.nombre}
                                        onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
                                        required
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-500 dark:text-gray-400 ml-1">COMISIÓN % *</label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            min="0"
                                            max="100"
                                            step="0.1"
                                            className="w-full border border-slate-200 dark:border-gray-700 rounded-xl px-4 py-2.5 bg-white dark:bg-gray-800 text-slate-900 dark:text-white placeholder-slate-400"
                                            placeholder="0.0"
                                            value={form.comision}
                                            onChange={e => setForm(f => ({ ...f, comision: e.target.value }))}
                                            required
                                        />
                                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">%</span>
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-500 dark:text-gray-400 ml-1">RAPEL / VARIABLE</label>
                                    <input
                                        type="text"
                                        className="w-full border border-slate-200 dark:border-gray-700 rounded-xl px-4 py-2.5 bg-white dark:bg-gray-800 text-slate-900 dark:text-white placeholder-slate-400"
                                        placeholder="Ej: +2% por >100 ventas"
                                        value={form.rapel}
                                        onChange={e => setForm(f => ({ ...f, rapel: e.target.value }))}
                                    />
                                </div>

                                <div className="md:col-span-2 lg:col-span-1 space-y-1">
                                    <label className="text-xs font-bold text-slate-500 dark:text-gray-400 ml-1">OBSERVACIONES</label>
                                    <input
                                        type="text"
                                        className="w-full border border-slate-200 dark:border-gray-700 rounded-xl px-4 py-2.5 bg-white dark:bg-gray-800 text-slate-900 dark:text-white placeholder-slate-400"
                                        placeholder="Detalles clave..."
                                        value={form.observaciones}
                                        onChange={e => setForm(f => ({ ...f, observaciones: e.target.value }))}
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end">
                                <button
                                    type="submit"
                                    className="bg-green-600 hover:bg-green-700 text-white font-bold px-8 py-3 rounded-xl transition-all shadow-lg hover:shadow-green-500/20 active:scale-95"
                                >
                                    Registrar Acuerdo
                                </button>
                            </div>
                        </form>
                    </Card>

                    <div className="space-y-4">
                        <h3 className="text-xl font-bold text-slate-800 dark:text-white px-1">Historial de Acuerdos (LocalStorage)</h3>
                        {acuerdos.length === 0 ? (
                            <div className="bg-slate-100 dark:bg-gray-800/50 rounded-2xl p-12 text-center border-2 border-dashed border-slate-200 dark:border-gray-700">
                                <div className="text-slate-400 dark:text-gray-500 text-lg">No hay acuerdos registrados actualmente.</div>
                            </div>
                        ) : (
                            <div className="grid gap-4">
                                {acuerdos.map(acuerdo => (
                                    <Card key={acuerdo.id} className="p-4 border-slate-200 dark:border-gray-800 hover:border-[var(--brand-primary)]/50 dark:hover:border-[var(--brand-primary)]/50 transition-colors shadow-sm">
                                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 bg-slate-100 dark:bg-gray-800 rounded-xl flex items-center justify-center font-bold text-slate-400">
                                                    {acuerdo.operador.substring(0, 2).toUpperCase()}
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs font-bold bg-[var(--brand-primary)]/10 text-[var(--brand-primary)] px-2 py-0.5 rounded uppercase">{acuerdo.sector}</span>
                                                        <h4 className="font-bold text-slate-900 dark:text-white">{acuerdo.nombre}</h4>
                                                    </div>
                                                    <p className="text-sm text-slate-500 dark:text-gray-400">{acuerdo.operador}</p>
                                                </div>
                                            </div>

                                            <div className="flex flex-wrap items-center gap-6">
                                                <div className="text-center md:text-right">
                                                    <div className="text-xs font-bold text-slate-400 uppercase">Comisión</div>
                                                    <div className="text-lg font-black text-green-600 dark:text-green-400">{acuerdo.comision}%</div>
                                                </div>
                                                {acuerdo.rapel && (
                                                    <div className="text-center md:text-right">
                                                        <div className="text-xs font-bold text-slate-400 uppercase">Rapel</div>
                                                        <div className="text-sm font-bold text-[var(--brand-primary)]">{acuerdo.rapel}</div>
                                                    </div>
                                                )}
                                                <div className="flex gap-2 ml-4">
                                                    <button className="p-2 text-slate-400 hover:text-[var(--brand-primary)] transition-colors" title="Descargar PDF">
                                                        <Download className="w-5 h-5" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(acuerdo.id)}
                                                        className="p-2 text-slate-400 hover:text-red-600 transition-colors"
                                                        title="Eliminar registro"
                                                    >
                                                        <Trash2 className="w-5 h-5" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </section>
    );
});

export default AdministracionSection;
