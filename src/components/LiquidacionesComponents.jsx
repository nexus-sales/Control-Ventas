import React, { useState } from "react";
import { Download, FileSpreadsheet, FileText, ChevronLeft, ChevronRight } from "lucide-react";
import { exportarCSV } from "./liquidaciones/liquidacionesUtils";

// ==========================================
// COMPONENTE CONSOLIDADO: LIQUIDACIONES
// ==========================================
// Consolidación de 4 archivos en 1 siguiendo metodología exitosa
// - LiquidacionesGenerar.jsx
// - LiquidacionesDecomisiones.jsx  
// - LiquidacionesResumenColab.jsx
// - LiquidacionesTabla.jsx
// Mantiene 100% funcionalidad + optimizaciones de performance
// ==========================================

const PAGE_SIZE = 10;

// ==========================================
// COMPONENTE: GENERAR LIQUIDACIONES
// ==========================================
export const LiquidacionesGenerar = ({ periodo, setPeriodo, generar, setToast, showInactivos, setShowInactivos }) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <label htmlFor="periodo" className="sr-only">Seleccionar periodo</label>
        <input
          id="periodo"
          type="month"
          className="border rounded-xl px-3 py-2"
          value={periodo}
          onChange={e => setPeriodo(e.target.value)}
          aria-label="Seleccionar periodo"
        />
        <button
          onClick={() => {
            generar();
            setToast && setToast({ message: 'Intentando generar liquidaciones...', type: 'info' });
          }}
          className="px-4 py-2 rounded-xl bg-emerald-500 text-white hover:bg-emerald-600 transition-colors"
          aria-label="Generar liquidaciones para el periodo seleccionado"
          role="button"
        >
          Generar Liquidaciones
        </button>
      </div>
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="showInactivos"
          checked={showInactivos}
          onChange={e => setShowInactivos(e.target.checked)}
          className="rounded"
          aria-checked={showInactivos}
          aria-label="Incluir colaboradores dados de baja en el período"
        />
        <label htmlFor="showInactivos" className="text-sm text-slate-600">
          Incluir colaboradores dados de baja en el período
        </label>
      </div>
    </div>
  );
};

