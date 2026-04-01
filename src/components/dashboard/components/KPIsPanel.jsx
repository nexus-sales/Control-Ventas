import React from 'react';
import { Euro, TrendingUp, Target, BarChart3 } from 'lucide-react';
import { euro, glassStyles, cardHoverStyles } from '../../../utils/designUtils';
import { cn } from '../../../lib/utils';
import { motion } from 'framer-motion';
import { BorderBeam } from '../../ui/BorderBeam';

const KPICard = ({ title, value, subtitle, icon: Icon, colorClass: _colorClass, gradientFrom, gradientTo, delay = 0 }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay }}
        className={cn(
            glassStyles(),
            cardHoverStyles(),
            "rounded-3xl p-6 relative overflow-hidden group border border-white/20 dark:border-slate-800/50"
        )}
    >
        {/* Border Beam Effect (Magic UI) */}
        <BorderBeam
            size={120}
            duration={12}
            delay={delay * 2}
            colorFrom={gradientFrom.replace('from-', '#')}
            colorTo={gradientTo.replace('to-', '#')}
        />
        {/* Fondo decorativo con gradiente */}
        <div className={`absolute -right-4 -top-4 w-24 h-24 rounded-full bg-gradient-to-br ${gradientFrom} ${gradientTo} opacity-10 group-hover:opacity-20 transition-opacity duration-500`} />

        <div className="flex items-center justify-between relative z-10">
            <div className="space-y-1">
                <p className="text-slate-500 dark:text-slate-400 text-sm font-medium tracking-wide uppercase">
                    {title}
                </p>
                <p className="text-3xl font-black text-slate-800 dark:text-white tracking-tight">
                    {value}
                </p>
                <p className="text-slate-400 dark:text-slate-500 text-xs font-medium">
                    {subtitle}
                </p>
            </div>
            <div className={`p-4 rounded-2xl bg-gradient-to-br ${gradientFrom} ${gradientTo} shadow-lg shadow-inner`}>
                <Icon className="w-6 h-6 text-white" />
            </div>
        </div>
    </motion.div>
);

const KPIsPanel = ({ kpis, hayDatos, total, ticketMedio, facturacionTotal, byEstado, crecimiento }) => {
    const { comBruta, comPagada, margen } = kpis;

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <KPICard
                title={hayDatos ? "Comisión Bruta" : "Facturación Total"}
                value={hayDatos ? euro(comBruta) : euro(facturacionTotal)}
                subtitle={hayDatos ? `${crecimiento >= 0 ? "+" : ""}${crecimiento.toFixed(1)}% vs anterior` : `${total} ventas registradas`}
                icon={Euro}
                gradientFrom="from-sky-500"
                gradientTo="to-blue-600"
                delay={0.1}
            />

            <KPICard
                title={hayDatos ? "Comisión Pagada" : "Ticket Medio"}
                value={hayDatos ? euro(comPagada) : euro(ticketMedio)}
                subtitle={hayDatos ? "A colaboradores (neto)" : "Promedio por venta"}
                icon={TrendingUp}
                gradientFrom="from-emerald-500"
                gradientTo="to-teal-600"
                delay={0.2}
            />

            <KPICard
                title={hayDatos ? "Margen Empresa" : "Ventas Cerradas"}
                value={hayDatos ? euro(margen) : (byEstado.Cerrada || 0)}
                subtitle={hayDatos ? `${comBruta > 0 ? ((margen / comBruta) * 100).toFixed(0) : 0}% de rentabilidad bruta` : `${total > 0 ? (((byEstado.Cerrada || 0) / total) * 100).toFixed(1) : 0}% efectividad cierre`}
                icon={Target}
                gradientFrom="from-purple-500"
                gradientTo="to-indigo-600"
                delay={0.3}
            />

            <KPICard
                title={hayDatos ? "Ventas Totales" : "Ventas Liquidadas"}
                value={hayDatos ? total : (byEstado.Liquidada || 0)}
                subtitle={hayDatos ? `Ticket medio: ${euro(ticketMedio)}` : "Completamente procesadas"}
                icon={BarChart3}
                gradientFrom="from-rose-500"
                gradientTo="to-pink-600"
                delay={0.4}
            />
        </div>
    );
};

export default React.memo(KPIsPanel);
