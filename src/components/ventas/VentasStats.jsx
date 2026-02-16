import React, { useMemo } from 'react';
import { Package, Euro, TrendingUp, Star, Zap, ArrowUpRight } from 'lucide-react';
import { euro, glassStyles } from '../../utils/designUtils';
import { cn } from '../../lib/utils';
import { motion } from 'framer-motion';
import { BorderBeam } from '../ui/BorderBeam';

const StatCard = ({ title, value, subtitle, icon: Icon, gradientFrom, gradientTo, delay = 0, trend }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.6, delay, ease: [0.23, 1, 0.32, 1] }}
    whileHover={{ y: -8, transition: { duration: 0.2 } }}
    className={cn(
      glassStyles(),
      "rounded-[2.5rem] p-8 relative overflow-hidden group border border-white/20 dark:border-slate-800/50 shadow-2xl transition-all duration-300"
    )}
  >
    <BorderBeam
      size={120}
      duration={12}
      delay={delay}
      colorFrom={gradientFrom === 'brand' ? 'var(--brand-primary)' : (gradientFrom.includes('from-') ? gradientFrom.replace('from-', '#') : gradientFrom)}
      colorTo={gradientTo === 'brand' ? 'var(--brand-primary)' : (gradientTo.includes('to-') ? gradientTo.replace('to-', '#') : gradientTo)}
    />

    {/* Decorative background circle */}
    <div className={cn(
      "absolute -right-8 -top-8 w-40 h-40 rounded-full bg-gradient-to-br opacity-[0.03] group-hover:opacity-[0.07] group-hover:scale-110 transition-all duration-700",
      gradientFrom === 'brand' ? 'from-[var(--brand-primary)]' : gradientFrom,
      gradientTo === 'brand' ? 'to-[var(--brand-primary)]' : gradientTo
    )} />

    <div className="flex flex-col h-full justify-between relative z-10 space-y-6">
      <div className="flex items-start justify-between">
        <div className="space-y-1.5">
          <p className="text-slate-400 dark:text-slate-500 text-[10px] font-black uppercase tracking-[3px] opacity-80 group-hover:translate-x-1 transition-transform">{title}</p>
          <div className="flex items-baseline gap-2">
            <h4 className="text-4xl font-black text-slate-800 dark:text-white tracking-tighter leading-none group-hover:scale-[1.02] origin-left transition-transform">
              {value}
            </h4>
          </div>
        </div>

        <motion.div
          whileHover={{ rotate: 15, scale: 1.15 }}
          className={cn(
            "p-4 rounded-[1.25rem] bg-gradient-to-br shadow-inner group-hover:shadow-2xl transition-all duration-500",
            gradientFrom === 'brand' ? 'from-[var(--brand-primary)]' : gradientFrom,
            gradientTo === 'brand' ? 'to-[var(--brand-primary)]' : gradientTo,
            "shadow-lg"
          )}
        >
          <Icon className="w-6 h-6 text-white" />
        </motion.div>
      </div>

      <div className="flex items-center justify-between">
        {subtitle && (
          <div className="flex items-center gap-2">
            <div className={cn("w-2 h-2 rounded-full animate-pulse", gradientTo.replace('to-', 'bg-'))} />
            <p className="text-slate-500 dark:text-slate-400 text-[10px] font-black uppercase tracking-widest leading-none ">{subtitle}</p>
          </div>
        )}

        {trend && (
          <div className="px-2 py-1 bg-emerald-500/10 text-emerald-500 rounded-lg flex items-center gap-1 text-[9px] font-black">
            <ArrowUpRight className="w-3 h-3" /> {trend}
          </div>
        )}
      </div>
    </div>
  </motion.div>
);

export function VentasStats({ ventasCalc, productos = [] }) {
  const estadisticas = useMemo(() => {
    let totalPvp = 0;
    let countConPvp = 0;
    let comisionesTotal = 0;

    ventasCalc.forEach((v) => {
      const prod = productos.find((p) => p?.id === v.producto_id);
      const pvpValue = prod?.pvp || v.pvp || 0;
      const cantidad = Number(v.cantidad) || 1;
      const importe = (Number(pvpValue) || 0) * cantidad;

      if (pvpValue > 0) {
        totalPvp += importe;
        countConPvp++;
      }

      if (v._calc?.ok) {
        comisionesTotal += v._calc.detalle.comBruta || 0;
      }
    });

    return {
      totalVentas: ventasCalc.length,
      volumenTotal: totalPvp,
      comisionesTotal,
      ticketMedio: countConPvp > 0 ? totalPvp / countConPvp : 0,
      ventasSinPvp: ventasCalc.length - countConPvp,
    };
  }, [ventasCalc, productos]);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
      <StatCard
        title="Operaciones"
        value={estadisticas.totalVentas}
        subtitle={estadisticas.ventasSinPvp > 0 ? `${estadisticas.ventasSinPvp} Pendientes Datos` : "Sync Completa"}
        icon={Package}
        gradientFrom="brand"
        gradientTo="brand"
        delay={0.1}
        trend="+12%"
      />
      <StatCard
        title="Facturación Brut."
        value={euro(estadisticas.volumenTotal)}
        subtitle="Valor Total Mercado"
        icon={Euro}
        gradientFrom="from-emerald-600"
        gradientTo="to-teal-700"
        delay={0.2}
      />
      <StatCard
        title="Comisión Estimada"
        value={euro(estadisticas.comisionesTotal)}
        subtitle="Revenue Stream"
        icon={TrendingUp}
        gradientFrom="from-purple-600"
        gradientTo="to-fuchsia-700"
        delay={0.3}
        trend="High"
      />
      <StatCard
        title="Cierre Promedio"
        value={euro(estadisticas.ticketMedio)}
        subtitle="Eficiencia / Ticket"
        icon={Star}
        gradientFrom="from-amber-500"
        gradientTo="to-orange-600"
        delay={0.4}
      />
    </div>
  );
}

export default React.memo(VentasStats);
