import React from 'react';
import { PieChart, Target, MapPin } from 'lucide-react';
import { euro, glassStyles } from '../../../utils/designUtils';

const AnalysisItem = ({ label, sublabel, title, extra, icon: Icon, percentage }) => (
    <div className="group space-y-2">
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
                {Icon && <Icon className="w-4 h-4 text-slate-400 dark:text-slate-500" />}
                <div>
                    <p className="text-sm font-black text-slate-800 dark:text-white capitalize">{label}</p>
                    <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">{sublabel}</p>
                </div>
            </div>
            <div className="text-right">
                <p className="text-sm font-black text-slate-800 dark:text-white">{title}</p>
                {extra && <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">{extra}</p>}
            </div>
        </div>
        {percentage !== undefined && (
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div
                    className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full transition-all duration-500 group-hover:shadow-[0_0_8px_rgba(59,130,246,0.5)]"
                    style={{ width: `${percentage}%` }}
                />
            </div>
        )}
    </div>
);

export const SectorAnalysis = ({ bySector, hayDatos }) => {
    const maxFact = bySector.length ? Math.max(...bySector.map(([, d]) => d.facturacion)) : 100;

    return (
        <div className={`${glassStyles} p-6 rounded-3xl space-y-6`}>
            {bySector.length > 0 ? (
                bySector.map(([sector, data]) => (
                    <AnalysisItem
                        key={sector}
                        label={sector}
                        sublabel={`${data.ventas} ventas`}
                        title={euro(data.facturacion)}
                        extra={hayDatos && data.bruto > 0 ? `Comisión: ${euro(data.bruto)}` : null}
                        percentage={(data.facturacion / maxFact) * 100}
                    />
                ))
            ) : (
                <div className="text-center py-6">
                    <PieChart className="w-10 h-10 mx-auto text-slate-200 dark:text-slate-800 mb-2" />
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Sin datos sectoriales</p>
                </div>
            )}
        </div>
    );
};

export const FamiliaAnalysis = ({ byFamilia, hayDatos }) => {
    const maxFact = byFamilia.length ? Math.max(...byFamilia.map(([, d]) => d.facturacion)) : 100;

    return (
        <div className={`${glassStyles} p-6 rounded-3xl space-y-6`}>
            {byFamilia.length > 0 ? (
                byFamilia.map(([familia, data]) => (
                    <AnalysisItem
                        key={familia}
                        label={familia}
                        sublabel={`${data.ventas} productos`}
                        title={euro(data.facturacion)}
                        extra={hayDatos && data.margen > 0 ? `Margen: ${euro(data.margen)}` : null}
                        percentage={(data.facturacion / maxFact) * 100}
                    />
                ))
            ) : (
                <div className="text-center py-6">
                    <Target className="w-10 h-10 mx-auto text-slate-200 dark:text-slate-800 mb-2" />
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Sin datos por familia</p>
                </div>
            )}
        </div>
    );
};

export const GeoDistributionPanel = ({ byZona }) => {
    const maxFact = byZona.length ? Math.max(...byZona.map(([, d]) => d.facturacion)) : 100;

    return (
        <div className={`${glassStyles} p-6 rounded-3xl grid grid-cols-1 md:grid-cols-2 gap-8`}>
            {byZona.length > 0 ? (
                byZona.map(([zona, data]) => (
                    <AnalysisItem
                        key={zona}
                        icon={MapPin}
                        label={zona}
                        sublabel={`${data.ventas} operaciones`}
                        title={euro(data.facturacion)}
                        extra={`IVA/IGIC: ${euro(data.impuestos)}`}
                        percentage={(data.facturacion / maxFact) * 100}
                    />
                ))
            ) : (
                <div className="col-span-2 text-center py-6">
                    <MapPin className="w-10 h-10 mx-auto text-slate-200 dark:text-slate-800 mb-2" />
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Sin datos geográficos</p>
                </div>
            )}
        </div>
    );
};
