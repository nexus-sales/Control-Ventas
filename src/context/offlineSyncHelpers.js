// src/context/offlineSyncHelpers.js
// Sincronización offline (funciones puras, testables sin renderizar React).
// Dependencias inyectadas a propósito (supabase, addPendingChange, resolvePendingChange,
// notify) en vez de importadas/leídas de contexto: así se pueden probar con vi.fn()
// sin mockear módulos. DataProvider (AppContexts.jsx) las llama con las reales.

// Mapa de campos válidos por colección para evitar mandar propiedades de UI/cálculo
// que Supabase rechazaría al no existir en la base de datos (e.g. error PGRST204).
const CAMPOS_VALIDOS = {
  operadores: ['id', 'nombre', 'sector', 'codigo', 'contacto', 'telefono', 'email', 'color', 'activo', 'observaciones', 'reglas_decomision', 'fecha_actualizacion', 'metadata', 'fecha_alta', 'created_at', 'updated_at'],
  zonas: ['id', 'nombre', 'codigo', 'impuesto_tipo', 'impuesto_pct', 'descripcion', 'activo', 'metadata', 'created_at', 'updated_at'],
  niveles: ['id', 'nombre', 'descripcion', 'tipo', 'pct_colaborador_default', 'pct_telefonia', 'pct_energia', 'fijo_seguridad', 'comision_tipo', 'comision_valor', 'orden', 'activo', 'metadata', 'created_at', 'updated_at'],
  colaboradores: ['id', 'nombre', 'apellidos', 'email', 'telefono', 'direccion', 'cif_dni', 'tipo_fiscal', 'irpf', 'exento_impuestos', 'nivel_id', 'zona_id', 'comision_personalizada', 'comision_tipo_personalizada', 'pct_colaborador', 'pct_telefonia', 'pct_energia', 'fijo_seguridad', 'estado', 'activo', 'fecha_alta', 'fecha_baja', 'observaciones', 'rol', 'metadata', 'created_at', 'updated_at'],
  productos: ['id', 'nombre', 'codigo', 'descripcion', 'operador_id', 'sector', 'familia', 'pvp', 'comision_tipo', 'comision_valor', 'comision_vigencia_desde', 'comision_vigencia_hasta', 'comision_cliente_nuevo', 'comision_cliente_existente', 'comision_portabilidad', 'comision_alta_nueva', 'comision_fija', 'comision_porcentaje', 'comisiones_historial', 'fecha_actualizacion', 'activo', 'fecha_alta', 'fecha_baja', 'contacto', 'email', 'telefono', 'observaciones', 'historial', 'metadata', 'created_at', 'updated_at'],
  ventas: ['id', 'fecha', 'cliente', 'cif', 'telefono_movil', 'telefono_fijo', 'colaborador_id', 'producto_id', 'operador_id', 'zona_id', 'pvp', 'cantidad', 'estado', 'mes', 'año', 'observaciones', 'numeracion', 'documento', 'fecha_baja', 'periodo_compromiso', 'customFields', 'extras', 'metadata', 'created_at', 'updated_at'],
  reglas: ['id', 'nombre', 'descripcion', 'tipo', 'sector', 'producto_id', 'operador_id', 'nivel_id', 'zona_id', 'valor', 'condiciones', 'acciones', 'prioridad', 'activo', 'metadata', 'created_at', 'updated_at'],
  // periodo/colaborador_tipo/colaborador_nombre/zona_fiscal/bruto/impuesto_zona/
  // total_con_impuesto/notas/ventas_incluidas/decomisiones_incluidas: nombres reales
  // que genera generar() en LiquidacionesPage.jsx (antes la lista solo dejaba pasar
  // id/colaborador_id/estado, vaciando los importes de cualquier liquidación al
  // sincronizar y recargar).
  liquidaciones: ['id', 'periodo', 'colaborador_id', 'colaborador_tipo', 'colaborador_nombre', 'zona_fiscal', 'bruto', 'irpf', 'impuesto_zona', 'decomisiones', 'neto', 'total_con_impuesto', 'estado', 'fecha_generacion', 'notas', 'ventas_incluidas', 'decomisiones_incluidas', 'metadata', 'created_at', 'updated_at'],
  // cliente_nombre/operador_nombre/fecha_venta/meses_comprometidos/meses_transcurridos/
  // porcentaje_cumplido/regla_aplicada/porcentaje_decomision/comision_original/
  // importe_decomision/fecha_generacion: nombres reales que genera
  // calcularDecomisiones() en liquidacionesUtils.js (antes la lista esperaba
  // fecha/motivo/importe, que esa función nunca produce).
  decomisiones: ['id', 'venta_id', 'cliente_nombre', 'operador_id', 'operador_nombre', 'colaborador_id', 'fecha_venta', 'fecha_baja', 'meses_comprometidos', 'meses_transcurridos', 'porcentaje_cumplido', 'regla_aplicada', 'porcentaje_decomision', 'comision_original', 'importe_decomision', 'estado', 'fecha_generacion', 'metadata', 'created_at', 'updated_at'],
  custom_fields: ['id', 'nombre', 'tipo', 'modulo', 'opciones', 'requerido', 'orden', 'activo', 'creado_en', 'actualizado_en'],
  empresa: ['id', 'nombre', 'cif', 'direccion', 'telefono', 'email', 'web', 'logoUrl', 'colorCorporativo', 'created_at', 'updated_at'],
};

