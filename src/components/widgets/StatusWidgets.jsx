// src/components/widgets/StatusWidgets.jsx
// Consolidado: OfflineStatus + PWAUpdatePrompt
import React, { useState, useMemo, useEffect, useRef } from 'react';
import * as Tooltip from '@radix-ui/react-tooltip';
import { Wifi, WifiOff, Download, Upload, Clock, HardDrive, ChevronDown, ChevronUp, RefreshCw } from 'lucide-react';
import { useOfflineSync } from '../../hooks/useOfflineSync';
import { useAuthGestion } from '../../hooks/useAuthGestion';

// --- OfflineStatus Widget ---
function OfflineStatus() {
  const { isOnline, pendingChanges, lastSyncTime, createEmergencyBackup, getOfflineInfo } = useOfflineSync();
  const { offlineMode, offlineReason } = useAuthGestion();
  const [isExpanded, setIsExpanded] = useState(false);
  const offlineInfo = getOfflineInfo ? getOfflineInfo() : { storageSizeKB: 0 };
  const status = useMemo(() => {
    if (offlineMode) {
      return {
        label: 'Modo Offline',
        icon: WifiOff,
        tone: 'offline',
        detail: offlineReason ? `Origen: ${offlineReason}` : 'Trabajando solo con datos locales'
      };
    }
    if (!isOnline) {
      return {
        label: 'Sin conexión',
        icon: WifiOff,
        tone: 'warning',
        detail: 'Esperando reconexión...'
      };
    }
    return {
      label: 'Online',
      icon: Wifi,
      tone: 'online',
      detail: 'Sincronización automática habilitada'
    };
  }, [offlineMode, offlineReason, isOnline]);
  function formatSyncTime(timestamp) {
    if (!timestamp) return 'Nunca';
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    if (diffMins < 1) return 'Hace un momento';
    if (diffMins < 60) return `Hace ${diffMins} min`;
    if (diffMins < 1440) return `Hace ${Math.floor(diffMins / 60)} horas`;
    return date.toLocaleDateString('es-ES');
  }
  return (
    <div className={`fixed top-4 right-4 z-50 transition-all duration-300 ${status.tone === 'online' ? 'opacity-75 hover:opacity-100' : 'opacity-100'}`}>
      <div className={`rounded-lg shadow-lg overflow-hidden ${status.tone === 'online' ? 'bg-green-50 border-green-200 text-green-800' : status.tone === 'offline' ? 'bg-slate-100 border-slate-300 text-slate-800' : 'bg-amber-50 border-amber-200 text-amber-800'} border-2`}>
        <Tooltip.Root delayDuration={200}>
          <Tooltip.Trigger asChild>
            <div className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-opacity-80" onClick={() => setIsExpanded(!isExpanded)}>
              <status.icon className="w-4 h-4" />
              <span className="text-sm font-medium">{status.label}</span>
              {pendingChanges.length > 0 && (
                <span className="bg-red-100 text-red-700 text-xs px-2 py-1 rounded-full">{pendingChanges.length}</span>
              )}
              {isExpanded ? <ChevronUp className="w-3 h-3 ml-auto" /> : <ChevronDown className="w-3 h-3 ml-auto" />}
            </div>
          </Tooltip.Trigger>
          <Tooltip.Portal>
            <Tooltip.Content side="left" align="center" className="z-50 px-3 py-2 rounded-lg bg-slate-900 text-white text-xs shadow-lg animate-fadeIn whitespace-pre-line" style={{ pointerEvents: 'auto' }}>
              {status.detail}
              <Tooltip.Arrow className="fill-slate-900" />
            </Tooltip.Content>
          </Tooltip.Portal>
        </Tooltip.Root>
        {isExpanded && (
          <div className="border-t border-current border-opacity-20 p-3 space-y-3">
            <div className="flex items-center gap-2 text-xs"><Clock className="w-3 h-3" /><span>Última sync: {formatSyncTime(lastSyncTime)}</span></div>
            {pendingChanges.length > 0 && (<div className="flex items-center gap-2 text-xs"><Upload className="w-3 h-3" /><span>{pendingChanges.length} cambios pendientes de subir</span></div>)}
            <div className="flex items-center gap-2 text-xs"><HardDrive className="w-3 h-3" /><span>Datos locales: {offlineInfo.storageSizeKB} KB</span></div>
            <Tooltip.Root delayDuration={200}>
              <Tooltip.Trigger asChild>
                <button onClick={createEmergencyBackup} className={`w-full flex items-center justify-center gap-2 text-xs px-2 py-1 rounded transition-colors ${isOnline ? 'bg-green-100 hover:bg-green-200 text-green-800' : 'bg-amber-100 hover:bg-amber-200 text-amber-800'}`} title="Crear backup de emergencia">
                  <Download className="w-3 h-3" />Crear Backup
                </button>
              </Tooltip.Trigger>
              <Tooltip.Portal>
                <Tooltip.Content side="top" align="center" className="z-50 px-3 py-2 rounded-lg bg-slate-900 text-white text-xs shadow-lg animate-fadeIn whitespace-pre-line" style={{ pointerEvents: 'auto' }}>
                  Descarga una copia de seguridad de tus datos locales para restaurar en caso de emergencia.
                  <Tooltip.Arrow className="fill-slate-900" />
                </Tooltip.Content>
              </Tooltip.Portal>
            </Tooltip.Root>
            {!isOnline && !offlineMode && (<div className="text-xs space-y-1"><div className="font-medium">Modo Offline Activo:</div><div>• Todos los cambios se guardan localmente</div><div>• Se sincronizarán al reconectar</div><div>• Funciones disponibles al 100%</div></div>)}
            {offlineMode && (<div className="text-xs space-y-1"><div className="font-medium">Modo Offline Manual</div><div>• Operando solo con datos locales</div><div>• Sincronización remota deshabilitada temporalmente</div>{offlineReason && <div>• Causa: {offlineReason}</div>}</div>)}
            {status.tone === 'online' && pendingChanges.length === 0 && (<div className="text-xs"><div className="font-medium">Sistema Sincronizado</div><div>Todos los datos están actualizados</div></div>)}
          </div>
        )}
      </div>
    </div>
  );
}

