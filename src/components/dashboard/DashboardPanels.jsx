// src/components/dashboard/DashboardPanels.jsx
// Consolidado: KPIsPanel, SectorAnalysis, FamiliaAnalysis, GeoDistributionPanel, EvolucionTemporalPanel, TopColaboradoresPanel, TopProductosPanel, ExtraMetricsPanel, PipelinePanel, TendenciasPanel, ProductividadPanel, MetricsPanel
import React from 'react';
import KPIsPanel from './KPIsPanel';
import SectorAnalysis from './SectorAnalysis';
import FamiliaAnalysis from './FamiliaAnalysis';
import GeoDistributionPanel from './GeoDistributionPanel';
import EvolucionTemporalPanel from './EvolucionTemporalPanel';
import TopColaboradoresPanel from './TopColaboradoresPanel';
import TopProductosPanel from './TopProductosPanel';
import ExtraMetricsPanel from './ExtraMetricsPanel';
import PipelinePanel from './PipelinePanel';
import TendenciasPanel from './TendenciasPanel';
import ProductividadPanel from './ProductividadPanel';
import MetricsPanel from './MetricsPanel';

/**
 * Componente consolidado para todos los paneles del dashboard.
 * Props: Recibe todos los datos necesarios para los paneles.
 */
export default function DashboardPanels(props) {
  return (
    <>
      <KPIsPanel {...props} />
      <SectorAnalysis {...props} />
      <FamiliaAnalysis {...props} />
      <GeoDistributionPanel {...props} />
      <EvolucionTemporalPanel {...props} />
      <TopColaboradoresPanel {...props} />
      <TopProductosPanel {...props} />
      <ExtraMetricsPanel {...props} />
      <PipelinePanel {...props} />
      <TendenciasPanel {...props} />
      <ProductividadPanel {...props} />
      <MetricsPanel {...props} />
    </>
  );
}
