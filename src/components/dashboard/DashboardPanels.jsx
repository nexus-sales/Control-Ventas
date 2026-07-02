import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { sectionTitleStyles } from '../../utils/designUtils';
import { cn } from '../../lib/utils';

// Importación de componentes modulares
import KPIsPanel from './components/KPIsPanel';
import PipelinePanel from './components/PipelinePanel';
import ExtraMetricsPanel from './components/ExtraMetricsPanel';
import ProductosOperadorWidget from './components/ProductosOperadorWidget';
import { TopColaboradoresPanel, TopProductosPanel } from './components/TopRankings';
import { SectorAnalysis, FamiliaAnalysis, GeoDistributionPanel } from './components/AnalysisPanels';
import { EvolucionTemporalPanel } from './components/EvolucionTemporalPanel';
import { TendenciasPanel, ProductividadPanel } from './components/ProductivityPanels';

/**
 * DashboardPanels - Orquestador modular del Dashboard Premium
 * Versión refactorizada y optimizada para máxima claridad y estética "wow".
 */
export default function DashboardPanels(props) {
  const {
    kpis = { comBruta: 0, comPagada: 0, margen: 0 },
    hayDatos = false,
    total = 0,
    ticketMedio = 0,
    facturacionTotal = 0,
    byEstado = {},
    crecimiento = 0,
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
    operadores = [],
    productos = []
  } = props;

  const [mostrarDetalle, setMostrarDetalle] = useState(false);

  return (
    <div className="space-y-12">
      {/* 🚀 BLOQUE 1: MÉTRICAS MAESTRAS & SMART PIPELINE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        <motion.section
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="lg:col-span-8 h-full"
        >
          <div className="flex items-center justify-between mb-6 px-1">
            <h2 className={sectionTitleStyles()}>Métricas Estratégicas</h2>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Real Time</span>
            </div>
          </div>
          <KPIsPanel {...{ kpis, hayDatos, total, ticketMedio, facturacionTotal, byEstado, crecimiento }} />
        </motion.section>

        <motion.section
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="lg:col-span-4 h-full"
        >
          <h2 className={sectionTitleStyles()}>Embudo Comercial</h2>
          <PipelinePanel {...{ byEstado, total }} />
        </motion.section>
      </div>

      {/* 📊 BLOQUE 2: ANALÍTICA AVANZADA & DISTRIBUCIÓN (Bento Mix) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="lg:col-span-4"
        >
          <h2 className={sectionTitleStyles()}>Analítica</h2>
          <ExtraMetricsPanel {...{ ticketMedio, irpfMedio, total, byEstado, margen, facturacionTotal, hayDatos }} />
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="lg:col-span-8"
        >
          <h2 className={sectionTitleStyles()}>Distribución de Catálogo</h2>
          <ProductosOperadorWidget {...{ operadores, productos }} />
        </motion.section>
      </div>

      {/* Acordeón: Rankings, Segmentación y Tendencias (Bloques 3-5) — colapsados por
          defecto para no saturar el primer vistazo. Siguen accesibles con un clic;
          no se elimina ningún panel ni dato. */}
      <button
        type="button"
        onClick={() => setMostrarDetalle((v) => !v)}
        className="w-full flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/50 dark:border-slate-700/50 group"
        aria-expanded={mostrarDetalle}
      >
        <span className={cn(sectionTitleStyles(), "mb-0")}>Ver análisis detallado</span>
        <ChevronDown className={cn("w-4 h-4 text-slate-400 transition-transform", mostrarDetalle && "rotate-180")} />
      </button>

      <AnimatePresence>
        {mostrarDetalle && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden space-y-12"
          >
            {/* 🏆 BLOQUE 3: RANKINGS ELITE */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-4">
              <motion.section
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="lg:col-span-6"
              >
                <h3 className={sectionTitleStyles()}>Líderes de Ventas</h3>
                <TopColaboradoresPanel {...{ topColaboradores, hayDatos }} />
              </motion.section>

              <motion.section
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="lg:col-span-6"
              >
                <h3 className={sectionTitleStyles()}>Productos Estrella</h3>
                <TopProductosPanel {...{ topProductos, hayDatos }} />
              </motion.section>
            </div>

            {/* 📍 BLOQUE 4: SEGMENTACIÓN & TERRITORIO */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <motion.section
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.3 }}
                className="lg:col-span-4"
              >
                <h3 className={sectionTitleStyles()}>Sector</h3>
                <SectorAnalysis {...{ bySector, hayDatos }} />
              </motion.section>

              <motion.section
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                className="lg:col-span-4"
              >
                <h3 className={sectionTitleStyles()}>Distribución Zonal</h3>
                <GeoDistributionPanel {...{ byZona }} />
              </motion.section>

              <motion.section
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.5 }}
                className="lg:col-span-4"
              >
                <h3 className={sectionTitleStyles()}>Familias</h3>
                <FamiliaAnalysis {...{ byFamilia, hayDatos }} />
              </motion.section>
            </div>

            {/* 📈 BLOQUE 5: TENDENCIAS & CRONOLOGÍA */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pb-20">
              <motion.section
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, delay: 0.6 }}
                className="lg:col-span-7"
              >
                <h3 className={sectionTitleStyles()}>Evolución Temporal</h3>
                <EvolucionTemporalPanel {...{ evolucionTemporal, periodoEvolucion, hayDatos }} />
              </motion.section>

              <motion.section
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, delay: 0.7 }}
                className="lg:col-span-5"
              >
                <h3 className={sectionTitleStyles()}>Productividad</h3>
                <ProductividadPanel {...{ colaboradores, total, topColaboradores, topProductos, facturacionTotal, margen, comBruta, hayDatos }} />
              </motion.section>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Re-exportamos componentes para compatibilidad si otros módulos los usan
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
  ProductosOperadorWidget
};