// --- PWAUpdatePrompt Widget ---
function PWAUpdatePrompt() {
  const [needsRefresh, setNeedsRefresh] = useState(false);
  const [offlineReady, setOfflineReady] = useState(false);
  const updateCallbackRef = useRef(null);
  const hideTimerRef = useRef(null);
  useEffect(() => {
    const handleNeedRefresh = (event) => {
      setNeedsRefresh(true);
      setOfflineReady(false);
      updateCallbackRef.current = event.detail?.update || null;
    };
    const handleOfflineReady = () => {
      setOfflineReady(true);
      setNeedsRefresh(false);
      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current);
      }
      hideTimerRef.current = setTimeout(() => {
        setOfflineReady(false);
      }, 5000);
    };
    window.addEventListener('pwa:need-refresh', handleNeedRefresh);
    window.addEventListener('pwa:offline-ready', handleOfflineReady);
    return () => {
      window.removeEventListener('pwa:need-refresh', handleNeedRefresh);
      window.removeEventListener('pwa:offline-ready', handleOfflineReady);
      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current);
      }
    };
  }, []);
  if (!needsRefresh && !offlineReady) {
    return null;
  }
  return (
    <div className="max-w-7xl mx-auto px-4 mt-4">
      {needsRefresh && (
        <div className="flex items-center justify-between gap-3 bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-xl shadow">
          <div className="flex items-center gap-2 text-sm font-medium">
            <RefreshCw className="w-4 h-4" />
            <span>Hay una actualización disponible.</span>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" className="px-3 py-1.5 rounded-lg bg-amber-600 text-white text-xs font-semibold hover:bg-amber-700" onClick={() => { if (updateCallbackRef.current) { updateCallbackRef.current(true); } setNeedsRefresh(false); }}>Actualizar ahora</button>
            <button type="button" className="text-xs text-amber-700 hover:underline" onClick={() => setNeedsRefresh(false)}>Más tarde</button>
          </div>
        </div>
      )}
      {!needsRefresh && offlineReady && (
        <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-xl shadow text-sm font-medium">
          <Download className="w-4 h-4" />
          <span>La app está lista para usarse sin conexión.</span>
        </div>
      )}
    </div>
  );
}

// --- Componente Consolidado ---
export default function StatusWidgets() {
  return (
    <>
      <OfflineStatus />
      <PWAUpdatePrompt />
    </>
  );
}
