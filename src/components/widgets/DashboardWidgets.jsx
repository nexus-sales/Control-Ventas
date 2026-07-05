import React from 'react';
import * as Tooltip from '@radix-ui/react-tooltip';
import { motion } from 'framer-motion';
import {
  Plus, Upload, Download, Users, Settings,
  TrendingUp, TrendingDown, Euro, Target, Calendar, Award,
  AlertCircle, CheckCircle, Zap
} from 'lucide-react';
import { glassStyles, cardHoverStyles } from '../../utils/designUtils';

// ============================
// QUICK ACTIONS COMPONENT
// ============================

import { BorderBeam } from '../ui/BorderBeam';
import { cn } from '../../lib/utils';

function QuickActionButton({ label, onClick, color = "from-sky-500 to-blue-600", description, icon: Icon, delay = 0 }) {
  return (
    <Tooltip.Provider>
      <Tooltip.Root delayDuration={200}>
        <Tooltip.Trigger asChild>
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay }}
            whileHover={{ y: -8, scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onClick}
            className={cn(
              glassStyles(),
              cardHoverStyles(),
              "relative p-6 rounded-[2rem] overflow-hidden flex flex-col items-center justify-center gap-4 w-full group border border-white/20 dark:border-slate-800/50 shadow-2xl"
            )}
          >
            <BorderBeam
              size={100}
              duration={8}
              delay={delay * 2}
              colorFrom={color === 'brand' ? 'var(--brand-primary)' : color.split(' ')[0].replace('from-', '#')}
              colorTo={color === 'brand' ? 'var(--brand-primary)' : color.split(' ')[1].replace('to-', '#')}
            />

            <div className={cn(
              "w-14 h-14 rounded-2xl bg-gradient-to-br transition-all duration-500 shadow-lg group-hover:rotate-[15deg] group-hover:scale-110 flex items-center justify-center",
              color === 'brand' ? "from-[var(--brand-primary)] to-[var(--brand-primary)]" : color
            )}>
              <Icon className="w-7 h-7 text-white" />
            </div>

            <div className="text-center relative z-10">
              <span className="text-[10px] font-black text-slate-800 dark:text-white uppercase tracking-[2px]">{label}</span>
            </div>

            {/* Glossy Overlay */}
            <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className={cn("absolute bottom-0 left-0 right-0 h-1.5 bg-gradient-to-r opacity-30 group-hover:opacity-100 transition-opacity", color)} />
          </motion.button>
        </Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Content
            side="top"
            align="center"
            className="z-50 px-4 py-2 rounded-xl bg-slate-900/95 backdrop-blur-md text-white text-[10px] font-bold shadow-2xl animate-in fade-in zoom-in-95 pointer-events-none border border-white/10"
          >
            {description}
            <Tooltip.Arrow className="fill-slate-900/95" />
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    </Tooltip.Provider>
  );
}

export function QuickActions({ onNewVenta, onImportExcel, onExportData, onManageUsers, onOpenSettings }) {
  // "Reportes" (antes aquí) navegaba a /dashboard estando ya en /dashboard —
  // no existe una vista de analíticas distinta a este propio panel, así que se elimina
  // en vez de arreglar el destino.
  const actions = [
    { icon: Plus, label: "Nueva Venta", onClick: onNewVenta, color: "brand", description: "Expediente de venta inmediata" },
    { icon: Upload, label: "Importar", onClick: onImportExcel, color: "from-blue-400 to-indigo-600", description: "Carga masiva desde Excel/CSV" },
    { icon: Download, label: "Exportar", onClick: onExportData, color: "from-purple-400 to-fuchsia-600", description: "Descarga de registros consolidados" },
    { icon: Users, label: "Equipos", onClick: onManageUsers, color: "from-cyan-400 to-blue-500", description: "Gestión de red de colaboradores" },
    { icon: Settings, label: "Ajustes", onClick: onOpenSettings, color: "from-slate-400 to-slate-600", description: "Configuración global del sistema" }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-2 px-1">
        <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center shadow-inner">
          <Zap className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
        </div>
        <div>
          <h3 className="font-black text-xl text-slate-800 dark:text-white uppercase tracking-tighter leading-none">Accesos de Élite</h3>
          <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest mt-1">Operaciones de alta velocidad</p>
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6">
        {actions.map((action, index) => (
          <QuickActionButton key={index} {...action} delay={0.1 * index} />
        ))}
      </div>
    </div>
  );
}

