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

export const DataCtx = createContext({
  data: {
    ventas: [],
    colaboradores: [],
    niveles: [],
    operadores: [],
    productos: [],
    zonas: [],
    reglas: [],
    liquidaciones: []
  },
  dataInitialized: false,
  isDataLoading: false,
  lastError: null,
  saveData: async () => ({ success: false }),
  refreshData: async () => false,
  loadAllData: async () => ({ success: false }),
  insertVentas: async () => ({ success: false }),
  setVentas: () => {},
  setProductos: () => {},
  setOperadores: () => {},
  setColaboradores: () => {},
  setZonas: () => {},
  setNiveles: () => {},
  setReglas: () => {},
  setLiquidaciones: () => {},
  syncAll: async () => false,
  userRole: null,
  isSupabaseAvailable: true
});