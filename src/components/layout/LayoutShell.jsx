
import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { 
  Home, TrendingUp, Users, Settings, FileSpreadsheet, PiggyBank, Target,
  ChevronLeft, ChevronRight, Bell, Search, LogOut, Database, RefreshCw
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { useData } from "../../hooks/useData";
import PWAUpdatePrompt from "../widgets/PWAUpdatePrompt";
import DarkModeToggle from "../ui/DarkModeToggle";
import { LS_KEYS } from "../../utils/constants";
import { loadLS, saveLS } from "../../utils/storage";

  export function LayoutShell({ children }) {
    const location = useLocation();
    const [collapsed, setCollapsed] = useState(() => loadLS(LS_KEYS.ui, { collapsed: false }).collapsed);
    const [syncing, setSyncing] = useState(false);
    const [syncFeedback, setSyncFeedback] = useState("");
    const { user, logout } = useAuth();
    const { isSupabaseAvailable, syncAll } = useData();

    const toggle = () => {
      setCollapsed((c) => {
        const next = !c;
        saveLS(LS_KEYS.ui, { collapsed: next });
        return next;
      });
    };

    const handleSync = async () => {
      if (!isSupabaseAvailable || syncing) return;
      setSyncing(true);
      setSyncFeedback("");
      try {
        await syncAll();
        setSyncFeedback("¡Sincronización completada!");
        setTimeout(() => setSyncFeedback(""), 2000);
      } catch (error) {
        setSyncFeedback("Error al sincronizar");
        setTimeout(() => setSyncFeedback(""), 3000);
        console.error('Error en sincronización:', error);
      } finally {
        setSyncing(false);
      }
    };

    const nav = [
      { to: "/", icon: Home, label: "Inicio" },
      { to: "/ventas", icon: TrendingUp, label: "Ventas" },
      { to: "/liquidaciones", icon: PiggyBank, label: "Liquidaciones" },
      { to: "/colaboradores", icon: Users, label: "Colaboradores" },
      { to: "/reglas", icon: Target, label: "Reglas" },
      { to: "/importar", icon: FileSpreadsheet, label: "Importar" },
      { to: "/config", icon: Settings, label: "Config" },
    ];

    return (
  <div className="min-h-screen bg-gradient-to-br from-slate-50 to-sky-50 text-slate-800 dark:bg-gradient-to-br dark:from-darkBg dark:to-gray-900 dark:text-darkText transition-colors">
  <div className="flex">
          <aside
            className={`h-screen sticky top-0 border-r border-slate-200 bg-white dark:bg-darkCard dark:border-darkBg ${collapsed ? "w-16" : "w-64"} transition-all duration-200 flex flex-col`}
            aria-label="Menú lateral"
          >
            <div className="flex items-center justify-between p-3">
              <div className="font-bold text-slate-900" aria-label="Nombre de la aplicación">
                {collapsed ? "CV" : "Control Ventas"}
              </div>
              <button
                className="p-2 rounded-lg hover:bg-slate-100"
                onClick={toggle}
                aria-label={collapsed ? "Expandir menú" : "Colapsar menú"}
              >
                {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
              </button>
            </div>

            <nav className="px-2 space-y-1 flex-1" role="navigation" aria-label="Navegación principal">
              {nav.map((n) => (
                <Link
                  key={n.to}
                  to={n.to}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-100 ${location.pathname === n.to ? "bg-slate-100" : ""}`}
                  aria-current={location.pathname === n.to ? "page" : undefined}
                  title={collapsed ? n.label : undefined}
                  tabIndex={0}
                >
                  <n.icon className="w-4 h-4" aria-hidden="true" />
                  {!collapsed && <span>{n.label}</span>}
                </Link>
              ))}
            </nav>

            {/* Botón de sincronización */}
            {isSupabaseAvailable && !collapsed && (
              <div className="p-3 border-t border-slate-200">
                <button
                  onClick={handleSync}
                  disabled={syncing}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 disabled:opacity-50"
                  aria-label="Sincronizar datos"
                >
                  <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
                  {syncing ? 'Sincronizando...' : 'Sincronizar'}
                </button>
                {syncFeedback && (
                  <div className="mt-2 text-xs text-green-600" role="status">
                    {syncFeedback}
                  </div>
                )}
              </div>
            )}

            {/* Usuario y Logout */}
            {!collapsed && user && (
              <div className="p-3 border-t border-slate-200">
                <div className="text-xs text-slate-600 mb-2" aria-label="Usuario actual">
                  {user.nombre || user.email}
                </div>
                <button
                  onClick={logout}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-red-50 hover:bg-red-100 text-red-700"
                  aria-label="Cerrar sesión"
                  disabled={syncing}
                >
                  <LogOut className="w-4 h-4" />
                  Cerrar Sesión
                </button>
              </div>
            )}

            <div className="p-3 text-xs text-slate-500 border-t border-slate-200">
              <div className="flex items-center gap-1">
                <Database className="w-3 h-3" /> 
                {isSupabaseAvailable ? 'Supabase + Local' : 'Solo Local'}
              </div>
              <div>v2.3</div>
            </div>
          </aside>

          <main className="flex-1 min-w-0">
            <PWAUpdatePrompt />
            <header className="sticky top-0 z-10 bg-white/70 dark:bg-darkCard/80 backdrop-blur border-b border-slate-200 dark:border-darkBg">
              <div className="max-w-7xl mx-auto px-4 py-2 flex items-center gap-2">
                <div className="flex items-center gap-2 px-3 py-2 bg-slate-100 dark:bg-darkBg rounded-xl flex-1">
                  <Search className="w-4 h-4" aria-hidden="true" />
                  <input
                    className="bg-transparent outline-none text-sm w-full dark:text-darkText"
                    placeholder="Buscar…"
                    aria-label="Buscar"
                  />
                </div>
                <DarkModeToggle />
                <button
                  className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-darkBg"
                  title="Notificaciones"
                  aria-label="Ver notificaciones"
                >
                  <Bell className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>
            </header>
            <div className="max-w-7xl mx-auto p-4">{children}</div>
          </main>
        </div>
      </div>
    );
  }
