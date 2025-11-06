import React, { useState } from "react";
import { FileSpreadsheet } from "lucide-react";
import { exportarCSV } from "./liquidacionesUtils";

export default function LiquidacionesDecomisiones({ decomisionesPeriodo, colaboradores, periodo, setToast }) {

  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;
  const totalPages = Math.max(1, Math.ceil(decomisionesPeriodo.length / PAGE_SIZE));
  const pagedDecomisiones = decomisionesPeriodo.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const [ariaMessage, setAriaMessage] = useState("");

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

  if (!decomisionesPeriodo.length) return null;

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
              <th scope="col">Cliente</th>
              <th scope="col">Operador</th>
              <th scope="col">Colaborador</th>
              <th scope="col">Fecha Venta</th>
              <th scope="col">Fecha Baja</th>
              <th scope="col">Meses Comprometidos</th>
              <th scope="col">Meses Transcurridos</th>
              <th scope="col">% Cumplido</th>
              <th scope="col">Regla</th>
              <th scope="col">% Decomisión</th>
              <th scope="col">Comisión Original (€)</th>
              <th scope="col">Importe Decomisión (€)</th>
              <th scope="col">Estado</th>
            </tr>
          </thead>
          <tbody>
            {pagedDecomisiones.length === 0 ? (
              <tr>
                <td colSpan={13} className="text-center py-4 text-slate-500">No hay decomisiones para mostrar.</td>
              </tr>
            ) : (
              pagedDecomisiones.map((d, idx) => {
                const colaborador = colaboradores.find(c => c.id === d.colaborador_id);
                return (
                  <tr key={d.id || idx} tabIndex={0} className="focus:outline focus:outline-2 focus:outline-red-400">
                    <td>{d.cliente_nombre}</td>
                    <td>{d.operador_nombre || 'Sin operador'}</td>
                    <td>{colaborador?.nombre || d.colaborador_id}</td>
                    <td>{new Date(d.fecha_venta).toLocaleDateString('es-ES')}</td>
                    <td>{new Date(d.fecha_baja_cliente).toLocaleDateString('es-ES')}</td>
                    <td className="text-right">{d.meses_comprometidos}</td>
                    <td className="text-right">{d.meses_transcurridos.toFixed(1)}</td>
                    <td className="text-right">{d.porcentaje_cumplido}%</td>
                    <td>{d.regla_aplicada === 'antes_limite' ? 'Antes del límite' : 'Después del límite'}</td>
                    <td className="text-right">{d.porcentaje_decomision}%</td>
                    <td className="text-right">{d.comision_original.toFixed(2)}</td>
                    <td className="text-right font-bold">{d.importe_decomision.toFixed(2)}</td>
                    <td>{d.estado}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      {/* Paginación accesible */}
      <nav className="flex items-center justify-between mt-2" aria-label="Paginación de decomisiones">
        <button
          onClick={() => handlePageChange(Math.max(1, page - 1))}
          disabled={page === 1}
          aria-label="Página anterior"
          className="p-2 rounded-lg bg-red-100 hover:bg-red-200 disabled:opacity-50"
        >
          &#8592;
        </button>
        <span className="text-xs md:text-sm">Página {page} de {totalPages}</span>
        <button
          onClick={() => handlePageChange(Math.min(totalPages, page + 1))}
          disabled={page === totalPages}
          aria-label="Página siguiente"
          className="p-2 rounded-lg bg-red-100 hover:bg-red-200 disabled:opacity-50"
        >
          &#8594;
        </button>
      </nav>
    </div>
  );
}
