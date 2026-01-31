import React, { useState, useEffect, useCallback, useMemo } from "react";
import EmpresaForm from "./components/EmpresaForm";
import LogoUploader from "./components/LogoUploader";
import ColorPicker from "./components/ColorPicker";
import ZonasSection from "./components/ZonasSection";
import CustomFieldsSection from "./components/CustomFieldsSection";

/**
 * COMPONENTE PRINCIPAL: ConfigSections
 * 
 * Módulo consolidado de configuración que integra la gestión de datos de empresa,
 * imagen corporativa, zonas fiscales y campos personalizados.
 * Refactorizado para mejorar la organización y mantenibilidad.
 */
export default function ConfigSections({ zonas = [] }) {
  const [activeSection, setActiveSection] = useState('admin');

  // Estado para datos de empresa
  const [empresa, setEmpresa] = useState({
    nombre: "",
    cif: "",
    direccion: "",
    telefono: "",
    email: "",
    web: "",
    logoUrl: "",
    colorCorporativo: "#6D28D9"
  });

  // Cargar datos de empresa desde localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem("empresaData");
      if (raw) {
        const data = JSON.parse(raw);
        setEmpresa(prev => ({ ...prev, ...data }));
      }
    } catch (err) {
      console.error("Error cargando datos de empresa:", err);
    }
  }, []);

  // Manejar cambios en datos de empresa
  const handleEmpresaChange = useCallback((data) => {
    setEmpresa((prev) => {
      const newData = { ...prev, ...data };
      try {
        localStorage.setItem("empresaData", JSON.stringify(newData));
        // Notificar a otros componentes que los datos han cambiado
        window.dispatchEvent(new CustomEvent('empresaDataUpdated', { detail: newData }));
      } catch (err) {
        console.error("Error guardando datos de empresa:", err);
      }
      return newData;
    });
  }, []);

  // Secciones de configuración
  const sections = useMemo(() => [
    { id: 'admin', label: 'Empresa', icon: '🏢', color: 'purple' },
    { id: 'zones', label: 'Zonas', icon: '🌍', color: 'blue' },
    { id: 'fields', label: 'Personalización', icon: '⚙️', color: 'green' }
  ], []);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Selector de Sub-secciones */}
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-slate-200 dark:border-gray-800 p-2 overflow-x-auto">
        <div className="flex gap-2 min-w-max">
          {sections.map(section => {
            const isActive = activeSection === section.id;
            return (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`flex items-center gap-3 px-5 py-2.5 rounded-lg font-bold transition-all ${isActive
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20'
                  : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-gray-800'
                  }`}
              >
                <span className="text-xl">{section.icon}</span>
                <span>{section.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Contenido Dinámico */}
      <div className="min-h-[500px]">
        {activeSection === 'admin' && (
          <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
            <div className="bg-gradient-to-br from-white via-white to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 rounded-3xl border border-slate-200 dark:border-gray-800 p-8 shadow-xl">
              <div className="mb-8">
                <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-2">Configuración Empresarial</h2>
                <p className="text-slate-500 dark:text-gray-400">Personaliza los datos legales y la identidad visual de tu plataforma.</p>
              </div>

              <div className="grid lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                  <EmpresaForm empresa={empresa} onChange={handleEmpresaChange} />
                  <div className="flex justify-end">
                    <button
                      className="px-6 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-gray-900 rounded-xl font-bold hover:opacity-90 transition-opacity shadow-lg flex items-center gap-2"
                      onClick={() => {
                        window.dispatchEvent(new CustomEvent('empresaDataUpdated', { detail: empresa }));
                        alert('Datos de empresa guardados correctamente');
                      }}
                    >
                      <span className="text-xl">💾</span>
                      Guardar Cambios
                    </button>
                  </div>
                </div>
                <div className="space-y-6">
                  <LogoUploader
                    logoUrl={empresa.logoUrl}
                    onChange={logoUrl => handleEmpresaChange({ logoUrl })}
                  />
                  <ColorPicker
                    color={empresa.colorCorporativo}
                    onChange={colorCorporativo => handleEmpresaChange({ colorCorporativo })}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {activeSection === 'zones' && (
          <div className="bg-white dark:bg-gray-900 rounded-3xl border border-slate-200 dark:border-gray-800 p-8 shadow-xl">
            <ZonasSection zonas={zonas} />
          </div>
        )}

        {activeSection === 'fields' && (
          <div className="bg-white dark:bg-gray-900 rounded-3xl border border-slate-200 dark:border-gray-800 p-8 shadow-xl">
            <CustomFieldsSection />
          </div>
        )}
      </div>
    </div>
  );
}

// Re-exportamos componentes para compatibilidad
export { EmpresaForm, LogoUploader, ColorPicker, ZonasSection, CustomFieldsSection };