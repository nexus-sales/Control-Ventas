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
