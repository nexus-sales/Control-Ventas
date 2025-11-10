import React, { useState, useEffect, useCallback, useMemo, useContext, useRef } from 'react';
import { AuthCtx } from './contexts';
import { DataCtx } from './contexts';
import { fetchAllData, TABLES, upsert, removeByIds } from '../services/supabaseService';
import { isSupabaseConfigured } from '../config/env';

// Función para cargar datos desde localStorage
const loadFromStorage = (key, defaultValue = []) => {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : defaultValue;
  } catch (error) {
    console.warn(`Error loading ${key} from localStorage:`, error);
    return defaultValue;
  }
};

// Función para guardar datos en localStorage
const saveToStorage = (key, data) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.warn(`Error saving ${key} to localStorage:`, error);
  }
};

export function DataProvider({ children }) {
  const { profile, isLogged, offlineMode, activateOfflineMode } = useContext(AuthCtx);
  const supabaseConfigured = useMemo(() => isSupabaseConfigured(), []);
  const supabaseAvailableRef = useRef(supabaseConfigured);
  const remoteEnabled = supabaseConfigured && isLogged && !offlineMode;
  
  const [data, setData] = useState({
    ventas: [],
    colaboradores: [],
    niveles: [],
    operadores: [],
    productos: [],
    zonas: [],
    reglas: [],
    liquidaciones: [],
  });
  
  const [dataInitialized, setDataInitialized] = useState(() => {
    const debugFlag = localStorage.getItem("__app_force_initialized") === "true";
    return debugFlag || false;
  });
  const [isSupabaseAvailable, setIsSupabaseAvailable] = useState(remoteEnabled);

  // BYPASS TEMPORAL: Cargar solo desde localStorage, NO desde Supabase
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const debugEnabled = localStorage.getItem("__app_debug_enabled") === "true";
      if (debugEnabled && !window.__APP_DEBUG__) {
        window.__APP_DEBUG__ = { dataInitEvents: [] };
      }
    } catch (error) {
      console.warn("[DataProvider] No se pudo inicializar debug dashboard", error);
    }
  }, []);

  const recordDebugEvent = useCallback((label, payload = {}) => {
    if (typeof window === "undefined") return;
    if (!window.__APP_DEBUG__) {
      window.__APP_DEBUG__ = { dataInitEvents: [] };
    }
    const entry = {
      label,
      timestamp: new Date().toISOString(),
      ...payload,
    };
    window.__APP_DEBUG__.dataInitEvents.push(entry);
    if (window.__APP_DEBUG__.dataInitEvents.length > 50) {
      window.__APP_DEBUG__.dataInitEvents.shift();
    }
    console.log("[DataProvider]", label, payload);
  }, []);

  const persistCollection = useCallback(async (collectionKey, previousItems = [], nextItems = []) => {
    if (!remoteEnabled || !supabaseAvailableRef.current) return;
    const tableName = TABLES[collectionKey];
    if (!tableName) return;

    const prevMap = new Map((Array.isArray(previousItems) ? previousItems : []).filter(item => item?.id).map(item => [item.id, item]));
    const nextMap = new Map((Array.isArray(nextItems) ? nextItems : []).filter(item => item?.id).map(item => [item.id, item]));

    const upserts = [];
    nextMap.forEach((item, id) => {
      const prevItem = prevMap.get(id);
      if (!prevItem || JSON.stringify(prevItem) !== JSON.stringify(item)) {
        upserts.push(item);
      }
    });

    const deletions = [];
    prevMap.forEach((item, id) => {
      if (!nextMap.has(id)) deletions.push(id);
    });

    try {
      if (upserts.length) {
        const { error } = await upsert(tableName, upserts);
        if (error) throw error;
      }
      if (deletions.length) {
        const { error } = await removeByIds(tableName, deletions);
        if (error) throw error;
      }
      setIsSupabaseAvailable(true);
      supabaseAvailableRef.current = true;
    } catch (error) {
      console.error(`[DataProvider] Error sincronizando ${collectionKey}:`, error);
      
      // Solo activar modo offline para errores de conectividad, no de validación
      const isConnectivityError = error.code === 'PGRST301' || 
                                  error.message?.includes('network') || 
                                  error.message?.includes('fetch') ||
                                  error.message?.includes('timeout') ||
                                  error.message?.includes('connection');
      
      if (isConnectivityError) {
        setIsSupabaseAvailable(false);
        supabaseAvailableRef.current = false;
        if (typeof activateOfflineMode === 'function') {
          activateOfflineMode('data-persist-error');
        }
      } else {
        // Error de validación/constraint - mantener conexión activa
        console.warn(`[DataProvider] Error de validación en ${collectionKey}, manteniendo conexión:`, error.message);
      }
    }
  }, [remoteEnabled, activateOfflineMode]);

  const schedulePersistence = useCallback((collectionKey, previousItems, nextItems) => {
    if (!remoteEnabled || !supabaseAvailableRef.current) return;
    const enqueue = typeof queueMicrotask === 'function' ? queueMicrotask : (fn) => Promise.resolve().then(fn);
    enqueue(() => {
      persistCollection(collectionKey, previousItems, nextItems);
    });
  }, [persistCollection, remoteEnabled]);

  const loadAllData = useCallback(async ({ forceRemote = false } = {}) => {
  recordDebugEvent("load:start", { forceRemote, supabaseConfigured, remoteEnabled, offlineMode, supabaseAvailable: supabaseAvailableRef.current });

    let loadedData = null;

    const canAttemptRemote = remoteEnabled && (forceRemote || supabaseAvailableRef.current);

    if (canAttemptRemote) {
      try {
        const { data: remoteData, errors } = await fetchAllData();
        if (!errors.length) {
          loadedData = remoteData;
          setIsSupabaseAvailable(true);
          supabaseAvailableRef.current = true;
          Object.entries(remoteData).forEach(([key, value]) => {
            saveToStorage(`appcv_${key}`, value);
          });
          recordDebugEvent("load:remote-success", {
            ventas: remoteData.ventas?.length ?? 0,
            colaboradores: remoteData.colaboradores?.length ?? 0,
            productos: remoteData.productos?.length ?? 0,
          });
        } else {
          recordDebugEvent("load:remote-error", { errors });
          
          // Solo activar modo offline si hay errores de conectividad
          const hasConnectivityErrors = errors.some(error => 
            error.code === 'PGRST301' || 
            error.message?.includes('network') || 
            error.message?.includes('fetch') ||
            error.message?.includes('timeout') ||
            error.message?.includes('connection')
          );
          
          if (hasConnectivityErrors) {
            setIsSupabaseAvailable(false);
            supabaseAvailableRef.current = false;
            if (typeof activateOfflineMode === 'function') {
              activateOfflineMode('data-remote-error');
            }
          } else {
            console.warn('[DataProvider] Errores de validación detectados, manteniendo conexión:', errors);
          }
        }
      } catch (error) {
        recordDebugEvent("load:remote-exception", { message: error.message });
        
        // Solo activar modo offline para errores de conectividad
        const isConnectivityError = error.code === 'PGRST301' || 
                                    error.message?.includes('network') || 
                                    error.message?.includes('fetch') ||
                                    error.message?.includes('timeout') ||
                                    error.message?.includes('connection');
        
        if (isConnectivityError) {
          setIsSupabaseAvailable(false);
          supabaseAvailableRef.current = false;
          if (typeof activateOfflineMode === 'function') {
            activateOfflineMode('data-remote-exception');
          }
        } else {
          console.warn('[DataProvider] Error de validación/constraint, manteniendo conexión:', error.message);
        }
      }
    }

    if (!loadedData) {
      const localData = {
        ventas: loadFromStorage('appcv_ventas', []),
        colaboradores: loadFromStorage('appcv_colaboradores', []),
        niveles: loadFromStorage('appcv_niveles', []),
        operadores: loadFromStorage('appcv_operadores', []),
        productos: loadFromStorage('appcv_productos', []),
        zonas: loadFromStorage('appcv_zonas', []),
        reglas: loadFromStorage('appcv_reglas', []),
        liquidaciones: loadFromStorage('appcv_liquidaciones', []),
      };
      loadedData = localData;
      recordDebugEvent("load:local", {
        ventas: localData.ventas.length,
        colaboradores: localData.colaboradores.length,
        productos: localData.productos.length,
      });
    }

    setData(prev => ({ ...prev, ...loadedData }));
    setDataInitialized(true);
    localStorage.removeItem("__app_force_initialized");
    recordDebugEvent("load:end", { initialized: true, keys: Object.keys(loadedData || {}) });
    return loadedData;
  }, [recordDebugEvent, supabaseConfigured, remoteEnabled, offlineMode, activateOfflineMode]);

  // Cargar datos cuando el componente se monta
  useEffect(() => {
    console.log('DataProvider - Iniciando carga de datos...');
    loadAllData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // loadAllData se define con useCallback y es estable

  useEffect(() => {
    if (remoteEnabled) {
      supabaseAvailableRef.current = true;
      setIsSupabaseAvailable(true);
      loadAllData({ forceRemote: true });
    } else {
      setIsSupabaseAvailable(false);
    }
  }, [remoteEnabled, loadAllData]);

  // Guardar datos solo en localStorage (SIN SUPABASE)
  const saveData = useCallback(async (newData) => {
    console.log('DataProvider - Guardando dataset completo:', newData);
    setData(prev => {
      const next = { ...prev, ...newData };
      Object.entries(newData).forEach(([key, value]) => {
        saveToStorage(`appcv_${key}`, value);
        schedulePersistence(key, prev[key], value);
      });
      return next;
    });
    return { success: true };
  }, [schedulePersistence]);

  // Función para recargar datos
  const refreshData = useCallback(async () => {
    await loadAllData({ forceRemote: true });
    return true;
  }, [loadAllData]);

  // Funciones específicas por entidad para actualizar estado local Y Sincronizar
  const createCollectionSetter = useCallback((collectionKey) => {
    const storageKey = `appcv_${collectionKey}`;
    return (update) => {
      setData(prev => {
        const previousItems = prev[collectionKey] || [];
        let nextItems = typeof update === 'function' ? update(previousItems) : update;
        if (!Array.isArray(nextItems)) {
          console.warn(`[DataProvider] La actualización de ${collectionKey} no devolvió un array válido.`);
          nextItems = [];
        }
        saveToStorage(storageKey, nextItems);
        schedulePersistence(collectionKey, previousItems, nextItems);
        return { ...prev, [collectionKey]: nextItems };
      });
    };
  }, [schedulePersistence]);

  const setVentas = useMemo(() => createCollectionSetter('ventas'), [createCollectionSetter]);
  const setProductos = useMemo(() => createCollectionSetter('productos'), [createCollectionSetter]);
  const setOperadores = useMemo(() => createCollectionSetter('operadores'), [createCollectionSetter]);
  const setColaboradores = useMemo(() => createCollectionSetter('colaboradores'), [createCollectionSetter]);
  const setZonas = useMemo(() => createCollectionSetter('zonas'), [createCollectionSetter]);
  const setNiveles = useMemo(() => createCollectionSetter('niveles'), [createCollectionSetter]);
  const setReglas = useMemo(() => createCollectionSetter('reglas'), [createCollectionSetter]);
  const setLiquidaciones = useMemo(() => createCollectionSetter('liquidaciones'), [createCollectionSetter]);

  // Insertar ventas solo en localStorage y supabase cuando aplique
  const insertVentas = useCallback(async (ventas) => {
    if (!Array.isArray(ventas) || ventas.length === 0) {
      console.warn('insertVentas: datos inválidos');
      return { success: false };
    }
    setVentas(prev => [...ventas, ...prev]);
    return { success: true };
  }, [setVentas]);

  // Valor del contexto
  const value = useMemo(() => ({
    // Estado
    data,
    dataInitialized,
    isDataLoading: false, // Siempre false porque cargamos sincrónicamente desde localStorage
    lastError: null,
    // Funciones principales
    saveData,
    refreshData,
    insertVentas,
    loadAllData,
    syncAll: refreshData,
    // Funciones específicas por entidad
    setVentas,
    setProductos,
    setOperadores,
    setColaboradores,
    setZonas,
    setNiveles,
    setReglas,
    setLiquidaciones,
    // Info de usuario actual
    userRole: profile?.rol,
    isSupabaseAvailable,
  }), [
    data, 
    dataInitialized, 
    saveData, 
    refreshData, 
    insertVentas, 
    loadAllData,
    setVentas,
    setProductos,
    setOperadores,
    setColaboradores,
    setZonas,
    setNiveles,
    setReglas,
    setLiquidaciones,
    profile?.rol,
    isSupabaseAvailable
  ]);

  return (
    <DataCtx.Provider value={value}>
      {children}
    </DataCtx.Provider>
  );
}