function filtrarCamposColeccion(collection, dataArray) {
  const camposPermitidos = CAMPOS_VALIDOS[collection];
  if (!camposPermitidos) return dataArray; // Si no está mapeada, pasarla igual

  return dataArray.map(item => {
    const filtrado = {};
    camposPermitidos.forEach(campo => {
      if (item && item[campo] !== undefined) {
        filtrado[campo] = item[campo];
      }
    });
    return filtrado;
  });
}

function getTableName(collection) {
  if (collection === 'empresa') return 'empresa_config_cv';
  if (collection === 'custom_fields') return 'custom_fields_cv';
  return `${collection}_cv`;
}

// Intenta sincronizar una colección con Supabase. Nunca lanza ni bloquea al llamador:
// el guardado local ya ocurrió antes de invocar esto (saveToStorage), esta función
// solo decide si, ADEMÁS, se pudo sincronizar con el servidor. Si no se pudo (sin
// sesión, error de RLS/API, sin conexión), marca el cambio como pendiente en vez de
// dejarlo en silencio.
export async function syncCollectionToSupabase({ supabase: client, collection, newData, addPendingChange, resolvePendingChange, notify }) {
  const recordIds = newData.map((r) => r?.id).filter(Boolean);

  const markPending = (reason) => {
    // Sustituye cualquier intento anterior de esta misma colección — el nuevo
    // payload ya es un superconjunto del viejo, no tiene sentido acumular los dos.
    resolvePendingChange((c) => c.collection === collection);
    addPendingChange({ collection, payload: newData, recordIds, reason });
    notify?.(
      `No se pudo sincronizar "${collection}" con el servidor. Tus cambios están guardados solo en este dispositivo.`,
      'error'
    );
  };

  try {
    const { data: { session } } = await client.auth.getSession();
    if (!session) {
      markPending('sin sesión activa');
      return false;
    }

    const tableName = getTableName(collection);
    const saneData = filtrarCamposColeccion(collection, newData);
    
    // Intentar upsert del lote completo
    const { error } = await client.from(tableName).upsert(saneData, { onConflict: 'id' });

    if (error) {
      console.warn(`Error en lote Supabase [${tableName}], intentando subida uno a uno...`, error);
      
      // FALLBACK: Si falla el lote completo (ej: una FK inválida), intentamos upsert de cada fila
      // de forma individual para que las filas correctas sí suban.
      let filasGuardadas = 0;
      let erroresDetectados = [];

      for (const fila of saneData) {
        const { error: errorFila } = await client.from(tableName).upsert(fila, { onConflict: 'id' });
        if (!errorFila) {
          filasGuardadas++;
        } else {
          erroresDetectados.push(`${fila.id || 'sin-id'}: ${errorFila.message}`);
        }
      }

      if (erroresDetectados.length > 0) {
        console.error(`Sincronización parcial en [${tableName}]: ${filasGuardadas} guardadas, ${erroresDetectados.length} fallidas.`, erroresDetectados);
        markPending(`Errores en filas: ${erroresDetectados.slice(0, 3).join(', ')}`);
        return false;
      }
    }

    // Éxito: si había un intento previo pendiente para esta colección, ya no aplica.
    resolvePendingChange((c) => c.collection === collection);
    return true;
  } catch (err) {
    console.warn('Sync Supabase failed (offline mode):', err);
    markPending(err?.message || 'sin conexión');
    return false;
  }
}

// Recorre los cambios pendientes y reintenta cada uno. Se llama al recuperar
// conexión. Los que tengan éxito se limpian uno a uno; los que sigan fallando
// se quedan en la cola para el próximo intento — no se re-añaden (evita
// duplicados y bucles).
export async function retryPendingSync({ supabase: client, pendingChanges, resolvePendingChange, notify }) {
  if (!pendingChanges || pendingChanges.length === 0) return;

  const { data: { session } } = await client.auth.getSession();
  if (!session) return;

  for (const change of pendingChanges) {
    try {
      const tableName = getTableName(change.collection);
      const saneData = filtrarCamposColeccion(change.collection, change.payload);
      
      // Intentar upsert del lote completo en reintento
      const { error } = await client.from(tableName).upsert(saneData, { onConflict: 'id' });
      
      if (!error) {
        resolvePendingChange((c) => c.id === change.id);
        notify?.(`Sincronizado: "${change.collection}" ya está al día con el servidor.`, 'success');
      } else {
        console.warn(`Fallo reintento grupal de [${tableName}]. Intentando uno a uno...`, error);
        
        // Intentar rescatar lo máximo posible subiendo filas una a una
        let filasGuardadas = 0;
        let filasFallidas = 0;
        
        for (const fila of saneData) {
          const { error: errorFila } = await client.from(tableName).upsert(fila, { onConflict: 'id' });
          if (!errorFila) {
            filasGuardadas++;
          } else {
            filasFallidas++;
          }
        }
        
        if (filasFallidas === 0) {
          // Si al final todas se pudieron guardar una a una, resolvemos el cambio pendiente
          resolvePendingChange((c) => c.id === change.id);
          notify?.(`Sincronizado: "${change.collection}" ya está al día.`, 'success');
        } else {
          console.error(`Sincronización parcial en reintento de [${tableName}]: ${filasGuardadas} OK, ${filasFallidas} FAIL.`);
        }
      }
    } catch (err) {
      console.error(`Fallo crítico al reintentar [${change.collection}]:`, err);
    }
  }
}

