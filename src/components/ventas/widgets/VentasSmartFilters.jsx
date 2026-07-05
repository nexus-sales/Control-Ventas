import React, { useMemo, useState } from 'react';
import {
    Search, Filter, X, Calendar, User, Truck,
    MapPin, Clock, Tag, Plus, Check, ChevronDown, Download, Sparkles, AlertTriangle
} from 'lucide-react';
import { glassStyles } from '../../../utils/designUtils';
import { cn } from '../../../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

function FilterTag({ label, onRemove, color = "bg-slate-100 text-slate-800" }) {
    return (
        <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all hover:shadow-lg active:scale-95 border",
                color
            )}
        >
            <span>{label}</span>
            <button
                onClick={onRemove}
                className="p-1 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
            >
                <X className="w-3 h-3" />
            </button>
        </motion.div>
    );
}

function SmartPresets({ onSelectFilter }) {
    // useVentasGestion.js filtra por filtros.desde/hasta/mesAno — no existe
    // ningún filtro "fecha", así que { fecha: 'today' } no hacía nada (el
    // botón se marcaba activo pero la lista no cambiaba). "Hoy" se expresa
    // como un rango desde/hasta de un solo día, que sí filtra de verdad.
    const hoy = new Date().toISOString().slice(0, 10);
    const presets = [
        { label: "Hoy", icon: Calendar, filter: { desde: hoy, hasta: hoy }, color: "text-[var(--brand-primary)] bg-[var(--brand-primary)]/10 border-[var(--brand-primary)]/20" },
        { label: "Sin PVP", icon: Tag, filter: { sinPvp: true }, color: "text-amber-500 bg-amber-500/10 border-amber-500/20" },
        { label: "Incidencias", icon: AlertTriangle, filter: { estado: 'INCIDENCIA' }, color: "text-rose-500 bg-rose-500/10 border-rose-500/20" },
    ];

    return (
        <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide snap-x no-scrollbar">
            {presets.map((preset, idx) => (
                <motion.button
                    key={idx}
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => onSelectFilter(preset.filter)}
                    className={cn(
                        "flex items-center gap-2.5 px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[2px] whitespace-nowrap snap-start border transition-all",
                        preset.color
                    )}
                >
                    <preset.icon className="w-4 h-4" />
                    {preset.label}
                </motion.button>
            ))}
        </div>
    );
}

