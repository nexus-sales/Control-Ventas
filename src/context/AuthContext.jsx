import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
// ...existing code...
import { AuthCtx } from './contexts';
import { isEmailAuthorized, getRoleFromEmail, USER_ROLES } from '../utils/accessControl';

const AUTH_BYPASS = import.meta.env.VITE_AUTH_BYPASS === 'true';
const AUTH_STORAGE_KEY = '__app_auth_state';
const OFFLINE_FLAG = '__app_offline_mode';

const loadStoredAuth = () => {
  // MODIFICADO: Siempre retornar null para forzar login en cada acceso
  // if (typeof window === 'undefined') return { user: null, profile: null };
  // try {
  //   const raw = window.localStorage.getItem(AUTH_STORAGE_KEY);
  //   if (!raw) return { user: null, profile: null };
  //   const parsed = JSON.parse(raw);
  //   return {
  //     user: parsed?.user || null,
  //     profile: parsed?.profile || null,
  //   };
  // } catch (error) {
  //   console.warn('[AuthProvider] No se pudo cargar el estado almacenado', error);
  //   return { user: null, profile: null };
  // }
  
  // Siempre requerir login fresco
  return { user: null, profile: null };
};

const saveStoredAuth = () => {
  // MODIFICADO: Mantener sesión durante navegación, limpiar solo al cerrar
  if (typeof window === 'undefined') return;
  try {
    // NO limpiar sesión durante operaciones normales (importaciones, navegación)
    // Solo se limpiará en beforeunload
    console.log('[AuthProvider] Sesión mantenida para operaciones normales');
  } catch (error) {
    console.warn('[AuthProvider] Error en saveStoredAuth', error);
  }
};

const readOfflinePreference = () => {
  if (typeof window === 'undefined') return false;
  try {
    return window.localStorage.getItem(OFFLINE_FLAG) === 'true';
  } catch (error) {
    console.warn('[AuthProvider] No se pudo leer el flag de modo offline', error);
    return false;
  }
};

const writeOfflinePreference = (value) => {
  if (typeof window === 'undefined') return;
  try {
    if (value) {
      window.localStorage.setItem(OFFLINE_FLAG, 'true');
    } else {
      window.localStorage.removeItem(OFFLINE_FLAG);
    }
  } catch (error) {
    console.warn('[AuthProvider] No se pudo persistir el flag de modo offline', error);
  }
};

