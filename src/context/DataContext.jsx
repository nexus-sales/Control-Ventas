import React, { useState, useEffect, useCallback, useMemo, useContext, useRef } from 'react';
import { AuthCtx } from './contexts';
import { DataCtx } from './contexts';
import { fetchAllData, TABLES, upsert, removeByIds } from '../services/supabaseService';
import { isSupabaseConfigured } from '../config/env';
import { runSeedIfNeeded } from '../data/seeds';

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
  
  // ✅ FIX CRÍTICO: Inicializar estado con datos de localStorage INMEDIATAMENTE
  const [data, setData] = useState(() => {
    console.log('🔄 Inicializando estado con datos de localStorage...');
    
    // Ejecutar seeds si son necesarios ANTES de cargar datos
    runSeedIfNeeded();
    
    const initialData = {
      ventas: loadFromStorage('appcv_ventas', []),
      colaboradores: loadFromStorage('appcv_colaboradores', []),
      niveles: loadFromStorage('appcv_niveles', []),
      operadores: loadFromStorage('appcv_operadores', []),
      productos: loadFromStorage('appcv_productos', []),
      zonas: loadFromStorage('appcv_zonas', []),
      reglas: loadFromStorage('appcv_reglas', []),
      liquidaciones: loadFromStorage('appcv_liquidaciones', []),
      decomisiones: loadFromStorage('appcv_decomisiones', []),
    };
    
    console.log('📊 Estado inicial cargado:', {
      ventas: initialData.ventas.length,
      colaboradores: initialData.colaboradores.length,
      niveles: initialData.niveles.length,
      operadores: initialData.operadores.length,
      productos: initialData.productos.length,
      zonas: initialData.zonas.length,
    });
    
    return initialData;
  });
  
  // ✅ FIX CRÍTICO: Marcar como inicializado INMEDIATAMENTE porque ya tenemos datos
  const [dataInitialized] = useState(true);
  const [isSupabaseAvailable, setIsSupabaseAvailable] = useState(remoteEnabled);

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
        
        console.log(`✅ Sincronizados ${upserts.length} registros de ${collectionKey} con Supabase`);
      }
      if (deletions.length) {
        const { error } = await removeByIds(tableName, deletions);
        if (error) throw error;
        console.log(`🗑️ Eliminados ${deletions.length} registros de ${collectionKey} de Supabase`);
      }
      setIsSupabaseAvailable(true);
      supabaseAvailableRef.current = true;
    } catch (error) {
      console.error(`[DataProvider] Error sincronizando ${collectionKey}:`, error);
      
      // Solo activar modo offline para errores de conectividad, no de validación
      const isConnectivityError = error.code === 'PGRST301' || 
                error.code === 'SUPABASE_OFFLINE' ||
                error.code === 'FETCH_TIMEOUT' ||
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

  // ✅ FIX CRÍTICO: Sincronización inteligente que preserva datos locales
  const syncWithSupabase = useCallback(async () => {
    if (!remoteEnabled || !supabaseAvailableRef.current) {
      console.log('❌ Sincronización con Supabase no disponible');
      return false;
    }

    recordDebugEvent("sync:start", { remoteEnabled, supabaseAvailable: supabaseAvailableRef.current });

    try {
      const { data: remoteData, errors } = await fetchAllData();
      if (!errors.length && remoteData) {
        console.log('📥 Datos recibidos desde Supabase:', {
          ventas: remoteData.ventas?.length ?? 0,
          colaboradores: remoteData.colaboradores?.length ?? 0,
          niveles: remoteData.niveles?.length ?? 0,
          operadores: remoteData.operadores?.length ?? 0,
          productos: remoteData.productos?.length ?? 0,
          zonas: remoteData.zonas?.length ?? 0,
        });

        // ✅ LÓGICA INTELIGENTE: Comparar contra localStorage REAL, no estado React
        const mergedData = {};
        Object.entries(remoteData).forEach(([key, remoteValue]) => {
          // Leer directamente desde localStorage
          const currentLocalArray = loadFromStorage(`appcv_${key}`, []);
          
          if (Array.isArray(remoteValue) && Array.isArray(currentLocalArray)) {
            if (remoteValue.length > currentLocalArray.length) {
              console.log(`🔄 Actualizando ${key}: ${currentLocalArray.length} → ${remoteValue.length} registros (más datos en Supabase)`);
              mergedData[key] = remoteValue;
              saveToStorage(`appcv_${key}`, remoteValue);
            } else {
              console.log(`💾 Preservando ${key} local: ${currentLocalArray.length} registros (remoto: ${remoteValue.length} - manteniendo local)`);
              mergedData[key] = currentLocalArray; // Conservar datos locales
            }
          } else {
            // Para datos no-array, usar remoto si existe
            mergedData[key] = remoteValue || currentLocalArray;
            if (remoteValue) {
              saveToStorage(`appcv_${key}`, remoteValue);
            }
          }
        });

        // Solo actualizar estado con los datos mejorados
        setData(prev => ({ ...prev, ...mergedData }));

        setIsSupabaseAvailable(true);
        supabaseAvailableRef.current = true;
        recordDebugEvent("sync:success", { merged: Object.keys(mergedData) });
        return true;
      } else {
        recordDebugEvent("sync:error", { errors });
        return false;
      }
    } catch (error) {
      recordDebugEvent("sync:exception", { message: error.message });
      console.error('[DataProvider] Error en sincronización con Supabase:', error);
      
      const isConnectivityError = error.code === 'PGRST301' || 
                                    error.code === 'SUPABASE_OFFLINE' ||
            error.code === 'FETCH_TIMEOUT' ||
                                    error.message?.includes('network') || 
                                    error.message?.includes('fetch') ||
                                    error.message?.includes('timeout') ||
                                    error.message?.includes('connection');
      
      if (isConnectivityError) {
        setIsSupabaseAvailable(false);
        supabaseAvailableRef.current = false;
        if (typeof activateOfflineMode === 'function') {
          activateOfflineMode('sync-exception');
        }
      }
      return false;
    }
  }, [recordDebugEvent, remoteEnabled, activateOfflineMode]); // ✅ REMOVIDO 'data' de dependencias

  // ✅ Efecto para sincronizar con Supabase DESPUÉS de que los datos locales estén cargados
  useEffect(() => {
    if (remoteEnabled && dataInitialized) {
      console.log('🔗 Intentando sincronizar con Supabase...');
      syncWithSupabase();
    }
  }, [remoteEnabled, dataInitialized, syncWithSupabase]);

  // Guardar datos en localStorage Y sincronizar con Supabase
  const saveData = useCallback(async (newData) => {
    console.log('💾 Guardando datos:', newData);
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
    const success = await syncWithSupabase();
    return success;
  }, [syncWithSupabase]);

  // Funciones específicas por entidad para actualizar estado local Y sincronizar
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
  const setDecomisiones = useMemo(() => createCollectionSetter('decomisiones'), [createCollectionSetter]);

  // Insertar ventas
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
    syncWithSupabase,
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
    setDecomisiones,
    // Info de usuario actual
    userRole: profile?.rol,
    isSupabaseAvailable,
  }), [
    data, 
    dataInitialized, 
    saveData, 
    refreshData, 
    insertVentas, 
    syncWithSupabase,
    setVentas,
    setProductos,
    setOperadores,
    setColaboradores,
    setZonas,
    setNiveles,
    setReglas,
    setLiquidaciones,
    setDecomisiones,
    profile?.rol,
    isSupabaseAvailable
  ]);

  return (
    <DataCtx.Provider value={value}>
      {children}
    </DataCtx.Provider>
  );
}