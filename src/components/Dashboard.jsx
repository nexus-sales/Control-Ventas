import { useState, useMemo } from "react";
import { useData } from "../context/AppContexts";
import Card from "./ui/Card";
import SectionTitle from "./ui/SectionTitle";
import DashboardPanels from "./dashboard/DashboardPanels";
import StatusWidgets from "./widgets/StatusWidgets";
import { computeVenta } from "../utils/calculos";
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


const getImporteVenta = (venta) => {
  const pvp = Number(venta?.pvp) || 0;
  const cantidad = Number(venta?.cantidad) || 1;
  return pvp * cantidad;
};


export default function Dashboard() {
  // const navigate = useNavigate(); // Eliminado: no se usa
  const { data, dataInitialized } = useData();

  const ventasRaw = useMemo(
    () => (Array.isArray(data?.ventas) ? data.ventas : []),
    [data?.ventas],
  );

  const productos = useMemo(() => {
    if (!Array.isArray(data?.productos)) return [];
    return data.productos.filter(
      (p, idx, arr) => p.activo !== false && arr.findIndex((x) => x.id === p.id) === idx,
    );
  }, [data?.productos]);

  const operadores = useMemo(() => {
    if (!Array.isArray(data?.operadores)) return [];
    return data.operadores.filter(
      (o, idx, arr) => o.activo !== false && arr.findIndex((x) => x.id === o.id) === idx,
    );
  }, [data?.operadores]);

  const colaboradores = useMemo(() => {
    if (!Array.isArray(data?.colaboradores)) return [];
    return data.colaboradores.filter(
      (c, idx, arr) => c.activo !== false && arr.findIndex((x) => x.id === c.id) === idx,
    );
  }, [data?.colaboradores]);

  const zonas = useMemo(() => {
    if (!Array.isArray(data?.zonas)) return [];
    return data.zonas.filter(
      (z, idx, arr) => z.activo !== false && arr.findIndex((x) => x.id === z.id) === idx,
    );
  }, [data?.zonas]);


  const niveles = useMemo(
    () => (Array.isArray(data?.niveles) ? data.niveles : []),
    [data?.niveles],
  );

  const reglas = useMemo(
    () => (Array.isArray(data?.reglas) ? data.reglas : []),
    [data?.reglas],
  );

  const ventasCalculadas = useMemo(() => {
    if (ventasRaw.length === 0) return [];
    return ventasRaw.map((venta) => ({
      ...venta,
      _calc: computeVenta({
        venta,
        productos,
        operadores,
        zonas,
        colaboradores,
        niveles,
        reglas,
      }),
    }));
  }, [ventasRaw, productos, operadores, zonas, colaboradores, niveles, reglas]);

  const ventas = useMemo(
    () => ventasCalculadas.filter((v) => !v.prueba && !v.duplicada),
    [ventasCalculadas],
  );

  const ventasConCalc = useMemo(
    () => ventas.filter((v) => v._calc?.ok),
    [ventas],
  );

  const total = ventas.length;
  const hayDatos = ventasConCalc.length > 0;

  const zonasKpiCount = useMemo(() => {
    const ventasParaContar = Array.isArray(ventas) ? ventas : [];
    if (ventasParaContar.length === 0) return zonas.length;
    const claves = new Set();
    ventasParaContar.forEach((venta) => {
      const zonaVenta = zonas.find((z) => z.id === venta.zona_id) || {};
      const base = (zonaVenta.codigo || zonaVenta.nombre || venta.zona_id || "")
        .toString()
        .trim()
        .normalize("NFD")
        .replace(/[^\w]/g, "")
        .toUpperCase();
      if (!base) return;
      if (base.includes("CANARI")) {
        claves.add("CANARIAS");
      } else if (base.includes("PENIN") || base.includes("MAINLAND") || base.includes("ESPANA") || base.includes("BALEA")) {
        claves.add("PENINSULA");
      } else {
        claves.add(base);
      }
    });
    return claves.size || zonas.length;
  }, [ventas, zonas]);

  const [periodoEvolucion, setPeriodoEvolucion] = useState('semestral');

  // Estados de ventas
  const estadoBuckets = {
    Borrador: ["BORRADOR"],
    Confirmada: ["CONFIRMADA", "CONFIRMADO"],
    Cerrada: ["CERRADA", "CERRADO"],
    Liquidada: ["LIQUIDADA", "LIQUIDADO"],
    Instalada: ["INSTALADA", "INSTALADO"],
    Activa: ["ACTIVO", "ACTIVADO", "ACTIVA"],
    Pendiente: ["PENDIENTE"],
  };

  const byEstado = useMemo(() => {
    const counts = {};
    ventas.forEach((venta) => {
      const estadoRaw = (venta.estado || "Sin estado").toString().trim();
      const estadoUpper = estadoRaw.toUpperCase();
      const bucketEntry = Object.entries(estadoBuckets).find(([, variants]) =>
        variants.includes(estadoUpper),
      );
      if (bucketEntry) {
        const [label] = bucketEntry;
        counts[label] = (counts[label] || 0) + 1;
      } else {
        counts[estadoRaw] = (counts[estadoRaw] || 0) + 1;
      }
    });
    Object.keys(estadoBuckets).forEach((label) => {
      if (counts[label] === undefined) counts[label] = 0;
    });
    return counts;
  }, [ventas]);

  // Métricas básicas
  const facturacionTotal = ventas.reduce((acum, venta) => acum + getImporteVenta(venta), 0);

  const ticketMedio = total ? facturacionTotal / total : 0;

  const irpfDatos = ventasConCalc.map((v) => v._calc.detalle.irpf_pct);
  const irpfMedio = irpfDatos.length
    ? (irpfDatos.reduce((a, b) => a + b, 0) / irpfDatos.length) * 100
    : 0;

  // Calcular KPIs dinámicamente
  const kpis = (() => {
    let comBruta = 0;
    let comPagada = 0;
    let margen = 0;

    ventasConCalc.forEach(v => {
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

      const importe = getImporteVenta(v);
      
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
        facturacion: current.facturacion + importe,
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
      const importe = getImporteVenta(v);
      const current = map.get(familia) || { ventas: 0, facturacion: 0, bruto: 0, margen: 0 };
      map.set(familia, {
        ventas: current.ventas + 1,
        facturacion: current.facturacion + importe,
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
      
      const importe = getImporteVenta(v);
      const current = map.get(zona.nombre) || { ventas: 0, facturacion: 0, impuestos: 0 };
      map.set(zona.nombre, {
        ventas: current.ventas + 1,
        facturacion: current.facturacion + importe,
        impuestos: current.impuestos + (importe * (zona.impuesto_pct || 0))
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
      
      const importe = getImporteVenta(v);
      const current = map.get(colab.id) || { nombre: colab.nombre, ventas: 0, facturacion: 0, neto: 0, bruto: 0 };
      map.set(colab.id, {
        nombre: colab.nombre,
        ventas: current.ventas + 1,
        facturacion: current.facturacion + importe,
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
      
      const importe = getImporteVenta(v);
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
        facturacion: current.facturacion + importe,
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
      const importe = getImporteVenta(v);
      map.set(clave, {
        ventas: current.ventas + 1,
        facturacion: current.facturacion + importe,
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

  const crecimiento = useMemo(() => {
    const porMes = new Map();
    ventasConCalc.forEach((venta) => {
      const mes = (venta.fecha || "").slice(0, 7);
      if (!mes) return;
      const comision = venta._calc?.detalle?.comBruta || 0;
      porMes.set(mes, (porMes.get(mes) || 0) + comision);
    });
    const entries = [...porMes.entries()].sort((a, b) => a[0].localeCompare(b[0]));
    if (entries.length < 2) return 0;
    const prev = entries[entries.length - 2][1];
    const last = entries[entries.length - 1][1];
    if (prev === 0) return last > 0 ? 100 : 0;
    return ((last - prev) / prev) * 100;
  }, [ventasConCalc]);

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
            <p className="text-slate-600 dark:text-slate-300 text-sm font-medium">Colaboradores</p>
            <p className="text-2xl font-bold text-slate-800 dark:text-white">{colaboradores.length}</p>
            {colaboradores.length === 0 && (
              <p className="text-xs text-amber-600 dark:text-amber-300">Añade colaboradores</p>
            )}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-center">
            <p className="text-slate-600 dark:text-slate-300 text-sm font-medium">Operadores</p>
            <p className="text-2xl font-bold text-slate-800 dark:text-white">{operadores.length}</p>
            {operadores.length === 0 && (
              <p className="text-xs text-amber-600 dark:text-amber-300">Configura operadores</p>
            )}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-center">
            <p className="text-slate-600 dark:text-slate-300 text-sm font-medium">Productos</p>
            <p className="text-2xl font-bold text-slate-800 dark:text-white">{productos.length}</p>
            {productos.length === 0 && (
              <p className="text-xs text-amber-600 dark:text-amber-300">Añade productos</p>
            )}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-center">
            <p className="text-slate-600 dark:text-slate-300 text-sm font-medium">Zonas</p>
            <p className="text-2xl font-bold text-slate-800 dark:text-white">{zonasKpiCount}</p>
            {zonasKpiCount === 0 && (
              <p className="text-xs text-amber-600 dark:text-amber-300">Define zonas</p>
            )}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-center">
            <p className="text-slate-600 dark:text-slate-300 text-sm font-medium">Ventas</p>
            <p className="text-2xl font-bold text-slate-800 dark:text-white">{total}</p>
            {total === 0 && (
              <p className="text-xs text-amber-600 dark:text-amber-300">Registra ventas</p>
            )}
          </div>
        </Card>
      </div>

      {/* Filtro temporal para análisis */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5 text-slate-600 dark:text-slate-300" />
            <div>
              <h3 className="font-medium text-slate-800 dark:text-white">Período de Análisis</h3>
              <p className="text-sm text-slate-600 dark:text-slate-300">Configurar evolución temporal</p>
            </div>
          </div>
          <select 
            className="border border-slate-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-slate-700 dark:text-slate-100 dark:bg-gray-800"
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
        operadores={operadores}
        productos={productos}
      />
    </div>
  );
}