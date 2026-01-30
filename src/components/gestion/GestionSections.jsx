import React, { useState, useMemo } from "react";
import OperadoresSection from "./components/OperadoresSection";
import ProductosSection from "./components/ProductosSection";
import AdministracionSection from "./components/AdministracionSection";

/**
 * COMPONENTE PRINCIPAL: GestionSections
 * 
 * Este componente actúa como el orquestador principal del módulo de Gestión.
 * Ha sido refactorizado para extraer la lógica y los componentes secundarios a archivos independientes,
 * mejorando la mantenibilidad y legibilidad del código.
 */
export default function GestionSections() {
  const [activeSection, setActiveSection] = useState('operadores');

  const sections = useMemo(() => [
    { id: 'operadores', label: 'Operadores', icon: '🏢', color: 'purple' },
    { id: 'productos', label: 'Productos', icon: '📦', color: 'green' },
    { id: 'administracion', label: 'Administración', icon: '⚙️', color: 'blue' }
  ], []);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Barra de Navegación por Pestañas */}
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-slate-200 dark:border-gray-800 p-2 overflow-x-auto">
        <div className="flex gap-2 min-w-max">
          {sections.map(section => {
            const isActive = activeSection === section.id;

            // Colores dinámicos basados en la sección
            const colorConfig = {
              purple: "text-purple-700 bg-purple-50 border-purple-200 dark:text-purple-300 dark:bg-purple-900/30 dark:border-purple-800",
              green: "text-green-700 bg-green-50 border-green-200 dark:text-green-300 dark:bg-green-900/30 dark:border-green-800",
              blue: "text-blue-700 bg-blue-50 border-blue-200 dark:text-blue-300 dark:bg-blue-900/30 dark:border-blue-800",
            };

            return (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`flex items-center gap-3 px-5 py-2.5 rounded-lg font-bold transition-all border-2 ${isActive
                    ? colorConfig[section.color]
                    : 'text-slate-500 border-transparent hover:bg-slate-50 dark:hover:bg-gray-800'
                  }`}
              >
                <span className="text-xl">{section.icon}</span>
                <span>{section.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Área de Contenido con Transiciones Visuales */}
      <div className="min-h-[600px] relative">
        {activeSection === 'operadores' && (
          <div className="bg-gradient-to-br from-white via-slate-50 to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 rounded-2xl shadow-xl border border-slate-200 dark:border-gray-800 p-6 transition-all">
            <OperadoresSection />
          </div>
        )}

        {activeSection === 'productos' && (
          <div className="bg-gradient-to-br from-white via-slate-50 to-green-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 rounded-2xl shadow-xl border border-slate-200 dark:border-gray-800 p-6 transition-all">
            <ProductosSection />
          </div>
        )}

        {activeSection === 'administracion' && (
          <div className="bg-gradient-to-br from-white via-slate-50 to-blue-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 rounded-2xl shadow-xl border border-slate-200 dark:border-gray-800 p-6 transition-all">
            <AdministracionSection />
          </div>
        )}
      </div>
    </div>
  );
}

// Re-exportamos para compatibilidad si otros componentes importan las secciones individualmente
export { ProductosSection, OperadoresSection, AdministracionSection };