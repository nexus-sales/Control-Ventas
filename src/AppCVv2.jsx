import React, { lazy, Suspense } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { ErrorBoundary } from "./components/common/ErrorBoundary";
import { AppContextProvider } from "./context/AppContexts";
import { CorporateThemeProvider } from "./context/CorporateTheme";
import { LayoutShell } from "./components/layout/LayoutShell";
import Loading from "./components/common/Loading";
import StatusWidgets from "./components/widgets/StatusWidgets";

// Componentes cargados inmediatamente (críticos para la primera carga)
import Dashboard from "./components/Dashboard";
import LoginScreen from "./components/auth/LoginScreen";
import ResetPasswordScreen from "./components/auth/ResetPasswordScreen";

// Lazy loading para componentes pesados (mejora el rendimiento inicial)
const VentasPage = lazy(() => import("./components/ventas/VentasPage"));
const LiquidacionesPage = lazy(() => import("./components/LiquidacionesPage"));
const Colaboradores = lazy(() => import("./components/Colaboradores"));
const Reglas = lazy(() => import("./components/Reglas"));
const ImportExcelMapperWrapper = lazy(() => import("./components/ImportExcelMapperWrapper"));
const Config = lazy(() => import("./components/Config.jsx"));
const Administracion = lazy(() => import("./components/admin/Administracion.jsx"));
const GestionSections = lazy(() => import("./components/gestion/GestionSections"));

// Componente Layout que envuelve las rutas principales
function MainLayout() {
  return (
    <LayoutShell>
      <Outlet />
      <StatusWidgets />
    </LayoutShell>
  );
}

// Componente de rutas principales
function AppContent() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-white transition-colors duration-300">
      <Routes>
        {/* Rutas públicas */}
        <Route path="/login" element={<LoginScreen />} />
        <Route path="/reset-password" element={<ResetPasswordScreen />} />

        {/* Rutas principales con layout */}
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="ventas" element={<Suspense fallback={<Loading />}><VentasPage /></Suspense>} />
          <Route path="liquidaciones" element={<Suspense fallback={<Loading />}><LiquidacionesPage /></Suspense>} />
          <Route path="colaboradores" element={<Suspense fallback={<Loading />}><Colaboradores /></Suspense>} />
          <Route path="reglas" element={<Suspense fallback={<Loading />}><Reglas /></Suspense>} />
          <Route path="importar" element={<Suspense fallback={<Loading />}><ImportExcelMapperWrapper /></Suspense>} />
          <Route path="config" element={<Suspense fallback={<Loading />}><Config /></Suspense>} />
          <Route path="gestion" element={<Suspense fallback={<Loading />}><GestionSections /></Suspense>} />
          <Route path="admin/administracion" element={<Suspense fallback={<Loading />}><Administracion /></Suspense>} />

          {/* Redirección por defecto */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </div>
  );
}

// App principal con providers
export default function AppCVv2() {
  return (
    <AppContextProvider>
      <CorporateThemeProvider>
        <ErrorBoundary>
          <AppContent />
        </ErrorBoundary>
      </CorporateThemeProvider>
    </AppContextProvider>
  );
}