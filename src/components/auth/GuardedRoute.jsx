
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import Loading from '../common/Loading';

export function GuardedRoute({ children, roles }) {
  const { isLogged, isAuthLoading, profile } = useAuth();
  const location = useLocation();

  if (isAuthLoading) {
    return <Loading message="Verificando autenticación..." />;
  }

  if (!isLogged) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Si la ruta requiere roles y el perfil no los cumple
  if (roles && roles.length > 0 && !roles.includes(profile?.rol)) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  return children;
}

