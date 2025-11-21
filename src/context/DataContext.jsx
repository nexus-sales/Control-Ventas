import React, { useState, useEffect, useCallback, useMemo, useContext, useRef, createContext } from 'react';
import { runSeedIfNeeded } from '../data/seeds';

// Crear el contexto
export const DataContext = createContext();

// Hook personalizado integrado
export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData debe ser usado dentro de un DataContextProvider');
  }
  return context;
};

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

export function DataContextProvider({ children }) {
  const [data, setData] = useState({
    ventas: [],
    colaboradores: [],
    niveles: [],
    operadores: [],
    productos: [],
    zonas: [],
    reglas: [],
    liquidaciones: [],
    decomisiones: [],
  });
  
  const [dataInitialized, setDataInitialized] = useState(() => {
    const debugFlag = localStorage.getItem("__app_force_initialized") === "true";
    return debugFlag || false;
  });

  // Sistema de debug
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const debugEnabled = localStorage.getItem("__app_debug_enabled") === "true";
      if (debugEnabled && !window.__APP_DEBUG__) {
        window.__APP_DEBUG__ = { dataInitEvents: [] };
      }
    } catch (error) {
      console.warn("[DataContextProvider] No se pudo inicializar debug dashboard", error);
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
    console.log("[DataContextProvider]", label, payload);
  }, []);

  const loadAllData = useCallback(async () => {
    recordDebugEvent("load:start");

    const localData = {
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
    
    recordDebugEvent("load:local", {
      ventas: localData.ventas.length,
      colaboradores: localData.colaboradores.length,
      productos: localData.productos.length,
    });

    setData(prev => ({ ...prev, ...localData }));
    setDataInitialized(true);
    localStorage.removeItem("__app_force_initialized");
    recordDebugEvent("load:end", { initialized: true, keys: Object.keys(localData) });
    return localData;
  }, [recordDebugEvent]);

  // Cargar datos cuando el componente se monta
  useEffect(() => {
    console.log('DataContextProvider - Iniciando carga de datos...');
    runSeedIfNeeded();
    loadAllData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Solo ejecutar al montar

  // Guardar datos solo en localStorage
  const saveData = useCallback(async (newData) => {
    console.log('DataContextProvider - Guardando dataset completo:', newData);
    setData(prev => {
      const next = { ...prev, ...newData };
      Object.entries(newData).forEach(([key, value]) => {
        saveToStorage(`appcv_${key}`, value);
      });
      return next;
    });
    return { success: true };
  }, []);

  // Función para recargar datos
  const refreshData = useCallback(async () => {
    await loadAllData();
    return true;
  }, [loadAllData]);

  // Funciones específicas por entidad
  const createCollectionSetter = useCallback((collectionKey) => {
    const storageKey = `appcv_${collectionKey}`;
    return (update) => {
      setData(prev => {
        const previousItems = prev[collectionKey] || [];
        let nextItems = typeof update === 'function' ? update(previousItems) : update;
        if (!Array.isArray(nextItems)) {
          console.warn(`[DataContextProvider] La actualización de ${collectionKey} no devolvió un array válido.`);
          nextItems = [];
        }
        saveToStorage(storageKey, nextItems);
        return { ...prev, [collectionKey]: nextItems };
      });
    };
  }, []);

  // Funciones setter memoizadas
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

  // Limpiar datos
  const resetAllData = useCallback(() => {
    const emptyData = {
      ventas: [],
      colaboradores: [],
      niveles: [],
      operadores: [],
      productos: [],
      zonas: [],
      reglas: [],
      liquidaciones: [],
      decomisiones: [],
    };
    Object.keys(emptyData).forEach(key => {
      localStorage.setItem(`appcv_${key}`, JSON.stringify([]));
    });
    setData(emptyData);
    setDataInitialized(true);
  }, []);

  // Validar relaciones
  const validateAllRelations = useCallback(() => {
    setData(prev => {
      function uniqueById(arr) {
        const seen = new Set();
        return arr.filter(item => {
          if (!item.id || seen.has(item.id)) return false;
          seen.add(item.id);
          return true;
        });
      }
      
      const cleanData = {
        ventas: uniqueById(prev.ventas).filter(v => v.id),
        colaboradores: uniqueById(prev.colaboradores).filter(c => c.id),
        niveles: uniqueById(prev.niveles),
        operadores: uniqueById(prev.operadores).filter(op => op.id),
        productos: uniqueById(prev.productos).filter(p => p.id),
        zonas: uniqueById(prev.zonas).filter(z => z.id),
        reglas: uniqueById(prev.reglas),
        liquidaciones: uniqueById(prev.liquidaciones),
        decomisiones: uniqueById(prev.decomisiones),
      };

      Object.keys(cleanData).forEach(key => {
        saveToStorage(`appcv_${key}`, cleanData[key]);
      });

      setDataInitialized(true);
      return cleanData;
    });
  }, []);

  // Valor del contexto
  const contextValue = {
    data,
    dataInitialized,
    isDataLoading: false,
    lastError: null,
    saveData,
    refreshData,
    insertVentas,
    loadAllData,
    syncAll: refreshData,
    resetAllData,
    validateAllRelations,
    setVentas,
    setProductos,
    setOperadores,
    setColaboradores,
    setZonas,
    setNiveles,
    setReglas,
    setLiquidaciones,
    setDecomisiones,
  };

  return (
    <DataContext.Provider value={contextValue}>
      {children}
    </DataContext.Provider>
  );
}

export default DataContextProvider;