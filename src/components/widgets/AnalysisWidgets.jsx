// src/components/widgets/AnalysisWidgets.jsx
// Consolidado: VentasEnProceso, AnalisisRendimiento, FiltrosPersonalizados, SmartFilters
import React from 'react';
import VentasEnProceso from './VentasEnProceso';
import AnalisisRendimiento from './AnalisisRendimiento';
import FiltrosPersonalizados from './FiltrosPersonalizados';
import SmartFilters from './SmartFilters';

/**
 * Componente consolidado para análisis y filtros de ventas.
 * Props:
 * - ventas
 * - productos
 * - operadores
 * - colaboradores
 * - onNavigate
 * - currentFilters
 * - onApplyFilters
 */
export default function AnalysisWidgets({ ventas, productos, operadores, colaboradores, onNavigate, currentFilters, onApplyFilters }) {
  return (
    <div className="space-y-6">
      <VentasEnProceso ventas={ventas} onNavigate={onNavigate} />
      <AnalisisRendimiento ventas={ventas} productos={productos} operadores={operadores} onNavigate={onNavigate} />
      <FiltrosPersonalizados ventas={ventas} onNavigate={onNavigate} />
      <SmartFilters currentFilters={currentFilters} onApplyFilters={onApplyFilters} colaboradores={colaboradores} />
    </div>
  );
}
