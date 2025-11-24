import React, { lazy, Suspense } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { ErrorBoundary } from "./components/common/ErrorBoundary";
import { AppContextProvider } from "./context/AppContexts";
import { LayoutShell } from "./components/layout/LayoutShell";
import Loading from "./components/common/Loading";
import StatusWidgets from "./components/widgets/StatusWidgets";

import Dashboard from "./components/Dashboard";
import VentasPage from "./components/ventas/VentasPage";
const LiquidacionesPage = lazy(() => import("./components/LiquidacionesPage"));
import Colaboradores from "./components/Colaboradores";
import Reglas from "./components/Reglas";
import ImportExcelMapperWrapper from "./components/ImportExcelMapperWrapper";
import Config from "./components/Config.jsx";
import LoginScreen from "./components/auth/LoginScreen";
import ResetPasswordScreen from "./components/auth/ResetPasswordScreen";
import Administracion from "./components/admin/Administracion.jsx";
import GestionSections from "./components/gestion/GestionSections";

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
          <Route path="ventas" element={<VentasPage />} />
          <Route 
            path="liquidaciones" 
            element={
              <Suspense fallback={<Loading />}>
                <LiquidacionesPage />
              </Suspense>
            } 
          />
          <Route path="colaboradores" element={<Colaboradores />} />
          <Route path="reglas" element={<Reglas />} />
          <Route path="importar" element={<ImportExcelMapperWrapper />} />
          <Route path="config" element={<Config />} />
          <Route path="gestion" element={<GestionSections />} />
          <Route path="admin/administracion" element={<Administracion />} />
          
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
      <ErrorBoundary>
        <AppContent />
      </ErrorBoundary>
    </AppContextProvider>
  );
}