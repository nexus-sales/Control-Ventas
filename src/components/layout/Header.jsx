// src/components/layout/Header.jsx
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Search, Bell, Download } from "lucide-react";
import DarkModeToggle from "../ui/DarkModeToggle";
import { useData } from "../../context/AppContexts";

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
  const { data } = useData();
  const [empresaLocal, setEmpresaLocal] = useState(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const readEmpresa = () => {
      try {
        const raw = localStorage.getItem("empresaData");
        if (raw) {
          setEmpresaLocal(JSON.parse(raw));
        } else {
          setEmpresaLocal(null);
        }
      } catch {
        setEmpresaLocal(null);
      }
    };

    readEmpresa();
    const handleStorage = (event) => {
      if (event.key === "empresaData") {
        readEmpresa();
      }
    };
    const handleEmpresaEvent = (event) => {
      if (event?.detail) {
        setEmpresaLocal(event.detail);
      } else {
        readEmpresa();
      }
    };

    window.addEventListener("storage", handleStorage);
    window.addEventListener("empresaDataUpdated", handleEmpresaEvent);
    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("empresaDataUpdated", handleEmpresaEvent);
    };
  }, []);

  const empresaActiva = useMemo(() => {
    if (Array.isArray(data?.empresas) && data.empresas.length > 0) {
      const activas = data.empresas.filter((empresa) => empresa.activo !== false);
      const candidata = (activas.length > 0 ? activas : data.empresas)[0];
      if (candidata?.logoUrl) return candidata;
    }
    return empresaLocal;
  }, [data?.empresas, empresaLocal]);

  return (
    <header className="sticky top-0 z-10 bg-white/70 dark:bg-gray-800/80 backdrop-blur border-b border-slate-200 dark:border-gray-700 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 py-2 flex items-center gap-2">
        {empresaActiva?.logoUrl ? (
          <div className="flex items-center gap-2 pr-3 border-r border-slate-200 dark:border-gray-700">
            <img
              src={empresaActiva.logoUrl}
              alt={empresaActiva.nombre ? `Logo ${empresaActiva.nombre}` : "Logo empresa"}
              className="h-10 w-10 rounded-xl object-contain bg-white shadow-sm"
            />
            {empresaActiva.nombre && (
              <span className="hidden sm:block text-sm font-semibold text-slate-700 dark:text-gray-200">
                {empresaActiva.nombre}
              </span>
            )}
          </div>
        ) : null}
        {/* Buscador */}
        <div className="flex items-center gap-2 px-3 py-2 bg-slate-100 dark:bg-gray-700 rounded-xl flex-1 transition-colors duration-300">
          <Search className="w-4 h-4 text-gray-500 dark:text-gray-400" />
          <input
            className="bg-transparent outline-none text-sm w-full text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
            placeholder="Buscar… (Ctrl+/)"
          />
        </div>
        
        {/* Botón de notificaciones */}
        <button className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-gray-700 text-slate-600 dark:text-gray-400 transition-colors duration-200">
          <Bell className="w-5 h-5" />
        </button>
        
        {/* Botón de dark mode */}
        <DarkModeToggle />
        
        {/* Botón de instalación PWA */}
        {installable && (
          <button
            onClick={promptInstall}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-blue-600 dark:bg-blue-700 hover:bg-blue-700 dark:hover:bg-blue-600 text-white text-sm font-medium transition-colors duration-200"
            title="Instalar aplicación"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Instalar App</span>
          </button>
        )}
      </div>
    </header>
  );
}

export default Header;