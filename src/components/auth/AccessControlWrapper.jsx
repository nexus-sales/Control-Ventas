import React from 'react';
import { useAuth } from '../../context/AppContexts';
import Loading from '../common/Loading';
import AccessDeniedScreen from './AccessDeniedScreen';
import LoginScreen from './LoginScreen';

/**
 * Wrapper component que maneja toda la lógica de control de acceso
 * Determina qué pantalla mostrar basado en el estado de autenticación y acceso
 */
export default function AccessControlWrapper({ children }) {
  const { 
    isLogged, 
    isAuthLoading, 
    hasAccess, 
    accessMessage, 
    isAccessLoading,
    user 
  } = useAuth();

  // Mostrar loading mientras se verifica todo
  if (isAuthLoading || isAccessLoading) {
    return <Loading message="Verificando acceso..." />;
  }

  // Si no está logueado, mostrar login
  if (!isLogged) {
    return <LoginScreen />;
  }

  // Si está logueado pero no tiene acceso, mostrar acceso denegado
  if (!hasAccess && accessMessage) {
    return (
      <AccessDeniedScreen 
        email={user?.email}
        accessInfo={accessMessage}
        onRetry={() => window.location.reload()}
      />
    );
  }

  // Si tiene acceso, mostrar la aplicación
  return children;
}