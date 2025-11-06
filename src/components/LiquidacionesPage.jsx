import LiquidacionesGenerar from "./liquidaciones/LiquidacionesGenerar";
import LiquidacionesDecomisiones from "./liquidaciones/LiquidacionesDecomisiones";
import LiquidacionesResumenColab from "./liquidaciones/LiquidacionesResumenColab";
import LiquidacionesTabla from "./liquidaciones/LiquidacionesTabla";
import { monthOf, sum, calcularDecomisiones, calcularIRPF, obtenerDatosZona } from "./liquidaciones/liquidacionesUtils";
import { useMemo, useState, useContext, useCallback } from "react";
import Toast from "./ui/Toast";
import Card from "./ui/Card";
import SectionTitle from "./ui/SectionTitle";
import Pill from "./ui/Pill";
import { DataCtx } from "../context/contexts";



// ============================
// FUNCIONES DE EXPORTACIÓN DRY
// ============================


// Función para generar informe PDF (usando impresión del navegador)
function generarInformePDF(liquidaciones, porColab, periodo, colaboradores) {
  const totalBruto = liquidaciones.reduce((sum, l) => sum + l.bruto, 0);
  const totalIRPF = liquidaciones.reduce((sum, l) => sum + l.irpf, 0);
  const totalDecomisiones = liquidaciones.reduce((sum, l) => sum + (l.decomisiones || 0), 0);
  const totalNeto = liquidaciones.reduce((sum, l) => sum + l.neto, 0);

  const contenidoHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Informe de Liquidaciones - ${periodo}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 40px; color: #333; }
        .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #0066cc; padding-bottom: 20px; }
        .header h1 { color: #0066cc; margin: 0; }
        .header h2 { color: #666; margin: 10px 0 0 0; font-weight: normal; }
        .section { margin: 30px 0; }
        .section h3 { color: #0066cc; border-bottom: 1px solid #ddd; padding-bottom: 5px; }
        table { width: 100%; border-collapse: collapse; margin: 15px 0; font-size: 12px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f5f5f5; font-weight: bold; }
        .text-right { text-align: right; }
        .total-row { background-color: #f0f8ff; font-weight: bold; }
        .summary-box { background-color: #f9f9f9; padding: 20px; border-radius: 5px; margin: 20px 0; }
        .amount { font-weight: bold; color: #0066cc; }
        .footer { text-align: center; margin-top: 50px; font-size: 11px; color: #666; }
        @media print { body { margin: 20px; } }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>INFORME DE LIQUIDACIONES</h1>
        <h2>Período: ${periodo}</h2>
        <p>Generado el ${new Date().toLocaleDateString('es-ES')} a las ${new Date().toLocaleTimeString('es-ES')}</p>
      </div>

      <div class="summary-box">
        <h3>Resumen Ejecutivo</h3>
        <p><strong>Total Colaboradores:</strong> ${liquidaciones.length}</p>
        <p><strong>Total Bruto:</strong> ${totalBruto.toFixed(2)} €</p>
        <p><strong>Total IRPF:</strong> ${totalIRPF.toFixed(2)} €</p>
        <p><strong>Total Decomisiones:</strong> ${totalDecomisiones.toFixed(2)} €</p>
        <p><strong>Total Neto:</strong> ${totalNeto.toFixed(2)} €</p>
      </div>

      <div class="section">
        <h3>Liquidaciones Generadas</h3>
        <table>
          <thead>
            <tr>
              <th>Colaborador</th>
              <th>Tipo</th>
              <th>Bruto</th>
              <th>IRPF</th>
              <th>IVA/IGIC</th>
              <th>Decomisiones</th>
              <th>Neto</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            ${liquidaciones.map(liq => {
              const colaborador = colaboradores.find(c => c.id === liq.colaborador_id);
              return `
                <tr>
                  <td>${colaborador?.nombre || liq.colaborador_id}</td>
                  <td>${liq.colaborador_tipo === 'autonomo' ? 'Autónomo' : liq.colaborador_tipo === 'empresa' ? 'Empresa' : 'Empleado'}</td>
                  <td style="text-align: right">${liq.bruto.toFixed(2)} €</td>
                  <td style="text-align: right">${liq.irpf.toFixed(2)} €</td>
                  <td style="text-align: right">${(liq.impuesto_zona || 0).toFixed(2)} €</td>
                  <td style="text-align: right">${(liq.decomisiones || 0).toFixed(2)} €</td>
                  <td style="text-align: right">${liq.neto.toFixed(2)} €</td>
                  <td>${liq.estado}</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>

      <div class="footer">
        <p>Este informe ha sido generado automáticamente por el Sistema de Control de Ventas</p>
        <p>Documento confidencial - Para uso interno únicamente</p>
      </div>
    </body>
    </html>
  `;

  const ventana = window.open('', '_blank');
  ventana.document.write(contenidoHTML);
  ventana.document.close();
  ventana.onload = () => ventana.print();
}

export default function LiquidacionesPage() {
  // Usar el contexto de datos
  const contextValue = useContext(DataCtx);
  const { data, dataInitialized } = contextValue;
  const setLiquidaciones = contextValue.setLiquidaciones;
  
  const ventas = useMemo(() => Array.isArray(data?.ventas) ? data.ventas : [], [data?.ventas]);
  const colaboradores = useMemo(() => Array.isArray(data?.colaboradores) ? data.colaboradores : [], [data?.colaboradores]);
    const clientes = useMemo(() => Array.isArray(data?.clientes) ? data.clientes : [], [data?.clientes]);
    const operadores = useMemo(() => Array.isArray(data?.operadores) ? data.operadores : [], [data?.operadores]);
  const zonas = useMemo(() => Array.isArray(data?.zonas) ? data.zonas : [], [data?.zonas]);
  const liquidaciones = useMemo(() => Array.isArray(data?.liquidaciones) ? data.liquidaciones : [], [data?.liquidaciones]);
  const decomisiones = useMemo(() => Array.isArray(data?.decomisiones) ? data.decomisiones : [], [data?.decomisiones]);
  
  // Función temporal para decomisiones (no está en DataContext aún)
  const setDecomisiones = useCallback((updateFn) => {
    const newDecomisiones = typeof updateFn === 'function' ? updateFn(decomisiones) : updateFn;
    // Guardar directamente en localStorage ya que no existe en el contexto
    localStorage.setItem('appcv_decomisiones', JSON.stringify(newDecomisiones));
  }, [decomisiones]);

  const [periodo, setPeriodo] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
  const [toast, setToast] = useState({ message: "", type: "info" });
  // const [liqPage, setLiqPage] = useState(1); // Paginación migrada a subcomponente
  const [search, setSearch] = useState("");
  const [showInactivos, setShowInactivos] = useState(false);
  const [showDecomisiones, setShowDecomisiones] = useState(false);
  const PAGE_SIZE = 10;

  // Filtrar colaboradores activos/inactivos
  const colaboradoresFiltrados = useMemo(() => {
    return colaboradores.filter(colaborador => {
      if (showInactivos) return true; // Mostrar todos
      
      // Solo colaboradores activos (sin fecha de baja o fecha de baja futura)
      if (!colaborador.fecha_baja) return true;
      
      const fechaBaja = new Date(colaborador.fecha_baja);
      const fechaPeriodo = new Date(periodo + '-01');
      
      return fechaBaja > fechaPeriodo;
    });
  }, [colaboradores, showInactivos, periodo]);

  // Ventas del periodo en estado Cerrada o Liquidada
  const ventasPeriodo = useMemo(
    () =>
      ventas.filter(
        (v) =>
          (v.estado === "Cerrada" || v.estado === "Liquidada") &&
          monthOf(v.fecha) === periodo,
      ),
    [ventas, periodo],
  );

  // Calcular decomisiones por bajas anticipadas del período
  const decomisionesPeriodo = useMemo(() => {
    return calcularDecomisiones(ventasPeriodo, clientes, operadores);
  }, [ventasPeriodo, clientes, operadores]);

  const porColab = useMemo(() => {
    const map = new Map();
    ventasPeriodo.forEach((v) => {
      const k = v.colaborador_id;
      if (!map.has(k)) map.set(k, []);
      map.get(k).push(v);
    });
    
    return Array.from(map.entries()).map(([colabId, lista]) => {
      const colab = colaboradoresFiltrados.find((c) => c.id === colabId);
      if (!colab) return null; // Colaborador no encontrado o inactivo
      
      const bruto = sum(lista, (x) =>
        x._calc?.ok ? x._calc.detalle.comBruta : 0,
      );
      
      // Calcular decomisiones pendientes para este colaborador en el período
      const decomisionesColab = decomisionesPeriodo.filter(d => d.colaborador_id === colabId);
      const totalDecomisiones = decomisionesColab.reduce((sum, d) => sum + d.importe_decomision, 0);
      
      // Calcular IRPF según el tipo de colaborador y antigüedad
      const irpf = calcularIRPF(colab, bruto);
      
      // Obtener datos de zona para IVA/IGIC
      const datosZona = obtenerDatosZona(colab, zonas);
      
      // Calcular IVA/IGIC si aplica
      const impuestoZona = colab.tipo === 'empresa' && datosZona.impuesto_pct > 0 
        ? (bruto * datosZona.impuesto_pct) / 100 
        : 0;
      
      // Calcular neto considerando decomisiones
      const neto = bruto - irpf - impuestoZona - totalDecomisiones;
      
      return { 
        colab, 
        ventas: lista, 
        bruto, 
        irpf,
        impuestoZona,
        datosZona,
        decomisiones: decomisionesColab,
        totalDecomisiones,
        neto 
      };
    }).filter(Boolean); // Eliminar elementos null
  }, [ventasPeriodo, colaboradoresFiltrados, zonas, decomisionesPeriodo]);

  const yaExiste = (colabId) =>
    liquidaciones.some(
      (l) => l.periodo === periodo && l.colaborador_id === colabId,
    );

  const generar = () => {
    if (porColab.length === 0) {
      setToast({
        message: "No hay ventas cerradas para colaboradores activos en este período.",
        type: "warning",
      });
      return;
    }

    const nuevas = porColab.map((r) => ({
      id: `liq_${periodo}_${r.colab.id}`,
      periodo,
      colaborador_id: r.colab.id,
      colaborador_tipo: r.colab.tipo,
      colaborador_nombre: r.colab.nombre,
      zona_fiscal: r.datosZona.impuesto_tipo,
      bruto: r.bruto,
      irpf: r.irpf,
      impuesto_zona: r.impuestoZona,
      decomisiones: r.totalDecomisiones,
      neto: r.neto,
      estado: "Generada",
      notas: r.decomisiones.length > 0 ? `Incluye ${r.decomisiones.length} decomisión(es) por bajas anticipadas` : "",
      fecha_generacion: new Date().toISOString(),
      ventas_incluidas: r.ventas.map(v => v.id),
      decomisiones_incluidas: r.decomisiones.map(d => d.venta_id),
    }));

    const filtradas = nuevas.filter((n) => !yaExiste(n.colaborador_id));

    if (!filtradas.length) {
      setToast({
        message: "No hay nuevas liquidaciones para generar. Todas ya existen para este período.",
        type: "error",
      });
      return;
    }

    setLiquidaciones((arr) => [...filtradas, ...arr]);

    // Guardar decomisiones generadas
    if (decomisionesPeriodo.length > 0) {
      setDecomisiones((arr) => [
        ...decomisionesPeriodo.map(d => ({...d, id: `decomision_${Date.now()}_${d.venta_id}`, fecha_generacion: new Date().toISOString()})),
        ...arr
      ]);
    }

    setToast({
      message: `Se generaron ${filtradas.length} liquidaciones correctamente. ${decomisionesPeriodo.length > 0 ? `Incluidas ${decomisionesPeriodo.length} decomisiones por bajas anticipadas.` : ''}`,
      type: "success",
    });
  };


  const filteredLiquidaciones = useMemo(() => {
    if (!search.trim()) return liquidaciones;
    return liquidaciones.filter((l) => {
      const colab = colaboradores.find((c) => c.id === l.colaborador_id);
      return (
        (colab?.nombre || "").toLowerCase().includes(search.toLowerCase()) ||
        l.colaborador_id?.toLowerCase().includes(search.toLowerCase()) ||
        l.periodo.includes(search)
      );
    });
  }, [liquidaciones, colaboradores, search]);

  // Mostrar loading mientras se cargan los datos
  if (!dataInitialized) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-slate-200 rounded w-1/4" />
          <div className="h-32 bg-slate-200 rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      <Toast
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ message: "", type: "info" })}
      />
      
      {/* Alertas de configuración */}
      {colaboradores.some(c => !c.zona_id) && (
        <Card className="bg-orange-50 border-orange-200">
          <div className="flex items-center gap-2 text-orange-700">
            <span className="text-lg">⚠️</span>
            <div>
              <p className="font-medium">Colaboradores sin zona fiscal asignada</p>
              <p className="text-sm">Algunos colaboradores no tienen zona fiscal configurada. Esto puede afectar el cálculo de impuestos.</p>
            </div>
          </div>
        </Card>
      )}

      {/* Alerta si no hay operadores configurados */}
      {operadores.length === 0 && (
        <Card className="bg-yellow-50 border-yellow-200">
          <div className="flex items-center gap-2 text-yellow-700">
            <span className="text-lg">⚠️</span>
            <div>
              <p className="font-medium">No hay operadores configurados</p>
              <p className="text-sm">Para calcular decomisiones correctamente, necesitas configurar operadores con sus reglas específicas.</p>
            </div>
          </div>
        </Card>
      )}

      {/* Alerta de decomisiones pendientes */}
      {decomisionesPeriodo.length > 0 && (
        <Card className="bg-red-50 border-red-200">
          <div className="flex items-center gap-2 text-red-700">
            <span className="text-lg">🚨</span>
            <div>
              <p className="font-medium">Decomisiones por bajas anticipadas detectadas</p>
              <p className="text-sm">Se detectaron {decomisionesPeriodo.length} casos de bajas anticipadas que requieren decomisión de comisiones.</p>
              <button
                onClick={() => setShowDecomisiones(!showDecomisiones)}
                className="mt-2 px-3 py-1 bg-red-100 text-red-700 rounded-lg text-sm hover:bg-red-200"
              >
                {showDecomisiones ? 'Ocultar' : 'Ver'} decomisiones
              </button>
            </div>
          </div>
        </Card>
      )}

      <Card>
        <SectionTitle>Generar Liquidaciones</SectionTitle>
        <LiquidacionesGenerar
          periodo={periodo}
          setPeriodo={setPeriodo}
          generar={generar}
          setToast={setToast}
          showInactivos={showInactivos}
          setShowInactivos={setShowInactivos}
        />
      </Card>

      {/* Tabla de decomisiones (modularizada) */}
      {showDecomisiones && decomisionesPeriodo.length > 0 && (
        <LiquidacionesDecomisiones
          decomisionesPeriodo={decomisionesPeriodo}
          colaboradores={colaboradores}
          operadores={operadores}
          periodo={periodo}
          setToast={setToast}
        />
      )}

      <Card>
        <LiquidacionesResumenColab
          porColab={porColab}
          zonas={zonas}
          periodo={periodo}
          setToast={setToast}
        />
      </Card>

      <Card>
        <SectionTitle>Liquidaciones Generadas</SectionTitle>
        <LiquidacionesTabla
          filteredLiquidaciones={filteredLiquidaciones}
          colaboradores={colaboradores}
          search={search}
          setSearch={setSearch}
          setToast={setToast}
          generarInformePDF={generarInformePDF}
          porColab={porColab}
          periodo={periodo}
        />
        {/* Aquí se puede migrar la tabla y paginación en el siguiente paso */}
      </Card>
    </div>
  );
}
