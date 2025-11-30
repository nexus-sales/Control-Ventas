// src/components/widgets/DashboardWidgets.jsx
// Widgets consolidados para el dashboard: acciones rápidas, estadísticas y alertas inteligentes
import React, { useMemo } from 'react';
import * as Tooltip from '@radix-ui/react-tooltip';
import { 
  Plus, Upload, Download, BarChart3, Users, Settings,
  TrendingUp, TrendingDown, Euro, Target, Calendar, Zap, Award,
  AlertTriangle, CheckCircle, Clock, FileX
} from 'lucide-react';

// ============================
// QUICK ACTIONS COMPONENT
// ============================

function QuickActionButton({ label, onClick, color = "bg-sky-500", description }) {
  return (
    <Tooltip.Root delayDuration={200}>
      <Tooltip.Trigger asChild>
        <button
          onClick={onClick}
          className={`
            group relative p-4 rounded-xl ${color} hover:shadow-lg 
            transition-all duration-200 transform hover:scale-105
            text-white font-medium min-w-[120px] min-h-[80px]
            flex flex-col items-center justify-center gap-2
          `}
        >
          <Icon className="w-6 h-6 group-hover:scale-110 transition-transform" />
          <span className="text-sm font-medium">{label}</span>
          
          {/* Efecto de brillo en hover */}
          <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-20 bg-white transition-opacity" />
        </button>
      </Tooltip.Trigger>
      <Tooltip.Portal>
        <Tooltip.Content 
          side="bottom" 
          align="center"
          className="z-50 px-3 py-2 rounded-lg bg-slate-900 text-white text-sm shadow-lg animate-fadeIn max-w-xs"
        >
          {description || `${label}: Función rápida desde el dashboard`}
          <Tooltip.Arrow className="fill-slate-900" />
        </Tooltip.Content>
      </Tooltip.Portal>
    </Tooltip.Root>
  );
}

export function QuickActions({ onNewVenta, onImportExcel, onExportData, onViewAnalytics, onManageUsers, onOpenSettings }) {
  const actions = [
    {
      icon: Plus,
      label: "Nueva Venta",
      onClick: onNewVenta,
      color: "bg-emerald-500 hover:bg-emerald-600",
      description: "Registra una nueva venta rápidamente"
    },
    {
      icon: Upload,
      label: "Importar Excel",
      onClick: onImportExcel,
      color: "bg-blue-500 hover:bg-blue-600",
      description: "Importa ventas desde archivos Excel/CSV"
    },
    {
      icon: Download,
      label: "Exportar Datos",
      onClick: onExportData,
      color: "bg-purple-500 hover:bg-purple-600",
      description: "Exporta datos a Excel para análisis externo"
    },
    {
      icon: BarChart3,
      label: "Analíticas",
      onClick: onViewAnalytics,
      color: "bg-amber-500 hover:bg-amber-600",
      description: "Ver reportes y análisis detallados"
    },
    {
      icon: Users,
      label: "Colaboradores",
      onClick: onManageUsers,
      color: "bg-cyan-500 hover:bg-cyan-600",
      description: "Gestionar colaboradores y comisiones"
    },
    {
      icon: Settings,
      label: "Configuración",
      onClick: onOpenSettings,
      color: "bg-slate-500 hover:bg-slate-600",
      description: "Configurar la aplicación"
    }
  ];

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <div className="flex items-center gap-2 mb-4">
        <Zap className="w-5 h-5 text-amber-500" />
        <h3 className="font-semibold text-slate-900">Acciones Rápidas</h3>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {actions.map((action, index) => (
          <QuickActionButton key={index} {...action} />
        ))}
      </div>
    </div>
  );
}

// ============================
// QUICK STATS COMPONENT
// ============================

function StatCard({ title, value, subtitle, trend, color = "text-slate-600", bgColor = "bg-slate-50" }) {
  // Descripciones para tooltips según el título
  const tooltipDescriptions = {
    'Facturación': 'Suma total facturada este mes, incluyendo todas las ventas registradas.',
    'Progreso Meta': 'Porcentaje de avance respecto a la meta mensual de facturación.',
    'Ventas/día': 'Promedio de ventas diarias en el mes actual.',
    'Ticket Medio': 'Promedio de facturación por cada venta realizada este mes.',
    'Colaboradores Activos': 'Número de colaboradores que han realizado ventas este mes.',
    'Conversión': 'Porcentaje de leads que se convierten en ventas confirmadas.',
    'Comisiones': 'Total de comisiones generadas para colaboradores este mes.',
    'Nuevos Clientes': 'Clientes únicos que han realizado su primera compra este mes.'
  };

  const description = tooltipDescriptions[title] || `Estadística de ${title}`;

  return (
    <Tooltip.Root delayDuration={200}>
      <Tooltip.Trigger asChild>
        <div className={`
          group cursor-help p-4 rounded-lg ${bgColor} hover:shadow-md 
          transition-all duration-200 border border-slate-200 hover:border-slate-300
        `}>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Icon className={`w-4 h-4 ${color}`} />
                <h4 className="font-medium text-slate-700 text-sm">{title}</h4>
              </div>
              <div className="space-y-1">
                <p className={`text-2xl font-bold ${color}`}>{value}</p>
                {subtitle && (
                  <p className="text-xs text-slate-500">{subtitle}</p>
                )}
              </div>
            </div>
            {trend && (
              <div className={`
                flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full
                ${trend.type === 'up' ? 'text-emerald-700 bg-emerald-100' : 
                  trend.type === 'down' ? 'text-red-700 bg-red-100' : 'text-slate-700 bg-slate-100'}
              `}>
                {trend.type === 'up' && <TrendingUp className="w-3 h-3" />}
                {trend.type === 'down' && <TrendingDown className="w-3 h-3" />}
                {trend.value}
              </div>
            )}
          </div>
        </div>
      </Tooltip.Trigger>
      <Tooltip.Portal>
        <Tooltip.Content 
          side="bottom" 
          align="center"
          className="z-50 px-3 py-2 rounded-lg bg-slate-900 text-white text-sm shadow-lg animate-fadeIn max-w-xs"
        >
          {description}
          <Tooltip.Arrow className="fill-slate-900" />
        </Tooltip.Content>
      </Tooltip.Portal>
    </Tooltip.Root>
  );
}

