// src/components/layout/Header.jsx
import React, { useState, useEffect, useCallback } from "react";
import { Search, Bell, Download, RefreshCw } from "lucide-react";
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
  // ...existing code...

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
        
        {/* Eliminado botón de sincronización Supabase */}
        
        {installable && (
          return (
            <header className="w-full flex items-center justify-between px-4 py-2 border-b border-pink-200 dark:border-pink-400 bg-pink-50 dark:bg-pink-200">
              <div className="flex items-center gap-2">
                <button
                  onClick={onToggleSidebar}
                  className="p-2 rounded-lg hover:bg-pink-100 dark:hover:bg-pink-300"
                >
                  <Menu className="w-5 h-5 text-pink-700 dark:text-pink-900" />
                </button>
                <span className="font-bold text-pink-700 dark:text-pink-900">Control Ventas</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm text-pink-700 dark:text-pink-900">{user?.name}</span>
                <button
                  onClick={onLogout}
                  className="px-3 py-1 rounded-lg bg-pink-200 hover:bg-pink-300 dark:bg-pink-400 dark:hover:bg-pink-500 text-pink-900 dark:text-pink-50"
                >
                  Salir
                </button>
              </div>
            </header>
          );