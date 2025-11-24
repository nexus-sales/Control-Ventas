import { useState, useEffect, useCallback } from 'react';
import { useData } from '../context/AppContexts';
import { 
  isEmailAuthorized, 
  getRoleFromEmail, 
  getAccessDeniedMessage,
  checkUserPermission,
  USER_ROLES 
} from '../utils/accessControl';

/**
 * Hook consolidado para gestión completa de autenticación y control de acceso
 * Integra: useAccessControl, useAppInitialization, gestión de sesión
 */
export function useAuthGestion(user = null) {
  
  // =================== CONTEXTO Y DATOS ===================
  
  // dataInitialized e isDataLoading se usan para el estado
  const { dataInitialized, isDataLoading } = useData();
  
  // =================== ESTADO CONSOLIDADO ===================
  
  const [authState, setAuthState] = useState({
    // 🔐 CONTROL DE ACCESO
    isLoading: true,
    hasAccess: false,
    userRole: null,
    permissions: [],
    accessMessage: null,
    
    // 📊 INICIALIZACIÓN DE DATOS
    dataInitialized: false,
    isDataLoading: false,
    
    // 🔄 GESTIÓN DE SESIÓN
    sessionValid: false,
    sessionStartTime: null,
    lastActivity: Date.now(),
    isImporting: false,
    
    // ⚙️ CONFIGURACIÓN
    sessionTimeout: 24 * 60 * 60 * 1000, // 24 horas por defecto
    activityCheckInterval: 60 * 1000, // Verificar cada minuto
  });

  // =================== 🔐 GESTIÓN DE ACCESO ===================
  
  // Verificar acceso del usuario
  const checkUserAccess = useCallback(async (userToCheck) => {
    if (!userToCheck) {
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        hasAccess: false,
        userRole: null,
        permissions: [],
        sessionValid: false,
        accessMessage: {
          type: 'error',
          title: 'No Autenticado',
          message: 'Debes iniciar sesión para acceder a la aplicación.'
        }
      }));
      return false;
    }

    try {
      const email = userToCheck.email;
      const isAuthorized = isEmailAuthorized(email);
      const userRole = getRoleFromEmail(email);
      
      if (!isAuthorized || userRole === USER_ROLES.BLOCKED) {
        const accessMessage = getAccessDeniedMessage(email);
        setAuthState(prev => ({
          ...prev,
          isLoading: false,
          hasAccess: false,
          userRole,
          permissions: [],
          sessionValid: false,
          accessMessage
        }));
        return false;
      }

      // Usuario pendiente de aprobación
      if (userRole === USER_ROLES.PENDING) {
        setAuthState(prev => ({
          ...prev,
          isLoading: false,
          hasAccess: false,
          userRole,
          permissions: [],
          sessionValid: false,
          accessMessage: {
            type: 'warning',
            title: 'Acceso Pendiente',
            message: 'Tu solicitud de acceso está siendo revisada. Te contactaremos pronto.'
          }
        }));
        return false;
      }

      // Usuario autorizado
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        hasAccess: true,
        userRole,
        permissions: [], // Se pueden agregar permisos específicos aquí
        sessionValid: true,
        sessionStartTime: Date.now(),
        lastActivity: Date.now(),
        accessMessage: null
      }));

      return true;

    } catch {
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        hasAccess: false,
        userRole: null,
        permissions: [],
        sessionValid: false,
        accessMessage: {
          type: 'error',
          title: 'Error del Sistema',
          message: 'Ocurrió un error al verificar el acceso. Inténtalo de nuevo.'
        }
      }));
      return false;
    }
  }, []);

  // =================== 📊 GESTIÓN DE INICIALIZACIÓN ===================
  
  // Verificar estado de inicialización de datos
  const checkDataInitialization = useCallback(() => {
    // dataInitialized y isDataLoading ya vienen del hook
    
    setAuthState(prev => ({
      ...prev,
      dataInitialized,
      isDataLoading
    }));
    
    return dataInitialized;
  }, [dataInitialized, isDataLoading]);

  // =================== 🔄 GESTIÓN DE SESIÓN ===================
  
  // Actualizar actividad del usuario
  const updateActivity = useCallback(() => {
    setAuthState(prev => ({
      ...prev,
      lastActivity: Date.now()
    }));
  }, []);

  // 🎯 MEJORA: Protección durante importaciones
  const startImporting = useCallback(() => {
    setAuthState(prev => ({
      ...prev,
      isImporting: true,
      lastActivity: Date.now() // Mantener sesión activa durante importación
    }));
  }, []);

  const finishImporting = useCallback(() => {
    setAuthState(prev => ({
      ...prev,
      isImporting: false,
      lastActivity: Date.now()
    }));
  }, []);

  // Verificar validez de la sesión
  const checkSessionValidity = useCallback(() => {
    const now = Date.now();
    const { sessionStartTime, lastActivity, sessionTimeout, isImporting } = authState;
    
    if (!sessionStartTime) return false;
    
    // 🎯 MEJORA: No cerrar sesión durante importaciones
    if (isImporting) {
      return true;
    }
    
    const sessionDuration = now - sessionStartTime;
    const inactivityTime = now - lastActivity;
    
    // Sesión expirada por tiempo total o inactividad
    if (sessionDuration > sessionTimeout || inactivityTime > sessionTimeout) {
      setAuthState(prev => ({
        ...prev,
        sessionValid: false,
        hasAccess: false,
        accessMessage: {
          type: 'warning',
          title: 'Sesión Expirada',
          message: 'Tu sesión ha expirado por inactividad. Por favor, inicia sesión nuevamente.'
        }
      }));
      return false;
    }
    
    return true;
  }, [authState]);

  // Logout manual
  const logout = useCallback(() => {
    setAuthState(prev => ({
      ...prev,
      hasAccess: false,
      sessionValid: false,
      userRole: null,
      permissions: [],
      sessionStartTime: null,
      lastActivity: Date.now(),
      isImporting: false,
      accessMessage: {
        type: 'info',
        title: 'Sesión Cerrada',
        message: 'Has cerrado sesión correctamente.'
      }
    }));
  }, []);

  // =================== 🔍 FUNCIONES DE VERIFICACIÓN ===================
  
  // Verificar permisos específicos
  const hasPermission = useCallback((permission) => {
    if (!authState.hasAccess || !user?.email) return false;
    return checkUserPermission(user.email, permission);
  }, [authState.hasAccess, user?.email]);

  // Verificar si es administrador
  const isAdmin = useCallback(() => {
    return authState.userRole === USER_ROLES.ADMIN;
  }, [authState.userRole]);

  // Verificar acceso a ruta específica
  const canAccessRoute = useCallback((routePermission) => {
    if (!routePermission) return authState.hasAccess;
    return hasPermission(routePermission);
  }, [authState.hasAccess, hasPermission]);

  // Verificar si el usuario puede realizar acciones administrativas
  const canPerformAdminActions = useCallback(() => {
    return isAdmin() && authState.sessionValid;
  }, [isAdmin, authState.sessionValid]);

  // =================== 🎯 MEJORAS: FUNCIONES UTILITARIAS ===================
  
  // Refrescar verificación de acceso
  const refreshAccess = useCallback(() => {
    if (user) {
      setAuthState(prev => ({ ...prev, isLoading: true }));
      checkUserAccess(user);
    }
  }, [user, checkUserAccess]);

  // Extender sesión (para acciones largas como importaciones)
  const extendSession = useCallback((additionalTime = 60 * 60 * 1000) => { // 1 hora extra
    setAuthState(prev => ({
      ...prev,
      sessionTimeout: prev.sessionTimeout + additionalTime,
      lastActivity: Date.now()
    }));
  }, []);

  // Configurar timeout personalizado
  const setSessionTimeout = useCallback((timeoutMs) => {
    setAuthState(prev => ({
      ...prev,
      sessionTimeout: timeoutMs
    }));
  }, []);

  // =================== ⏰ EFECTOS Y LISTENERS ===================
  
  // Verificar acceso inicial
  useEffect(() => {
    checkUserAccess(user);
  }, [user, checkUserAccess]);

  // Verificar inicialización de datos
  useEffect(() => {
    checkDataInitialization();
  }, [checkDataInitialization]);

  // Timer para verificación periódica de sesión
  useEffect(() => {
    if (!authState.hasAccess || !authState.sessionValid) return;

    const interval = setInterval(() => {
      checkSessionValidity();
    }, authState.activityCheckInterval);

    return () => clearInterval(interval);
  }, [authState.hasAccess, authState.sessionValid, authState.activityCheckInterval, checkSessionValidity]);

  // 🎯 MEJORA: Listeners para detectar actividad del usuario
  useEffect(() => {
    if (!authState.hasAccess) return;

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    const handleActivity = () => {
      updateActivity();
    };

    // Throttle para evitar demasiadas actualizaciones
    let lastUpdate = 0;
    const throttledHandler = () => {
      const now = Date.now();
      if (now - lastUpdate > 30000) { // Actualizar máximo cada 30 segundos
        lastUpdate = now;
        handleActivity();
      }
    };

    events.forEach(event => {
      document.addEventListener(event, throttledHandler, { passive: true });
    });

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, throttledHandler);
      });
    };
  }, [authState.hasAccess, updateActivity]);

  // =================== 📊 ESTADÍSTICAS Y ESTADO ===================
  
  const authStats = {
    // Estado básico
    isAuthenticated: authState.hasAccess && authState.sessionValid,
    isInitialized: authState.dataInitialized && !authState.isLoading,
    isReady: authState.hasAccess && authState.sessionValid && authState.dataInitialized,
    
    // Información de sesión
    sessionInfo: authState.sessionStartTime ? {
      startTime: new Date(authState.sessionStartTime),
      duration: Date.now() - authState.sessionStartTime,
      lastActivity: new Date(authState.lastActivity),
      inactivityTime: Date.now() - authState.lastActivity,
      isProtected: authState.isImporting,
    } : null,
    
    // Estados de carga
    loading: {
      auth: authState.isLoading,
      data: authState.isDataLoading,
      any: authState.isLoading || authState.isDataLoading,
    },
  };

  // =================== 📤 RETURN CONSOLIDADO ===================
  
  return {
    // 📊 ESTADO PRINCIPAL
    ...authState,
    authStats,
    
    // 🔍 VERIFICACIONES DE ACCESO
    hasPermission,
    isAdmin,
    canAccessRoute,
    canPerformAdminActions,
    
    // 🔄 GESTIÓN DE SESIÓN
    startImporting,
    finishImporting,
    updateActivity,
    extendSession,
    logout,
    refreshAccess,
    setSessionTimeout,
    
    // 📊 INICIALIZACIÓN
    checkDataInitialization,
    dataInitialized: authState.dataInitialized,
    
    // 🎯 HELPERS ÚTILES
    isReady: authStats.isReady,
    isAuthenticated: authStats.isAuthenticated,
    isInitialized: authStats.isInitialized,
  };
}

export default useAuthGestion;