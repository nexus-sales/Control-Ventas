import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { supabase } from '../lib/supabaseClient';
import { AuthCtx } from './contexts';

const AUTH_BYPASS = import.meta.env.VITE_AUTH_BYPASS === 'true';
const AUTH_STORAGE_KEY = '__app_auth_state';
const OFFLINE_FLAG = '__app_offline_mode';

const loadStoredAuth = () => {
  if (typeof window === 'undefined') return { user: null, profile: null };
  try {
    const raw = window.localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return { user: null, profile: null };
    const parsed = JSON.parse(raw);
    return {
      user: parsed?.user || null,
      profile: parsed?.profile || null,
    };
  } catch (error) {
    console.warn('[AuthProvider] No se pudo cargar el estado almacenado', error);
    return { user: null, profile: null };
  }
};

const saveStoredAuth = (user, profile) => {
  if (typeof window === 'undefined') return;
  try {
    if (!user || !profile) {
      window.localStorage.removeItem(AUTH_STORAGE_KEY);
      return;
    }
    window.localStorage.setItem(
      AUTH_STORAGE_KEY,
      JSON.stringify({
        user: { id: user.id, email: user.email },
        profile,
      })
    );
  } catch (error) {
    console.warn('[AuthProvider] No se pudo guardar el estado de autenticación', error);
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
  const initialAuthRef = useRef(loadStoredAuth());
  const initialOffline = useMemo(() => {
    if (AUTH_BYPASS) return true;
    if (typeof window === 'undefined') return false;
    if (readOfflinePreference()) return true;
    if (typeof navigator !== 'undefined' && navigator.onLine === false) return true;
    return false;
  }, []);
  const [user, setUser] = useState(initialAuthRef.current.user);
  const [profile, setProfile] = useState(initialAuthRef.current.profile);
  const [isLogged, setIsLogged] = useState(() => !!initialAuthRef.current.profile);
  const [isAuthLoading, setIsAuthLoading] = useState(() => !initialAuthRef.current.profile && !initialOffline);
  const [offlineMode, setOfflineMode] = useState(initialOffline);
  const offlineReasonRef = useRef(initialOffline ? 'initial' : null);

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

  const applyLocalAuthFallback = useCallback(() => {
    const stored = loadStoredAuth();
    setUser(stored.user);
    setProfile(stored.profile);
    setIsLogged(!!stored.profile);
    setIsAuthLoading(false);
  }, []);

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
      saveStoredAuth(bypassUser, bypassProfile);
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
        if (hasProfile) {
          saveStoredAuth(sessionUser, userProfile);
          deactivateOfflineMode();
        } else {
          saveStoredAuth(null, null);
        }
      } else {
        setProfile(null);
        setIsLogged(false);
        saveStoredAuth(null, null);
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
          console.error('[AuthProvider] Error obteniendo sesión inicial:', error);
          activateOfflineMode('session-error');
          applyLocalAuthFallback();
          return false;
        }
        const sessionUser = data?.session?.user ?? null;
        await applySession(sessionUser);
        deactivateOfflineMode();
        return true;
      } catch (error) {
        console.error('[AuthProvider] Error inicializando autenticación:', error);
        activateOfflineMode('init-exception');
        applyLocalAuthFallback();
        return false;
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
  }, [offlineMode, applyLocalAuthFallback, fetchUserProfile, activateOfflineMode, deactivateOfflineMode]);

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

  const login = async (email, password) => {
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
        if (userProfile) {
          setUser(data.user);
          setProfile(userProfile);
          setIsLogged(true);
          saveStoredAuth(data.user, userProfile);
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
    saveStoredAuth(null, null);

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
  };

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}