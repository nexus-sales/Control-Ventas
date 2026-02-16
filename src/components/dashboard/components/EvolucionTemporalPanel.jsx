import React from 'react';
import { Calendar, TrendingUp } from 'lucide-react';
import { euro, glassStyles } from '../../../utils/designUtils';
import { cn } from '../../../lib/utils';

export const EvolucionTemporalPanel = ({ evolucionTemporal, periodoEvolucion, hayDatos }) => {
    const maxFacturacion = evolucionTemporal.length
        ? Math.max(...evolucionTemporal.map(([, data]) => data.facturacion))
        : 0;

    return (
        <div className={cn(glassStyles(), "rounded-3xl p-8 space-y-8")}>
            {evolucionTemporal.length > 0 ? (
                <div className="space-y-8">
                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                        <div className="flex items-center gap-2">
                            <Calendar className="w-5 h-5 text-indigo-500" />
                            <span className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                                {periodoEvolucion === 'anual' ? 'Por años' : periodoEvolucion === 'trimestral' ? 'Por trimestres' : 'Por meses'}
                            </span>
                        </div>
                        <div className="text-right">
                            <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Acumulado Período</p>
                            <p className="text-xl font-black text-slate-800 dark:text-white">
                                {euro(evolucionTemporal.reduce((sum, [, data]) => sum + data.facturacion, 0))}
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-6">
                        {evolucionTemporal.map(([periodo, data]) => {
                            const percentage = maxFacturacion > 0 ? (data.facturacion / maxFacturacion) * 100 : 0;

                            let displayName = periodo;
                            try {
                                if (periodoEvolucion === 'semestral' || periodoEvolucion === 'mensual' || periodo.length === 7) {
                                    const date = new Date(periodo + '-01');
                                    displayName = date.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
                                }
                            } catch (e) {
                                displayName = periodo;
                            }

                            return (
                                <div key={periodo} className="group space-y-2">
                                    <div className="flex justify-between items-end">
                                        <div>
                                            <span className="text-sm font-black text-slate-700 dark:text-white capitalize">{displayName}</span>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">{data.ventas} ventas</span>
                                                <span className="text-[10px] text-slate-400 dark:text-slate-500">•</span>
                                                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">{euro(data.facturacion)}</span>
                                            </div>
                                        </div>
                                        {hayDatos && data.margen > 0 && (
                                            <div className="text-right">
                                                <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Margen</p>
                                                <p className="text-sm font-black text-slate-800 dark:text-white">{euro(data.margen)}</p>
                                            </div>
                                        )}
                                    </div>

                                    <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-4 relative overflow-hidden group-hover:shadow-lg transition-all">
                                        <div
                                            className="absolute left-0 top-0 bottom-0 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-600 rounded-full transition-all duration-1000 ease-out"
                                            style={{ width: `${Math.max(percentage, 5)}%` }}
                                        >
                                            <div className="absolute inset-0 bg-white/20 animate-pulse" />
                                        </div>
                                        {percentage > 15 && (
                                            <div className="absolute right-3 top-0 bottom-0 flex items-center">
                                                <span className="text-[10px] font-black text-white drop-shadow-md">
                                                    {percentage.toFixed(0)}%
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            ) : (
                <div className="text-center py-20 opacity-50">
                    <Calendar className="w-16 h-16 mx-auto text-slate-300 dark:text-slate-700 mb-6" />
                    <p className="text-slate-500 font-black uppercase tracking-widest text-sm">No hay registros cronológicos suficientes</p>
                </div>
            )}
        </div>
    );
};
