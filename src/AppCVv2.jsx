import React, { useContext } from "react";
import ThemeProvider from "./context/ThemeContext";
import { Routes, Route, Navigate } from "react-router-dom";
import { ErrorBoundary } from "./components/common/ErrorBoundary";
import { AuthProvider } from "./context/AuthContext";
import { DataContextProvider } from "./context/DataContext";
import AuthCtx from "./context/AuthCtx";
import { LayoutShell } from "./components/layout/LayoutShell";
import Loading from "./components/common/Loading";
import { GuardedRoute } from "./components/auth/GuardedRoute";
import StatusWidgets from "./components/widgets/StatusWidgets";

import Dashboard from "./components/Dashboard";
import VentasPage from "./components/ventas/VentasPage";
import LiquidacionesPage from "./components/LiquidacionesPage";
import Colaboradores from "./components/Colaboradores";
import Reglas from "./components/Reglas";
import ImportExcelMapperWrapper from "./components/ImportExcelMapperWrapper";
import Config from "./components/Config.jsx";
import LoginScreen from "./components/auth/LoginScreen";
import ResetPasswordScreen from "./components/auth/ResetPasswordScreen";
import Administracion from "./components/admin/Administracion.jsx";
import GestionSections from "./components/gestion/GestionSections";

function AppRoutes() {
  const { isLogged, isAuthLoading, user } = useContext(AuthCtx);

  if (isAuthLoading) {
    return <Loading message="Iniciando autenticación..." />;
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-white transition-colors duration-300">
      <Routes>
        {/* Rutas públicas */}
        <Route path="/login" element={<LoginScreen />} />
        <Route path="/reset-password" element={<ResetPasswordScreen />} />

        {/* Redirección desde '/' a '/login' si no está logueado */}
        {!isLogged || !user ? (
          <Route path="/" element={<Navigate to="/login" replace />} />
        ) : (
          <Route path="/" element={<LayoutShell />}>
            <Route index element={<Dashboard />} />
            <Route
              path="ventas"
              element={
                <GuardedRoute roles={["admin", "manager", "comercial"]}>
                  <VentasPage />
                </GuardedRoute>
              }
            />
            <Route
              path="liquidaciones"
              element={
                <GuardedRoute roles={["admin", "manager"]}>
                  <LiquidacionesPage />
                </GuardedRoute>
              }
            />
            <Route
              path="colaboradores"
              element={
                <GuardedRoute roles={["admin", "manager"]}>
                  <Colaboradores />
                </GuardedRoute>
              }
            />
            <Route
              path="reglas"
              element={
                <GuardedRoute roles={["admin", "manager"]}>
                  <Reglas />
                </GuardedRoute>
              }
            />
            <Route
              path="importar"
              element={
                <GuardedRoute roles={["admin", "manager"]}>
                  <ImportExcelMapperWrapper />
                </GuardedRoute>
              }
            />
            <Route
              path="config"
              element={
                <GuardedRoute roles={["admin", "manager"]}>
                  <Config />
                </GuardedRoute>
              }
            />
            <Route
              path="gestion"
              element={
                <GuardedRoute roles={["admin", "manager"]}>
                  <GestionSections />
                </GuardedRoute>
              }
            />
            <Route
              path="admin/administracion"
              element={
                <GuardedRoute roles={["admin", "manager"]}>
                  <Administracion />
                </GuardedRoute>
              }
            />
          </Route>
        )}
      </Routes>
    </div>
  );
}

export default function AppCVv2() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <DataContextProvider>
            <AppRoutes />
            <StatusWidgets />
          </DataContextProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}