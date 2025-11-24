// src/hooks/useOfflineSync.js
// Hook para manejar sincronización offline/online
import { useState, useEffect, useCallback } from 'react';

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

  // Limpiar cambios sincronizados
  const clearPendingChanges = useCallback(() => {
    setPendingChanges([]);
    localStorage.removeItem('pendingChanges');
    
    const now = new Date().toISOString();
    setLastSyncTime(now);
    localStorage.setItem('lastSyncTime', now);
    
    // LOG ELIMINADO
  }, []);

  // Crear backup de emergencia
  const createEmergencyBackup = useCallback(() => {
    const backupData = {
      ventas: JSON.parse(localStorage.getItem('appcv_ventas') || '[]'),
      colaboradores: JSON.parse(localStorage.getItem('appcv_colaboradores') || '[]'),
      productos: JSON.parse(localStorage.getItem('appcv_productos') || '[]'),
      operadores: JSON.parse(localStorage.getItem('appcv_operadores') || '[]'),
      liquidaciones: JSON.parse(localStorage.getItem('appcv_liquidaciones') || '[]'),
      timestamp: new Date().toISOString(),
      version: '2.0'
    };

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
    const sizeInfo = {
      ventas: (localStorage.getItem('appcv_ventas') || '').length,
      productos: (localStorage.getItem('appcv_productos') || '').length,
      colaboradores: (localStorage.getItem('appcv_colaboradores') || '').length,
      total: 0
    };
    
    sizeInfo.total = Object.values(sizeInfo).reduce((acc, val) => acc + val, 0);
    
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
    createEmergencyBackup,
    getOfflineInfo
  };
}