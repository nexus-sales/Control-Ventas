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

const TABLE_ALLOWED_FIELDS = {
  ventas: [
    'id',
    'fecha',
    'cliente',
    'cif',
    'colaborador_id',
    'zona_id',
    'producto_id',
    'operador_id',
    'pvp',
    'cantidad',
    'estado',
    'mes',
    'año',
    'extras',
    'created_at',
    'updated_at',
  ],
  productos: [
    'id',
    'operador_id',
    'nombre',
    'familia',
    'pvp',
    'comision_tipo',
    'comision_valor',
    'codigo_producto',
    'descripcion',
    'activo',
    'sector',
    'created_at',
    'updated_at',
    'fecha_alta',
    'fecha_baja',
    'contacto',
    'email',
    'telefono',
    'observaciones',
    'historial',
  ],
  colaboradores: [
    'id',
    'nombre',
    'nivel',
    'comision_personalizada',
    'comision_tipo_personalizada',
    'fecha_alta',
    'telefono',
    'email',
    'direccion',
    'cif_dni',
    'tipo_fiscal',
    'irpf',
    'pct_colaborador',
    'zona_id',
    'estado',
    'irpf_calculado',
    'exento_impuestos',
    'created_at',
    'updated_at',
    'observaciones',
    'rol',
  ],
  operadores: [
    'id',
    'nombre',
    'sector',
    'codigo',
    'contacto',
    'telefono',
    'email',
    'observaciones',
    'fecha_alta',
    'created_at',
    'updated_at',
  ],
  zonas: [
    'id',
    'nombre',
    'codigo',
    'impuesto_tipo',
    'impuesto_pct',
    'descripcion',
    'created_at',
    'updated_at',
  ],
  niveles: [
    'id',
    'nombre',
    'pct_colaborador_default',
    'porcentaje',
    'comision_tipo',
    'comision_valor',
    'tipo',
    'pct_telefonia',
    'pct_energia',
    'fijo_seguridad',
    'created_at',
    'updated_at',
  ],
  reglas: [
    'id',
    'nombre',
    'descripcion',
    'tipo',
    'condiciones',
    'acciones',
    'activa',
    'created_at',
    'updated_at',
  ],
  liquidaciones: [
    'id',
    'colaborador_id',
    'mes',
    'año',
    'fecha_desde',
    'fecha_hasta',
    'total_ventas',
    'total_comisiones',
    'estado',
    'observaciones',
    'detalle',
    'created_at',
    'updated_at',
  ],
};

const DEFAULT_FETCH_TIMEOUT = 15000;

const withTimeout = (promise, ms, tableName) => new Promise((resolve) => {
  const timer = setTimeout(() => {
    resolve({
      data: null,
      error: {
        code: 'FETCH_TIMEOUT',
        message: `Timeout obteniendo ${tableName} tras ${ms}ms`,
      },
    });
  }, ms);

  promise
    .then((result) => {
      clearTimeout(timer);
      resolve(result);
    })
    .catch((error) => {
      clearTimeout(timer);
      resolve({ data: null, error });
    });
});

const isPlainObject = (value) => typeof value === 'object' && value !== null && !Array.isArray(value);

const isDateLike = (value) => typeof value === 'string' && value.trim().length > 0;

const toISODateString = (value) => {
  if (!isDateLike(value)) return value;
  const trimmed = value.trim();
  const europeanMatch = /^([0-3]?\d)[/-]([01]?\d)[/-](\d{4})$/.exec(trimmed);
  if (europeanMatch) {
    const [, day, month, year] = europeanMatch;
    const mm = month.padStart(2, '0');
    const dd = day.padStart(2, '0');
    return `${year}-${mm}-${dd}`;
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return trimmed;
  }
  const parsed = new Date(trimmed);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toISOString().slice(0, 10);
  }
  return trimmed;
};

const toNumberOrNull = (value) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
};

/**
 * Normaliza nombres para evitar duplicados por case sensitivity
 */
const normalizeName = (name) => {
  if (!name || typeof name !== 'string') return name;
  return name.trim();
};

/**
 * Normaliza nombre para búsquedas case insensitive
 */
