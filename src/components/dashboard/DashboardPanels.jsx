// src/components/dashboard/DashboardPanels.jsx
// CONSOLIDADO COMPLETO: Todos los 12 paneles del dashboard en un solo archivo optimizado + PRODUCTOS POR OPERADOR
import React from 'react';
import { 
  Euro, TrendingUp, Target, BarChart3, Users, Award, Calendar, Zap,
  AlertCircle, PieChart, MapPin, Building, Package, Clock, Phone, Wrench
} from 'lucide-react';

// ==========================================
// UTILITY FUNCTIONS
// ==========================================

function euro(n) {
  return (n ?? 0).toFixed(2) + " €";
}

// ==========================================
// PRODUCTOS POR OPERADOR PANEL (NUEVO)
// ==========================================

function ProductosOperadorWidget({ operadores = [], productos = [] }) {
  // Limpieza automática de datos
  const operadoresLimpios = operadores.filter(op => op?.id && op?.nombre);
  const productosLimpios = productos.filter(prod => prod?.id && prod?.nombre);
  
  // Conteo de productos por operador
  const productosConteo = React.useMemo(() => {
    const conteo = {};
    operadoresLimpios.forEach(op => {
      conteo[op.id] = productosLimpios.filter(p => p.operador_id === op.id).length;
    });
    return conteo;
  }, [operadoresLimpios, productosLimpios]);
  
  // Top 5 operadores por productos
  const topOperadores = React.useMemo(() => {
    return operadoresLimpios
      .map(op => ({ 
        ...op, 
        totalProductos: productosConteo[op.id] || 0 
      }))
      .sort((a, b) => b.totalProductos - a.totalProductos)
      .slice(0, 5);
  }, [operadoresLimpios, productosConteo]);
  
  // Estadísticas por sector
  const sectorStats = React.useMemo(() => {
    const stats = {
      telefonia: { operadores: 0, productos: 0 },
      energia: { operadores: 0, productos: 0 },
      seguridad: { operadores: 0, productos: 0 },
      otros: { operadores: 0, productos: 0 },
    };
    
    operadoresLimpios.forEach(o => {
      const sector = ['telefonia', 'energia', 'seguridad'].includes(o.sector) ? o.sector : 'otros';
      stats[sector].operadores++;
      stats[sector].productos += productosConteo[o.id] || 0;
    });
    
    return stats;
  }, [operadoresLimpios, productosConteo]);

  return (
    <div className="space-y-6">
      {/* Resumen ejecutivo */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 p-4 rounded-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-600 dark:text-blue-400 text-sm font-medium">Telefonía</p>
              <div className="text-xl font-bold text-slate-800 dark:text-gray-200">{sectorStats.telefonia.operadores}</div>
              <div className="text-xs text-blue-500 dark:text-blue-400">{sectorStats.telefonia.productos} productos</div>
            </div>
            <Building className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/30 p-4 rounded-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-600 dark:text-green-400 text-sm font-medium">Energía</p>
              <div className="text-xl font-bold text-slate-800 dark:text-gray-200">{sectorStats.energia.operadores}</div>
              <div className="text-xs text-green-500 dark:text-green-400">{sectorStats.energia.productos} productos</div>
            </div>
            <Zap className="w-6 h-6 text-green-600 dark:text-green-400" />
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/30 dark:to-yellow-800/30 p-4 rounded-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-yellow-600 dark:text-yellow-400 text-sm font-medium">Seguridad</p>
              <div className="text-xl font-bold text-slate-800 dark:text-gray-200">{sectorStats.seguridad.operadores}</div>
              <div className="text-xs text-yellow-500 dark:text-yellow-400">{sectorStats.seguridad.productos} productos</div>
            </div>
            <Wrench className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-800/30 p-4 rounded-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-600 dark:text-purple-400 text-sm font-medium">Total</p>
              <div className="text-xl font-bold text-slate-800 dark:text-gray-200">{operadoresLimpios.length}</div>
              <div className="text-xs text-purple-500 dark:text-purple-400">{productosLimpios.length} productos</div>
            </div>
            <Package className="w-6 h-6 text-purple-600 dark:text-purple-400" />
          </div>
        </div>
      </div>

      {/* Top operadores por productos */}
      <div className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 border border-purple-200 dark:border-purple-700/30 rounded-xl p-4">
        <h4 className="text-lg font-semibold text-purple-800 dark:text-purple-200 mb-4 flex items-center gap-2">
          🏆 Top Operadores por Productos
        </h4>
        
        {topOperadores.length > 0 ? (
          <div className="grid md:grid-cols-5 gap-3">
            {topOperadores.map((op, index) => (
              <div key={op.id} className="bg-white dark:bg-gray-700 rounded-lg p-3 text-center shadow-sm border border-purple-100 dark:border-purple-700/50">
                <div className="text-sm font-medium text-slate-700 dark:text-gray-200 truncate mb-1" title={op.nombre}>
                  {op.nombre}
                </div>
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{op.totalProductos}</div>
                <div className="text-xs text-slate-500 dark:text-gray-400 flex items-center justify-center gap-1">
                  {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : index + 1}
                  {op.sector && <span className="capitalize"> {op.sector}</span>}
                </div>
                
                {/* Indicador visual del nivel */}
                <div className={`mt-2 px-2 py-1 rounded-full text-xs font-medium ${
                  op.totalProductos === 0 
                    ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' 
                    : op.totalProductos <= 3 
                    ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' 
                    : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                }`}>
                  {op.totalProductos === 0 ? 'Sin productos' : 
                   op.totalProductos <= 3 ? 'Pocos productos' : 
                   'Buen catálogo'}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Building className="w-12 h-12 mx-auto text-purple-300 dark:text-purple-600 mb-4" />
            <h3 className="text-lg font-medium text-purple-600 dark:text-purple-400 mb-2">Sin operadores registrados</h3>
            <p className="text-purple-500 dark:text-purple-500 text-sm mb-4">Añade operadores en la sección Gestión</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ==========================================
// MAIN KPIS PANEL
// ==========================================

function KPIsPanel({ kpis, hayDatos, total, ticketMedio, facturacionTotal, byEstado, crecimiento }) {
  const { comBruta, comPagada, margen } = kpis;
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* KPI: Comisión Bruta / Facturación Total */}
      <div className="bg-gradient-to-br from-sky-200 to-sky-300 dark:from-sky-700 dark:to-sky-800 rounded-2xl p-6 text-slate-700 dark:text-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-slate-600 dark:text-gray-400 text-sm font-medium">
              {hayDatos ? "Comisión Bruta" : "Facturación Total"}
            </p>
            <p className="text-3xl font-bold">
              {hayDatos ? euro(comBruta) : euro(facturacionTotal)}
            </p>
            <p className="text-slate-600 dark:text-gray-400 text-xs mt-1">
              {hayDatos ? (
                `${crecimiento >= 0 ? "+" : ""}${crecimiento.toFixed(1)}% vs anterior`
              ) : (
                `${total} ventas registradas`
              )}
            </p>
          </div>
          <Euro className="w-8 h-8 text-slate-500 dark:text-gray-400" />
        </div>
      </div>

      {/* KPI: Comisión Pagada / Ticket Medio */}
      <div className="bg-gradient-to-br from-emerald-200 to-emerald-300 dark:from-emerald-700 dark:to-emerald-800 rounded-2xl p-6 text-slate-700 dark:text-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-slate-600 dark:text-gray-400 text-sm font-medium">
              {hayDatos ? "Comisión Pagada" : "Ticket Medio"}
            </p>
            <p className="text-3xl font-bold">
              {hayDatos ? euro(comPagada) : euro(ticketMedio)}
            </p>
            <p className="text-slate-600 dark:text-gray-400 text-xs mt-1">
              {hayDatos ? "A colaboradores (neto)" : "Por venta"}
            </p>
          </div>
          <TrendingUp className="w-8 h-8 text-slate-500 dark:text-gray-400" />
        </div>
      </div>

      {/* KPI: Margen Empresa / Ventas Cerradas */}
      <div className="bg-gradient-to-br from-purple-200 to-purple-300 dark:from-purple-700 dark:to-purple-800 rounded-2xl p-6 text-slate-700 dark:text-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-slate-600 dark:text-gray-400 text-sm font-medium">
              {hayDatos ? "Margen Empresa" : "Ventas Cerradas"}
            </p>
            <p className="text-3xl font-bold">
              {hayDatos ? euro(margen) : (byEstado.Cerrada || 0)}
            </p>
            <p className="text-slate-600 dark:text-gray-400 text-xs mt-1">
              {hayDatos ? (
                `${comBruta > 0 ? ((margen / comBruta) * 100).toFixed(0) : 0}% del total`
              ) : (
                `${total > 0 ? (((byEstado.Cerrada || 0) / total) * 100).toFixed(1) : 0}% del total`
              )}
            </p>
          </div>
          <Target className="w-8 h-8 text-slate-500 dark:text-gray-400" />
        </div>
      </div>

      {/* KPI: Ventas Totales / Ventas Liquidadas */}
      <div className="bg-gradient-to-br from-rose-200 to-rose-300 dark:from-rose-700 dark:to-rose-800 rounded-2xl p-6 text-slate-700 dark:text-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-slate-600 dark:text-gray-400 text-sm font-medium">
              {hayDatos ? "Ventas Totales" : "Ventas Liquidadas"}
            </p>
            <p className="text-3xl font-bold">
              {hayDatos ? total : (byEstado.Liquidada || 0)}
            </p>
            <p className="text-slate-600 dark:text-gray-400 text-xs mt-1">
              {hayDatos ? `Ticket: ${euro(ticketMedio)}` : "Completamente procesadas"}
            </p>
          </div>
          <BarChart3 className="w-8 h-8 text-slate-500 dark:text-gray-400" />
        </div>
      </div>
    </div>
  );
}

// ==========================================
// PIPELINE PANEL
// ==========================================

function PipelinePanel({ byEstado, total }) {
  const estados = [
    { label: "Borradores", count: byEstado.Borrador || 0, color: "bg-amber-300 dark:bg-amber-600", textColor: "text-amber-800 dark:text-amber-200" },
    { label: "Confirmadas", count: byEstado.Confirmada || 0, color: "bg-emerald-300 dark:bg-emerald-600", textColor: "text-emerald-800 dark:text-emerald-200" },
    { label: "Cerradas", count: byEstado.Cerrada || 0, color: "bg-sky-300 dark:bg-sky-600", textColor: "text-sky-800 dark:text-sky-200" },
    { label: "Liquidadas", count: byEstado.Liquidada || 0, color: "bg-purple-300 dark:bg-purple-600", textColor: "text-purple-800 dark:text-purple-200" },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {estados.map((item) => (
        <div key={item.label} className="text-center p-4 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-gray-700 dark:to-gray-800 rounded-xl">
          <div className={`w-12 h-12 mx-auto mb-2 rounded-full ${item.color} flex items-center justify-center`}>
            <span className={`text-lg font-bold ${item.textColor}`}>{item.count}</span>
          </div>
          <p className="text-sm font-medium text-slate-700 dark:text-gray-200">{item.label}</p>
          <p className="text-xs text-slate-500 dark:text-gray-400">
            {total > 0 ? ((item.count / total) * 100).toFixed(1) : 0}% del total
          </p>
        </div>
      ))}
    </div>
  );
}

// ==========================================
// EXTRA METRICS PANEL
// ==========================================

function ExtraMetricsPanel({ ticketMedio, irpfMedio, total, byEstado, margen, facturacionTotal, hayDatos }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <div className="flex items-center justify-between p-3 bg-gradient-to-r from-amber-50 to-amber-100 dark:from-amber-900/30 dark:to-amber-800/30 rounded-xl">
        <div>
          <p className="text-sm font-medium text-slate-700 dark:text-gray-200">Ticket Medio</p>
          <p className="text-xl font-bold text-slate-800 dark:text-gray-200">{euro(ticketMedio)}</p>
          <p className="text-xs text-slate-500 dark:text-gray-400">Por venta</p>
        </div>
        <Euro className="w-6 h-6 text-amber-600 dark:text-amber-400" />
      </div>
      
      <div className="flex items-center justify-between p-3 bg-gradient-to-r from-indigo-50 to-indigo-100 dark:from-indigo-900/30 dark:to-indigo-800/30 rounded-xl">
        <div>
          <p className="text-sm font-medium text-slate-700 dark:text-gray-200">IRPF Medio</p>
          <p className="text-xl font-bold text-slate-800 dark:text-gray-200">{hayDatos ? `${irpfMedio.toFixed(1)}%` : "N/A"}</p>
          <p className="text-xs text-slate-500 dark:text-gray-400">Retención fiscal</p>
        </div>
        <TrendingUp className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
      </div>
      
      <div className="flex items-center justify-between p-3 bg-gradient-to-r from-emerald-50 to-emerald-100 dark:from-emerald-900/30 dark:to-emerald-800/30 rounded-xl">
        <div>
          <p className="text-sm font-medium text-slate-700 dark:text-gray-200">Tasa Cierre</p>
          <p className="text-xl font-bold text-slate-800 dark:text-gray-200">{total > 0 ? (((byEstado.Cerrada || 0) / total) * 100).toFixed(1) : 0}%</p>
          <p className="text-xs text-slate-500 dark:text-gray-400">Conversión a cerrado</p>
        </div>
        <Award className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
      </div>
      
      <div className="flex items-center justify-between p-3 bg-gradient-to-r from-rose-50 to-rose-100 dark:from-rose-900/30 dark:to-rose-800/30 rounded-xl">
        <div>
          <p className="text-sm font-medium text-slate-700 dark:text-gray-200">Rentabilidad</p>
          <p className="text-xl font-bold text-slate-800 dark:text-gray-200">{hayDatos && facturacionTotal > 0 ? `${((margen / facturacionTotal) * 100).toFixed(1)}%` : "N/A"}</p>
          <p className="text-xs text-slate-500 dark:text-gray-400">Margen sobre ventas</p>
        </div>
        <PieChart className="w-6 h-6 text-rose-600 dark:text-rose-400" />
      </div>
    </div>
  );
}

// ==========================================
// TOP COLABORADORES PANEL
// ==========================================

function TopColaboradoresPanel({ topColaboradores, hayDatos }) {
  return (
    <div className="space-y-3">
      {topColaboradores.length > 0 ? (
        topColaboradores.map((colab, index) => (
          <div key={colab.id} className="flex items-center justify-between p-3 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-gray-700 dark:to-gray-600 rounded-xl">
            <div className="flex items-center space-x-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-slate-700 dark:text-gray-200 text-sm font-bold ${
                index === 0 ? "bg-gradient-to-br from-yellow-200 to-yellow-300 dark:from-yellow-600 dark:to-yellow-700" :
                index === 1 ? "bg-gradient-to-br from-slate-200 to-slate-300 dark:from-gray-500 dark:to-gray-600" :
                "bg-gradient-to-br from-orange-200 to-orange-300 dark:from-orange-600 dark:to-orange-700"
              }`}>
                {index + 1}
              </div>
              <div>
                <p className="text-sm font-medium text-slate-700 dark:text-gray-200">{colab.nombre}</p>
                <p className="text-xs text-slate-500 dark:text-gray-400">{colab.ventas} ventas</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold text-slate-800 dark:text-gray-200">{euro(colab.facturacion)}</p>
              {hayDatos && colab.neto > 0 && (
                <p className="text-xs text-slate-600 dark:text-gray-400">Neto: {euro(colab.neto)}</p>
              )}
            </div>
          </div>
        ))
      ) : (
        <div className="text-center py-8">
          <Users className="w-12 h-12 mx-auto text-slate-300 dark:text-gray-600 mb-4" />
          <h3 className="text-lg font-medium text-slate-600 dark:text-gray-400 mb-2">Sin datos de colaboradores</h3>
          <p className="text-slate-500 dark:text-gray-500 text-sm mb-4">Registra ventas asignadas a colaboradores</p>
        </div>
      )}
    </div>
  );
}

// ==========================================
// TOP PRODUCTOS PANEL
// ==========================================

function TopProductosPanel({ topProductos, hayDatos }) {
  return (
    <div className="space-y-3">
      {topProductos.length > 0 ? (
        topProductos.map((producto, index) => (
          <div key={producto.id} className="flex items-center justify-between p-3 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-gray-700 dark:to-gray-600 rounded-xl">
            <div className="flex items-center space-x-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-slate-700 dark:text-gray-200 text-sm font-bold ${
                index === 0 ? "bg-gradient-to-br from-emerald-200 to-emerald-300 dark:from-emerald-600 dark:to-emerald-700" :
                index === 1 ? "bg-gradient-to-br from-sky-200 to-sky-300 dark:from-sky-600 dark:to-sky-700" :
                "bg-gradient-to-br from-purple-200 to-purple-300 dark:from-purple-600 dark:to-purple-700"
              }`}>
                {index + 1}
              </div>
              <div>
                <p className="text-sm font-medium text-slate-700 dark:text-gray-200">{producto.nombre}</p>
                <p className="text-xs text-slate-500 dark:text-gray-400">{producto.familia} • {producto.ventas} vendidos</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold text-slate-800 dark:text-gray-200">{euro(producto.facturacion)}</p>
              {hayDatos && producto.margen > 0 && (
                <p className="text-xs text-slate-600 dark:text-gray-400">Margen: {euro(producto.margen)}</p>
              )}
            </div>
          </div>
        ))
      ) : (
        <div className="text-center py-8">
          <Target className="w-12 h-12 mx-auto text-slate-300 dark:text-gray-600 mb-4" />
          <h3 className="text-lg font-medium text-slate-600 dark:text-gray-400 mb-2">Sin datos de productos</h3>
          <p className="text-slate-500 dark:text-gray-500 text-sm mb-4">Registra ventas de productos para ver el ranking</p>
        </div>
      )}
    </div>
  );
}

// ==========================================
// ANÁLISIS CONSOLIDADOS (SECTOR, FAMILIA, GEO)
// ==========================================

function SectorAnalysis({ bySector, hayDatos }) {
  return (
    <div className="space-y-3">
      {bySector.length > 0 ? (
        bySector.map(([sector, data]) => (
          <div key={sector} className="flex items-center justify-between p-3 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-gray-700 dark:to-gray-600 rounded-xl">
            <div>
              <p className="text-sm font-medium text-slate-700 dark:text-gray-200 capitalize">{sector}</p>
              <p className="text-xs text-slate-500 dark:text-gray-400">{data.ventas} ventas</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold text-slate-800 dark:text-gray-200">{euro(data.facturacion)}</p>
              {hayDatos && data.bruto > 0 && (
                <p className="text-xs text-slate-600 dark:text-gray-400">Com: {euro(data.bruto)}</p>
              )}
            </div>
          </div>
        ))
      ) : (
        <div className="text-center py-8">
          <PieChart className="w-12 h-12 mx-auto text-slate-300 dark:text-gray-600 mb-4" />
          <h3 className="text-lg font-medium text-slate-600 dark:text-gray-400 mb-2">Sin datos por sector</h3>
          <p className="text-slate-500 dark:text-gray-500 text-sm mb-4">Añade operadores y productos para ver análisis por sector</p>
        </div>
      )}
    </div>
  );
}

function FamiliaAnalysis({ byFamilia, hayDatos }) {
  return (
    <div className="space-y-3">
      {byFamilia.length > 0 ? (
        byFamilia.map(([familia, data]) => (
          <div key={familia} className="flex items-center justify-between p-3 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-gray-700 dark:to-gray-600 rounded-xl">
            <div>
              <p className="text-sm font-medium text-slate-700 dark:text-gray-200">{familia}</p>
              <p className="text-xs text-slate-500 dark:text-gray-400">{data.ventas} productos vendidos</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold text-slate-800 dark:text-gray-200">{euro(data.facturacion)}</p>
              {hayDatos && data.margen > 0 && (
                <p className="text-xs text-slate-600 dark:text-gray-400">Margen: {euro(data.margen)}</p>
              )}
            </div>
          </div>
        ))
      ) : (
        <div className="text-center py-8">
          <Target className="w-12 h-12 mx-auto text-slate-300 dark:text-gray-600 mb-4" />
          <h3 className="text-lg font-medium text-slate-600 dark:text-gray-400 mb-2">Sin datos por familia</h3>
          <p className="text-slate-500 dark:text-gray-500 text-sm mb-4">Clasifica tus productos por familia para ver este análisis</p>
        </div>
      )}
    </div>
  );
}

function GeoDistributionPanel({ byZona }) {
  return (
    <div className="space-y-3">
      {byZona.length > 0 ? (
        byZona.map(([zona, data]) => (
          <div key={zona} className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 rounded-xl">
            <div className="flex items-center space-x-3">
              <MapPin className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <div>
                <p className="text-sm font-medium text-slate-700 dark:text-gray-200">{zona}</p>
                <p className="text-xs text-slate-500 dark:text-gray-400">{data.ventas} ventas</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold text-slate-800 dark:text-gray-200">{euro(data.facturacion)}</p>
              <p className="text-xs text-slate-600 dark:text-gray-400">Impuestos: {euro(data.impuestos)}</p>
            </div>
          </div>
        ))
      ) : (
        <div className="text-center py-8">
          <MapPin className="w-12 h-12 mx-auto text-blue-300 dark:text-blue-600 mb-4" />
          <h3 className="text-lg font-medium text-slate-600 dark:text-gray-400 mb-2">Sin datos geográficos</h3>
          <p className="text-slate-500 dark:text-gray-500 text-sm mb-4">Define zonas y asígnalas a tus ventas</p>
        </div>
      )}
    </div>
  );
}

// ==========================================
// EVOLUCIÓN TEMPORAL Y TENDENCIAS
// ==========================================

function EvolucionTemporalPanel({ evolucionTemporal, periodoEvolucion, hayDatos }) {
  return (
    <div className="h-80 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-gray-700 dark:to-gray-800 rounded-xl p-4">
      {evolucionTemporal.length > 0 ? (
        <div className="h-full flex flex-col">
          <div className="text-xs text-slate-500 dark:text-gray-400 mb-4">
            {periodoEvolucion === 'anual' ? 'Por años' : periodoEvolucion === 'trimestral' ? 'Por trimestres' : 'Por meses'} •
            Total: {euro(evolucionTemporal.reduce((sum, [, data]) => sum + data.facturacion, 0))}
          </div>
          <div className="flex-1 space-y-2">
            {evolucionTemporal.map(([periodo, data]) => {
              const maxFacturacion = Math.max(...evolucionTemporal.map(([, d]) => d.facturacion));
              const percentage = maxFacturacion > 0 ? (data.facturacion / maxFacturacion) * 100 : 0;
              
              let displayName = periodo;
              if (periodoEvolucion === 'semestral') {
                displayName = new Date(periodo + '-01').toLocaleDateString('es-ES', { month: 'short', year: '2-digit' });
              } else if (periodoEvolucion === 'anual') {
                displayName = periodo;
              }
              
              return (
                <div key={periodo} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600 dark:text-gray-400 font-medium">{displayName}</span>
                    <div className="text-right">
                      <span className="font-semibold text-slate-800 dark:text-gray-200">{data.ventas}</span>
                      <span className="text-slate-500 dark:text-gray-400 ml-1">ventas</span>
                    </div>
                  </div>
                  <div className="flex justify-between text-xs text-slate-500 dark:text-gray-400 mb-1">
                    <span>Facturación: {euro(data.facturacion)}</span>
                    {hayDatos && data.margen > 0 && (
                      <span>Margen: {euro(data.margen)}</span>
                    )}
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-gray-600 rounded-full h-3">
                    <div
                      className="bg-gradient-to-r from-emerald-400 to-emerald-500 h-3 rounded-full transition-all duration-700 flex items-center justify-end pr-2"
                      style={{ width: `${Math.max(percentage, 8)}%` }}
                    >
                      {percentage > 25 && (
                        <span className="text-xs text-white font-medium">
                          {percentage.toFixed(0)}%
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="text-center py-8">
          <Calendar className="w-12 h-12 mx-auto text-slate-300 dark:text-gray-600 mb-4" />
          <h3 className="text-lg font-medium text-slate-600 dark:text-gray-400 mb-2">Sin datos temporales</h3>
          <p className="text-slate-500 dark:text-gray-500 text-sm mb-4">Registra ventas con fechas para ver la evolución</p>
        </div>
      )}
    </div>
  );
}

function TendenciasPanel({ evolucionTemporal, periodoEvolucion, topProductos, topColaboradores }) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="bg-gradient-to-br from-cyan-50 to-cyan-100 dark:from-cyan-900/30 dark:to-cyan-800/30 p-4 rounded-xl">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-slate-700 dark:text-gray-200">Promedio por Período</span>
          <Calendar className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
        </div>
        <p className="text-lg font-bold text-slate-800 dark:text-gray-200">
          {evolucionTemporal.length > 0 
            ? (evolucionTemporal.reduce((sum, [, data]) => sum + data.ventas, 0) / evolucionTemporal.length).toFixed(1)
            : 0
          } ventas
        </p>
        <p className="text-xs text-slate-500 dark:text-gray-400">
          Por {periodoEvolucion === 'anual' ? 'año' : periodoEvolucion === 'trimestral' ? 'trimestre' : 'mes'}
        </p>
      </div>
      
      <div className="bg-gradient-to-br from-teal-50 to-teal-100 dark:from-teal-900/30 dark:to-teal-800/30 p-4 rounded-xl">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-slate-700 dark:text-gray-200">Mejor Período</span>
          <TrendingUp className="w-4 h-4 text-teal-600 dark:text-teal-400" />
        </div>
        <p className="text-lg font-bold text-slate-800 dark:text-gray-200">
          {evolucionTemporal.length > 0 
            ? Math.max(...evolucionTemporal.map(([, data]) => data.ventas))
            : 0
          } ventas
        </p>
        <p className="text-xs text-slate-500 dark:text-gray-400">Mejor período registrado</p>
      </div>
      
      <div className="bg-gradient-to-br from-violet-50 to-violet-100 dark:from-violet-900/30 dark:to-violet-800/30 p-4 rounded-xl">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-slate-700 dark:text-gray-200">Productos Activos</span>
          <Target className="w-4 h-4 text-violet-600 dark:text-violet-400" />
        </div>
        <p className="text-lg font-bold text-slate-800 dark:text-gray-200">
          {topProductos.length}
        </p>
        <p className="text-xs text-slate-500 dark:text-gray-400">Con ventas</p>
      </div>
      
      <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/30 dark:to-orange-800/30 p-4 rounded-xl">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-slate-700 dark:text-gray-200">Colab. Activos</span>
          <Users className="w-4 h-4 text-orange-600 dark:text-orange-400" />
        </div>
        <p className="text-lg font-bold text-slate-800 dark:text-gray-200">
          {topColaboradores.length}
        </p>
        <p className="text-xs text-slate-500 dark:text-gray-400">Con ventas</p>
      </div>
    </div>
  );
}

// ==========================================
// PRODUCTIVIDAD PANEL
// ==========================================

function ProductividadPanel({ colaboradores, total, topColaboradores, topProductos, facturacionTotal, margen, comBruta, hayDatos }) {
  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-gray-700 dark:to-gray-600 p-4 rounded-xl">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-semibold text-slate-700 dark:text-gray-200">Productividad por Colaborador</h4>
          <BarChart3 className="w-4 h-4 text-slate-600 dark:text-gray-400" />
        </div>
        <div className="text-2xl font-bold text-slate-800 dark:text-gray-200 mb-1">
          {colaboradores.length > 0 && total > 0 
            ? (total / (topColaboradores.length || 1)).toFixed(1)
            : 0
          } ventas
        </div>
        <p className="text-xs text-slate-500 dark:text-gray-400">Promedio por colaborador activo</p>
      </div>
      
      <div className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-gray-700 dark:to-gray-600 p-4 rounded-xl">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-semibold text-slate-700 dark:text-gray-200">Facturación por Producto</h4>
          <PieChart className="w-4 h-4 text-slate-600 dark:text-gray-400" />
        </div>
        <div className="text-2xl font-bold text-slate-800 dark:text-gray-200 mb-1">
          {topProductos.length > 0 
            ? euro(facturacionTotal / topProductos.length)
            : euro(0)
          }
        </div>
        <p className="text-xs text-slate-500 dark:text-gray-400">Promedio por producto vendido</p>
      </div>
      
      {hayDatos && (
        <div className="bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/30 p-4 rounded-xl">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold text-slate-700 dark:text-gray-200">Eficiencia de Margen</h4>
            <Award className="w-4 h-4 text-green-600 dark:text-green-400" />
          </div>
          <div className="text-2xl font-bold text-slate-800 dark:text-gray-200 mb-1">
            {comBruta > 0 ? ((margen / comBruta) * 100).toFixed(1) : 0}%
          </div>
          <p className="text-xs text-slate-500 dark:text-gray-400">Margen empresa vs comisión bruta</p>
        </div>
      )}
    </div>
  );
}

// ==========================================
// COMPONENTE PRINCIPAL CONSOLIDADO
// ==========================================

/**
 * DashboardPanels - Componente completamente consolidado
 * Incluye todos los 12 paneles originales + widget productos por operador
 * Elimina dependencias externas y reduce la fragmentación del código
 */
export default function DashboardPanels(props) {
  const {
    // Props comunes para todos los paneles
    kpis = { comBruta: 0, comPagada: 0, margen: 0 },
    hayDatos = false,
    total = 0,
    ticketMedio = 0,
    facturacionTotal = 0,
    byEstado = {},
    crecimiento = 0,
    
    // Props específicos para paneles individuales
    topColaboradores = [],
    topProductos = [],
    bySector = [],
    byFamilia = [],
    byZona = [],
    evolucionTemporal = [],
    periodoEvolucion = 'mensual',
    colaboradores = [],
    margen = 0,
    comBruta = 0,
    irpfMedio = 0,
    
    // Props para el nuevo widget productos por operador
    operadores = [],
    productos = []
  } = props;

  return (
    <div className="space-y-8">
      {/* Panel Principal de KPIs */}
      <section>
        <h2 className="text-xl font-bold text-slate-800 dark:text-gray-200 mb-4">Métricas Principales</h2>
        <KPIsPanel {...{ kpis, hayDatos, total, ticketMedio, facturacionTotal, byEstado, crecimiento }} />
      </section>

      {/* Panel de Pipeline */}
      <section>
        <h2 className="text-xl font-bold text-slate-800 dark:text-gray-200 mb-4">Pipeline de Ventas</h2>
        <PipelinePanel {...{ byEstado, total }} />
      </section>

      {/* Métricas Extras */}
      <section>
        <h2 className="text-xl font-bold text-slate-800 dark:text-gray-200 mb-4">Métricas Adicionales</h2>
        <ExtraMetricsPanel {...{ ticketMedio, irpfMedio, total, byEstado, margen, facturacionTotal, hayDatos }} />
      </section>

      {/* NUEVO: Widget Productos por Operador */}
      <section>
        <h2 className="text-xl font-bold text-slate-800 dark:text-gray-200 mb-4">Productos por Operador</h2>
        <ProductosOperadorWidget {...{ operadores, productos }} />
      </section>

      {/* Análisis por Colaboradores y Productos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <section>
          <h3 className="text-lg font-semibold text-slate-800 dark:text-gray-200 mb-4">Top Colaboradores</h3>
          <TopColaboradoresPanel {...{ topColaboradores, hayDatos }} />
        </section>
        
        <section>
          <h3 className="text-lg font-semibold text-slate-800 dark:text-gray-200 mb-4">Top Productos</h3>
          <TopProductosPanel {...{ topProductos, hayDatos }} />
        </section>
      </div>

      {/* Análisis por Sector y Familia */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <section>
          <h3 className="text-lg font-semibold text-slate-800 dark:text-gray-200 mb-4">Análisis por Sector</h3>
          <SectorAnalysis {...{ bySector, hayDatos }} />
        </section>
        
        <section>
          <h3 className="text-lg font-semibold text-slate-800 dark:text-gray-200 mb-4">Análisis por Familia</h3>
          <FamiliaAnalysis {...{ byFamilia, hayDatos }} />
        </section>
      </div>

      {/* Distribución Geográfica */}
      <section>
        <h3 className="text-lg font-semibold text-slate-800 dark:text-gray-200 mb-4">Distribución Geográfica</h3>
        <GeoDistributionPanel {...{ byZona }} />
      </section>

      {/* Evolución Temporal */}
      <section>
        <h3 className="text-lg font-semibold text-slate-800 dark:text-gray-200 mb-4">Evolución Temporal</h3>
        <EvolucionTemporalPanel {...{ evolucionTemporal, periodoEvolucion, hayDatos }} />
      </section>

      {/* Tendencias y Productividad - SOLAPAMIENTO ARREGLADO */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pb-12">
        <section className="mb-12 pb-12">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-gray-200 mb-4">Tendencias</h3>
          <TendenciasPanel {...{ evolucionTemporal, periodoEvolucion, topProductos, topColaboradores }} />
        </section>
        <section>
          <h3 className="text-lg font-semibold text-slate-800 dark:text-gray-200 mb-4">Productividad</h3>
          <ProductividadPanel {...{ colaboradores, total, topColaboradores, topProductos, facturacionTotal, margen, comBruta, hayDatos }} />
        </section>
      </div>
    </div>
  );
}

// Exportar componentes individuales por si se necesitan por separado
export {
  KPIsPanel,
  PipelinePanel,
  ExtraMetricsPanel,
  TopColaboradoresPanel,
  TopProductosPanel,
  SectorAnalysis,
  FamiliaAnalysis,
  GeoDistributionPanel,
  EvolucionTemporalPanel,
  TendenciasPanel,
  ProductividadPanel,
  ProductosOperadorWidget // NUEVO export
};