// Decide qué datos usar para UNA colección al cargar la app (loadAllData en
// AppContexts.jsx la llama una vez por colección). Mismo principio que
// syncCollectionToSupabase pero en la dirección de lectura: local es la
// verdad inmediata, Supabase es best-effort — así que un remoto que responde
// sin error pero con 0 filas NO debe ganarle a un local que sí tiene datos.
//
// Antes de este fix, la condición era `!remoteError && remoteData` — un
// array vacío es truthy en JS, así que un remoto vacío "ganaba" igual que
// uno con datos reales, vaciando en silencio el estado en memoria (y de ahí
// arrastrando a localStorage en cuanto cualquier guardado posterior partiera
// de ese estado ya vacío). Aquí se exige explícitamente `remoteArray.length
// > 0` para que el remoto gane.
//
// Si el remoto viene vacío pero el local tiene datos, avisa por toast — sin
// esto, este fix sería tan silencioso como el bug que corrige, solo que
// "arreglado en secreto" en vez de "roto en secreto".
//
// Caso límite considerado y aceptado a propósito: niveles_cv y zonas_cv se
// vaciaron intencionadamente en una migración (se borraron las semillas con
// id UUID). Si el local todavía guarda entradas viejas de esas dos
// colecciones, este mismo fix las "resucitaría" en vez de dejarlas vacías.
// No se distingue esta función por colección para evitar ese caso: el precio
// (una revisión manual, una única vez, de Niveles/Zonas tras este fix — un
// id con pinta de UUID en vez del formato propio de la app se detecta a
// simple vista) es menor que el de tener una función con una excepción por
// colección que alguien tendría que recordar y mantener indefinidamente.
export async function loadCollectionData({ supabase: client, session, collection, storageKey, columnasSelect, getFromStorage, saveToStorage, notify }) {
  const local = getFromStorage(storageKey, []);
  const localArray = Array.isArray(local) ? local : [];

  if (!session) {
    return localArray;
  }

  const tableName = getTableName(collection);
  const { data: remoteData, error: remoteError } = await client
    .from(tableName)
    .select(columnasSelect || '*');

  const remoteArray = Array.isArray(remoteData) ? remoteData : [];

  if (!remoteError && remoteArray.length > 0) {
    saveToStorage(storageKey, remoteArray);
    return remoteArray;
  }

  if (!remoteError && remoteArray.length === 0 && localArray.length > 0) {
    notify?.(
      `El servidor no tiene datos de "${collection}" pero tu dispositivo sí — usando los datos locales. Sincroniza cuando puedas.`,
      'info'
    );
  }

  // Antes, un error real de lectura (RLS, token caducado, tabla renombrada...)
  // caía aquí en silencio — sin console.warn ni notify — así que un problema
  // persistente de lectura podía pasar indefinidamente inadvertido: el
  // usuario veía datos locales (potencialmente obsoletos) creyendo estar al
  // día, sin ninguna señal de que la carga remota estaba fallando.
  if (remoteError) {
    console.warn(`Error leyendo "${collection}" desde Supabase:`, remoteError);
    notify?.(
      `No se pudieron leer los datos de "${collection}" desde el servidor (${remoteError.message || 'error desconocido'}). Mostrando los datos guardados en este dispositivo.`,
      'error'
    );
  }

  return localArray;
}

// Envuelve retryPendingSync con protección contra ejecuciones solapadas.
// Cada resolvePendingChange exitoso dentro de un retry cambia la referencia de
// pendingChanges, lo que — en el useEffect que llama a esto — dispara otra
// ejecución mientras la anterior sigue en curso. Sin este guard, un elemento
// que sigue fallando se reintenta una vez por cada éxito de la misma ráfaga
// (O(N²) en el peor caso) en vez de una sola vez. isRetryingRef is un objeto
// con propiedad `.current` (un useRef real, o un objeto plano equivalente en
// los tests) para no depender de React aquí.
export async function guardedRetryPendingSync({ isRetryingRef, supabase, pendingChanges, resolvePendingChange, notify }) {
  if (isRetryingRef.current) return;

  isRetryingRef.current = true;
  try {
    await retryPendingSync({ supabase, pendingChanges, resolvePendingChange, notify });
  } finally {
    isRetryingRef.current = false;
  }
}
