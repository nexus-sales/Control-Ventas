import React, { useEffect, useRef, useState } from 'react';
import { RefreshCw, Download } from 'lucide-react';

/**
 * Displays a small notification when the PWA has an update ready or when the app
 * is cached for offline usage. It listens to custom events dispatched from the
 * service worker registration in main.jsx.
 */
export default function PWAUpdatePrompt() {
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
            <button
              type="button"
              className="px-3 py-1.5 rounded-lg bg-amber-600 text-white text-xs font-semibold hover:bg-amber-700"
              onClick={() => {
                if (updateCallbackRef.current) {
                  updateCallbackRef.current(true);
                }
                setNeedsRefresh(false);
              }}
            >
              Actualizar ahora
            </button>
            <button
              type="button"
              className="text-xs text-amber-700 hover:underline"
              onClick={() => setNeedsRefresh(false)}
            >
              Más tarde
            </button>
          </div>
        </div>
      )}

      {!needsRefresh && offlineReady && (
        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-xl shadow text-sm">
          <Download className="w-4 h-4" />
          <span>La aplicación está lista para usarse sin conexión.</span>
        </div>
      )}
    </div>
  );
}
