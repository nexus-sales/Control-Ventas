import React, { useMemo, useState } from 'react';
import * as Tooltip from '@radix-ui/react-tooltip';
import {
    Search, Filter, X, Calendar, User, Truck,
    MapPin, Clock, Tag, Plus, Check, ChevronDown, Download
} from 'lucide-react';
import { glassStyles, cardHoverStyles } from '../../../utils/designUtils';

function FilterTag({ label, onRemove, color = "bg-slate-100 text-slate-800" }) {
    return (
        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wide ${color} transition-all hover:scale-105 active:scale-95`}>
            <span>{label}</span>
            <button
                onClick={onRemove}
                className="p-0.5 rounded-full hover:bg-white/20 transition-colors"
            >
                <X className="w-3 h-3" />
            </button>
        </div>
    );
}

function SmartPresets({ onSelectFilter }) {
    const presets = [
        { label: "Hoy", icon: Calendar, filter: { fecha: 'today' }, color: "text-blue-500 bg-blue-500/10" },
        { label: "Esta Semana", icon: Calendar, filter: { fecha: 'week' }, color: "text-indigo-500 bg-indigo-500/10" },
        { label: "Sin PVP", icon: Tag, filter: { sinPvp: true }, color: "text-amber-500 bg-amber-500/10" },
        { label: "Mis Ventas", icon: User, filter: { mined: true }, color: "text-emerald-500 bg-emerald-500/10" },
        { label: "Incidencias", icon: AlertTriangle, filter: { estado: 'INCIDENCIA' }, color: "text-rose-500 bg-rose-500/10" },
    ];

    return (
        <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-hide snap-x">
            {presets.map((preset, idx) => (
                <button
                    key={idx}
                    onClick={() => onSelectFilter(preset.filter)}
                    className={`
            flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest whitespace-nowrap snap-start
            ${preset.color} hover:bg-opacity-20 transition-all active:scale-95
          `}
                >
                    <preset.icon className="w-3.5 h-3.5" />
                    {preset.label}
                </button>
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
    activeCount = 0,
    onExport
}) {
    const [isExpanded, setIsExpanded] = useState(false);

    // Generar etiquetas activas
    const activeTags = useMemo(() => {
        const tags = [];
        if (filtros.search) tags.push({ id: 'search', label: `Busco: ${filtros.search}`, color: "bg-blue-100 text-blue-800" });
        if (filtros.estado) tags.push({ id: 'estado', label: `Estado: ${filtros.estado}`, color: "bg-purple-100 text-purple-800" });
        if (filtros.operador_id) {
            const op = operadores.find(o => String(o.id) === String(filtros.operador_id));
            tags.push({ id: 'operador_id', label: op ? op.nombre : 'Operador', color: "bg-orange-100 text-orange-800" });
        }
        if (filtros.colaborador_id) {
            const col = colaboradores.find(c => String(c.id) === String(filtros.colaborador_id));
            tags.push({ id: 'colaborador_id', label: col ? col.nombre : 'Colaborador', color: "bg-emerald-100 text-emerald-800" });
        }
        if (filtros.sinPvp) tags.push({ id: 'sinPvp', label: "Sin PVP", color: "bg-rose-100 text-rose-800" });
        if (filtros.zona_id) {
            const zona = zonas.find(z => String(z.id) === String(filtros.zona_id));
            tags.push({ id: 'zona_id', label: zona ? zona.nombre : 'Zona', color: "bg-cyan-100 text-cyan-800" });
        }

        return tags;
    }, [filtros, operadores, colaboradores, zonas]);

    return (
        <div className={`${glassStyles} p-5 rounded-3xl transition-all duration-500`}>
            {/* Header & Search */}
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between mb-4">
                <div className="relative w-full md:w-96 group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Search className="h-4 w-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                    </div>
                    <input
                        type="text"
                        className="
              block w-full pl-11 pr-4 py-3 rounded-2xl border-none 
              bg-slate-100 dark:bg-slate-800/50 text-slate-900 dark:text-white 
              placeholder-slate-500 dark:placeholder-slate-400
              focus:ring-2 focus:ring-blue-500/50 focus:bg-white dark:focus:bg-slate-800 
              transition-all shadow-inner text-sm font-medium
            "
                        placeholder="Buscar por cliente, ID, teléfono..."
                        value={filtros.search || ''}
                        onChange={(e) => updateFilter('search', e.target.value)}
                    />
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto">
                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className={`
              flex items-center gap-2 px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all
              ${isExpanded
                                ? 'bg-blue-500 text-white shadow-blue-500/30 shadow-lg'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                            }
            `}
                    >
                        <Filter className="w-4 h-4" />
                        Filtros
                        {activeTags.length > 0 && (
                            <span className="ml-1 bg-white text-blue-600 px-1.5 py-0.5 rounded-md text-[10px] shadow-sm">
                                {activeTags.length}
                            </span>
                        )}
                        <ChevronDown className={`w-3 h-3 ml-1 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                    </button>

                    {activeTags.length > 0 && (
                        <button
                            onClick={clearFilters}
                            className="px-4 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-all text-xs font-bold uppercase tracking-wide"
                        >
                            Limpiar
                        </button>
                    )}
                    {onExport && (
                        <button
                            onClick={onExport}
                            className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all text-xs font-bold uppercase tracking-wide"
                            title="Exportar datos filtrados"
                        >
                            <Download className="w-4 h-4" />
                            <span className="hidden sm:inline">Exportar</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Expanded Filters */}
            <div className={`
        grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 
        transition-all duration-500 ease-in-out overflow-hidden
        ${isExpanded ? 'max-h-96 opacity-100 mb-6' : 'max-h-0 opacity-0'}
      `}>
                {/* Estado */}
                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">Estado</label>
                    <div className="relative">
                        <Clock className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                        <select
                            value={filtros.estado || ''}
                            onChange={(e) => updateFilter('estado', e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border-none text-sm font-medium focus:ring-2 focus:ring-purple-500/50"
                        >
                            <option value="">Todos</option>
                            <option value="PENDIENTE">Pendiente</option>
                            <option value="PENDIENTE VALIDAR">Por Validar</option>
                            <option value="SCORING">Scoring</option>
                            <option value="INCIDENCIA">Incidencia</option>
                            <option value="ACTIVO">Activo</option>
                            <option value="CANCELADA">Cancelada</option>
                        </select>
                    </div>
                </div>

                {/* Operador */}
                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">Operador</label>
                    <div className="relative">
                        <Truck className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                        <select
                            value={filtros.operador_id || ''}
                            onChange={(e) => updateFilter('operador_id', e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border-none text-sm font-medium focus:ring-2 focus:ring-orange-500/50"
                        >
                            <option value="">Todos</option>
                            {operadores.map(op => (
                                <option key={op.id} value={op.id}>{op.nombre}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Colaborador */}
                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">Colaborador</label>
                    <div className="relative">
                        <User className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                        <select
                            value={filtros.colaborador_id || ''}
                            onChange={(e) => updateFilter('colaborador_id', e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border-none text-sm font-medium focus:ring-2 focus:ring-emerald-500/50"
                        >
                            <option value="">Todos</option>
                            {colaboradores.map(col => (
                                <option key={col.id} value={col.id}>{col.nombre}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Zona */}
                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">Zona</label>
                    <div className="relative">
                        <MapPin className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                        <select
                            value={filtros.zona_id || ''}
                            onChange={(e) => updateFilter('zona_id', e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border-none text-sm font-medium focus:ring-2 focus:ring-cyan-500/50"
                        >
                            <option value="">Todas</option>
                            {zonas.map(z => (
                                <option key={z.id} value={z.id}>{z.nombre}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Active Tags */}
            {activeTags.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-200 dark:border-slate-700/50 mt-2">
                    {activeTags.map(tag => (
                        <FilterTag
                            key={tag.id}
                            label={tag.label}
                            color={tag.color}
                            onRemove={() => updateFilter(tag.id, '')}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
