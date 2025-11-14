import { useContext } from 'react';
import { AuthCtx } from '../context/contexts';

// Hook para consumir el contexto de autenticación
export function useAuth() {
  return useContext(AuthCtx);
}