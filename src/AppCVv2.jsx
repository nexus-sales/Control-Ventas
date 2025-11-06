import React from "react";
import ThemeProvider from './context/ThemeContext';
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { ErrorBoundary } from "./components/common/ErrorBoundary";
import { AuthProvider } from "./context/AuthContext";
import { DataProvider } from "./context/DataContext";
import { LayoutShell } from "./components/layout/LayoutShell";
import Loading from "./components/common/Loading";
import { GuardedRoute } from "./components/auth/GuardedRoute";
import OfflineStatus from "./components/widgets/OfflineStatus";
import { useAuth } from "./hooks/useAuth";

// ============================
// Importaciones directas (sin lazy loading)
// ============================
import Dashboard from "./components/Dashboard";
import VentasPage from "./components/ventas/VentasPage";
import LiquidacionesPage from "./components/LiquidacionesPage";
import Colaboradores from "./components/Colaboradores";
import Reglas from "./components/Reglas";
import ImportExcelMapperWrapper from "./components/ImportExcelMapperWrapper";
import Config from "./components/Config.jsx";
import LoginScreen from "./components/auth/LoginScreen";

// ============================
// App Routes Component (dentro de los providers)
// ============================
function AppRoutes() {
  const { isLogged, isAuthLoading } = useAuth();

  if (isAuthLoading) {
    return <Loading message="Iniciando autenticación..." />;
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-white transition-colors duration-300">
      <Router>
        {isLogged ? (
          <LayoutShell>
            <OfflineStatus />
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/ventas" element={<GuardedRoute roles={["admin", "manager", "comercial"]}><VentasPage /></GuardedRoute>} />
              <Route path="/liquidaciones" element={<GuardedRoute roles={["admin", "manager"]}><LiquidacionesPage /></GuardedRoute>} />
              <Route path="/colaboradores" element={<GuardedRoute roles={["admin", "manager"]}><Colaboradores /></GuardedRoute>} />
              <Route path="/reglas" element={<GuardedRoute roles={["admin", "manager"]}><Reglas /></GuardedRoute>} />
              <Route path="/importar" element={<GuardedRoute roles={["admin", "manager"]}><ImportExcelMapperWrapper /></GuardedRoute>} />
              <Route path="/config" element={<GuardedRoute roles={["admin", "manager"]}><Config /></GuardedRoute>} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </LayoutShell>
        ) : (
          <Routes>
            <Route path="/login" element={<LoginScreen />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        )}
      </Router>
    </div>
  );
}

// ============================
// App Principal
// ============================
export default function AppCVv2() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <DataProvider>
            <AppRoutes />
          </DataProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

// Exportar contextos para compatibilidad
export { AuthCtx, DataCtx } from './context/contexts';