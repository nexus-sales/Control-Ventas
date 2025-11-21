import React from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight, LogOut } from "lucide-react";

export function Sidebar({ collapsed, toggle, nav = [], location, user, logout }) {
  return (
    <aside
      className={`h-screen sticky top-0 border-r border-pink-200 dark:border-pink-400 bg-pink-50 dark:bg-pink-200 ${
        collapsed ? "w-16" : "w-64"
      } transition-all duration-200 flex flex-col`}
    >
      <div className="flex items-center justify-between p-3">
        <div className="font-bold text-pink-700 dark:text-pink-900">
          {collapsed ? "CV" : "Control Ventas"}
        </div>
        <button
          className="p-2 rounded-lg hover:bg-pink-100 dark:hover:bg-pink-300"
          onClick={toggle}
          aria-label="Toggle sidebar"
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4 text-pink-700 dark:text-pink-900" />
          ) : (
            <ChevronLeft className="w-4 h-4 text-pink-700 dark:text-pink-900" />
          )}
        </button>
      </div>

      <nav className="px-2 space-y-1 flex-1">
        {nav.map((n) => (
          <Link
            key={n.to}
            to={n.to}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-pink-100 dark:hover:bg-pink-300 ${
              location.pathname === n.to ? "bg-pink-100 dark:bg-pink-300" : ""
            }`}
          >
            <n.icon className="w-4 h-4 text-pink-700 dark:text-pink-900" />
            {!collapsed && <span className="text-pink-700 dark:text-pink-900">{n.label}</span>}
          </Link>
        ))}
      </nav>

      {/* Usuario y Logout */}
      {!collapsed && user && (
        <div className="p-3 border-t border-pink-200 dark:border-pink-400">
          <div className="text-xs text-pink-700 dark:text-pink-900 mb-2">
            {user.nombre || user.email}
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-pink-200 hover:bg-pink-300 dark:bg-pink-400 dark:hover:bg-pink-500 text-pink-900 dark:text-pink-50"
          >
            <LogOut className="w-4 h-4" />
            Cerrar Sesi3n
          </button>
        </div>
      )}
      <div className="p-3 text-xs text-pink-500 dark:text-pink-700 border-t border-pink-200 dark:border-pink-400">
        <div>Modo Local</div>
        <div>v2.3</div>
      </div>
    </aside>
  );
}
