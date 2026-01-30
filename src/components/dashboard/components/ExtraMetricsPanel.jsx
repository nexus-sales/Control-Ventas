import React from 'react';
import { Euro, TrendingUp, Award, PieChart } from 'lucide-react';
import { euro, glassStyles, cardHoverStyles } from '../../../utils/designUtils';

const MetricTile = ({ title, value, subtitle, icon: Icon, colorClass, gradientFrom, gradientTo }) => (
    <div className={`${glassStyles} ${cardHoverStyles} p-4 rounded-2xl flex items-center justify-between group`}>
        <div className="flex items-center gap-4">
            <div className={`p-3 rounded-xl bg-gradient-to-br ${gradientFrom} ${gradientTo} shadow-md group-hover:scale-110 transition-transform`}>
                <Icon className="w-5 h-5 text-white" />
            </div>
            <div>
                <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{title}</p>
                <p className="text-xl font-black text-slate-800 dark:text-white leading-tight">{value}</p>
                <p className="text-[10px] font-medium text-slate-400 dark:text-slate-500">{subtitle}</p>
            </div>
        </div>
    </div>
);

const ExtraMetricsPanel = ({ ticketMedio, irpfMedio, total, byEstado, margen, facturacionTotal, hayDatos }) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricTile
                title="Ticket Medio"
                value={euro(ticketMedio)}
                subtitle="Promedio por venta"
                icon={Euro}
                gradientFrom="from-amber-400"
                gradientTo="to-orange-500"
            />

            <MetricTile
                title="IRPF Medio"
                value={hayDatos ? `${irpfMedio.toFixed(1)}%` : "N/A"}
                subtitle="Retención fiscal promedio"
                icon={TrendingUp}
                gradientFrom="from-indigo-400"
                gradientTo="to-blue-600"
            />

            <MetricTile
                title="Tasa Cierre"
                value={total > 0 ? (((byEstado.Cerrada || 0) / total) * 100).toFixed(1) + "%" : "0%"}
                subtitle="Conversión de leads"
                icon={Award}
                gradientFrom="from-emerald-400"
                gradientTo="to-teal-600"
            />

            <MetricTile
                title="Rentabilidad"
                value={hayDatos && facturacionTotal > 0 ? `${((margen / facturacionTotal) * 100).toFixed(1)}%` : "N/A"}
                subtitle="Margen neto sobre ventas"
                icon={PieChart}
                gradientFrom="from-rose-400"
                gradientTo="to-pink-600"
            />
        </div>
    );
};

export default React.memo(ExtraMetricsPanel);