export function QuickStats({ stats = [] }) {
  const defaultStats = [
    {
      icon: Euro,
      title: "Facturación",
      value: "€0",
      subtitle: "Este mes",
      color: "text-emerald-600",
      bgColor: "bg-emerald-50"
    },
    {
      icon: Target,
      title: "Progreso Meta",
      value: "0%",
      subtitle: "Del objetivo mensual",
      color: "text-blue-600",
      bgColor: "bg-blue-50"
    },
    {
      icon: Calendar,
      title: "Ventas/día",
      value: "0",
      subtitle: "Promedio mensual",
      color: "text-purple-600",
      bgColor: "bg-purple-50"
    },
    {
      icon: Award,
      title: "Ticket Medio",
      value: "€0",
      subtitle: "Por venta",
      color: "text-amber-600",
      bgColor: "bg-amber-50"
    }
  ];

  const displayStats = stats.length > 0 ? stats : defaultStats;

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <div className="flex items-center gap-2 mb-4">
        <BarChart3 className="w-5 h-5 text-blue-500" />
        <h3 className="font-semibold text-slate-900">Estadísticas Rápidas</h3>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {displayStats.map((stat, index) => (
          <StatCard key={index} {...stat} />
        ))}
      </div>
    </div>
  );
}

// ============================
// SMART ALERTS COMPONENT
// ============================

function Alert({ type, title, message, action, priority = 'normal' }) {
  const styles = {
    error: 'bg-red-50 border-red-200 text-red-800',
    warning: 'bg-amber-50 border-amber-200 text-amber-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800',
    success: 'bg-green-50 border-green-200 text-green-800'
  };

  const priorityStyles = {
    high: 'ring-2 ring-red-200 shadow-md',
    normal: '',
    low: 'opacity-80'
  };

  return (
    <div className={`
      border rounded-lg p-4 ${styles[type]} ${priorityStyles[priority]}
      transition-all duration-200 hover:shadow-sm
    `}>
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          <Icon className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-sm mb-1">{title}</h4>
          <p className="text-sm opacity-90 mb-3">{message}</p>
          {action && (
            <button
              onClick={action.onClick}
              className={`
                text-xs font-medium px-3 py-1 rounded-md transition-colors
                ${type === 'error' ? 'bg-red-200 hover:bg-red-300 text-red-900' :
                  type === 'warning' ? 'bg-amber-200 hover:bg-amber-300 text-amber-900' :
                  type === 'info' ? 'bg-blue-200 hover:bg-blue-300 text-blue-900' :
                  'bg-green-200 hover:bg-green-300 text-green-900'}
              `}
            >
              {action.label}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export function SmartAlerts({ alerts = [], maxVisible = 5 }) {
  // Alertas por defecto si no se proporcionan
  const defaultAlerts = [
    {
      type: 'info',
      icon: CheckCircle,
      title: 'Sistema funcionando correctamente',
      message: 'Todas las funciones principales están operativas.',
      priority: 'low'
    }
  ];

  const displayAlerts = alerts.length > 0 ? alerts.slice(0, maxVisible) : defaultAlerts;

  // Generar alertas inteligentes basadas en datos (esta lógica se puede expandir)
    const generateSmartAlerts = useMemo(() => displayAlerts, [displayAlerts]);

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-amber-500" />
          <h3 className="font-semibold text-slate-900">Alertas Inteligentes</h3>
        </div>
        {alerts.length > maxVisible && (
          <span className="text-xs text-slate-500">
            +{alerts.length - maxVisible} más
          </span>
        )}
      </div>
      <div className="space-y-3">
        {generateSmartAlerts.map((alert, index) => (
          <Alert key={index} {...alert} />
        ))}
      </div>
    </div>
  );
}

// ============================
// EXPORTACIONES CONSOLIDADAS
// ============================

export default {
  QuickActions,
  QuickStats,
  SmartAlerts
};