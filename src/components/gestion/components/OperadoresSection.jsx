import React, { useState, useMemo, useCallback } from "react";
import { useData } from "../../../context/AppContexts";
import {
    Building, Plus, Edit3, Trash2, Download, AlertCircle,
    Phone, Zap, Shield, MoreHorizontal, Trophy, Package, Search
} from "lucide-react";
import { saveAs } from "file-saver";
import OperadorModal from "./OperadorModal";
import { cleanOperadores, cleanProductosRobust } from "../utils/gestionUtils";
import { glassStyles, cardHoverStyles } from "../../../utils/designUtils";

// ==========================================
// COMPONENTE: Tarjeta de Sector Premium
// ==========================================
const SectorCard = ({ title, operadores, productos, icon: Icon, gradientFrom, gradientTo, onClick, isActive }) => (
    <button
        onClick={onClick}
        className={`${glassStyles()} ${cardHoverStyles()} w-full rounded-3xl p-5 relative overflow-hidden group text-left transition-all ${isActive ? 'ring-2 ring-offset-2 ring-offset-transparent' : ''}`}
        style={{ '--tw-ring-color': isActive ? gradientFrom.replace('from-', '') : 'transparent' }}
    >
        <div className={`absolute -right-4 -top-4 w-20 h-20 rounded-full bg-gradient-to-br ${gradientFrom} ${gradientTo} opacity-10 group-hover:opacity-20 transition-opacity duration-500`} />
        <div className="flex items-center justify-between relative z-10">
            <div className="space-y-1">
                <p className="text-slate-500 dark:text-slate-400 text-[10px] font-black uppercase tracking-widest">{title}</p>
                <p className="text-2xl font-black text-slate-800 dark:text-white">{operadores}</p>
                <p className="text-xs font-bold text-slate-400">{productos} productos</p>
            </div>
            <div className={`p-3 rounded-2xl bg-gradient-to-br ${gradientFrom} ${gradientTo} shadow-lg`}>
                <Icon className="w-5 h-5 text-white" />
            </div>
        </div>
    </button>
);

// ==========================================
// COMPONENTE: Top Operador Card
// ==========================================
const TopOperadorCard = ({ operador, index }) => (
    <div className={`${glassStyles()} ${cardHoverStyles()} rounded-2xl p-4 text-center relative overflow-hidden group`}>
        {index < 3 && (
            <div className={`absolute top-2 right-2 p-1.5 rounded-lg ${index === 0 ? 'bg-amber-100 text-amber-600' :
                index === 1 ? 'bg-slate-100 text-slate-500' :
                    'bg-orange-100 text-orange-600'
                }`}>
                <Trophy className="w-3 h-3" />
            </div>
        )}
        <p className="font-bold text-slate-800 dark:text-white text-sm truncate">{operador.nombre}</p>
        <p className="text-2xl font-black text-[var(--brand-primary)] mt-1">{operador.totalProductos}</p>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1 capitalize">{operador.sector}</p>
    </div>
);

