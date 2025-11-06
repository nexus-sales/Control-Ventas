// src/components/widgets/QuickActions.jsx
// Widget de acciones rápidas para el dashboard
import React from 'react';
import * as Tooltip from '@radix-ui/react-tooltip';
import { Plus, Upload, Download, BarChart3, Users, Settings } from 'lucide-react';
import './QuickActions.css';

/* eslint-disable no-unused-vars */

function QuickActionButton({ icon: Icon, label, onClick, color = "bg-sky-500", description }) {
  return (
    <Tooltip.Root delayDuration={200}>
      <Tooltip.Trigger asChild>
        <button
          onClick={onClick}
          className={`quick-action-btn ${color} text-white`}
          aria-label={label}
        >
          <span className="quick-action-icon">
            <Icon className="w-10 h-10" />
          </span>
          <span className="quick-action-label">{label}</span>
          <span className="quick-action-desc">{description}</span>
        </button>
      </Tooltip.Trigger>
      <Tooltip.Portal>
        <Tooltip.Content side="top" align="center" className="z-50 px-3 py-2 rounded-lg bg-slate-900 text-white text-xs shadow-lg animate-fadeIn" style={{ pointerEvents: 'auto' }}>
          {description}
          <Tooltip.Arrow className="fill-slate-900" />
        </Tooltip.Content>
      </Tooltip.Portal>
    </Tooltip.Root>
  );
}

export default function QuickActions({ onNavigate }) {
  const actions = [
    {
      icon: Plus,
      label: "Nueva Venta",
      description: "Abrir formulario",
      color: "bg-emerald-500",
      action: () => onNavigate('ventas?modal=newVenta')
    },
    {
      icon: Upload,
      label: "Importar Excel",
      description: "Subir archivo",
      color: "bg-blue-500",
      action: () => onNavigate('importar')
    },
    {
      icon: BarChart3,
      label: "Ver Ventas",
      description: "Estados y proceso",
      color: "bg-sky-500",
      action: () => onNavigate('ventas')
    },
    {
      icon: Users,
      label: "Liquidaciones",
      description: "Comisiones mensual",
      color: "bg-purple-500",
      action: () => onNavigate('liquidaciones')
    },
    {
      icon: Settings,
      label: "Productos",
      description: "Gestionar catálogo",
      color: "bg-orange-500",
      action: () => onNavigate('config?section=productos')
    },
    {
      icon: Download,
      label: "Operadores",
      description: "Partners y reglas",
      color: "bg-indigo-500",
      action: () => onNavigate('config?section=operadores')
    }
  ];

  return (
    <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl p-6 border-2 border-slate-200">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-3 h-3 bg-emerald-400 rounded-full animate-pulse"></div>
        <h3 className="text-lg font-semibold text-slate-800">Acceso Rápido</h3>
      </div>
      
      <div className="quick-actions-grid">
        {actions.map((action, index) => (
          <QuickActionButton
            key={index}
            icon={action.icon}
            label={action.label}
            description={action.description}
            color={action.color}
            onClick={action.action}
          />
        ))}
      </div>
      
      {/* Estadística rápida */}
      <div className="mt-4 pt-4 border-t border-slate-200">
        <div className="flex items-center justify-between text-sm text-slate-600">
          <span>Última actualización:</span>
          <span className="font-medium">{new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
      </div>
    </div>
  );
}
