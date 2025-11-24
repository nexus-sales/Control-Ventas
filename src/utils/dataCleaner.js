// Utilidad para limpiar datos duplicados
export function removeDuplicates(array, keyField = 'id') {
  if (!Array.isArray(array)) return [];
  
  const seen = new Set();
  const result = [];
  
  for (const item of array) {
    const key = item[keyField];
    if (key && !seen.has(key)) {
      seen.add(key);
      result.push(item);
    }
  }
  
  return result;
}

// Limpiar duplicados por múltiples campos
export function removeDuplicatesByMultipleFields(array, fields = ['id']) {
  if (!Array.isArray(array)) return [];
  
  const seen = new Set();
  const result = [];
  
  for (const item of array) {
    const key = fields.map(field => item[field]).join('|');
    if (!seen.has(key)) {
      seen.add(key);
      result.push(item);
    }
  }
  
  return result;
}

// Limpiar operadores duplicados
export function cleanOperadores(operadores) {
  // LOG ELIMINADO
  const cleaned = removeDuplicatesByMultipleFields(operadores, ['id', 'nombre', 'codigo']);
  // LOG ELIMINADO
  return cleaned;
}

// Limpiar zonas duplicadas
export function cleanZonas(zonas) {
  // LOG ELIMINADO
  const cleaned = removeDuplicatesByMultipleFields(zonas, ['id', 'nombre']);
  // LOG ELIMINADO
  return cleaned;
}

// Limpiar productos duplicados
export function cleanProductos(productos) {
  // LOG ELIMINADO
  const cleaned = removeDuplicatesByMultipleFields(productos, ['id', 'nombre', 'operador_id']);
  // LOG ELIMINADO
  return cleaned;
}