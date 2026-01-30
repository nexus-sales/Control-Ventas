import React from 'react';
import { sectionTitleStyles } from '../../utils/designUtils';

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

  return (
    <div className="space-y-12 animate-in fade-in zoom-in-95 duration-700">
      {/* Panel Principal de KPIs */}
      <section>
        <h2 className={sectionTitleStyles}>Métricas Estratégicas</h2>
        <KPIsPanel {...{ kpis, hayDatos, total, ticketMedio, facturacionTotal, byEstado, crecimiento }} />
      </section>

      {/* Panel de Pipeline */}
      <section>
        <h2 className={sectionTitleStyles}>Embudo Comercial</h2>
        <PipelinePanel {...{ byEstado, total }} />
      </section>

      {/* Métricas Adicionales */}
      <section>
        <h2 className={sectionTitleStyles}>Analítica de Rendimiento</h2>
        <ExtraMetricsPanel {...{ ticketMedio, irpfMedio, total, byEstado, margen, facturacionTotal, hayDatos }} />
      </section>

      {/* Widget Productos por Operador */}
      <section>
        <h2 className={sectionTitleStyles}>Distribución de Catálogo</h2>
        <ProductosOperadorWidget {...{ operadores, productos }} />
      </section>

      {/* Ránkings Principales */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <section>
          <h3 className={sectionTitleStyles}>Líderes en Ventas</h3>
          <TopColaboradoresPanel {...{ topColaboradores, hayDatos }} />
        </section>

        <section>
          <h3 className={sectionTitleStyles}>Productos Estrella</h3>
          <TopProductosPanel {...{ topProductos, hayDatos }} />
        </section>
      </div>

      {/* Análisis por Segmentación */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <section>
          <h3 className={sectionTitleStyles}>Segmentación por Sector</h3>
          <SectorAnalysis {...{ bySector, hayDatos }} />
        </section>

        <section>
          <h3 className={sectionTitleStyles}>Análisis de Familias</h3>
          <FamiliaAnalysis {...{ byFamilia, hayDatos }} />
        </section>
      </div>

      {/* Distribución Geográfica */}
      <section>
        <h3 className={sectionTitleStyles}>Penetración Territorial</h3>
        <GeoDistributionPanel {...{ byZona }} />
      </section>

      {/* Evolución Temporal */}
      <section>
        <h3 className={sectionTitleStyles}>Trayectoria y Cronología</h3>
        <EvolucionTemporalPanel {...{ evolucionTemporal, periodoEvolucion, hayDatos }} />
      </section>

      {/* Tendencias y Productividad */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 pb-16">
        <section>
          <h3 className={sectionTitleStyles}>Tendencias de Mercado</h3>
          <TendenciasPanel {...{ evolucionTemporal, periodoEvolucion, topProductos, topColaboradores }} />
        </section>
        <section>
          <h3 className={sectionTitleStyles}>Indicadores de Productividad</h3>
          <ProductividadPanel {...{ colaboradores, total, topColaboradores, topProductos, facturacionTotal, margen, comBruta, hayDatos }} />
        </section>
      </div>
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