import React, { useState, useMemo, useEffect, useRef } from 'react';
import * as Tooltip from '@radix-ui/react-tooltip';
import { Wifi, WifiOff, Download, Upload, Clock, HardDrive, ChevronDown, ChevronUp, RefreshCw, Zap } from 'lucide-react';
import { useAuthGestion } from '../../hooks/useAuthGestion';
import { useData } from '../../context/AppContexts';
import { glassStyles } from '../../utils/designUtils';

function OfflineStatus() {
  // Lee del DataProvider en vez de llamar a useOfflineSync() por su cuenta: es la
  // misma instancia que usa saveCollectionData para marcar cambios pendientes de
  // verdad — una segunda instancia aquí tendría su propio estado, siempre en cero.
  const { isOnline, pendingChanges, lastSyncTime, createEmergencyBackup, getOfflineInfo } = useData().offlineSync;
  const { offlineMode, offlineReason } = useAuthGestion();
  const [isExpanded, setIsExpanded] = useState(false);
  const offlineInfo = getOfflineInfo ? getOfflineInfo() : { storageSizeKB: 0 };

  const status = useMemo(() => {
    if (offlineMode) return { label: 'Modo Offline', icon: WifiOff, tone: 'offline', color: 'from-slate-400 to-slate-600', detail: offlineReason || 'Sin conexión manual' };
    if (!isOnline) return { label: 'Desconectado', icon: WifiOff, tone: 'warning', color: 'from-amber-400 to-orange-600', detail: 'Esperando reconexión...' };
    return { label: 'Sincronizado', icon: Wifi, tone: 'online', color: 'from-emerald-400 to-teal-600', detail: 'Conexión activa y segura' };
  }, [offlineMode, offlineReason, isOnline]);

  return (
    <div className={`fixed top-6 right-6 z-50 transition-all duration-500 hover:scale-105 active:scale-95`}>
      <div className={`${glassStyles} rounded-2xl overflow-hidden shadow-2xl border-white/40 dark:border-slate-700/50`}>
        <Tooltip.Provider>
          <Tooltip.Root delayDuration={200}>
            <Tooltip.Trigger asChild>
              <div
                className="flex items-center gap-3 px-4 py-2.5 cursor-pointer hover:bg-white/10 dark:hover:bg-slate-800/20 transition-colors"
                onClick={() => setIsExpanded(!isExpanded)}
              >
                <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${status.color} flex items-center justify-center shadow-lg`}>
                  <status.icon className="w-4 h-4 text-white" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 leading-none mb-0.5">Status</span>
                  <span className="text-sm font-black text-slate-800 dark:text-white leading-none">{status.label}</span>
                </div>
                {pendingChanges.length > 0 && (
                  <span className="bg-rose-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-lg animate-pulse">{pendingChanges.length}</span>
                )}
                <div className="ml-2 text-slate-300 dark:text-slate-600">
                  {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </div>
              </div>
            </Tooltip.Trigger>
            <Tooltip.Portal>
              <Tooltip.Content side="left" className="z-50 px-4 py-2 rounded-xl bg-slate-900/90 backdrop-blur-md text-white text-[10px] font-bold shadow-2xl">
                {status.detail}
                <Tooltip.Arrow className="fill-slate-900/90" />
              </Tooltip.Content>
            </Tooltip.Portal>
          </Tooltip.Root>
        </Tooltip.Provider>

        {isExpanded && (
          <div className="p-4 space-y-4 border-t border-white/20 dark:border-slate-700/30 bg-white/50 dark:bg-slate-900/50">
            <div className="space-y-2">
              <div className="flex items-center gap-3 text-[10px] font-bold text-slate-500 dark:text-slate-400">
                <Clock className="w-3.5 h-3.5" />
                <span>Sync: {lastSyncTime ? new Date(lastSyncTime).toLocaleTimeString() : '---'}</span>
              </div>
              {pendingChanges.length > 0 && (
                <div className="flex items-center gap-3 text-[10px] font-bold text-rose-500">
                  <Upload className="w-3.5 h-3.5" />
                  <span>{pendingChanges.length} cambios pendientes</span>
                </div>
              )}
              <div className="flex items-center gap-3 text-[10px] font-bold text-slate-500 dark:text-slate-400">
                <HardDrive className="w-3.5 h-3.5" />
                <span>Cache: {offlineInfo.storageSizeKB} KB</span>
              </div>
            </div>

            <button
              onClick={createEmergencyBackup}
              className="w-full flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest px-4 py-2.5 rounded-xl bg-slate-800 dark:bg-slate-700 text-white hover:bg-slate-900 dark:hover:bg-slate-600 transition-all shadow-lg active:scale-95"
            >
              <Download className="w-3.5 h-3.5" /> Backup Local
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function PWAUpdatePrompt() {
  const [needsRefresh, setNeedsRefresh] = useState(false);
  const [offlineReady, setOfflineReady] = useState(false);
  const updateCallbackRef = useRef(null);
  const hideTimerRef = useRef(null);

  useEffect(() => {
    const handleNeedRefresh = (e) => { setNeedsRefresh(true); setOfflineReady(false); updateCallbackRef.current = e.detail?.update || null; };
    const handleOfflineReady = () => { setOfflineReady(true); setNeedsRefresh(false); if (hideTimerRef.current) clearTimeout(hideTimerRef.current); hideTimerRef.current = setTimeout(() => setOfflineReady(false), 5000); };
    window.addEventListener('pwa:need-refresh', handleNeedRefresh); window.addEventListener('pwa:offline-ready', handleOfflineReady);
    return () => { window.removeEventListener('pwa:need-refresh', handleNeedRefresh); window.removeEventListener('pwa:offline-ready', handleOfflineReady); if (hideTimerRef.current) clearTimeout(hideTimerRef.current); };
  }, []);

  if (!needsRefresh && !offlineReady) return null;

  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-6">
      <div className={`${glassStyles} p-5 rounded-3xl border-indigo-500/30 flex items-center justify-between gap-6 shadow-[0_20px_50px_rgba(79,70,229,0.3)]`}>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center shadow-lg">
            {needsRefresh ? <RefreshCw className="w-6 h-6 text-white animate-spin" /> : <Zap className="w-6 h-6 text-white" />}
          </div>
          <div>
            <h4 className="text-sm font-black text-slate-800 dark:text-white leading-none mb-1">{needsRefresh ? 'Nueva Versión' : 'App Lista'}</h4>
            <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">{needsRefresh ? 'Hay mejoras disponibles' : 'Disponible offline'}</p>
          </div>
        </div>
        {needsRefresh && (
          <button
            className="px-5 py-2.5 rounded-2xl bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 shadow-indigo-500/20 shadow-lg active:scale-95 transition-all"
            onClick={() => { if (updateCallbackRef.current) updateCallbackRef.current(true); setNeedsRefresh(false); }}
          >
            Actualizar
          </button>
        )}
      </div>
    </div>
  );
}

export default function StatusWidgets() {
  return (
    <>
      <PWAUpdatePrompt />
    </>
  );
}
