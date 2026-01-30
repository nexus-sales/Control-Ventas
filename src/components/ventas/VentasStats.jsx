import React, { useMemo } from 'react';
import { Package, Euro, TrendingUp, Star } from 'lucide-react';
import { euro, glassStyles, cardHoverStyles } from '../../utils/designUtils';

const StatCard = ({ title, value, subtitle, icon: Icon, gradientFrom, gradientTo }) => (
  <div className={`${glassStyles} ${cardHoverStyles} rounded-3xl p-6 relative overflow-hidden group`}>
    <div className={`absolute -right-4 -top-4 w-24 h-24 rounded-full bg-gradient-to-br ${gradientFrom} ${gradientTo} opacity-10 group-hover:opacity-20 transition-opacity duration-500`} />
    <div className="flex items-center justify-between relative z-10">
      <div className="space-y-1">
        <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-widest">{title}</p>
        <p className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">{value}</p>
        {subtitle && <p className="text-slate-400 dark:text-slate-500 text-[10px] font-bold uppercase tracking-wide">{subtitle}</p>}
      </div>
      <div className={`p-4 rounded-2xl bg-gradient-to-br ${gradientFrom} ${gradientTo} shadow-lg`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
    </div>
  </div>
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
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      <StatCard
        title="Total Ventas"
        value={estadisticas.totalVentas}
        subtitle={estadisticas.ventasSinPvp > 0 ? `${estadisticas.ventasSinPvp} sin PVP definido` : "Registros actualizados"}
        icon={Package}
        gradientFrom="from-blue-500"
        gradientTo="to-indigo-600"
      />
      <StatCard
        title="Volumen Negocio"
        value={euro(estadisticas.volumenTotal)}
        subtitle="Suma de importes PVP"
        icon={Euro}
        gradientFrom="from-emerald-500"
        gradientTo="to-teal-600"
      />
      <StatCard
        title="Comisiones Brutas"
        value={euro(estadisticas.comisionesTotal)}
        subtitle="Estimación de ingresos"
        icon={TrendingUp}
        gradientFrom="from-purple-500"
        gradientTo="to-fuchsia-600"
      />
      <StatCard
        title="Ticket Medio"
        value={euro(estadisticas.ticketMedio)}
        subtitle="Promedio por operación"
        icon={Star}
        gradientFrom="from-amber-500"
        gradientTo="to-orange-600"
      />
    </div>
  );
}

export default React.memo(VentasStats);