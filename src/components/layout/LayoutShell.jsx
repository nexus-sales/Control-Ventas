import React, { useState } from "react";
import { Link, useLocation, Outlet } from "react-router-dom";
import {
  Home, TrendingUp, Users, Settings, FileSpreadsheet, PiggyBank, Target,
  ChevronLeft, ChevronRight, Bell, Search, LogOut, Database
} from "lucide-react";
import { useAuth, useApp } from "../../context/AppContexts";
import DarkModeToggle from "../ui/DarkModeToggle";
import { LS_KEYS } from "../../utils/constants";
import { getFromStorage, saveToStorage } from "../../utils/storage";
import { cn } from "../../lib/utils";

export function LayoutShell({ children }) {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(() => getFromStorage(LS_KEYS.ui, { collapsed: false }).collapsed);
  const { user, profile, signOut } = useAuth();
  const { isOnline } = useApp();
  const [empresaLocal, setEmpresaLocal] = useState(null);

  React.useEffect(() => {
    const loadEmpresa = () => {
      try {
        const raw = localStorage.getItem("empresaData");
        if (raw) setEmpresaLocal(JSON.parse(raw));
      } catch (e) {
        console.error("Error cargando empresa:", e);
      }
    };
    loadEmpresa();
    window.addEventListener("empresaDataUpdated", (e) => setEmpresaLocal(e.detail));
    return () => window.removeEventListener("empresaDataUpdated", loadEmpresa);
  }, []);

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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200">
      <div className="flex">
        {/* SIDEBAR */}
        <aside
          className={cn(
            "h-screen sticky top-0 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 z-20 flex flex-col transition-all duration-300",
            collapsed ? "w-[60px]" : "w-[220px]"
          )}
          aria-label="Menú lateral"
        >
          {/* Logo */}
          <div className="flex items-center justify-between px-3 py-4 border-b border-slate-100 dark:border-slate-800">
            {!collapsed && (
              <div className="flex items-center gap-2.5 overflow-hidden">
                {empresaLocal?.logoUrl ? (
                  <img
                    src={empresaLocal.logoUrl}
                    alt="Logo"
                    className="w-7 h-7 object-contain rounded"
                  />
                ) : (
                  <div className="w-7 h-7 rounded bg-indigo-600 flex items-center justify-center shrink-0">
                    <Database className="w-4 h-4 text-white" />
                  </div>
                )}
                <span className="font-semibold text-sm text-slate-900 dark:text-white truncate">
                  {empresaLocal?.nombre || "NextSales"}
                </span>
              </div>
            )}
            <button
              className={cn(
                "p-1.5 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors",
                collapsed && "mx-auto"
              )}
              onClick={toggle}
              aria-label={collapsed ? "Expandir menú" : "Colapsar menú"}
            >
              {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
          </div>

          {/* Navegación */}
          <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto" role="navigation">
            {nav.map((n) => {
              const isActive = location.pathname === n.to;
              return (
                <Link
                  key={n.to}
                  to={n.to}
                  title={collapsed ? n.label : undefined}
                  className={cn(
                    "flex items-center gap-3 px-2.5 py-2 rounded-md text-sm transition-colors",
                    isActive
                      ? "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 font-medium"
                      : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
                  )}
                  aria-current={isActive ? "page" : undefined}
                >
                  <n.icon className="w-4 h-4 shrink-0" aria-hidden="true" />
                  {!collapsed && <span className="truncate">{n.label}</span>}
                </Link>
              );
            })}
          </nav>

          {/* Usuario */}
          {user && (
            <div className="border-t border-slate-100 dark:border-slate-800 p-2 space-y-1">
              {!collapsed && (
                <div className="flex items-center gap-2.5 px-2.5 py-2">
                  <div className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-semibold shrink-0">
                    {(profile?.nombre_completo || profile?.nombre || user.email || "?")[0].toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-slate-900 dark:text-white truncate">
                      {profile?.nombre_completo || profile?.nombre || user.email?.split('@')[0]}
                    </p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-500 truncate">
                      {profile?.rol || "Usuario"}
                    </p>
                  </div>
                </div>
              )}
              <button
                onClick={signOut}
                className={cn(
                  "w-full flex items-center gap-2 px-2.5 py-2 rounded-md text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-rose-600 dark:hover:text-rose-400 transition-colors",
                  collapsed && "justify-center"
                )}
                title={collapsed ? "Cerrar Sesión" : undefined}
              >
                <LogOut className="w-4 h-4 shrink-0" />
                {!collapsed && <span>Cerrar sesión</span>}
              </button>
            </div>
          )}
        </aside>

        {/* MAIN */}
        <main className="flex-1 min-w-0 min-h-screen">
          {/* Header */}
          <header className="sticky top-0 z-10 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
            <div className="px-6 py-3 flex items-center gap-3">
              {/* Buscador */}
              <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md flex-1 max-w-md">
                <Search className="w-4 h-4 text-slate-400 shrink-0" aria-hidden="true" />
                <input
                  className="bg-transparent outline-none text-sm w-full text-slate-900 dark:text-slate-100 placeholder-slate-400"
                  placeholder="Buscar…"
                  aria-label="Buscar"
                />
              </div>

              <div className="flex items-center gap-1 ml-auto">
                {/* Estado conexión */}
                <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium text-slate-600 dark:text-slate-400">
                  <div className={cn(
                    "w-1.5 h-1.5 rounded-full",
                    isOnline ? "bg-emerald-500" : "bg-amber-500"
                  )} />
                  {isOnline ? "Conectado" : "Offline"}
                </div>

                <DarkModeToggle />

                <button
                  className="p-1.5 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  title="Notificaciones"
                  aria-label="Ver notificaciones"
                >
                  <Bell className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>
            </div>
          </header>

          {/* Contenido */}
          <div className="px-6 py-6">
            {children || <Outlet />}
          </div>
        </main>
      </div>
    </div>
  );
}