// ============================
// STAT CARD COMPONENT
// ============================

function StatCard({ title, value, subtitle, trend, color = "text-indigo-600", bgColor = "bg-indigo-50", icon: Icon, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, delay }}
      whileHover={{ y: -5, rotate: 0.5 }}
      className={cn(
        glassStyles(),
        cardHoverStyles(),
        "p-6 rounded-3xl relative overflow-hidden group shadow-sm hover:shadow-2xl transition-all duration-300 border border-white/20 dark:border-slate-800/50"
      )}
    >
      <div className="flex items-start justify-between relative z-10">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className={cn(
              "p-2.5 rounded-xl shadow-inner transition-transform group-hover:scale-110",
              color === 'brand' ? "bg-[var(--brand-primary)]/10" : bgColor,
              "dark:bg-slate-800"
            )}>
              <Icon className={cn(
                "w-5 h-5",
                color === 'brand' ? "text-[var(--brand-primary)]" : color
              )} />
            </div>
            <h4 className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[2px]">{title}</h4>
          </div>
          <div>
            <p className="text-3xl font-black text-slate-800 dark:text-white tracking-tighter leading-none mb-1">{value}</p>
            {subtitle && <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">{subtitle}</p>}
          </div>
        </div>
        {trend && (
          <div className={cn(
            "flex items-center gap-1.5 text-[10px] font-black px-2.5 py-1.5 rounded-xl uppercase shadow-sm",
            trend.type === 'up' ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/50' :
              trend.type === 'down' ? 'text-rose-600 bg-rose-50 dark:bg-rose-950/40 border border-rose-200/50' :
                'text-slate-600 bg-slate-100 dark:bg-slate-900 border border-slate-200/50'
          )}>
            {trend.type === 'up' && <TrendingUp className="w-3.5 h-3.5" />}
            {trend.type === 'down' && <TrendingDown className="w-3.5 h-3.5" />}
            {trend.value}
          </div>
        )}
      </div>
      {/* Decorative Gradient Blob */}
      <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-gradient-to-br from-slate-200 to-transparent dark:from-slate-700 dark:to-transparent rounded-full opacity-10 blur-2xl group-hover:scale-150 transition-transform duration-1000" />
    </motion.div>
  );
}

export function QuickStats({ stats = [] }) {
  const defaultStats = [
    { icon: Euro, title: "Facturación", value: "€0", subtitle: "Ejecución mensual", color: "brand", bgColor: "bg-emerald-500/10" },
    { icon: Target, title: "Meta", value: "0%", subtitle: "Objetivo comercial", color: "from-blue-500 to-indigo-600", bgColor: "bg-blue-500/10" },
    { icon: Calendar, title: "Frecuencia", value: "0", subtitle: "Ventas por día", color: "brand", bgColor: "bg-purple-500/10" },
    { icon: Award, title: "TKT Medio", value: "€0", subtitle: "Valor portafolio", color: "from-amber-500 to-orange-600", bgColor: "bg-amber-500/10" }
  ];

  const displayStats = stats.length > 0 ? stats : defaultStats;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {displayStats.map((stat, index) => (
        <StatCard key={index} {...stat} delay={0.1 * index} />
      ))}
    </div>
  );
}

// ============================
// SMART ALERTS COMPONENT
// ============================

function Alert({ type, title, message, action, priority: _priority = 'normal', icon: Icon }) {
  const styles = {
    error: 'bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-400',
    warning: 'bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400',
    info: 'bg-blue-500/10 border-blue-500/20 text-blue-600 dark:text-blue-400',
    success: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
  };

  const IconToUse = Icon || (type === 'error' ? AlertCircle : type === 'success' ? CheckCircle : Zap);

  return (
    <div className={`${glassStyles()} border-l-4 ${styles[type]} p-5 rounded-3xl transition-all hover:translate-x-1`}>
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