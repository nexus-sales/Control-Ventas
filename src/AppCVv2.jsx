import React, { lazy, Suspense } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { ErrorBoundary } from "./components/common/ErrorBoundary";
import { AppContextProvider } from "./context/AppContexts";
import { CorporateThemeProvider } from "./context/CorporateTheme";
import { LayoutShell } from "./components/layout/LayoutShell";
import Loading from "./components/common/Loading";
import StatusWidgets from "./components/widgets/StatusWidgets";
import AccessDeniedScreen from "./components/auth/AccessDeniedScreen";
import { useAuth } from "./context/AppContexts";

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
const GestionSections = lazy(() => import("./components/gestion/GestionSections"));

// Construye el motivo real de por qué ProtectedRoute bloquea el acceso, a
// partir del perfil que de verdad se cargó (usuarios_cv + profiles) — antes
// AccessDeniedScreen recurría a un sistema de emails hardcodeados
// (accessControl.js) desconectado del estado real, así que un fallo de red
// al cargar el perfil mostraba EXACTAMENTE el mismo mensaje que una cuenta
// legítimamente inactiva, sin forma de distinguirlos.
function resolveAccessDeniedInfo({ profile, isActive, hasAppAccess }) {
  if (!profile) {
    return {
      title: 'No se pudo verificar tu acceso',
      message: 'Hubo un problema al cargar tu perfil (posible fallo de red o de permisos). Recarga la página; si el problema persiste, contacta con tu administrador.',
    };
  }
  if (!isActive) {
    return {
      title: 'Acceso Pendiente',
      message: 'Tu cuenta todavía no ha sido activada. Contacta con un administrador para que apruebe tu acceso.',
    };
  }
  if (!hasAppAccess) {
    return {
      title: 'Sin acceso a esta aplicación',
      message: 'Tu cuenta está activa pero no tiene concedido el acceso a Control de Ventas. Pide a un administrador que te lo active.',
    };
  }
  return null;
}

function ProtectedRoute({ children, requireAdmin = false }) {
  const { user, profile, loading, isAuthenticated, isActive, hasAppAccess, isAdmin } = useAuth();

  if (loading) return <Loading />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!isActive || !hasAppAccess) {
    return (
      <AccessDeniedScreen
        email={user?.email}
        accessInfo={resolveAccessDeniedInfo({ profile, isActive, hasAppAccess })}
        onBackToLogin={() => window.location.assign("/login")}
      />
    );
  }
  if (requireAdmin && !isAdmin) {
    return (
      <AccessDeniedScreen
        email={user?.email}
        accessInfo={{
          title: "Acceso restringido",
          message: "Necesitas permisos de administrador para entrar en esta seccion.",
        }}
      />
    );
  }

  return children;
}

// Componente Layout que envuelve las rutas principales
function MainLayout() {
  return (
    <ProtectedRoute>
      <LayoutShell>
        <Outlet />
        <StatusWidgets />
      </LayoutShell>
    </ProtectedRoute>
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
