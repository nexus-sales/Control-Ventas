import React, { useMemo } from 'react';
import { glassStyles, cardHoverStyles } from '../../../utils/designUtils';
import { cn } from '../../../lib/utils';

const PipelinePanel = ({ byEstado, total }) => {
    const palette = {
        Borrador: {
            bg: "bg-amber-500",
            lightBg: "bg-amber-50 dark:bg-amber-900/20",
            text: "text-amber-600 dark:text-amber-400",
            label: "Borradores"
        },
        Confirmada: {
            bg: "bg-emerald-500",
            lightBg: "bg-emerald-50 dark:bg-emerald-900/20",
            text: "text-emerald-600 dark:text-emerald-400",
            label: "Confirmadas"
        },
        Cerrada: {
            bg: "bg-sky-500",
            lightBg: "bg-sky-50 dark:bg-sky-900/20",
            text: "text-sky-600 dark:text-sky-400",
            label: "Cerradas"
        },
        Liquidada: {
            bg: "bg-purple-500",
            lightBg: "bg-purple-50 dark:bg-purple-900/20",
            text: "text-purple-600 dark:text-purple-400",
            label: "Liquidadas"
        },
        Instalada: {
            bg: "bg-cyan-500",
            lightBg: "bg-cyan-50 dark:bg-cyan-900/20",
            text: "text-cyan-600 dark:text-cyan-400",
            label: "Instaladas"
        },
        Activa: {
            bg: "bg-lime-500",
            lightBg: "bg-lime-50 dark:bg-lime-900/20",
            text: "text-lime-600 dark:text-lime-400",
            label: "Activas"
        },
        Pendiente: {
            bg: "bg-orange-500",
            lightBg: "bg-orange-50 dark:bg-orange-900/20",
            text: "text-orange-600 dark:text-orange-400",
            label: "Pendientes"
        },
    };

    const baseOrder = ["Borrador", "Confirmada", "Cerrada", "Liquidada", "Instalada", "Activa", "Pendiente"];

    const displayEstados = useMemo(() => {
        const orderedEntries = Object.entries(byEstado)
            .filter(([, count]) => typeof count === "number")
            .sort((a, b) => b[1] - a[1]);

        const ensuredEntries = orderedEntries.length > 0
            ? orderedEntries
            : baseOrder.map((key) => [key, byEstado[key] || 0]);

        return ensuredEntries
            .concat(
                baseOrder
                    .filter((key) => ensuredEntries.every(([label]) => label !== key))
                    .map((key) => [key, byEstado[key] || 0]),
            )
            .slice(0, 4);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [byEstado]);

    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {displayEstados.map(([estado, count]) => {
                const style = palette[estado] || {
                    bg: "bg-slate-500",
                    lightBg: "bg-slate-50 dark:bg-slate-800",
                    text: "text-slate-600 dark:text-slate-400",
                    label: estado,
                };
                const percentage = total > 0 ? ((count / total) * 100).toFixed(1) : 0;

                return (
                    <div
                        key={estado}
                        className={cn(glassStyles(), cardHoverStyles(), "p-6 rounded-3xl text-center group")}
                    >
                        <div className={`relative w-16 h-16 mx-auto mb-4 rounded-2xl ${style.bg} flex items-center justify-center shadow-lg group-hover:rotate-6 transition-transform duration-300`}>
                            <span className="text-xl font-black text-white">{count}</span>
                            <div className="absolute -inset-1 rounded-2xl bg-white/20 blur opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>

                        <p className="text-sm font-bold text-slate-800 dark:text-white mb-2 text-center">
                            {style.label}
                        </p>

                        <div className="flex flex-col items-center gap-1">
                            <div className="w-16 bg-slate-100 dark:bg-slate-800 rounded-full h-1.5">
                                <div
                                    className={`h-1.5 rounded-full ${style.bg}`}
                                    style={{ width: `${percentage}%` }}
                                />
                            </div>
                            <span className={`text-[10px] font-bold ${style.text}`}>
                                {percentage}%
                            </span>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default React.memo(PipelinePanel);
