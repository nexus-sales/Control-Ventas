import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { supabase } from '../lib/supabaseClient';
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
  // MODIFICADO: No guardar sesión para forzar login en cada acceso
  if (typeof window === 'undefined') return;
  try {
    // Siempre limpiar cualquier sesión almacenada
    window.localStorage.removeItem(AUTH_STORAGE_KEY);
    console.log('[AuthProvider] Sesión limpiada - login obligatorio en próximo acceso');
  } catch (error) {
    console.warn('[AuthProvider] No se pudo limpiar el estado de autenticación', error);
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

    // En modo bypass, permitir acceso total
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
      const isAuthorized = isEmailAuthorized(userEmail);
      const userRole = getRoleFromEmail(userEmail);
      
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

      // Usuario autorizado
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
  }, []);

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
    try {
      console.log('[AuthProvider] Buscando perfil para userId:', userId);
      const { data: userProfile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
      if (error) {
        console.error('[AuthProvider] Error obteniendo perfil:', error);
        return null;
      }
      console.log('[AuthProvider] Perfil encontrado:', userProfile);
      return userProfile;
    } catch (error) {
      console.error('[AuthProvider] Excepción obteniendo perfil:', error);
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
        const { data, error } = await supabase.auth.getSession();
        if (error) {
          console.warn('[AuthProvider] Error obteniendo sesión inicial (no crítico):', error);
          // NO activar modo offline por errores de sesión - permitir intentos de login
          // activateOfflineMode('session-error');
          // applyLocalAuthFallback();
          setIsAuthLoading(false);
          return true; // Permitir continuar para intentos de login
        }
        const sessionUser = data?.session?.user ?? null;
        await applySession(sessionUser);
        deactivateOfflineMode();
        return true;
      } catch (error) {
        console.warn('[AuthProvider] Error inicializando autenticación (no crítico):', error);
        // NO activar modo offline automáticamente - solo en casos extremos
        // activateOfflineMode('init-exception');
        // applyLocalAuthFallback();
        setIsAuthLoading(false);
        return true; // Permitir continuar para intentos de login
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

      const { data: listener } = supabase.auth.onAuthStateChange(async (_event, session) => {
        await applySession(session?.user ?? null);
        if (isMounted) {
          setIsAuthLoading(false);
        }
      });
      unsubscribe = () => listener.subscription.unsubscribe();
    };

    start();

    return () => {
      isMounted = false;
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [offlineMode, applyLocalAuthFallback, fetchUserProfile, activateOfflineMode, deactivateOfflineMode, checkAccessControl]);

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

    const checkConnectivity = async () => {
      if (navigator.onLine) {
        try {
          // Probar conexión real con Supabase
          const { data, error } = await supabase.auth.getSession();
          if (!error) {
            console.log('[AuthProvider] Conectividad restaurada - desactivando modo offline');
            deactivateOfflineMode();
          }
        } catch (error) {
          console.log('[AuthProvider] Aún sin conectividad real con Supabase');
        }
      }
    };

    // Verificar cada 30 segundos cuando estamos offline
    const interval = setInterval(checkConnectivity, 30000);
    
    return () => clearInterval(interval);
  }, [offlineMode, deactivateOfflineMode]);

  // NUEVO: Limpiar sesión al cerrar/recargar la página
  useEffect(() => {
    const handleBeforeUnload = () => {
      // Limpiar cualquier sesión almacenada
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(AUTH_STORAGE_KEY);
        // También cerrar sesión en Supabase si no estamos en modo bypass
        if (!AUTH_BYPASS && !offlineMode) {
          supabase.auth.signOut().catch(console.error);
        }
      }
    };

    const handleUnload = () => {
      // Limpiar sesión al cerrar la ventana
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(AUTH_STORAGE_KEY);
      }
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
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) {
        if (typeof navigator !== 'undefined' && navigator.onLine === false) {
          activateOfflineMode('login-offline');
        }
        return { success: false, error };
      }

      if (data.user) {
        const userProfile = await fetchUserProfile(data.user.id);
        
        // Verificar control de acceso antes de establecer la sesión
        const hasAccess = checkAccessControl(data.user.email);
        
        if (!hasAccess) {
          // Si no tiene acceso, cerrar la sesión de Supabase
          await supabase.auth.signOut();
          return { 
            success: false, 
            error: { 
              message: 'No tienes permisos para acceder a esta aplicación.',
              accessDenied: true,
              userEmail: data.user.email
            } 
          };
        }
        
        if (userProfile) {
          setUser(data.user);
          setProfile(userProfile);
          setIsLogged(true);
          saveStoredAuth(); // Limpiar cualquier sesión almacenada
          deactivateOfflineMode();
          return { success: true };
        } else {
          await supabase.auth.signOut();
          return { success: false, error: { message: 'No se encontró el perfil del usuario.' } };
        }
      }
      return { success: false, error: { message: 'Usuario o contraseña incorrectos.' } };
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
    saveStoredAuth(); // Limpiar cualquier sesión almacenada

    if (AUTH_BYPASS) {
      return;
    }

    if (offlineMode) {
      activateOfflineMode('logout-offline');
      return;
    }

    await supabase.auth.signOut();
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
    refreshAccessControl: () => {
      if (user?.email) {
        checkAccessControl(user.email);
      }
    }
  };

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}