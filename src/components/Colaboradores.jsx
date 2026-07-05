import { useState, useMemo } from "react";
import {
  AlertCircle, Plus, Phone, Zap, Shield, User, Edit3, Trash2,
  Users, UserCheck, UserX, Sparkles, Search
} from "lucide-react";
import { useAuth, useData } from "../context/AppContexts";
import { ColaboradorEditModal } from "./colaboradores/index.js";
import { glassStyles, cardHoverStyles } from "../utils/designUtils";
import { procesarColaboradores, filtrarColaboradores, getZonaNombre, getNivelInfo } from "./colaboradores/colaboradoresUtils";
import { normalizeFactor, getColaboradorNivelId } from "../utils/calculos";

// ==========================================
// COMPONENTE: Tarjeta de Estadística Premium
// ==========================================
const StatCard = ({ title, value, icon: _Icon, gradientFrom, gradientTo }) => (
  <div className={`${glassStyles()} ${cardHoverStyles()} rounded-3xl p-5 relative overflow-hidden group`}>
    <div className={`absolute -right-4 -top-4 w-20 h-20 rounded-full bg-gradient-to-br ${gradientFrom} ${gradientTo} opacity-10 group-hover:opacity-20 transition-opacity duration-500`} />
    <div className="flex items-center justify-between relative z-10">
      <div className="space-y-1">
        <p className="text-slate-500 dark:text-slate-400 text-[10px] font-black uppercase tracking-widest">{title}</p>
        <p className="text-2xl font-black text-slate-800 dark:text-white">{value}</p>
      </div>
      <div className={`p-3 rounded-2xl bg-gradient-to-br ${gradientFrom} ${gradientTo} shadow-lg`}>
        <_Icon className="w-5 h-5 text-white" />
      </div>
    </div>
  </div>
);

