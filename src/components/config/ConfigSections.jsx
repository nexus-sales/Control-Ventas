// src/components/config/ConfigSections.jsx
// MÓDULO CONFIG CONSOLIDADO - Integra AdminSection, EmpresaForm, LogoUploader, ColorPicker, CustomFieldsSection, ZonasSection
import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { crearCampoPersonalizado, ejemploCampoPersonalizado } from '../../data/customFieldsModel';

// ==========================================
// COMPONENTE: EmpresaForm (INTEGRADO)
// ==========================================
const EmpresaForm = React.memo(({ empresa, onChange }) => (
  <form className="grid md:grid-cols-2 gap-6 bg-white/80 dark:bg-darkCard/80 backdrop-blur-md rounded-2xl border border-slate-200 dark:border-darkAccent/30 shadow p-6 transition-colors">
    <div>
      <label className="block text-sm font-medium text-slate-700 dark:text-darkText mb-1">Nombre de la empresa</label>
      <input 
        className="w-full border border-slate-200 dark:border-darkAccent/30 rounded-xl px-3 py-2 bg-white dark:bg-darkCard shadow-sm focus:ring-2 focus:ring-purple-400 dark:focus:ring-darkAccent" 
        value={empresa.nombre} 
        onChange={e => onChange({ nombre: e.target.value })} 
      />
    </div>
    <div>
      <label className="block text-sm font-medium text-slate-700 dark:text-darkText mb-1">CIF/NIF</label>
      <input 
        className="w-full border border-slate-200 dark:border-darkAccent/30 rounded-xl px-3 py-2 bg-white dark:bg-darkCard shadow-sm focus:ring-2 focus:ring-purple-400 dark:focus:ring-darkAccent" 
        value={empresa.cif} 
        onChange={e => onChange({ cif: e.target.value })} 
      />
    </div>
    <div>
      <label className="block text-sm font-medium text-slate-700 dark:text-darkText mb-1">Dirección</label>
      <input 
        className="w-full border border-slate-200 dark:border-darkAccent/30 rounded-xl px-3 py-2 bg-white dark:bg-darkCard shadow-sm focus:ring-2 focus:ring-purple-400 dark:focus:ring-darkAccent" 
        value={empresa.direccion} 
        onChange={e => onChange({ direccion: e.target.value })} 
      />
    </div>
    <div>
      <label className="block text-sm font-medium text-slate-700 dark:text-darkText mb-1">Teléfono</label>
      <input 
        className="w-full border border-slate-200 dark:border-darkAccent/30 rounded-xl px-3 py-2 bg-white dark:bg-darkCard shadow-sm focus:ring-2 focus:ring-purple-400 dark:focus:ring-darkAccent" 
        value={empresa.telefono} 
        onChange={e => onChange({ telefono: e.target.value })} 
      />
    </div>
    <div>
      <label className="block text-sm font-medium text-slate-700 dark:text-darkText mb-1">Email</label>
      <input 
        type="email"
        className="w-full border border-slate-200 dark:border-darkAccent/30 rounded-xl px-3 py-2 bg-white dark:bg-darkCard shadow-sm focus:ring-2 focus:ring-purple-400 dark:focus:ring-darkAccent" 
        value={empresa.email} 
        onChange={e => onChange({ email: e.target.value })} 
      />
    </div>
    <div>
      <label className="block text-sm font-medium text-slate-700 dark:text-darkText mb-1">Web</label>
      <input 
        type="url"
        className="w-full border border-slate-200 dark:border-darkAccent/30 rounded-xl px-3 py-2 bg-white dark:bg-darkCard shadow-sm focus:ring-2 focus:ring-purple-400 dark:focus:ring-darkAccent" 
        value={empresa.web} 
        onChange={e => onChange({ web: e.target.value })} 
      />
    </div>
  </form>
));

