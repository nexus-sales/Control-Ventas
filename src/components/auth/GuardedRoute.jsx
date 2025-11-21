import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useContext } from 'react';
import AuthCtx from '../../context/AuthCtx';
import Loading from '../common/Loading';
import AccessDeniedScreen from './AccessDeniedScreen';
import { checkUserPermission } from '../../utils/accessControl';

export function GuardedRoute({ children, roles, permission }) {
  const { 
    isLogged, 
    isAuthLoading, 
    profile, 
    user,
    hasAccess,
    accessMessage,
    isAccessLoading
  } = useContext(AuthCtx);
  const location = useLocation();

  // Mostrar loading mientras se verifica autenticación
  if (isAuthLoading || isAccessLoading) {
    return <Loading message="Verificando autenticación..." />;
  }

  // Si no está logueado, redirigir al login
  if (!isLogged) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Si no tiene acceso al sistema, mostrar pantalla de acceso denegado
  if (!hasAccess) {
    return (
      <AccessDeniedScreen 
        email={user?.email}
        accessInfo={accessMessage}
        onRetry={() => window.location.reload()}
      />
    );
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