// ==========================================
// COMPONENTE PRINCIPAL
// ==========================================
export default function Colaboradores() {
  const { isAdmin } = useAuth();
  const { data, setColaboradores, dataInitialized } = useData();

  const colaboradores = useMemo(
    () => (Array.isArray(data?.colaboradores) ? data.colaboradores : []),
    [data?.colaboradores]
  );
  const niveles = Array.isArray(data?.niveles) ? data.niveles : [];
  const zonas = Array.isArray(data?.zonas) ? data.zonas : [];

  const [modalColaborador, setModalColaborador] = useState(null);
  const [filtroEstado, setFiltroEstado] = useState("TODOS");
  const [searchTerm, setSearchTerm] = useState("");

  // Calcular IRPF y filtrar colaboradores
  const colaboradoresProcesados = useMemo(() => {
    return procesarColaboradores(colaboradores);
  }, [colaboradores]);

  const colaboradoresFiltrados = useMemo(() => {
    return filtrarColaboradores(colaboradoresProcesados, { searchTerm, filtroEstado });
  }, [colaboradoresProcesados, filtroEstado, searchTerm]);

  const handleModalColaboradorSave = (colaborador, shouldClose) => {
    const isEditing = modalColaborador && modalColaborador.id && colaboradores.some(c => c.id === modalColaborador.id);

    if (isEditing) {
      setColaboradores(prev => prev.map((c) => (c.id === colaborador.id ? colaborador : c)));
    } else {
      const nuevoColaborador = {
        ...colaborador,
        id: colaborador.id || `c_${Date.now()}`
      };
      setColaboradores(prev => [nuevoColaborador, ...prev]);
    }

    if (shouldClose) setModalColaborador(null);
  };

  const eliminarColaborador = (id) => {
    if (window.confirm("¿Estás seguro de que quieres eliminar este colaborador? Esta acción no se puede deshacer.")) {
      setColaboradores(prev => prev.filter((c) => c.id !== id));
    }
  };

  // Loading state
  if (!dataInitialized) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-slate-200 rounded w-1/4" />
          <div className="grid grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => <div key={i} className="h-24 bg-slate-200 rounded-3xl" />)}
          </div>
          <div className="h-64 bg-slate-200 rounded-3xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Alerta de niveles */}
      {niveles.length === 0 && (
        <div className={`${glassStyles()} bg-amber-50/50 dark:bg-amber-900/20 border-amber-200/50 dark:border-amber-700/30 p-4 rounded-2xl flex items-start gap-3`}>
          <div className="p-2 bg-amber-100 dark:bg-amber-900/50 rounded-xl">
            <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <p className="font-bold text-amber-900 dark:text-amber-100 text-sm uppercase tracking-wide">
              No hay niveles configurados
            </p>
            <p className="text-amber-700 dark:text-amber-300 text-xs mt-1 font-medium">
              Ve a la pestaña de Reglas para configurar niveles antes de añadir colaboradores
            </p>
          </div>
        </div>
      )}

      {/* Header */}
      {niveles.length > 0 && (
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
                <Users className="w-6 h-6 text-white" />
              </div>
              Gestión de Colaboradores
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
              Administra el equipo comercial y sus comisiones
            </p>
          </div>
          <button
            onClick={() => setModalColaborador({})}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl hover:from-blue-600 hover:to-indigo-700 transition-all shadow-lg hover:shadow-blue-500/30 text-xs font-bold uppercase tracking-widest active:scale-95"
          >
            <Plus className="w-4 h-4" />
            Nuevo Colaborador
          </button>
        </div>
      )}

      {/* Estadísticas */}
      {colaboradoresProcesados.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total"
            value={colaboradoresProcesados.length}
            icon={Users}
            gradientFrom="from-blue-500"
            gradientTo="to-indigo-600"
          />
          <StatCard
            title="Activos"
            value={colaboradoresProcesados.filter(c => c.esta_activo).length}
            icon={UserCheck}
            gradientFrom="from-emerald-500"
            gradientTo="to-teal-600"
          />
          <StatCard
            title="Inactivos"
            value={colaboradoresProcesados.filter(c => !c.esta_activo).length}
            icon={UserX}
            gradientFrom="from-rose-500"
            gradientTo="to-red-600"
          />
          <StatCard
            title="Comisión Personal"
            value={colaboradoresProcesados.filter(c => c.pct_telefonia != null || c.pct_energia != null || c.fijo_seguridad != null).length}
            icon={Sparkles}
            gradientFrom="from-purple-500"
            gradientTo="to-violet-600"
          />
        </div>
      )}

      {/* Barra de Filtros */}
      {colaboradoresProcesados.length > 0 && (
        <div className={`${glassStyles()} p-5 rounded-3xl`}>
          <div className="flex flex-col md:flex-row gap-4">
            {/* Búsqueda */}
            <div className="relative flex-1 group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
              </div>
              <input
                type="text"
                className="block w-full pl-11 pr-4 py-3 rounded-2xl border-none bg-slate-100 dark:bg-slate-800/50 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:ring-2 focus:ring-blue-500/50 focus:bg-white dark:focus:bg-slate-800 transition-all shadow-inner text-sm font-medium"
                placeholder="Buscar por nombre, CIF/DNI o email..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Filtros de estado */}
            <div className="flex gap-2">
              {["TODOS", "ACTIVOS", "INACTIVOS"].map((estado) => (
                <button
                  key={estado}
                  onClick={() => setFiltroEstado(estado)}
                  className={`px-4 py-3 rounded-2xl text-xs font-bold uppercase tracking-widest transition-all ${filtroEstado === estado
                    ? "bg-blue-500 text-white shadow-lg shadow-blue-500/30"
                    : "bg-slate-100 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                    }`}
                >
                  {estado.charAt(0) + estado.slice(1).toLowerCase()}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-3 text-xs text-slate-500 dark:text-slate-400 font-medium">
            Mostrando <span className="font-bold text-slate-800 dark:text-white">{colaboradoresFiltrados.length}</span> de {colaboradoresProcesados.length} colaboradores
          </div>
        </div>
      )}

      {/* Tabla de colaboradores */}
      {colaboradoresFiltrados.length > 0 && (
        <div className={`${glassStyles()} overflow-hidden rounded-3xl`}>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm text-left">
              <thead className="bg-slate-50/80 dark:bg-slate-800/80 backdrop-blur-sm">
                <tr>
                  <th className="px-4 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Colaborador</th>
                  <th className="px-4 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Tipo Fiscal</th>
                  <th className="px-4 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Nivel</th>
                  <th className="px-4 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Sectores</th>
                  <th className="px-4 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Zona</th>
                  <th className="px-4 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Estado</th>
                  <th className="px-4 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                {colaboradoresFiltrados.map((c) => {
                  const nivelInfo = getNivelInfo(niveles, getColaboradorNivelId(c));
                  // Override real (pct_telefonia/pct_energia/fijo_seguridad en el propio
                  // colaborador) que getColaboradorComision (calculos.js) aplica por
                  // campo sobre los valores del nivel — no "comision_personalizada_activa"
                  // (nombre que nunca existió en colaboradores_cv).
                  const tienePersonalizacion = c.pct_telefonia != null || c.pct_energia != null || c.fijo_seguridad != null;

                  return (
                    <tr key={c.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors group">
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                            <User className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 dark:text-white">{c.nombre}</p>
                            {isAdmin && c.cif_dni && <p className="text-xs text-slate-400">{c.cif_dni}</p>}
                            {isAdmin && c.email && <p className="text-xs text-slate-400">{c.email}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`px-3 py-1 rounded-xl text-xs font-bold uppercase ${c.tipo_fiscal === "EMPRESA"
                          ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                          : c.tipo_fiscal === "AUTONOMO_ESPECIAL"
                            ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"
                            : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                          }`}>
                          {c.tipo_fiscal === "EMPRESA" ? "Empresa" : c.tipo_fiscal === "AUTONOMO_ESPECIAL" ? "Aut. Especial" : "Autónomo"}
                        </span>
                        <p className="text-xs text-slate-400 mt-1">
                          {c.exento_impuestos ? (
                            <span className="text-emerald-600 font-bold">IRPF: Exento</span>
                          ) : c.irpf_calculado !== null ? (
                            `IRPF: ${c.irpf_calculado}%`
                          ) : "IRPF: -"}
                        </p>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`px-3 py-1 rounded-xl text-xs font-bold ${nivelInfo?.tipo === "MANAGER"
                          ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"
                          : nivelInfo?.tipo === "SUPERVISOR"
                            ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                            : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                          }`}>
                          {nivelInfo?.nombre || getColaboradorNivelId(c)}
                        </span>
                        {tienePersonalizacion && (
                          <p className="text-xs text-amber-600 dark:text-amber-400 font-bold mt-1 flex items-center gap-1">
                            <Sparkles className="w-3 h-3" />
                            Personalizado
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <div className="space-y-1">
                          {tienePersonalizacion && !isAdmin ? (
                            <span className="text-xs text-slate-400 italic">Personalizado (solo admin)</span>
                          ) : nivelInfo || tienePersonalizacion ? (
                            <div className="text-xs space-y-1">
                              <div className="flex items-center gap-1">
                                <Phone className="w-3 h-3 text-blue-500" />
                                <span className="text-slate-600 dark:text-slate-300">{((normalizeFactor(c.pct_telefonia ?? nivelInfo?.pct_telefonia) ?? 0) * 100).toFixed(0)}%</span>
                                {c.pct_telefonia != null && <Sparkles className="w-3 h-3 text-amber-500" />}
                              </div>
                              <div className="flex items-center gap-1">
                                <Zap className="w-3 h-3 text-yellow-500" />
                                <span className="text-slate-600 dark:text-slate-300">{((normalizeFactor(c.pct_energia ?? nivelInfo?.pct_energia) ?? 0) * 100).toFixed(0)}%</span>
                                {c.pct_energia != null && <Sparkles className="w-3 h-3 text-amber-500" />}
                              </div>
                              <div className="flex items-center gap-1">
                                <Shield className="w-3 h-3 text-green-500" />
                                <span className="text-slate-600 dark:text-slate-300">€{(c.fijo_seguridad ?? nivelInfo?.fijo_seguridad ?? 0).toFixed(2)}</span>
                                {c.fijo_seguridad != null && <Sparkles className="w-3 h-3 text-amber-500" />}
                              </div>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400">Por nivel</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-slate-700 dark:text-slate-300 font-medium">{getZonaNombre(zonas, c.zona_id)}</span>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-xl text-xs font-bold ${c.esta_activo
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                          : 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400'
                          }`}>
                          {c.esta_activo ? <UserCheck className="w-3 h-3" /> : <UserX className="w-3 h-3" />}
                          {c.esta_activo ? 'Activo' : 'Inactivo'}
                        </span>
                        {c.fecha_baja && (
                          <p className="text-xs text-rose-600 mt-1">Baja: {c.fecha_baja}</p>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => setModalColaborador(c)}
                            className="p-2 rounded-xl text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all"
                            title="Editar"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => eliminarColaborador(c.id)}
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
          </div>
        </div>
      )}

      {/* Estado vacío */}
      {colaboradoresProcesados.length === 0 && niveles.length > 0 && (
        <div className={`${glassStyles()} rounded-3xl p-12 text-center`}>
          <div className="max-w-md mx-auto">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500/20 to-indigo-500/20 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <Users className="w-10 h-10 text-blue-500" />
            </div>
            <h3 className="text-xl font-black text-slate-800 dark:text-white mb-2">
              No hay colaboradores registrados
            </h3>
            <p className="text-slate-500 dark:text-slate-400 mb-6">
              Añade tu primer colaborador para comenzar a gestionar comisiones y ventas.
            </p>
            <button
              onClick={() => setModalColaborador({})}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl hover:from-blue-600 hover:to-indigo-700 transition-all shadow-lg hover:shadow-blue-500/30 text-sm font-bold uppercase tracking-widest active:scale-95"
            >
              <Plus className="w-5 h-5" />
              Crear Primer Colaborador
            </button>
          </div>
        </div>
      )}

      {/* Modal de edición/creación */}
      {modalColaborador && (
        <ColaboradorEditModal
          colaborador={modalColaborador}
          onSave={handleModalColaboradorSave}
          onClose={() => setModalColaborador(null)}
          niveles={niveles}
          zonas={zonas}
        />
      )}
    </div>
  );
}
