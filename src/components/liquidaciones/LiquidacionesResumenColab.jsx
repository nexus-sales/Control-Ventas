import React from "react";
import { Download } from "lucide-react";
import { exportarCSV } from "./liquidacionesUtils";

export default function LiquidacionesResumenColab({ porColab, zonas, periodo, setToast }) {
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
      {/* Aquí iría la tabla resumen, se puede migrar después */}
    </div>
  );
}
