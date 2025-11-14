import React, { useState, useContext, useEffect } from "react";
import Loading from "./common/Loading";
import { useLocation } from "react-router-dom";
import { MapPin, Building, Package, Settings, SlidersHorizontal } from "lucide-react";
import { DataContext } from "../context/DataContextDef";
import ProductosSection from "./config/ProductosSection";
import OperadoresSection from "./config/OperadoresSection";
import ZonasSection from "./config/ZonasSection";
import DataCleanupAdmin from "./DataCleanupAdmin";
import CustomFieldsSection from "./config/CustomFieldsSection";
import AdminSection from "./config/AdminSection";

export default function Config() {
  const location = useLocation();
  const [activeSection, setActiveSection] = useState("zonas");
  
  // Manejar sección desde URL
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const section = params.get('section');
    if (section && ['zonas', 'operadores', 'productos', 'admin', 'campos'].includes(section)) {
      setActiveSection(section);
    }
  }, [location.search]);
  
    // Usar el contexto de datos
  const { data, setZonas, setOperadores, setProductos, dataInitialized } = useContext(DataContext);
  const zonas = Array.isArray(data?.zonas) ? data.zonas : [];
  const operadores = Array.isArray(data?.operadores) ? data.operadores : [];
  const productos = Array.isArray(data?.productos) ? data.productos : [];

  // Importar funciones de limpieza/validación
  const { resetAllData, validateAllRelations } = useContext(DataContext);

  // ======= ESTADOS PARA BÚSQUEDA Y PAGINACIÓN =======
  const [searchZona, setSearchZona] = useState('');
  const [searchOperador, setSearchOperador] = useState('');
  const [searchProducto, setSearchProducto] = useState('');
  // ======= FILTRADO SIN PAGINACIÓN =======
  const filteredZonas = zonas.filter(z =>
    z.nombre?.toLowerCase().includes(searchZona.toLowerCase())
  );
  const filteredOperadores = operadores.filter(o =>
    o.nombre?.toLowerCase().includes(searchOperador.toLowerCase())
  );
  const filteredProductos = productos.filter(p =>
    p.nombre?.toLowerCase().includes(searchProducto.toLowerCase())
  );

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
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${activeSection === "campos" ? "bg-gradient-to-r from-yellow-500 to-yellow-600 text-white shadow-lg dark:from-darkAccent dark:to-purple-900" : "text-slate-600 dark:text-white hover:bg-slate-100 dark:hover:bg-darkCard"}`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            Campos Personalizados
          </button>
        </div>
        {activeSection === "campos" && (
          <CustomFieldsSection />
        )}
        {/* Acciones globales de datos */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => { if(window.confirm('¿Seguro que quieres limpiar todos los datos?')) resetAllData(); }}
            className="px-4 py-2 rounded-lg bg-red-600 text-white font-bold shadow hover:bg-red-700"
          >
            Limpiar todos los datos
          </button>
          <button
            onClick={() => { validateAllRelations(); alert('Relaciones validadas y datos limpiados.'); }}
            className="px-4 py-2 rounded-lg bg-green-600 text-white font-bold shadow hover:bg-green-700"
          >
            Validar relaciones y limpiar duplicados
          </button>
        </div>

        {/* Navegación */}
        <div className="flex gap-2 mb-8 bg-white dark:bg-darkCard rounded-xl p-2 shadow-lg border border-slate-200 dark:border-darkAccent/30">
          <button
            onClick={() => setActiveSection("zonas")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${activeSection === "zonas" ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg dark:from-darkAccent dark:to-blue-900" : "text-slate-600 dark:text-white hover:bg-slate-100 dark:hover:bg-darkBg"}`}
          >
            <MapPin className="w-4 h-4" />
            Zonas Fiscales ({zonas.length})
          </button>
          <button
            onClick={() => setActiveSection("operadores")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${activeSection === "operadores" ? "bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg dark:from-darkAccent dark:to-green-900" : "text-slate-600 dark:text-white hover:bg-slate-100 dark:hover:bg-darkBg"}`}
          >
            <Building className="w-4 h-4" />
            Operadores ({operadores.length})
          </button>
          <button
            onClick={() => setActiveSection("productos")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${activeSection === "productos" ? "bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-lg dark:from-darkAccent dark:to-purple-900" : "text-slate-600 dark:text-white hover:bg-slate-100 dark:hover:bg-darkBg"}`}
          >
            <Package className="w-4 h-4" />
            Productos ({productos.length})
          </button>
          <button
            onClick={() => setActiveSection("admin")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${activeSection === "admin" ? "bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg dark:from-darkAccent dark:to-red-900" : "text-slate-600 dark:text-white hover:bg-slate-100 dark:hover:bg-darkBg"}`}
          >
            <Settings className="w-4 h-4" />
            Administración
          </button>
        </div>
        
        {/* Secciones */}
        {activeSection === "zonas" && (
          <>
            {/* Filtro de búsqueda */}
            <div className="flex justify-between items-center mb-4">
              <input
                type="text"
                className="border border-slate-200 rounded-xl px-3 py-2 w-full max-w-xs focus:outline-none focus:ring-2 focus:ring-blue-400"
                placeholder="Buscar zona..."
                value={searchZona}
                onChange={e => { setSearchZona(e.target.value); }}
              />
              <div className="text-sm text-slate-300">
                {filteredZonas.length} zona{filteredZonas.length !== 1 ? 's' : ''} 
                {searchZona && ` (filtrado de ${zonas.length})`}
              </div>
            </div>
            <ZonasSection zonas={filteredZonas} setZonas={setZonas} />
            {/* Paginación */}
            {/* Sin paginación, se muestran todas las zonas filtradas */}
          </>
        )}
        
        {activeSection === "operadores" && (
          <>
            {/* Filtro de búsqueda */}
            <div className="flex justify-between items-center mb-4">
              <input
                type="text"
                className="border border-slate-200 rounded-xl px-3 py-2 w-full max-w-xs focus:outline-none focus:ring-2 focus:ring-green-400"
                placeholder="Buscar operador..."
                value={searchOperador}
                onChange={e => { setSearchOperador(e.target.value); }}
              />
              <div className="text-sm text-slate-300">
                {filteredOperadores.length} operador{filteredOperadores.length !== 1 ? 'es' : ''} 
                {searchOperador && ` (filtrado de ${operadores.length})`}
              </div>
            </div>
            {/* Mostrar todos los operadores, no solo la página */}
            <OperadoresSection
              operadores={operadores}
              setOperadores={setOperadores}
            />
          </>
        )}
        
        {activeSection === "productos" && (
          <>
            {/* Filtro de búsqueda */}
            <div className="flex justify-between items-center mb-4">
              <input
                type="text"
                className="border border-slate-200 rounded-xl px-3 py-2 w-full max-w-xs focus:outline-none focus:ring-2 focus:ring-purple-400"
                placeholder="Buscar producto..."
                value={searchProducto}
                onChange={e => { setSearchProducto(e.target.value); }}
              />
              <div className="text-sm text-slate-500">
                {filteredProductos.length} producto{filteredProductos.length !== 1 ? 's' : ''} 
                {searchProducto && ` (filtrado de ${productos.length})`}
              </div>
            </div>
            {/* Mostrar todos los productos, no solo la página */}
            <ProductosSection
              productos={productos}
              setProductos={setProductos}
              operadores={operadores}
            />
          </>
        )}

        {activeSection === "admin" && (
          <AdminSection />
        )}
      </div>
    </div>
  );
}

