import React, { useMemo } from 'react';
import * as Tooltip from '@radix-ui/react-tooltip';
import {
    Clock, AlertTriangle, CheckCircle, Zap, Phone, Wrench, FileText,
    AlertCircle, XCircle, Sparkles
} from 'lucide-react';
import { glassStyles, cardHoverStyles } from '../../../utils/designUtils';
import { cn } from '../../../lib/utils';
import { motion } from 'framer-motion';
import { BorderBeam } from '../../ui/BorderBeam';

function EstadoItem({ estado, count, total, icon: Icon, color, onClick, delay = 0 }) {
    const percentage = total > 0 ? Math.round((count / total) * 100) : 0;

    // Extraer color hex para BorderBeam (simplificado)
    const colorMap = {
        'border-rose-500': '#f43f5e',
        'border-orange-500': '#f97316',
        'border-amber-500': '#f59e0b',
        'border-purple-500': '#a855f7',
        'border-indigo-500': '#6366f1',
        'border-cyan-500': '#06b6d4'
    };
    const beamColor = colorMap[color] || '#3b82f6';

    return (
        <Tooltip.Provider>
            <Tooltip.Root delayDuration={200}>
                <Tooltip.Trigger asChild>
                    <motion.button
                        initial={{ opacity: 0, scale: 0.9, x: 20 }}
                        animate={{ opacity: 1, scale: 1, x: 0 }}
                        transition={{ delay }}
                        whileHover={{ y: -4, scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={onClick}
                        className={cn(
                            glassStyles(),
                            cardHoverStyles(),
                            "flex-1 min-w-[180px] p-6 rounded-[2rem] border-l-4 relative overflow-hidden",
                            color,
                            "text-left transition-all group shadow-xl"
                        )}
                    >
                        {count > 2 && <BorderBeam size={80} duration={8} colorFrom={beamColor} colorTo={`${beamColor}aa`} />}

                        <div className="flex justify-between items-start mb-4 relative z-10">
                            <div className={cn(
                                "p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-white/5 shadow-inner transition-transform group-hover:scale-110 duration-500",
                                color.replace('border-', 'text-')
                            )}>
                                <Icon className="w-5 h-5" />
                            </div>
                            <span className={cn("text-3xl font-black tracking-tighter", color.replace('border-', 'text-'))}>
                                {count}
                            </span>
                        </div>
                        <div className="space-y-3 relative z-10">
                            <div className="text-[10px] uppercase font-black tracking-[2px] text-slate-500 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                                {estado}
                            </div>
                            <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden shadow-inner">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${percentage}%` }}
                                    transition={{ duration: 1.5, delay: delay + 0.5, ease: "circOut" }}
                                    className={cn("h-full transition-all shadow-[0_0_8px] shadow-current", color.replace('border-', 'bg-'))}
                                />
                            </div>
                        </div>

                        {/* Decoración de fondo */}
                        <div className={cn(
                            "absolute -right-6 -bottom-6 w-24 h-24 rounded-full opacity-[0.03] blur-2xl transition-all group-hover:opacity-[0.08]",
                            color.replace('border-', 'bg-')
                        )} />
                    </motion.button>
                </Tooltip.Trigger>
                <Tooltip.Portal>
                    <Tooltip.Content
                        side="top"
                        className="z-50 px-4 py-2 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-black text-[10px] font-black uppercase tracking-widest shadow-2xl border border-white/10 dark:border-black/5 animate-in fade-in zoom-in-95"
                    >
                        {count} Casos Activos • {percentage}% del flujo
                        <Tooltip.Arrow className="fill-slate-900 dark:fill-white" />
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
            if (Object.prototype.hasOwnProperty.call(counts, v.estado)) {
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
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-10"
        >
            <div className="flex items-center gap-3 mb-5 px-2">
                <div className="flex -space-x-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
                    <div className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                </div>
                <h3 className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[4px]">
                    Fases Críticas de Pipeline
                </h3>
                <Sparkles className="w-3 h-3 text-amber-500" />
            </div>

            <div className="flex gap-6 overflow-x-auto pb-6 scrollbar-hide snap-x no-scrollbar">
                {processData.map((item, idx) => (
                    <EstadoItem
                        key={item.id}
                        estado={item.label}
                        count={item.count}
                        total={ventas.length}
                        icon={item.icon}
                        color={item.color}
                        delay={idx * 0.1}
                        onClick={() => onFilterChange && onFilterChange('estado', item.filter)}
                    />
                ))}
            </div>
        </motion.div>
    );
}

export default VentasProcessWidget;
