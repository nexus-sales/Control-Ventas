// src/components/widgets/QuickStats.jsx
// Estadísticas rápidas y útiles para el dashboard
import React, { useMemo } from 'react';
import * as Tooltip from '@radix-ui/react-tooltip';
import { TrendingUp, TrendingDown, Euro, Users, Target, Calendar, Zap, Award } from 'lucide-react';

/* eslint-disable no-unused-vars */

function StatCard({ icon: Icon, title, value, subtitle, trend, color = "text-slate-600", bgColor = "bg-slate-50" }) {
  // Descripciones para tooltips según el título
  const tooltipDescriptions = {
    'Facturación': 'Suma total facturada este mes, incluyendo todas las ventas registradas.',
    'Progreso Meta': 'Porcentaje de avance respecto a la meta mensual de facturación.',
    'Ventas/día': 'Promedio de ventas diarias en el mes actual.',
    'Ticket Medio': 'Promedio de facturación por cada venta realizada este mes.',
    'Colaboradores Activos': 'Colaboradores que han realizado al menos una venta este mes.',
    'Tasa de Cierre': 'Porcentaje de ventas cerradas respecto al total de ventas del mes.',
    'Liquidaciones Pendientes': 'Liquidaciones generadas este mes que aún no han sido procesadas.',
    'En Proceso': 'Ventas que requieren seguimiento o están en proceso.',
    'Con Problemas': 'Ventas con incidencias, canceladas o rechazadas.'
  };
  return (
    <Tooltip.Root delayDuration={200}>
      <Tooltip.Trigger asChild>
        <div className={`${bgColor} rounded-xl p-4 border border-slate-200 hover:shadow-md transition-all cursor-help`}>
          <div className="flex items-center justify-between mb-2">
            <Icon className={`w-5 h-5 ${color}`} />
            {trend !== undefined && (
              <div className={`text-xs flex items-center gap-1 ${trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {trend >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {Math.abs(trend).toFixed(1)}%
              </div>
            )}
          </div>
          <div className="text-xl font-bold text-slate-800 mb-1">
            {value}
          </div>
          <div className="text-xs text-slate-500">
            {title}
          </div>
          {subtitle && (
            <div className="text-xs text-slate-600 mt-1 font-medium">
              {subtitle}
            </div>
          )}
        </div>
      </Tooltip.Trigger>
      <Tooltip.Portal>
        <Tooltip.Content side="top" align="center" className="z-50 px-3 py-2 rounded-lg bg-slate-900 text-white text-xs shadow-lg animate-fadeIn" style={{ pointerEvents: 'auto' }}>
          {tooltipDescriptions[title] || title}
          <Tooltip.Arrow className="fill-slate-900" />
        </Tooltip.Content>
      </Tooltip.Portal>
    </Tooltip.Root>
  );
}

export default function QuickStats({ ventas, colaboradores, liquidaciones }) {
  const stats = useMemo(() => {
    const ahora = new Date();
    const mesActual = ahora.toISOString().slice(0, 7);
    const mesAnterior = new Date(ahora.getFullYear(), ahora.getMonth() - 1, 1).toISOString().slice(0, 7);
    
    // Ventas del mes actual y anterior
    const ventasMesActual = ventas.filter(v => v.fecha?.slice(0, 7) === mesActual);
    const ventasMesAnterior = ventas.filter(v => v.fecha?.slice(0, 7) === mesAnterior);
    
    // Facturación usando valores calculados
    const facturacionActual = ventasMesActual.reduce((acc, v) => acc + (Number(v._calc?.pvp_final || v.pvp) || 0), 0);
    const facturacionAnterior = ventasMesAnterior.reduce((acc, v) => acc + (Number(v._calc?.pvp_final || v.pvp) || 0), 0);
    const trendFacturacion = facturacionAnterior > 0 ? ((facturacionActual - facturacionAnterior) / facturacionAnterior) * 100 : 0;
    
    // Ventas por día promedio
    const diasDelMes = ahora.getDate();
    const ventasPorDia = diasDelMes > 0 ? ventasMesActual.length / diasDelMes : 0;
    const ventasPorDiaAnterior = ventasMesAnterior.length / new Date(ahora.getFullYear(), ahora.getMonth(), 0).getDate();
    const trendVentasDiarias = ventasPorDiaAnterior > 0 ? ((ventasPorDia - ventasPorDiaAnterior) / ventasPorDiaAnterior) * 100 : 0;
    
    // Colaboradores activos (con ventas este mes)
    const colaboradoresActivos = new Set(ventasMesActual.map(v => v.colaborador_id)).size;
    const colaboradoresActivosAnterior = new Set(ventasMesAnterior.map(v => v.colaborador_id)).size;
    const trendColaboradores = colaboradoresActivosAnterior > 0 ? ((colaboradoresActivos - colaboradoresActivosAnterior) / colaboradoresActivosAnterior) * 100 : 0;
    
    // Ticket medio
    const ticketMedio = ventasMesActual.length > 0 ? facturacionActual / ventasMesActual.length : 0;
    const ticketMedioAnterior = ventasMesAnterior.length > 0 ? 
      ventasMesAnterior.reduce((acc, v) => acc + (Number(v.pvp) || 0), 0) / ventasMesAnterior.length : 0;
    const trendTicket = ticketMedioAnterior > 0 ? ((ticketMedio - ticketMedioAnterior) / ticketMedioAnterior) * 100 : 0;
    
    // Conversión (ventas cerradas vs total)
    const ventasCerradas = ventasMesActual.filter(v => ['Cerrada', 'Liquidada'].includes(v.estado)).length;
    const tasaCierre = ventasMesActual.length > 0 ? (ventasCerradas / ventasMesActual.length) * 100 : 0;
    
    // Liquidaciones pendientes
    const liquidacionesPendientes = liquidaciones.filter(l => l.estado === 'Generada').length;
    
    // Ventas en proceso (necesitan seguimiento)
    const ventasEnProceso = ventas.filter(v => ['PENDIENTE', 'SCORING', 'TRAMITACION', 'INCIDENCIA'].includes(v.estado)).length;
    
    // Ventas con problemas
    const ventasProblematicas = ventas.filter(v => ['INCIDENCIA', 'CANCELADA', 'RECHAZADA', 'BAJA'].includes(v.estado)).length;
    
    // Meta del mes (ejemplo: €50,000)
    const metaMensual = 50000;
    const progresoMeta = (facturacionActual / metaMensual) * 100;
    
    // Días restantes del mes
    const ultimoDiaMes = new Date(ahora.getFullYear(), ahora.getMonth() + 1, 0).getDate();
    const diasRestantes = ultimoDiaMes - ahora.getDate();
    
    return {
      facturacionActual,
      trendFacturacion,
      ventasPorDia,
      trendVentasDiarias,
      colaboradoresActivos,
      trendColaboradores,
      ticketMedio,
      trendTicket,
      tasaCierre,
      liquidacionesPendientes,
      progresoMeta,
      diasRestantes,
      ventasMesActual: ventasMesActual.length,
      ventasEnProceso,
      ventasProblematicas
    };
  }, [ventas, liquidaciones]);

  const formatEuro = (amount) => {
    return new Intl.NumberFormat('es-ES', { 
      style: 'currency', 
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Estadísticas principales del mes */}
      <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-6 border-2 border-blue-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-800">Este Mes</h3>
          <div className="text-sm text-slate-600">
            {stats.diasRestantes} días restantes
          </div>
        </div>
        
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={Euro}
            title="Facturación"
            value={formatEuro(stats.facturacionActual)}
            subtitle={`${stats.ventasMesActual} ventas`}
            trend={stats.trendFacturacion}
            color="text-green-600"
            bgColor="bg-white"
          />
          
          <StatCard
            icon={Target}
            title="Progreso Meta"
            value={`${stats.progresoMeta.toFixed(0)}%`}
            subtitle={`Meta: ${formatEuro(50000)}`}
            color="text-blue-600"
            bgColor="bg-white"
          />
          
          <StatCard
            icon={Calendar}
            title="Ventas/día"
            value={stats.ventasPorDia.toFixed(1)}
            subtitle="Promedio diario"
            trend={stats.trendVentasDiarias}
            color="text-purple-600"
            bgColor="bg-white"
          />
          
          <StatCard
            icon={Award}
            title="Ticket Medio"
            value={formatEuro(stats.ticketMedio)}
            subtitle="Por venta"
            trend={stats.trendTicket}
            color="text-amber-600"
            bgColor="bg-white"
          />
        </div>
      </div>

      {/* Estadísticas operativas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          icon={Users}
          title="Colaboradores Activos"
          value={stats.colaboradoresActivos}
          subtitle={`de ${colaboradores.length} totales`}
          trend={stats.trendColaboradores}
          color="text-indigo-600"
          bgColor="bg-indigo-50"
        />
        
        <StatCard
          icon={TrendingUp}
          title="Tasa de Cierre"
          value={`${stats.tasaCierre.toFixed(1)}%`}
          subtitle="Ventas cerradas/total"
          color="text-emerald-600"
          bgColor="bg-emerald-50"
        />
        
        <StatCard
          icon={Zap}
          title="Liquidaciones Pendientes"
          value={stats.liquidacionesPendientes}
          subtitle="Requieren atención"
          color={stats.liquidacionesPendientes > 0 ? "text-red-600" : "text-green-600"}
          bgColor={stats.liquidacionesPendientes > 0 ? "bg-red-50" : "bg-green-50"}
        />
        
        <StatCard
          icon={Target}
          title="En Proceso"
          value={stats.ventasEnProceso}
          subtitle="Necesitan seguimiento"
          color="text-amber-600"
          bgColor="bg-amber-50"
        />
        
        <StatCard
          icon={Award}
          title="Con Problemas"
          value={stats.ventasProblematicas}
          subtitle="Requieren atención"
          color={stats.ventasProblematicas > 0 ? "text-red-600" : "text-green-600"}
          bgColor={stats.ventasProblematicas > 0 ? "bg-red-50" : "bg-green-50"}
        />
      </div>

      {/* Barra de progreso visual para la meta */}
      <div className="bg-white rounded-xl p-4 border border-slate-200">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-slate-700">Meta Mensual</span>
          <span className="text-sm text-slate-600">{stats.progresoMeta.toFixed(1)}%</span>
        </div>
        <div className="w-full bg-slate-200 rounded-full h-3">
          <div 
            className={`h-3 rounded-full transition-all duration-500 ${
              stats.progresoMeta >= 100 ? 'bg-green-500' : 
              stats.progresoMeta >= 75 ? 'bg-blue-500' : 
              stats.progresoMeta >= 50 ? 'bg-yellow-500' : 'bg-red-500'
            }`}
            style={{ width: `${Math.min(stats.progresoMeta, 100)}%` }}
          ></div>
        </div>
        <div className="flex justify-between text-xs text-slate-500 mt-1">
          <span>{formatEuro(stats.facturacionActual)}</span>
          <span>{formatEuro(50000)}</span>
        </div>
      </div>
    </div>
  );
}
