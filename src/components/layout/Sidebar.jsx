import React from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight, LogOut } from "lucide-react";

export function Sidebar({ collapsed, toggle, nav, location, user, logout }) {
  return (
    <aside
      className={`h-screen sticky top-0 border-r border-slate-200 dark:border-gray-800 bg-white dark:bg-gray-900 ${
        collapsed ? "w-16" : "w-64"
      } transition-all duration-200 flex flex-col`}
    >
      <div className="flex items-center justify-between p-3">
        <div className="font-bold text-slate-900 dark:text-white">
          {collapsed ? "CV" : "Control Ventas"}
        </div>
        <button
          className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-gray-800"
          onClick={toggle}
          aria-label="Toggle sidebar"
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4 dark:text-white" />
          ) : (
            <ChevronLeft className="w-4 h-4 dark:text-white" />
          )}
        </button>
      </div>

      <nav className="px-2 space-y-1 flex-1">
        {nav.map((n) => (
          <Link
            key={n.to}
            to={n.to}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-gray-800 ${
              location.pathname === n.to ? "bg-slate-100 dark:bg-gray-800" : ""
            }`}
          >
            <n.icon className="w-4 h-4 dark:text-white" />
            {!collapsed && <span className="text-slate-800 dark:text-white">{n.label}</span>}
          </Link>
        ))}
      </nav>

      {/* Usuario y Logout */}
      {!collapsed && user && (
        <div className="p-3 border-t border-slate-200 dark:border-gray-800">
          <div className="text-xs text-slate-600 dark:text-gray-300 mb-2">
            {user.nombre || user.email}
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-red-50 hover:bg-red-100 dark:bg-red-900 dark:hover:bg-red-800 text-red-700 dark:text-red-200"
          >
            <LogOut className="w-4 h-4" />
            Cerrar Sesi3n
          </button>
        </div>
      )}
      <div className="p-3 text-xs text-slate-500 dark:text-gray-400 border-t border-slate-200 dark:border-gray-800">
        <div>Modo Local</div>
        <div>v2.3</div>
      </div>
    </aside>
  );
}
