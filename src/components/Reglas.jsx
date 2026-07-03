import { useState } from "react";
import Toast from "./ui/Toast";
import {
  Layers, Settings, Phone, Zap, Shield, Plus, Edit2, Trash2,
  BookOpen, AlertTriangle
} from "lucide-react";
import { useData } from "../context/AppContexts";
import { NivelEditModal, ReglaEditModal } from "./reglas/index.js";
import { glassStyles, cardHoverStyles } from "../utils/designUtils";
import { normalizeFactor } from "../utils/calculos";

// ==========================================
// COMPONENTE: Tarjeta de Estadística Compacta
// ==========================================
const MiniStatCard = ({ title, value, icon: Icon, gradientFrom, gradientTo }) => (
  <div className={`${glassStyles()} ${cardHoverStyles()} rounded-2xl p-4 relative overflow-hidden group`}>
    <div className={`absolute -right-2 -top-2 w-16 h-16 rounded-full bg-gradient-to-br ${gradientFrom} ${gradientTo} opacity-10 group-hover:opacity-20 transition-opacity duration-500`} />
    <div className="flex items-center gap-3 relative z-10">
      <div className={`p-2.5 rounded-xl bg-gradient-to-br ${gradientFrom} ${gradientTo} shadow-lg`}>
        <Icon className="w-4 h-4 text-white" />
      </div>
      <div>
        <p className="text-xl font-black text-slate-800 dark:text-white">{value}</p>
        <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">{title}</p>
      </div>
    </div>
  </div>
);

