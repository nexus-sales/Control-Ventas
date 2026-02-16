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
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "../../lib/utils";

import { BorderBeam } from "../ui/BorderBeam";

export function LayoutShell() {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(() => getFromStorage(LS_KEYS.ui, { collapsed: false }).collapsed);
  const { user, profile, signOut } = useAuth();
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
    <div className="min-h-screen bg-slate-50 dark:bg-[#0B0F1A] text-slate-800 dark:text-gray-200 transition-colors">
      <div className="flex relative">
        {/* ============ SIDEBAR PREMIUM ============ */}
        <motion.aside
          initial={false}
          animate={{ width: collapsed ? 84 : 300 }}
          transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
          className={cn(
            "h-screen sticky top-0 border-r border-slate-200/50 dark:border-white/5 bg-white/80 dark:bg-[#0B0F1A]/80 backdrop-blur-2xl z-20 flex flex-col transition-all shadow-2xl shadow-black/5",
          )}
          aria-label="Menú lateral"
        >
          {/* Header del Sidebar */}
          <div className="flex items-center justify-between p-5 mb-4">
            <AnimatePresence mode="wait">
              {!collapsed && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="flex items-center gap-3 px-1"
                >
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[var(--brand-primary)] to-[var(--brand-primary)] opacity-90 flex items-center justify-center shadow-lg shadow-[var(--brand-primary)]/20">
                    <Database className="w-5 h-5 text-white" />
                  </div>
                  <span className="font-black text-xl text-slate-800 dark:text-white tracking-tighter uppercase whitespace-nowrap">
                    NEXT<span className="text-[var(--brand-primary)] text-opacity-80">SALES</span>
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
            <button
              className="p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 text-slate-500 dark:text-gray-400 transition-all active:scale-90"
              onClick={toggle}
              aria-label={collapsed ? "Expandir menú" : "Colapsar menú"}
            >
              {collapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
            </button>
          </div>

          {/* Navegación Premium */}
          <nav className="px-4 py-2 space-y-1.5 flex-1 overflow-y-auto custom-scrollbar" role="navigation" aria-label="Navegación principal">
            {nav.map((n, idx) => {
              const isActive = location.pathname === n.to;
              return (
                <Link
                  key={n.to}
                  to={n.to}
                  className={cn(
                    "group flex items-center gap-4 px-4 py-3 rounded-2xl transition-all duration-300 relative overflow-hidden",
                    isActive
                      ? "bg-[var(--brand-primary)]/10 text-[var(--brand-primary)] font-bold shadow-sm border border-[var(--brand-primary)]/10"
                      : "text-slate-500 dark:text-gray-400 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white"
                  )}
                  aria-current={isActive ? "page" : undefined}
                  title={collapsed ? n.label : undefined}
                >
                  <n.icon className={cn("w-5 h-5 shrink-0 transition-all duration-300 group-hover:scale-110 group-active:scale-90", isActive && "text-[var(--brand-primary)]")} aria-hidden="true" />
                  <AnimatePresence>
                    {!collapsed && (
                      <motion.span
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        className="whitespace-nowrap font-bold text-sm uppercase tracking-widest"
                      >
                        {n.label}
                      </motion.span>
                    )}
                  </AnimatePresence>
                  {isActive && (
                    <motion.div
                      layoutId="nav-active-bar"
                      className="absolute right-0 w-1.5 h-6 bg-[var(--brand-primary)] rounded-l-full"
                    />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Usuario y Logout Premium */}
          {user && (
            <div className={cn(
              "mx-4 mb-4 p-4 rounded-3xl border border-slate-200/50 dark:border-white/5 transition-all relative overflow-hidden group",
              collapsed ? "items-center px-2" : "bg-white dark:bg-white/[0.02] shadow-xl shadow-black/5"
            )}>
              {!collapsed && <BorderBeam size={100} duration={10} colorFrom="var(--brand-primary)" colorTo="var(--brand-primary)" />}

              {!collapsed && (
                <div className="flex items-center gap-4 mb-4 relative z-10">
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[var(--brand-primary)] to-[var(--brand-primary)] flex items-center justify-center text-white font-black shadow-xl shadow-[var(--brand-primary)]/20 group-hover:rotate-6 transition-transform">
                    {(profile?.nombre || profile?.name || user.email || "?")[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-black text-slate-900 dark:text-white truncate uppercase tracking-tight">
                      {profile?.nombre || profile?.name || "Usuario Premium"}
                    </p>
                    <p className="text-[9px] text-slate-500 dark:text-gray-500 truncate font-bold uppercase tracking-widest mt-0.5">
                      {user.email.split('@')[0]}
                    </p>
                  </div>
                </div>
              )}

              <button
                onClick={signOut}
                className={cn(
                  "w-full flex items-center gap-2 px-3 py-2.5 rounded-xl transition-all duration-300 group/btn relative z-10",
                  collapsed
                    ? "justify-center hover:bg-red-500/10 text-red-500"
                    : "bg-red-500/5 hover:bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/10"
                )}
                title={collapsed ? "Cerrar Sesión" : undefined}
              >
                <LogOut className={cn("transition-all duration-300 group-hover/btn:rotate-12", collapsed ? "w-6 h-6" : "w-4 h-4")} />
                {!collapsed && <span className="text-[10px] font-black uppercase tracking-widest">Desconectar</span>}
              </button>
            </div>
          )}

          {/* Footer del Sidebar Premium */}
          <div className="p-6 border-t border-slate-200/50 dark:border-white/5">
            <div className="flex items-center justify-between">
              <AnimatePresence>
                {!collapsed && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-center gap-2"
                  >
                    <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/40 animate-pulse" />
                    <span className="text-[10px] font-black text-slate-400 dark:text-gray-500 uppercase tracking-[2px]">Cloud Sync</span>
                  </motion.div>
                )}
              </AnimatePresence>
              <div className="text-[10px] font-black text-blue-600/50 dark:text-blue-500/30 uppercase tracking-widest">v2.5</div>
            </div>
          </div>
        </motion.aside>

        {/* ============ MAIN CONTENT ============ */}
        <main className="flex-1 min-w-0 bg-slate-50/50 dark:bg-gray-950/50 min-h-screen relative">
          {/* StatusWidgets incluye PWAUpdatePrompt y OfflineStatus */}
          {/* <StatusWidgets /> */}

          {/* Header */}
          <header className="sticky top-0 z-10 bg-white/40 dark:bg-gray-900/40 backdrop-blur-md border-b border-slate-200/50 dark:border-gray-800/50">
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
                      <path d="M2.5 8.5C7.5 4.5 16.5 4.5 21.5 8.5" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
                      <path d="M5.5 12C9 9 15 9 18.5 12" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
                      <path d="M8.5 15.5C10 14.5 14 14.5 15.5 15.5" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
                      <circle cx="12" cy="18" r="1.5" fill="#fff" />
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M2.5 8.5C7.5 4.5 16.5 4.5 21.5 8.5" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
                      <path d="M5.5 12C9 9 15 9 18.5 12" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
                      <path d="M8.5 15.5C10 14.5 14 14.5 15.5 15.5" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
                      <circle cx="12" cy="18" r="1.5" fill="#fff" />
                      <line x1="6" y1="22" x2="22" y2="6" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
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