import { useState } from "react";
import * as Tooltip from '@radix-ui/react-tooltip';
import { useNavigate } from "react-router-dom";
import { useData } from "../context/DataContext";
import Loading from "./common/Loading";
import Card from "./ui/Card";
import SectionTitle from "./ui/SectionTitle";
import KPIsPanel from "./dashboard/KPIsPanel";
import SectorAnalysis from "./dashboard/SectorAnalysis";
import FamiliaAnalysis from "./dashboard/FamiliaAnalysis";
import GeoDistributionPanel from "./dashboard/GeoDistributionPanel";
import EvolucionTemporalPanel from "./dashboard/EvolucionTemporalPanel";
import StatusWidgets from "./widgets/StatusWidgets";
import { QuickActions, QuickStats, SmartAlerts } from "./widgets/DashboardWidgets";
import VentasEnProceso from "./widgets/VentasEnProceso";
import AnalisisRendimiento from "./widgets/AnalisisRendimiento";
import FiltrosPersonalizados from "./widgets/FiltrosPersonalizados";
import TopColaboradoresPanel from "./dashboard/TopColaboradoresPanel";
import TopProductosPanel from "./dashboard/TopProductosPanel";
import ExtraMetricsPanel from "./dashboard/ExtraMetricsPanel";
import PipelinePanel from "./dashboard/PipelinePanel";
import TendenciasPanel from "./dashboard/TendenciasPanel";
import ProductividadPanel from "./dashboard/ProductividadPanel";
import AnalysisWidgets from "./widgets/AnalysisWidgets";
import {
  Euro,
  TrendingUp,
  Target,
  BarChart3,
  Users,
  Calendar,
  MapPin,
  Zap,
  Phone,
  Shield,
  PieChart,
  Award,
  Briefcase,
  AlertCircle,
  Plus,
  AlertTriangle,
  CheckCircle,
  Clock
} from "lucide-react";

function euro(n) {
  return (n ?? 0).toFixed(2) + " €";
}

