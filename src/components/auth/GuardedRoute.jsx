import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AppContexts';
import Loading from '../common/Loading';
import AccessDeniedScreen from './AccessDeniedScreen';
import { checkUserPermission } from '../../utils/accessControl';

export function GuardedRoute({ children, roles, permission }) {
  const {
    isAuthenticated,
    loading: isAuthLoading,
    profile,
    user
  } = useAuth();
  const location = useLocation();

  // Mostrar loading mientras se verifica autenticación
  if (isAuthLoading) {
    return <Loading message="Verificando autenticación..." />;
  }

  // Si no está logueado, redirigir al login
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Validaciones de activación y acceso a la App CV
  if (profile) {
    if (!profile.activo) {
      return (
        <AccessDeniedScreen
          email={user?.email}
          accessInfo={{
            type: 'warning',
            title: 'Acceso en Espera',
            message: 'Tu cuenta está registrada pero aún no ha sido activada por un administrador. Por favor, contacta con gerencia.'
          }}
          onRetry={() => window.location.reload()}
        />
      );
    }

    if (!profile.app_access?.includes('CV')) {
      return (
        <AccessDeniedScreen
          email={user?.email}
          accessInfo={{
            type: 'error',
            title: 'Acceso Denegado',
            message: 'No tienes permisos para acceder al módulo de Control de Ventas (CV).'
          }}
          onRetry={() => window.location.reload()}
        />
      );
    }
  }

  // Verificar roles específicos de la ruta (compatibilidad con el sistema anterior)
  if (roles && roles.length > 0 && !roles.includes(profile?.rol)) {
    return (
      <AccessDeniedScreen
        email={user?.email}
        accessInfo={{
          type: 'warning',
          title: 'Permisos Insuficientes',
          message: `Esta sección requiere permisos de: ${roles.join(', ')}. Tu rol actual es: ${profile?.rol || 'no definido'}.`
        }}
        onRetry={() => window.location.reload()}
      />
    );
  }

  // Verificar permisos específicos (nueva funcionalidad)
  if (permission && !checkUserPermission(user?.email, permission)) {
    return (
      <AccessDeniedScreen
        email={user?.email}
        accessInfo={{
          type: 'warning',
          title: 'Permiso Requerido',
          message: `No tienes el permiso requerido: ${permission}.`
        }}
        onRetry={() => window.location.reload()}
      />
    );
  }

  return children;
}