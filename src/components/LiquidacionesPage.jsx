import { useMemo, useState, useEffect } from "react";
import Toast from "./ui/Toast";
import Card from "./ui/Card";
import SectionTitle from "./ui/SectionTitle";
import { useData } from "../context/AppContexts";
import {
  monthOf, sum, calcularDecomisiones, generarInformePDF
} from "./liquidaciones/liquidacionesUtils";
import { computeVenta } from "../utils/calculos";
import LiquidacionPreviewModal from "./liquidaciones/components/LiquidacionPreviewModal";
import {
  LiquidacionesGenerar,
  LiquidacionesDecomisiones,
  LiquidacionesResumenColab,
  LiquidacionesTabla
} from "./LiquidacionesComponents";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "../lib/utils";
import { PiggyBank, Receipt, AlertCircle, FileCheck } from "lucide-react";
import { glassStyles } from "../utils/designUtils";

// Estados que consideramos válidos para incluir una venta en la liquidación mensual
const ESTADOS_LIQUIDABLES = new Set([
  "CERRADA",
  "LIQUIDADA",
  "INSTALADA",
  "ACTIVO",
  "ACTIVADO",
  "ACTIVADA",
  "CONFIRMADA",
]);

const normalizeImpuestoPct = (valor) => {
  if (valor === null || valor === undefined) return 0;
  if (typeof valor === "string") {
    const cleaned = valor.replace(/,/g, ".").replace(/[^0-9.]/g, "").trim();
    if (!cleaned) return 0;
    valor = Number(cleaned);
  }
  const numero = Number(valor);
  if (!Number.isFinite(numero) || numero <= 0) return 0;
  return numero > 1 ? numero / 100 : numero;
};

const defaultPctByTipo = (tipo) => {
  if (!tipo) return 0;
  const upper = tipo.toUpperCase();
  if (upper.includes("IGIC")) return 0.07;
  if (upper.includes("IVA")) return 0.21;
  return 0;
};

const buildZonaFiscal = (zona) => {
  if (!zona) return null;
  const rawPct = zona.impuesto_pct ?? zona.igic ?? zona.iva ?? zona.iva_pct ?? zona.impuesto ?? zona.valor_impuesto ?? null;
  let pct = normalizeImpuestoPct(rawPct);
  let tipoInferido = zona.impuesto_tipo || null;
  if (!tipoInferido && zona.igic !== undefined) tipoInferido = "IGIC";
  if (!tipoInferido && zona.iva !== undefined) tipoInferido = "IVA";
  if (!tipoInferido && typeof zona.nombre === "string" && zona.nombre.toUpperCase().includes("CANARI")) tipoInferido = "IGIC";
  const codigo = typeof zona.codigo === "string" ? zona.codigo.toUpperCase() : "";
  const tipo = tipoInferido || (codigo.startsWith("CAN") ? "IGIC" : codigo ? "IVA" : null);
  if (!pct) {
    const fallback = defaultPctByTipo(tipo);
    if (fallback) pct = fallback;
  }
  return { zona, pct, tipo };
};

const resolveZonaFiscal = (colaborador, ventas, zonas) => {
  const candidatos = [];
  if (colaborador?.zona_id) {
    const zonaColab = zonas.find((z) => z.id === colaborador.zona_id) || null;
    if (zonaColab) candidatos.push(zonaColab);
  }
  ventas.forEach((venta) => {
    const zonaVenta = venta?._calc?.detalle?.zona || (venta?.zona_id ? zonas.find((z) => z.id === venta.zona_id) : null);
    if (zonaVenta) candidatos.push(zonaVenta);
  });
  for (const candidato of candidatos) {
    const zonaFiscal = buildZonaFiscal(candidato);
    if (zonaFiscal && zonaFiscal.pct > 0) return zonaFiscal;
  }
  if (candidatos.length > 0) {
    const fallbackZona = buildZonaFiscal(candidatos[0]);
    if (fallbackZona) return fallbackZona;
  }
  return { zona: null, pct: 0, tipo: null };
};

