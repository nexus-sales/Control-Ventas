import { useState } from "react";
import { useData } from "../context/AppContexts";
import Loading from "./common/Loading";
import Card from "./ui/Card";
import SectionTitle from "./ui/SectionTitle";
import DashboardPanels from "./dashboard/DashboardPanels";
import StatusWidgets from "./widgets/StatusWidgets";
import {
  Euro,
  TrendingUp,
  Target,
  BarChart3,
  Users,
  Calendar,
  AlertCircle,
  Phone,
  Shield,
  Zap,
  Briefcase
} from "lucide-react";


export default function Dashboard() {
  // const navigate = useNavigate(); // Eliminado: no se usa
  const { data, dataInitialized } = useData();
  
  const ventas = Array.isArray(data?.ventas) ? data.ventas : [];
  const productos = Array.isArray(data?.productos) ? data.productos : [];
  const operadores = Array.isArray(data?.operadores) ? data.operadores : [];
  const colaboradores = Array.isArray(data?.colaboradores) ? data.colaboradores : [];
  const zonas = Array.isArray(data?.zonas) ? data.zonas : [];

  const total = ventas.length;
  const ventasCalculadas = ventas.filter(v => v._calc?.ok);
  const hayDatos = ventasCalculadas.length > 0;

  const [periodoEvolucion, setPeriodoEvolucion] = useState('semestral');

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

  // Análisis por SECTOR
  const bySector = (() => {
    const map = new Map();
    ventas.forEach(v => {
      const producto = productos.find(p => p.id === v.producto_id);
      const operador = producto && operadores.find(o => o.id === producto.operador_id);
      if (!operador) return;
      
      let sector = operador.sector || operador.tipo || operador.categoria || "Sin sector";
      
      const operadorNormalizado = operador.nombre.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      
      if (operadorNormalizado.includes('segurma') || operadorNormalizado.includes('securit')) {
        sector = 'seguridad';
      } else if (operadorNormalizado.includes('energia') || operadorNormalizado.includes('electric')) {
        sector = 'energia';
      } else if (operadorNormalizado.includes('telefon') || operadorNormalizado.includes('movil')) {
        sector = 'telefonia';
      }
      
      const current = map.get(sector) || { ventas: 0, facturacion: 0, bruto: 0, neto: 0 };
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
      const current = map.get(familia) || { ventas: 0, facturacion: 0, bruto: 0, margen: 0 };
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

  // Top colaboradores
  const topColaboradores = (() => {
    const map = new Map();
    ventas.forEach(v => {
      const colab = colaboradores.find(c => c.id === v.colaborador_id);
      if (!colab) return;
      
      const current = map.get(colab.id) || { nombre: colab.nombre, ventas: 0, facturacion: 0, neto: 0, bruto: 0 };
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

  // Top productos
  const topProductos = (() => {
    const map = new Map();
    ventas.forEach(v => {
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

  // Evolución temporal
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

  const crecimiento = kpis.comBruta > 0 ? ((kpis.comBruta - 10000) / 10000) * 100 : 0;

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
      
      {/* Alerta si no hay datos calculados */}
      {!hayDatos && total > 0 && (
        <Card className="bg-amber-50 border-amber-200">
          <div className="flex items-center gap-3 text-amber-700">
            <AlertCircle className="w-5 h-5" />
            <div>
              <p className="font-medium">Tienes {total} ventas pero sin comisiones calculadas</p>
              <p className="text-sm">Ve a la sección de Ventas y calcula las comisiones para ver métricas detalladas</p>
            </div>
          </div>
        </Card>
      )}

      {/* Métricas principales del sistema */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="p-4">
          <div className="text-center">
            <p className="text-slate-600 text-sm font-medium">Colaboradores</p>
            <p className="text-2xl font-bold text-slate-800">{colaboradores.length}</p>
            {colaboradores.length === 0 && (
              <p className="text-xs text-amber-600">Añade colaboradores</p>
            )}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-center">
            <p className="text-slate-600 text-sm font-medium">Operadores</p>
            <p className="text-2xl font-bold text-slate-800">{operadores.length}</p>
            {operadores.length === 0 && (
              <p className="text-xs text-amber-600">Configura operadores</p>
            )}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-center">
            <p className="text-slate-600 text-sm font-medium">Productos</p>
            <p className="text-2xl font-bold text-slate-800">{productos.length}</p>
            {productos.length === 0 && (
              <p className="text-xs text-amber-600">Añade productos</p>
            )}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-center">
            <p className="text-slate-600 text-sm font-medium">Zonas</p>
            <p className="text-2xl font-bold text-slate-800">{zonas.length}</p>
            {zonas.length === 0 && (
              <p className="text-xs text-amber-600">Define zonas</p>
            )}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-center">
            <p className="text-slate-600 text-sm font-medium">Ventas</p>
            <p className="text-2xl font-bold text-slate-800">{total}</p>
            {total === 0 && (
              <p className="text-xs text-amber-600">Registra ventas</p>
            )}
          </div>
        </Card>
      </div>

      {/* Filtro temporal para análisis */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5 text-slate-600" />
            <div>
              <h3 className="font-medium text-slate-800">Período de Análisis</h3>
              <p className="text-sm text-slate-600">Configurar evolución temporal</p>
            </div>
          </div>
          <select 
            className="border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700"
            value={periodoEvolucion}
            onChange={(e) => setPeriodoEvolucion(e.target.value)}
          >
            <option value="semestral">Últimos 6 meses</option>
            <option value="trimestral">Últimos 8 trimestres</option>
            <option value="anual">Últimos 3 años</option>
          </select>
        </div>
      </Card>

      {/* DASHBOARD PANELS CONSOLIDADO */}
      <DashboardPanels
        kpis={kpis}
        hayDatos={hayDatos}
        total={total}
        ticketMedio={ticketMedio}
        facturacionTotal={facturacionTotal}
        byEstado={byEstado}
        crecimiento={crecimiento}
        topColaboradores={topColaboradores}
        topProductos={topProductos}
        bySector={bySector}
        byFamilia={byFamilia}
        byZona={byZona}
        evolucionTemporal={evolucionTemporal}
        periodoEvolucion={periodoEvolucion}
        colaboradores={colaboradores}
        margen={kpis.margen}
        comBruta={kpis.comBruta}
        irpfMedio={irpfMedio}
      />
    </div>
  );
}