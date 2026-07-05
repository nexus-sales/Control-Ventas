// Funciones utilitarias para liquidaciones, decomisiones y exportaciones

export function monthOf(dateISO) {
  return dateISO?.slice(0, 7);
}

export function sum(arr, sel) {
  return arr.reduce((a, x) => a + (sel(x) || 0), 0);
}

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeCsvCell(value = "") {
  const text = String(value ?? "");
  const neutralized = /^[=+\-@]/.test(text) ? `'${text}` : text;
  return `"${neutralized.replace(/"/g, '""')}"`;
}

export function obtenerDatosZona(colaborador, zonas) {
  if (!colaborador?.zona_id || !zonas) return { impuesto_tipo: null, impuesto_pct: 0 };
  const zona = zonas.find(z => z.id === colaborador.zona_id);
  return {
    impuesto_tipo: zona?.impuesto_tipo || null,
    impuesto_pct: zona?.impuesto_pct || 0
  };
}

// Decomisión por baja anticipada: lee fecha_baja/periodo_compromiso directamente de
// la venta (no de una entidad Cliente separada — no existe tabla para ella, ver
// Decisión 1 del Council). fecha_baja y periodo_compromiso son opcionales; mientras
// no se rellenen en el alta/edición de la venta, esa venta simplemente no genera
// decomisión, no es un error.
export function calcularDecomisiones(ventas, operadores) {
  const decomisiones = [];
  ventas.forEach(venta => {
    const operador = operadores.find(o => o.id === venta.operador_id);
    if (!operador) return;
    if (venta.fecha_baja && venta.fecha && venta.periodo_compromiso) {
      const fechaInicio = new Date(venta.fecha);
      const fechaBaja = new Date(venta.fecha_baja);
      const mesesComprometidos = parseInt(venta.periodo_compromiso) || 12;
      const fechaFinCompromiso = new Date(fechaInicio);
      fechaFinCompromiso.setMonth(fechaFinCompromiso.getMonth() + mesesComprometidos);
      if (fechaBaja < fechaFinCompromiso) {
        // Aproximación en días, solo para el % de progreso mostrado
        // (porcentaje_cumplido) — no decide qué regla se aplica.
        const mesesTranscurridos = Math.max(0, (fechaBaja - fechaInicio) / (1000 * 60 * 60 * 24 * 30.44));
        let porcentajeDecomision = 0;
        // Fusión por campo, no por objeto entero: un reglas_decomision guardado
        // parcial (p.ej. solo {limite_meses: 3}) antes dejaba antes_6_meses/
        // despues_6_meses en undefined -> NaN se propagaba silenciosamente
        // hasta descartar la decomisión sin avisar (NaN > 0 es false).
        const reglasOperador = {
          antes_6_meses: 100,
          despues_6_meses: 50,
          limite_meses: 6,
          ...(operador.reglas_decomision || {}),
        };
        // Frontera con aritmética de calendario (mismo setMonth() que ya usa
        // fechaFinCompromiso), no con mesesTranscurridos/30.44: dividir por un
        // promedio de días por mes subestima meses en cualquier mes de 31
        // días. Una baja a los 181 días exactos (6 meses de calendario desde
        // el alta, limite_meses=6) daba 181/30.44 ≈ 5.94 < 6 y se clasificaba
        // como "antes del límite" (decomisión más alta) pese a haber cumplido
        // el compromiso justo en el límite.
        const fechaLimiteDecomision = new Date(fechaInicio);
        fechaLimiteDecomision.setMonth(fechaLimiteDecomision.getMonth() + reglasOperador.limite_meses);
        const antesDelLimite = fechaBaja < fechaLimiteDecomision;
        if (antesDelLimite) {
          porcentajeDecomision = reglasOperador.antes_6_meses / 100;
        } else {
          const porcentajeCumplido = Math.min(1, mesesTranscurridos / mesesComprometidos);
          porcentajeDecomision = (100 - (porcentajeCumplido * 100)) * (reglasOperador.despues_6_meses / 100) / 100;
        }
        const comisionOriginal = venta._calc?.ok ? venta._calc.detalle.comBruta : 0;
        const importeDecomision = comisionOriginal * porcentajeDecomision;
        if (importeDecomision > 0) {
          decomisiones.push({
            venta_id: venta.id,
            cliente_nombre: venta.cliente,
            operador_id: operador.id,
            operador_nombre: operador.nombre,
            colaborador_id: venta.colaborador_id,
            fecha_venta: venta.fecha,
            fecha_baja: venta.fecha_baja,
            meses_comprometidos: mesesComprometidos,
            meses_transcurridos: Math.round(mesesTranscurridos * 10) / 10,
            porcentaje_cumplido: Math.round((mesesTranscurridos / mesesComprometidos) * 100),
            regla_aplicada: antesDelLimite ? 'antes_limite' : 'despues_limite',
            porcentaje_decomision: Math.round(porcentajeDecomision * 100),
            comision_original: comisionOriginal,
            importe_decomision: importeDecomision,
            estado: 'Pendiente'
          });
        }
      }
    }
  });
  return decomisiones;
}