const normalizeNameSearch = (name) => {
  if (!name || typeof name !== 'string') return '';
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/['`´’]/g, '')
    .trim()
    .toUpperCase();
};

/**
 * Obtiene todos los registros de una tabla específica.
 * @param {string} tableName - El nombre de la tabla.
 * @returns {Promise<{data: any[], error: any}>}
 */
const getAll = async (tableName) => {
  const result = await withTimeout(
    supabase.from(tableName).select('*'),
    DEFAULT_FETCH_TIMEOUT,
    tableName,
  );
  return { data: result.data ?? [], error: result.error };
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
 * @param {string} tableName - Nombre de la tabla destino
 * @returns {object} - Registro sanitizado
 */
const sanitizeRecord = (record, tableName = '') => {
  const sanitized = { ...record };
  
  const allowedFields = TABLE_ALLOWED_FIELDS[tableName];

  // ✅ CORRECCIÓN: Normalizar nombres para evitar duplicados por case sensitivity
  if (sanitized.nombre && typeof sanitized.nombre === 'string') {
    sanitized.nombre = normalizeName(sanitized.nombre);
    
    // Casos especiales de normalización
    const nombreUpper = normalizeNameSearch(sanitized.nombre);
    if (nombreUpper === 'CANARIAS' || nombreUpper === 'CANARIA') {
      sanitized.nombre = 'Canarias';
    } else if (nombreUpper === 'PENINSULA' || nombreUpper === 'PENINSULAR') {
      sanitized.nombre = 'Península';
    } else if (nombreUpper === 'BALEARES' || nombreUpper === 'BALEAR') {
      sanitized.nombre = 'Baleares';
    } else if (nombreUpper === 'CEUTA') {
      sanitized.nombre = 'Ceuta';
    } else if (nombreUpper === 'MELILLA') {
      sanitized.nombre = 'Melilla';
    }
  }
  
  // ✅ CORRECCIÓN: Normalizar códigos
  if (sanitized.codigo && typeof sanitized.codigo === 'string') {
    sanitized.codigo = sanitized.codigo.trim().toUpperCase();
  }
  
  // ✅ CORRECCIÓN CRÍTICA: Asegurar valores de sector válidos según BD constraint
  if (Object.prototype.hasOwnProperty.call(sanitized, 'sector')) {
    const sectorLower = (sanitized.sector || '').toLowerCase().trim();
    
    if (!sanitized.sector || 
        sectorLower.includes('telefon') || 
        sectorLower.includes('telecom') || 
        sectorLower === 'telecomunicaciones' ||
        sectorLower === 'telefonia') {
      sanitized.sector = 'TELEFONIA';
    } else if (sectorLower.includes('energia') || sectorLower.includes('energy')) {
      sanitized.sector = 'ENERGIA';
    } else if (sectorLower.includes('seguridad') || sectorLower.includes('security')) {
      sanitized.sector = 'SEGURIDAD';
    } else {
      // Valor por defecto si no coincide con ninguno
      sanitized.sector = 'TELEFONIA';
    }
  }
  
  // Convierte arrays vacíos a JSON para campos JSONB
  if (Array.isArray(sanitized.historial) && sanitized.historial.length === 0) {
    sanitized.historial = [];
  }
  if (Array.isArray(sanitized.extras) && sanitized.extras.length === 0) {
    sanitized.extras = {};
  }
  
  // Asegurar que las fechas ISO sean válidas
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
  
  // ✅ Para productos, asegurar que tengan sector válido
  if (tableName === 'productos' && Object.prototype.hasOwnProperty.call(sanitized, 'operador_id') && !Object.prototype.hasOwnProperty.call(sanitized, 'sector')) {
    sanitized.sector = 'TELEFONIA';
  }
  
  if (tableName === 'ventas') {
    if (sanitized.sector) delete sanitized.sector;
    if (sanitized.mes) delete sanitized.mes;
    if (sanitized.año) delete sanitized.año;

    if (typeof sanitized.fecha === 'string') {
      sanitized.fecha = toISODateString(sanitized.fecha);
    }

    const parsedPvp = toNumberOrNull(sanitized.pvp);
    sanitized.pvp = parsedPvp !== null ? parsedPvp : 0;
    const parsedCantidad = toNumberOrNull(sanitized.cantidad);
    sanitized.cantidad = parsedCantidad !== null ? parsedCantidad : 1;

    const extrasPayload = isPlainObject(sanitized.extras) ? { ...sanitized.extras } : {};
    if (isPlainObject(sanitized.customFields)) {
      extrasPayload.customFields = { ...sanitized.customFields };
    }

    Object.keys(sanitized).forEach((key) => {
      if (key === 'extras') return;
      if (!allowedFields?.includes(key)) {
        extrasPayload[key] = sanitized[key];
        delete sanitized[key];
      }
    });

    if (sanitized.id && typeof sanitized.id === 'string' && sanitized.id.startsWith('temp_venta_')) {
      delete sanitized.id;
    }

    if (Object.keys(extrasPayload).length > 0) {
      sanitized.extras = extrasPayload;
    } else {
      delete sanitized.extras;
    }
  }

  if (tableName === 'productos') {
    if (typeof sanitized.fecha_alta === 'string') {
      sanitized.fecha_alta = toISODateString(sanitized.fecha_alta);
    }
    if (typeof sanitized.fecha_baja === 'string') {
      sanitized.fecha_baja = toISODateString(sanitized.fecha_baja);
    }
  const parsedPvp = toNumberOrNull(sanitized.pvp);
  sanitized.pvp = parsedPvp !== null ? parsedPvp : 0;
  const parsedComision = toNumberOrNull(sanitized.comision_valor);
  sanitized.comision_valor = parsedComision !== null ? parsedComision : 0;
    if (typeof sanitized.codigo_producto === 'string') {
      sanitized.codigo_producto = sanitized.codigo_producto.trim().toUpperCase();
    }
    if (
      Object.prototype.hasOwnProperty.call(sanitized, 'historial') &&
      !isPlainObject(sanitized.historial) &&
      !Array.isArray(sanitized.historial)
    ) {
      sanitized.historial = [];
    }
  }

  if (allowedFields) {
    Object.keys(sanitized).forEach((key) => {
      if (!allowedFields.includes(key)) {
        delete sanitized[key];
      }
    });
  }
  
  return sanitized;
};

/**
 * Realiza un "upsert" (insertar o actualizar) en una tabla con manejo de conflicts mejorado.
 * @param {string} tableName - El nombre de la tabla.
 * @param {object | object[]} records - El/los registro(s) a guardar.
 * @returns {Promise<{data: any[], error: any}>}
 */
export const upsert = async (tableName, records) => {
  try {
    // Sanitiza los registros con información de tabla
    const sanitizedRecords = Array.isArray(records) 
      ? records.map(record => sanitizeRecord(record, tableName))
      : sanitizeRecord(records, tableName);
    
    console.log(`[Supabase] Upsert a ${tableName}:`, Array.isArray(sanitizedRecords) ? sanitizedRecords.length : 1, 'registros');
    
    // ✅ CORRECCIÓN CRÍTICA: Usar onConflict correcto según tabla
    let upsertOptions = { onConflict: 'id' };
    
    if (tableName === 'ventas') {
      // Para ventas: permitir que Supabase genere IDs nuevos
      // Los IDs temporales del cliente se ignorarán
      upsertOptions = { 
        onConflict: 'id',
        ignoreDuplicates: false 
      };
    } else if (tableName === 'productos') {
      upsertOptions = { 
        onConflict: 'operador_id,nombre',
        ignoreDuplicates: false 
      };
    } else if (tableName === 'operadores') {
      // Para operadores: usar codigo como unique key
      upsertOptions = { 
        onConflict: 'codigo',
        ignoreDuplicates: false 
      };
    }
    
    const { data, error } = await supabase
      .from(tableName)
      .upsert(sanitizedRecords, upsertOptions)
      .select();
    
    if (error) {
      console.error(`Error en upsert a ${tableName}:`, error);
      console.error('Datos enviados:', sanitizedRecords);

      if (error.code === '23514' && tableName === 'productos') {
        console.error('❌ ERROR DE SECTOR: Verifica que el sector sea TELEFONIA, ENERGIA o SEGURIDAD');
      }
      if (error.code === 'PGRST204') {
        console.error('❌ ERROR DE COLUMNA: Columna no existe en la tabla');
      }
      if (error.code === '428C9') {
        console.error('❌ ERROR DE COLUMNA GENERADA: No se puede insertar en columna calculada automáticamente');
      }

      if (tableName === 'productos' && error.code === '23505') {
        console.warn('♻️ Detectado conflicto de producto. Intentando conciliación por nombre + operador...');
        const recordsArray = Array.isArray(sanitizedRecords)
          ? sanitizedRecords
          : [sanitizedRecords];
        const fallbackResults = [];
        const fallbackErrors = [];

        for (const record of recordsArray) {
          try {
            if (!record?.nombre) {
              continue;
            }

            let builder = supabase
              .from(tableName)
              .select('id,nombre,operador_id,codigo_producto')
              .limit(20);

            if (record.operador_id) {
              builder = builder.eq('operador_id', record.operador_id);
            } else {
              builder = builder.is('operador_id', null);
            }

            const { data: candidates, error: lookupError } = await builder;

            if (lookupError) {
              fallbackErrors.push(lookupError);
              continue;
            }

            const existing = Array.isArray(candidates)
              ? candidates.find((candidate) =>
                  normalizeNameSearch(candidate?.nombre) === normalizeNameSearch(record.nombre)
                )
              : null;

            if (existing) {
              const updatePayload = { ...record };
              delete updatePayload.id;

              const { data: updated, error: updateError } = await supabase
                .from(tableName)
                .update(updatePayload)
                .eq('id', existing.id)
                .select();

              if (updateError) {
                fallbackErrors.push(updateError);
                continue;
              }

              fallbackResults.push(updated ?? []);
            } else {
              const { data: inserted, error: insertError } = await supabase
                .from(tableName)
                .upsert(record, { onConflict: 'id', ignoreDuplicates: false })
                .select();

              if (insertError) {
                fallbackErrors.push(insertError);
                continue;
              }

              fallbackResults.push(inserted ?? []);
            }
          } catch (fallbackException) {
            fallbackErrors.push(fallbackException);
          }
        }

        if (fallbackResults.length) {
          const flattened = fallbackResults.flat();
          return {
            data: flattened,
            error: fallbackErrors.length ? fallbackErrors[0] : null,
          };
        }

        if (fallbackErrors.length) {
          return { data: null, error: fallbackErrors[0] };
        }
      }
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
 * ✅ NUEVA FUNCIÓN: Upsert inteligente que maneja duplicados automáticamente
 */
export const smartUpsert = async (tableName, records) => {
  try {
    const recordsArray = Array.isArray(records) ? records : [records];
    const results = [];
    const errors = [];
    
    for (const record of recordsArray) {
      // Intentar upsert individual
      const result = await upsert(tableName, record);
      
      if (result.error) {
        if (result.error.code === '23505') {
          // Conflicto de unicidad - intentar UPDATE en lugar de INSERT
          console.log(`⚠️ Conflicto detectado para ${tableName}, intentando UPDATE...`);
          
          // Para productos: buscar por ID
          if (tableName === 'productos' && record.id) {
            const { data: existing } = await supabase
              .from(tableName)
              .select('id')
              .eq('id', record.id)
              .single();
            
            if (existing) {
              const updateResult = await supabase
                .from(tableName)
                .update(sanitizeRecord(record, tableName))
                .eq('id', existing.id)
                .select();
              results.push(updateResult.data);
            }
          }
          // Para operadores: buscar por codigo
          else if (tableName === 'operadores' && record.codigo) {
            const { data: existing } = await supabase
              .from(tableName)
              .select('id')
              .ilike('codigo', record.codigo)
              .single();
            
            if (existing) {
              const updateResult = await supabase
                .from(tableName)
                .update(sanitizeRecord(record, tableName))
                .eq('id', existing.id)
                .select();
              results.push(updateResult.data);
            }
          }
        } else {
          errors.push(result.error);
        }
      } else {
        results.push(result.data);
      }
    }
    
    return { 
      data: results.flat(), 
      error: errors.length > 0 ? errors[0] : null 
    };
    
  } catch (exception) {
    console.error(`Excepción en smartUpsert a ${tableName}:`, exception);
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