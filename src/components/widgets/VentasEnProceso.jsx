// src/components/widgets/VentasEnProceso.jsx
// Widget crítico para mostrar ventas que necesitan seguimiento
import React, { useMemo } from 'react';
import * as Tooltip from '@radix-ui/react-tooltip';
import { Clock, AlertCircle, CheckCircle, XCircle, Zap, Phone, Wrench, FileText } from 'lucide-react';

/* eslint-disable no-unused-vars */

function EstadoVenta({ estado, count, icon: Icon, color, bgColor, textColor, onClick }) {
  const tooltip = `${estado}\n${count} ventas en este estado.`;
  return (
    <Tooltip.Root delayDuration={200}>
      <Tooltip.Trigger asChild>
        <div 
          className={`${bgColor} border-l-4 ${color} p-4 rounded-r-lg cursor-pointer hover:shadow-md transition-all`}
          onClick={onClick}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Icon className={`w-5 h-5 ${textColor}`} />
              <div>
                <div className={`font-semibold ${textColor}`}>{estado}</div>
                <div className="text-sm text-slate-600">{count} ventas</div>
              </div>
            </div>
            <div className={`text-2xl font-bold ${textColor}`}>
              {count}
            </div>
          </div>
        </div>
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

export default function VentasEnProceso({ ventas, onNavigate }) {
  const estadosPorImportancia = useMemo(() => {
    // Filtrar solo ventas en proceso (no cerradas, canceladas o completadas)
    const estadosEnProceso = ['PENDIENTE', 'PENDIENTE VALIDAR', 'SCORING', 'INCIDENCIA', 'INSTALACION', 'TRAMITACION', 'CITADA', 'PDTE FIRMA'];
    const ventasEnProceso = ventas.filter(venta => 
      estadosEnProceso.includes(venta.estado)
    );
    
    // Agrupar ventas EN PROCESO por estado
    const grupos = {};
    
    ventasEnProceso.forEach(venta => {
      const estado = venta.estado || 'Borrador';
      if (!grupos[estado]) {
        grupos[estado] = [];
      }
      grupos[estado].push(venta);
    });

    // Definir estados críticos con iconos y colores
    const estadosConfig = {
      'INCIDENCIA': {
        icon: AlertCircle,
        color: 'border-red-500',
        bgColor: 'bg-red-50',
        textColor: 'text-red-700',
        prioridad: 1,
        descripcion: 'Requieren atención urgente'
      },
      'PENDIENTE VALIDAR': {
        icon: Clock,
        color: 'border-amber-500',
        bgColor: 'bg-amber-50',
        textColor: 'text-amber-700',
        prioridad: 2,
        descripcion: 'Esperando validación'
      },
      'SCORING': {
        icon: Zap,
        color: 'border-purple-500',
        bgColor: 'bg-purple-50',
        textColor: 'text-purple-700',
        prioridad: 3,
        descripcion: 'En evaluación crediticia'
      },
      'PENDIENTE INSTALACION': {
        icon: Wrench,
        color: 'border-blue-500',
        bgColor: 'bg-blue-50',
        textColor: 'text-blue-700',
        prioridad: 4,
        descripcion: 'Programar instalación'
      },
      'CITADA': {
        icon: Phone,
        color: 'border-cyan-500',
        bgColor: 'bg-cyan-50',
        textColor: 'text-cyan-700',
        prioridad: 5,
        descripcion: 'Cita programada'
      },
      'TRAMITACION': {
        icon: FileText,
        color: 'border-indigo-500',
        bgColor: 'bg-indigo-50',
        textColor: 'text-indigo-700',
        prioridad: 6,
        descripcion: 'En trámite administrativo'
      },
      'PENDIENTE': {
        icon: Clock,
        color: 'border-orange-500',
        bgColor: 'bg-orange-50',
        textColor: 'text-orange-700',
        prioridad: 7,
        descripcion: 'Pendiente seguimiento'
      }
    };

    return Object.entries(grupos)
      .filter(([estado, ventas]) => estadosConfig[estado] && ventas.length > 0)
      .map(([estado, ventas]) => ({
        estado,
        count: ventas.length,
        ...estadosConfig[estado],
        ventas
      }))
      .sort((a, b) => a.prioridad - b.prioridad);
  }, [ventas]);

  const totalEnProceso = estadosPorImportancia.reduce((acc, item) => acc + item.count, 0);

  // Estados positivos para mostrar progreso
  const estadosPositivos = useMemo(() => {
    const grupos = {};
    ventas.forEach(venta => {
      const estado = venta.estado || 'Borrador';
      if (!grupos[estado]) grupos[estado] = 0;
      grupos[estado]++;
    });

    return [
      {
        estado: 'Confirmadas',
        count: grupos['Confirmada'] || 0,
        icon: CheckCircle,
        color: 'text-green-600'
      },
      {
        estado: 'Cerradas',
        count: grupos['Cerrada'] || 0,
        icon: CheckCircle,
        color: 'text-blue-600'
      },
      {
        estado: 'Canceladas',
        count: grupos['CANCELADA'] || 0,
        icon: XCircle,
        color: 'text-red-600'
      }
    ];
  }, [ventas]);

  if (totalEnProceso === 0) {
    return (
      <div className="bg-green-50 border-2 border-green-200 rounded-2xl p-6">
        <div className="flex items-center gap-3 text-green-700">
          <CheckCircle className="w-6 h-6" />
          <div>
            <h3 className="text-lg font-semibold">¡Todo al día!</h3>
            <p className="text-sm">No hay ventas pendientes de seguimiento</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-6 border-2 border-slate-200 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-slate-600" />
          <h3 className="text-lg font-semibold text-slate-800">Ventas en Proceso</h3>
        </div>
        <div className="text-sm bg-amber-100 text-amber-700 px-3 py-1 rounded-full font-medium">
          {totalEnProceso} requieren seguimiento
        </div>
      </div>

      {/* Estados críticos */}
      <div className="space-y-3 mb-6">
        {estadosPorImportancia.map((item) => (
          <EstadoVenta
            key={item.estado}
            estado={item.estado}
            count={item.count}
            icon={item.icon}
            color={item.color}
            bgColor={item.bgColor}
            textColor={item.textColor}
            onClick={() => onNavigate && onNavigate('ventas', { 
              filtros: { estado: [item.estado] },
              titulo: `Ventas en estado: ${item.estado}`
            })}
          />
        ))}
      </div>

      {/* Resumen de estados positivos */}
      <div className="border-t border-slate-200 pt-4">
        <h4 className="text-sm font-medium text-slate-600 mb-3">Resumen General</h4>
        <div className="grid grid-cols-3 gap-4">
          {estadosPositivos.map((item) => (
            <div key={item.estado} className="text-center">
              <div className={`flex items-center justify-center gap-1 ${item.color}`}>
                <item.icon className="w-4 h-4" />
                <span className="font-bold text-lg">{item.count}</span>
              </div>
              <div className="text-xs text-slate-500">{item.estado}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Botón de acción rápida */}
      <div className="mt-4">
        <button
          onClick={() => onNavigate && onNavigate('ventas', { 
            filtros: { 
              estado: ['PENDIENTE', 'SCORING', 'TRAMITACION', 'INCIDENCIA', 'INSTALACION', 'CITADA', 'PDTE FIRMA'] 
            },
            titulo: 'Ventas en Proceso'
          })}
          className="w-full bg-gradient-to-r from-sky-500 to-sky-600 text-white rounded-lg py-3 font-medium hover:from-sky-600 hover:to-sky-700 transition-all"
        >
          Ver Todas las Ventas en Proceso →
        </button>
      </div>
    </div>
  );
}
