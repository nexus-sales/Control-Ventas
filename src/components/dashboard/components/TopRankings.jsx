import React from 'react';
import { Users, Target, Euro } from 'lucide-react';
import { euro, glassStyles } from '../../../utils/designUtils';

const RankingItem = ({ index, label, sublabel, value, extra, variant = 'blue' }) => {
    const themes = {
        blue: {
            bg: 'bg-blue-50 dark:bg-blue-900/10',
            badge: 'bg-blue-500',
            text: 'text-blue-600 dark:text-blue-400'
        },
        emerald: {
            bg: 'bg-emerald-50 dark:bg-emerald-900/10',
            badge: 'bg-emerald-500',
            text: 'text-emerald-600 dark:text-emerald-400'
        },
        purple: {
            bg: 'bg-purple-50 dark:bg-purple-900/10',
            badge: 'bg-purple-500',
            text: 'text-purple-600 dark:text-purple-400'
        }
    };

    const theme = themes[variant] || themes.blue;

    return (
        <div className={`flex items-center justify-between p-4 ${theme.bg} rounded-2xl border border-white/50 dark:border-slate-800 transition-all hover:scale-[1.01] hover:shadow-md`}>
            <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-xl ${theme.badge} flex items-center justify-center text-white text-lg font-black shadow-lg shadow-inner`}>
                    {index + 1}
                </div>
                <div>
                    <p className="text-sm font-black text-slate-800 dark:text-white leading-tight">{label}</p>
                    <p className="text-xs font-bold text-slate-400 dark:text-slate-500 mt-0.5 uppercase tracking-wide">{sublabel}</p>
                </div>
            </div>
            <div className="text-right">
                <p className={`text-sm font-black ${theme.text}`}>{value}</p>
                {extra && (
                    <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">{extra}</p>
                )}
            </div>
        </div>
    );
};

export const TopColaboradoresPanel = ({ topColaboradores, hayDatos }) => {
    return (
        <div className="space-y-3">
            {topColaboradores.length > 0 ? (
                topColaboradores.map((colab, index) => (
                    <RankingItem
                        key={colab.id}
                        index={index}
                        label={colab.nombre}
                        sublabel={`${colab.ventas} ventas`}
                        value={euro(colab.facturacion)}
                        extra={hayDatos && colab.neto > 0 ? `Neto: ${euro(colab.neto)}` : null}
                        variant={index === 0 ? 'blue' : index === 1 ? 'purple' : 'emerald'}
                    />
                ))
            ) : (
                <div className={`${glassStyles} text-center py-10 rounded-3xl border-dashed opacity-60`}>
                    <Users className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-700 mb-4" />
                    <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Sin registros de ventas</p>
                </div>
            )}
        </div>
    );
};

export const TopProductosPanel = ({ topProductos, hayDatos }) => {
    return (
        <div className="space-y-3">
            {topProductos.length > 0 ? (
                topProductos.map((producto, index) => (
                    <RankingItem
                        key={producto.id}
                        index={index}
                        label={producto.nombre}
                        sublabel={`${producto.familia} • ${producto.ventas} u.`}
                        value={euro(producto.facturacion)}
                        extra={hayDatos && producto.margen > 0 ? `Ganancia: ${euro(producto.margen)}` : null}
                        variant={index === 0 ? 'emerald' : index === 1 ? 'blue' : 'purple'}
                    />
                ))
            ) : (
                <div className={`${glassStyles} text-center py-10 rounded-3xl border-dashed opacity-60`}>
                    <Target className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-700 mb-4" />
                    <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Sin productos vendidos</p>
                </div>
            )}
        </div>
    );
};
