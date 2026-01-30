import React, { useMemo } from 'react';
import * as Tooltip from '@radix-ui/react-tooltip';
import {
  Plus, Upload, Download, BarChart3, Users, Settings,
  TrendingUp, TrendingDown, Euro, Target, Calendar, Award,
  AlertCircle, CheckCircle, Zap
} from 'lucide-react';
import { glassStyles, cardHoverStyles } from '../../utils/designUtils';

// ============================
// QUICK ACTIONS COMPONENT
// ============================

function QuickActionButton({ label, onClick, color = "from-sky-500 to-blue-600", description, icon: Icon }) {
  return (
    <Tooltip.Provider>
      <Tooltip.Root delayDuration={200}>
        <Tooltip.Trigger asChild>
          <button
            onClick={onClick}
            className={`
              ${glassStyles} ${cardHoverStyles} relative p-5 rounded-3xl overflow-hidden
              flex flex-col items-center justify-center gap-3 w-full group
            `}
          >
            <div className={`
              w-12 h-12 rounded-2xl bg-gradient-to-br ${color}
              flex items-center justify-center shadow-lg group-hover:rotate-6 transition-all duration-300
            `}>
              <Icon className="w-6 h-6 text-white" />
            </div>
            <span className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-widest">{label}</span>
            <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${color} opacity-0 group-hover:opacity-100 transition-opacity`} />
          </button>
        </Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Content
            side="bottom"
            align="center"
            className="z-50 px-4 py-2 rounded-xl bg-slate-900/90 backdrop-blur-md text-white text-xs font-bold shadow-2xl animate-in fade-in zoom-in-95"
          >
            {description}
            <Tooltip.Arrow className="fill-slate-900/90" />
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    </Tooltip.Provider>
  );
}

export function QuickActions({ onNewVenta, onImportExcel, onExportData, onViewAnalytics, onManageUsers, onOpenSettings }) {
  const actions = [
    { icon: Plus, label: "Nueva Venta", onClick: onNewVenta, color: "from-emerald-400 to-teal-600", description: "Expediente de venta inmediata" },
    { icon: Upload, label: "Importar", onClick: onImportExcel, color: "from-blue-400 to-indigo-600", description: "Carga masiva desde Excel/CSV" },
    { icon: Download, label: "Exportar", onClick: onExportData, color: "from-purple-400 to-fuchsia-600", description: "Descarga de registros consolidados" },
    { icon: BarChart3, label: "Reportes", onClick: onViewAnalytics, color: "from-amber-400 to-orange-600", description: "Panel de inteligencia de negocio" },
    { icon: Users, label: "Equipos", onClick: onManageUsers, color: "from-cyan-400 to-blue-500", description: "Gestión de red de colaboradores" },
    { icon: Settings, label: "Ajustes", onClick: onOpenSettings, color: "from-slate-400 to-slate-600", description: "Configuración global del sistema" }
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 mb-2 px-1">
        <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center">
          <Zap className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
        </div>
        <h3 className="font-black text-lg text-slate-800 dark:text-white uppercase tracking-tighter">Accesos Directos</h3>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-6">
        {actions.map((action, index) => (
          <QuickActionButton key={index} {...action} />
        ))}
      </div>
    </div>
  );
}

// ============================
// STAT CARD COMPONENT
// ============================

function StatCard({ title, value, subtitle, trend, color = "text-indigo-600", bgColor = "bg-indigo-50", icon: Icon }) {
  return (
    <div className={`${glassStyles} ${cardHoverStyles} p-6 rounded-3xl relative overflow-hidden group`}>
      <div className="flex items-start justify-between relative z-10">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl ${bgColor} dark:bg-slate-800 shadow-inner`}>
              <Icon className={`w-5 h-5 ${color}`} />
            </div>
            <h4 className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">{title}</h4>
          </div>
          <p className={`text-2xl font-black text-slate-800 dark:text-white`}>{value}</p>
          {subtitle && <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">{subtitle}</p>}
        </div>
        {trend && (
          <div className={`
            flex items-center gap-1 text-[10px] font-black px-2 py-1 rounded-full uppercase
            ${trend.type === 'up' ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950' :
              trend.type === 'down' ? 'text-rose-600 bg-rose-50 dark:bg-rose-950' : 'text-slate-600 bg-slate-100 dark:bg-slate-900'}
          `}>
            {trend.type === 'up' && <TrendingUp className="w-3 h-3" />}
            {trend.type === 'down' && <TrendingDown className="w-3 h-3" />}
            {trend.value}
          </div>
        )}
      </div>
      <div className={`absolute -right-4 -bottom-4 w-20 h-20 bg-gradient-to-br from-slate-200 to-slate-100 dark:from-slate-800 dark:to-slate-900 rounded-full opacity-20 group-hover:scale-150 transition-transform duration-700`} />
    </div>
  );
}

export function QuickStats({ stats = [] }) {
  const defaultStats = [
    { icon: Euro, title: "Facturación", value: "€0", subtitle: "Ejecución mensual", color: "text-emerald-500", bgColor: "bg-emerald-500/10" },
    { icon: Target, title: "Meta", value: "0%", subtitle: "Objetivo comercial", color: "text-blue-500", bgColor: "bg-blue-500/10" },
    { icon: Calendar, title: "Frecuencia", value: "0", subtitle: "Ventas por día", color: "text-purple-500", bgColor: "bg-purple-500/10" },
    { icon: Award, title: "TKT Medio", value: "€0", subtitle: "Valor portafolio", color: "text-amber-500", bgColor: "bg-amber-500/10" }
  ];

  const displayStats = stats.length > 0 ? stats : defaultStats;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {displayStats.map((stat, index) => (
        <StatCard key={index} {...stat} />
      ))}
    </div>
  );
}

// ============================
// SMART ALERTS COMPONENT
// ============================

function Alert({ type, title, message, action, priority = 'normal', icon: Icon }) {
  const styles = {
    error: 'bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-400',
    warning: 'bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400',
    info: 'bg-blue-500/10 border-blue-500/20 text-blue-600 dark:text-blue-400',
    success: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
  };

  const IconToUse = Icon || (type === 'error' ? AlertCircle : type === 'success' ? CheckCircle : Zap);

  return (
    <div className={`${glassStyles} border-l-4 ${styles[type]} p-5 rounded-3xl transition-all hover:translate-x-1`}>
      <div className="flex items-start gap-4">
        <div className={`p-2 rounded-xl bg-white dark:bg-slate-900 shadow-sm`}>
          <IconToUse className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-black uppercase tracking-tight mb-1">{title}</h4>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-3">{message}</p>
          {action && (
            <button
              onClick={action.onClick}
              className={`
                text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-xl shadow-lg
                ${type === 'error' ? 'bg-rose-500 text-white' :
                  type === 'warning' ? 'bg-amber-500 text-white' :
                    type === 'info' ? 'bg-blue-500 text-white' :
                      'bg-emerald-500 text-white'}
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

export function SmartAlerts({ alerts = [], maxVisible = 3 }) {
  const defaultAlerts = [
    { type: 'info', title: 'Infraestructura OK', message: 'Los servicios centrales de datos y sincronización están operando en latencia óptima.', priority: 'low' }
  ];

  const displayAlerts = alerts.length > 0 ? alerts.slice(0, maxVisible) : defaultAlerts;

  return (
    <div className="space-y-4">
      {displayAlerts.map((alert, index) => (
        <Alert key={index} {...alert} />
      ))}
    </div>
  );
}

export default { QuickActions, QuickStats, SmartAlerts };