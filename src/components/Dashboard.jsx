import { useState, useMemo } from "react";
import { useData } from "../context/AppContexts";
import Card from "./ui/Card";
import DashboardPanels from "./dashboard/DashboardPanels";
import { QuickActions } from "./widgets/DashboardWidgets";
import { useNavigate } from "react-router-dom";
import { computeVenta } from "../utils/calculos";
import { glassStyles, cardHoverStyles } from "../utils/designUtils";
import { cn } from "../lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  Calendar,
  AlertCircle,
  Zap,
  Briefcase,
  Package,
  MapPin,
  TrendingUp,
  LayoutDashboard,
  ChevronDown
} from "lucide-react";

const getImporteVenta = (venta) => {
  const pvp = Number(venta?.pvp) || 0;
  const cantidad = Number(venta?.cantidad) || 1;
  return pvp * cantidad;
};

import { BorderBeam } from "./ui/BorderBeam";

const SummaryBadge = ({ label, value, icon: Icon, color, warning, delay = 0, className = "" }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ duration: 0.4, delay }}
    whileHover={{ y: -5, scale: 1.02 }}
    className={cn(
      glassStyles(),
      cardHoverStyles(),
      "p-5 rounded-3xl flex items-center gap-4 group transition-all duration-300 border border-slate-200/50 dark:border-gray-700/50 shadow-sm hover:shadow-xl relative overflow-hidden",
      className
    )}
  >
    <BorderBeam
      size={80}
      duration={10}
      delay={delay}
      colorFrom={color === 'brand' ? 'var(--brand-primary)' : (color.includes('from-') ? color.split(' ')[0].replace('from-', '#') : '#3b82f6')}
      colorTo={color === 'brand' ? 'var(--brand-primary)' : (color.includes('to-') ? color.split(' ')[1].replace('to-', '#') : '#8b5cf6')}
    />

    <div className={`p-3 rounded-2xl bg-gradient-to-br ${color === 'brand' ? 'from-[var(--brand-primary)] to-[var(--brand-primary)] opacity-90' : color} shadow-lg shadow-inner group-hover:rotate-12 transition-transform`}>
      <Icon className="w-6 h-6 text-white" />
    </div>
    <div className="relative z-10">
      <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[2px] mb-1">{label}</p>
      <p className="text-2xl font-black text-slate-800 dark:text-white leading-none tracking-tighter">{value}</p>
      {warning && (
        <p className="text-[8px] font-bold text-rose-500 mt-1 uppercase tracking-wider animate-pulse">Update Required</p>
      )}
    </div>
  </motion.div>
);

