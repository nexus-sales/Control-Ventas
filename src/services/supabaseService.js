









import { supabase } from '../lib/supabaseClient';

// Nombres de las tablas en Supabase
export const TABLES = {
  ventas: 'ventas',
  colaboradores: 'colaboradores',
  niveles: 'niveles',
  operadores: 'operadores',
  productos: 'productos',
  zonas: 'zonas',
  reglas: 'reglas',
  liquidaciones: 'liquidaciones',
};

const tableEntries = Object.entries(TABLES);

/**
 * Obtiene todos los registros de una tabla específica.
 * @param {string} tableName - El nombre de la tabla.
 * @returns {Promise<{data: any[], error: any}>}
 */
const getAll = async (tableName) => {
  const { data, error } = await supabase.from(tableName).select('*');
  return { data: data ?? [], error };
};

// --- Funciones de Lectura ---

export const getVentas = () => getAll(TABLES.ventas);
export const getColaboradores = () => getAll(TABLES.colaboradores);
export const getNiveles = () => getAll(TABLES.niveles);
export const getOperadores = () => getAll(TABLES.operadores);
export const getProductos = () => getAll(TABLES.productos);
export const getZonas = () => getAll(TABLES.zonas);
export const getReglas = () => getAll(TABLES.reglas);
export const getLiquidaciones = () => getAll(TABLES.liquidaciones);

/**
 * Obtiene todos los datos de todas las tablas principales en paralelo.
 * @returns {Promise<{ data: Record<string, any[]>, errors: Array<{table: string, error: any}> }>} 
 */
export const fetchAllData = async () => {
  const requests = tableEntries.map(([, table]) => getAll(table));
  const results = await Promise.allSettled(requests);

  const data = {};
  const errors = [];

  results.forEach((result, index) => {
    const key = tableEntries[index][0];
    if (result.status === 'fulfilled') {
      data[key] = result.value.data ?? [];
      if (result.value.error) {
        errors.push({ table: key, error: result.value.error });
      }
    } else {
      errors.push({ table: key, error: result.reason });
      data[key] = [];
    }
  });

  return { data, errors };
};


// --- Funciones de Escritura ---

/**
 * Sanitiza datos antes de enviarlos a Supabase
 * @param {object} record - Registro a sanitizar
 * @returns {object} - Registro sanitizado
 */
const sanitizeRecord = (record) => {
  const sanitized = { ...record };
  
  // Convierte arrays vacíos a JSON para campos JSONB
  if (Array.isArray(sanitized.historial) && sanitized.historial.length === 0) {
    sanitized.historial = {};
  }
  if (Array.isArray(sanitized.extras) && sanitized.extras.length === 0) {
    sanitized.extras = {};
  }
  
  // Asegura que las fechas ISO sean válidas
  Object.keys(sanitized).forEach(key => {
    const value = sanitized[key];
    if (typeof value === 'string' && value.includes('T') && value.includes('Z')) {
      try {
        const date = new Date(value);
        if (isNaN(date.getTime())) {
          delete sanitized[key]; // Elimina fechas inválidas
        }
      } catch {
        delete sanitized[key]; // Elimina fechas que no se pueden parsear
      }
    }
    
    // Elimina valores null/undefined para evitar conflictos
    if (value === null || value === undefined) {
      delete sanitized[key];
    }
  });
  
  return sanitized;
};

/**
 * Realiza un "upsert" (insertar o actualizar) en una tabla.
 * @param {string} tableName - El nombre de la tabla.
 * @param {object | object[]} records - El/los registro(s) a guardar.
 * @returns {Promise<{data: any[], error: any}>}
 */
export const upsert = async (tableName, records) => {
  try {
    // Sanitiza los registros
    const sanitizedRecords = Array.isArray(records) 
      ? records.map(record => sanitizeRecord(record))
      : sanitizeRecord(records);
    
    console.log(`[Supabase] Upsert a ${tableName}:`, sanitizedRecords.length || 1, 'registros');
    
    const { data, error } = await supabase.from(tableName).upsert(sanitizedRecords, {
      onConflict: 'id',
    }).select();
    
    if (error) {
      console.error(`Error en upsert a ${tableName}:`, error);
      console.error('Datos enviados:', sanitizedRecords);
    } else {
      console.log(`✅ Upsert exitoso a ${tableName}:`, data?.length || 1, 'registros');
    }
    
    return { data, error };
  } catch (exception) {
    console.error(`Excepción en upsert a ${tableName}:`, exception);
    return { data: null, error: exception };
  }
};

/**
 * Elimina registros de una tabla por sus IDs.
 * @param {string} tableName - El nombre de la tabla.
 * @param {string[]} ids - Un array de IDs a eliminar.
 * @returns {Promise<{data: any, error: any}>}
 */
export const removeByIds = async (tableName, ids) => {
  const { data, error } = await supabase.from(tableName).delete().in('id', ids);
  
  if (error) {
    console.error(`Error eliminando de ${tableName}:`, error);
  }

  return { data, error };
};