// ==========================================
// COMPONENTE PRINCIPAL
// ==========================================
export default function Reglas() {
  const { data, setNiveles, setReglas, dataInitialized } = useData();

  const reglas = Array.isArray(data?.reglas) ? data.reglas : [];
  const operadores = Array.isArray(data?.operadores) ? data.operadores : [];
  const productos = Array.isArray(data?.productos) ? data.productos : [];
  const niveles = Array.isArray(data?.niveles) ? data.niveles : [];

  const [toast, setToast] = useState({ message: "", type: "info" });
  const [activeTab, setActiveTab] = useState("niveles");

  const [modalNivel, setModalNivel] = useState(null);
  const [modalRegla, setModalRegla] = useState(null);

  // Funciones para niveles
  const handleModalNivelSave = (nivel, shouldClose) => {
    const isEditing = modalNivel && modalNivel.id && niveles.some(n => n.id === modalNivel.id);

    if (isEditing) {
      setNiveles(prev => prev.map((n) => (n.id === nivel.id ? nivel : n)));
    } else {
      const nuevoNivel = { ...nivel, id: nivel.id || `n_${Date.now()}` };
      setNiveles(prev => [nuevoNivel, ...prev]);
    }

    if (shouldClose) setModalNivel(null);
    setToast({ message: "Nivel guardado correctamente", type: "success" });
  };

  const removeNivel = (id) => {
    if (window.confirm("¿Seguro que quieres eliminar este nivel?")) {
      setNiveles((arr) => arr.filter((x) => x.id !== id));
      setToast({ message: "Nivel eliminado", type: "info" });
    }
  };

  // Funciones para reglas
  const handleModalReglaSave = (regla, shouldClose) => {
    if (regla.id) {
      setReglas(prev => prev.map((r) => (r.id === regla.id ? regla : r)));
    } else {
      const nuevaRegla = { ...regla, id: `r_${Date.now()}` };
      setReglas(prev => [nuevaRegla, ...prev]);
    }

    if (shouldClose) setModalRegla(null);
    setToast({ message: "Regla guardada correctamente", type: "success" });
  };

  const removeRegla = (id) => {
    if (window.confirm("¿Seguro que quieres eliminar esta regla?")) {
      setReglas((arr) => arr.filter((x) => x.id !== id));
      setToast({ message: "Regla eliminada", type: "info" });
    }
  };

  const getSectorIcon = (sector) => {
    switch (sector) {
      case 'telefonia': return <Phone className="w-4 h-4 text-blue-600" />;
      case 'energia': return <Zap className="w-4 h-4 text-yellow-600" />;
      case 'seguridad': return <Shield className="w-4 h-4 text-red-600" />;
      default: return null;
    }
  };

  if (!dataInitialized) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-slate-200 rounded w-1/4" />
          <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3].map(i => <div key={i} className="h-20 bg-slate-200 rounded-2xl" />)}
          </div>
          <div className="h-64 bg-slate-200 rounded-3xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <Toast
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ message: "", type: "info" })}
      />

      {/* Modales */}
      {modalNivel && (
        <NivelEditModal
          nivel={modalNivel.id ? modalNivel : null}
          onSave={handleModalNivelSave}
          onClose={() => setModalNivel(null)}
        />
      )}

      {modalRegla && (
        <ReglaEditModal
          regla={modalRegla.id ? modalRegla : null}
          onSave={handleModalReglaSave}
          onClose={() => setModalRegla(null)}
          operadores={operadores}
          productos={productos}
        />
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight flex items-center gap-3">
            <div className="p-2 bg-[var(--brand-primary)] rounded-xl shadow-lg">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            Configuración de Reglas
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Define niveles de comisión y reglas específicas por operador
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <MiniStatCard
          title="Niveles"
          value={niveles.length}
          icon={Layers}
          gradientFrom="from-emerald-500"
          gradientTo="to-teal-600"
        />
        <MiniStatCard
          title="Reglas"
          value={reglas.length}
          icon={Settings}
          gradientFrom="from-sky-500"
          gradientTo="to-indigo-600"
        />
        <MiniStatCard
          title="Operadores"
          value={operadores.length}
          icon={Phone}
          gradientFrom="from-blue-500"
          gradientTo="to-blue-600"
        />
        <MiniStatCard
          title="Productos"
          value={productos.length}
          icon={Shield}
          gradientFrom="from-purple-500"
          gradientTo="to-violet-600"
        />
      </div>

      {/* Tabs Premium */}
      <div className={`${glassStyles()} p-2 rounded-2xl inline-flex gap-2`}>
        <button
          onClick={() => setActiveTab("niveles")}
          className={`flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${activeTab === "niveles"
            ? "bg-[var(--brand-primary)] text-white shadow-lg shadow-[var(--brand-primary)]/30"
            : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
        >
          <Layers className="w-4 h-4" />
          Niveles de Comisión
        </button>
        <button
          onClick={() => setActiveTab("reglas")}
          className={`flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${activeTab === "reglas"
            ? "bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-white"
            : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
        >
          <Settings className="w-4 h-4" />
          Reglas Específicas
        </button>
      </div>

      {/* ==========================================
          TAB: NIVELES
          ========================================== */}
      {activeTab === "niveles" && (
        <div className="space-y-6">
          {/* Info Card */}
          <div className={`${glassStyles()} bg-emerald-50/50 dark:bg-emerald-900/20 border-emerald-200/50 dark:border-emerald-700/30 p-5 rounded-2xl`}>
            <div className="flex items-start gap-4">
              <div className="p-3 bg-emerald-100 dark:bg-emerald-900/50 rounded-xl">
                <Layers className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="flex-1">
                <h3 className="font-black text-emerald-900 dark:text-emerald-100 text-sm uppercase tracking-wide mb-2">
                  Comisiones diferenciadas por sector
                </h3>
                <div className="grid sm:grid-cols-3 gap-3 text-xs">
                  <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300">
                    <Phone className="w-4 h-4" />
                    <span>Telefonía: % sobre comisión</span>
                  </div>
                  <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300">
                    <Zap className="w-4 h-4" />
                    <span>Energía: % sobre comisión</span>
                  </div>
                  <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300">
                    <Shield className="w-4 h-4" />
                    <span>Seguridad: Importe fijo</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setModalNivel({})}
                className="flex items-center gap-2 px-5 py-2.5 bg-[var(--brand-primary)] text-white rounded-xl hover:opacity-90 transition-all shadow-lg shadow-[var(--brand-primary)]/30 text-xs font-bold uppercase tracking-widest active:scale-95"
              >
                <Plus className="w-4 h-4" />
                Nuevo Nivel
              </button>
            </div>
          </div>

          {/* Tabla de niveles */}
          <div className={`${glassStyles()} overflow-hidden rounded-3xl`}>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm text-left">
                <thead className="bg-slate-50/80 dark:bg-slate-800/80 backdrop-blur-sm">
                  <tr>
                    <th className="px-4 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">ID</th>
                    <th className="px-4 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Nombre</th>
                    <th className="px-4 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Tipo</th>
                    <th className="px-4 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Telefonía</th>
                    <th className="px-4 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Energía</th>
                    <th className="px-4 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Seguridad</th>
                    <th className="px-4 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                  {niveles.map((n) => (
                    <tr key={n.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors group">
                      <td className="px-4 py-4">
                        <span className="font-mono text-xs font-bold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-lg">
                          {n.id}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <span className="font-bold text-slate-900 dark:text-white">{n.nombre}</span>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`px-3 py-1 rounded-xl text-xs font-bold uppercase ${n.tipo === "MANAGER"
                          ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"
                          : n.tipo === "SUPERVISOR"
                            ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                            : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                          }`}>
                          {n.tipo}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-blue-500" />
                          <span className="font-bold text-blue-600 dark:text-blue-400">
                            {((normalizeFactor(n.pct_telefonia) ?? 0) * 100).toFixed(0)}%
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <Zap className="w-4 h-4 text-yellow-500" />
                          <span className="font-bold text-yellow-600 dark:text-yellow-400">
                            {((normalizeFactor(n.pct_energia) ?? 0) * 100).toFixed(0)}%
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <Shield className="w-4 h-4 text-rose-500" />
                          <span className="font-bold text-rose-600 dark:text-rose-400">
                            {(n.fijo_seguridad || 0).toFixed(2)}€
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => setModalNivel(n)}
                            className="p-2 rounded-xl text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-all"
                            title="Editar"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => removeNivel(n.id)}
                            className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-all"
                            title="Eliminar"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {niveles.length === 0 && (
                <div className="text-center py-12">
                  <Layers className="w-16 h-16 mx-auto text-slate-300 dark:text-slate-600 mb-4" />
                  <p className="text-slate-500 dark:text-slate-400 font-medium">No hay niveles configurados</p>
                  <p className="text-xs text-slate-400 mt-1 mb-4">Añade niveles para asignarlos a colaboradores</p>
                  <button
                    onClick={() => setModalNivel({})}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-[var(--brand-primary)] text-white rounded-xl text-xs font-bold uppercase tracking-widest"
                  >
                    <Plus className="w-4 h-4" />
                    Crear Primer Nivel
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ==========================================
          TAB: REGLAS
          ========================================== */}
      {activeTab === "reglas" && (
        <div className="space-y-6">
          {/* Info Card */}
          <div className={`${glassStyles()} bg-sky-50/50 dark:bg-sky-900/20 border-sky-200/50 dark:border-sky-700/30 p-5 rounded-2xl`}>
            <div className="flex items-start gap-4">
              <div className="p-3 bg-sky-100 dark:bg-sky-900/50 rounded-xl">
                <Settings className="w-6 h-6 text-sky-600 dark:text-sky-400" />
              </div>
              <div className="flex-1">
                <h3 className="font-black text-sky-900 dark:text-sky-100 text-sm uppercase tracking-wide mb-1">
                  Reglas de Comisión por Operador
                </h3>
                <p className="text-xs text-sky-700 dark:text-sky-300">
                  Define las comisiones que la empresa cobra a los operadores. Pueden ser porcentajes o importes fijos.
                </p>
              </div>
              <button
                onClick={() => setModalRegla({})}
                disabled={operadores.length === 0}
                className="flex items-center gap-2 px-5 py-2.5 bg-[var(--brand-primary)] text-white rounded-xl hover:opacity-90 transition-all shadow-lg shadow-[var(--brand-primary)]/30 text-xs font-bold uppercase tracking-widest active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus className="w-4 h-4" />
                Nueva Regla
              </button>
            </div>
          </div>

          {/* Alerta sin operadores */}
          {operadores.length === 0 && (
            <div className={`${glassStyles()} bg-amber-50/50 dark:bg-amber-900/20 border-amber-200/50 dark:border-amber-700/30 p-4 rounded-2xl flex items-start gap-3`}>
              <div className="p-2 bg-amber-100 dark:bg-amber-900/50 rounded-xl">
                <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="font-bold text-amber-900 dark:text-amber-100 text-sm">
                  No hay operadores configurados
                </p>
                <p className="text-amber-700 dark:text-amber-300 text-xs mt-1">
                  Debes crear al menos un operador antes de poder definir reglas.
                </p>
              </div>
            </div>
          )}

          {/* Tabla de reglas */}
          <div className={`${glassStyles()} overflow-hidden rounded-3xl`}>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm text-left">
                <thead className="bg-slate-50/80 dark:bg-slate-800/80 backdrop-blur-sm">
                  <tr>
                    <th className="px-4 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Operador</th>
                    <th className="px-4 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Producto</th>
                    <th className="px-4 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Tipo</th>
                    <th className="px-4 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Sobre</th>
                    <th className="px-4 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Valor</th>
                    <th className="px-4 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Prioridad</th>
                    <th className="px-4 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                  {reglas.map((r) => {
                    const operador = operadores.find((o) => o.id === r.operador_id);
                    const producto = productos.find((p) => p.id === r.producto_id);

                    return (
                      <tr key={r.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors group">
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2">
                            {getSectorIcon(operador?.sector)}
                            <div>
                              <p className="font-bold text-slate-900 dark:text-white">{operador?.nombre || r.operador_id}</p>
                              {operador?.sector && (
                                <p className="text-[10px] text-slate-400 uppercase tracking-wider">{operador.sector}</p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <span className={producto ? "font-medium text-slate-700 dark:text-slate-300" : "text-slate-400"}>
                            {producto?.nombre || "Todos los productos"}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <span className={`px-3 py-1 rounded-xl text-xs font-bold uppercase ${r.tipo === "%"
                            ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                            : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                            }`}>
                            {r.tipo === "%" ? "Porcentaje" : "Fijo"}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <span className="text-slate-600 dark:text-slate-300 text-xs font-medium">
                            {r.pct_sobre === "ComisiónOperador" ? "Comisión Op." : "Base"}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <span className="font-black text-slate-900 dark:text-white">
                            {r.tipo === "%" ? `${(r.valor * 100).toFixed(2)}%` : `${r.valor.toFixed(2)} €`}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <span className="font-medium text-slate-600 dark:text-slate-300">{r.prioridad}</span>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => setModalRegla(r)}
                              className="p-2 rounded-xl text-slate-400 hover:text-sky-600 hover:bg-sky-50 dark:hover:bg-sky-900/20 transition-all"
                              title="Editar"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => removeRegla(r.id)}
                              className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-all"
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

              {reglas.length === 0 && (
                <div className="text-center py-12">
                  <Settings className="w-16 h-16 mx-auto text-slate-300 dark:text-slate-600 mb-4" />
                  <p className="text-slate-500 dark:text-slate-400 font-medium">No hay reglas configuradas</p>
                  <p className="text-xs text-slate-400 mt-1 mb-4">Las reglas definen las comisiones de la empresa por operador</p>
                  <button
                    onClick={() => setModalRegla({})}
                    disabled={operadores.length === 0}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-[var(--brand-primary)] text-white rounded-xl text-xs font-bold uppercase tracking-widest disabled:opacity-50"
                  >
                    <Plus className="w-4 h-4" />
                    Crear Primera Regla
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
