// src/context/offlineSyncHelpers.js
// Sincronización offline (funciones puras, testables sin renderizar React).
// Dependencias inyectadas a propósito (supabase, addPendingChange, resolvePendingChange,
// notify) en vez de importadas/leídas de contexto: así se pueden probar con vi.fn()
// sin mockear módulos. DataProvider (AppContexts.jsx) las llama con las reales.

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

    const tableName = `${collection}_cv`;
    const { error } = await client.from(tableName).upsert(newData, { onConflict: 'id' });

    if (error) {
      console.error(`Error sync Supabase [${tableName}]:`, error);
      markPending(error.message);
      return false;
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
      const tableName = `${change.collection}_cv`;
      const { error } = await client.from(tableName).upsert(change.payload, { onConflict: 'id' });
      if (!error) {
        resolvePendingChange((c) => c.id === change.id);
        notify?.(`Sincronizado: "${change.collection}" ya está al día con el servidor.`, 'success');
      }
    } catch {
      // Sigue sin conexión o el error persiste — se queda pendiente para el
      // próximo reintento, no se lanza ni se añade una entrada duplicada.
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

  const tableName = `${collection}_cv`;
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

  return localArray;
}

// Envuelve retryPendingSync con protección contra ejecuciones solapadas.
// Cada resolvePendingChange exitoso dentro de un retry cambia la referencia de
// pendingChanges, lo que — en el useEffect que llama a esto — dispara otra
// ejecución mientras la anterior sigue en curso. Sin este guard, un elemento
// que sigue fallando se reintenta una vez por cada éxito de la misma ráfaga
// (O(N²) en el peor caso) en vez de una sola vez. isRetryingRef es un objeto
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
