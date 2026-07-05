import React, { useState, useEffect, useRef } from 'react';
import { RefreshCw, Zap } from 'lucide-react';
import { glassStyles } from '../../utils/designUtils';

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
      <div className={`${glassStyles()} p-5 rounded-3xl border-indigo-500/30 flex items-center justify-between gap-6 shadow-[0_20px_50px_rgba(79,70,229,0.3)]`}>
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
