import { useContext, useState, useEffect } from "react";
import * as Tooltip from '@radix-ui/react-tooltip';
import { useNavigate } from "react-router-dom";
import { DataCtx } from "../context/contexts";
import Loading from "./common/Loading";
import Card from "./ui/Card";
import SectionTitle from "./ui/SectionTitle";
import QuickActions from "./widgets/QuickActions";
import SmartAlerts from "./widgets/SmartAlerts";
import QuickStats from "./widgets/QuickStats";
import VentasEnProceso from "./widgets/VentasEnProceso";
import AnalisisRendimiento from "./widgets/AnalisisRendimiento";
import FiltrosPersonalizados from "./widgets/FiltrosPersonalizados";
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
  Plus
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
    
    // Manejar ventas con modal (Nueva Venta)
    if (route === 'ventas' && options.openModal) {
      navigate(`/${route}?modal=${options.openModal}`);
      return;
    }
    
    // Navegación simple
    navigate(`/${route}`);
  };
  
  // Usar el contexto de datos
  const { data, dataInitialized } = useContext(DataCtx);
  useEffect(() => {
    console.log('[Dashboard] dataInitialized changed:', dataInitialized);
  }, [dataInitialized]);
  const ventas = Array.isArray(data?.ventas) ? data.ventas : [];
  const productos = Array.isArray(data?.productos) ? data.productos : [];
  const operadores = Array.isArray(data?.operadores) ? data.operadores : [];
  const colaboradores = Array.isArray(data?.colaboradores) ? data.colaboradores : [];
  const zonas = Array.isArray(data?.zonas) ? data.zonas : [];
  const liquidaciones = Array.isArray(data?.liquidaciones) ? data.liquidaciones : [];

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
    let comPagada = 0;
    let margen = 0;

    ventasCalculadas.forEach(v => {
      comBruta += v._calc.detalle.comBruta || 0;
      comPagada += v._calc.detalle.netoColab || 0;
      margen += v._calc.detalle.margenEmpresa || 0;
    });

    return { comBruta, comPagada, margen };
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

  const { comBruta, comPagada, margen } = kpis;
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
    return <Loading message="Cargando dashboard..." />;
  }

  return (
    <div className="space-y-6">
      {/* Dashboard Mejorado - Sección Superior Prioritaria */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna 1: Acciones Rápidas */}
        <div className="lg:col-span-1">
          <QuickActions onNavigate={handleNavigate} />
        </div>
        
        {/* Columna 2: Estadísticas Rápidas */}
        <div className="lg:col-span-2">
          <QuickStats 
            ventas={ventas} 
            colaboradores={colaboradores} 
            liquidaciones={liquidaciones} 
          />
        </div>
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

      {/* Alertas del Sistema */}
      <SmartAlerts 
        ventas={ventas}
        colaboradores={colaboradores}
        productos={productos}
        liquidaciones={liquidaciones}
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

      {/* KPIs principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI: Comisión Bruta / Facturación Total */}
        <Tooltip.Root delayDuration={200}>
          <Tooltip.Trigger asChild>
            <div className="bg-gradient-to-br from-sky-200 to-sky-300 dark:from-sky-700 dark:to-sky-800 rounded-2xl p-6 text-slate-700 dark:text-gray-200 cursor-help transition-colors duration-300">
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
          </Tooltip.Trigger>
          <Tooltip.Portal>
            <Tooltip.Content side="top" align="center" className="z-50 px-3 py-2 rounded-lg bg-slate-900 text-white text-xs shadow-lg animate-fadeIn" style={{ pointerEvents: 'auto' }}>
              {hayDatos
                ? 'Suma total de comisiones brutas generadas por todas las ventas con cálculo correcto.'
                : 'Facturación total de todas las ventas registradas, sin descontar comisiones.'}
              <Tooltip.Arrow className="fill-slate-900" />
            </Tooltip.Content>
          </Tooltip.Portal>
        </Tooltip.Root>

        {/* KPI: Comisión Pagada / Ticket Medio */}
        <Tooltip.Root delayDuration={200}>
          <Tooltip.Trigger asChild>
            <div className="bg-gradient-to-br from-emerald-200 to-emerald-300 dark:from-emerald-700 dark:to-emerald-800 rounded-2xl p-6 text-slate-700 dark:text-gray-200 cursor-help transition-colors duration-300">
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
          </Tooltip.Trigger>
          <Tooltip.Portal>
            <Tooltip.Content side="top" align="center" className="z-50 px-3 py-2 rounded-lg bg-slate-900 text-white text-xs shadow-lg animate-fadeIn" style={{ pointerEvents: 'auto' }}>
              {hayDatos
                ? 'Total neto pagado a colaboradores por comisiones de ventas.'
                : 'Promedio de facturación por cada venta registrada.'}
              <Tooltip.Arrow className="fill-slate-900" />
            </Tooltip.Content>
          </Tooltip.Portal>
        </Tooltip.Root>

        {/* KPI: Margen Empresa / Ventas Cerradas */}
        <Tooltip.Root delayDuration={200}>
          <Tooltip.Trigger asChild>
            <div className="bg-gradient-to-br from-purple-200 to-purple-300 dark:from-purple-700 dark:to-purple-800 rounded-2xl p-6 text-slate-700 dark:text-gray-200 cursor-help transition-colors duration-300">
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
          </Tooltip.Trigger>
          <Tooltip.Portal>
            <Tooltip.Content side="top" align="center" className="z-50 px-3 py-2 rounded-lg bg-slate-900 text-white text-xs shadow-lg animate-fadeIn" style={{ pointerEvents: 'auto' }}>
              {hayDatos
                ? 'Margen neto que obtiene la empresa tras pagar comisiones a colaboradores.'
                : 'Cantidad de ventas que han sido cerradas con éxito.'}
              <Tooltip.Arrow className="fill-slate-900" />
            </Tooltip.Content>
          </Tooltip.Portal>
        </Tooltip.Root>

        {/* KPI: Ventas Totales / Ventas Liquidadas */}
        <Tooltip.Root delayDuration={200}>
          <Tooltip.Trigger asChild>
            <div className="bg-gradient-to-br from-rose-200 to-rose-300 dark:from-rose-700 dark:to-rose-800 rounded-2xl p-6 text-slate-700 dark:text-gray-200 cursor-help transition-colors duration-300">
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
          </Tooltip.Trigger>
          <Tooltip.Portal>
            <Tooltip.Content side="top" align="center" className="z-50 px-3 py-2 rounded-lg bg-slate-900 text-white text-xs shadow-lg animate-fadeIn" style={{ pointerEvents: 'auto' }}>
              {hayDatos
                ? 'Número total de ventas registradas en el sistema.'
                : 'Ventas que han sido completamente liquidadas y procesadas.'}
              <Tooltip.Arrow className="fill-slate-900" />
            </Tooltip.Content>
          </Tooltip.Portal>
        </Tooltip.Root>
      </div>

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

      {/* Distribución Geográfica y Evolución */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <SectionTitle>Distribución Geográfica</SectionTitle>
          <div className="space-y-3">
            {byZona.length > 0 ? (
              byZona.map(([zona, data]) => (
                <div key={zona} className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 rounded-xl transition-colors duration-300">
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
              <ConfigurationPrompt
                icon={MapPin}
                title="Sin datos geográficos"
                description="Define zonas y asígnalas a tus ventas"
              />
            )}
          </div>
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
          
          <div className="h-80 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-gray-700 dark:to-gray-800 rounded-xl p-4 transition-colors duration-300">
            {evolucionTemporal.length > 0 ? (
              <div className="h-full flex flex-col">
                <div className="text-xs text-slate-500 dark:text-gray-400 mb-4">
                  {periodoEvolucion === 'anual' ? 'Por años' : 
                   periodoEvolucion === 'trimestral' ? 'Por trimestres' : 'Por meses'} • 
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
              <ConfigurationPrompt
                icon={Calendar}
                title="Sin datos temporales"
                description="Registra ventas con fechas para ver la evolución"
              />
            )}
          </div>
        </Card>
      </div>

      {/* Rankings mejorados */}
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
          <div className="space-y-3">
            {topColaboradores.length > 0 ? (
              topColaboradores.map((colab, index) => (
                <div
                  key={colab.id}
                  className="flex items-center justify-between p-3 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-gray-700 dark:to-gray-600 rounded-xl transition-colors duration-300"
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-slate-700 dark:text-gray-200 text-sm font-bold transition-colors duration-300 ${
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
              <ConfigurationPrompt
                icon={Users}
                title="Sin datos de colaboradores"
                description="Registra ventas asignadas a colaboradores"
              />
            )}
          </div>
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
          <div className="space-y-3">
            {topProductos.length > 0 ? (
              topProductos.map((producto, index) => (
                <div
                  key={producto.id}
                  className="flex items-center justify-between p-3 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-gray-700 dark:to-gray-600 rounded-xl transition-colors duration-300"
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-slate-700 dark:text-gray-200 text-sm font-bold transition-colors duration-300 ${
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
              <ConfigurationPrompt
                icon={Target}
                title="Sin datos de productos"
                description="Registra ventas de productos para ver el ranking"
              />
            )}
          </div>
        </Card>
      </div>

      {/* Métricas adicionales mejoradas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <div className="flex items-center justify-between p-3 bg-gradient-to-r from-amber-50 to-amber-100 dark:from-amber-900/30 dark:to-amber-800/30 rounded-xl transition-colors duration-300">
            <div>
              <p className="text-sm font-medium text-slate-700 dark:text-gray-200">Ticket Medio</p>
              <p className="text-xl font-bold text-slate-800 dark:text-gray-200">{euro(ticketMedio)}</p>
              <p className="text-xs text-slate-500 dark:text-gray-400">Por venta</p>
            </div>
            <Euro className="w-6 h-6 text-amber-600 dark:text-amber-400" />
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between p-3 bg-gradient-to-r from-indigo-50 to-indigo-100 dark:from-indigo-900/30 dark:to-indigo-800/30 rounded-xl transition-colors duration-300">
            <div>
              <p className="text-sm font-medium text-slate-700 dark:text-gray-200">IRPF Medio</p>
              <p className="text-xl font-bold text-slate-800 dark:text-gray-200">
                {hayDatos ? `${irpfMedio.toFixed(1)}%` : "N/A"}
              </p>
              <p className="text-xs text-slate-500 dark:text-gray-400">Retención fiscal</p>
            </div>
            <TrendingUp className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between p-3 bg-gradient-to-r from-emerald-50 to-emerald-100 dark:from-emerald-900/30 dark:to-emerald-800/30 rounded-xl transition-colors duration-300">
            <div>
              <p className="text-sm font-medium text-slate-700 dark:text-gray-200">Tasa Cierre</p>
              <p className="text-xl font-bold text-slate-800 dark:text-gray-200">
                {total > 0 ? (((byEstado.Cerrada || 0) / total) * 100).toFixed(1) : 0}%
              </p>
              <p className="text-xs text-slate-500 dark:text-gray-400">Conversión a cerrado</p>
            </div>
            <Award className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between p-3 bg-gradient-to-r from-rose-50 to-rose-100 dark:from-rose-900/30 dark:to-rose-800/30 rounded-xl transition-colors duration-300">
            <div>
              <p className="text-sm font-medium text-slate-700 dark:text-gray-200">Rentabilidad</p>
              <p className="text-xl font-bold text-slate-800 dark:text-gray-200">
                {hayDatos && facturacionTotal > 0 ? 
                  `${((margen / facturacionTotal) * 100).toFixed(1)}%` : 
                  "N/A"
                }
              </p>
              <p className="text-xs text-slate-500 dark:text-gray-400">Margen sobre ventas</p>
            </div>
            <PieChart className="w-6 h-6 text-rose-600 dark:text-rose-400" />
          </div>
        </Card>
      </div>

      {/* Nuevos KPIs de tendencias y productividad */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <SectionTitle>Tendencias del Negocio</SectionTitle>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gradient-to-br from-cyan-50 to-cyan-100 dark:from-cyan-900/30 dark:to-cyan-800/30 p-4 rounded-xl transition-colors duration-300">
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
            
            <div className="bg-gradient-to-br from-teal-50 to-teal-100 dark:from-teal-900/30 dark:to-teal-800/30 p-4 rounded-xl transition-colors duration-300">
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
              <p className="text-xs text-slate-500 dark:text-gray-400">
                {evolucionTemporal.length > 0 
                  ? (() => {
                      const mejorPeriodo = evolucionTemporal.find(([, data]) => 
                        data.ventas === Math.max(...evolucionTemporal.map(([, d]) => d.ventas))
                      )?.[0];
                      
                      if (periodoEvolucion === 'semestral') {
                        return new Date(mejorPeriodo + '-01')?.toLocaleDateString('es-ES', { month: 'short', year: 'numeric' }) || '';
                      } else if (periodoEvolucion === 'anual') {
                        return mejorPeriodo;
                      } else {
                        return mejorPeriodo;
                      }
                    })()
                  : 'N/A'
                }
              </p>
            </div>

            <div className="bg-gradient-to-br from-violet-50 to-violet-100 dark:from-violet-900/30 dark:to-violet-800/30 p-4 rounded-xl transition-colors duration-300">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-slate-700 dark:text-gray-200">Productos Activos</span>
                <Target className="w-4 h-4 text-violet-600 dark:text-violet-400" />
              </div>
              <p className="text-lg font-bold text-slate-800 dark:text-gray-200">
                {topProductos.length}
              </p>
              <p className="text-xs text-slate-500 dark:text-gray-400">Con ventas</p>
            </div>

            <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/30 dark:to-orange-800/30 p-4 rounded-xl transition-colors duration-300">
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
        </Card>

        <Card>
          <SectionTitle>Análisis de Productividad</SectionTitle>
          <div className="space-y-4">
            <div className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-gray-700 dark:to-gray-600 p-4 rounded-xl transition-colors duration-300">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold text-slate-700 dark:text-gray-200">Productividad por Colaborador</h4>
                <BarChart3 className="w-4 h-4 text-slate-600 dark:text-gray-400" />
              </div>
              <div className="text-2xl font-bold text-slate-800 dark:text-gray-200 mb-1">
                {colaboradores.length > 0 && total > 0 
                  ? (total / topColaboradores.length || 1).toFixed(1)
                  : 0
                } ventas
              </div>
              <p className="text-xs text-slate-500 dark:text-gray-400">Promedio por colaborador activo</p>
            </div>

            <div className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-gray-700 dark:to-gray-600 p-4 rounded-xl transition-colors duration-300">
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
              <div className="bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/30 p-4 rounded-xl transition-colors duration-300">
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
        </Card>
      </div>

      {/* Estados de ventas */}
      <Card>
        <SectionTitle>Pipeline de Ventas</SectionTitle>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Borradores", count: byEstado.Borrador || 0, color: "bg-amber-300 dark:bg-amber-600", textColor: "text-amber-800 dark:text-amber-200" },
            { label: "Confirmadas", count: byEstado.Confirmada || 0, color: "bg-emerald-300 dark:bg-emerald-600", textColor: "text-emerald-800 dark:text-emerald-200" },
            { label: "Cerradas", count: byEstado.Cerrada || 0, color: "bg-sky-300 dark:bg-sky-600", textColor: "text-sky-800 dark:text-sky-200" },
            { label: "Liquidadas", count: byEstado.Liquidada || 0, color: "bg-purple-300 dark:bg-purple-600", textColor: "text-purple-800 dark:text-purple-200" },
          ].map((item) => (
            <div key={item.label} className="text-center p-4 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-gray-700 dark:to-gray-800 rounded-xl transition-colors duration-300">
              <div className={`w-12 h-12 mx-auto mb-2 rounded-full ${item.color} flex items-center justify-center transition-colors duration-300`}>
                <span className={`text-lg font-bold ${item.textColor}`}>{item.count}</span>
              </div>
              <p className="text-sm font-medium text-slate-700 dark:text-gray-200">{item.label}</p>
              <p className="text-xs text-slate-500 dark:text-gray-400">
                {total > 0 ? ((item.count / total) * 100).toFixed(1) : 0}% del total
              </p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}