// ==========================================
// COMPONENTE: LogoUploader (INTEGRADO)
// ==========================================
const LogoUploader = React.memo(({ logoUrl, onChange }) => {
  const fileInput = useRef();

  const handleFile = useCallback((e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Validar tamaño de archivo (máximo 2MB)
    if (file.size > 2 * 1024 * 1024) {
      alert('El archivo es demasiado grande. Máximo 2MB permitido.');
      return;
    }
    
    // Validar tipo de archivo
    if (!file.type.startsWith('image/')) {
      alert('Por favor selecciona un archivo de imagen válido.');
      return;
    }
    
    const reader = new FileReader();
    reader.onload = ev => onChange(ev.target.result);
    reader.onerror = () => alert('Error al leer el archivo');
    reader.readAsDataURL(file);
  }, [onChange]);

  return (
    <div className="flex flex-col items-center gap-2 p-6 bg-white/80 dark:bg-darkCard/80 backdrop-blur-md border border-slate-200 dark:border-darkAccent/30 rounded-2xl shadow w-full max-w-xs transition-colors">
      <div className="font-medium text-slate-700 dark:text-darkText mb-2">Logo de la empresa</div>
      {logoUrl ? (
        <img 
          src={logoUrl} 
          alt="Logo de la empresa" 
          className="h-24 object-contain mb-2 border border-slate-300 dark:border-darkAccent/30 rounded-xl shadow" 
        />
      ) : (
        <div className="h-24 w-24 flex items-center justify-center bg-slate-200 dark:bg-darkCard rounded-xl mb-2 text-slate-400 dark:text-darkText/40">
          Sin logo
        </div>
      )}
      <input 
        type="file" 
        accept="image/*" 
        ref={fileInput} 
        onChange={handleFile} 
        className="hidden" 
      />
      <button 
        type="button" 
        className="px-3 py-1 bg-purple-600 dark:bg-darkAccent hover:bg-purple-700 dark:hover:bg-purple-900 text-white rounded-xl shadow transition" 
        onClick={() => fileInput.current?.click()}
      >
        Subir logo
      </button>
      {logoUrl && (
        <button 
          type="button" 
          className="text-xs text-red-500 mt-1 hover:underline" 
          onClick={() => onChange("")}
        >
          Quitar logo
        </button>
      )}
    </div>
  );
});

// ==========================================
// COMPONENTE: ColorPicker (INTEGRADO)
// ==========================================
const ColorPicker = React.memo(({ color, onChange }) => {
  return (
    <div className="flex flex-col items-center gap-2 p-6 bg-white/80 dark:bg-darkCard/80 backdrop-blur-md border border-slate-200 dark:border-darkAccent/30 rounded-2xl shadow w-full max-w-xs transition-colors">
      <div className="font-medium text-slate-700 dark:text-darkText mb-2">
        Color corporativo
      </div>
      <div
        className="w-16 h-16 rounded-full border-4 border-white dark:border-darkAccent shadow"
        style={{ background: color }}
      />
      <input
        type="color"
        value={color}
        onChange={e => onChange(e.target.value)}
        className="w-10 h-10 border-none bg-transparent cursor-pointer mt-2 rounded"
        style={{ background: color }}
      />
      <div className="text-xs text-slate-500 dark:text-darkText/60 mt-1">
        {color}
      </div>
    </div>
  );
});

// ==========================================
// COMPONENTE: ZonasSection (INTEGRADO)
// ==========================================
const ZonasSection = React.memo(({ zonas = [] }) => (
  <div className="space-y-4">
    <h3 className="text-xl font-bold text-slate-800 dark:text-darkText">Zonas fiscales</h3>
    {zonas.length === 0 ? (
      <div className="text-slate-400 dark:text-darkText/60 p-4 bg-slate-50 dark:bg-darkCard rounded-xl">
        No hay zonas registradas.
      </div>
    ) : (
      <div className="grid gap-3">
        {Array.from(new Map(zonas.map(z => [z.nombre, z])).values()).map(zona => (
          <div key={zona.id} className="p-4 rounded-xl bg-slate-50 dark:bg-darkCard border border-slate-200 dark:border-darkAccent/30 hover:shadow-md transition-all">
            <div className="font-semibold text-slate-800 dark:text-darkText">{zona.nombre}</div>
            {zona.descripcion && (
              <div className="text-sm text-slate-500 dark:text-darkText/60 mt-1">{zona.descripcion}</div>
            )}
            {zona.codigo && (
              <div className="text-xs text-slate-400 dark:text-darkText/40 mt-1">Código: {zona.codigo}</div>
            )}
          </div>
        ))}
      </div>
    )}
  </div>
));

