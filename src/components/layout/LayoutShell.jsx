import React, { useState } from "react";
import { Link, useLocation, Outlet } from "react-router-dom";
import { 
  Home, TrendingUp, Users, Settings, FileSpreadsheet, PiggyBank, Target,
  ChevronLeft, ChevronRight, Bell, Search, LogOut, Database
} from "lucide-react";
import { useAuth, useApp } from "../../context/AppContexts";
import StatusWidgets from "../widgets/StatusWidgets";
import DarkModeToggle from "../ui/DarkModeToggle";
import { LS_KEYS } from "../../utils/constants";
import { getFromStorage, saveToStorage } from "../../utils/storage";

export function LayoutShell() {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(() => getFromStorage(LS_KEYS.ui, { collapsed: false }).collapsed);
  const { user, logout } = useAuth();
  const { isOnline } = useApp();

  const toggle = () => {
    setCollapsed((c) => {
      const next = !c;
      saveToStorage(LS_KEYS.ui, { collapsed: next });
      return next;
    });
  };

  const nav = [
    { to: "/", icon: Home, label: "Inicio" },
    { to: "/ventas", icon: TrendingUp, label: "Ventas" },
    { to: "/liquidaciones", icon: PiggyBank, label: "Liquidaciones" },
    { to: "/colaboradores", icon: Users, label: "Colaboradores" },
    { to: "/gestion", icon: Database, label: "Gestión" },
    { to: "/reglas", icon: Target, label: "Reglas" },
    { to: "/importar", icon: FileSpreadsheet, label: "Importar" },
    { to: "/config", icon: Settings, label: "Config" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-sky-50 dark:bg-gradient-to-br dark:from-gray-900 dark:to-gray-800 text-slate-800 dark:text-gray-200 transition-colors">
      <div className="flex">
        {/* ============ SIDEBAR ============ */}
        <aside
          className={`h-screen sticky top-0 border-r border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-800 ${collapsed ? "w-16" : "w-64"} transition-all duration-200 flex flex-col`}
          aria-label="Menú lateral"
        >
          {/* Header del Sidebar */}
          <div className="flex items-center justify-between p-3 border-b border-slate-200 dark:border-gray-700">
            <div className="font-bold text-slate-900 dark:text-gray-100" aria-label="Nombre de la aplicación">
              {collapsed ? "CV" : "Control Ventas"}
            </div>
            <button
              className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-gray-700 text-slate-600 dark:text-gray-400 transition-colors"
              onClick={toggle}
              aria-label={collapsed ? "Expandir menú" : "Colapsar menú"}
            >
              {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
          </div>

          {/* Navegación */}
          <nav className="px-2 py-2 space-y-1 flex-1" role="navigation" aria-label="Navegación principal">
            {nav.map((n) => {
              const isActive = location.pathname === n.to;
              return (
                <Link
                  key={n.to}
                  to={n.to}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                    isActive 
                      ? "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-medium" 
                      : "text-slate-700 dark:text-gray-300 hover:bg-slate-100 dark:hover:bg-gray-700"
                  }`}
                  aria-current={isActive ? "page" : undefined}    
                  title={collapsed ? n.label : undefined}
                  tabIndex={0}
                >
                  <n.icon className="w-4 h-4" aria-hidden="true" />
                  {!collapsed && <span>{n.label}</span>}
                </Link>
              );
            })}
          </nav>

          {/* Usuario y Logout */}
          {!collapsed && user && (
            <div className="p-3 border-t border-slate-200 dark:border-gray-700">
              <div className="text-xs text-slate-600 dark:text-gray-400 mb-2" aria-label="Usuario actual">
                {user.nombre || user.email}
              </div>
              <button
                onClick={logout}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-red-50 dark:bg-red-900/30 hover:bg-red-100 dark:hover:bg-red-800/50 text-red-700 dark:text-red-400 transition-colors"
                aria-label="Cerrar sesión"
              >
                <LogOut className="w-4 h-4" />
                Cerrar Sesión
              </button>
            </div>
          )}

          {/* Footer del Sidebar */}
          <div className="p-3 text-xs text-slate-500 dark:text-gray-400 border-t border-slate-200 dark:border-gray-700">  
            <div className="flex items-center gap-1">
              <Database className="w-3 h-3" /> Solo Local
            </div>
            <div>v2.3</div>
          </div>
        </aside>

        {/* ============ MAIN CONTENT ============ */}
        <main className="flex-1 min-w-0">
          {/* StatusWidgets incluye PWAUpdatePrompt y OfflineStatus */}
          <StatusWidgets />
          
          {/* Header */}
          <header className="sticky top-0 z-10 bg-white/70 dark:bg-gray-800/80 backdrop-blur border-b border-slate-200 dark:border-gray-700">
            <div className="max-w-7xl mx-auto px-4 py-2 flex items-center gap-2"> 
              <div className="flex items-center gap-2 px-3 py-2 bg-slate-100 dark:bg-gray-700 rounded-xl flex-1">
                <Search className="w-4 h-4 text-slate-400 dark:text-gray-400" aria-hidden="true" />
                <input
                  className="bg-transparent outline-none text-sm w-full text-slate-900 dark:text-gray-100 placeholder-slate-400 dark:placeholder-gray-500"
                  placeholder="Buscar…"
                  aria-label="Buscar"
                />
              </div>

              {/* Log de estado de sincronización dinámico */}
              <div
                className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl shadow-sm"
                style={{
                  minWidth: 150,
                  background: '#23293C',
                  transition: 'background 0.3s',
                  opacity: isOnline ? 1 : 0.85
                }}
              >
                <div
                  className="flex items-center justify-center w-7 h-7 rounded-lg"
                  style={{
                    background: isOnline ? '#6FCF97' : '#F2994A',
                    transition: 'background 0.3s'
                  }}
                >
                  {isOnline ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M2.5 8.5C7.5 4.5 16.5 4.5 21.5 8.5" stroke="#fff" strokeWidth="2" strokeLinecap="round"/>
                      <path d="M5.5 12C9 9 15 9 18.5 12" stroke="#fff" strokeWidth="2" strokeLinecap="round"/>
                      <path d="M8.5 15.5C10 14.5 14 14.5 15.5 15.5" stroke="#fff" strokeWidth="2" strokeLinecap="round"/>
                      <circle cx="12" cy="18" r="1.5" fill="#fff"/>
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M2.5 8.5C7.5 4.5 16.5 4.5 21.5 8.5" stroke="#fff" strokeWidth="2" strokeLinecap="round"/>
                      <path d="M5.5 12C9 9 15 9 18.5 12" stroke="#fff" strokeWidth="2" strokeLinecap="round"/>
                      <path d="M8.5 15.5C10 14.5 14 14.5 15.5 15.5" stroke="#fff" strokeWidth="2" strokeLinecap="round"/>
                      <circle cx="12" cy="18" r="1.5" fill="#fff"/>
                      <line x1="6" y1="22" x2="22" y2="6" stroke="#fff" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                  )}
                </div>
                <div className="flex flex-col">
                  <span className="text-[8px] font-bold tracking-widest text-[#AEB6C8]" style={{ letterSpacing: 1.2 }}>STATUS</span>
                  <span className="text-sm font-extrabold text-white leading-3">
                    {isOnline ? 'Sincronizado' : 'Offline'}
                  </span>
                </div>
              </div>

              <DarkModeToggle />
              <button
                className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-gray-700 text-slate-600 dark:text-gray-400 transition-colors"
                title="Notificaciones"
                aria-label="Ver notificaciones"
              >
                <Bell className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>
          </header>
          
          {/* Contenido Principal */}
          <div className="w-full px-2 sm:px-4 lg:px-8 py-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}