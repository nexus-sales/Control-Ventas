// src/components/widgets/AnalysisWidgets.jsx
// CONSOLIDADO COMPLETO: VentasEnProceso + AnalisisRendimiento + FiltrosPersonalizados + SmartFilters
import React, { useMemo, useState } from 'react';
import * as Tooltip from '@radix-ui/react-tooltip';
import { 
  Clock, AlertTriangle, CheckCircle, TrendingUp, Users, Calendar, Star, Filter,
  AlertCircle, XCircle, Zap, Phone, Wrench, FileText, Building, Package, 
  Award, Target, BarChart3, TrendingDown, X, Save
} from 'lucide-react';

// ==========================================
// VENTAS EN PROCESO WIDGET
// ==========================================

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
            <div className={`text-2xl font-bold ${textColor}`}>{count}</div>
          </div>
        </div>
      </Tooltip.Trigger>
      <Tooltip.Portal>
        <Tooltip.Content side="top" align="center" className="z-50 px-3 py-2 rounded-lg bg-slate-900 text-white text-xs shadow-lg animate-fadeIn whitespace-pre-line">
          {tooltip}
          <Tooltip.Arrow className="fill-slate-900" />
        </Tooltip.Content>
      </Tooltip.Portal>
    </Tooltip.Root>
  );
}

