import React from 'react';
import { Euro, TrendingUp, Award, PieChart } from 'lucide-react';
import { euro, glassStyles, cardHoverStyles } from '../../../utils/designUtils';
import { cn } from '../../../lib/utils';
import { motion } from 'framer-motion';

const MetricTile = ({ title, value, subtitle, icon: Icon, colorClass: _colorClass, gradientFrom, gradientTo, delay = 0 }) => (
    <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, delay }}
        whileHover={{ y: -4, scale: 1.02 }}
        className={cn(
            glassStyles(),
            cardHoverStyles(),
            "p-5 rounded-3xl flex items-center justify-between group transition-all border border-white/20 dark:border-slate-800/50"
        )}
    >
        <div className="flex items-center gap-5">
            <div className={cn(
                "p-3.5 rounded-2xl bg-gradient-to-br shadow-inner transition-all duration-500 group-hover:rotate-12",
                gradientFrom,
                gradientTo
            )}>
                <Icon className="w-6 h-6 text-white" />
            </div>
            <div>
                <p className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[2px] mb-1">{title}</p>
                <p className="text-2xl font-black text-slate-800 dark:text-white leading-tight tracking-tight">{value}</p>
                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1 opacity-70">{subtitle}</p>
            </div>
        </div>

        {/* Decoración sutil de fondo */}
        <div className={cn(
            "absolute -right-2 -bottom-2 w-16 h-16 rounded-full opacity-[0.03] group-hover:opacity-[0.08] transition-opacity bg-gradient-to-br",
            gradientFrom,
            gradientTo
        )} />
    </motion.div>
);

const ExtraMetricsPanel = ({ ticketMedio, irpfMedio, total, byEstado, margen, facturacionTotal, hayDatos }) => {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 h-full">
            <MetricTile
                title="Ticket Medio"
                value={euro(ticketMedio)}
                subtitle="Promedio por venta"
                icon={Euro}
                gradientFrom="from-amber-400"
                gradientTo="to-orange-500"
                delay={0.1}
            />

            <MetricTile
                title="IRPF Medio"
                value={hayDatos ? `${irpfMedio.toFixed(1)}%` : "N/A"}
                subtitle="Retención fiscal"
                icon={TrendingUp}
                gradientFrom="from-indigo-400"
                gradientTo="to-blue-600"
                delay={0.2}
            />

            <MetricTile
                title="Tasa Cierre"
                value={total > 0 ? (((byEstado.Cerrada || 0) / total) * 100).toFixed(1) + "%" : "0%"}
                subtitle="Conversión de leads"
                icon={Award}
                gradientFrom="from-emerald-400"
                gradientTo="to-teal-600"
                delay={0.3}
            />

            <MetricTile
                title="Rentabilidad"
                value={hayDatos && facturacionTotal > 0 ? `${((margen / facturacionTotal) * 100).toFixed(1)}%` : "N/A"}
                subtitle="Margen sobre bruto"
                icon={PieChart}
                gradientFrom="from-rose-400"
                gradientTo="to-pink-600"
                delay={0.4}
            />
        </div>
    );
};

export default React.memo(ExtraMetricsPanel);