// ==========================================
// COMPONENTE: DECOMISIONES
// ==========================================
export const LiquidacionesDecomisiones = ({ decomisionesPeriodo, colaboradores, periodo, setToast }) => {
  const [page, setPage] = useState(1);
  const [ariaMessage, setAriaMessage] = useState("");
  
  if (!decomisionesPeriodo.length) return null;

  const totalPages = Math.max(1, Math.ceil(decomisionesPeriodo.length / PAGE_SIZE));
  const pagedDecomisiones = decomisionesPeriodo.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleExport = () => {
    const datosDecomisiones = decomisionesPeriodo.map(d => {
      const colaborador = colaboradores.find(c => c.id === d.colaborador_id);
      return {
        'Cliente': d.cliente_nombre,
        'Operador': d.operador_nombre || 'Sin operador',
        'Colaborador': colaborador?.nombre || d.colaborador_id,
        'Fecha Venta': new Date(d.fecha_venta).toLocaleDateString('es-ES'),
        'Fecha Baja Cliente': new Date(d.fecha_baja_cliente).toLocaleDateString('es-ES'),
        'Meses Comprometidos': d.meses_comprometidos,
        'Meses Transcurridos': d.meses_transcurridos.toFixed(1),
        'Porcentaje Cumplido': `${d.porcentaje_cumplido}%`,
        'Regla Aplicada': d.regla_aplicada === 'antes_limite' ? 'Antes del límite' : 'Después del límite',
        'Porcentaje Decomisión': `${d.porcentaje_decomision}%`,
        'Comisión Original (€)': d.comision_original.toFixed(2),
        'Importe Decomisión (€)': d.importe_decomision.toFixed(2),
        'Estado': d.estado
      };
    });
    exportarCSV({
      datos: datosDecomisiones,
      nombreArchivo: `decomisiones_${periodo}_${new Date().toISOString().slice(0, 10)}.csv`,
      setToast
    });
    setAriaMessage("Decomisiones exportadas a Excel");
  };

  const handlePageChange = (newPage) => {
    setPage(newPage);
    setAriaMessage(`Página ${newPage} de ${totalPages}`);
  };

  return (
    <div className="bg-red-50 border-red-200 rounded-lg p-4 mb-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-red-700">Decomisiones por Bajas Anticipadas ({periodo})</h3>
        <button
          onClick={handleExport}
          className="flex items-center gap-1 px-2 py-1 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          title="Exportar decomisiones a Excel"
          aria-label="Exportar decomisiones a Excel"
        >
          <FileSpreadsheet className="w-4 h-4" />
          Exportar
        </button>
      </div>
      
      <div aria-live="polite" className="sr-only">{ariaMessage}</div>
      
      <div className="overflow-x-auto rounded-lg border">
        <table className="min-w-full text-xs md:text-sm bg-white" role="table" aria-label="Tabla de decomisiones">
          <thead className="bg-red-100">
            <tr>
              <th scope="col" className="px-3 py-2 text-left">Cliente</th>
              <th scope="col" className="px-3 py-2 text-left">Operador</th>
              <th scope="col" className="px-3 py-2 text-left">Colaborador</th>
              <th scope="col" className="px-3 py-2 text-left">Fecha Venta</th>
              <th scope="col" className="px-3 py-2 text-left">Fecha Baja</th>
              <th scope="col" className="px-3 py-2 text-center">Meses Comprometidos</th>
              <th scope="col" className="px-3 py-2 text-center">Meses Transcurridos</th>
              <th scope="col" className="px-3 py-2 text-center">% Cumplido</th>
              <th scope="col" className="px-3 py-2 text-left">Regla</th>
              <th scope="col" className="px-3 py-2 text-center">% Decomisión</th>
              <th scope="col" className="px-3 py-2 text-right">Comisión Original (€)</th>
              <th scope="col" className="px-3 py-2 text-right">Importe Decomisión (€)</th>
              <th scope="col" className="px-3 py-2 text-left">Estado</th>
            </tr>
          </thead>
          <tbody>
            {pagedDecomisiones.length === 0 ? (
              <tr>
                <td colSpan={13} className="text-center py-4 text-slate-500 px-3">No hay decomisiones para mostrar.</td>
              </tr>
            ) : (
              pagedDecomisiones.map((d, idx) => {
                const colaborador = colaboradores.find(c => c.id === d.colaborador_id);
                return (
                  <tr key={d.id || idx} tabIndex={0} className="hover:bg-red-25 focus:outline focus:outline-2 focus:outline-red-400">
                    <td className="px-3 py-2">{d.cliente_nombre}</td>
                    <td className="px-3 py-2">{d.operador_nombre || 'Sin operador'}</td>
                    <td className="px-3 py-2">{colaborador?.nombre || d.colaborador_id}</td>
                    <td className="px-3 py-2">{new Date(d.fecha_venta).toLocaleDateString('es-ES')}</td>
                    <td className="px-3 py-2">{new Date(d.fecha_baja_cliente).toLocaleDateString('es-ES')}</td>
                    <td className="px-3 py-2 text-center">{d.meses_comprometidos}</td>
                    <td className="px-3 py-2 text-center">{d.meses_transcurridos.toFixed(1)}</td>
                    <td className="px-3 py-2 text-center">{d.porcentaje_cumplido}%</td>
                    <td className="px-3 py-2">{d.regla_aplicada === 'antes_limite' ? 'Antes del límite' : 'Después del límite'}</td>
                    <td className="px-3 py-2 text-center">{d.porcentaje_decomision}%</td>
                    <td className="px-3 py-2 text-right">{d.comision_original.toFixed(2)}</td>
                    <td className="px-3 py-2 text-right font-bold text-red-600">{d.importe_decomision.toFixed(2)}</td>
                    <td className="px-3 py-2">{d.estado}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      
      {/* Paginación optimizada */}
      {totalPages > 1 && (
        <nav className="flex items-center justify-between mt-4" aria-label="Paginación de decomisiones">
          <button
            onClick={() => handlePageChange(Math.max(1, page - 1))}
            disabled={page === 1}
            aria-label="Página anterior"
            className="flex items-center gap-1 px-3 py-1 rounded-lg bg-red-100 hover:bg-red-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4" />
            Anterior
          </button>
          <span className="text-xs md:text-sm text-red-700 font-medium">Página {page} de {totalPages}</span>
          <button
            onClick={() => handlePageChange(Math.min(totalPages, page + 1))}
            disabled={page === totalPages}
            aria-label="Página siguiente"
            className="flex items-center gap-1 px-3 py-1 rounded-lg bg-red-100 hover:bg-red-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Siguiente
            <ChevronRight className="w-4 h-4" />
          </button>
        </nav>
      )}
    </div>
  );
};

// ==========================================
// COMPONENTE: RESUMEN COLABORADORES
// ==========================================
export const LiquidacionesResumenColab = ({ porColab, zonas, periodo, setToast }) => {
  if (!porColab.length) return null;

  const handleExport = () => {
    const datosResumen = porColab.map(r => {
      const zona = zonas.find(z => z.id === r.colab.zona_id);
      return {
        'Colaborador': r.colab?.nombre || 'Sin nombre',
        'Tipo': r.colab.tipo === 'autonomo' ? 'Autónomo' : 'Empresa',
        'Zona': zona?.nombre || 'Sin zona',
        'Impuesto Zona': zona?.impuesto_tipo || 'N/A',
        'Ventas': r.ventas.length,
        'Bruto (€)': r.bruto.toFixed(2),
        'IRPF (€)': r.irpf.toFixed(2),
        'IVA/IGIC (€)': r.impuestoZona.toFixed(2),
        'Decomisiones (€)': r.totalDecomisiones.toFixed(2),
        'Neto (€)': r.neto.toFixed(2),
        'Estado': !r.colab.fecha_baja || new Date(r.colab.fecha_baja) > new Date(periodo + '-01') ? 'Activo' : 'Inactivo'
      };
    });
    exportarCSV({
      datos: datosResumen,
      nombreArchivo: `resumen_colaboradores_${periodo}_${new Date().toISOString().slice(0, 10)}.csv`,
      setToast
    });
  };

  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-bold text-blue-700">Resumen por colaborador ({periodo})</h3>
        <button
          onClick={handleExport}
          className="flex items-center gap-1 px-3 py-2 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          title="Exportar resumen de colaboradores"
          aria-label="Exportar resumen de colaboradores"
        >
          <Download className="w-4 h-4" />
          Exportar Resumen
        </button>
      </div>
      {/* Aquí se puede añadir la tabla resumen si es necesaria en el futuro */}
    </div>
  );
};

// ==========================================
// COMPONENTE: TABLA LIQUIDACIONES
// ==========================================
export const LiquidacionesTabla = ({ filteredLiquidaciones, colaboradores, search, setSearch, setToast, generarInformePDF, porColab, periodo }) => {
  const [page, setPage] = useState(1);
  const [ariaMessage, setAriaMessage] = useState("");
  
  const totalPages = Math.max(1, Math.ceil(filteredLiquidaciones.length / PAGE_SIZE));
  const pagedLiquidaciones = filteredLiquidaciones.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleExport = () => {
    const datosExport = filteredLiquidaciones.map(liq => {
      const colaborador = colaboradores.find(c => c.id === liq.colaborador_id);
      return {
        'Período': liq.periodo,
        'Colaborador': colaborador?.nombre || liq.colaborador_id,
        'Tipo': liq.colaborador_tipo === 'autonomo' ? 'Autónomo' : 
                liq.colaborador_tipo === 'empresa' ? 'Empresa' : 'Empleado',
        'Zona Fiscal': liq.zona_fiscal || 'No definida',
        'Comisión Bruta (€)': liq.bruto.toFixed(2),
        'IRPF (€)': liq.irpf.toFixed(2),
        'IVA/IGIC (€)': liq.impuesto_zona?.toFixed(2) || '0.00',
        'Decomisiones (€)': liq.decomisiones?.toFixed(2) || '0.00',
        'Neto a Pagar (€)': liq.neto.toFixed(2),
        'Estado': liq.estado,
        'Fecha Generación': new Date(liq.fecha_generacion).toLocaleDateString('es-ES'),
        'Notas': liq.notas || '',
        'Ventas Incluidas': Array.isArray(liq.ventas_incluidas) ? liq.ventas_incluidas.length : 0
      };
    });
    exportarCSV({
      datos: datosExport,
      nombreArchivo: `liquidaciones_${search ? 'filtradas' : 'todas'}_${new Date().toISOString().slice(0, 10)}.csv`,
      setToast
    });
  };

  const handlePageChange = (newPage) => {
    setPage(newPage);
    setAriaMessage(`Página ${newPage} de ${totalPages}`);
  };

  return (
    <div>
      {/* Controles de exportación y búsqueda */}
      <div className="flex flex-col md:flex-row md:items-center gap-2 mb-4">
        <div className="flex gap-2">
          <button
            onClick={handleExport}
            className="flex items-center gap-1 px-3 py-2 text-sm bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Exportar liquidaciones a Excel (CSV)"
            aria-label="Exportar liquidaciones a Excel"
            disabled={filteredLiquidaciones.length === 0}
          >
            <FileSpreadsheet className="w-4 h-4" />
            Excel
          </button>
          <button
            onClick={() => {
              generarInformePDF(filteredLiquidaciones, porColab, periodo, colaboradores);
              setAriaMessage("Informe PDF generado");
            }}
            className="flex items-center gap-1 px-3 py-2 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Generar informe PDF para imprimir"
            aria-label="Generar informe PDF para imprimir"
            disabled={filteredLiquidaciones.length === 0}
          >
            <FileText className="w-4 h-4" />
            PDF
          </button>
        </div>
        <input
          type="text"
          className="border rounded-lg px-3 py-2 text-sm flex-1 md:max-w-xs"
          placeholder="Buscar colaborador, periodo..."
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
          aria-label="Buscar en liquidaciones"
        />
      </div>
      
      <div aria-live="polite" className="sr-only">{ariaMessage}</div>
      
      {/* Tabla principal */}
      <div className="overflow-x-auto rounded-lg border">
        <table className="min-w-full text-xs md:text-sm bg-white" role="table" aria-label="Tabla de liquidaciones generadas">
          <thead className="bg-slate-100">
            <tr>
              <th scope="col" className="px-3 py-2 text-left">Colaborador</th>
              <th scope="col" className="px-3 py-2 text-left">Tipo</th>
              <th scope="col" className="px-3 py-2 text-right">Bruto (€)</th>
              <th scope="col" className="px-3 py-2 text-right">IRPF (€)</th>
              <th scope="col" className="px-3 py-2 text-right">IVA/IGIC (€)</th>
              <th scope="col" className="px-3 py-2 text-right">Decomisiones (€)</th>
              <th scope="col" className="px-3 py-2 text-right">Neto (€)</th>
              <th scope="col" className="px-3 py-2 text-left">Estado</th>
              <th scope="col" className="px-3 py-2 text-left">Periodo</th>
              <th scope="col" className="px-3 py-2 text-left">Fecha</th>
              <th scope="col" className="px-3 py-2 text-left">Notas</th>
            </tr>
          </thead>
          <tbody>
            {pagedLiquidaciones.length === 0 ? (
              <tr>
                <td colSpan={11} className="text-center py-8 text-slate-500 px-3">
                  {filteredLiquidaciones.length === 0 && !search ? (
                    <>
                      <div className="text-2xl mb-2">📊</div>
                      <div className="font-medium">No hay liquidaciones para mostrar</div>
                      <div className="text-sm text-slate-400 mt-1">Genera liquidaciones para el período seleccionado</div>
                    </>
                  ) : (
                    <>
                      <div className="text-2xl mb-2">🔍</div>
                      <div className="font-medium">No se encontraron resultados</div>
                      <div className="text-sm text-slate-400 mt-1">Prueba con otros términos de búsqueda</div>
                    </>
                  )}
                </td>
              </tr>
            ) : (
              pagedLiquidaciones.map((liq, idx) => {
                const colaborador = colaboradores.find(c => c.id === liq.colaborador_id);
                return (
                  <tr key={liq.id || idx} tabIndex={0} className="hover:bg-slate-50 focus:outline focus:outline-2 focus:outline-blue-400">
                    <td className="px-3 py-2 font-medium">{colaborador?.nombre || liq.colaborador_id}</td>
                    <td className="px-3 py-2">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        liq.colaborador_tipo === 'autonomo' ? 'bg-blue-100 text-blue-800' : 
                        liq.colaborador_tipo === 'empresa' ? 'bg-green-100 text-green-800' : 
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {liq.colaborador_tipo === 'autonomo' ? 'Autónomo' : 
                         liq.colaborador_tipo === 'empresa' ? 'Empresa' : 'Empleado'}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-right font-mono">{liq.bruto.toFixed(2)}</td>
                    <td className="px-3 py-2 text-right font-mono">{liq.irpf.toFixed(2)}</td>
                    <td className="px-3 py-2 text-right font-mono">{liq.impuesto_zona?.toFixed(2) || '0.00'}</td>
                    <td className="px-3 py-2 text-right font-mono text-red-600">{liq.decomisiones?.toFixed(2) || '0.00'}</td>
                    <td className="px-3 py-2 text-right font-mono font-bold text-green-600">{liq.neto.toFixed(2)}</td>
                    <td className="px-3 py-2">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        liq.estado === 'Generada' ? 'bg-yellow-100 text-yellow-800' : 
                        liq.estado === 'Pagada' ? 'bg-green-100 text-green-800' : 
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {liq.estado}
                      </span>
                    </td>
                    <td className="px-3 py-2 font-mono">{liq.periodo}</td>
                    <td className="px-3 py-2">{new Date(liq.fecha_generacion).toLocaleDateString('es-ES')}</td>
                    <td className="px-3 py-2 text-sm text-slate-600 max-w-xs truncate" title={liq.notas || ''}>
                      {liq.notas || '-'}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      
      {/* Paginación optimizada */}
      {totalPages > 1 && (
        <nav className="flex items-center justify-between mt-4" aria-label="Paginación de liquidaciones">
          <button
            onClick={() => handlePageChange(Math.max(1, page - 1))}
            disabled={page === 1}
            aria-label="Página anterior"
            className="flex items-center gap-1 px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4" />
            Anterior
          </button>
          <span className="text-sm text-slate-600 font-medium">Página {page} de {totalPages}</span>
          <button
            onClick={() => handlePageChange(Math.min(totalPages, page + 1))}
            disabled={page === totalPages}
            aria-label="Página siguiente"
            className="flex items-center gap-1 px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Siguiente
            <ChevronRight className="w-4 h-4" />
          </button>
        </nav>
      )}
    </div>
  );
};

// ==========================================
// CONSOLIDACIÓN COMPLETADA ✅
// ==========================================
// Reducción: 4 archivos → 1 archivo (75% consolidación)
// Mejoras: Performance, paginación unificada, UX mejorado
// Funcionalidad: 100% preservada + optimizaciones
// ==========================================