export default function LiquidacionesPage() {
  const { data, dataInitialized, setLiquidaciones, setDecomisiones } = useData();

  const ventas = useMemo(() => data?.ventas || [], [data?.ventas]);
  const colaboradores = useMemo(() => data?.colaboradores || [], [data?.colaboradores]);
  const operadores = useMemo(() => data?.operadores || [], [data?.operadores]);
  const zonas = useMemo(() => data?.zonas || [], [data?.zonas]);
  const productos = useMemo(() => data?.productos || [], [data?.productos]);
  const niveles = useMemo(() => data?.niveles || [], [data?.niveles]);
  const reglas = useMemo(() => data?.reglas || [], [data?.reglas]);
  const liquidaciones = useMemo(() => data?.liquidaciones || [], [data?.liquidaciones]);
  const decomisiones = useMemo(() => data?.decomisiones || [], [data?.decomisiones]);

  const ventasConCalc = useMemo(() => {
    return ventas.map((venta) => ({
      ...venta,
      _calc: computeVenta({ venta, productos, operadores, zonas, colaboradores, niveles, reglas }),
    }));
  }, [ventas, productos, operadores, zonas, colaboradores, niveles, reglas]);

  const [periodo, setPeriodo] = useState(new Date().toISOString().slice(0, 7));
  const [toast, setToast] = useState({ message: "", type: "info" });
  const [search, setSearch] = useState("");
  const [showInactivos, setShowInactivos] = useState(false);
  const [showDecomisiones, setShowDecomisiones] = useState(false);
  const [filtroColaborador, setFiltroColaborador] = useState("");
  const [filtroPeriodo, setFiltroPeriodo] = useState(new Date().toISOString().slice(0, 7));
  const [previewLiquidacion, setPreviewLiquidacion] = useState(null);

  const ventasIndex = useMemo(() => {
    const map = new Map();
    ventasConCalc.forEach((v) => v?.id && map.set(v.id, v));
    return map;
  }, [ventasConCalc]);

  useEffect(() => {
    if (periodo) setFiltroPeriodo(periodo);
  }, [periodo]);

  const previewColaborador = useMemo(() => {
    if (!previewLiquidacion) return null;
    return colaboradores.find((c) => c.id === previewLiquidacion.colaborador_id) || null;
  }, [previewLiquidacion, colaboradores]);

  const previewVentas = useMemo(() => {
    if (!previewLiquidacion) return [];
    return (previewLiquidacion.ventas_incluidas || []).map((id) => ventasIndex.get(id)).filter(Boolean);
  }, [previewLiquidacion, ventasIndex]);

  const previewDecomisiones = useMemo(() => {
    if (!previewLiquidacion) return [];
    const ids = new Set(previewLiquidacion.decomisiones_incluidas || []);
    return decomisiones.filter((d) => ids.has(d.venta_id) || ids.has(d.id));
  }, [previewLiquidacion, decomisiones]);

  const colaboradoresFiltrados = useMemo(() => {
    return colaboradores.filter(c => {
      if (showInactivos || !c.fecha_baja) return true;
      return new Date(c.fecha_baja) > new Date(periodo + '-01');
    });
  }, [colaboradores, showInactivos, periodo]);

  const ventasPeriodo = useMemo(() => {
    return ventasConCalc.filter((v) => {
      const estado = (v.estado || "").toString().toUpperCase();
      return ESTADOS_LIQUIDABLES.has(estado) && monthOf(v.fecha) === periodo;
    });
  }, [ventasConCalc, periodo]);

  const decomisionesPeriodo = useMemo(
    () => calcularDecomisiones(ventasPeriodo, operadores),
    [ventasPeriodo, operadores]
  );

  const porColab = useMemo(() => {
    const map = new Map();
    ventasPeriodo.forEach((v) => {
      if (!map.has(v.colaborador_id)) map.set(v.colaborador_id, []);
      map.get(v.colaborador_id).push(v);
    });

    return Array.from(map.entries()).map(([colabId, lista]) => {
      const colab = colaboradoresFiltrados.find((c) => c.id === colabId);
      if (!colab) return null;
      const ventasValidas = lista.filter((x) => x._calc?.ok);
      const bruto = sum(ventasValidas, (x) => x._calc?.detalle?.parteColab || 0);
      const decomisionesColab = decomisionesPeriodo.filter(d => d.colaborador_id === colabId);
      const totalDecomisiones = decomisionesColab.reduce((acum, d) => acum + d.importe_decomision, 0);
      const totalIRPF = sum(ventasValidas, (x) => x._calc?.detalle?.irpf || 0);
      const zonaFiscal = resolveZonaFiscal(colab, ventasValidas, zonas);
      const exento = colab.exento_impuestos || ['AUTONOMO_ESPECIAL', 'EMPRESA', 'EXENTO'].includes(colab.tipo_fiscal?.toUpperCase());

      const impuestoZona = !exento ? sum(ventasValidas, (v) => {
        const det = v._calc?.detalle;
        const zV = buildZonaFiscal(det?.zona || (v?.zona_id ? zonas.find(z => z.id === v.zona_id) : null));
        return (det?.parteColab || 0) * (zV?.pct ?? zonaFiscal.pct);
      }) : 0;

      return {
        colab, ventas: lista, bruto, irpf: totalIRPF, impuestoZona,
        decomisiones: decomisionesColab, totalDecomisiones,
        neto: Math.max(0, bruto - totalIRPF - impuestoZona - totalDecomisiones),
        totalConImpuesto: Math.max(0, bruto - totalIRPF - totalDecomisiones + impuestoZona),
        datosZona: {
          tipo: zonaFiscal.tipo, pct: zonaFiscal.pct,
          id: zonaFiscal.zona?.id, nombre: zonaFiscal.zona?.nombre
        }
      };
    }).filter(Boolean);
  }, [ventasPeriodo, colaboradoresFiltrados, zonas, decomisionesPeriodo]);

  const generar = () => {
    if (porColab.length === 0) {
      setToast({ message: "No hay ventas liquidables en este período.", type: "warning" });
      return;
    }
    const nuevas = porColab.map((r) => ({
      id: `liq_${periodo}_${r.colab.id}`,
      periodo,
      colaborador_id: r.colab.id,
      colaborador_tipo: r.colab.tipo,
      colaborador_nombre: r.colab.nombre,
      zona_fiscal: r.datosZona.tipo ? `${r.datosZona.tipo} ${(r.datosZona.pct * 100).toFixed(2)}% - ${r.datosZona.nombre}` : (r.datosZona.nombre || "Sin zona"),
      bruto: r.bruto, irpf: r.irpf, impuesto_zona: r.impuestoZona, decomisiones: r.totalDecomisiones,
      neto: r.neto, total_con_impuesto: r.totalConImpuesto, estado: "Generada",
      fecha_generacion: new Date().toISOString(),
      ventas_incluidas: r.ventas.map(v => v.id),
      decomisiones_incluidas: r.decomisiones.map(d => d.venta_id),
    })).filter(n => !liquidaciones.some(l => l.periodo === n.periodo && l.colaborador_id === n.colaborador_id));

    if (!nuevas.length) {
      setToast({ message: "Todas las liquidaciones ya existen para este período.", type: "error" });
      return;
    }

    setLiquidaciones(prev => [...nuevas, ...prev]);
    if (decomisionesPeriodo.length > 0) {
      setDecomisiones(prev => [...decomisionesPeriodo.map(d => ({ ...d, id: `deco_${Date.now()}_${d.venta_id}`, fecha_generacion: new Date().toISOString() })), ...prev]);
    }
    setToast({ message: `Se generaron ${nuevas.length} liquidaciones correctamente.`, type: "success" });
  };

  const filteredLiquidaciones = useMemo(() => {
    const term = search.toLowerCase();
    return liquidaciones.filter(l => {
      if (filtroColaborador && l.colaborador_id !== filtroColaborador) return false;
      if (filtroPeriodo && l.periodo !== filtroPeriodo) return false;
      if (!term) return true;
      const colab = colaboradores.find(c => c.id === l.colaborador_id);
      return (colab?.nombre?.toLowerCase().includes(term) || l.periodo.includes(term));
    });
  }, [liquidaciones, colaboradores, search, filtroColaborador, filtroPeriodo]);

  if (!dataInitialized) return <div className="p-6 animate-pulse space-y-4"><div className="h-8 bg-slate-200 rounded w-1/4" /><div className="h-64 bg-slate-200 rounded" /></div>;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.4 }}
      className="space-y-8 pb-20 px-1"
    >
      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: "", type: "info" })} />

      {/* Header Premium */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-[var(--brand-primary)] flex items-center justify-center shadow-xl shadow-[var(--brand-primary)]/20">
            <PiggyBank className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-800 dark:text-white tracking-tighter uppercase font-outfit">Liquidaciones</h1>
            <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Cierre mensual y gestión de pagos</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6">

        <AnimatePresence>
          {colaboradores.some(c => !c.zona_id) && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
              <Card className="bg-amber-500/10 border-amber-500/20 p-4 border-l-4">
                <div className="flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-600" />
                  <p className="text-amber-700 dark:text-amber-400 font-bold text-sm uppercase tracking-tight">⚠️ Colaboradores sin zona fiscal asignada</p>
                </div>
              </Card>
            </motion.div>
          )}

          {decomisionesPeriodo.length > 0 && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
              <Card className="bg-rose-500/10 border-rose-500/20 p-4 border-l-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-rose-600" />
                    <p className="text-rose-700 dark:text-rose-400 font-bold text-sm uppercase tracking-tight">🚨 {decomisionesPeriodo.length} decomisiones detectadas</p>
                  </div>
                  <button
                    onClick={() => setShowDecomisiones(!showDecomisiones)}
                    className="px-4 py-1.5 bg-rose-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg hover:bg-rose-700 transition-colors"
                  >
                    {showDecomisiones ? 'Ocultar' : 'Ver Detalles'}
                  </button>
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        <Card className={cn(glassStyles(), "p-6 border border-slate-200/50 dark:border-gray-800/50")}>
          <div className="flex items-center gap-3 mb-6">
            <Receipt className="w-5 h-5 text-[var(--brand-primary)]" />
            <SectionTitle className="mb-0">Generar Liquidaciones</SectionTitle>
          </div>
          <LiquidacionesGenerar periodo={periodo} setPeriodo={setPeriodo} generar={generar} setToast={setToast}
            showInactivos={showInactivos} setShowInactivos={setShowInactivos} />
        </Card>

        {showDecomisiones && decomisionesPeriodo.length > 0 && (
          <LiquidacionesDecomisiones decomisionesPeriodo={decomisionesPeriodo} colaboradores={colaboradores} periodo={periodo} setToast={setToast} />
        )}

        <Card className={cn(glassStyles(), "p-6 border border-slate-200/50 dark:border-gray-800/50")}>
          <LiquidacionesResumenColab porColab={porColab} zonas={zonas} periodo={periodo} setToast={setToast} />
        </Card>

        <Card className={cn(glassStyles(), "p-6 border border-slate-200/50 dark:border-gray-800/50")}>
          <div className="flex items-center gap-3 mb-6">
            <FileCheck className="w-5 h-5 text-[var(--brand-primary)]" />
            <SectionTitle className="mb-0">Liquidaciones Generadas</SectionTitle>
          </div>
          <LiquidacionesTabla filteredLiquidaciones={filteredLiquidaciones} colaboradores={colaboradores} search={search} setSearch={setSearch}
            setToast={setToast} generarInformePDF={(liq, periodo, colabs) => generarInformePDF(liq, periodo, colabs)} porColab={porColab} periodo={periodo}
            filtroColaborador={filtroColaborador} setFiltroColaborador={setFiltroColaborador} filtroPeriodo={filtroPeriodo} setFiltroPeriodo={setFiltroPeriodo}
            onPreview={setPreviewLiquidacion} onDelete={(liq) => setLiquidaciones(prev => prev.filter(i => i.id !== liq.id))} />
        </Card>

        {previewLiquidacion && (
          <LiquidacionPreviewModal
            liquidacion={previewLiquidacion}
            colaborador={previewColaborador}
            ventas={previewVentas}
            decomisiones={previewDecomisiones}
            onClose={() => setPreviewLiquidacion(null)}
          />
        )}
      </div>
    </motion.div>
  );
}