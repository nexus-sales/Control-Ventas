import { describe, it, expect, vi } from 'vitest';
import { syncCollectionToSupabase, retryPendingSync, guardedRetryPendingSync } from './offlineSyncHelpers';

// Mock mínimo del cliente de Supabase: solo lo que estas funciones tocan
// (auth.getSession y from().upsert()), configurable por test.
function makeSupabaseMock({ session = {}, upsertError = null } = {}) {
  return {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session } }),
    },
    from: vi.fn(() => ({
      upsert: vi.fn().mockResolvedValue({ error: upsertError }),
    })),
  };
}

describe('syncCollectionToSupabase', () => {
  it('marca el cambio como pendiente y avisa cuando el upsert falla', async () => {
    const supabase = makeSupabaseMock({ upsertError: { message: 'RLS violation' } });
    const addPendingChange = vi.fn();
    const resolvePendingChange = vi.fn();
    const notify = vi.fn();
    const newData = [{ id: 'v1', cliente: 'Test' }];

    const result = await syncCollectionToSupabase({
      supabase, collection: 'ventas', newData, addPendingChange, resolvePendingChange, notify,
    });

    expect(result).toBe(false);
    expect(addPendingChange).toHaveBeenCalledWith(
      expect.objectContaining({ collection: 'ventas', payload: newData, recordIds: ['v1'], reason: 'RLS violation' })
    );
    expect(notify).toHaveBeenCalledWith(expect.stringContaining('ventas'), 'error');
  });

  it('marca el cambio como pendiente sin intentar el upsert si no hay sesión', async () => {
    const supabase = makeSupabaseMock({ session: null });
    const addPendingChange = vi.fn();
    const resolvePendingChange = vi.fn();
    const newData = [{ id: 'v1' }];

    const result = await syncCollectionToSupabase({
      supabase, collection: 'ventas', newData, addPendingChange, resolvePendingChange, notify: vi.fn(),
    });

    expect(result).toBe(false);
    expect(supabase.from).not.toHaveBeenCalled();
    expect(addPendingChange).toHaveBeenCalledWith(
      expect.objectContaining({ collection: 'ventas', reason: 'sin sesión activa' })
    );
  });

  it('resuelve (no añade) pendientes cuando el upsert tiene éxito', async () => {
    const supabase = makeSupabaseMock({ upsertError: null });
    const addPendingChange = vi.fn();
    const resolvePendingChange = vi.fn();
    const newData = [{ id: 'v1' }];

    const result = await syncCollectionToSupabase({
      supabase, collection: 'ventas', newData, addPendingChange, resolvePendingChange, notify: vi.fn(),
    });

    expect(result).toBe(true);
    expect(addPendingChange).not.toHaveBeenCalled();
    expect(resolvePendingChange).toHaveBeenCalled();
  });
});

describe('flujo completo: fallo -> pendiente -> reintento con éxito -> limpieza', () => {
  it('un cambio que falló al guardarse se limpia tras un reintento exitoso', async () => {
    // 1. Guardado inicial: el upsert falla (p. ej. sin conexión momentánea).
    const supabaseFallando = makeSupabaseMock({ upsertError: { message: 'network error' } });
    let pendingChanges = [];
    const addPendingChange = vi.fn((change) => {
      pendingChanges.push({ ...change, id: `change_1` });
    });
    const resolvePendingChange = vi.fn((predicate) => {
      pendingChanges = pendingChanges.filter((c) => !predicate(c));
    });
    const notify = vi.fn();
    const newData = [{ id: 'v1', cliente: 'Cliente Offline' }];

    const resultadoInicial = await syncCollectionToSupabase({
      supabase: supabaseFallando, collection: 'ventas', newData, addPendingChange, resolvePendingChange, notify,
    });

    expect(resultadoInicial).toBe(false);
    expect(pendingChanges).toHaveLength(1);
    expect(pendingChanges[0]).toMatchObject({ collection: 'ventas', payload: newData });

    // 2. Recupera conexión: el mismo upsert ahora tiene éxito.
    const supabaseRecuperado = makeSupabaseMock({ upsertError: null });

    await retryPendingSync({
      supabase: supabaseRecuperado, pendingChanges, resolvePendingChange, notify,
    });

    expect(pendingChanges).toHaveLength(0);
    expect(notify).toHaveBeenCalledWith(expect.stringContaining('ventas'), 'success');
  });

  it('si el reintento sigue fallando, el cambio permanece pendiente sin duplicarse', async () => {
    const supabaseSigueFallando = makeSupabaseMock({ upsertError: { message: 'still down' } });
    let pendingChanges = [{ id: 'change_1', collection: 'ventas', payload: [{ id: 'v1' }] }];
    const resolvePendingChange = vi.fn((predicate) => {
      pendingChanges = pendingChanges.filter((c) => !predicate(c));
    });

    await retryPendingSync({
      supabase: supabaseSigueFallando, pendingChanges, resolvePendingChange, notify: vi.fn(),
    });

    expect(pendingChanges).toHaveLength(1);
    expect(pendingChanges[0].id).toBe('change_1');
  });
});

