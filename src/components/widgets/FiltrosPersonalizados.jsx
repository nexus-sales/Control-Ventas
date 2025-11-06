// src/components/widgets/FiltrosPersonalizados.jsx
// Filtros específicos para el negocio del usuario
import React from 'react';
import * as Tooltip from '@radix-ui/react-tooltip';
import { Clock, AlertTriangle, CheckCircle, TrendingUp, Users, Calendar } from 'lucide-react';

/* eslint-disable no-unused-vars */

function FiltroRapido({ icon: Icon, titulo, descripcion, color, onClick, badge }) {
  const tooltip = `${titulo}\n${descripcion}${badge ? `\n${badge} coincidencias` : ''}`;
  return (
    <Tooltip.Root delayDuration={200}>
      <Tooltip.Trigger asChild>
        <button
          onClick={onClick}
          className={`relative w-full text-left p-4 rounded-xl border-2 transition-all hover:shadow-md hover:scale-105 ${color}`}
        >
          <div className="flex items-center gap-3">
            <Icon className="w-5 h-5" />
            <div className="flex-1">
              <div className="font-semibold text-sm">{titulo}</div>
              <div className="text-xs opacity-75">{descripcion}</div>
            </div>
            {badge && (
              <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                {badge}
              </div>
            )}
          </div>
        </button>
      </Tooltip.Trigger>
      <Tooltip.Portal>
        <Tooltip.Content side="top" align="center" className="z-50 px-3 py-2 rounded-lg bg-slate-900 text-white text-xs shadow-lg animate-fadeIn whitespace-pre-line" style={{ pointerEvents: 'auto' }}>
          {tooltip}
          <Tooltip.Arrow className="fill-slate-900" />
        </Tooltip.Content>
      </Tooltip.Portal>
    </Tooltip.Root>
  );
}

export default function FiltrosPersonalizados({ ventas, onNavigate }) {
  // Calcular estadísticas para badges
  const stats = {
    enProceso: ventas.filter(v => 
      ['PENDIENTE', 'PENDIENTE VALIDAR', 'SCORING', 'INCIDENCIA', 'INSTALACION'].includes(v.estado)
    ).length,
    
    incidencias: ventas.filter(v => v.estado === 'INCIDENCIA').length,
    
    sinPvp: ventas.filter(v => !v.pvp || v.pvp === 0).length,
    
    hoy: ventas.filter(v => {
      const hoy = new Date().toISOString().slice(0, 10);
      return v.fecha === hoy;
    }).length,
    
    semana: ventas.filter(v => {
      const hoy = new Date();
      const hace7dias = new Date();
      hace7dias.setDate(hoy.getDate() - 7);
      const fechaVenta = new Date(v.fecha);
      return fechaVenta >= hace7dias && fechaVenta <= hoy;
    }).length,
    
    cerradas: ventas.filter(v => v.estado === 'Cerrada').length
  };

  const filtrosRapidos = [
    {
      icon: AlertTriangle,
      titulo: "Incidencias",
      descripcion: "Ventas con problemas urgentes",
      color: "bg-red-50 border-red-200 text-red-800 hover:bg-red-100",
      badge: stats.incidencias > 0 ? stats.incidencias : null,
      action: () => onNavigate && onNavigate('ventas', { 
        filtros: { estado: ['INCIDENCIA'] },
        titulo: 'Ventas con Incidencias'
      })
    },
    {
      icon: Clock,
      titulo: "En Proceso",
      descripcion: "Ventas que necesitan seguimiento",
      color: "bg-amber-50 border-amber-200 text-amber-800 hover:bg-amber-100",
      badge: stats.enProceso > 0 ? stats.enProceso : null,
      action: () => onNavigate && onNavigate('ventas', { 
        filtros: { 
          estado: ['PENDIENTE', 'SCORING', 'TRAMITACION', 'INCIDENCIA', 'INSTALACION'] 
        },
        titulo: 'Ventas en Proceso'
      })
    },
    {
      icon: TrendingUp,
      titulo: "Sin Precio",
      descripcion: "Ventas sin PVP configurado",
      color: "bg-orange-50 border-orange-200 text-orange-800 hover:bg-orange-100",
      badge: stats.sinPvp > 0 ? stats.sinPvp : null,
      action: () => onNavigate && onNavigate('ventas', { 
        filtros: { sinPvp: true },
        titulo: 'Ventas sin PVP'
      })
    },
    {
      icon: Calendar,
      titulo: "Hoy",
      descripcion: "Ventas registradas hoy",
      color: "bg-blue-50 border-blue-200 text-blue-800 hover:bg-blue-100",
      badge: stats.hoy > 0 ? stats.hoy : null,
      action: () => onNavigate && onNavigate('ventas', { 
        filtros: { 
          fechaDesde: new Date().toISOString().split('T')[0],
          fechaHasta: new Date().toISOString().split('T')[0]
        },
        titulo: 'Ventas de Hoy'
      })
    },
    {
      icon: Users,
      titulo: "Esta Semana",
      descripcion: "Últimos 7 días de actividad",
      color: "bg-purple-50 border-purple-200 text-purple-800 hover:bg-purple-100",
      badge: stats.semana > 0 ? stats.semana : null,
      action: () => {
        const hace7dias = new Date();
        hace7dias.setDate(hace7dias.getDate() - 7);
        onNavigate && onNavigate('ventas', { 
          filtros: { 
            fechaDesde: hace7dias.toISOString().split('T')[0]
          },
          titulo: 'Ventas de Esta Semana'
        });
      }
    },
    {
      icon: CheckCircle,
      titulo: "Cerradas",
      descripcion: "Listas para liquidación",
      color: "bg-green-50 border-green-200 text-green-800 hover:bg-green-100",
      badge: stats.cerradas > 0 ? stats.cerradas : null,
      action: () => onNavigate && onNavigate('ventas', { 
        filtros: { estado: ['ACTIVO', 'ENVIADA'] },
        titulo: 'Ventas Cerradas'
      })
    }
  ];

  return (
    <div className="bg-white rounded-2xl p-6 border-2 border-slate-200 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <Clock className="w-5 h-5 text-slate-600" />
        <h3 className="text-lg font-semibold text-slate-800">Filtros Rápidos</h3>
        <div className="ml-auto text-xs text-slate-500">
          {ventas.length} ventas totales
        </div>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {filtrosRapidos.map((filtro, index) => (
          <FiltroRapido
            key={index}
            icon={filtro.icon}
            titulo={filtro.titulo}
            descripcion={filtro.descripcion}
            color={filtro.color}
            badge={filtro.badge}
            onClick={filtro.action}
          />
        ))}
      </div>
      
      {/* Resumen rápido */}
      <div className="mt-4 pt-4 border-t border-slate-200">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="text-xs">
            <div className="font-bold text-red-600 text-lg">{stats.incidencias}</div>
            <div className="text-slate-500">Urgentes</div>
          </div>
          <div className="text-xs">
            <div className="font-bold text-amber-600 text-lg">{stats.enProceso}</div>
            <div className="text-slate-500">En proceso</div>
          </div>
          <div className="text-xs">
            <div className="font-bold text-green-600 text-lg">{stats.cerradas}</div>
            <div className="text-slate-500">Listas</div>
          </div>
        </div>
      </div>
    </div>
  );
}
