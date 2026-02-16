import React from 'react';
import { Users, Target, Crown, Trophy, Medal } from 'lucide-react';
import { euro, glassStyles, cardHoverStyles } from '../../../utils/designUtils';
import { cn } from '../../../lib/utils';
import { motion } from 'framer-motion';
import { BorderBeam } from '../../ui/BorderBeam';

const RankingItem = ({ index, label, sublabel, value, extra, variant = 'blue', delay = 0 }) => {
    const themes = {
        blue: {
            bg: 'from-blue-500/10 to-transparent',
            border: 'border-blue-500/20',
            badge: 'bg-gradient-to-br from-blue-500 to-blue-600',
            text: 'text-blue-600 dark:text-blue-400',
            icon: Trophy
        },
        emerald: {
            bg: 'from-emerald-500/10 to-transparent',
            border: 'border-emerald-500/20',
            badge: 'bg-gradient-to-br from-emerald-500 to-emerald-600',
            text: 'text-emerald-600 dark:text-emerald-400',
            icon: Medal
        },
        purple: {
            bg: 'from-purple-500/10 to-transparent',
            border: 'border-purple-500/20',
            badge: 'bg-gradient-to-br from-purple-500 to-purple-600',
            text: 'text-purple-600 dark:text-purple-400',
            icon: Crown
        }
    };

    const theme = themes[variant] || themes.blue;
    const isTopOne = index === 0;

    return (
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay }}
            whileHover={{ x: 5, scale: 1.01 }}
            className={cn(
                glassStyles(),
                cardHoverStyles(),
                "relative flex items-center justify-between p-4 rounded-2xl border transition-all overflow-hidden group",
                theme.border,
                isTopOne && "shadow-xl shadow-blue-500/5"
            )}
        >
            {isTopOne && (
                <BorderBeam
                    size={100}
                    duration={8}
                    colorFrom={variant === 'blue' ? "#3b82f6" : variant === 'purple' ? "#a855f7" : "#10b981"}
                    colorTo="#6366f1"
                />
            )}

            <div className={cn("absolute inset-y-0 left-0 w-1 bg-gradient-to-b", theme.badge)} />
            <div className={cn("absolute inset-0 bg-gradient-to-r opacity-0 group-hover:opacity-100 transition-opacity duration-500", theme.bg)} />

            <div className="flex items-center gap-4 relative z-10">
                <div className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center text-white text-xl font-black shadow-lg relative group-hover:rotate-6 transition-transform",
                    theme.badge
                )}>
                    {index + 1}
                    {isTopOne && <theme.icon className="absolute -top-2 -right-2 w-5 h-5 text-amber-500 drop-shadow-md brightness-125" />}
                </div>
                <div>
                    <p className="text-sm font-black text-slate-800 dark:text-white leading-tight uppercase tracking-tight">{label}</p>
                    <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 mt-1 uppercase tracking-widest">{sublabel}</p>
                </div>
            </div>

            <div className="text-right relative z-10">
                <p className={cn("text-base font-black tracking-tight", theme.text)}>{value}</p>
                {extra && (
                    <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-tighter opacity-80">{extra}</p>
                )}
            </div>
        </motion.div>
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
                        extra={hayDatos && colab.neto > 0 ? `Comisión: ${euro(colab.neto)}` : null}
                        variant={index === 0 ? 'blue' : index === 1 ? 'purple' : 'emerald'}
                        delay={index * 0.1}
                    />
                ))
            ) : (
                <div className={cn(glassStyles(), "text-center py-12 rounded-[2rem] border-dashed border-slate-200 dark:border-slate-800 opacity-60")}>
                    <Users className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-700 mb-4" />
                    <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Sin registros de ventas</p>
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
                        sublabel={`${producto.familia || 'Servicio'} • ${producto.ventas} u.`}
                        value={euro(producto.facturacion)}
                        extra={hayDatos && producto.margen > 0 ? `Margen: ${euro(producto.margen)}` : null}
                        variant={index === 0 ? 'purple' : index === 1 ? 'blue' : 'emerald'}
                        delay={index * 0.1}
                    />
                ))
            ) : (
                <div className={cn(glassStyles(), "text-center py-12 rounded-[2rem] border-dashed border-slate-200 dark:border-slate-800 opacity-60")}>
                    <Target className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-700 mb-4" />
                    <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Sin productos vendidos</p>
                </div>
            )}
        </div>
    );
};
