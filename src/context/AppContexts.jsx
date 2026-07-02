// src/context/AppContexts.jsx
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';

// Importar contextos desde contexts.js
import { AuthContext, DataContext, ThemeContext, AppContext } from './contexts';

// Importar constantes y helpers
import { AUTH_BYPASS, MOCK_USER } from '../constants';
import { getFromStorage, saveToStorage } from '../utils/storage';
import { supabase } from '../lib/supabase';

// =================== STORAGE KEYS (fuera del componente) ===================
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

// Columnas explícitas por colección para el fetch general (hallazgo MEDIO Auditor:
// over-fetching de PII). Solo colaboradores tiene override — el resto sigue en '*'.
// direccion se excluye porque no la usa ninguna pantalla ni cálculo fuera del modal
// de edición (ColaboradorEditModal la pide aparte si hace falta). cif_dni y
// comision_personalizada NO se pueden quitar aquí: computeVenta() los necesita en
// el cliente para calcular comisiones de cualquier usuario, no solo admins.
const COLUMNAS_SELECT = {
  colaboradores: [
    'id', 'nombre', 'apellidos', 'email', 'telefono', 'cif_dni', 'tipo_fiscal',
    'irpf', 'exento_impuestos', 'nivel_id', 'zona_id', 'comision_personalizada',
    'comision_tipo_personalizada', 'pct_colaborador', 'pct_telefonia', 'pct_energia',
    'fijo_seguridad', 'estado', 'activo', 'fecha_alta', 'fecha_baja', 'observaciones',
    'rol', 'metadata', 'created_at', 'updated_at',
  ].join(', '),
};

// =================== 🔐 AUTH PROVIDER ===================

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => AUTH_BYPASS ? MOCK_USER : null);
  const [profile, setProfile] = useState(() => AUTH_BYPASS ? { ...MOCK_USER, rol: 'admin', activo: true, app_access: ['CV'] } : null);
  const [loading, setLoading] = useState(!AUTH_BYPASS);

  // Función para cargar el perfil del usuario desde usuarios_cv
  const fetchProfile = useCallback(async (userId, email) => {
    try {
      const { data, error } = await supabase
        .from('usuarios_cv')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // Si no existe el perfil, lo creamos automáticamente
          console.warn('Perfil no encontrado, creando perfil automáticamente...');

          const { data: newProfile, error: insertError } = await supabase
            .from('usuarios_cv')
            .insert({
              user_id: userId,
              email: email,
              nombre_completo: email,
              rol: 'admin', // Primer usuario como admin
              activo: true,
              app_access: ['CV']
            })
            .select()
            .single();

          if (insertError) {
            console.error('Error creando perfil:', insertError);
            return null;
          }

          return newProfile;
        }
        throw error;
      }
      return data;
    } catch (err) {
      console.error('Error fetching profile:', err);
      return null;
    }
  }, []);

  useEffect(() => {
    // 1. Escuchar cambios en la autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (AUTH_BYPASS && !session) return;

      const currentUser = session?.user || (AUTH_BYPASS ? MOCK_USER : null);
      setUser(currentUser);

      if (currentUser) {
        const userProfile = await fetchProfile(currentUser.id, currentUser.email);
        setProfile(userProfile);
      } else {
        setProfile(null);
      }

      setLoading(false);
    });

    // 2. Verificar sesión inicial
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (AUTH_BYPASS && !session) {
        setLoading(false);
        return;
      }

      const currentUser = session?.user || (AUTH_BYPASS ? MOCK_USER : null);
      setUser(currentUser);

      if (currentUser) {
        const userProfile = await fetchProfile(currentUser.id, currentUser.email);
        setProfile(userProfile);
      }

      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchProfile]);

  const signIn = useCallback(async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { user: data?.user, error };
  }, []);

  const signUp = useCallback(async (email, password, fullName) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });
    return { user: data?.user, error };
  }, []);

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (!error) {
      setUser(null);
      setProfile(null);
      localStorage.clear();
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
    return { error };
  }, []);

  const value = useMemo(() => ({
    user,
    profile,
    loading,
    signIn,
    signUp,
    signOut,
    isAuthenticated: !!user,
    isAdmin: profile?.rol === 'admin',
    isActive: profile?.activo === true,
    hasAppAccess: profile?.app_access?.includes('CV')
  }), [user, profile, loading, signIn, signUp, signOut]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-gray-900 dark:to-gray-800">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-gray-400">Cargando autenticación...</p>
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

  // Función para cargar datos (Híbrida: Supabase -> Local)
  const loadAllData = useCallback(async () => {
    setIsDataLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const newData = {};

      for (const collection of Object.keys(STORAGE_KEYS)) {
        let collectionData = [];

        // 1. Intentar cargar desde Supabase si hay sesión
        if (session) {
          const tableName = `${collection}_cv`;
          const { data: remoteData, error: remoteError } = await supabase
            .from(tableName)
            .select(COLUMNAS_SELECT[collection] || '*');

          if (!remoteError && remoteData) {
            collectionData = remoteData;
          } else {
            // Si hay error en Supabase, fallback a Local
            collectionData = getFromStorage(STORAGE_KEYS[collection], []);
          }
        } else {
          // 2. Si no hay sesión, cargar desde LocalStorage
          collectionData = getFromStorage(STORAGE_KEYS[collection], []);
        }

        newData[collection] = Array.isArray(collectionData) ? collectionData : [];

        // Sincronizar localmente lo que bajamos (opcional, pero útil para offline posterior)
        if (session && collectionData.length > 0) {
          saveToStorage(STORAGE_KEYS[collection], collectionData);
        }
      }

      setData(newData);
      setDataInitialized(true);

    } catch (error) {
      console.error('❌ DataProvider: Error crítico cargando datos:', error);
      setDataInitialized(false);
    } finally {
      setIsDataLoading(false);
    }
  }, []);

  // Función para guardar una colección (Híbrida: Local + Supabase)
  const saveCollectionData = useCallback(async (collection, newData) => {
    const key = STORAGE_KEYS[collection];
    if (!key) return false;

    // 1. Guardar en LocalStorage
    saveToStorage(key, newData);

    // 2. Intentar guardar en Supabase si hay sesión y conexión
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        // Mapeo selectivo por tabla real en Supabase
        const tableName = `${collection}_cv`;

        // Upsert masivo (requiere que los registros tengan ID UUID o PK manejable)
        // Nota: Esto es un ejemplo, dependiendo de la tabla puede ser diferente
        const { error } = await supabase
          .from(tableName)
          .upsert(newData, { onConflict: 'id' });

        if (error) console.error(`Error sync Supabase [${tableName}]:`, error);
      }
    } catch (err) {
      console.warn('Sync Supabase failed (offline mode):', err);
    }

    return true;
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

    // Debug: DataProvider inicializando
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

// =================== RE-EXPORTAR HOOKS ===================
// Re-exportar hooks desde hooks.js para mantener compatibilidad
// eslint-disable-next-line react-refresh/only-export-components
export { useAuth, useData, useTheme, useApp, useAppContexts } from './hooks';

// =================== DEFAULT EXPORT ===================
export default AppContextProvider;