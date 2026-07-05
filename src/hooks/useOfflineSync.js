// src/hooks/useOfflineSync.js
// Hook para manejar sincronización offline/online
import { useState, useEffect, useCallback } from 'react';

// Debe coincidir con STORAGE_KEYS en AppContexts.jsx (no se importa de ahí
// para evitar un ciclo: AppContexts.jsx ya importa este hook). Antes solo
// tenía 4 de las 10 colecciones — el "backup de emergencia" y el tamaño de
// caché mostrado en Config→Sincronización omitían zonas, niveles, reglas,
// decomisiones, empresa y custom_fields sin ningún aviso de que el backup
// era parcial.
const TODAS_LAS_STORAGE_KEYS = {
  ventas: 'cv_ventas_v3',
  colaboradores: 'cv_colaboradores_v3',
  productos: 'cv_productos_v3',
  operadores: 'cv_operadores_v3',
  zonas: 'cv_zonas_v3',
  niveles: 'cv_niveles_v3',
  reglas: 'cv_reglas_v3',
  liquidaciones: 'cv_liquidaciones_v3',
  decomisiones: 'cv_decomisiones_v3',
  empresa: 'empresaData',
  custom_fields: 'customFields',
};

export function useOfflineSync() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingChanges, setPendingChanges] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('pendingChanges')) || [];
    } catch {
      return [];
    }
  });
  const [lastSyncTime, setLastSyncTime] = useState(() => {
    return localStorage.getItem('lastSyncTime') || null;
  });

  // Detectar cambios de conexión
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // LOG ELIMINADO
    };

    const handleOffline = () => {
      setIsOnline(false);
      // LOG ELIMINADO
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Guardar cambio pendiente
  const addPendingChange = useCallback((change) => {
    const changeWithTimestamp = {
      ...change,
      timestamp: new Date().toISOString(),
      id: `change_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };

    setPendingChanges(prev => {
      const updated = [...prev, changeWithTimestamp];
      localStorage.setItem('pendingChanges', JSON.stringify(updated));
      return updated;
    });

    // LOG ELIMINADO
  }, []);

  // Limpiar TODOS los cambios pendientes (uso manual/ocasional)
  const clearPendingChanges = useCallback(() => {
    setPendingChanges([]);
    localStorage.removeItem('pendingChanges');
    
    const now = new Date().toISOString();
    setLastSyncTime(now);
    localStorage.setItem('lastSyncTime', now);
    
    // LOG ELIMINADO
  }, []);

  // Resolver (quitar) los cambios pendientes que cumplan `predicate`, sin tocar
  // el resto. Es lo que usa el guardado real: al reintentar con éxito solo se
  // limpia esa entrada concreta, no toda la cola.
  const resolvePendingChange = useCallback((predicate) => {
    setPendingChanges(prev => {
      const updated = prev.filter((change) => !predicate(change));
      if (updated.length === 0) {
        localStorage.removeItem('pendingChanges');
      } else {
        localStorage.setItem('pendingChanges', JSON.stringify(updated));
      }
      return updated;
    });
  }, []);

  // Crear backup de emergencia
  const createEmergencyBackup = useCallback(() => {
    const backupData = {
      timestamp: new Date().toISOString(),
      version: '2.0',
    };
    Object.entries(TODAS_LAS_STORAGE_KEYS).forEach(([nombre, key]) => {
      try {
        backupData[nombre] = JSON.parse(localStorage.getItem(key) || (key === 'empresaData' ? '{}' : '[]'));
      } catch {
        backupData[nombre] = key === 'empresaData' ? {} : [];
      }
    });

    const backupBlob = new Blob([JSON.stringify(backupData, null, 2)], { 
      type: 'application/json' 
    });
    
    const url = URL.createObjectURL(backupBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `backup_control_ventas_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    // LOG ELIMINADO
  }, []);

  // Información del estado offline
  const getOfflineInfo = useCallback(() => {
    const sizeInfo = {};
    Object.entries(TODAS_LAS_STORAGE_KEYS).forEach(([nombre, key]) => {
      sizeInfo[nombre] = (localStorage.getItem(key) || '').length;
    });
    const total = Object.values(sizeInfo).reduce((acc, val) => acc + val, 0);
    sizeInfo.total = total;

    return {
      isOnline,
      pendingChangesCount: pendingChanges.length,
      lastSyncTime,
      storageSize: sizeInfo,
      storageSizeKB: Math.round(sizeInfo.total / 1024)
    };
  }, [isOnline, pendingChanges.length, lastSyncTime]);

  return {
    isOnline,
    pendingChanges,
    lastSyncTime,
    addPendingChange,
    clearPendingChanges,
    resolvePendingChange,
    createEmergencyBackup,
    getOfflineInfo
  };
}