export default function Dashboard() {
  const navigate = useNavigate();
  const { data, dataInitialized } = useData();

  // Memoria y limpieza de datos (se mantiene la lógica original optimizada)
  const ventasRaw = useMemo(() => (Array.isArray(data?.ventas) ? data.ventas : []), [data?.ventas]);
  const productos = useMemo(() => (data?.productos || []).filter((p, idx, arr) => p.activo !== false && arr.findIndex((x) => x.id === p.id) === idx), [data?.productos]);
  const operadores = useMemo(() => (data?.operadores || []).filter((o, idx, arr) => o.activo !== false && arr.findIndex((x) => x.id === o.id) === idx), [data?.operadores]);
  const colaboradores = useMemo(() => (data?.colaboradores || []).filter((c, idx, arr) => c.activo !== false && arr.findIndex((x) => x.id === c.id) === idx), [data?.colaboradores]);
  const zonas = useMemo(() => (data?.zonas || []).filter((z, idx, arr) => z.activo !== false && arr.findIndex((x) => x.id === z.id) === idx), [data?.zonas]);
  const niveles = useMemo(() => (Array.isArray(data?.niveles) ? data.niveles : []), [data?.niveles]);
  const reglas = useMemo(() => (Array.isArray(data?.reglas) ? data.reglas : []), [data?.reglas]);

  const ventasCalculadas = useMemo(() => {
    if (ventasRaw.length === 0) return [];
    return ventasRaw.map((venta) => ({
      ...venta,
      _calc: computeVenta({ venta, productos, operadores, zonas, colaboradores, niveles, reglas }),
    }));
  }, [ventasRaw, productos, operadores, zonas, colaboradores, niveles, reglas]);

  const ventas = useMemo(() => ventasCalculadas.filter((v) => !v.prueba && !v.duplicada), [ventasCalculadas]);
  const ventasConCalc = useMemo(() => ventas.filter((v) => v._calc?.ok), [ventas]);
  const total = ventas.length;
  const hayDatos = ventasConCalc.length > 0;

  const [periodoEvolucion, setPeriodoEvolucion] = useState('semestral');
  const [showCatalogo, setShowCatalogo] = useState(false);

  // Lógica de métricas avanzada (mantenida del original)
  const facturacionTotal = ventas.reduce((acum, venta) => acum + getImporteVenta(venta), 0);
  const ticketMedio = total ? facturacionTotal / total : 0;
  const irpfMedio = useMemo(() => {
    const irpfDatos = ventasConCalc.map((v) => v._calc.detalle.irpf_pct);
    return irpfDatos.length ? (irpfDatos.reduce((a, b) => a + b, 0) / irpfDatos.length) * 100 : 0;
  }, [ventasConCalc]);

  const kpis = useMemo(() => {
    let comBruta = 0, comPagada = 0, margen = 0;
    ventasConCalc.forEach(v => {
      comBruta += v._calc.detalle.comBruta || 0;
      comPagada += v._calc.detalle.netoColab || 0;
      margen += v._calc.detalle.margenEmpresa || 0;
    });
    return { comBruta, comPagada, margen };
  }, [ventasConCalc]);

  // Análisis por SECTOR, FAMILIA, ZONA (mantenida lógica original)
  const bySector = useMemo(() => {
    const map = new Map();
    ventas.forEach(v => {
      const producto = productos.find(p => p.id === v.producto_id);
      const operador = producto && operadores.find(o => o.id === producto.operador_id);
      if (!operador) return;
      const sector = (operador.sector || "Otros").toLowerCase();
      const current = map.get(sector) || { ventas: 0, facturacion: 0, bruto: 0, neto: 0 };
      map.set(sector, {
        ventas: current.ventas + 1,
        facturacion: current.facturacion + getImporteVenta(v),
        bruto: current.bruto + (v._calc?.ok ? v._calc.detalle.comBruta : 0),
        neto: current.neto + (v._calc?.ok ? v._calc.detalle.netoColab : 0)
      });
    });
    return [...map.entries()].sort((a, b) => b[1].facturacion - a[1].facturacion);
  }, [ventas, productos, operadores]);

  const byFamilia = useMemo(() => {
    const map = new Map();
    ventas.forEach(v => {
      const producto = productos.find(p => p.id === v.producto_id);
      if (!producto) return;
      const familia = producto.familia || "Sin clasificar";
      const current = map.get(familia) || { ventas: 0, facturacion: 0, bruto: 0, margen: 0 };
      map.set(familia, {
        ventas: current.ventas + 1,
        facturacion: current.facturacion + getImporteVenta(v),
        bruto: current.bruto + (v._calc?.ok ? v._calc.detalle.comBruta : 0),
        margen: current.margen + (v._calc?.ok ? v._calc.detalle.margenEmpresa : 0)
      });
    });
    return [...map.entries()].sort((a, b) => b[1].facturacion - a[1].facturacion);
  }, [ventas, productos]);

  const byZona = useMemo(() => {
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
  }, [ventas, zonas]);

  const topColaboradores = useMemo(() => {
    const map = new Map();
    ventas.forEach(v => {
      const colab = colaboradores.find(c => c.id === v.colaborador_id);
      if (!colab) return;
      const current = map.get(colab.id) || { nombre: colab.nombre, ventas: 0, facturacion: 0, neto: 0 };
      map.set(colab.id, {
        nombre: colab.nombre,
        ventas: current.ventas + 1,
        facturacion: current.facturacion + getImporteVenta(v),
        neto: current.neto + (v._calc?.ok ? v._calc.detalle.netoColab : 0)
      });
    });
    return [...map.entries()].map(([id, d]) => ({ id, ...d })).sort((a, b) => b.facturacion - a.facturacion).slice(0, 5);
  }, [ventas, colaboradores]);

  const topProductos = useMemo(() => {
    const map = new Map();
    ventas.forEach(v => {
      const producto = productos.find(p => p.id === v.producto_id);
      if (!producto) return;
      const current = map.get(producto.id) || { nombre: producto.nombre, familia: producto.familia || "S/C", ventas: 0, facturacion: 0, margen: 0 };
      map.set(producto.id, {
        nombre: producto.nombre,
        familia: producto.familia || "S/C",
        ventas: current.ventas + 1,
        facturacion: current.facturacion + getImporteVenta(v),
        margen: current.margen + (v._calc?.ok ? v._calc.detalle.margenEmpresa : 0)
      });
    });
    return [...map.entries()].map(([id, d]) => ({ id, ...d })).sort((a, b) => b.facturacion - a.facturacion).slice(0, 5);
  }, [ventas, productos]);

  const evolucionTemporal = useMemo(() => {
    const map = new Map();
    ventas.forEach(v => {
      if (!v.fecha) return;
      let clave = v.fecha.slice(0, 7);
      if (periodoEvolucion === 'anual') clave = v.fecha.slice(0, 4);
      else if (periodoEvolucion === 'trimestral') {
        const mes = parseInt(v.fecha.slice(5, 7));
        clave = `${v.fecha.slice(0, 4)} T${Math.ceil(mes / 3)}`;
      }
      const current = map.get(clave) || { ventas: 0, facturacion: 0, margen: 0 };
      map.set(clave, {
        ventas: current.ventas + 1,
        facturacion: current.facturacion + getImporteVenta(v),
        margen: current.margen + (v._calc?.ok ? v._calc.detalle.margenEmpresa : 0)
      });
    });
    const entries = [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]));
    return periodoEvolucion === 'anual' ? entries.slice(-3) : periodoEvolucion === 'trimestral' ? entries.slice(-8) : entries.slice(-6);
  }, [ventas, periodoEvolucion]);

  const crecimiento = useMemo(() => {
    const porMes = new Map();
    ventasConCalc.forEach((venta) => {
      const mes = (venta.fecha || "").slice(0, 7);
      if (!mes) return;
      porMes.set(mes, (porMes.get(mes) || 0) + (venta._calc?.detalle?.comBruta || 0));
    });
    const entries = [...porMes.entries()].sort((a, b) => a[0].localeCompare(b[0]));
    if (entries.length < 2) return 0;
    const prev = entries[entries.length - 2][1], last = entries[entries.length - 1][1];
    return prev === 0 ? (last > 0 ? 100 : 0) : ((last - prev) / prev) * 100;
  }, [ventasConCalc]);

  const byEstado = useMemo(() => {
    const counts = { Borrador: 0, Confirmada: 0, Cerrada: 0, Liquidada: 0, Instalada: 0, Activa: 0, Pendiente: 0 };
    // ACTIVADA (con A final) faltaba aquí — es un estado real que
    // ESTADOS_LIQUIDABLES (LiquidacionesPage.jsx) ya trata como liquidable
    // igual que ACTIVO/ACTIVADO/ACTIVA, pero al no estar en este mapa caía
    // en su propio bucket suelto "ACTIVADA" en vez de sumarse a "Activa" —
    // desalineaba el conteo visual del dashboard frente a lo que realmente
    // se liquida.
    const buckets = { BORRADOR: 'Borrador', CONFIRMADA: 'Confirmada', CONFIRMADO: 'Confirmada', CERRADA: 'Cerrada', CERRADO: 'Cerrada', LIQUIDADA: 'Liquidada', LIQUIDADO: 'Liquidada', INSTALADA: 'Instalada', INSTALADO: 'Instalada', ACTIVO: 'Activa', ACTIVADO: 'Activa', ACTIVADA: 'Activa', ACTIVA: 'Activa', PENDIENTE: 'Pendiente' };
    ventas.forEach(v => {
      const e = (v.estado || "").toString().toUpperCase();
      const b = buckets[e] || v.estado || "Desconocido";
      counts[b] = (counts[b] || 0) + 1;
    });
    return counts;
  }, [ventas]);

  if (!dataInitialized) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4 animate-pulse">
        <LayoutDashboard className="w-16 h-16 text-slate-200" />
        <div className="h-4 bg-slate-200 rounded w-48" />
        <div className="h-3 bg-slate-100 rounded w-32" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="max-w-[1600px] mx-auto space-y-12 pb-20 px-2"
    >
      {/* Header Principal Premium */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-1">
        <div className="space-y-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2 py-0.5 rounded-md bg-[var(--brand-primary)] text-white text-[10px] font-black uppercase tracking-widest">
              Live Analytics
            </span>
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
          </div>
          <h1 className="text-4xl font-black text-slate-800 dark:text-white tracking-tighter">
            Panel de Control <span className="text-[var(--brand-primary)]">Comercial</span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium max-w-lg">
            Visión global del rendimiento operativo, métricas de ventas y análisis de colaboradores en tiempo real.
          </p>
        </div>

        {/* Botón de Período Estilizado */}
        <div className={cn(glassStyles(), "p-2 rounded-2xl flex items-center gap-2")}>
          <Calendar className="w-4 h-4 text-[var(--brand-primary)] ml-2" />
          <select
            className="bg-transparent border-none text-sm font-bold text-slate-700 dark:text-slate-200 focus:ring-0 cursor-pointer pr-8"
            value={periodoEvolucion}
            onChange={(e) => setPeriodoEvolucion(e.target.value)}
          >
            <option value="semestral">Último Semestre</option>
            <option value="trimestral">Histórico Trimestral</option>
            <option value="anual">Proyección Anual</option>
          </select>
        </div>
      </div>

      {/* Alertas Críticas Estáticas */}
      {!hayDatos && total > 0 && (
        <div className="bg-rose-500/10 border border-rose-500/20 rounded-3xl p-6 flex items-start gap-4">
          <div className="p-3 rounded-2xl bg-rose-500 shadow-lg shadow-rose-500/20">
            <AlertCircle className="w-6 h-6 text-white" />
          </div>
          <div>
            <h4 className="text-lg font-black text-rose-600 dark:text-rose-400">Datos Parciales Detectados</h4>
            <p className="text-slate-600 dark:text-slate-300 text-sm font-medium">
              Hay {total} ventas registradas pero las comisiones no han sido calculadas. Las métricas financieras pueden estar incompletas hasta que se procesen las liquidaciones.
            </p>
          </div>
        </div>
      )}

      {/* Acciones Rápidas Consolidadas */}
      <section>
        <QuickActions
          onNewVenta={() => navigate('/ventas?modal=newVenta')}
          onImportExcel={() => navigate('/config?tab=import')}
          onExportData={() => navigate('/liquidaciones')}
          onManageUsers={() => navigate('/gestion?tab=colaboradores')}
          onOpenSettings={() => navigate('/config')}
        />
      </section>

      {/* DASHBOARD PANELS CONSOLIDADO (Refactorizado) */}
      <div className="relative">
        {/* Decoración de fondo */}
        <div className="absolute top-0 right-0 -z-10 w-96 h-96 bg-indigo-500/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-40 left-0 -z-10 w-80 h-80 bg-emerald-500/5 blur-[100px] rounded-full" />

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

      {/* Resumen de Catálogo — conteos de inventario/equipo, no KPIs de uso diario.
          Colapsado por defecto para no competir con las métricas de negocio de arriba. */}
      <section>
        <button
          type="button"
          onClick={() => setShowCatalogo((v) => !v)}
          className={cn(glassStyles(), "w-full flex items-center justify-between p-4 rounded-2xl group")}
          aria-expanded={showCatalogo}
        >
          <span className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">
            Resumen de Catálogo
          </span>
          <ChevronDown className={cn("w-4 h-4 text-slate-400 transition-transform", showCatalogo && "rotate-180")} />
        </button>
        <AnimatePresence>
          {showCatalogo && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6 px-1 pt-6">
                <SummaryBadge
                  label="Volumen Total"
                  value={total > 0 ? `${total} u.` : "0 u."}
                  icon={TrendingUp}
                  color="from-rose-500 to-pink-600"
                  warning={total === 0}
                  className="lg:col-span-2 lg:row-span-1"
                  delay={0.1}
                />
                <SummaryBadge
                  label="Colaboradores"
                  value={colaboradores.length}
                  icon={Users}
                  color="from-blue-500 to-indigo-600"
                  warning={colaboradores.length === 0}
                  delay={0.2}
                />
                <SummaryBadge
                  label="Operadores"
                  value={operadores.length}
                  icon={Briefcase}
                  color="from-purple-500 to-fuchsia-600"
                  warning={operadores.length === 0}
                  delay={0.3}
                />
                <SummaryBadge
                  label="Productos"
                  value={productos.length}
                  icon={Package}
                  color="from-amber-500 to-orange-600"
                  warning={productos.length === 0}
                  delay={0.4}
                />
                <SummaryBadge
                  label="Cobertura Territorial"
                  value={`${byZona.length} Sedes`}
                  icon={MapPin}
                  color="from-emerald-500 to-teal-600"
                  warning={byZona.length === 0}
                  delay={0.5}
                  className="md:col-span-2 lg:col-span-1"
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>
    </motion.div>
  );
}
