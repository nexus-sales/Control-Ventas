import React from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

/**
 * AppLayout centraliza la estructura principal de la app:
 * - Sidebar de navegación
 * - Header superior
 * - Área de contenido principal
 * Mejora la consistencia visual y facilita la gestión de layout global.
 */
import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AppContexts';
import { Home, BarChart3, Euro, Users, Settings, SlidersHorizontal } from 'lucide-react';

const NAV_MODULES = [
  { to: '/', label: 'Dashboard', icon: Home },
  { to: '/ventas', label: 'Ventas', icon: BarChart3 },
  { to: '/liquidaciones', label: 'Liquidaciones', icon: Euro },
  { to: '/colaboradores', label: 'Colaboradores', icon: Users },
  { to: '/reglas', label: 'Reglas', icon: Settings },
  { to: '/config', label: 'Configuración', icon: SlidersHorizontal },
];

import { Outlet } from 'react-router-dom';

const AppLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const { user, logout } = useAuth();
  const toggleSidebar = () => setCollapsed((prev) => !prev);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gray-900 flex flex-col">
      <Header />
      <div className="flex flex-1 w-full">
        <div className={`${collapsed ? 'w-16' : 'w-64'} min-w-[56px] max-w-[280px] bg-[var(--brand-primary)]/5 border-r border-[var(--brand-primary)]/20`}>
          <Sidebar
            collapsed={collapsed}
            toggle={toggleSidebar}
            nav={NAV_MODULES}
            location={location}
            user={user}
            logout={logout}
          />
        </div>
        <main className="flex-1 px-6 py-8 overflow-y-auto bg-slate-50 dark:bg-gray-900">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
