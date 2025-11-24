import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';

// =================== CONTEXTOS ===================
export const AuthContext = createContext(null);
export const DataContext = createContext(null);
export const ThemeContext = createContext(null);
export const AppContext = createContext(null);

// =================== CONFIGURACIÓN ===================
const AUTH_BYPASS = import.meta.env.VITE_AUTH_BYPASS === 'true';

const MOCK_USER = {
  id: 'mock-user-id',
  email: 'admin@test.com',
  nombre: 'Usuario Admin',
  rol: 'admin'
};

// =================== STORAGE HELPERS ===================
const getFromStorage = (key, defaultValue = null) => {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : defaultValue;
  } catch (error) {
    console.error(`Error reading from localStorage (${key}):`, error);
    return defaultValue;
  }
};

const saveToStorage = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error(`Error saving to localStorage (${key}):`, error);
    return false;
  }
};

// =================== 🔐 AUTH PROVIDER ===================
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (AUTH_BYPASS) {
      setUser(MOCK_USER);
      setLoading(false);
      return;
    }

    // Simulación de carga de usuario
    setTimeout(() => {
      setUser(MOCK_USER);
      setLoading(false);
    }, 500);
  }, []);

  const signIn = useCallback(async (email, password) => {
    if (AUTH_BYPASS) return { user: MOCK_USER, error: null };
    
    // Validación básica
    if (email === 'admin@test.com' && password === 'admin123') {
      setUser(MOCK_USER);
      return { user: MOCK_USER, error: null };
    }
    
    return { error: { message: 'Credenciales incorrectas' } };
  }, []);

  const signOut = useCallback(async () => {
    setUser(null);
    return { error: null };
  }, []);

  const value = useMemo(() => ({
    user,
    loading,
    signIn,
    signOut,
    isAuthenticated: !!user
  }), [user, loading, signIn, signOut]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Cargando autenticación...</p>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// =================== 📊 DATA PROVIDER ===================
export function DataProvider({ children }) {
  const [data, setData] = useState({
    ventas: [],
    colaboradores: [],
    clientes: [],
    productos: [],
    operadores: [],
    zonas: [],
    niveles: [],
    reglas: [],
    liquidaciones: [],
    decomisiones: [],
    empresas: []
  });

  const [dataInitialized, setDataInitialized] = useState(false);
  const [isDataLoading, setIsDataLoading] = useState(false);
  const initRef = useRef(false);

  // Claves correctas que existen en localStorage después de la migración
  const STORAGE_KEYS = {
    ventas: 'cv_ventas_v3',
    colaboradores: 'cv_colaboradores_v3',
    clientes: 'cv_clientes_v3',
    productos: 'cv_productos_v3',
    operadores: 'cv_operadores_v3',
    zonas: 'cv_zonas_v3',
    niveles: 'cv_niveles_v3',
    reglas: 'cv_reglas_v3',
    liquidaciones: 'cv_liquidaciones_v3',
    decomisiones: 'cv_decomisiones_v3',
    empresas: 'cv_empresas_v3'
  };

  // Función para cargar datos desde localStorage
  const loadAllData = useCallback(async () => {
    console.log('📊 DataProvider: Cargando datos...');
    setIsDataLoading(true);

    try {
      const newData = {};
      
      // Cargar cada colección
      Object.keys(STORAGE_KEYS).forEach(collection => {
        const key = STORAGE_KEYS[collection];
        const stored = getFromStorage(key, []);
        newData[collection] = Array.isArray(stored) ? stored : [];
        console.log(`📊 ${collection}: ${newData[collection].length} items`);
      });

      setData(newData);
      setDataInitialized(true);
      console.log('✅ DataProvider: Datos cargados correctamente');

    } catch (error) {
      console.error('❌ DataProvider: Error cargando datos:', error);
      setDataInitialized(false);
    } finally {
      setIsDataLoading(false);
    }
  }, []);

  // Función para guardar una colección
  const saveCollectionData = useCallback((collection, newData) => {
    const key = STORAGE_KEYS[collection];
    if (!key) {
      console.warn(`DataProvider: No hay clave storage para ${collection}`);
      return false;
    }

    return saveToStorage(key, newData);
  }, []);

  // Setters para cada colección
  const createSetter = useCallback((collection) => {
    return (update) => {
      setData(prev => {
        const currentData = prev[collection] || [];
        const newData = typeof update === 'function' ? update(currentData) : update;
        const finalData = Array.isArray(newData) ? newData : [];
        
        // Guardar en localStorage
        saveCollectionData(collection, finalData);
        
        return {
          ...prev,
          [collection]: finalData
        };
      });
    };
  }, [saveCollectionData]);

  // Memoizar los setters
  const setVentas = useMemo(() => createSetter('ventas'), [createSetter]);
  const setColaboradores = useMemo(() => createSetter('colaboradores'), [createSetter]);
  const setClientes = useMemo(() => createSetter('clientes'), [createSetter]);
  const setProductos = useMemo(() => createSetter('productos'), [createSetter]);
  const setOperadores = useMemo(() => createSetter('operadores'), [createSetter]);
  const setZonas = useMemo(() => createSetter('zonas'), [createSetter]);
  const setNiveles = useMemo(() => createSetter('niveles'), [createSetter]);
  const setReglas = useMemo(() => createSetter('reglas'), [createSetter]);
  const setLiquidaciones = useMemo(() => createSetter('liquidaciones'), [createSetter]);
  const setDecomisiones = useMemo(() => createSetter('decomisiones'), [createSetter]);
  const setEmpresas = useMemo(() => createSetter('empresas'), [createSetter]);

  // Inicialización
  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;
    
    console.log('📊 DataProvider: Inicializando...');
    loadAllData();
  }, [loadAllData]);

  const value = useMemo(() => ({
    data,
    dataInitialized,
    isDataLoading,
    setVentas,
    setColaboradores,
    setClientes,
    setProductos,
    setOperadores,
    setZonas,
    setNiveles,
    setReglas,
    setLiquidaciones,
    setDecomisiones,
    setEmpresas,
    refreshData: loadAllData
  }), [
    data,
    dataInitialized,
    isDataLoading,
    setVentas,
    setColaboradores,
    setClientes,
    setProductos,
    setOperadores,
    setZonas,
    setNiveles,
    setReglas,
    setLiquidaciones,
    setDecomisiones,
    setEmpresas,
    loadAllData
  ]);

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
}