// ==========================================
// COMPONENTE: CustomFieldsSection (INTEGRADO + OPTIMIZADO)
// ==========================================
const CustomFieldsSection = React.memo(() => {
  const [campos, setCampos] = useState([ejemploCampoPersonalizado]);
  const [nuevoCampo, setNuevoCampo] = useState({
    nombre: '',
    tipo: 'texto',
    modulo: 'ventas',
    opciones: '',
    requerido: false,
    orden: 1,
    activo: true,
  });

  const tipos = useMemo(() => [
    { value: 'texto', label: 'Texto' },
    { value: 'numero', label: 'Número' },
    { value: 'fecha', label: 'Fecha' },
    { value: 'select', label: 'Selección' }
  ], []);
  
  const modulos = useMemo(() => [
    { value: 'ventas', label: 'Ventas' },
    { value: 'productos', label: 'Productos' },
    { value: 'operadores', label: 'Operadores' }
  ], []);

  const handleChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    setNuevoCampo(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  }, []);

  const handleAddCampo = useCallback((e) => {
    e.preventDefault();
    
    // Validaciones
    if (!nuevoCampo.nombre.trim()) {
      alert('El nombre del campo es requerido');
      return;
    }
    
    if (campos.some(c => c.nombre.toLowerCase() === nuevoCampo.nombre.toLowerCase())) {
      alert('Ya existe un campo con ese nombre');
      return;
    }
    
    const opcionesArr = nuevoCampo.tipo === 'select' 
      ? nuevoCampo.opciones.split(',').map(o => o.trim()).filter(o => o) 
      : [];
    
    if (nuevoCampo.tipo === 'select' && opcionesArr.length === 0) {
      alert('Debes especificar al menos una opción para campos de selección');
      return;
    }
    
    const campo = crearCampoPersonalizado({
      ...nuevoCampo,
      opciones: opcionesArr,
      orden: campos.length + 1
    });
    
    setCampos(prev => [...prev, campo]);
    setNuevoCampo({ 
      nombre: '', 
      tipo: 'texto', 
      modulo: 'ventas', 
      opciones: '', 
      requerido: false, 
      orden: campos.length + 2, 
      activo: true 
    });
  }, [nuevoCampo, campos]);

  const handleDeleteCampo = useCallback((id) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este campo?')) {
      setCampos(prev => prev.filter(c => c.id !== id));
    }
  }, []);

  const handleToggleActive = useCallback((id) => {
    setCampos(prev => prev.map(c => 
      c.id === id ? { ...c, activo: !c.activo } : c
    ));
  }, []);

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-bold text-slate-800 dark:text-darkText">Campos personalizados</h3>
      <p className="text-purple-700 dark:text-darkAccent font-medium">
        Gestiona campos personalizados para ventas, productos y operadores.
      </p>
      
      {/* Formulario para nuevo campo */}
      <form 
        className="bg-white/80 dark:bg-darkCard/80 rounded-xl p-6 border border-slate-200 dark:border-darkAccent/30 space-y-4" 
        onSubmit={handleAddCampo}
      >
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-darkText mb-1">
              Nombre del campo *
            </label>
            <input 
              className="w-full border border-slate-200 dark:border-darkAccent/30 rounded-lg px-3 py-2 bg-white dark:bg-darkCard focus:ring-2 focus:ring-purple-400" 
              name="nombre" 
              placeholder="Ej: Observaciones adicionales" 
              value={nuevoCampo.nombre} 
              onChange={handleChange} 
              required 
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-darkText mb-1">
              Tipo de campo
            </label>
            <select 
              className="w-full border border-slate-200 dark:border-darkAccent/30 rounded-lg px-3 py-2 bg-white dark:bg-darkCard focus:ring-2 focus:ring-purple-400" 
              name="tipo" 
              value={nuevoCampo.tipo} 
              onChange={handleChange}
            >
              {tipos.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-darkText mb-1">
              Módulo
            </label>
            <select 
              className="w-full border border-slate-200 dark:border-darkAccent/30 rounded-lg px-3 py-2 bg-white dark:bg-darkCard focus:ring-2 focus:ring-purple-400" 
              name="modulo" 
              value={nuevoCampo.modulo} 
              onChange={handleChange}
            >
              {modulos.map(m => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>
        </div>
        
        {nuevoCampo.tipo === 'select' && (
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-darkText mb-1">
              Opciones (separadas por coma)
            </label>
            <input 
              className="w-full border border-slate-200 dark:border-darkAccent/30 rounded-lg px-3 py-2 bg-white dark:bg-darkCard focus:ring-2 focus:ring-purple-400" 
              name="opciones" 
              placeholder="Opción 1, Opción 2, Opción 3" 
              value={nuevoCampo.opciones} 
              onChange={handleChange} 
            />
          </div>
        )}
        
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2">
            <input 
              type="checkbox" 
              name="requerido" 
              checked={nuevoCampo.requerido} 
              onChange={handleChange}
              className="rounded"
            />
            <span className="text-sm text-slate-700 dark:text-darkText">Campo requerido</span>
          </label>
          
          <button 
            className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg font-medium transition-colors" 
            type="submit"
          >
            Añadir campo
          </button>
        </div>
      </form>

      {/* Tabla de campos existentes */}
      <div className="bg-white/80 dark:bg-darkCard/80 rounded-xl border border-slate-200 dark:border-darkAccent/30 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-darkCard">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-slate-700 dark:text-darkText">Nombre</th>
                <th className="px-4 py-3 text-left font-medium text-slate-700 dark:text-darkText">Tipo</th>
                <th className="px-4 py-3 text-left font-medium text-slate-700 dark:text-darkText">Módulo</th>
                <th className="px-4 py-3 text-left font-medium text-slate-700 dark:text-darkText">Opciones</th>
                <th className="px-4 py-3 text-center font-medium text-slate-700 dark:text-darkText">Requerido</th>
                <th className="px-4 py-3 text-center font-medium text-slate-700 dark:text-darkText">Activo</th>
                <th className="px-4 py-3 text-center font-medium text-slate-700 dark:text-darkText">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-darkAccent/20">
              {campos.map(campo => (
                <tr key={campo.id} className={campo.activo ? '' : 'opacity-60'}>
                  <td className="px-4 py-3 font-medium text-slate-800 dark:text-darkText">{campo.nombre}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-darkText/80 capitalize">{campo.tipo}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-darkText/80 capitalize">{campo.modulo}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-darkText/80">
                    {campo.opciones?.length > 0 ? campo.opciones.join(', ') : '-'}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {campo.requerido ? (
                      <span className="text-red-500 font-bold">✓</span>
                    ) : (
                      <span className="text-slate-300">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => handleToggleActive(campo.id)}
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        campo.activo 
                          ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                          : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                      }`}
                    >
                      {campo.activo ? 'Activo' : 'Inactivo'}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button 
                      className="text-red-600 hover:text-red-800 hover:underline font-medium" 
                      onClick={() => handleDeleteCampo(campo.id)}
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
});

// ==========================================
// COMPONENTE PRINCIPAL: ConfigSections (CONSOLIDADO)
// ==========================================
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
        setEmpresa(data);
      }
    } catch {
      // LOG ELIMINADO
    }
  }, []);

  // Manejar cambios en datos de empresa
  const handleEmpresaChange = useCallback((data) => {
    setEmpresa((prev) => {
      const newData = { ...prev, ...data };
      try {
        localStorage.setItem("empresaData", JSON.stringify(newData));
      } catch {
        // LOG ELIMINADO
      }
      return newData;
    });
  }, []);

  // Secciones de configuración
  const sections = useMemo(() => [
    { id: 'admin', label: 'Administración', icon: '🏢' },
    { id: 'zones', label: 'Zonas Fiscales', icon: '🌍' },
    { id: 'fields', label: 'Campos Personalizados', icon: '⚙️' }
  ], []);

  return (
    <div className="space-y-6">
      {/* Navegación entre secciones */}
      <div className="bg-white dark:bg-darkCard rounded-xl shadow-sm border border-slate-200 dark:border-darkAccent/30 p-4">
        <div className="flex flex-wrap gap-2">
          {sections.map(section => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                activeSection === section.id
                  ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                  : 'text-slate-600 dark:text-darkText/80 hover:bg-slate-50 dark:hover:bg-darkCard'
              }`}
            >
              <span>{section.icon}</span>
              <span>{section.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Contenido de la sección activa */}
      <div className="min-h-[500px]">
        {activeSection === 'admin' && (
          <section className="max-w-4xl mx-auto bg-gradient-to-br from-white via-slate-50 to-purple-50 dark:from-darkBg dark:via-darkCard dark:to-darkCard rounded-2xl shadow-xl border border-slate-200 dark:border-darkAccent/30 p-8 space-y-8 transition-colors">
            <div>
              <h2 className="text-3xl font-bold text-slate-800 dark:text-darkText mb-2">Administración</h2>
              <p className="text-lg text-purple-700 dark:text-darkAccent font-semibold mb-6">
                Configura los datos de tu empresa y personaliza la imagen corporativa.
              </p>
            </div>
            
            <div className="divide-y divide-slate-200 dark:divide-darkAccent/20 space-y-8">
              <div className="pt-0">
                <EmpresaForm empresa={empresa} onChange={handleEmpresaChange} />
              </div>
              <div className="flex flex-col lg:flex-row gap-8 pt-8">
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
          </section>
        )}

        {activeSection === 'zones' && (
          <section className="max-w-4xl mx-auto bg-gradient-to-br from-white via-slate-50 to-blue-50 dark:from-darkBg dark:via-darkCard dark:to-darkCard rounded-2xl shadow-xl border border-slate-200 dark:border-darkAccent/30 p-8 transition-colors">
            <ZonasSection zonas={zonas} />
          </section>
        )}

        {activeSection === 'fields' && (
          <section className="max-w-5xl mx-auto bg-gradient-to-br from-white via-slate-50 to-green-50 dark:from-darkBg dark:via-darkCard dark:to-darkCard rounded-2xl shadow-xl border border-slate-200 dark:border-darkAccent/30 p-8 transition-colors">
            <CustomFieldsSection />
          </section>
        )}
      </div>
    </div>
  );
}

// Exportar también los subcomponentes para uso independiente si es necesario
export { EmpresaForm, LogoUploader, ColorPicker, ZonasSection, CustomFieldsSection };