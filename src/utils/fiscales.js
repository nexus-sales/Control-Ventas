// src/utils/fiscales.js
// Utilidades fiscales para zonas

/**
 * Configuración fiscal para España
 * Solo 2 zonas: Canarias (IGIC 7%) y Península/Baleares (IVA 21%)
 */
export const ZONAS_FISCALES = {
  canarias: {
    id: 'canarias',
    nombre: 'Canarias',
    codigo: 'CAN',
    impuesto_tipo: 'IGIC',
    impuesto_pct: 7,
    descripcion: 'Islas Canarias - Impuesto General Indirecto Canario'
  },
  peninsula: {
    id: 'peninsula', 
    nombre: 'Península y Baleares',
    codigo: 'PEN',
    impuesto_tipo: 'IVA',
    impuesto_pct: 21,
    descripcion: 'España peninsular e Islas Baleares - Impuesto sobre el Valor Añadido'
  }
};

export const ZONAS_ARRAY = Object.values(ZONAS_FISCALES);
export const getZona = (zonaId) => ZONAS_FISCALES[zonaId] || ZONAS_FISCALES.peninsula;
export const calcularImpuesto = (zonaId, importe) => {
  const zona = getZona(zonaId);
  return {
    base: importe,
    tipo_impuesto: zona.impuesto_tipo,
    porcentaje: zona.impuesto_pct,
    impuesto: (importe * zona.impuesto_pct) / 100,
    total: importe + (importe * zona.impuesto_pct) / 100
  };
};
export const detectarZonaPorCP = (codigoPostal) => {
  const cp = String(codigoPostal).padStart(5, '0');
  if (cp.startsWith('35') || cp.startsWith('38')) return 'canarias';
  return 'peninsula';
};
export const esZonaValida = (zonaId) => Object.keys(ZONAS_FISCALES).includes(zonaId);
export const getEstadisticasZonas = (ventas = []) => {
  // ...existing code...
};
// ...existing code...
