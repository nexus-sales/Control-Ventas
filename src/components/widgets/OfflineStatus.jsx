// src/components/widgets/OfflineStatus.jsx
// Indicador de estado offline/online con información útil
import React, { useState, useMemo } from 'react';
import * as Tooltip from '@radix-ui/react-tooltip';
import { Wifi, WifiOff, Download, Upload, Clock, HardDrive, ChevronDown, ChevronUp } from 'lucide-react';
import { useOfflineSync } from '../../hooks/useOfflineSync';
import { useAuth } from '../../hooks/useAuth';

export default function OfflineStatus() {
  const { 
    isOnline, 
    pendingChanges, 
    lastSyncTime, 
    createEmergencyBackup, 
    getOfflineInfo 
  } = useOfflineSync();
  const { offlineMode, offlineReason, activateOfflineMode, deactivateOfflineMode } = useAuth();

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

  const handleForceOffline = () => {
    if (typeof activateOfflineMode === 'function') {
      activateOfflineMode('manual-toggle');
    }
  };

  const handleResumeOnline = () => {
    if (typeof deactivateOfflineMode === 'function') {
      deactivateOfflineMode();
    }
  };

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
    <div className={`fixed top-4 right-4 z-50 transition-all duration-300 ${
      status.tone === 'online' ? 'opacity-75 hover:opacity-100' : 'opacity-100'
    }`}>
      <div className={`rounded-lg shadow-lg overflow-hidden ${
        status.tone === 'online'
          ? 'bg-green-50 border-green-200 text-green-800'
          : status.tone === 'offline'
            ? 'bg-slate-100 border-slate-300 text-slate-800'
            : 'bg-amber-50 border-amber-200 text-amber-800'
      } border-2`}>
        {/* Header siempre visible */}
        <Tooltip.Root delayDuration={200}>
          <Tooltip.Trigger asChild>
            <div 
              className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-opacity-80"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              <status.icon className="w-4 h-4" />
              <span className="text-sm font-medium">
                {status.label}
              </span>
              {pendingChanges.length > 0 && (
                <span className="bg-red-100 text-red-700 text-xs px-2 py-1 rounded-full">
                  {pendingChanges.length}
                </span>
              )}
              {isExpanded ? (
                <ChevronUp className="w-3 h-3 ml-auto" />
              ) : (
                <ChevronDown className="w-3 h-3 ml-auto" />
              )}
            </div>
          </Tooltip.Trigger>
          <Tooltip.Portal>
            <Tooltip.Content side="left" align="center" className="z-50 px-3 py-2 rounded-lg bg-slate-900 text-white text-xs shadow-lg animate-fadeIn whitespace-pre-line" style={{ pointerEvents: 'auto' }}>
              {status.detail}
              <Tooltip.Arrow className="fill-slate-900" />
            </Tooltip.Content>
          </Tooltip.Portal>
        </Tooltip.Root>
        {/* Información expandible */}
        {isExpanded && (
          <div className="border-t border-current border-opacity-20 p-3 space-y-3">
            {/* Estado de sincronización */}
            <div className="flex items-center gap-2 text-xs">
              <Clock className="w-3 h-3" />
              <span>Última sync: {formatSyncTime(lastSyncTime)}</span>
            </div>
            {/* Cambios pendientes */}
            {pendingChanges.length > 0 && (
              <div className="flex items-center gap-2 text-xs">
                <Upload className="w-3 h-3" />
                <span>{pendingChanges.length} cambios pendientes de subir</span>
              </div>
            )}
            {/* Información de almacenamiento */}
            <div className="flex items-center gap-2 text-xs">
              <HardDrive className="w-3 h-3" />
              <span>Datos locales: {offlineInfo.storageSizeKB} KB</span>
            </div>
            {/* Botón de backup con tooltip */}
            <Tooltip.Root delayDuration={200}>
              <Tooltip.Trigger asChild>
                <button
                  onClick={createEmergencyBackup}
                  className={`w-full flex items-center justify-center gap-2 text-xs px-2 py-1 rounded transition-colors ${
                    isOnline
                      ? 'bg-green-100 hover:bg-green-200 text-green-800'
                      : 'bg-amber-100 hover:bg-amber-200 text-amber-800'
                  }`}
                  title="Crear backup de emergencia"
                >
                  <Download className="w-3 h-3" />
                  Crear Backup
                </button>
              </Tooltip.Trigger>
              <Tooltip.Portal>
                <Tooltip.Content side="top" align="center" className="z-50 px-3 py-2 rounded-lg bg-slate-900 text-white text-xs shadow-lg animate-fadeIn whitespace-pre-line" style={{ pointerEvents: 'auto' }}>
                  Descarga una copia de seguridad de tus datos locales para restaurar en caso de emergencia.
                  <Tooltip.Arrow className="fill-slate-900" />
                </Tooltip.Content>
              </Tooltip.Portal>
            </Tooltip.Root>
            {/* Información adicional offline */}
            {!isOnline && !offlineMode && (
              <div className="text-xs space-y-1">
                <div className="font-medium">Modo Offline Activo:</div>
                <div>• Todos los cambios se guardan localmente</div>
                <div>• Se sincronizarán al reconectar</div>
                <div>• Funciones disponibles al 100%</div>
              </div>
            )}
            {offlineMode && (
              <div className="text-xs space-y-1">
                <div className="font-medium">Modo Offline Manual</div>
                <div>• Operando solo con datos locales</div>
                <div>• Sincronización remota deshabilitada temporalmente</div>
                {offlineReason && <div>• Causa: {offlineReason}</div>}
              </div>
            )}
            {/* Información online */}
            {status.tone === 'online' && pendingChanges.length === 0 && (
              <div className="text-xs">
                <div className="font-medium">Sistema Sincronizado</div>
                <div>Todos los datos están actualizados</div>
              </div>
            )}

            {/* Controles de modo offline */}
            {/* Botones de modo offline manual desactivados para evitar bucles y reinicialización */}
            {/* <div className="grid grid-cols-1 gap-2">
              {!offlineMode && (
                <button
                  onClick={handleForceOffline}
                  className="w-full text-xs px-2 py-1 rounded bg-slate-200 hover:bg-slate-300 text-slate-700"
                >
                  Trabajar sin conexión
                </button>
              )}
              {offlineMode && isOnline && (
                <button
                  onClick={handleResumeOnline}
                  className="w-full text-xs px-2 py-1 rounded bg-green-200 hover:bg-green-300 text-green-800"
                >
                  Reintentar conexión remota
                </button>
              )}
            </div> */}
          </div>
        )}
      </div>
    </div>
  );
}
