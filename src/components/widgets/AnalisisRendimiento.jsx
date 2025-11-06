// src/components/widgets/AnalisisRendimiento.jsx
// Análisis de qué operadores y productos funcionan mejor
import React, { useMemo } from 'react';
import * as Tooltip from '@radix-ui/react-tooltip';
import { TrendingUp, TrendingDown, Building, Package, Award, Target, BarChart3 } from 'lucide-react';

function ItemRendimiento({ nombre, ventas, facturacion, tasa_exito, tendencia, tipo, onClick }) {
  const Icon = tipo === 'operador' ? Building : Package;
  const tooltip = tipo === 'operador'
    ? `Operador: ${nombre}\nVentas: ${ventas}\nFacturación: €${facturacion.toLocaleString()}\nTasa de éxito: ${tasa_exito.toFixed(0)}%\nTendencia respecto al mes anterior.`
    : `Producto: ${nombre}\nVentas: ${ventas}\nFacturación: €${facturacion.toLocaleString()}\nTasa de éxito: ${tasa_exito.toFixed(0)}%\nTendencia respecto al mes anterior.`;
  return (
    <Tooltip.Root delayDuration={200}>
      <Tooltip.Trigger asChild>
        <div 
          className="bg-slate-50 rounded-lg p-4 hover:bg-slate-100 cursor-pointer transition-all hover:shadow-md"
          onClick={onClick}
        >
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
        <Tooltip.Content side="top" align="center" className="z-50 px-3 py-2 rounded-lg bg-slate-900 text-white text-xs shadow-lg animate-fadeIn whitespace-pre-line" style={{ pointerEvents: 'auto' }}>
          {tooltip}
          <Tooltip.Arrow className="fill-slate-900" />
        </Tooltip.Content>
      </Tooltip.Portal>
    </Tooltip.Root>
  );
}

// Función para detectar sector basado en nombre de producto u operador
function detectarSector(nombre) {
  if (!nombre) return 'otros';
  const nombreLower = nombre.toLowerCase();
  
  // Telefonía
  if (nombreLower.includes('fibra') || nombreLower.includes('movil') || nombreLower.includes('telefon') ||
      nombreLower.includes('orange') || nombreLower.includes('movistar') || nombreLower.includes('vodafone') ||
      nombreLower.includes('yoigo') || nombreLower.includes('o2') || nombreLower.includes('jazztel')) {
    return 'telefonia';
  }
  
  // Seguridad
  if (nombreLower.includes('alarma') || nombreLower.includes('seguridad') || nombreLower.includes('securitas') ||
      nombreLower.includes('prosegur') || nombreLower.includes('tyco') || nombreLower.includes('adt')) {
    return 'seguridad';
  }
  
  // Energía
  if (nombreLower.includes('luz') || nombreLower.includes('gas') || nombreLower.includes('energia') ||
      nombreLower.includes('electric') || nombreLower.includes('endesa') || nombreLower.includes('iberdrola') ||
      nombreLower.includes('naturgy') || nombreLower.includes('totalenergie')) {
    return 'energia';
  }
  
  return 'otros';
}

export default function AnalisisRendimiento({ ventas, productos, operadores, onNavigate }) {
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
          
          <div className="mt-4 text-center">
            <button
              onClick={() => onNavigate('config', { section: 'operadores' })}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Ver todos los operadores →
            </button>
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
          
          <div className="mt-4 text-center">
            <button
              onClick={() => onNavigate('config', { section: 'productos' })}
              className="text-sm text-green-600 hover:text-green-700 font-medium"
            >
              Ver todos los productos →
            </button>
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
