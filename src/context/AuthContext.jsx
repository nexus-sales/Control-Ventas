import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { isEmailAuthorized, getRoleFromEmail, USER_ROLES } from '../utils/accessControl';
import AuthCtx from './AuthCtx';

const AUTH_BYPASS = import.meta.env.VITE_AUTH_BYPASS === 'true';
const AUTH_STORAGE_KEY = '__app_auth_state';
const OFFLINE_FLAG = '__app_offline_mode';

const loadStoredAuth = () => {
  // FIX: Recuperar usuario y perfil si existen en localStorage
  try {
    const rawProfiles = window.localStorage.getItem('user_profiles');
    const rawAuth = window.localStorage.getItem('auth_user');
    let user = null;
    let profile = null;
    if (rawAuth) {
      user = JSON.parse(rawAuth);
      if (rawProfiles && user?.id) {
        const profiles = JSON.parse(rawProfiles);
        profile = profiles.find(p => p.id === user.id) || null;
      }
    }
    return { user, profile };
  } catch {
    return { user: null, profile: null };
  }
};

const saveStoredAuth = () => {
  // MODIFICADO: Mantener sesión durante navegación, limpiar solo al cerrar
  if (typeof window === 'undefined') return;
  try {
    // NO limpiar sesión durante operaciones normales (importaciones, navegación)
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
  // FIX: Inicializar con usuario guardado si existe
  const initialAuthRef = useRef(loadStoredAuth());
  const initialOffline = useMemo(() => {
    if (AUTH_BYPASS) return true;
    if (typeof window === 'undefined') return false;
    if (readOfflinePreference()) return true;
    if (typeof navigator !== 'undefined' && navigator.onLine === false) return true;
    return false;
  }, []);
  
  // Inicializar con usuario/perfil si existen
  const [user, setUser] = useState(initialAuthRef.current.user);
  const [profile, setProfile] = useState(initialAuthRef.current.profile);
  const [isLogged, setIsLogged] = useState(!!initialAuthRef.current.profile);
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
    // NO hacer ninguna verificación ni logout si está importando
    if (isImporting) {
      setAccessStatus({
        hasAccess: true,
        userRole: USER_ROLES.ADMIN,
        accessMessage: null,
        isAccessLoading: false
      });
      return true;
    }
    
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
    // Buscar perfil solo en localStorage
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
      saveStoredAuth();
    };

    const applySession = async (sessionUser) => {
      if (!isMounted) return;
      
      // No interferir con la sesión durante importaciones
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
          saveStoredAuth();
          deactivateOfflineMode();
        } else {
          saveStoredAuth();
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
        saveStoredAuth();
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

    initialize();

    return () => {
      isMounted = false;
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

  useEffect(() => {
    const handleBeforeUnload = () => {
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(AUTH_STORAGE_KEY);
        console.log('[AuthProvider] Sesión limpiada - página cerrada/recargada');
      }
    };

    const handleUnload = () => {
      console.log('[AuthProvider] Navegación normal - sesión mantenida');
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('unload', handleUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('unload', handleUnload);
    };
  }, [offlineMode]);

  const login = async (email, password) => {
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
      const raw = window.localStorage.getItem('user_profiles');
      if (!raw) return { success: false, error: { message: 'No hay usuarios registrados.' } };
      const profiles = JSON.parse(raw);
      let userProfile = profiles?.find(p => p.email === email && p.password === password) || null;
      if (!userProfile) {
        return { success: false, error: { message: 'Usuario o contraseña incorrectos.' } };
      }
      
      // FULLFIX: Eliminar todos los perfiles y crear perfil admin para info@luzmatel.com
      if (userProfile.email === 'info@luzmatel.com') {
        window.localStorage.removeItem('user_profiles');
        const adminProfile = {
          id: userProfile.id,
          email: 'info@luzmatel.com',
          password: userProfile.password,
          nombre: 'Administrador',
          rol: 'admin',
          activo: true
        };
        window.localStorage.setItem('user_profiles', JSON.stringify([adminProfile]));
        userProfile = adminProfile;
      }
      
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
      
      // Guardar usuario en localStorage
      window.localStorage.setItem('auth_user', JSON.stringify(userProfile));
      saveStoredAuth();
      deactivateOfflineMode();
      // Recargar perfil actualizado desde localStorage
      const rawProfiles = window.localStorage.getItem('user_profiles');
      let updatedProfile = userProfile;
      if (rawProfiles && userProfile?.id) {
        const profiles = JSON.parse(rawProfiles);
        updatedProfile = profiles.find(p => p.id === userProfile.id) || userProfile;
      }
      setUser(updatedProfile);
      setProfile(updatedProfile);
      setIsLogged(true);
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
    window.localStorage.removeItem('auth_user');
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
  };

  const startImporting = () => {
    console.log('[AuthProvider] Iniciando importación - protegiendo sesión');
    setIsImporting(true);
  };

  const finishImporting = () => {
    console.log('[AuthProvider] Finalizando importación - liberando sesión');
    setIsImporting(false);
  };

  const registerUser = (email, password, nombre, rol = 'user') => {
    if (!email || !password || !nombre) {
      return { success: false, error: 'Todos los campos son obligatorios.' };
    }
    try {
      const raw = window.localStorage.getItem('user_profiles');
      let profiles = raw ? JSON.parse(raw) : [];
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
    accessStatus,
    hasAccess: accessStatus.hasAccess,
    userRole: accessStatus.userRole,
    accessMessage: accessStatus.accessMessage,
    isAccessLoading: accessStatus.isAccessLoading,
    isImporting,
    startImporting,
    finishImporting,
    refreshAccessControl: () => {
      if (user?.email) {
        checkAccessControl(user.email);
      }
    },
    registerUser
  };

  return (
    <AuthCtx.Provider value={value}>
      {children}
    </AuthCtx.Provider>
  );
}