export function exportarCSV({ datos, nombreArchivo, setToast }) {
  if (!Array.isArray(datos) || datos.length === 0) {
    setToast && setToast({ message: 'No hay datos para exportar', type: 'warning' });
    return;
  }
  const headers = Object.keys(datos[0]);
  const csvContent = [
    headers.join(','),
    ...datos.map(row => headers.map(header => escapeCsvCell(row[header])).join(','))
  ].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', nombreArchivo);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setToast && setToast({ message: `Exportación completada: ${nombreArchivo}`, type: 'success' });
}

/**
 * Genera un informe PDF detallado de las liquidaciones para imprimir
 * @param {Array} liquidaciones - Lista de liquidaciones
 * @param {string} periodo - Período de liquidación
 * @param {Array} colaboradores - Lista de colaboradores
 */
export function generarInformePDF(liquidaciones, periodo, colaboradores) {
  const totalBruto = liquidaciones.reduce((sum, l) => sum + (l.bruto || 0), 0);
  const totalIRPF = liquidaciones.reduce((sum, l) => sum + (l.irpf || 0), 0);
  const totalDecomisiones = liquidaciones.reduce((sum, l) => sum + (l.decomisiones || 0), 0);
  const totalImpuestos = liquidaciones.reduce((sum, l) => sum + (l.impuesto_zona || 0), 0);
  const totalNeto = liquidaciones.reduce((sum, l) => sum + (l.neto || 0), 0);

  const contenidoHTML = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="utf-8">
      <title>Informe de Liquidaciones - ${escapeHtml(periodo)}</title>
      <style>
        @page { margin: 1.5cm; }
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #334155; line-height: 1.5; }
        .header { display: flex; justify-content: space-between; align-items: flex-end; border-bottom: 4px solid #6d28d9; padding-bottom: 20px; margin-bottom: 30px; }
        .header-title h1 { color: #6d28d9; margin: 0; font-size: 28px; font-weight: 900; }
        .header-info { text-align: right; font-size: 12px; color: #64748b; }
        
        .summary-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 15px; margin-bottom: 40px; }
        .summary-card { padding: 15px; border-radius: 12px; border: 1px solid #e2e8f0; background: #f8fafc; }
        .summary-card.accent { background: #f5f3ff; border-color: #ddd6fe; border-left-width: 5px; border-left-color: #6d28d9; }
        .card-label { font-size: 10px; font-weight: 800; color: #94a3b8; text-transform: uppercase; margin-bottom: 5px; }
        .card-value { font-size: 18px; font-weight: 800; color: #1e293b; }
        
        table { width: 100%; border-collapse: separate; border-spacing: 0; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0; margin-bottom: 30px; }
        thead { background-color: #f1f5f9; }
        th { padding: 12px 15px; text-align: left; font-size: 11px; font-weight: 800; color: #475569; text-transform: uppercase; }
        td { padding: 12px 15px; font-size: 12px; border-bottom: 1px solid #f1f5f9; }
        tr:last-child td { border-bottom: none; }
        .text-right { text-align: right; }
        .font-bold { font-weight: 800; }
        
        .footer { text-align: center; margin-top: 50px; padding-top: 20px; border-top: 1px solid #e2e8f0; font-size: 10px; color: #94a3b8; }
        .stamp { display: inline-block; border: 3px double #cbd5e1; padding: 10px 20px; border-radius: 8px; color: #94a3b8; font-weight: 900; transform: rotate(-5deg); margin-top: 40px; }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="header-title">
          <h1>LIQUIDACIONES</h1>
          <p style="margin: 0; font-weight: bold; color: #64748b;">Período: ${escapeHtml(periodo)}</p>
        </div>
        <div class="header-info">
          <p>Generado: ${new Date().toLocaleDateString('es-ES')}</p>
          <p>ID Reporte: ${Math.random().toString(36).substring(7).toUpperCase()}</p>
        </div>
      </div>

      <div class="summary-grid">
        <div class="summary-card">
          <div class="card-label">Bruto Total</div>
          <div class="card-value">${totalBruto.toFixed(2)}€</div>
        </div>
        <div class="summary-card">
          <div class="card-label">Retenciones (IRPF)</div>
          <div class="card-value" style="color: #ea580c;">-${totalIRPF.toFixed(2)}€</div>
        </div>
        <div class="summary-card">
          <div class="card-label">Impuestos (IVA)</div>
          <div class="card-value" style="color: #2563eb;">+${totalImpuestos.toFixed(2)}€</div>
        </div>
        <div class="summary-card">
          <div class="card-label">Decomisiones</div>
          <div class="card-value" style="color: #be123c;">-${totalDecomisiones.toFixed(2)}€</div>
        </div>
        <div class="summary-card accent">
          <div class="card-label">Neto a Liquidar</div>
          <div class="card-value" style="color: #6d28d9;">${totalNeto.toFixed(2)}€</div>
        </div>
      </div>

      <div class="section">
        <h3 style="font-size: 16px; margin-bottom: 15px;">Desglose por Colaborador</h3>
        <table>
          <thead>
            <tr>
              <th>Colaborador</th>
              <th>Sector/Tipo</th>
              <th class="text-right">Bruto</th>
              <th class="text-right">IRPF</th>
              <th class="text-right">IVA/IGIC</th>
              <th class="text-right">Decomis.</th>
              <th class="text-right">Total Neto</th>
            </tr>
          </thead>
          <tbody>
            ${liquidaciones.map(liq => {
    const colab = colaboradores.find(c => c.id === liq.colaborador_id);
    return `
                <tr>
                  <td class="font-bold">${escapeHtml(colab?.nombre || liq.colaborador_id)}</td>
                  <td style="text-transform: capitalize;">${escapeHtml(liq.colaborador_tipo || '-')}</td>
                  <td class="text-right">${(liq.bruto || 0).toFixed(2)}€</td>
                  <td class="text-right">${(liq.irpf || 0).toFixed(2)}€</td>
                  <td class="text-right">${(liq.impuesto_zona || 0).toFixed(2)}€</td>
                  <td class="text-right" style="color: #be123c;">${(liq.decomisiones || 0).toFixed(2)}€</td>
                  <td class="text-right font-bold">${(liq.neto || 0).toFixed(2)}€</td>
                </tr>
              `;
  }).join('')}
          </tbody>
        </table>
      </div>

      <div style="text-align: right;">
        <div class="stamp">DOCUMENTO OFICIAL VALIDADOR</div>
      </div>

      <div class="footer">
        <p>Este informe es un documento generado por software para fines administrativos.</p>
        <p>© ${new Date().getFullYear()} Sistema de Gestión de Ventas - Cloud Solutions</p>
      </div>
    </body>
    </html>
  `;

  const dynamicWindow = window.open('', '_blank');
  if (!dynamicWindow) return;
  dynamicWindow.document.write(contenidoHTML);
  dynamicWindow.document.close();

  // Esperar a que los estilos carguen antes de imprimir
  setTimeout(() => {
    dynamicWindow.print();
  }, 500);
}
