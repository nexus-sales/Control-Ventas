import React, { useState } from 'react';
import { RefreshCw } from 'lucide-react';

export function SyncButton({ dataContext }) {
  const [syncing, setSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState(null);

  const handleSync = async () => {
    setSyncing(true);
    setSyncStatus(null);
    
    try {
      if (dataContext?.syncAll) {
        const success = await dataContext.syncAll();
        if (success) {
          setSyncStatus({ type: 'success', message: 'Datos sincronizados correctamente' });
          if (dataContext?.refreshData) {
            await dataContext.refreshData();
          }
        } else {
          setSyncStatus({ type: 'error', message: 'Error al sincronizar algunos datos' });
        }
      }
    } catch (e) {
      // LOG ELIMINADO
      setSyncStatus({ type: 'error', message: 'Error al sincronizar: ' + e.message });
    } finally {
      setSyncing(false);
      setTimeout(() => setSyncStatus(null), 5000);
    }
  };

  return (
    <>
      {syncStatus && (
        <div className={`fixed top-4 right-4 z-50 p-3 rounded-lg shadow-lg ${
          syncStatus.type === 'success' 
            ? 'bg-green-100 border border-green-300 text-green-800' 
            : 'bg-red-100 border border-red-300 text-red-800'
        }`}>
          {syncStatus.message}
        </div>
      )}
      
      <button
        onClick={handleSync}
        disabled={syncing}
        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 disabled:opacity-50"
      >
        <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
        {syncing ? 'Sincronizando...' : 'Sincronizar'}
      </button>
    </>
  );
}
