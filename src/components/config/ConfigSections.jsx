import React, { useState, useCallback, useMemo } from "react";
import { Save, Wifi, WifiOff, RefreshCw, Download, Database, Clock, HardDrive, AlertTriangle, Lock } from "lucide-react";
import { useData, useAuth } from "../../context/AppContexts";
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

  // Usar el hook de datos global
  const { data: globalData, setEmpresa: setGlobalEmpresa } = useData();
  // La política real (cv_empresa_modify) solo permite escribir empresa_config_cv
  // a un admin — antes cualquier rol veía el formulario completo y, al guardar,
  // recibía el alert de éxito incondicional aunque Supabase rechazara el
  // cambio por permisos (no por conectividad). Se restringe también en la UI.
  const { isAdmin } = useAuth();

  // Estado local para edición de empresa, mapeado de data.empresa (esperamos array) o de localStorage directo
  const empresa = useMemo(() => {
    const defaultData = {
      nombre: "Mi Empresa",
      cif: "",
      direccion: "",
      telefono: "",
      email: "",
      web: "",
      logoUrl: "",
      colorCorporativo: "#6D28D9"
    };
    if (Array.isArray(globalData?.empresa) && globalData.empresa.length > 0) {
      const merged = { ...defaultData, ...globalData.empresa[0] };
      // Una fila real con colorCorporativo NULL (creada antes de que existiera
      // el campo, o sincronizada así) pisaría el valor por defecto de arriba
      // con null — ColorPicker.jsx hace color.toUpperCase() sin guardas, así
      // que esto crasheaba toda la pestaña de Empresa.
      merged.colorCorporativo = merged.colorCorporativo || defaultData.colorCorporativo;
      return merged;
    }
    // Fallback inicial
    try {
      const raw = localStorage.getItem("empresaData");
      if (raw) {
        // Si hay array lo procesamos, si no lo envolvemos
        const parsed = JSON.parse(raw);
        return { ...defaultData, ...(Array.isArray(parsed) ? parsed[0] : parsed) };
      }
    } catch {
      // localStorage inaccesible o JSON corrupto: usar defaultData.
    }
    return defaultData;
  }, [globalData?.empresa]);

  // Manejar cambios en datos de empresa
  const handleEmpresaChange = useCallback((updatedFields) => {
    const newEmpresaObj = { ...empresa, ...updatedFields };
    // Asignar ID singleton para empresa_config_cv si no tiene
    if (!newEmpresaObj.id) {
      newEmpresaObj.id = "singleton-empresa-id";
    }
    
    // Guardar usando el setter de DataProvider como array
    setGlobalEmpresa([newEmpresaObj]);

    // Notificar a otros componentes que los datos han cambiado (UI legado)
    window.dispatchEvent(new CustomEvent('empresaDataUpdated', { detail: newEmpresaObj }));
  }, [empresa, setGlobalEmpresa]);

  const handleSave = useCallback(() => {
    handleEmpresaChange({});
    alert('Datos de empresa guardados y sincronizados correctamente');
  }, [handleEmpresaChange]);

  // Secciones de configuración
  const sections = useMemo(() => [
    { id: 'admin', label: 'Empresa', icon: '🏢', color: 'purple' },
    { id: 'zones', label: 'Zonas', icon: '🌍', color: 'blue' },
    { id: 'fields', label: 'Personalización', icon: '⚙️', color: 'green' },
    { id: 'sync', label: 'Sincronización', icon: '🔄', color: 'orange' }
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
                  ? 'bg-[var(--brand-primary)] text-white shadow-lg shadow-[var(--brand-primary)]/20'
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

              {isAdmin ? (
                <div className="grid lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-2 space-y-6">
                    <EmpresaForm empresa={empresa} onChange={handleEmpresaChange} />
                    <div className="flex justify-end">
                      <button
                        onClick={handleSave}
                        className="px-6 py-2.5 bg-[var(--brand-primary)] text-white rounded-xl font-bold hover:opacity-90 transition-opacity shadow-lg flex items-center gap-2"
                      >
                        <Save className="w-4 h-4" />
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
              ) : (
                <div className="rounded-2xl border border-slate-200 dark:border-gray-800 bg-slate-50 dark:bg-gray-800/40 p-6 space-y-4">
                  <p className="flex items-center gap-2 text-sm font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider">
                    <Lock className="w-4 h-4" />
                    Solo un administrador puede editar los datos de la empresa
                  </p>
                  <dl className="grid sm:grid-cols-2 gap-4 text-sm">
                    <div><dt className="text-slate-400 dark:text-gray-500">Nombre</dt><dd className="font-bold text-slate-800 dark:text-white">{empresa.nombre || '-'}</dd></div>
                    <div><dt className="text-slate-400 dark:text-gray-500">CIF</dt><dd className="font-bold text-slate-800 dark:text-white">{empresa.cif || '-'}</dd></div>
                    <div><dt className="text-slate-400 dark:text-gray-500">Dirección</dt><dd className="font-bold text-slate-800 dark:text-white">{empresa.direccion || '-'}</dd></div>
                    <div><dt className="text-slate-400 dark:text-gray-500">Teléfono</dt><dd className="font-bold text-slate-800 dark:text-white">{empresa.telefono || '-'}</dd></div>
                    <div><dt className="text-slate-400 dark:text-gray-500">Email</dt><dd className="font-bold text-slate-800 dark:text-white">{empresa.email || '-'}</dd></div>
                    <div><dt className="text-slate-400 dark:text-gray-500">Web</dt><dd className="font-bold text-slate-800 dark:text-white">{empresa.web || '-'}</dd></div>
                  </dl>
                </div>
              )}
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

        {activeSection === 'sync' && (
          <div className="bg-white dark:bg-gray-900 rounded-3xl border border-slate-200 dark:border-gray-800 p-8 shadow-xl animate-in slide-in-from-bottom-4 duration-500">
            <div className="mb-8">
              <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-2">Sincronización y Respaldo</h2>
              <p className="text-slate-500 dark:text-gray-400">Controla la conexión con el servidor Supabase y gestiona tus respaldos locales.</p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              <SyncStatusCard />
              <SyncActionsCard />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function SyncStatusCard() {
  const { offlineSync } = useData();
  const { isOnline, pendingChanges, lastSyncTime, getOfflineInfo } = offlineSync;
  const offlineInfo = getOfflineInfo ? getOfflineInfo() : { storageSizeKB: 0 };

  return (
    <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-gray-800 p-6 space-y-6">
      <h3 className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-wider flex items-center gap-2">
        <Database className="w-5 h-5 text-orange-500" />
        Estado de la Base de Datos
      </h3>
      
      <div className="space-y-4">
        {/* Connection status */}
        <div className="flex items-center justify-between p-4 rounded-xl bg-white dark:bg-gray-800/45 border border-slate-200/50 dark:border-gray-800">
          <span className="text-sm font-bold text-slate-500 dark:text-slate-400">Estado de Conexión</span>
          <div className="flex items-center gap-2">
            {isOnline ? (
              <>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <Wifi className="w-3.5 h-3.5" /> Conectado
                </span>
              </>
            ) : (
              <>
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <span className="text-xs font-black uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1">
                  <WifiOff className="w-3.5 h-3.5" /> Modo Offline
                </span>
              </>
            )}
          </div>
        </div>

        {/* Last Sync */}
        <div className="flex items-center justify-between p-4 rounded-xl bg-white dark:bg-gray-800/45 border border-slate-200/50 dark:border-gray-800">
          <span className="text-sm font-bold text-slate-500 dark:text-slate-400">Última Sincronización</span>
          <span className="text-xs font-black text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            {lastSyncTime ? new Date(lastSyncTime).toLocaleString('es-ES') : 'Sin sincronizaciones registradas'}
          </span>
        </div>

        {/* Cache size */}
        <div className="flex items-center justify-between p-4 rounded-xl bg-white dark:bg-gray-800/45 border border-slate-200/50 dark:border-gray-800">
          <span className="text-sm font-bold text-slate-500 dark:text-slate-400">Datos en Caché Local</span>
          <span className="text-xs font-black text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <HardDrive className="w-3.5 h-3.5 text-slate-400" />
            {offlineInfo.storageSizeKB} KB
          </span>
        </div>

        {/* Pending Changes */}
        <div className="flex items-center justify-between p-4 rounded-xl bg-white dark:bg-gray-800/45 border border-slate-200/50 dark:border-gray-800">
          <span className="text-sm font-bold text-slate-500 dark:text-slate-400">Cambios Pendientes</span>
          <div className="flex items-center gap-2">
            {pendingChanges.length > 0 ? (
              <span className="px-2.5 py-1 rounded-full bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 text-xs font-black uppercase tracking-wider animate-pulse flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                {pendingChanges.length} Pendientes
              </span>
            ) : (
              <span className="px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 text-xs font-black uppercase tracking-wider">
                Al Día
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function SyncActionsCard() {
  const { refreshData, isDataLoading, offlineSync } = useData();
  const { createEmergencyBackup } = offlineSync;

  return (
    <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-gray-800 p-6 space-y-6 flex flex-col justify-between">
      <div className="space-y-6">
        <h3 className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-wider flex items-center gap-2">
          <RefreshCw className="w-5 h-5 text-orange-500" />
          Operaciones de Sincronismo
        </h3>
        
        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
          Puedes forzar una sincronización manual con Supabase para traer los últimos datos del servidor o descargar un respaldo completo en formato JSON de toda tu información en local.
        </p>
      </div>

      <div className="space-y-4 pt-4">
        {/* Sync now button */}
        <button
          onClick={refreshData}
          disabled={isDataLoading}
          className="w-full flex items-center justify-center gap-2.5 px-6 py-4 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-orange-500/10 active:scale-95 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isDataLoading ? 'animate-spin' : ''}`} />
          {isDataLoading ? 'Sincronizando...' : 'Sincronizar con Supabase'}
        </button>

        {/* Local backup button */}
        <button
          onClick={createEmergencyBackup}
          className="w-full flex items-center justify-center gap-2.5 px-6 py-4 rounded-xl bg-slate-800 dark:bg-slate-700 text-white hover:bg-slate-900 dark:hover:bg-slate-600 text-xs font-black uppercase tracking-widest transition-all shadow-lg active:scale-95"
        >
          <Download className="w-4 h-4" />
          Descargar Backup Local
        </button>
      </div>
    </div>
  );
}

// Re-exportamos componentes para compatibilidad
export { EmpresaForm, LogoUploader, ColorPicker, ZonasSection, CustomFieldsSection };