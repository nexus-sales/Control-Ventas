import React from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight, LogOut } from "lucide-react";

export function Sidebar({ collapsed, toggle, nav = [], location, user, logout }) {
  return (
    <aside
      className={`h-screen sticky top-0 border-r border-[var(--brand-primary)]/20 bg-[var(--brand-primary)]/5 ${collapsed ? "w-16" : "w-64"
        } transition-all duration-200 flex flex-col`}
    >
      <div className="flex items-center justify-between p-3">
        <div className="font-bold text-[var(--brand-primary)]">
          {collapsed ? "CV" : "Control Ventas"}
        </div>
        <button
          className="p-2 rounded-lg hover:bg-[var(--brand-primary)]/10"
          onClick={toggle}
          aria-label="Toggle sidebar"
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4 text-[var(--brand-primary)]" />
          ) : (
            <ChevronLeft className="w-4 h-4 text-[var(--brand-primary)]" />
          )}
        </button>
      </div>

      <nav className="px-2 space-y-1 flex-1">
        {nav.map((n) => (
          <Link
            key={n.to}
            to={n.to}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-[var(--brand-primary)]/10 ${location.pathname === n.to ? "bg-[var(--brand-primary)]/10" : ""
              }`}
          >
            <n.icon className="w-4 h-4 text-[var(--brand-primary)]" />
            {!collapsed && <span className="text-[var(--brand-primary)]">{n.label}</span>}
          </Link>
        ))}
      </nav>

      {/* Usuario y Logout */}
      {!collapsed && user && (
        <div className="p-3 border-t border-[var(--brand-primary)]/20">
          <div className="text-xs text-[var(--brand-primary)] mb-2">
            {user.nombre || user.email}
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--brand-primary)]/10 hover:bg-[var(--brand-primary)]/20 text-[var(--brand-primary)]"
          >
            <LogOut className="w-4 h-4" />
            Cerrar Sesión
          </button>
        </div>
      )}
      <div className="p-3 text-xs text-[var(--brand-primary)]/60 border-t border-[var(--brand-primary)]/20">
        <div>Modo Local</div>
        <div>v2.3</div>
      </div>
    </aside>
  );
}
