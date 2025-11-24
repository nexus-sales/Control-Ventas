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
    isReady: auth.isLogged && data.dataInitialized,
    hasAccess: auth.hasAccess,
    totalRecords: data.dataMetrics.totalRecords,
    debug: () => ({
      auth: {
        isLogged: auth.isLogged,
        userRole: auth.userRole,
        permissions: Object.keys(auth.permissions).length
      },
      data: {
        initialized: data.dataInitialized,
        totalRecords: data.dataMetrics.totalRecords,
        lastSync: data.lastSync
      },
      theme: {
        current: theme.isDark ? 'dark' : 'light',
        preference: theme.themePreference,
        customActive: theme.customTheme?.name
      },
      app: {
        notifications: app.notifications.length,
        globalLoading: app.globalLoading,
        config: app.appConfig
      },
      metrics: app.getAppStats().metrics
    })
  };
};