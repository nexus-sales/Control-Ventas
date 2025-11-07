import { useState, useEffect } from 'react';
import { 
  isEmailAuthorized, 
  getRoleFromEmail, 
  getAccessDeniedMessage,
  checkUserPermission,
  USER_ROLES 
} from '../utils/accessControl';

export function useAccessControl(user) {
  const [accessStatus, setAccessStatus] = useState({
    isLoading: true,
    hasAccess: false,
    userRole: null,
    permissions: [],
    accessMessage: null
  });

  useEffect(() => {
    if (!user) {
      setAccessStatus({
        isLoading: false,
        hasAccess: false,
        userRole: null,
        permissions: [],
        accessMessage: {
          type: 'error',
          title: 'No Autenticado',
          message: 'Debes iniciar sesión para acceder a la aplicación.'
        }
      });
      return;
    }

    const checkAccess = async () => {
      try {
        const email = user.email;
        const isAuthorized = isEmailAuthorized(email);
        const userRole = getRoleFromEmail(email);
        
        if (!isAuthorized || userRole === USER_ROLES.BLOCKED) {
          const accessMessage = getAccessDeniedMessage(email);
          setAccessStatus({
            isLoading: false,
            hasAccess: false,
            userRole,
            permissions: [],
            accessMessage
          });
          return;
        }

        // Si el usuario está pendiente de aprobación
        if (userRole === USER_ROLES.PENDING) {
          setAccessStatus({
            isLoading: false,
            hasAccess: false,
            userRole,
            permissions: [],
            accessMessage: {
              type: 'warning',
              title: 'Acceso Pendiente',
              message: 'Tu solicitud de acceso está siendo revisada. Te contactaremos pronto.'
            }
          });
          return;
        }

        // Usuario autorizado
        setAccessStatus({
          isLoading: false,
          hasAccess: true,
          userRole,
          permissions: [], // Se pueden agregar permisos específicos aquí
          accessMessage: null
        });

      } catch (error) {
        console.error('Error checking access:', error);
        setAccessStatus({
          isLoading: false,
          hasAccess: false,
          userRole: null,
          permissions: [],
          accessMessage: {
            type: 'error',
            title: 'Error del Sistema',
            message: 'Ocurrió un error al verificar el acceso. Inténtalo de nuevo.'
          }
        });
      }
    };

    checkAccess();
  }, [user]);

  // Función para verificar permisos específicos
  const hasPermission = (permission) => {
    if (!accessStatus.hasAccess || !user?.email) return false;
    return checkUserPermission(user.email, permission);
  };

  // Función para verificar si es admin
  const isAdmin = () => {
    return accessStatus.userRole === USER_ROLES.ADMIN;
  };

  // Función para verificar si puede acceder a una ruta
  const canAccessRoute = (routePermission) => {
    if (!routePermission) return accessStatus.hasAccess;
    return hasPermission(routePermission);
  };

  return {
    ...accessStatus,
    hasPermission,
    isAdmin,
    canAccessRoute,
    refreshAccess: () => {
      if (user) {
        setAccessStatus(prev => ({ ...prev, isLoading: true }));
      }
    }
  };
}

export default useAccessControl;