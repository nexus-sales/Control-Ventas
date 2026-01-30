import React, { useMemo } from 'react';
import * as Tooltip from '@radix-ui/react-tooltip';
import {
    Clock, AlertTriangle, CheckCircle, Zap, Phone, Wrench, FileText,
    AlertCircle, XCircle
} from 'lucide-react';
import { glassStyles, cardHoverStyles } from '../../../utils/designUtils';

function EstadoItem({ estado, count, total, icon: Icon, color, onClick }) {
    const percentage = total > 0 ? Math.round((count / total) * 100) : 0;

    return (
        <Tooltip.Provider>
            <Tooltip.Root delayDuration={200}>
                <Tooltip.Trigger asChild>
                    <button
                        onClick={onClick}
                        className={`${glassStyles} ${cardHoverStyles} flex-1 min-w-[140px] p-4 rounded-2xl border-l-4 ${color} text-left transition-all group`}
                    >
                        <div className="flex justify-between items-start mb-2">
                            <div className="p-2 rounded-xl bg-white/50 dark:bg-slate-800/50 shadow-sm">
                                <Icon className={`w-4 h-4 ${color.replace('border-', 'text-')}`} />
                            </div>
                            <span className={`text-2xl font-black ${color.replace('border-', 'text-')}`}>{count}</span>
                        </div>
                        <div className="space-y-1">
                            <div className="text-[10px] uppercase font-black tracking-widest text-slate-500 dark:text-slate-400 truncate">
                                {estado}
                            </div>
                            <div className="w-full bg-slate-200 dark:bg-slate-700 h-1 rounded-full overflow-hidden">
                                <div
                                    className={`h-full ${color.replace('border-', 'bg-')} transition-all duration-1000 ease-out`}
                                    style={{ width: `${percentage}%` }}
                                />
                            </div>
                        </div>
                    </button>
                </Tooltip.Trigger>
                <Tooltip.Portal>
                    <Tooltip.Content side="top" className="z-50 px-3 py-2 rounded-xl bg-slate-900/95 text-white text-xs font-bold shadow-xl animate-in fade-in zoom-in-95">
                        {count} ventas en {estado} ({percentage}%)
                        <Tooltip.Arrow className="fill-slate-900/95" />
                    </Tooltip.Content>
                </Tooltip.Portal>
            </Tooltip.Root>
        </Tooltip.Provider>
    );
}

export function VentasProcessWidget({ ventas, onFilterChange }) {
    const processData = useMemo(() => {
        const counts = {
            'PENDIENTE': 0,
            'PENDIENTE VALIDAR': 0,
            'SCORING': 0,
            'INCIDENCIA': 0,
            'PENDIENTE INSTALACION': 0,
            'CITADA': 0,
            'TRAMITACION': 0
        };

        ventas.forEach(v => {
            if (counts.hasOwnProperty(v.estado)) {
                counts[v.estado]++;
            }
        });

        return [
            { id: 'incidencia', label: 'Incidencias', count: counts['INCIDENCIA'], icon: AlertCircle, color: 'border-rose-500', filter: 'INCIDENCIA' },
            { id: 'pendiente', label: 'Pendientes', count: counts['PENDIENTE'], icon: Clock, color: 'border-orange-500', filter: 'PENDIENTE' },
            { id: 'validar', label: 'Por Validar', count: counts['PENDIENTE VALIDAR'], icon: FileText, color: 'border-amber-500', filter: 'PENDIENTE VALIDAR' },
            { id: 'scoring', label: 'Scoring', count: counts['SCORING'], icon: Zap, color: 'border-purple-500', filter: 'SCORING' },
            { id: 'tramitacion', label: 'Tramitación', count: counts['TRAMITACION'], icon: FileText, color: 'border-indigo-500', filter: 'TRAMITACION' },
            { id: 'instalacion', label: 'Instalación', count: counts['PENDIENTE INSTALACION'], icon: Wrench, color: 'border-cyan-500', filter: 'PENDIENTE INSTALACION' },
        ].filter(item => item.count > 0);
    }, [ventas]);

    if (processData.length === 0) return null;

    return (
        <div className="mb-6">
            <div className="flex items-center gap-2 mb-3 px-1">
                <Zap className="w-4 h-4 text-amber-500" />
                <h3 className="text-sm font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                    Atención Requerida
                </h3>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x">
                {processData.map((item) => (
                    <EstadoItem
                        key={item.id}
                        estado={item.label}
                        count={item.count}
                        total={ventas.length}
                        icon={item.icon}
                        color={item.color}
                        onClick={() => onFilterChange && onFilterChange('estado', item.filter)}
                    />
                ))}
            </div>
        </div>
    );
}

export default VentasProcessWidget;
