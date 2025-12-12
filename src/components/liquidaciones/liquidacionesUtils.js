// Funciones utilitarias para liquidaciones, decomisiones y exportaciones

export function monthOf(dateISO) {
  return dateISO?.slice(0, 7);
}

export function sum(arr, sel) {
  return arr.reduce((a, x) => a + (sel(x) || 0), 0);
}

export function calcularAntiguedad(fechaAlta) {
  if (!fechaAlta) return 0;
  const hoy = new Date();
  const alta = new Date(fechaAlta);
  const diffTime = Math.abs(hoy - alta);
  const diffYears = diffTime / (1000 * 60 * 60 * 24 * 365.25);
  return diffYears;
}

export function calcularIRPF(colaborador, importeBruto, fechaRef) {
  if (!colaborador) return 0;
  const tipo = (colaborador.tipo_fiscal || colaborador.tipo || '').toUpperCase();
  const esCIF = colaborador.cif_dni?.toUpperCase()?.match(/^[ABCDEFGHJNPQRSUVW]/);
  if (esCIF || tipo === 'EMPRESA' || tipo === 'AUTONOMO_ESPECIAL' || tipo === 'EXENTO') return 0;
  if (tipo !== 'AUTONOMO') return 0;
  const antiguedad = calcularAntiguedad(colaborador.fecha_alta || fechaRef);
  const porcentajeIRPF = antiguedad < 2 ? 7 : 15;
  return (importeBruto * porcentajeIRPF) / 100;
}

export function obtenerDatosZona(colaborador, zonas) {
  if (!colaborador?.zona_id || !zonas) return { impuesto_tipo: null, impuesto_pct: 0 };
  const zona = zonas.find(z => z.id === colaborador.zona_id);
  return {
    impuesto_tipo: zona?.impuesto_tipo || null,
    impuesto_pct: zona?.impuesto_pct || 0
  };
}

export function calcularDecomisiones(ventas, clientes, operadores) {
  const decomisiones = [];
  ventas.forEach(venta => {
    const cliente = clientes.find(c => c.id === venta.cliente_id);
    const operador = operadores.find(o => o.id === venta.operador_id);
    if (!cliente || !operador) return;
    if (cliente.fecha_baja && venta.fecha_inicio && venta.periodo_compromiso) {
      const fechaInicio = new Date(venta.fecha_inicio);
      const fechaBaja = new Date(cliente.fecha_baja);
      const mesesComprometidos = parseInt(venta.periodo_compromiso) || 12;
      const fechaFinCompromiso = new Date(fechaInicio);
      fechaFinCompromiso.setMonth(fechaFinCompromiso.getMonth() + mesesComprometidos);
      if (fechaBaja < fechaFinCompromiso) {
        const mesesTranscurridos = Math.max(0, (fechaBaja - fechaInicio) / (1000 * 60 * 60 * 24 * 30.44));
        let porcentajeDecomision = 0;
        const reglasOperador = operador.reglas_decomision || {
          antes_6_meses: 100,
          despues_6_meses: 50,
          limite_meses: 6
        };
        if (mesesTranscurridos < reglasOperador.limite_meses) {
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
            cliente_id: cliente.id,
            cliente_nombre: cliente.nombre,
            operador_id: operador.id,
            operador_nombre: operador.nombre,
            colaborador_id: venta.colaborador_id,
            fecha_venta: venta.fecha_inicio,
            fecha_baja_cliente: cliente.fecha_baja,
            meses_comprometidos: mesesComprometidos,
            meses_transcurridos: Math.round(mesesTranscurridos * 10) / 10,
            porcentaje_cumplido: Math.round((mesesTranscurridos / mesesComprometidos) * 100),
            regla_aplicada: mesesTranscurridos < reglasOperador.limite_meses ? 'antes_limite' : 'despues_limite',
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
    ...datos.map(row => headers.map(header => `"${row[header]}"`).join(','))
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
