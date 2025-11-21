// src/components/dashboard/MetricsPanel.jsx
// Panel de métricas consolidado: KPIs principales + métricas adicionales
import React from "react";
import { Euro, TrendingUp, Target, BarChart3, Users, Award, Calendar, Zap } from "lucide-react";

function euro(n) {
  return (n ?? 0).toFixed(2) + " €";
}

function MetricCard({ icon: Icon, title, value, subtitle, trend, gradient, textColor = "text-slate-700 dark:text-gray-200" }) {
  return (
    <div className={`bg-gradient-to-br ${gradient} rounded-2xl p-6 ${textColor}`}>
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Icon className="w-5 h-5" />
            <h3 className="font-medium text-sm">{title}</h3>
          </div>
          <div className="space-y-1">
            <p className="text-2xl font-bold">{value}</p>
            {subtitle && <p className="text-xs opacity-75">{subtitle}</p>}
          </div>
        </div>
        {trend && (
          <div className="text-right">
            <div className={`flex items-center gap-1 text-xs ${trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
              <TrendingUp className={`w-3 h-3 ${trend > 0 ? '' : 'rotate-180'}`} />
              {Math.abs(trend)}%
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Componente para KPIs principales
function MainKPIs({ kpis, hayDatos, total, ticketMedio, facturacionTotal, byEstado, crecimiento }) {
  const { comBruta, comPagada, margen } = kpis;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* KPI: Comisión Bruta / Facturación Total */}
      <MetricCard
        icon={Euro}
        title="Comisión Bruta"
        value={hayDatos ? euro(comBruta) : euro(facturacionTotal)}
        subtitle={hayDatos ? "Este período" : "Facturación Total"}
        gradient="from-sky-200 to-sky-300 dark:from-sky-700 dark:to-sky-800"
        trend={crecimiento?.comisionBruta}
      />

      {/* KPI: Margen */}
      <MetricCard
        icon={TrendingUp}
        title="Margen"
        value={hayDatos ? euro(margen) : euro(comBruta)}
        subtitle={hayDatos ? "Beneficio neto" : "Comisión estimada"}
        gradient="from-emerald-200 to-emerald-300 dark:from-emerald-700 dark:to-emerald-800"
        trend={crecimiento?.margen}
      />

      {/* KPI: Total Ventas / Ticket Medio */}
      <MetricCard
        icon={Target}
        title="Total Ventas"
        value={total?.toString() || "0"}
        subtitle={ticketMedio ? `Ticket medio: ${euro(ticketMedio)}` : "Registros"}
        gradient="from-purple-200 to-purple-300 dark:from-purple-700 dark:to-purple-800"
        trend={crecimiento?.totalVentas}
      />

      {/* KPI: Comisión Pagada / Estados */}
      <MetricCard
        icon={BarChart3}
        title="Comisión Pagada"
        value={hayDatos ? euro(comPagada) : (byEstado?.length || 0).toString()}
        subtitle={hayDatos ? "Liquidaciones" : "Estados diferentes"}
        gradient="from-amber-200 to-amber-300 dark:from-amber-700 dark:to-amber-800"
        trend={crecimiento?.comisionPagada}
      />
    </div>
  );
}

// Componente para métricas adicionales
function ExtraMetrics({ 
  colaboradoresActivos = 0, 
  productosVendidos = 0, 
  zonasActivas = 0,
  ventasConfirmadas = 0,
  ventasPendientes = 0,
  tasaConversion = 0,
  ingresoPromedioDiario = 0,
  metaMensual = 0,
  progresoMeta = 0
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4 mt-6">
      {/* Colaboradores activos */}
      <MetricCard
        icon={Users}
        title="Colaboradores"
        value={colaboradoresActivos.toString()}
        subtitle="Activos este mes"
        gradient="from-blue-100 to-blue-200 dark:from-blue-800 dark:to-blue-900"
      />

      {/* Productos vendidos */}
      <MetricCard
        icon={Award}
        title="Productos"
        value={productosVendidos.toString()}
        subtitle="Diferentes vendidos"
        gradient="from-green-100 to-green-200 dark:from-green-800 dark:to-green-900"
      />

      {/* Zonas activas */}
      <MetricCard
        icon={Target}
        title="Zonas"
        value={zonasActivas.toString()}
        subtitle="Con actividad"
        gradient="from-purple-100 to-purple-200 dark:from-purple-800 dark:to-purple-900"
      />

      {/* Tasa de conversión */}
      <MetricCard
        icon={TrendingUp}
        title="Conversión"
        value={`${tasaConversion.toFixed(1)}%`}
        subtitle={`${ventasConfirmadas}/${ventasConfirmadas + ventasPendientes}`}
        gradient="from-orange-100 to-orange-200 dark:from-orange-800 dark:to-orange-900"
      />

      {/* Progreso hacia meta */}
      <MetricCard
        icon={Calendar}
        title="Meta Mensual"
        value={`${progresoMeta.toFixed(0)}%`}
        subtitle={metaMensual > 0 ? `Meta: ${euro(metaMensual)}` : "Sin meta definida"}
        gradient="from-red-100 to-red-200 dark:from-red-800 dark:to-red-900"
      />
    </div>
  );
}

// Componente principal consolidado
export default function MetricsPanel({ 
  // Props para KPIs principales
  kpis = { comBruta: 0, comPagada: 0, margen: 0 },
  hayDatos = false,
  total = 0,
  ticketMedio = 0,
  facturacionTotal = 0,
  byEstado = [],
  crecimiento = null,
  
  // Props para métricas adicionales
  extraMetrics = {},
  showExtraMetrics = true
}) {
  return (
    <div className="space-y-6">
      {/* KPIs Principales */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="w-5 h-5 text-slate-600" />
          <h2 className="text-lg font-semibold text-slate-800 dark:text-gray-200">
            Métricas Principales
          </h2>
        </div>
        <MainKPIs 
          kpis={kpis}
          hayDatos={hayDatos}
          total={total}
          ticketMedio={ticketMedio}
          facturacionTotal={facturacionTotal}
          byEstado={byEstado}
          crecimiento={crecimiento}
        />
      </div>

      {/* Métricas Adicionales */}
      {showExtraMetrics && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Zap className="w-5 h-5 text-slate-600" />
            <h2 className="text-lg font-semibold text-slate-800 dark:text-gray-200">
              Métricas Adicionales
            </h2>
          </div>
          <ExtraMetrics {...extraMetrics} />
        </div>
      )}
    </div>
  );
}

// Exportar también los subcomponentes para uso individual si es necesario
export { MainKPIs, ExtraMetrics };