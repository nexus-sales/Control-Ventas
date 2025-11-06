// src/components/widgets/SmartAlerts.jsx
// Sistema de alertas inteligentes para el dashboard
import React from 'react';
import * as Tooltip from '@radix-ui/react-tooltip';
import { AlertTriangle, CheckCircle, Clock, TrendingDown, Users, Euro, FileX } from 'lucide-react';

/* eslint-disable no-unused-vars */

function Alert({ type, icon: Icon, title, message, action, priority = 'normal' }) {
  const styles = {
    error: 'bg-red-50 border-red-200 text-red-800',
    warning: 'bg-amber-50 border-amber-200 text-amber-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800',
    success: 'bg-green-50 border-green-200 text-green-800'
  };

  const priorities = {
    high: 'border-l-4 border-l-red-500',
    normal: '',
    low: 'opacity-75'
  };

  const tooltip = `${title}\n${message}${priority === 'high' ? '\n¡Atención crítica!' : ''}`;
  return (
    <Tooltip.Root delayDuration={200}>
      <Tooltip.Trigger asChild>
        <div className={`border rounded-lg p-4 ${styles[type]} ${priorities[priority]} transition-all hover:shadow-md`}>
          <div className="flex items-start gap-3">
            <Icon className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-semibold text-sm">{title}</h4>
              <p className="text-sm mt-1 opacity-90">{message}</p>
              {action && (
                <button 
                  onClick={action.onClick}
                  className="mt-2 text-xs underline hover:no-underline font-medium"
                >
                  {action.label}
                </button>
              )}
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

export default function SmartAlerts({ ventas, colaboradores, productos, liquidaciones, onNavigate }) {
  const alerts = [];

  // 1. Ventas sin PVP (SOLO si hay ventas sin PVP)
  const ventasSinPvp = ventas.filter(v => !v.pvp || v.pvp === 0 || v._calc?.pvp_final <= 0);
  if (ventasSinPvp.length > 0) {
    alerts.push({
      type: 'warning',
      icon: Euro,
      title: `${ventasSinPvp.length} ventas sin precio`,
      message: 'Estas ventas no pueden calcular comisiones correctamente.',
      priority: 'high',
      action: {
        label: 'Revisar ventas →',
        onClick: () => onNavigate && onNavigate('ventas', { 
          filtros: { sinPvp: true },
          titulo: 'Ventas sin PVP definido'
        })
      }
    });
  }

  // 2. Ventas EN PROCESO que necesitan seguimiento
  const ventasEnProceso = ventas.filter(v => 
    ['PENDIENTE', 'PENDIENTE VALIDAR', 'SCORING', 'INCIDENCIA', 'INSTALACION', 'CITADA', 'TRAMITACION'].includes(v.estado)
  );

  if (ventasEnProceso.length > 0) {
    alerts.push({
      type: 'info',
      icon: Clock,
      title: `${ventasEnProceso.length} ventas en proceso`,
      message: 'Ventas que requieren seguimiento activo por estado.',
      priority: 'high',
      action: {
        label: 'Ver estados →',
        onClick: () => onNavigate && onNavigate('ventas', { 
          filtros: { 
            estado: ['PENDIENTE', 'SCORING', 'TRAMITACION', 'INCIDENCIA', 'INSTALACION'] 
          },
          titulo: 'Ventas en Proceso'
        })
      }
    });
  }

  // 2b. Ventas muy antiguas sin procesar (más crítico - 15 días)
  const ventasAntiguasPendientes = ventas.filter(v => {
    const fechaVenta = new Date(v.fecha);
    const hace15Dias = new Date();
    hace15Dias.setDate(hace15Dias.getDate() - 15);
    return fechaVenta < hace15Dias && v.estado === 'Borrador';
  });

  if (ventasAntiguasPendientes.length > 0) {
    alerts.push({
      type: 'warning',
      icon: Clock,
      title: `${ventasAntiguasPendientes.length} borradores antiguos (+15 días)`,
      message: 'Borradores que necesitan confirmarse o cancelarse.',
      priority: 'high',
      action: {
        label: 'Revisar borradores →',
        onClick: () => onNavigate && onNavigate('ventas', { 
          filtros: { 
            estado: ['BORRADOR'],
            fechaHasta: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
          },
          titulo: 'Borradores Antiguos'
        })
      }
    });
  }

  // 3. Colaboradores sin zona fiscal
  const colaboradoresSinZona = colaboradores.filter(c => !c.zona_id);
  if (colaboradoresSinZona.length > 0) {
    alerts.push({
      type: 'error',
      icon: Users,
      title: `${colaboradoresSinZona.length} colaboradores sin zona fiscal`,
      message: 'No se pueden calcular IRPF/impuestos correctamente.',
      priority: 'high',
      action: {
        label: 'Configurar zonas →',
        onClick: () => onNavigate('config', { section: 'colaboradores' })
      }
    });
  }

  // 4. Productos sin operador asignado
  const productosSinOperador = productos.filter(p => !p.operador_id);
  if (productosSinOperador.length > 0) {
    alerts.push({
      type: 'warning',
      icon: FileX,
      title: `${productosSinOperador.length} productos sin operador`,
      message: 'Productos que no pueden calcular comisiones automáticamente.',
      priority: 'normal',
      action: {
        label: 'Asignar operadores →',
        onClick: () => onNavigate('config', { section: 'productos' })
      }
    });
  }

  // 5. Liquidaciones pendientes del mes anterior
  const mesAnterior = new Date();
  mesAnterior.setMonth(mesAnterior.getMonth() - 1);
  const periodoAnterior = mesAnterior.toISOString().slice(0, 7);
  
  const liquidacionesPendientes = liquidaciones.filter(l => 
    l.periodo === periodoAnterior && l.estado === 'Generada'
  );

  if (liquidacionesPendientes.length > 0) {
    alerts.push({
      type: 'info',
      icon: TrendingDown,
      title: `${liquidacionesPendientes.length} liquidaciones del mes anterior pendientes`,
      message: `Periodo ${periodoAnterior} - Pueden necesitar aprobación o pago.`,
      priority: 'normal',
      action: {
        label: 'Ver liquidaciones →',
        onClick: () => onNavigate('liquidaciones')
      }
    });
  }

  // 6. Sistema funcionando correctamente
  if (alerts.length === 0) {
    alerts.push({
      type: 'success',
      icon: CheckCircle,
      title: 'Sistema funcionando correctamente',
      message: 'No hay problemas críticos detectados. ¡Todo está en orden!',
      priority: 'low'
    });
  }

  // Ordenar por prioridad
  const priorityOrder = { high: 0, normal: 1, low: 2 };
  alerts.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  return (
    <div className="bg-white rounded-2xl p-6 border-2 border-slate-200 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <AlertTriangle className="w-5 h-5 text-amber-500" />
        <h3 className="text-lg font-semibold text-slate-800">Alertas del Sistema</h3>
        <div className="ml-auto">
          <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-full">
            {alerts.filter(a => a.priority === 'high').length} críticas
          </span>
        </div>
      </div>
      
      <div className="space-y-3 max-h-80 overflow-y-auto">
        {alerts.map((alert, index) => (
          <Alert key={index} {...alert} />
        ))}
      </div>
      
      {/* Resumen de estado */}
      <div className="mt-4 pt-4 border-t border-slate-200">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-xs text-slate-500">Críticas</div>
            <div className="text-lg font-bold text-red-600">
              {alerts.filter(a => a.priority === 'high').length}
            </div>
          </div>
          <div>
            <div className="text-xs text-slate-500">Normales</div>
            <div className="text-lg font-bold text-amber-600">
              {alerts.filter(a => a.priority === 'normal').length}
            </div>
          </div>
          <div>
            <div className="text-xs text-slate-500">Info</div>
            <div className="text-lg font-bold text-green-600">
              {alerts.filter(a => a.priority === 'low').length}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