// ==========================================
// COMPONENTE PRINCIPAL
// ==========================================
const OperadoresSection = React.memo(() => {
    const { data, setOperadores } = useData();
    const operadores = useMemo(() => cleanOperadores(data.operadores || []), [data.operadores]);
    const productos = useMemo(() => cleanProductosRobust(data.productos || [], operadores), [data.productos, operadores]);

    const [showModal, setShowModal] = useState(false);
    const [editingOperador, setEditingOperador] = useState(null);
    const [error, setError] = useState("");
    const [filtroSector, setFiltroSector] = useState("");
    const [filtroProductos, setFiltroProductos] = useState("");
    const [searchTerm, setSearchTerm] = useState("");

    const productosConteo = useMemo(() => {
        const conteo = {};
        operadores.forEach(op => {
            conteo[op.id] = productos.filter(p => p.operador_id === op.id).length;
        });
        return conteo;
    }, [operadores, productos]);

    const sectorStats = useMemo(() => {
        const stats = {
            telefonia: { operadores: 0, productos: 0 },
            energia: { operadores: 0, productos: 0 },
            seguridad: { operadores: 0, productos: 0 },
            otros: { operadores: 0, productos: 0 },
        };

        operadores.forEach(o => {
            const sector = ['telefonia', 'energia', 'seguridad'].includes(o.sector) ? o.sector : 'otros';
            stats[sector].operadores++;
            stats[sector].productos += productosConteo[o.id] || 0;
        });

        return stats;
    }, [operadores, productosConteo]);

    const topOperadores = useMemo(() => {
        return operadores
            .map(op => ({ ...op, totalProductos: productosConteo[op.id] || 0 }))
            .sort((a, b) => b.totalProductos - a.totalProductos)
            .slice(0, 5);
    }, [operadores, productosConteo]);

    const operadoresFiltrados = useMemo(() => {
        let filtered = operadores;

        // Búsqueda por texto
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            filtered = filtered.filter(o =>
                o.nombre?.toLowerCase().includes(term) ||
                o.codigo?.toLowerCase().includes(term) ||
                o.sector?.toLowerCase().includes(term)
            );
        }

        if (filtroSector) {
            if (filtroSector === 'otros') {
                filtered = filtered.filter(o => !['telefonia', 'energia', 'seguridad'].includes(o.sector));
            } else {
                filtered = filtered.filter(o => o.sector === filtroSector);
            }
        }

        if (filtroProductos === 'con-productos') {
            filtered = filtered.filter(o => (productosConteo[o.id] || 0) > 0);
        } else if (filtroProductos === 'sin-productos') {
            filtered = filtered.filter(o => (productosConteo[o.id] || 0) === 0);
        }

        return filtered.sort((a, b) => {
            const productosA = productosConteo[a.id] || 0;
            const productosB = productosConteo[b.id] || 0;
            if (productosA !== productosB) return productosB - productosA;
            return a.nombre.localeCompare(b.nombre);
        });
    }, [operadores, productosConteo, filtroSector, filtroProductos, searchTerm]);

    const operadorExists = useCallback((nombre, excludeId = null) => {
        return operadores.some(o =>
            o.id !== excludeId &&
            o.nombre?.toLowerCase().trim() === nombre?.toLowerCase().trim()
        );
    }, [operadores]);

    const handleSave = useCallback((operadorData) => {
        if (operadorExists(operadorData.nombre, operadorData.id)) {
            setError(`Ya existe un operador con el nombre "${operadorData.nombre}"`);
            return;
        }

        setOperadores(prev => {
            let updatedOperadores;
            if (operadorData.id && prev.find(o => o.id === operadorData.id)) {
                updatedOperadores = prev.map(o => o.id === operadorData.id ? operadorData : o);
            } else {
                updatedOperadores = [...prev, operadorData];
            }
            return cleanOperadores(updatedOperadores);
        });

        setError("");
    }, [operadorExists, setOperadores]);

    const handleDelete = useCallback((id) => {
        const numProductos = productosConteo[id] || 0;
        const operador = operadores.find(o => o.id === id);

        if (numProductos > 0) {
            if (!window.confirm(`¿Estás seguro de eliminar "${operador?.nombre}"?\nTen en cuenta que tiene ${numProductos} productos asociados.`)) return;
        } else {
            if (!window.confirm(`¿Seguro que quieres eliminar "${operador?.nombre}"?`)) return;
        }

        setOperadores(prev => {
            const filtered = prev.filter(o => o.id !== id);
            return cleanOperadores(filtered);
        });
    }, [setOperadores, productosConteo, operadores]);

    const exportCSV = useCallback(() => {
        if (!operadoresFiltrados.length) return;

        const headers = ["ID", "Nombre", "Sector", "Código", "Productos", "Contacto", "Teléfono", "Email"];
        const rows = operadoresFiltrados.map(o => [
            o.id,
            o.nombre,
            o.sector,
            o.codigo,
            productosConteo[o.id] || 0,
            o.contacto,
            o.telefono,
            o.email
        ]);
        const csv = [headers.join(",")]
            .concat(rows.map(r => r.map(v => `"${String(v || '').replace(/"/g, '""')}"`).join(",")))
            .join("\r\n");

        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        saveAs(blob, `operadores_${new Date().toISOString().slice(0, 10)}.csv`);
    }, [operadoresFiltrados, productosConteo]);

    const handleSectorClick = (sector) => {
        setFiltroSector(prev => prev === sector ? "" : sector);
    };

    return (
        <section className="space-y-8">
            {/* Alerta de duplicados */}
            {data.operadores && data.operadores.length !== operadores.length && (
                <div className={`${glassStyles()} bg-amber-50/50 dark:bg-amber-900/20 border-amber-200/50 dark:border-amber-700/30 p-4 rounded-2xl flex items-start gap-3`}>
                    <div className="p-2 bg-amber-100 dark:bg-amber-900/50 rounded-xl">
                        <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div>
                        <p className="font-bold text-amber-900 dark:text-amber-100 text-sm uppercase tracking-wide">
                            Operadores duplicados eliminados
                        </p>
                        <p className="text-amber-700 dark:text-amber-300 text-xs mt-1 font-medium">
                            Se eliminaron {data.operadores.length - operadores.length} operadores duplicados.
                        </p>
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight flex items-center gap-3">
                        <div className="p-2 bg-[var(--brand-primary)] rounded-xl shadow-lg">
                            <Building className="w-6 h-6 text-white" />
                        </div>
                        Gestión de Operadores
                    </h2>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                        Administra los operadores y sus productos asociados
                    </p>
                </div>
                <div className="flex gap-2 flex-wrap">
                    <button
                        onClick={() => { setEditingOperador(null); setShowModal(true); }}
                        className="flex items-center gap-2 px-5 py-2.5 bg-[var(--brand-primary)] text-white rounded-xl hover:opacity-90 transition-all shadow-lg shadow-[var(--brand-primary)]/20 text-xs font-bold uppercase tracking-widest active:scale-95"
                    >
                        <Plus className="w-4 h-4" />
                        Nuevo Operador
                    </button>
                    <button
                        onClick={exportCSV}
                        className="flex items-center gap-2 px-5 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-all text-xs font-bold uppercase tracking-widest active:scale-95"
                    >
                        <Download className="w-4 h-4" />
                        Exportar
                    </button>
                </div>
            </div>

            {/* Grid de Sectores */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <SectorCard
                    title="Telefonía"
                    operadores={sectorStats.telefonia.operadores}
                    productos={sectorStats.telefonia.productos}
                    icon={Phone}
                    gradientFrom="from-blue-500"
                    gradientTo="to-indigo-600"
                    onClick={() => handleSectorClick('telefonia')}
                    isActive={filtroSector === 'telefonia'}
                />
                <SectorCard
                    title="Energía"
                    operadores={sectorStats.energia.operadores}
                    productos={sectorStats.energia.productos}
                    icon={Zap}
                    gradientFrom="from-emerald-500"
                    gradientTo="to-teal-600"
                    onClick={() => handleSectorClick('energia')}
                    isActive={filtroSector === 'energia'}
                />
                <SectorCard
                    title="Seguridad"
                    operadores={sectorStats.seguridad.operadores}
                    productos={sectorStats.seguridad.productos}
                    icon={Shield}
                    gradientFrom="from-amber-500"
                    gradientTo="to-orange-600"
                    onClick={() => handleSectorClick('seguridad')}
                    isActive={filtroSector === 'seguridad'}
                />
                <SectorCard
                    title="Otros"
                    operadores={sectorStats.otros.operadores}
                    productos={sectorStats.otros.productos}
                    icon={MoreHorizontal}
                    gradientFrom="from-slate-500"
                    gradientTo="to-slate-700"
                    onClick={() => handleSectorClick('otros')}
                    isActive={filtroSector === 'otros'}
                />
            </div>

            {/* Top Operadores */}
            {topOperadores.length > 0 && (
                <div className={`${glassStyles()} p-6 rounded-3xl`}>
                    <h3 className="text-sm font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <Trophy className="w-4 h-4 text-amber-500" />
                        Top Operadores
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                        {topOperadores.map((op, idx) => (
                            <TopOperadorCard key={op.id} operador={op} index={idx} />
                        ))}
                    </div>
                </div>
            )}

            {/* Barra de Filtros */}
            <div className={`${glassStyles()} p-5 rounded-3xl`}>
                <div className="flex flex-col md:flex-row gap-4">
                    {/* Búsqueda */}
                    <div className="relative flex-1 group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <Search className="h-4 w-4 text-slate-400 group-focus-within:text-[var(--brand-primary)] transition-colors" />
                        </div>
                        <input
                            type="text"
                            className="block w-full pl-11 pr-4 py-3 rounded-2xl border-none bg-slate-100 dark:bg-slate-800/50 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:ring-2 focus:ring-[var(--brand-primary)]/50 focus:bg-white dark:focus:bg-slate-800 transition-all shadow-inner text-sm font-medium"
                            placeholder="Buscar operador por nombre o código..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>

                    {/* Filtros */}
                    <div className="flex gap-2 flex-wrap">
                        <select
                            className="px-4 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300 border-none focus:ring-2 focus:ring-purple-500/50 text-sm font-medium"
                            value={filtroProductos}
                            onChange={e => setFiltroProductos(e.target.value)}
                        >
                            <option value="">Todos</option>
                            <option value="con-productos">Con productos</option>
                            <option value="sin-productos">Sin productos</option>
                        </select>

                        {filtroSector && (
                            <button
                                onClick={() => setFiltroSector("")}
                                className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-[var(--brand-primary)]/10 text-[var(--brand-primary)] text-xs font-bold uppercase tracking-widest"
                            >
                                {filtroSector}
                                <span className="ml-1">✕</span>
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Error */}
            {error && (
                <div className="bg-red-50/50 border border-red-200/50 text-red-700 px-4 py-3 rounded-2xl flex items-center gap-3">
                    <AlertCircle className="w-5 h-5" />
                    <span className="font-medium">{error}</span>
                </div>
            )}

            {/* Tabla de Operadores */}
            <div className={`${glassStyles()} overflow-hidden rounded-3xl`}>
                <div className="overflow-x-auto">
                    <table className="min-w-full text-sm text-left">
                        <thead className="bg-slate-50/80 dark:bg-slate-800/80 backdrop-blur-sm">
                            <tr>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Operador</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Sector</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 text-center">Productos</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 text-center">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                            {operadoresFiltrados.map(op => (
                                <tr key={op.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-xl">
                                                <Building className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-900 dark:text-white flex items-center gap-2 flex-wrap">
                                                    {op.nombre}
                                                    {!op.sector && (
                                                        <span
                                                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wide bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                                                            title="El Excel de origen no traía columna de sector para este operador — complétalo manualmente"
                                                        >
                                                            ⚠️ Incompleto
                                                        </span>
                                                    )}
                                                </p>
                                                {op.codigo && <p className="text-xs text-slate-400">{op.codigo}</p>}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-3 py-1 rounded-xl text-xs font-bold uppercase tracking-wider ${op.sector === 'telefonia' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                                            op.sector === 'energia' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                                                op.sector === 'seguridad' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                                                    'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400'
                                            }`}>
                                            {op.sector || 'Sin sector'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <div className="flex items-center justify-center gap-2">
                                            <Package className="w-4 h-4 text-slate-400" />
                                            <span className={`font-black ${(productosConteo[op.id] || 0) > 0
                                                ? 'text-emerald-600 dark:text-emerald-400'
                                                : 'text-slate-400'
                                                }`}>
                                                {productosConteo[op.id] || 0}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => { setEditingOperador(op); setShowModal(true); }}
                                                className="p-2 rounded-xl text-slate-400 hover:text-[var(--brand-primary)] hover:bg-[var(--brand-primary)]/10 transition-all"
                                                title="Editar"
                                            >
                                                <Edit3 className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(op.id)}
                                                className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-all"
                                                title="Eliminar"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {operadoresFiltrados.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center">
                                        <Building className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
                                        <p className="text-slate-400 dark:text-slate-500 font-medium">
                                            No se encontraron operadores con los filtros aplicados.
                                        </p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal de Operador */}
            {showModal && (
                <OperadorModal
                    operador={editingOperador}
                    onSave={handleSave}
                    onClose={() => setShowModal(false)}
                />
            )}
        </section>
    );
});

export default OperadoresSection;
