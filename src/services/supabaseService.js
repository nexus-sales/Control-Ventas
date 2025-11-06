









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
 * Realiza un "upsert" (insertar o actualizar) en una tabla.
 * @param {string} tableName - El nombre de la tabla.
 * @param {object | object[]} records - El/los registro(s) a guardar.
 * @returns {Promise<{data: any[], error: any}>}
 */
export const upsert = async (tableName, records) => {
  const { data, error } = await supabase.from(tableName).upsert(records, {
    onConflict: 'id', // Asume que 'id' es la clave primaria para resolver conflictos
  }).select();
  
  if (error) {
    console.error(`Error en upsert a ${tableName}:`, error);
  }
  
  return { data, error };
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