export function AuthProvider({ children }) {
  // MODIFICADO: Siempre comenzar sin sesión para forzar login
  const initialAuthRef = useRef({ user: null, profile: null });
  const initialOffline = useMemo(() => {
    if (AUTH_BYPASS) return true;
    if (typeof window === 'undefined') return false;
    if (readOfflinePreference()) return true;
    if (typeof navigator !== 'undefined' && navigator.onLine === false) return true;
    return false;
  }, []);
  
  // Siempre comenzar sin autenticación
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [isLogged, setIsLogged] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(!initialOffline);
  const [offlineMode, setOfflineMode] = useState(initialOffline);
  const offlineReasonRef = useRef(initialOffline ? 'initial' : null);
  
  // Estados de control de acceso
  const [accessStatus, setAccessStatus] = useState({
    hasAccess: false,
    userRole: null,
    accessMessage: null,
    isAccessLoading: true
  });

  // NUEVO: Flag para prevenir logout durante importaciones
  const [isImporting, setIsImporting] = useState(false);

  const activateOfflineMode = useCallback((reason = 'unknown') => {
    if (AUTH_BYPASS) return;
    offlineReasonRef.current = reason;
    setOfflineMode(true);
    writeOfflinePreference(true);
    console.warn(`[AuthProvider] Modo offline activado (${reason})`);
  }, []);

  const deactivateOfflineMode = useCallback(() => {
    if (AUTH_BYPASS) return;
    if (!offlineMode) return;
    offlineReasonRef.current = null;
    setOfflineMode(false);
    writeOfflinePreference(false);
    console.log('[AuthProvider] Modo offline desactivado');
  }, [offlineMode]);

  // Función para verificar control de acceso
  const checkAccessControl = useCallback((userEmail) => {
    // 🚫 NO hacer ninguna verificación ni logout si está importando
    if (isImporting) {
      setAccessStatus({
        hasAccess: true,
        userRole: USER_ROLES.ADMIN,
        accessMessage: null,
        isAccessLoading: false
      });
      return true;
    }
    // ...existing code original...
    if (!userEmail) {
      setAccessStatus({
        hasAccess: false,
        userRole: null,
        accessMessage: {
          type: 'error',
          title: 'No Autenticado',
          message: 'Debes iniciar sesión para acceder a la aplicación.'
        },
        isAccessLoading: false
      });
      return false;
    }
    if (AUTH_BYPASS) {
      setAccessStatus({
        hasAccess: true,
        userRole: USER_ROLES.ADMIN,
        accessMessage: null,
        isAccessLoading: false
      });
      return true;
    }
    try {
      let userRole = null;
      let isAuthorized = false;
      const raw = window.localStorage.getItem('user_profiles');
      if (raw) {
        const profiles = JSON.parse(raw);
        const userProfile = profiles?.find(p => p.email === userEmail);
        if (userProfile && userProfile.rol) {
          userRole = userProfile.rol;
          isAuthorized = true;
        }
      }
      if (!userRole) {
        isAuthorized = isEmailAuthorized(userEmail);
        userRole = getRoleFromEmail(userEmail);
      }
      if (!isAuthorized || userRole === USER_ROLES.BLOCKED) {
        setAccessStatus({
          hasAccess: false,
          userRole,
          accessMessage: {
            type: 'error',
            title: 'Acceso Denegado',
            message: 'No tienes permisos para acceder a esta aplicación. Si crees que esto es un error, solicita acceso al administrador.'
          },
          isAccessLoading: false
        });
        return false;
      }
      if (userRole === USER_ROLES.PENDING) {
        setAccessStatus({
          hasAccess: false,
          userRole,
          accessMessage: {
            type: 'warning',
            title: 'Acceso Pendiente',
            message: 'Tu solicitud de acceso está siendo revisada. Te contactaremos pronto.'
          },
          isAccessLoading: false
        });
        return false;
      }
      setAccessStatus({
        hasAccess: true,
        userRole,
        accessMessage: null,
        isAccessLoading: false
      });
      return true;
    } catch (error) {
      console.error('[AuthProvider] Error verificando control de acceso:', error);
      setAccessStatus({
        hasAccess: false,
        userRole: null,
        accessMessage: {
          type: 'error',
          title: 'Error del Sistema',
          message: 'Ocurrió un error al verificar el acceso. Inténtalo de nuevo.'
        },
        isAccessLoading: false
      });
      return false;
    }
  }, [isImporting]);

  const applyLocalAuthFallback = useCallback(() => {
    const stored = loadStoredAuth();
    setUser(stored.user);
    setProfile(stored.profile);
    setIsLogged(!!stored.profile);
    setIsAuthLoading(false);
    
    // Verificar control de acceso
    checkAccessControl(stored.user?.email);
  }, [checkAccessControl]);

  const fetchUserProfile = useCallback(async (userId) => {
    // MIGRADO: Buscar perfil solo en localStorage
    try {
      const raw = window.localStorage.getItem('user_profiles');
      if (!raw) return null;
      const profiles = JSON.parse(raw);
      const userProfile = profiles?.find(p => p.id === userId) || null;
      return userProfile;
    } catch (error) {
      console.error('[AuthProvider] Error obteniendo perfil local:', error);
      return null;
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    let unsubscribe = null;

    const applyBypass = () => {
      const bypassUser = {
        id: '14a89654-184d-41c2-96ba-56d6cb0c5de6',
        email: 'info@luzmatel.com',
      };
      const bypassProfile = {
        id: '14a89654-184d-41c2-96ba-56d6cb0c5de6',
        email: 'info@luzmatel.com',
        nombre: 'Admin Luzmatel',
        rol: 'admin',
        activo: true,
      };
      setUser(bypassUser);
      setProfile(bypassProfile);
      setIsLogged(true);
      setIsAuthLoading(false);
      setOfflineMode(true);
      writeOfflinePreference(true);
      saveStoredAuth(); // Limpiar cualquier sesión almacenada
    };

    const applySession = async (sessionUser) => {
      if (!isMounted) return;
      
      // NUEVO: No interferir con la sesión durante importaciones
      if (isImporting) {
        console.log('[AuthProvider] Importación en progreso - manteniendo sesión actual');
        return;
      }
      
      setUser(sessionUser);
      if (sessionUser) {
        const userProfile = await fetchUserProfile(sessionUser.id);
        if (!isMounted) return;
        setProfile(userProfile);
        const hasProfile = !!userProfile;
        setIsLogged(hasProfile);
        
        // Verificar control de acceso
        checkAccessControl(sessionUser.email);
        
        if (hasProfile) {
          saveStoredAuth(); // Limpiar cualquier sesión almacenada
          deactivateOfflineMode();
        } else {
          saveStoredAuth(); // Limpiar cualquier sesión almacenada
        }
      } else {
        setProfile(null);
        setIsLogged(false);
        setAccessStatus({
          hasAccess: false,
          userRole: null,
          accessMessage: null,
          isAccessLoading: false
        });
        saveStoredAuth(); // Limpiar cualquier sesión almacenada
      }
    };

    const initialize = async () => {
      if (AUTH_BYPASS) {
        applyBypass();
        return false;
      }

      if (offlineMode) {
        applyLocalAuthFallback();
        return false;
      }

      if (typeof navigator !== 'undefined' && navigator.onLine === false) {
        activateOfflineMode('navigator-offline');
        applyLocalAuthFallback();
        return false;
      }

      try {
        if (!initialAuthRef.current.profile) {
          setIsAuthLoading(true);
        }
        // MIGRADO: No hay sesión remota, solo local
        const stored = loadStoredAuth();
        await applySession(stored.user);
        deactivateOfflineMode();
        return true;
      } catch (error) {
        console.warn('[AuthProvider] Error inicializando autenticación local:', error);
        setIsAuthLoading(false);
        return true;
      } finally {
        if (isMounted) {
          setIsAuthLoading(false);
        }
      }
    };

    const start = async () => {
      const remoteReady = await initialize();
      if (!isMounted || AUTH_BYPASS || !remoteReady) {
        return;
      }
      // MIGRADO: No hay listener remoto, solo local
      // No se requiere suscripción a cambios de sesión
    };

    start();

    return () => {
      isMounted = false;
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [offlineMode, applyLocalAuthFallback, fetchUserProfile, activateOfflineMode, deactivateOfflineMode, checkAccessControl, isImporting]);

  useEffect(() => {
    if (AUTH_BYPASS) return;
    const handleOffline = () => activateOfflineMode('navigator-offline-event');
    const handleOnline = () => deactivateOfflineMode();

    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);

    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, [activateOfflineMode, deactivateOfflineMode]);

  // NUEVO: Verificación periódica de conectividad en modo offline
  useEffect(() => {
    if (!offlineMode || AUTH_BYPASS) return;
    // MIGRADO: No hay verificación remota, solo local
    // No se requiere verificación periódica de conectividad
    return undefined;
  }, [offlineMode, deactivateOfflineMode]);

  // NUEVO: Limpiar sesión SOLO al cerrar/recargar la página (NO en navegación normal)
  useEffect(() => {
    const handleBeforeUnload = () => {
      // SOLO limpiar sesión cuando se cierre/recargue la página
      // NO durante navegación normal o importaciones
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(AUTH_STORAGE_KEY);
        console.log('[AuthProvider] Sesión limpiada - página cerrada/recargada');
      }
    };

    // REMOVER handleUnload - no limpiar sesión durante navegación normal
    const handleUnload = () => {
      // NO hacer nada aquí para permitir navegación normal
      console.log('[AuthProvider] Navegación normal - sesión mantenida');
    };

    // Agregar listeners para limpiar sesión al salir
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('unload', handleUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('unload', handleUnload);
    };
  }, [offlineMode]);

  const login = async (email, password) => {
    // Verificar y limpiar modo offline si hay conectividad
    if (offlineMode && navigator.onLine) {
      console.log('[AuthProvider] Detectada conectividad - desactivando modo offline');
      deactivateOfflineMode();
    }
    
    if (offlineMode && !AUTH_BYPASS) {
      return {
        success: false,
        error: { message: 'Actualmente estás en modo offline. Conéctate para iniciar sesión.' }
      };
    }
    
    try {
      // MIGRADO: Validar usuario y contraseña solo en localStorage
      const raw = window.localStorage.getItem('user_profiles');
      if (!raw) return { success: false, error: { message: 'No hay usuarios registrados.' } };
      const profiles = JSON.parse(raw);
      let userProfile = profiles?.find(p => p.email === email && p.password === password) || null;
      if (!userProfile) {
        return { success: false, error: { message: 'Usuario o contraseña incorrectos.' } };
      }
      // FORZAR rol admin si corresponde
      if (userProfile.email === 'info@ucoipcanarias.com') {
        userProfile.rol = 'admin';
        userProfile.activo = true;
        const idx = profiles.findIndex(u => u.email === 'info@ucoipcanarias.com');
        if (idx !== -1) {
          profiles[idx] = userProfile;
          window.localStorage.setItem('user_profiles', JSON.stringify(profiles));
        }
      }
      // Verificar control de acceso antes de establecer la sesión
      const hasAccess = checkAccessControl(userProfile.email);
      if (!hasAccess) {
        return {
          success: false,
          error: {
            message: 'No tienes permisos para acceder a esta aplicación.',
            accessDenied: true,
            userEmail: userProfile.email
          }
        };
      }
      setUser(userProfile);
      setProfile(userProfile);
      setIsLogged(true);
      saveStoredAuth();
      deactivateOfflineMode();
      // Si es admin, puedes aquí disparar una función de refresco de datos si lo necesitas
      // Ejemplo: if (userProfile.rol === 'admin' && refreshData) refreshData();
      return { success: true };
    } catch (error) {
      console.error('Unexpected error during login:', error);
      if (typeof navigator !== 'undefined' && navigator.onLine === false) {
        activateOfflineMode('login-exception');
      }
      return { success: false, error };
    }
  };

  const logout = async () => {
    setUser(null);
    setProfile(null);
    setIsLogged(false);
    saveStoredAuth();
    if (AUTH_BYPASS) {
      return;
    }
    if (offlineMode) {
      activateOfflineMode('logout-offline');
      return;
    }
    if (isImporting) {
      console.warn('[AuthProvider] Logout bloqueado - importación en progreso');
      return;
    }
    // MIGRADO: No hay sesión remota, solo local
  };

  // NUEVO: Funciones para controlar el estado de importación
  const startImporting = () => {
    console.log('[AuthProvider] Iniciando importación - protegiendo sesión');
    setIsImporting(true);
  };

  const finishImporting = () => {
    console.log('[AuthProvider] Finalizando importación - liberando sesión');
    setIsImporting(false);
  };

  // NUEVO: Función para registrar usuario local
  const registerUser = (email, password, nombre, rol = 'user') => {
    if (!email || !password || !nombre) {
      return { success: false, error: 'Todos los campos son obligatorios.' };
    }
    try {
      const raw = window.localStorage.getItem('user_profiles');
      let profiles = raw ? JSON.parse(raw) : [];
      // Si el usuario existe, actualizar rol y datos
      const idx = profiles.findIndex(u => u.email === email);
      let userRol = email === 'info@ucoipcanarias.com' ? 'admin' : rol;
      if (idx !== -1) {
        profiles[idx] = {
          ...profiles[idx],
          password,
          nombre,
          rol: userRol,
          activo: true
        };
        window.localStorage.setItem('user_profiles', JSON.stringify(profiles));
        return { success: true, user: profiles[idx] };
      }
      // Si no existe, crear nuevo usuario
      const newUser = {
        id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(),
        email,
        password,
        nombre,
        rol: userRol,
        activo: true
      };
      profiles.push(newUser);
      window.localStorage.setItem('user_profiles', JSON.stringify(profiles));
      return { success: true, user: newUser };
    } catch {
      return { success: false, error: 'Error al registrar usuario.' };
    }
  };

  const value = {
    user,
    profile,
    isLogged,
    isAuthLoading,
    login,
    logout,
    setUser: () => {},
    offlineMode,
    offlineReason: offlineReasonRef.current,
    activateOfflineMode,
    deactivateOfflineMode,
    // Control de acceso
    accessStatus,
    hasAccess: accessStatus.hasAccess,
    userRole: accessStatus.userRole,
    accessMessage: accessStatus.accessMessage,
    isAccessLoading: accessStatus.isAccessLoading,
    // NUEVO: Control de importación
    isImporting,
    startImporting,
    finishImporting,
    refreshAccessControl: () => {
      if (user?.email) {
        checkAccessControl(user.email);
      }
    },
    registerUser // <-- NUEVO: expone la función de registro
  };

  return (
    <AuthCtx.Provider value={value}>
      {children}
    </AuthCtx.Provider>
  );
}