function VentasEnProceso({ ventas, onNavigate }) {
  const estadosPorImportancia = useMemo(() => {
    const estadosEnProceso = ['PENDIENTE', 'PENDIENTE VALIDAR', 'SCORING', 'INCIDENCIA', 'INSTALACION', 'TRAMITACION', 'CITADA', 'PDTE FIRMA'];
    const ventasEnProceso = ventas.filter(venta => estadosEnProceso.includes(venta.estado));
    
    const grupos = {};
    ventasEnProceso.forEach(venta => {
      const estado = venta.estado || 'Borrador';
      if (!grupos[estado]) grupos[estado] = [];
      grupos[estado].push(venta);
    });

    const estadosConfig = {
      'INCIDENCIA': { icon: AlertCircle, color: 'border-red-500', bgColor: 'bg-red-50', textColor: 'text-red-700', prioridad: 1 },
      'PENDIENTE VALIDAR': { icon: Clock, color: 'border-amber-500', bgColor: 'bg-amber-50', textColor: 'text-amber-700', prioridad: 2 },
      'SCORING': { icon: Zap, color: 'border-purple-500', bgColor: 'bg-purple-50', textColor: 'text-purple-700', prioridad: 3 },
      'PENDIENTE INSTALACION': { icon: Wrench, color: 'border-blue-500', bgColor: 'bg-blue-50', textColor: 'text-blue-700', prioridad: 4 },
      'CITADA': { icon: Phone, color: 'border-cyan-500', bgColor: 'bg-cyan-50', textColor: 'text-cyan-700', prioridad: 5 },
      'TRAMITACION': { icon: FileText, color: 'border-indigo-500', bgColor: 'bg-indigo-50', textColor: 'text-indigo-700', prioridad: 6 },
      'PENDIENTE': { icon: Clock, color: 'border-orange-500', bgColor: 'bg-orange-50', textColor: 'text-orange-700', prioridad: 7 }
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

  const estadosPositivos = useMemo(() => {
    const grupos = {};
    ventas.forEach(venta => {
      const estado = venta.estado || 'Borrador';
      if (!grupos[estado]) grupos[estado] = 0;
      grupos[estado]++;
    });

    return [
      { estado: 'Confirmadas', count: grupos['Confirmada'] || 0, icon: CheckCircle, color: 'text-green-600' },
      { estado: 'Cerradas', count: grupos['Cerrada'] || 0, icon: CheckCircle, color: 'text-blue-600' },
      { estado: 'Canceladas', count: grupos['CANCELADA'] || 0, icon: XCircle, color: 'text-red-600' }
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

      <div className="mt-4">
        <button
          onClick={() => onNavigate && onNavigate('ventas', { 
            filtros: { estado: ['PENDIENTE', 'SCORING', 'TRAMITACION', 'INCIDENCIA', 'INSTALACION', 'CITADA', 'PDTE FIRMA'] },
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

// ==========================================
// ANÁLISIS DE RENDIMIENTO WIDGET
// ==========================================

function ItemRendimiento({ nombre, ventas, facturacion, tasa_exito, tendencia, tipo, onClick }) {
  const Icon = tipo === 'operador' ? Building : Package;
  const tooltip = tipo === 'operador'
    ? `Operador: ${nombre}\nVentas: ${ventas}\nFacturación: €${facturacion.toLocaleString()}\nTasa de éxito: ${tasa_exito.toFixed(0)}%\nTendencia respecto al mes anterior.`
    : `Producto: ${nombre}\nVentas: ${ventas}\nFacturación: €${facturacion.toLocaleString()}\nTasa de éxito: ${tasa_exito.toFixed(0)}%\nTendencia respecto al mes anterior.`;
  
  return (
    <Tooltip.Root delayDuration={200}>
      <Tooltip.Trigger asChild>
        <div className="bg-slate-50 rounded-lg p-4 hover:bg-slate-100 cursor-pointer transition-all hover:shadow-md" onClick={onClick}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Icon className="w-4 h-4 text-slate-600" />
              <span className="font-medium text-slate-800 text-sm truncate">{nombre}</span>
            </div>
            {tendencia !== undefined && (
              <div className={`flex items-center gap-1 text-xs ${tendencia >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {tendencia >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {Math.abs(tendencia).toFixed(0)}%
              </div>
            )}
          </div>
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div>
              <div className="text-slate-500">Ventas</div>
              <div className="font-bold text-slate-800">{ventas}</div>
            </div>
            <div>
              <div className="text-slate-500">Facturación</div>
              <div className="font-bold text-slate-800">€{facturacion.toLocaleString()}</div>
            </div>
            <div>
              <div className="text-slate-500">Éxito</div>
              <div className={`font-bold ${tasa_exito >= 70 ? 'text-green-600' : tasa_exito >= 50 ? 'text-amber-600' : 'text-red-600'}`}>
                {tasa_exito.toFixed(0)}%
              </div>
            </div>
          </div>
        </div>
      </Tooltip.Trigger>
      <Tooltip.Portal>
        <Tooltip.Content side="top" align="center" className="z-50 px-3 py-2 rounded-lg bg-slate-900 text-white text-xs shadow-lg animate-fadeIn whitespace-pre-line">
          {tooltip}
          <Tooltip.Arrow className="fill-slate-900" />
        </Tooltip.Content>
      </Tooltip.Portal>
    </Tooltip.Root>
  );
}

function detectarSector(nombre) {
  if (!nombre) return 'otros';
  const nombreLower = nombre.toLowerCase();
  
  if (nombreLower.includes('fibra') || nombreLower.includes('movil') || nombreLower.includes('telefon') ||
      nombreLower.includes('orange') || nombreLower.includes('movistar') || nombreLower.includes('vodafone')) {
    return 'telefonia';
  }
  
  if (nombreLower.includes('alarma') || nombreLower.includes('seguridad') || nombreLower.includes('securitas')) {
    return 'seguridad';
  }
  
  if (nombreLower.includes('luz') || nombreLower.includes('gas') || nombreLower.includes('energia') ||
      nombreLower.includes('electric') || nombreLower.includes('endesa') || nombreLower.includes('iberdrola')) {
    return 'energia';
  }
  
  return 'otros';
}

function AnalisisRendimiento({ ventas, productos, operadores, onNavigate }) {
  const analisis = useMemo(() => {
    const ahora = new Date();
    const mesActual = ahora.toISOString().slice(0, 7);
    const mesAnterior = new Date(ahora.getFullYear(), ahora.getMonth() - 1, 1).toISOString().slice(0, 7);
    
    // Análisis por operador
    const operadoresMap = new Map();
    const operadoresMapAnterior = new Map();
    
    ventas.forEach(venta => {
      const operador = operadores.find(o => o.id === venta.operador_id);
      if (!operador) return;
      
      const esMesActual = venta.fecha?.slice(0, 7) === mesActual;
      const esMesAnterior = venta.fecha?.slice(0, 7) === mesAnterior;
      
      if (esMesActual) {
        if (!operadoresMap.has(operador.id)) {
          operadoresMap.set(operador.id, {
            nombre: operador.nombre,
            ventas: 0,
            facturacion: 0,
            exitosas: 0
          });
        }
        
        const data = operadoresMap.get(operador.id);
        data.ventas++;
        data.facturacion += Number(venta._calc?.pvp_final || venta.pvp || 0);
        if (['ACTIVO', 'INSTALACION', 'ENVIADA', 'OFERTA FIRMADA'].includes(venta.estado)) {
          data.exitosas++;
        }
      }
      
      if (esMesAnterior) {
        if (!operadoresMapAnterior.has(operador.id)) {
          operadoresMapAnterior.set(operador.id, { ventas: 0, facturacion: 0 });
        }
        const data = operadoresMapAnterior.get(operador.id);
        data.ventas++;
        data.facturacion += Number(venta.pvp) || 0;
      }
    });
    
    // Análisis por producto
    const productosMap = new Map();
    const productosMapAnterior = new Map();
    
    ventas.forEach(venta => {
      const producto = productos.find(p => p.id === venta.producto_id);
      if (!producto) return;
      
      const esMesActual = venta.fecha?.slice(0, 7) === mesActual;
      const esMesAnterior = venta.fecha?.slice(0, 7) === mesAnterior;
      
      if (esMesActual) {
        if (!productosMap.has(producto.id)) {
          productosMap.set(producto.id, {
            nombre: producto.nombre,
            ventas: 0,
            facturacion: 0,
            exitosas: 0
          });
        }
        
        const data = productosMap.get(producto.id);
        data.ventas++;
        data.facturacion += Number(venta._calc?.pvp_final || venta.pvp || 0);
        if (['ACTIVO', 'INSTALACION', 'ENVIADA', 'OFERTA FIRMADA'].includes(venta.estado)) {
          data.exitosas++;
        }
      }
      
      if (esMesAnterior) {
        if (!productosMapAnterior.has(producto.id)) {
          productosMapAnterior.set(producto.id, { ventas: 0, facturacion: 0 });
        }
        const data = productosMapAnterior.get(producto.id);
        data.ventas++;
        data.facturacion += Number(venta.pvp) || 0;
      }
    });
    
    // Calcular tendencias y tasa de éxito
    const calcularTendencia = (actual, anterior) => {
      if (!anterior || anterior === 0) return 0;
      return ((actual - anterior) / anterior) * 100;
    };
    
    const topOperadores = Array.from(operadoresMap.entries())
      .map(([id, data]) => {
        const anterior = operadoresMapAnterior.get(id)?.facturacion || 0;
        return {
          id,
          ...data,
          tasa_exito: data.ventas > 0 ? (data.exitosas / data.ventas) * 100 : 0,
          tendencia: calcularTendencia(data.facturacion, anterior)
        };
      })
      .sort((a, b) => b.facturacion - a.facturacion)
      .slice(0, 5);
    
    const topProductos = Array.from(productosMap.entries())
      .map(([id, data]) => {
        const anterior = productosMapAnterior.get(id)?.facturacion || 0;
        return {
          id,
          ...data,
          tasa_exito: data.ventas > 0 ? (data.exitosas / data.ventas) * 100 : 0,
          tendencia: calcularTendencia(data.facturacion, anterior)
        };
      })
      .sort((a, b) => b.facturacion - a.facturacion)
      .slice(0, 5);
    
    // Análisis por sectores
    const sectoresMap = new Map();
    ventas.forEach(venta => {
      const producto = productos.find(p => p.id === venta.producto_id);
      const operador = operadores.find(o => o.id === venta.operador_id);
      
      const sectorProducto = detectarSector(producto?.nombre);
      const sectorOperador = detectarSector(operador?.nombre);
      const sector = sectorProducto !== 'otros' ? sectorProducto : sectorOperador;
      
      if (!sectoresMap.has(sector)) {
        sectoresMap.set(sector, {
          nombre: sector.charAt(0).toUpperCase() + sector.slice(1),
          ventas: 0,
          facturacion: 0,
          exitosas: 0
        });
      }
      
      const data = sectoresMap.get(sector);
      data.ventas++;
      data.facturacion += Number(venta._calc?.pvp_final || venta.pvp || 0);
      if (['ACTIVO', 'INSTALACION', 'ENVIADA', 'OFERTA FIRMADA'].includes(venta.estado)) {
        data.exitosas++;
      }
    });
    
    const sectoresOrdenados = Array.from(sectoresMap.values())
      .map(item => ({
        ...item,
        tasa_exito: item.ventas > 0 ? (item.exitosas / item.ventas) * 100 : 0
      }))
      .sort((a, b) => b.facturacion - a.facturacion);
    
    return { topOperadores, topProductos, sectores: sectoresOrdenados };
  }, [ventas, productos, operadores]);

  const { topOperadores, topProductos } = analisis;

  if (topOperadores.length === 0 && topProductos.length === 0) {
    return (
      <div className="bg-slate-50 border-2 border-slate-200 rounded-2xl p-6">
        <div className="text-center text-slate-500">
          <BarChart3 className="w-8 h-8 mx-auto mb-2" />
          <p>No hay datos suficientes para mostrar análisis de rendimiento</p>
          <p className="text-sm">Registra más ventas para ver estadísticas</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Operadores */}
      {topOperadores.length > 0 && (
        <div className="bg-white rounded-2xl p-6 border-2 border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Building className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-semibold text-slate-800">Top Operadores</h3>
            </div>
            <div className="text-xs text-slate-500">Este mes</div>
          </div>
          
          <div className="space-y-3">
            {topOperadores.map((operador) => (
              <ItemRendimiento
                key={operador.id}
                nombre={operador.nombre}
                ventas={operador.ventas}
                facturacion={operador.facturacion}
                tasa_exito={operador.tasa_exito}
                tendencia={operador.tendencia}
                tipo="operador"
                onClick={() => onNavigate && onNavigate('ventas', {
                  filtros: { operador: operador.nombre },
                  titulo: `Ventas de ${operador.nombre}`
                })}
              />
            ))}
          </div>
        </div>
      )}

      {/* Top Productos */}
      {topProductos.length > 0 && (
        <div className="bg-white rounded-2xl p-6 border-2 border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Package className="w-5 h-5 text-green-600" />
              <h3 className="text-lg font-semibold text-slate-800">Top Productos</h3>
            </div>
            <div className="text-xs text-slate-500">Este mes</div>
          </div>
          
          <div className="space-y-3">
            {topProductos.map((producto) => (
              <ItemRendimiento
                key={producto.id}
                nombre={producto.nombre}
                ventas={producto.ventas}
                facturacion={producto.facturacion}
                tasa_exito={producto.tasa_exito}
                tendencia={producto.tendencia}
                tipo="producto"
                onClick={() => onNavigate && onNavigate('ventas', {
                  filtros: { producto: producto.nombre },
                  titulo: `Ventas de ${producto.nombre}`
                })}
              />
            ))}
          </div>
        </div>
      )}

      {/* Insights rápidos */}
      <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-6 border-2 border-purple-200">
        <div className="flex items-center gap-2 mb-4">
          <Award className="w-5 h-5 text-purple-600" />
          <h3 className="text-lg font-semibold text-slate-800">Insights del Negocio</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {topOperadores.length > 0 && (
            <div className="bg-white rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-4 h-4 text-blue-600" />
                <span className="font-medium text-sm">Mejor Operador</span>
              </div>
              <div className="text-lg font-bold text-slate-800">{topOperadores[0].nombre}</div>
              <div className="text-sm text-slate-600">
                {topOperadores[0].tasa_exito.toFixed(0)}% tasa de éxito
              </div>
            </div>
          )}
          
          {topProductos.length > 0 && (
            <div className="bg-white rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-4 h-4 text-green-600" />
                <span className="font-medium text-sm">Mejor Producto</span>
              </div>
              <div className="text-lg font-bold text-slate-800">{topProductos[0].nombre}</div>
              <div className="text-sm text-slate-600">
                €{topProductos[0].facturacion.toLocaleString()} facturado
              </div>
            </div>
          )}

          {analisis.sectores && analisis.sectores.length > 0 && (
            <div className="bg-white rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Award className="w-4 h-4 text-purple-600" />
                <span className="font-medium text-sm">Mejor Sector</span>
              </div>
              <div className="text-lg font-bold text-slate-800">{analisis.sectores[0].nombre}</div>
              <div className="text-sm text-slate-600">
                {analisis.sectores[0].ventas} ventas este mes
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ==========================================
// FILTROS PERSONALIZADOS WIDGET
// ==========================================

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
        <Tooltip.Content side="top" align="center" className="z-50 px-3 py-2 rounded-lg bg-slate-900 text-white text-xs shadow-lg animate-fadeIn whitespace-pre-line">
          {tooltip}
          <Tooltip.Arrow className="fill-slate-900" />
        </Tooltip.Content>
      </Tooltip.Portal>
    </Tooltip.Root>
  );
}

function FiltrosPersonalizados({ ventas, onNavigate }) {
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

// ==========================================
// SMART FILTERS WIDGET
// ==========================================

function FilterPreset({ name, description, icon: Icon, isActive, onClick, onDelete, canDelete = false }) {
  const tooltip = `${name}\n${description}`;
  return (
    <Tooltip.Root delayDuration={200}>
      <Tooltip.Trigger asChild>
        <div 
          className={`relative group border rounded-lg p-3 cursor-pointer transition-all ${
            isActive 
              ? 'border-sky-500 bg-sky-50 text-sky-800' 
              : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700'
          }`}
          onClick={onClick}
        >
          <div className="flex items-center gap-2">
            <Icon className="w-4 h-4" />
            <div className="flex-1">
              <div className="font-medium text-sm">{name}</div>
              <div className="text-xs opacity-75">{description}</div>
            </div>
            {canDelete && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
                className="opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:text-red-700"
                title="Eliminar preset"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      </Tooltip.Trigger>
      <Tooltip.Portal>
        <Tooltip.Content side="top" align="center" className="z-50 px-3 py-2 rounded-lg bg-slate-900 text-white text-xs shadow-lg animate-fadeIn whitespace-pre-line">
          {tooltip}
          <Tooltip.Arrow className="fill-slate-900" />
        </Tooltip.Content>
      </Tooltip.Portal>
    </Tooltip.Root>
  );
}

function SmartFilters({ currentFilters, onApplyFilters, colaboradores }) {
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [newPresetName, setNewPresetName] = useState('');
  const [savedPresets, setSavedPresets] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('ventasFilterPresets')) || [];
    } catch {
      return [];
    }
  });

  // Presets predefinidos inteligentes
  const defaultPresets = [
    {
      id: 'hoy',
      name: 'Ventas de Hoy',
      description: 'Solo las ventas de hoy',
      icon: Calendar,
      filters: {
        desde: new Date().toISOString().slice(0, 10),
        hasta: new Date().toISOString().slice(0, 10)
      }
    },
    {
      id: 'semana',
      name: 'Última Semana',
      description: 'Últimos 7 días',
      icon: Clock,
      filters: (() => {
        const hasta = new Date();
        const desde = new Date();
        desde.setDate(desde.getDate() - 7);
        return {
          desde: desde.toISOString().slice(0, 10),
          hasta: hasta.toISOString().slice(0, 10)
        };
      })()
    },
    {
      id: 'mes',
      name: 'Este Mes',
      description: 'Mes actual completo',
      icon: Calendar,
      filters: {
        mesAno: new Date().toISOString().slice(0, 7)
      }
    },
    {
      id: 'sinPvp',
      name: 'Sin Precio',
      description: 'Ventas que necesitan PVP',
      icon: TrendingUp,
      filters: {
        sinPvp: true
      }
    },
    {
      id: 'cerradas',
      name: 'Cerradas',
      description: 'Listas para liquidar',
      icon: Users,
      filters: {
        estado: 'Cerrada'
      }
    },
    {
      id: 'pendientes',
      name: 'Pendientes',
      description: 'Necesitan seguimiento',
      icon: Clock,
      filters: {
        estado: 'PENDIENTE'
      }
    }
  ];

  // Top colaboradores (los que más ventas tienen)
  const topColaboradores = colaboradores
    .map(c => ({
      ...c,
      ventasCount: (currentFilters.ventasData || []).filter(v => v.colaborador_id === c.id).length
    }))
    .sort((a, b) => b.ventasCount - a.ventasCount)
    .slice(0, 3);

  const dynamicPresets = topColaboradores.map((colab) => ({
    id: `colab_${colab.id}`,
    name: colab.nombre.split(' ')[0], // Solo el primer nombre
    description: `${colab.ventasCount} ventas`,
    icon: Users,
    filters: {
      colaborador_id: colab.id
    }
  }));

  const saveCurrentFilters = () => {
    if (!newPresetName.trim()) return;
    
    const newPreset = {
      id: `custom_${Date.now()}`,
      name: newPresetName,
      description: `Filtro personalizado`,
      icon: Star,
      filters: { ...currentFilters },
      isCustom: true
    };

    const updated = [...savedPresets, newPreset];
    setSavedPresets(updated);
    localStorage.setItem('ventasFilterPresets', JSON.stringify(updated));
    
    setNewPresetName('');
    setShowSaveModal(false);
  };

  const deletePreset = (presetId) => {
    const updated = savedPresets.filter(p => p.id !== presetId);
    setSavedPresets(updated);
    localStorage.setItem('ventasFilterPresets', JSON.stringify(updated));
  };

  const isPresetActive = (preset) => {
    return Object.keys(preset.filters).every(key => 
      currentFilters[key] === preset.filters[key]
    );
  };

  const hasActiveFilters = Object.entries(currentFilters).some(([key, value]) => {
    if (key === 'sinPvp') return value === true;
    return value && value !== '';
  });

  return (
    <div className="bg-white rounded-2xl p-6 border-2 border-slate-200 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-slate-600" />
          <h3 className="text-lg font-semibold text-slate-800">Filtros Inteligentes</h3>
        </div>
        
        <div className="flex items-center gap-2">
          {hasActiveFilters && (
            <button
              onClick={() => setShowSaveModal(true)}
              className="flex items-center gap-1 px-3 py-1 text-sm bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
              title="Guardar filtros actuales"
            >
              <Save className="w-3 h-3" />
              Guardar
            </button>
          )}
          
          {hasActiveFilters && (
            <button
              onClick={() => onApplyFilters({})}
              className="flex items-center gap-1 px-3 py-1 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
              title="Limpiar todos los filtros"
            >
              <X className="w-3 h-3" />
              Limpiar
            </button>
          )}
        </div>
      </div>

      {/* Presets organizados por categorías */}
      <div className="space-y-4">
        {/* Filtros temporales */}
        <div>
          <h4 className="text-sm font-medium text-slate-600 mb-2 flex items-center gap-1">
            <Calendar className="w-4 h-4" />
            Por Fecha
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {defaultPresets.slice(0, 3).map(preset => (
              <FilterPreset
                key={preset.id}
                {...preset}
                isActive={isPresetActive(preset)}
                onClick={() => onApplyFilters(preset.filters)}
              />
            ))}
          </div>
        </div>

        {/* Filtros por estado */}
        <div>
          <h4 className="text-sm font-medium text-slate-600 mb-2 flex items-center gap-1">
            <Filter className="w-4 h-4" />
            Por Estado
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {defaultPresets.slice(3).map(preset => (
              <FilterPreset
                key={preset.id}
                {...preset}
                isActive={isPresetActive(preset)}
                onClick={() => onApplyFilters(preset.filters)}
              />
            ))}
          </div>
        </div>

        {/* Top colaboradores */}
        {topColaboradores.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-slate-600 mb-2 flex items-center gap-1">
              <Users className="w-4 h-4" />
              Top Colaboradores
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {dynamicPresets.map(preset => (
                <FilterPreset
                  key={preset.id}
                  {...preset}
                  isActive={isPresetActive(preset)}
                  onClick={() => onApplyFilters(preset.filters)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Filtros guardados */}
        {savedPresets.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-slate-600 mb-2 flex items-center gap-1">
              <Star className="w-4 h-4" />
              Mis Filtros
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {savedPresets.map(preset => (
                <FilterPreset
                  key={preset.id}
                  {...preset}
                  isActive={isPresetActive(preset)}
                  onClick={() => onApplyFilters(preset.filters)}
                  canDelete={true}
                  onDelete={() => deletePreset(preset.id)}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Modal para guardar filtro */}
      {showSaveModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-lg max-w-md w-full p-6">
            <h3 className="text-lg font-bold mb-4">Guardar Filtro</h3>
            <input
              type="text"
              placeholder="Nombre del filtro..."
              className="w-full border border-slate-300 rounded-lg px-3 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-sky-400"
              value={newPresetName}
              onChange={(e) => setNewPresetName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && saveCurrentFilters()}
              autoFocus
            />
            <div className="flex gap-2">
              <button
                onClick={saveCurrentFilters}
                disabled={!newPresetName.trim()}
                className="flex-1 bg-sky-500 text-white rounded-lg py-2 hover:bg-sky-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Guardar
              </button>
              <button
                onClick={() => setShowSaveModal(false)}
                className="flex-1 bg-slate-200 text-slate-700 rounded-lg py-2 hover:bg-slate-300"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ==========================================
// COMPONENTE CONSOLIDADO PRINCIPAL
// ==========================================

/**
 * Componente consolidado completo para análisis y filtros de ventas.
 * Incluye: VentasEnProceso + AnalisisRendimiento + FiltrosPersonalizados + SmartFilters
 * Props:
 * - ventas
 * - productos
 * - operadores
 * - colaboradores
 * - onNavigate
 * - currentFilters
 * - onApplyFilters
 */
export default function AnalysisWidgets({ ventas, productos, operadores, colaboradores, onNavigate, currentFilters, onApplyFilters }) {
  return (
    <div className="space-y-6">
      <VentasEnProceso ventas={ventas} onNavigate={onNavigate} />
      <AnalisisRendimiento ventas={ventas} productos={productos} operadores={operadores} onNavigate={onNavigate} />
      <FiltrosPersonalizados ventas={ventas} onNavigate={onNavigate} />
      <SmartFilters currentFilters={currentFilters} onApplyFilters={onApplyFilters} colaboradores={colaboradores} />
    </div>
  );
}