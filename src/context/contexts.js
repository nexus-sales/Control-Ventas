import { createContext } from 'react';

export const AuthCtx = createContext({
  user: null,
  profile: null,
  isLogged: false,
  isAuthLoading: true,
  login: async () => ({ success: false }),
  logout: async () => {},
  offlineMode: false,
  offlineReason: null,
  activateOfflineMode: () => {},
  deactivateOfflineMode: () => {},
});

