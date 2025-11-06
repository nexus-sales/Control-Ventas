
import React, { useState } from "react";
import { FileSpreadsheet, FileText, ChevronLeft, ChevronRight } from "lucide-react";
import { exportarCSV } from "./liquidacionesUtils";

const PAGE_SIZE = 10;

export default function LiquidacionesTabla({ filteredLiquidaciones, colaboradores, search, setSearch, setToast, generarInformePDF, porColab, periodo }) {
  const [page, setPage] = useState(1);
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

  // Accesibilidad: feedback ARIA para cambios de tabla
  // El contenedor aria-live anunciará cambios de página y exportaciones
  const [ariaMessage, setAriaMessage] = useState("");

  const handlePageChange = (newPage) => {
    setPage(newPage);
    setAriaMessage(`Página ${newPage} de ${totalPages}`);
  };

  return (
    <div>
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
          className="border rounded-lg px-2 py-1 text-sm"
          placeholder="Buscar colaborador, periodo..."
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
          aria-label="Buscar en liquidaciones"
        />
      </div>
      <div aria-live="polite" className="sr-only">{ariaMessage}</div>
      <div className="overflow-x-auto rounded-lg border">
        <table className="min-w-full text-xs md:text-sm bg-white" role="table" aria-label="Tabla de liquidaciones generadas">
          <thead className="bg-slate-100">
            <tr>
              <th scope="col">Colaborador</th>
              <th scope="col">Tipo</th>
              <th scope="col">Bruto (€)</th>
              <th scope="col">IRPF (€)</th>
              <th scope="col">IVA/IGIC (€)</th>
              <th scope="col">Decomisiones (€)</th>
              <th scope="col">Neto (€)</th>
              <th scope="col">Estado</th>
              <th scope="col">Periodo</th>
              <th scope="col">Fecha</th>
              <th scope="col">Notas</th>
            </tr>
          </thead>
          <tbody>
            {pagedLiquidaciones.length === 0 ? (
              <tr>
                <td colSpan={11} className="text-center py-4 text-slate-500">No hay liquidaciones para mostrar.</td>
              </tr>
            ) : (
              pagedLiquidaciones.map((liq, idx) => {
                const colaborador = colaboradores.find(c => c.id === liq.colaborador_id);
                return (
                  <tr key={liq.id || idx} tabIndex={0} className="focus:outline focus:outline-2 focus:outline-blue-400">
                    <td>{colaborador?.nombre || liq.colaborador_id}</td>
                    <td>{liq.colaborador_tipo === 'autonomo' ? 'Autónomo' : liq.colaborador_tipo === 'empresa' ? 'Empresa' : 'Empleado'}</td>
                    <td className="text-right">{liq.bruto.toFixed(2)}</td>
                    <td className="text-right">{liq.irpf.toFixed(2)}</td>
                    <td className="text-right">{liq.impuesto_zona?.toFixed(2) || '0.00'}</td>
                    <td className="text-right">{liq.decomisiones?.toFixed(2) || '0.00'}</td>
                    <td className="text-right font-bold">{liq.neto.toFixed(2)}</td>
                    <td>{liq.estado}</td>
                    <td>{liq.periodo}</td>
                    <td>{new Date(liq.fecha_generacion).toLocaleDateString('es-ES')}</td>
                    <td>{liq.notas || ''}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      {/* Paginación accesible */}
      <nav className="flex items-center justify-between mt-2" aria-label="Paginación de liquidaciones">
        <button
          onClick={() => handlePageChange(Math.max(1, page - 1))}
          disabled={page === 1}
          aria-label="Página anterior"
          className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 disabled:opacity-50"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="text-xs md:text-sm">Página {page} de {totalPages}</span>
        <button
          onClick={() => handlePageChange(Math.min(totalPages, page + 1))}
          disabled={page === totalPages}
          aria-label="Página siguiente"
          className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 disabled:opacity-50"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </nav>
    </div>
  );
}
