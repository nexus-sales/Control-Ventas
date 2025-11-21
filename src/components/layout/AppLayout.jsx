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
import { useState, useContext } from 'react';
import { useLocation } from 'react-router-dom';
import AuthCtx from '../../context/AuthCtx';
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
  const { user, logout } = useContext(AuthCtx);
  const toggleSidebar = () => setCollapsed((prev) => !prev);

  return (
    <div className="min-h-screen bg-pink-50 dark:bg-pink-200 flex flex-col">
      <Header />
      <div className="flex flex-1 w-full">
        <div className={`${collapsed ? 'w-16' : 'w-64'} min-w-[56px] max-w-[280px] bg-pink-50 dark:bg-pink-200 border-r border-pink-200 dark:border-pink-400`}>
          <Sidebar
            collapsed={collapsed}
            toggle={toggleSidebar}
            nav={NAV_MODULES}
            location={location}
            user={user}
            logout={logout}
          />
        </div>
        <main className="flex-1 px-6 py-8 overflow-y-auto bg-pink-50 dark:bg-pink-200">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
