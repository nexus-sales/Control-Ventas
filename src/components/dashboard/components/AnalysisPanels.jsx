import React from 'react';
import { PieChart, Target, MapPin, Sparkles } from 'lucide-react';
import { euro, glassStyles } from '../../../utils/designUtils';
import { cn } from '../../../lib/utils';
import { motion } from 'framer-motion';
import { BorderBeam } from '../../ui/BorderBeam';

const AnalysisItem = ({ label, sublabel, title, extra, icon: Icon, percentage, delay = 0 }) => (
    <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay }}
        className="group space-y-3"
    >
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800/50 flex items-center justify-center transition-colors group-hover:bg-blue-50 dark:group-hover:bg-blue-900/20 shadow-inner">
                    {Icon ? (
                        <Icon className="w-5 h-5 text-slate-400 dark:text-slate-500 group-hover:text-blue-500 transition-colors" />
                    ) : (
                        <Sparkles className="w-5 h-5 text-slate-400 dark:text-slate-500 group-hover:text-blue-500 transition-colors" />
                    )}
                </div>
                <div>
                    <p className="text-sm font-black text-slate-800 dark:text-white capitalize tracking-tight">{label}</p>
                    <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">{sublabel}</p>
                </div>
            </div>
            <div className="text-right">
                <p className="text-sm font-black text-slate-800 dark:text-white tracking-tight">{title}</p>
                {extra && <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-tighter">{extra}</p>}
            </div>
        </div>

        {percentage !== undefined && (
            <div className="relative pt-1">
                <div className="overflow-hidden h-2 text-xs flex rounded-full bg-slate-100 dark:bg-slate-800/50 shadow-inner">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${percentage}%` }}
                        transition={{ duration: 1, delay: delay + 0.2, ease: "circOut" }}
                        className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full group-hover:shadow-[0_0_12px_rgba(59,130,246,0.4)] transition-all"
                    />
                </div>
            </div>
        )}
    </motion.div>
);

export const SectorAnalysis = ({ bySector, hayDatos }) => {
    const maxFact = bySector.length ? Math.max(...bySector.map(([, d]) => d.facturacion)) : 100;

    return (
        <div className={cn(glassStyles(), "p-8 rounded-[2rem] space-y-8 border border-white/20 dark:border-slate-800/50 relative overflow-hidden shadow-2xl")}>
            <BorderBeam size={150} duration={12} colorFrom="#3b82f6" colorTo="#6366f1" />
            <div className="relative z-10 space-y-8">
                {bySector.length > 0 ? (
                    bySector.map(([sector, data], idx) => (
                        <AnalysisItem
                            key={sector}
                            label={sector}
                            sublabel={`${data.ventas} ventas`}
                            title={euro(data.facturacion)}
                            extra={hayDatos && data.bruto > 0 ? `Bruto: ${euro(data.bruto)}` : null}
                            percentage={(data.facturacion / maxFact) * 100}
                            delay={idx * 0.1}
                        />
                    ))
                ) : (
                    <div className="text-center py-12 opacity-50">
                        <PieChart className="w-12 h-12 mx-auto text-slate-200 dark:text-slate-800 mb-4" />
                        <p className="text-slate-400 text-[10px] font-black uppercase tracking-[3px]">Sector Inactivo</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export const FamiliaAnalysis = ({ byFamilia, hayDatos }) => {
    const maxFact = byFamilia.length ? Math.max(...byFamilia.map(([, d]) => d.facturacion)) : 100;

    return (
        <div className={cn(glassStyles(), "p-8 rounded-[2rem] space-y-8 border border-white/20 dark:border-slate-800/50 relative overflow-hidden shadow-2xl")}>
            <BorderBeam size={150} duration={14} colorFrom="#8b5cf6" colorTo="#d946ef" />
            <div className="relative z-10 space-y-8">
                {byFamilia.length > 0 ? (
                    byFamilia.map(([familia, data], idx) => (
                        <AnalysisItem
                            key={familia}
                            label={familia}
                            sublabel={`${data.ventas} productos`}
                            title={euro(data.facturacion)}
                            extra={hayDatos && data.margen > 0 ? `Margen: ${euro(data.margen)}` : null}
                            percentage={(data.facturacion / maxFact) * 100}
                            delay={idx * 0.1}
                        />
                    ))
                ) : (
                    <div className="text-center py-12 opacity-50">
                        <Target className="w-12 h-12 mx-auto text-slate-200 dark:text-slate-800 mb-4" />
                        <p className="text-slate-400 text-[10px] font-black uppercase tracking-[3px]">Familia sin datos</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export const GeoDistributionPanel = ({ byZona }) => {
    const maxFact = byZona.length ? Math.max(...byZona.map(([, d]) => d.facturacion)) : 100;

    return (
        <div className={cn(glassStyles(), "p-8 rounded-[3rem] gap-x-12 gap-y-10 grid grid-cols-1 md:grid-cols-2 border border-white/20 dark:border-slate-800/50 relative overflow-hidden shadow-2xl")}>
            <BorderBeam size={200} duration={16} colorFrom="#10b981" colorTo="#3b82f6" />
            {byZona.length > 0 ? (
                byZona.map(([zona, data], idx) => (
                    <div key={zona} className="relative z-10">
                        <AnalysisItem
                            icon={MapPin}
                            label={zona}
                            sublabel={`${data.ventas} operaciones`}
                            title={euro(data.facturacion)}
                            extra={`Impuestos: ${euro(data.impuestos)}`}
                            percentage={(data.facturacion / maxFact) * 100}
                            delay={idx * 0.1}
                        />
                    </div>
                ))
            ) : (
                <div className="col-span-2 text-center py-12 opacity-50 relative z-10">
                    <MapPin className="w-12 h-12 mx-auto text-slate-200 dark:text-slate-800 mb-4" />
                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-[3px]">Sin actividad geográfica</p>
                </div>
            )}
        </div>
    );
};
