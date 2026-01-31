// src/components/layout/Header.jsx
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Search, Bell, Download } from "lucide-react";
import DarkModeToggle from "../ui/DarkModeToggle";
import { useData, useApp } from "../../context/AppContexts";

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
  const { isOnline } = useApp();
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

        {/* Log de estado de sincronización dinámico */}
        <div
          className="flex items-center gap-2 px-4 py-2 rounded-2xl shadow-md"
          style={{
            minWidth: 170,
            background: '#23293C',
            transition: 'background 0.3s',
            opacity: isOnline ? 1 : 0.85
          }}
        >
          <div
            className="flex items-center justify-center w-10 h-10 rounded-xl"
            style={{
              background: isOnline ? '#6FCF97' : '#F2994A',
              transition: 'background 0.3s'
            }}
          >
            {isOnline ? (
              // Icono WiFi online
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M2.5 8.5C7.5 4.5 16.5 4.5 21.5 8.5" stroke="#fff" strokeWidth="2" strokeLinecap="round"/>
                <path d="M5.5 12C9 9 15 9 18.5 12" stroke="#fff" strokeWidth="2" strokeLinecap="round"/>
                <path d="M8.5 15.5C10 14.5 14 14.5 15.5 15.5" stroke="#fff" strokeWidth="2" strokeLinecap="round"/>
                <circle cx="12" cy="18" r="1.5" fill="#fff"/>
              </svg>
            ) : (
              // Icono WiFi offline (tachado)
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M2.5 8.5C7.5 4.5 16.5 4.5 21.5 8.5" stroke="#fff" strokeWidth="2" strokeLinecap="round"/>
                <path d="M5.5 12C9 9 15 9 18.5 12" stroke="#fff" strokeWidth="2" strokeLinecap="round"/>
                <path d="M8.5 15.5C10 14.5 14 14.5 15.5 15.5" stroke="#fff" strokeWidth="2" strokeLinecap="round"/>
                <circle cx="12" cy="18" r="1.5" fill="#fff"/>
                <line x1="6" y1="22" x2="22" y2="6" stroke="#fff" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            )}
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-bold tracking-widest text-[#AEB6C8]" style={{ letterSpacing: 2 }}>STATUS</span>
            <span className="text-lg font-extrabold text-white leading-5">
              {isOnline ? 'Sincronizado' : 'Sin conexión'}
            </span>
          </div>
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