export default function Dashboard() {
  // Hook de navegación de React Router
  const navigate = useNavigate();
  
  // Función de navegación que maneja filtros y acciones especiales
  const handleNavigate = (route, options = {}) => {
    // Manejar rutas con parámetros incluidos (ej: 'config?section=productos')
    if (route.includes('?')) {
      navigate(`/${route}`);
      return;
    }
    
    // Manejar ventas con filtros
    if (route === 'ventas' && options.filtros) {
      const params = new URLSearchParams();
      Object.entries(options.filtros).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          params.set(key, value.join(','));
        } else {
          params.set(key, value);
        }
      });
      if (options.titulo) {
        params.set('titulo', options.titulo);
      }
      navigate(`/${route}?${params.toString()}`);
      return;
    }
    
    // Manejar ventas with modal (Nueva Venta)
    if (route === 'ventas' && options.openModal) {
      navigate(`/${route}?modal=${options.openModal}`);
      return;
    }
    
    // Navegación simple
    navigate(`/${route}`);
  };
  
  // Usar el contexto de datos
  const { data, dataInitialized } = useData();
  
  const ventas = Array.isArray(data?.ventas) ? data.ventas : [];
  const productos = Array.isArray(data?.productos) ? data.productos : [];
  const operadores = Array.isArray(data?.operadores) ? data.operadores : [];
  const colaboradores = Array.isArray(data?.colaboradores) ? data.colaboradores : [];
  const zonas = Array.isArray(data?.zonas) ? data.zonas : [];

  const total = ventas.length;
  const ventasCalculadas = ventas.filter(v => v._calc?.ok);
  const hayDatos = ventasCalculadas.length > 0;

  // Estados para filtros temporales
  const [periodoEvolucion, setPeriodoEvolucion] = useState('semestral');
  const [periodoAnalisis, setPeriodoAnalisis] = useState('todo');

  // Función para filtrar ventas por período de análisis
  const getVentasFiltradas = () => {
    if (periodoAnalisis === 'todo') return ventas;
    
    const ahora = new Date();
    const fechaLimite = new Date();
    
    if (periodoAnalisis === 'ultimo_trimestre') {
      fechaLimite.setMonth(ahora.getMonth() - 3);
    } else if (periodoAnalisis === 'ultimo_año') {
      fechaLimite.setFullYear(ahora.getFullYear() - 1);
    }
    
    return ventas.filter(v => {
      if (!v.fecha) return true;
      const fechaVenta = new Date(v.fecha);
      return fechaVenta >= fechaLimite;
    });
  };

  const ventasFiltradas = getVentasFiltradas();

  // Estados de ventas
  const byEstado = ["Borrador", "Confirmada", "Cerrada", "Liquidada"].reduce(
    (acc, s) => {
      acc[s] = ventas.filter((v) => v.estado === s).length;
      return acc;
    },
    {},
  );

  // Métricas básicas
  const ticketMedio = total
    ? ventas.reduce((a, v) => a + (Number(v.pvp) || 0), 0) / total
    : 0;

  const facturacionTotal = ventas.reduce((a, v) => a + (Number(v.pvp) || 0), 0);

  const irpfDatos = ventasCalculadas.map((v) => v._calc.detalle.irpf_pct);
  const irpfMedio = irpfDatos.length
    ? (irpfDatos.reduce((a, b) => a + b, 0) / irpfDatos.length) * 100
    : 0;

  // Calcular KPIs dinámicamente
  const kpis = (() => {
    let comBruta = 0;
    let margen = 0;

    ventasCalculadas.forEach(v => {
      comBruta += v._calc.detalle.comBruta || 0;
      margen += v._calc.detalle.margenEmpresa || 0;
    });

    return { comBruta, margen };
  })();

  // Análisis por SECTOR con filtros temporales
  const bySector = (() => {
    const map = new Map();
    ventasFiltradas.forEach(v => {
      const producto = productos.find(p => p.id === v.producto_id);
      const operador = producto && operadores.find(o => o.id === producto.operador_id);
      if (!operador) return;
      
      let sector = operador.sector || operador.tipo || operador.categoria || "Sin sector";
      
      const operadorNormalizado = operador.nombre.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      
      if (operadorNormalizado.includes('segurma') || operadorNormalizado.includes('securit')) {
        sector = 'seguridad';
      } else if (operadorNormalizado.includes('energia') || operadorNormalizado.includes('electric')) {
        sector = 'energia';
      } else if (operadorNormalizado.includes('telefon') || operadorNormalizado.includes('movil') || operadorNormalizado.includes('masmovil')) {
        sector = 'telefonia';
      }
      
      const current = map.get(sector) || { 
        ventas: 0, 
        facturacion: 0,
        bruto: 0, 
        neto: 0 
      };
      map.set(sector, {
        ventas: current.ventas + 1,
        facturacion: current.facturacion + (Number(v.pvp) || 0),
        bruto: current.bruto + (v._calc?.ok ? v._calc.detalle.comBruta : 0),
        neto: current.neto + (v._calc?.ok ? v._calc.detalle.netoColab : 0)
      });
    });
    
    return [...map.entries()].sort((a, b) => b[1].facturacion - a[1].facturacion);
  })();

  // Análisis por FAMILIA
  const byFamilia = (() => {
    const map = new Map();
    ventas.forEach(v => {
      const producto = productos.find(p => p.id === v.producto_id);
      if (!producto) return;
      
      const familia = producto.familia || "Sin clasificar";
      const current = map.get(familia) || { 
        ventas: 0, 
        facturacion: 0,
        bruto: 0, 
        margen: 0 
      };
      map.set(familia, {
        ventas: current.ventas + 1,
        facturacion: current.facturacion + (Number(v.pvp) || 0),
        bruto: current.bruto + (v._calc?.ok ? v._calc.detalle.comBruta : 0),
        margen: current.margen + (v._calc?.ok ? v._calc.detalle.margenEmpresa : 0)
      });
    });
    return [...map.entries()].sort((a, b) => b[1].facturacion - a[1].facturacion);
  })();

  // Análisis por ZONA geográfica
  const byZona = (() => {
    const map = new Map();
    ventas.forEach(v => {
      const zona = zonas.find(z => z.id === v.zona_id);
      if (!zona) return;
      
      const current = map.get(zona.nombre) || { ventas: 0, facturacion: 0, impuestos: 0 };
      map.set(zona.nombre, {
        ventas: current.ventas + 1,
        facturacion: current.facturacion + (Number(v.pvp) || 0),
        impuestos: current.impuestos + ((Number(v.pvp) || 0) * (zona.impuesto_pct || 0))
      });
    });
    return [...map.entries()].sort((a, b) => b[1].facturacion - a[1].facturacion);
  })();

  // Top colaboradores con filtros temporales
  const topColaboradores = (() => {
    const map = new Map();
    ventasFiltradas.forEach(v => {
      const colab = colaboradores.find(c => c.id === v.colaborador_id);
      if (!colab) return;
      
      const current = map.get(colab.id) || { 
        nombre: colab.nombre, 
        ventas: 0, 
        facturacion: 0,
        neto: 0, 
        bruto: 0 
      };
      map.set(colab.id, {
        nombre: colab.nombre,
        ventas: current.ventas + 1,
        facturacion: current.facturacion + (Number(v.pvp) || 0),
        neto: current.neto + (v._calc?.ok ? v._calc.detalle.netoColab : 0),
        bruto: current.bruto + (v._calc?.ok ? v._calc.detalle.comBruta : 0)
      });
    });
    return [...map.entries()]
      .map(([id, data]) => ({ id, ...data }))
      .sort((a, b) => b.facturacion - a.facturacion)
      .slice(0, 5);
  })();

  // Top productos con filtros temporales
  const topProductos = (() => {
    const map = new Map();
    ventasFiltradas.forEach(v => {
      const producto = productos.find(p => p.id === v.producto_id);
      if (!producto) return;
      
      const current = map.get(producto.id) || { 
        nombre: producto.nombre, 
        familia: producto.familia || "Sin clasificar",
        ventas: 0, 
        facturacion: 0,
        margen: 0 
      };
      map.set(producto.id, {
        nombre: producto.nombre,
        familia: producto.familia || "Sin clasificar",
        ventas: current.ventas + 1,
        facturacion: current.facturacion + (Number(v.pvp) || 0),
        margen: current.margen + (v._calc?.ok ? v._calc.detalle.margenEmpresa : 0)
      });
    });
    return [...map.entries()]
      .map(([id, data]) => ({ id, ...data }))
      .sort((a, b) => b.facturacion - a.facturacion)
      .slice(0, 5);
  })();

  // Evolución temporal configurable por período
  const evolucionTemporal = (() => {
    const map = new Map();
    ventas.forEach(v => {
      const fecha = v.fecha || "";
      if (!fecha) return;

      let clave = "";
      if (periodoEvolucion === 'anual') {
        clave = fecha.slice(0, 4);
      } else if (periodoEvolucion === 'trimestral') {
        const año = fecha.slice(0, 4);
        const mes = parseInt(fecha.slice(5, 7));
        const trimestre = Math.ceil(mes / 3);
        clave = `${año} T${trimestre}`;
      } else {
        clave = fecha.slice(0, 7);
      }

      const current = map.get(clave) || { ventas: 0, facturacion: 0, margen: 0 };
      map.set(clave, {
        ventas: current.ventas + 1,
        facturacion: current.facturacion + (Number(v.pvp) || 0),
        margen: current.margen + (v._calc?.ok ? v._calc.detalle.margenEmpresa : 0)
      });
    });

    const entries = [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]));
    
    if (periodoEvolucion === 'anual') {
      return entries.slice(-3);
    } else if (periodoEvolucion === 'trimestral') {
      return entries.slice(-8);
    } else {
      return entries.slice(-6);
    }
  })();

  const { comBruta, margen } = kpis;
  const crecimiento = comBruta > 0 ? ((comBruta - 10000) / 10000) * 100 : 0;

  // Iconos por sector
  const getSectorIcon = (sector) => {
    const sectorLower = (sector || "").toLowerCase();
    
    if (sectorLower.includes('telefon') || sectorLower.includes('movil') || sectorLower.includes('telecom')) {
      return <Phone className="w-5 h-5 text-gray-600 dark:text-gray-400" />;
    }
    if (sectorLower.includes('energia') || sectorLower.includes('electric') || sectorLower.includes('luz') || sectorLower.includes('gas')) {
      return <Zap className="w-5 h-5 text-gray-600 dark:text-gray-400" />;
    }
    if (sectorLower.includes('seguridad') || sectorLower.includes('alarma') || sectorLower.includes('security')) {
      return <Shield className="w-5 h-5 text-gray-600 dark:text-gray-400" />;
    }
    if (sectorLower.includes('fibra') || sectorLower.includes('internet') || sectorLower.includes('adsl')) {
      return <Phone className="w-5 h-5 text-gray-600 dark:text-gray-400" />;
    }
    return <Briefcase className="w-5 h-5 text-gray-600 dark:text-gray-400" />;
  };

  // Componente para mostrar mensaje de configuración inicial
  const ConfigurationPrompt = ({ title, description, icon: Icon }) => (
    <div className="text-center py-8">
      {Icon && <Icon className="w-12 h-12 mx-auto text-slate-300 dark:text-gray-600 mb-4" />}
      <h3 className="text-lg font-medium text-slate-600 dark:text-gray-400 mb-2">{title}</h3>
      <p className="text-slate-500 dark:text-gray-500 text-sm mb-4">{description}</p>
      <div className="flex items-center justify-center gap-2 text-amber-600 dark:text-amber-400 text-sm">
        <AlertCircle className="w-4 h-4" />
        <span>Configura tu sistema para ver datos</span>
      </div>
    </div>
  );


  // Mostrar loading mientras se cargan los datos
  if (!dataInitialized) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-slate-200 rounded w-1/4" />
          <div className="h-64 bg-slate-200 rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <StatusWidgets />
      {/* Acciones Rápidas en su propia fila */}
      <div className="mb-6">
        <QuickActions 
          onNewVenta={() => handleNavigate('ventas', { openModal: 'nueva' })}
          onImportExcel={() => handleNavigate('importar')}
          onExportData={() => handleNavigate('ventas')}
          onViewAnalytics={() => handleNavigate('dashboard')}
          onManageUsers={() => handleNavigate('colaboradores')}
          onOpenSettings={() => handleNavigate('config')}
        />
      </div>

      {/* Estadísticas Rápidas en su propia fila */}
      <div className="mb-6">
        <QuickStats 
          stats={[
            {
              icon: Euro,
              title: "Facturación",
              value: euro(facturacionTotal),
              subtitle: "Total registrado",
              color: "text-emerald-600",
              bgColor: "bg-emerald-50"
            },
            {
              icon: Target,
              title: "Comisiones",
              value: euro(kpis.comBruta),
              subtitle: "Total calculado",
              color: "text-blue-600",
              bgColor: "bg-blue-50"
            },
            {
              icon: BarChart3,
              title: "Ventas",
              value: total.toString(),
              subtitle: "Total registradas",
              color: "text-purple-600",
              bgColor: "bg-purple-50"
            },
            {
              icon: Award,
              title: "Ticket Medio",
              value: euro(ticketMedio),
              subtitle: "Por venta",
              color: "text-amber-600",
              bgColor: "bg-amber-50"
            }
          ]}
        />
      </div>

      {/* Alertas Inteligentes en su propia fila */}
      <div className="mb-6">
        <SmartAlerts 
          alerts={(() => {
            const alerts = [];
            const ventasSinCalcular = ventas.filter(v => !v._calc?.ok).length;
            const ventasPendientes = ventas.filter(v => v.estado === 'Borrador' || v.estado === 'Confirmada').length;
            
            if (ventasSinCalcular > 0) {
              alerts.push({
                type: 'warning',
                icon: AlertTriangle,
                title: 'Comisiones Pendientes',
                message: `${ventasSinCalcular} ventas sin calcular comisiones`,
                priority: 'high',
                action: {
                  label: 'Ver Ventas',
                  onClick: () => handleNavigate('ventas')
                }
              });
            }
            
            if (ventasPendientes > 0) {
              alerts.push({
                type: 'info',
                icon: Clock,
                title: 'Ventas en Proceso',
                message: `${ventasPendientes} ventas pendientes de cerrar`,
                priority: 'normal',
                action: {
                  label: 'Revisar',
                  onClick: () => handleNavigate('ventas', { 
                    filtros: { estado: ['Borrador', 'Confirmada'] },
                    titulo: 'Ventas Pendientes'
                  })
                }
              });
            }
            
            if (alerts.length === 0) {
              alerts.push({
                type: 'success',
                icon: CheckCircle,
                title: 'Todo en Orden',
                message: 'No hay alertas importantes en este momento',
                priority: 'low'
              });
            }
            
            return alerts;
          })()}
        />
      </div>

      {/* Sección Crítica: Estados de Ventas - LO MÁS IMPORTANTE */}
      <VentasEnProceso 
        ventas={ventas}
        onNavigate={handleNavigate}
      />

      {/* Filtros Personalizados para Acceso Rápido */}
      <FiltrosPersonalizados ventas={ventasCalculadas} onNavigate={handleNavigate} />
      
      {/* Análisis de Rendimiento - Operadores y Productos */}
      <AnalisisRendimiento 
        ventas={ventas}
        productos={productos}
        operadores={operadores}
        onNavigate={handleNavigate}
      />

      {/* Alerta si no hay datos calculados */}
      {!hayDatos && total > 0 && (
        <Card className="border-amber-200 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20">
          <div className="flex items-center gap-3 text-amber-800 dark:text-amber-300">
            <AlertCircle className="w-5 h-5" />
            <div>
              <p className="font-medium">Tienes {total} ventas pero sin comisiones calculadas</p>
              <p className="text-sm">Ve a la sección de Ventas y calcula las comisiones para ver métricas detalladas</p>
            </div>
          </div>
        </Card>
      )}

      {/* Métricas principales del sistema */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <div className="rounded-2xl p-4 border border-slate-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm transition-colors duration-300">
          <div className="text-center">
            <p className="text-slate-600 dark:text-gray-400 text-xs font-medium">Colaboradores</p>
            <p className="text-2xl font-bold text-slate-800 dark:text-white">{colaboradores.length}</p>
            {colaboradores.length === 0 && (
              <p className="text-xs text-amber-600 dark:text-amber-400">Añade colaboradores</p>
            )}
          </div>
        </div>
        <div className="rounded-2xl p-4 border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900 shadow-sm transition-colors duration-300">
          <div className="text-center">
            <p className="text-green-700 dark:text-green-200 text-xs font-medium">Operadores</p>
            <p className="text-2xl font-bold text-green-900 dark:text-green-100">{operadores.length}</p>
            {operadores.length === 0 && (
              <p className="text-xs text-amber-600 dark:text-amber-400">Configura operadores</p>
            )}
          </div>
        </div>
        <div className="rounded-2xl p-4 border border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-900 shadow-sm transition-colors duration-300">
          <div className="text-center">
            <p className="text-purple-700 dark:text-purple-200 text-xs font-medium">Productos</p>
            <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">{productos.length}</p>
            {productos.length === 0 && (
              <p className="text-xs text-amber-600 dark:text-amber-400">Añade productos</p>
            )}
          </div>
        </div>
        <div className="rounded-2xl p-4 border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900 shadow-sm transition-colors duration-300">
          <div className="text-center">
            <p className="text-blue-700 dark:text-blue-200 text-xs font-medium">Zonas</p>
            <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">{zonas.length}</p>
            {zonas.length === 0 && (
              <p className="text-xs text-amber-600 dark:text-amber-400">Define zonas</p>
            )}
          </div>
        </div>
        <div className="rounded-2xl p-4 border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900 shadow-sm transition-colors duration-300">
          <div className="text-center">
            <p className="text-amber-700 dark:text-amber-200 text-xs font-medium">Ventas</p>
            <p className="text-2xl font-bold text-amber-900 dark:text-amber-100">{total}</p>
            {total === 0 && (
              <p className="text-xs text-amber-600 dark:text-amber-400">Registra ventas</p>
            )}
          </div>
        </div>
      </div>

      {/* Filtro temporal para análisis */}
      <div className="flex items-center justify-between bg-gradient-to-r from-slate-100 to-slate-200 dark:from-gray-700 dark:to-gray-800 rounded-xl p-4 mb-6 transition-colors duration-300">
        <div className="flex items-center gap-3">
          <Calendar className="w-5 h-5 text-slate-600 dark:text-gray-400" />
          <div>
            <h3 className="font-medium text-slate-800 dark:text-gray-200">Período de Análisis</h3>
            <p className="text-sm text-slate-600 dark:text-gray-400">Aplica a análisis por sector, colaboradores y productos</p>
          </div>
        </div>
        <select 
          className="border border-slate-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white transition-colors duration-300"
          value={periodoAnalisis}
          onChange={(e) => setPeriodoAnalisis(e.target.value)}
        >
          <option value="todo">Todo el tiempo</option>
          <option value="ultimo_trimestre">Último trimestre</option>
          <option value="ultimo_año">Último año</option>
        </select>
      </div>

      {/* KPIs principales - refactorizado */}
      <KPIsPanel
        kpis={kpis}
        hayDatos={hayDatos}
        total={total}
        ticketMedio={ticketMedio}
        facturacionTotal={facturacionTotal}
        byEstado={byEstado}
        crecimiento={crecimiento}
      />

      {/* Análisis por Sector y Familia */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <div className="flex items-center justify-between mb-4">
            <SectionTitle>
              Análisis por Sector
              {periodoAnalisis !== 'todo' && (
                <span className="text-xs text-slate-500 dark:text-gray-400 ml-2 font-normal">
                  ({periodoAnalisis === 'ultimo_trimestre' ? 'últimos 3 meses' : 'último año'})
                </span>
              )}
            </SectionTitle>
          </div>
          
          <div className="space-y-3">
            {bySector.length > 0 ? (
              bySector.map(([sector, data]) => (
                <div key={sector} className="flex items-center justify-between p-3 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-gray-700 dark:to-gray-600 rounded-xl transition-colors duration-300">
                  <div className="flex items-center space-x-3">
                    <div className="text-slate-600 dark:text-gray-400">
                      {getSectorIcon(sector)}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-700 dark:text-gray-200 capitalize">{sector}</p>
                      <p className="text-xs text-slate-500 dark:text-gray-400">{data.ventas} ventas</p>
                    </div>
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
              <ConfigurationPrompt
                icon={PieChart}
                title="Sin datos por sector"
                description="Añade operadores y productos para ver análisis por sector"
              />
            )}
          </div>
        </Card>

        <Card>
          <SectionTitle>Análisis por Familia</SectionTitle>
          <div className="space-y-3">
            {byFamilia.length > 0 ? (
              byFamilia.map(([familia, data]) => (
                <div key={familia} className="flex items-center justify-between p-3 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-gray-700 dark:to-gray-600 rounded-xl transition-colors duration-300">
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
              <ConfigurationPrompt
                icon={Target}
                title="Sin datos por familia"
                description="Clasifica tus productos por familia para ver este análisis"
              />
            )}
          </div>
        </Card>
      </div>

      {/* Distribución Geográfica y Evolución - refactorizado */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <SectionTitle>Distribución Geográfica</SectionTitle>
          <GeoDistributionPanel byZona={byZona} hayDatos={hayDatos} />
        </Card>
        <Card>
          <div className="flex items-center justify-between mb-4">
            <SectionTitle>Evolución Temporal</SectionTitle>
            <select 
              className="text-xs border border-slate-300 dark:border-gray-600 rounded-lg px-2 py-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-300"
              value={periodoEvolucion}
              onChange={(e) => setPeriodoEvolucion(e.target.value)}
            >
              <option value="semestral">Últimos 6 meses</option>
              <option value="trimestral">Últimos 8 trimestres</option>
              <option value="anual">Últimos 3 años</option>
            </select>
          </div>
          <EvolucionTemporalPanel evolucionTemporal={evolucionTemporal} periodoEvolucion={periodoEvolucion} hayDatos={hayDatos} />
        </Card>
      </div>

      {/* Rankings mejorados - refactorizado */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <SectionTitle>
            Top Colaboradores
            {periodoAnalisis !== 'todo' && (
              <span className="text-xs text-slate-500 dark:text-gray-400 ml-2 font-normal">
                ({periodoAnalisis === 'ultimo_trimestre' ? 'últimos 3 meses' : 'último año'})
              </span>
            )}
          </SectionTitle>
          <TopColaboradoresPanel topColaboradores={topColaboradores} hayDatos={hayDatos} periodoAnalisis={periodoAnalisis} />
        </Card>
        <Card>
          <SectionTitle>
            Top Productos
            {periodoAnalisis !== 'todo' && (
              <span className="text-xs text-slate-500 dark:text-gray-400 ml-2 font-normal">
                ({periodoAnalisis === 'ultimo_trimestre' ? 'últimos 3 meses' : 'último año'})
              </span>
            )}
          </SectionTitle>
          <TopProductosPanel topProductos={topProductos} hayDatos={hayDatos} periodoAnalisis={periodoAnalisis} />
        </Card>
      </div>

      {/* Métricas adicionales mejoradas - refactorizado */}
      <ExtraMetricsPanel ticketMedio={ticketMedio} irpfMedio={irpfMedio} total={total} byEstado={byEstado} margen={margen} facturacionTotal={facturacionTotal} hayDatos={hayDatos} />

      {/* Nuevos KPIs de tendencias y productividad - refactorizado */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <SectionTitle>Tendencias del Negocio</SectionTitle>
          <TendenciasPanel evolucionTemporal={evolucionTemporal} periodoEvolucion={periodoEvolucion} topProductos={topProductos} topColaboradores={topColaboradores} />
        </Card>
        <Card>
          <SectionTitle>Análisis de Productividad</SectionTitle>
          <ProductividadPanel colaboradores={colaboradores} total={total} topColaboradores={topColaboradores} topProductos={topProductos} facturacionTotal={facturacionTotal} margen={margen} comBruta={comBruta} hayDatos={hayDatos} />
        </Card>
      </div>

      {/* Estados de ventas - refactorizado */}
      <Card>
        <SectionTitle>Pipeline de Ventas</SectionTitle>
        <PipelinePanel byEstado={byEstado} total={total} />
      </Card>

      {/* Nuevos widgets de análisis - refactorizado */}
      <AnalysisWidgets 
        ventas={ventas}
        productos={productos}
        operadores={operadores}
        colaboradores={colaboradores}
        onNavigate={handleNavigate}
        currentFilters={{}}
        onApplyFilters={() => {}}
      />
    </div>
  );
}