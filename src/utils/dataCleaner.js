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
  console.log('🧹 Limpiando operadores duplicados...');
  const cleaned = removeDuplicatesByMultipleFields(operadores, ['id', 'nombre', 'codigo']);
  console.log(`Operadores: ${operadores.length} → ${cleaned.length}`);
  return cleaned;
}

// Limpiar zonas duplicadas
export function cleanZonas(zonas) {
  console.log('🧹 Limpiando zonas duplicadas...');
  const cleaned = removeDuplicatesByMultipleFields(zonas, ['id', 'nombre']);
  console.log(`Zonas: ${zonas.length} → ${cleaned.length}`);
  return cleaned;
}

// Limpiar productos duplicados
export function cleanProductos(productos) {
  console.log('🧹 Limpiando productos duplicados...');
  const cleaned = removeDuplicatesByMultipleFields(productos, ['id', 'nombre', 'operador_id']);
  console.log(`Productos: ${productos.length} → ${cleaned.length}`);
  return cleaned;
}