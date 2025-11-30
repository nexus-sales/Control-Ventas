// src/context/hooks.js
import { useContext } from 'react';
import { AuthContext, DataContext, ThemeContext, AppContext } from './contexts';

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de AppContextProvider');
  }
  return context;
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData debe ser usado dentro de AppContextProvider');
  }
  return context;
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme debe ser usado dentro de AppContextProvider');
  }
  return context;
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp debe ser usado dentro de AppContextProvider');
  }
  return context;
};

export const useAppContexts = () => {
  const auth = useAuth();
  const data = useData();
  const theme = useTheme();
  const app = useApp();

  return {
    auth,
    data,
    theme,
    app,
    isReady: auth.isAuthenticated && data.dataInitialized,
    hasAccess: auth.isAuthenticated,
    totalRecords: Object.values(data.data).reduce((sum, arr) => sum + (Array.isArray(arr) ? arr.length : 0), 0),
    debug: () => ({
      auth: {
        isAuthenticated: auth.isAuthenticated,
        user: auth.user?.email || 'N/A'
      },
      data: {
        initialized: data.dataInitialized,
        totalRecords: Object.values(data.data).reduce((sum, arr) => sum + (Array.isArray(arr) ? arr.length : 0), 0),
        collections: Object.keys(data.data).map(key => ({
          name: key,
          count: Array.isArray(data.data[key]) ? data.data[key].length : 0
        }))
      },
      theme: {
        current: theme.isDark ? 'dark' : 'light',
        theme: theme.theme
      },
      app: {
        notifications: app.notifications.length,
        isOnline: app.isOnline
      }
    })
  };
};