export function VentasSmartFilters({
    filtros = {},
    updateFilter,
    clearFilters,
    colaboradores = [],
    operadores = [],
    zonas = [],
    activeCount: _activeCount = 0,
    onExport
}) {
    const [isExpanded, setIsExpanded] = useState(false);

    // Generar etiquetas activas
    const activeTags = useMemo(() => {
        const tags = [];
        if (filtros.search) tags.push({ id: 'search', label: `Keyword: ${filtros.search}`, color: "bg-[var(--brand-primary)]/10 text-[var(--brand-primary)] border-[var(--brand-primary)]/20" });
        if (filtros.estado) tags.push({ id: 'estado', label: `Status: ${filtros.estado}`, color: "bg-purple-500/10 text-purple-600 border-purple-500/20" });
        if (filtros.operador_id) {
            const op = operadores.find(o => String(o.id) === String(filtros.operador_id));
            tags.push({ id: 'operador_id', label: op ? op.nombre : 'Operador', color: "bg-orange-500/10 text-orange-600 border-orange-500/20" });
        }
        if (filtros.colaborador_id) {
            const col = colaboradores.find(c => String(c.id) === String(filtros.colaborador_id));
            tags.push({ id: 'colaborador_id', label: col ? col.nombre : 'Colab', color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" });
        }
        if (filtros.sinPvp) tags.push({ id: 'sinPvp', label: "Valor Cero", color: "bg-rose-500/10 text-rose-600 border-rose-500/20" });
        if (filtros.zona_id) {
            const zona = zonas.find(z => String(z.id) === String(filtros.zona_id));
            tags.push({ id: 'zona_id', label: zona ? zona.nombre : 'Región', color: "bg-cyan-500/10 text-cyan-600 border-cyan-500/20" });
        }

        return tags;
    }, [filtros, operadores, colaboradores, zonas]);

    return (
        <motion.div
            layout
            className={cn(glassStyles(), "p-6 rounded-[2.5rem] border border-white/20 dark:border-slate-800/50 shadow-2xl")}
        >
            {/* Header & Search */}
            <div className="flex flex-col xl:flex-row gap-6 items-center justify-between mb-6">
                <div className="relative w-full xl:w-[500px] group">
                    <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-slate-400 group-focus-within:text-[var(--brand-primary)] transition-all duration-300" />
                    </div>
                    <input
                        type="text"
                        className="
                            block w-full pl-14 pr-6 py-4 rounded-[1.5rem] border-none 
                            bg-slate-100/50 dark:bg-slate-900/50 text-slate-900 dark:text-white 
                            placeholder-slate-500/60 font-bold tracking-tight
                            focus:ring-2 focus:ring-[var(--brand-primary)]/40 focus:bg-white dark:focus:bg-slate-900 
                            transition-all shadow-inner text-sm
                        "
                        placeholder="Identificador, cliente o referencia..."
                        value={filtros.search || ''}
                        onChange={(e) => updateFilter('search', e.target.value)}
                    />
                </div>

                <div className="flex items-center gap-3 w-full xl:w-auto">
                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className={cn(
                            "flex items-center gap-3 px-6 py-4 rounded-[1.5rem] text-[10px] font-black uppercase tracking-[2px] transition-all",
                            isExpanded
                                ? 'bg-[var(--brand-primary)] text-white shadow-xl shadow-[var(--brand-primary)]/30'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                        )}
                    >
                        <Filter className="w-4 h-4" />
                        Avanzado
                        {activeTags.length > 0 && (
                            <span className="w-5 h-5 flex items-center justify-center bg-white text-[var(--brand-primary)] rounded-lg text-[9px] font-black shadow-lg">
                                {activeTags.length}
                            </span>
                        )}
                        <ChevronDown className={cn("w-4 h-4 ml-1 transition-transform duration-500", isExpanded && "rotate-180")} />
                    </button>

                    <AnimatePresence>
                        {activeTags.length > 0 && (
                            <motion.button
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                onClick={clearFilters}
                                className="px-6 py-4 rounded-[1.5rem] bg-rose-500/10 text-rose-600 hover:bg-rose-500 hover:text-white transition-all text-[10px] font-black uppercase tracking-[2px] border border-rose-500/20"
                            >
                                Reset
                            </motion.button>
                        )}
                    </AnimatePresence>

                    {onExport && (
                        <button
                            onClick={onExport}
                            className="flex items-center gap-3 px-6 py-4 rounded-[1.5rem] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-900 dark:hover:bg-white hover:text-white dark:hover:text-black transition-all text-[10px] font-black uppercase tracking-[2px]"
                        >
                            <Download className="w-4 h-4" />
                            <span className="hidden sm:inline">Descargar</span>
                        </button>
                    )}
                </div>
            </div>

            <SmartPresets onSelectFilter={(f) => {
                Object.entries(f).forEach(([k, v]) => updateFilter(k, v));
            }} />

            {/* Expanded Filters */}
            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 pt-6 border-t border-slate-200/50 dark:border-white/5 overflow-hidden"
                    >
                        {/* Estado */}
                        <div className="space-y-3">
                            <label className="text-[10px] font-black uppercase tracking-[3px] text-slate-400 pl-1 flex items-center gap-2">
                                <Clock className="w-3 h-3" /> Estado Operación
                            </label>
                            <select
                                value={filtros.estado || ''}
                                onChange={(e) => updateFilter('estado', e.target.value)}
                                className="w-full px-5 py-4 rounded-[1.2rem] bg-slate-50 dark:bg-slate-900/50 border-none text-xs font-black uppercase tracking-widest focus:ring-2 focus:ring-blue-500/40"
                            >
                                <option value="">Todos los Estados</option>
                                <option value="PENDIENTE">Pendiente</option>
                                <option value="PENDIENTE VALIDAR">Por Validar</option>
                                <option value="SCORING">Scoring</option>
                                <option value="INCIDENCIA">Incidencia</option>
                                <option value="ACTIVO">Activo</option>
                                <option value="CANCELADA">Cancelada</option>
                            </select>
                        </div>

                        {/* Operador */}
                        <div className="space-y-3">
                            <label className="text-[10px] font-black uppercase tracking-[3px] text-slate-400 pl-1 flex items-center gap-2">
                                <Truck className="w-3 h-3" /> Operador Core
                            </label>
                            <select
                                value={filtros.operador_id || ''}
                                onChange={(e) => updateFilter('operador_id', e.target.value)}
                                className="w-full px-5 py-4 rounded-[1.2rem] bg-slate-50 dark:bg-slate-900/50 border-none text-xs font-black uppercase tracking-widest focus:ring-2 focus:ring-orange-500/40"
                            >
                                <option value="">Todos los Operadores</option>
                                {operadores.map(op => (
                                    <option key={op.id} value={op.id}>{op.nombre}</option>
                                ))}
                            </select>
                        </div>

                        {/* Colaborador */}
                        <div className="space-y-3">
                            <label className="text-[10px] font-black uppercase tracking-[3px] text-slate-400 pl-1 flex items-center gap-2">
                                <User className="w-3 h-3" /> Agencia / Colaborador
                            </label>
                            <select
                                value={filtros.colaborador_id || ''}
                                onChange={(e) => updateFilter('colaborador_id', e.target.value)}
                                className="w-full px-5 py-4 rounded-[1.2rem] bg-slate-50 dark:bg-slate-900/50 border-none text-xs font-black uppercase tracking-widest focus:ring-2 focus:ring-emerald-500/40"
                            >
                                <option value="">Todos los Equipos</option>
                                {colaboradores.map(col => (
                                    <option key={col.id} value={col.id}>{col.nombre}</option>
                                ))}
                            </select>
                        </div>

                        {/* Zona */}
                        <div className="space-y-3">
                            <label className="text-[10px] font-black uppercase tracking-[3px] text-slate-400 pl-1 flex items-center gap-2">
                                <MapPin className="w-3 h-3" /> Región Geográfica
                            </label>
                            <select
                                value={filtros.zona_id || ''}
                                onChange={(e) => updateFilter('zona_id', e.target.value)}
                                className="w-full px-5 py-4 rounded-[1.2rem] bg-slate-50 dark:bg-slate-900/50 border-none text-xs font-black uppercase tracking-widest focus:ring-2 focus:ring-cyan-500/40"
                            >
                                <option value="">Todas las Regiones</option>
                                {zonas.map(z => (
                                    <option key={z.id} value={z.id}>{z.nombre}</option>
                                ))}
                            </select>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Active Tags */}
            <AnimatePresence>
                {activeTags.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex flex-wrap gap-3 pt-6 border-t border-slate-200/50 dark:border-white/5 mt-6"
                    >
                        <div className="flex items-center gap-2 mr-2">
                            <Sparkles className="w-3 h-3 text-[var(--brand-primary)]" />
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Filtros Activos:</span>
                        </div>
                        {activeTags.map(tag => (
                            <FilterTag
                                key={tag.id}
                                label={tag.label}
                                color={tag.color}
                                onRemove={() => updateFilter(tag.id, '')}
                            />
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
