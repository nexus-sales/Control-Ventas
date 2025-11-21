import React, { useState, useContext, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { SlidersHorizontal } from "lucide-react";
import { DataContext } from "../context/DataContext";
import ConfigSections from "./config/ConfigSections";

export default function Config() {
  const location = useLocation();
  const [activeSection, setActiveSection] = useState("zonas");

  // Manejar sección desde URL
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const section = params.get("section");
    if (section && ["zonas", "admin", "campos"].includes(section)) {
      setActiveSection(section);
    }
  }, [location.search]);

  // Usar el contexto de datos
  const { data, dataInitialized } = useContext(DataContext);
  const zonas = Array.isArray(data?.zonas) ? data.zonas : [];

  if (!dataInitialized) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-slate-200 rounded w-1/4" />
          <div className="h-64 bg-slate-200 rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-darkBg dark:to-darkCard p-6 transition-colors">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800 dark:text-white mb-2">
            Configuración
          </h1>
          <p className="text-slate-600 dark:text-slate-100">
            Gestiona zonas, operadores y productos del sistema
          </p>
          <button
            onClick={() => setActiveSection("campos")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
              activeSection === "campos"
                ? "bg-gradient-to-r from-yellow-500 to-yellow-600 text-white shadow-lg dark:from-darkAccent dark:to-purple-900"
                : "text-slate-600 dark:text-white hover:bg-slate-100 dark:hover:bg-darkCard"
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            Campos Personalizados
          </button>
        </div>
        {/* Secciones consolidadas */}
        <ConfigSections zonas={zonas} />
      </div>
    </div>
  );
}