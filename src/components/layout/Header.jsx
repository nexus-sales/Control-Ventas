// src/components/layout/Header.jsx
import React, { useState, useEffect, useCallback, useContext } from "react";
import { Search, Bell, Download, RefreshCw } from "lucide-react";
import { DataCtx } from "../../context/contexts";
import DarkModeToggle from "../ui/DarkModeToggle";

function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [installable, setInstallable] = useState(false);

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setInstallable(true);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const promptInstall = useCallback(async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome) {
      setInstallable(false);
      setDeferredPrompt(null);
    }
  }, [deferredPrompt]);

  return { installable, promptInstall };
}

export function Header() {
  const { installable, promptInstall } = usePWAInstall();
  const { refreshData, isSupabaseAvailable } = useContext(DataCtx);
  const [syncing, setSyncing] = useState(false);

  const handleSync = async () => {
    if (!isSupabaseAvailable) {
      alert('Supabase no está disponible');
      return;
    }
    
    setSyncing(true);
    try {
      const success = await refreshData();
      if (success) {
        alert('Datos sincronizados correctamente desde Supabase');
      } else {
        alert('No se pudieron sincronizar los datos');
      }
    } catch (error) {
      console.error('Error en sincronización:', error);
      alert('Error al sincronizar datos');
    } finally {
      setSyncing(false);
    }
  };

  return (
    <header className="sticky top-0 z-10 bg-white/70 dark:bg-gray-900/70 backdrop-blur border-b border-slate-200 dark:border-gray-700 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 py-2 flex items-center gap-2">
        <div className="flex items-center gap-2 px-3 py-2 bg-slate-100 dark:bg-gray-700 rounded-xl flex-1 transition-colors duration-300">
          <Search className="w-4 h-4 text-gray-500 dark:text-gray-400" />
          <input
            className="bg-transparent outline-none text-sm w-full text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
            placeholder="Buscar… (Ctrl+/)"
          />
        </div>
        
        {/* Botón de dark mode */}
        <DarkModeToggle />
        
        {/* Botón de sincronización */}
        <button
          onClick={handleSync}
          disabled={!isSupabaseAvailable || syncing}
          className={`p-2 rounded-xl transition-colors ${
            isSupabaseAvailable && !syncing
              ? 'hover:bg-green-100 dark:hover:bg-green-900 text-green-600 dark:text-green-400' 
              : 'opacity-50 cursor-not-allowed'
          }`}
          title={isSupabaseAvailable ? 'Sincronizar con Supabase' : 'Supabase no disponible'}
        >
          <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
        </button>
        
        {installable && (
          <button
            onClick={promptInstall}
            className="px-3 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-gray-900 flex items-center gap-2 hover:bg-slate-800 dark:hover:bg-gray-100 transition-colors"
          >
            <Download className="w-4 h-4" /> Instalar
          </button>
        )}
        
        <button
          className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 transition-colors"
          title="Notificaciones"
        >
          <Bell className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}