// =================== 🎨 THEME PROVIDER ===================
export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    if (typeof window === 'undefined') return 'light';
    const saved = getFromStorage('app_theme', 'light');
    return saved;
  });

  const toggleTheme = useCallback(() => {
    setTheme(prev => {
      const newTheme = prev === 'light' ? 'dark' : 'light';
      saveToStorage('app_theme', newTheme);
      return newTheme;
    });
  }, []);

  const value = useMemo(() => ({
    theme,
    setTheme,
    toggleTheme,
    isDark: theme === 'dark'
  }), [theme, toggleTheme]);

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.classList.toggle('dark', theme === 'dark');
    }
  }, [theme]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

// =================== 🌐 APP PROVIDER ===================
export function AppProvider({ children }) {
  const [notifications, setNotifications] = useState([]);
  const [isOnline, setIsOnline] = useState(() => {
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const addNotification = useCallback((notification) => {
    const id = Date.now().toString();
    setNotifications(prev => [...prev, { ...notification, id }]);
    
    // Auto-remove después de 5 segundos
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 5000);
    
    return id;
  }, []);

  const removeNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const value = useMemo(() => ({
    notifications,
    isOnline,
    addNotification,
    removeNotification
  }), [notifications, isOnline, addNotification, removeNotification]);

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}

// =================== 🎯 MAIN PROVIDER ===================
export function AppContextProvider({ children }) {
  return (
    <ThemeProvider>
      <AuthProvider>
        <DataProvider>
          <AppProvider>
            {children}
          </AppProvider>
        </DataProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

// =================== HOOKS ===================
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de AppContextProvider');
  }
  return context;
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData debe ser usado dentro de AppContextProvider');
  }
  return context;
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme debe ser usado dentro de AppContextProvider');
  }
  return context;
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp debe ser usado dentro de AppContextProvider');
  }
  return context;
};

export const useAppContexts = () => {
  const auth = useAuth();
  const data = useData();
  const theme = useTheme();
  const app = useApp();

  return { auth, data, theme, app };
};

// =================== EXPORTS ===================
export default AppContextProvider;