describe('guardedRetryPendingSync — evita reintentos en cascada', () => {
  it('con 2 pendientes que tienen éxito y 1 que sigue fallando en la misma ráfaga, el fallido se reintenta como máximo una vez', async () => {
    let pendingChanges = [
      { id: 'c1', collection: 'ventas', payload: [{ id: 'v1' }] },
      { id: 'c2', collection: 'ventas', payload: [{ id: 'v2' }] },
      { id: 'c3', collection: 'productos', payload: [{ id: 'p1' }] }, // este sigue fallando siempre
    ];

    const upsertCallsByTable = {};
    const supabase = {
      auth: { getSession: vi.fn().mockResolvedValue({ data: { session: {} } }) },
      from: vi.fn((tableName) => ({
        upsert: vi.fn().mockImplementation(async () => {
          upsertCallsByTable[tableName] = (upsertCallsByTable[tableName] || 0) + 1;
          if (tableName === 'productos_cv') {
            return { error: { message: 'constraint violation' } };
          }
          return { error: null };
        }),
      })),
    };

    const isRetryingRef = { current: false };
    const notify = vi.fn();
    const rerunsDisparados = [];

    // Simula lo que hace el useEffect real en AppContexts.jsx: cada vez que
    // pendingChanges cambia de verdad (un éxito), se dispara OTRA llamada a
    // guardedRetryPendingSync con el snapshot actualizado — igual que el
    // cambio de referencia de pendingChanges re-dispara el efecto mientras el
    // retry original sigue en curso. isRetryingRef sigue en `true` en ese
    // momento (el guardedRetryPendingSync exterior aún no ha terminado), así
    // que esta re-llamada debe quedar bloqueada por el guard.
    const resolvePendingChange = (predicate) => {
      pendingChanges = pendingChanges.filter((c) => !predicate(c));
      rerunsDisparados.push(
        guardedRetryPendingSync({ isRetryingRef, supabase, pendingChanges, resolvePendingChange, notify })
      );
    };

    await guardedRetryPendingSync({ isRetryingRef, supabase, pendingChanges, resolvePendingChange, notify });
    await Promise.all(rerunsDisparados);

    // c1 y c2 tuvieron éxito y se limpiaron; c3 sigue pendiente.
    expect(pendingChanges).toHaveLength(1);
    expect(pendingChanges[0].id).toBe('c3');

    // Sin el guard, cada uno de los 2 éxitos habría relanzado un retry completo
    // que volvería a intentar c3 (hasta 3 intentos en total). Con el guard,
    // las re-llamadas quedan bloqueadas mientras la original sigue en curso:
    // c3 solo se intenta 1 vez en toda la ráfaga.
    expect(upsertCallsByTable['productos_cv']).toBe(1);
    expect(isRetryingRef.current).toBe(false);
  });
});
