// src/context/AppContexts.jsx
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';

// Importar contextos desde contexts.js
import { AuthContext, DataContext, ThemeContext, AppContext } from './contexts';

// Importar constantes y helpers
import { AUTH_BYPASS, MOCK_USER } from '../constants';
import { getFromStorage, saveToStorage } from '../utils/storage';
import { supabase } from '../lib/supabase';
import { useOfflineSync } from '../hooks/useOfflineSync';
import Toast from '../components/ui/Toast';
import { syncCollectionToSupabase, guardedRetryPendingSync, loadCollectionData } from './offlineSyncHelpers';

// =================== STORAGE KEYS (fuera del componente) ===================
const STORAGE_KEYS = {
  ventas: 'cv_ventas_v3',
  colaboradores: 'cv_colaboradores_v3',
  productos: 'cv_productos_v3',
  operadores: 'cv_operadores_v3',
  zonas: 'cv_zonas_v3',
  niveles: 'cv_niveles_v3',
  reglas: 'cv_reglas_v3',
  liquidaciones: 'cv_liquidaciones_v3',
  decomisiones: 'cv_decomisiones_v3'
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
    productos: [],
    operadores: [],
    zonas: [],
    niveles: [],
    reglas: [],
    liquidaciones: [],
    decomisiones: []
  });

  const [dataInitialized, setDataInitialized] = useState(false);
  const [isDataLoading, setIsDataLoading] = useState(false);
  const initRef = useRef(false);

  const { isOnline, pendingChanges, addPendingChange, resolvePendingChange, lastSyncTime, createEmergencyBackup, getOfflineInfo, clearPendingChanges } = useOfflineSync();
  const [syncToast, setSyncToast] = useState(null);
  // Evita reintentos en cascada: cada resolución exitosa dentro de retryPendingSync
  // cambia la referencia de pendingChanges, lo que re-dispara el useEffect de abajo
  // mientras el retry anterior sigue en curso — sin este guard, un registro que
  // sigue fallando se reintenta una vez por cada éxito de la misma ráfaga (O(N²)
  // en el peor caso) en vez de una sola vez.
  const isRetryingRef = useRef(false);

  const notifySync = useCallback((message, type = 'error') => {
    setSyncToast({ message, type });
  }, []);

  // Autodescarte del toast de sincronización (igual que las notificaciones de AppProvider).
  useEffect(() => {
    if (!syncToast) return;
    const timer = setTimeout(() => setSyncToast(null), 6000);
    return () => clearTimeout(timer);
  }, [syncToast]);

  // Función para cargar datos (Híbrida: Supabase -> Local). Por colección:
  // remoto solo gana si responde sin error Y con al menos una fila — un
  // remoto vacío no debe vaciar datos locales que sí existen (mismo
  // principio "local es la verdad inmediata" que ya aplica saveCollectionData
  // al guardar). Ver loadCollectionData (offlineSyncHelpers.js) para el porqué.
  const loadAllData = useCallback(async () => {
    setIsDataLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const newData = {};

      // Cargar colecciones en paralelo
      const promises = Object.keys(STORAGE_KEYS).map(async (collection) => {
        const result = await loadCollectionData({
          supabase,
          session,
          collection,
          storageKey: STORAGE_KEYS[collection],
          columnasSelect: COLUMNAS_SELECT[collection],
          getFromStorage,
          saveToStorage,
          notify: notifySync,
        });
        newData[collection] = result;
      });

      await Promise.all(promises);

      setData(newData);
      setDataInitialized(true);

    } catch (error) {
      console.error('❌ DataProvider: Error crítico cargando datos:', error);
      setDataInitialized(false);
    } finally {
      setIsDataLoading(false);
    }
  }, [notifySync]);

  // Sincronización manual: sube todo el estado local a Supabase y descarga datos frescos
  const syncNow = useCallback(async () => {
    setIsDataLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        notifySync("No hay una sesión activa de Supabase. Inicia sesión primero.", "error");
        return;
      }

      notifySync("Subiendo datos locales a Supabase...", "info");

      // 1. Subir todas las colecciones locales a Supabase usando upsert
      for (const collection of Object.keys(STORAGE_KEYS)) {
        const localData = getFromStorage(STORAGE_KEYS[collection], []);
        if (localData && localData.length > 0) {
          const tableName = `${collection}_cv`;
          const { error } = await supabase.from(tableName).upsert(localData, { onConflict: 'id' });
          if (error) {
            console.error(`Error al subir ${collection}:`, error);
            notifySync(`Error al subir ${collection}: ${error.message}`, "error");
          }
        }
      }

      // 2. Limpiar cambios pendientes ya que se acaba de sincronizar todo con éxito
      if (clearPendingChanges) {
        clearPendingChanges();
      }

      // 3. Traer datos frescos del servidor para estar 100% al día
      await loadAllData();
      notifySync("Sincronización completada con éxito", "success");
    } catch (err) {
      console.error('Error en syncNow:', err);
      notifySync("Error al sincronizar: " + (err.message || err), "error");
    } finally {
      setIsDataLoading(false);
    }
  }, [isOnline, pendingChanges, resolvePendingChange, loadAllData, notifySync, clearPendingChanges]);

  // Función para guardar una colección (Híbrida: Local + Supabase).
  // El guardado local es incondicional e inmediato (offline-first intencional:
  // no se bloquea la UI esperando confirmación remota). La sincronización con
  // Supabase es "mejor esfuerzo": si falla, syncCollectionToSupabase la marca
  // como pendiente (addPendingChange) y avisa con un toast inmediato, en vez
  // de fallar en silencio.
  const saveCollectionData = useCallback(async (collection, newData) => {
    const key = STORAGE_KEYS[collection];
    if (!key) return false;

    saveToStorage(key, newData);

    await syncCollectionToSupabase({
      supabase,
      collection,
      newData,
      addPendingChange,
      resolvePendingChange,
      notify: notifySync,
    });

    return true;
  }, [addPendingChange, resolvePendingChange, notifySync]);

  // Reintento real al recuperar conexión: recorre pendingChanges y reintenta
  // cada uno. También corre al montar, por si hay cambios pendientes de una
  // sesión anterior y ya hay conexión. guardedRetryPendingSync usa isRetryingRef
  // para no solapar retries: sin eso, cada éxito dentro de un retry cambia
  // pendingChanges y re-dispara este mismo efecto mientras el anterior sigue
  // en marcha, reintentando varias veces los que siguen fallando en la misma
  // ráfaga de reconexión.
  useEffect(() => {
    if (!isOnline) return;
    guardedRetryPendingSync({ isRetryingRef, supabase, pendingChanges, resolvePendingChange, notify: notifySync });
  }, [isOnline, pendingChanges, resolvePendingChange, notifySync]);

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
  const setProductos = useMemo(() => createSetter('productos'), [createSetter]);
  const setOperadores = useMemo(() => createSetter('operadores'), [createSetter]);
  const setZonas = useMemo(() => createSetter('zonas'), [createSetter]);
  const setNiveles = useMemo(() => createSetter('niveles'), [createSetter]);
  const setReglas = useMemo(() => createSetter('reglas'), [createSetter]);
  const setLiquidaciones = useMemo(() => createSetter('liquidaciones'), [createSetter]);
  const setDecomisiones = useMemo(() => createSetter('decomisiones'), [createSetter]);

  // Inicialización
  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;

    // Debug: DataProvider inicializando
    loadAllData();
  }, [loadAllData]);

  // offlineSync agrupa el estado de sincronización para quien lo necesite mostrar
  // (StatusWidgets.jsx) — una sola instancia real de useOfflineSync, la de aquí;
  // StatusWidgets ya no llama al hook por su cuenta, para no tener dos copias de
  // pendingChanges desincronizadas entre sí (una que sí se actualiza al guardar,
  // otra que se quedaría siempre en cero).
  const offlineSync = useMemo(() => ({
    isOnline,
    pendingChanges,
    lastSyncTime,
    createEmergencyBackup,
    getOfflineInfo,
  }), [isOnline, pendingChanges, lastSyncTime, createEmergencyBackup, getOfflineInfo]);

  const value = useMemo(() => ({
    data,
    dataInitialized,
    isDataLoading,
    setVentas,
    setColaboradores,
    setProductos,
    setOperadores,
    setZonas,
    setNiveles,
    setReglas,
    setLiquidaciones,
    setDecomisiones,
    refreshData: syncNow,
    offlineSync,
  }), [
    data,
    dataInitialized,
    isDataLoading,
    setVentas,
    setColaboradores,
    setProductos,
    setOperadores,
    setZonas,
    setNiveles,
    setReglas,
    setLiquidaciones,
    setDecomisiones,
    syncNow,
    offlineSync,
  ]);

  return (
    <DataContext.Provider value={value}>
      {children}
      <Toast
        message={syncToast?.message}
        type={syncToast?.type}
        onClose={() => setSyncToast(null)}
      />
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