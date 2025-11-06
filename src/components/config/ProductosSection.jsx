import React, { useState, useMemo } from "react";
import { saveAs } from "file-saver";
function exportarProductosCSV(productos, customFields) {
  if (!productos.length) return;
  // Encabezados base
  const baseHeaders = [
    "ID", "Nombre", "Familia", "PVP", "Tipo Comisión", "Valor Comisión"
  ];
  // Encabezados de campos personalizados
  const customHeaders = customFields.map(f => f.nombre);
  const headers = [...baseHeaders, ...customHeaders];
  // Filas
  const rows = productos.map(p => [
    p.id,
    p.nombre,
    p.familia,
    p.pvp,
    p.comision_tipo,
    p.comision_valor,
    ...customFields.map(f => p.customFields?.[f.id] ?? "")
  ]);
  // CSV
  const csv = [headers.join(",")].concat(rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(","))).join("\r\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  saveAs(blob, `productos_${new Date().toISOString().slice(0,10)}.csv`);
}
import ProductoEditModal from "../ProductoEditModal";
import Card from "../ui/Card";
import { useCustomFields } from "../../hooks/useCustomFields";
import ProductosTable from "./ProductosTable";

import {
  Plus,
  Edit3,
  Trash2,
  Package,
  DollarSign,
  Percent,
  AlertCircle,
  Search,
  Filter,
  SortAsc,
  SortDesc,
  X,
  Building,
  Phone,
  Zap,
  Shield,
  Briefcase,
  Home,
} from "lucide-react";

export default function ProductosSection({
  productos,
  setProductos,
  operadores,
}) {
  const [showProductoForm, setShowProductoForm] = useState(false);
    // Obtener campos personalizados para productos
  // Eliminado: declaración duplicada de customFields

  // Hook de campos personalizados dentro del componente
  const customFields = useCustomFields('productos');
  const [pDraft, setPDraft] = useState({
    operador_id: operadores[0]?.id || "",
    nombre: "",
    familia: "",
    pvp: "",
    comision_tipo: "porcentaje",
    comision_valor: "",
    fecha_alta: "",
    fecha_baja: "",
    contacto: "",
    email: "",
    telefono: "",
    observaciones: "",
    historial: [],
  });
  const [modalProducto, setModalProducto] = useState(null);
  const [error, setError] = useState("");

  // Estados para filtros y búsqueda
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedOperador, setSelectedOperador] = useState("");
  const [selectedFamilia, setSelectedFamilia] = useState("");
  const [selectedComisionTipo, setSelectedComisionTipo] = useState("");
  const [sortField, setSortField] = useState("operador_nombre");
  const [sortDirection, setSortDirection] = useState("asc");

  // Función para obtener nombre del operador
  const getOperadorNombre = React.useCallback(
    (operador_id) => {
      const operador = operadores.find(op => op.id === operador_id);
      return operador?.nombre || "Sin operador";
    },
    [operadores]
  );

  // Función para obtener icono del sector
  const getSectorIcon = (operador_id) => {
    const operador = operadores.find(op => op.id === operador_id);
    if (!operador) return <Building className="w-4 h-4 text-gray-600" />;
    
    switch(operador.sector?.toLowerCase()) {
      case 'telefonia': return <Phone className="w-4 h-4 text-blue-600" />;
      case 'energia': return <Zap className="w-4 h-4 text-yellow-600" />;
      case 'seguridad': return <Shield className="w-4 h-4 text-red-600" />;
      case 'alarmas': return <Shield className="w-4 h-4 text-red-600" />;
      case 'internet': return <Briefcase className="w-4 h-4 text-purple-600" />;
      case 'seguros': return <Home className="w-4 h-4 text-green-600" />;
      default: return <Building className="w-4 h-4 text-gray-600" />;
    }
  };

  // Obtener familias únicas para el filtro
  const familias = useMemo(() => {
    const familiasSet = new Set(productos.map(p => p.familia).filter(Boolean));
    return Array.from(familiasSet).sort();
  }, [productos]);

  // Normalizar texto para comparaciones (sin acentos, mayúsculas, espacios extra)
  const normalizeText = (text) => {
    return text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim()
      .replace(/\s+/g, " ");
  };

  // Verificar si ya existe un producto con el mismo nombre y operador
  const productExists = (nombre, operadorId, excludeId = null) => {
    const normalizedNombre = normalizeText(nombre);
    return productos.some(p => 
      p.id !== excludeId &&
      p.operador_id === operadorId &&
      normalizeText(p.nombre) === normalizedNombre
    );
  };

  // Mapeo de sectores para normalización
  const sectorMapping = {
    'telefonia': 'TELEFONIA',
    'telefonía': 'TELEFONIA',
    'telco': 'TELEFONIA',
    'energia': 'ENERGIA',
    'energía': 'ENERGIA',
    'seguridad': 'SEGURIDAD',
    'alarmas': 'SEGURIDAD',
    'seguros': 'SEGUROS',
    'insurance': 'SEGUROS',
    'finanzas': 'FINANZAS',
    'financiero': 'FINANZAS',
    'banking': 'FINANZAS'
  };

  // Normalizar sector
  const normalizeSector = (sector) => {
    const normalized = normalizeText(sector);
    return sectorMapping[normalized] || normalized;
  };

  // Obtener color para el sector
  const getSectorColor = (sector) => {
    const normalizedSector = normalizeSector(sector);
    switch(normalizedSector) {
      case 'TELEFONIA': return 'bg-blue-100 text-blue-700';
      case 'ENERGIA': return 'bg-yellow-100 text-yellow-700';
      case 'SEGURIDAD': return 'bg-red-100 text-red-700';
      case 'seguros': return 'bg-green-100 text-green-700';
      case 'finanzas': return 'bg-purple-100 text-purple-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  // Productos filtrados y ordenados
  const productosFiltrados = useMemo(() => {
    let filtered = productos;

    // Filtro por búsqueda (nombre del producto)
    if (searchTerm) {
      filtered = filtered.filter(p => 
        p.nombre?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtro por operador
    if (selectedOperador) {
      filtered = filtered.filter(p => p.operador_id === selectedOperador);
    }

    // Filtro por familia
    if (selectedFamilia) {
      filtered = filtered.filter(p => p.familia === selectedFamilia);
    }

    // Filtro por tipo de comisión
    if (selectedComisionTipo) {
      filtered = filtered.filter(p => p.comision_tipo === selectedComisionTipo);
    }

    // Ordenación
    filtered.sort((a, b) => {
      let aValue, bValue;

      switch (sortField) {
        case "operador_nombre":
          aValue = getOperadorNombre(a.operador_id);
          bValue = getOperadorNombre(b.operador_id);
          break;
        case "nombre":
          aValue = a.nombre || "";
          bValue = b.nombre || "";
          break;
        case "familia":
          aValue = a.familia || "";
          bValue = b.familia || "";
          break;
        case "pvp":
          aValue = Number(a.pvp) || 0;
          bValue = Number(b.pvp) || 0;
          break;
        case "comision_valor":
          aValue = Number(a.comision_valor) || 0;
          bValue = Number(b.comision_valor) || 0;
          break;
        default:
          aValue = a[sortField] || "";
          bValue = b[sortField] || "";
      }

      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (sortDirection === "asc") {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  }, [productos, searchTerm, selectedOperador, selectedFamilia, selectedComisionTipo, sortField, sortDirection, getOperadorNombre]);

  // Función para cambiar ordenación
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(prev => prev === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // Función para limpiar todos los filtros
  const clearFilters = () => {
    setSearchTerm("");
    setSelectedOperador("");
    setSelectedFamilia("");
    setSelectedComisionTipo("");
  };

  // Componente de filtros activos
  const ActiveFilters = () => {
    const activeFilters = [];
    
    if (searchTerm) activeFilters.push(`Búsqueda: "${searchTerm}"`);
    if (selectedOperador) {
      const operador = operadores.find(op => op.id === selectedOperador);
      activeFilters.push(`Operador: ${operador?.nombre}`);
    }
    if (selectedFamilia) activeFilters.push(`Familia: ${selectedFamilia}`);
    if (selectedComisionTipo) activeFilters.push(`Tipo: ${selectedComisionTipo === 'porcentaje' ? 'Porcentaje' : 'Fijo'}`);

    if (activeFilters.length === 0) return null;

    return (
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <span className="text-sm text-slate-600">Filtros activos:</span>
        {activeFilters.map((filter, index) => (
          <span key={index} className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs">
            {filter}
          </span>
        ))}
        <button
          onClick={clearFilters}
          className="text-xs text-slate-500 hover:text-slate-700 flex items-center gap-1"
        >
          <X className="w-3 h-3" />
          Limpiar
        </button>
      </div>
    );
  };

  const addProducto = () => {
    // Validaciones
    if (!pDraft.nombre.trim()) {
      setError("El nombre del producto es obligatorio");
      return;
    }
    if (!pDraft.operador_id) {
      setError("Debes seleccionar un operador");
      return;
    }
    if (!pDraft.pvp || Number(pDraft.pvp) <= 0) {
      setError("El PVP debe ser mayor que 0");
      return;
    }

    // Verificar duplicados
    if (productExists(pDraft.nombre, pDraft.operador_id)) {
      setError(`Ya existe un producto con el nombre "${pDraft.nombre}" para este operador`);
      return;
    }

    // Crear nuevo producto
    const newProducto = { 
      ...pDraft, 
      id: `p_${Date.now()}`,
      nombre: pDraft.nombre.trim(),
      familia: pDraft.familia.trim() || "Sin clasificar",
      pvp: Number(pDraft.pvp),
      comision_valor: pDraft.comision_valor ? Number(pDraft.comision_valor) : 0,
      fecha_alta: pDraft.fecha_alta || new Date().toISOString().slice(0, 10),
      activo: true,
      historial: [],
    };

    setProductos(prev => [...prev, newProducto]);
    
    // Resetear formulario
    setPDraft({
      operador_id: operadores[0]?.id || "",
      nombre: "",
      familia: "",
      pvp: "",
      comision_tipo: "porcentaje",
      comision_valor: "",
      fecha_alta: "",
      fecha_baja: "",
      contacto: "",
      email: "",
      telefono: "",
      observaciones: "",
      historial: [],
    });
    setError("");
    setShowProductoForm(false);
  };

  const handleModalProductoSave = (producto, shouldClose) => {
    // Verificar duplicados al editar
    if (productExists(producto.nombre, producto.operador_id, producto.id)) {
      alert(`Ya existe un producto con el nombre "${producto.nombre}" para este operador`);
      return;
    }

    // Extraer campos personalizados (cf_*)
    const customFields = {};
    const otherFields = {};
    Object.entries(producto).forEach(([key, value]) => {
      if (key.startsWith('cf_')) {
        customFields[key] = value;
      } else {
        otherFields[key] = value;
      }
    });
    setProductos(prev => prev.map((p) => (p.id === producto.id ? {
      ...otherFields,
      customFields,
      nombre: producto.nombre.trim(),
      familia: producto.familia?.trim() || "Sin clasificar"
    } : p)));
    
    if (shouldClose) setModalProducto(null);
  };

  const deleteProducto = (id) => {
    if (window.confirm("¿Estás seguro de que quieres eliminar este producto?")) {
      setProductos(prev => prev.filter((prod) => prod.id !== id));
    }
  };

  // Definir handleExportCSV
  const handleExportCSV = () => exportarProductosCSV(productos, customFields);

  return (
  <section className="max-w-4xl mx-auto bg-gradient-to-br from-white via-slate-50 to-purple-50 dark:from-indigo-950 dark:via-indigo-900 dark:to-indigo-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-indigo-800 p-8 space-y-8 transition-colors">
  <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">Productos</h2>
  <p className="text-base text-purple-700 dark:text-indigo-200 font-semibold mb-6">Gestiona productos y campos personalizados.</p>

      {/* Mostrar error global */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-xl text-red-700 dark:text-red-300 text-sm" role="alert">
          {error}
        </div>
      )}

      {/* Botón para mostrar formulario de nuevo producto */}
      <div className="mb-4 flex justify-end">
        <button
          className="flex items-center gap-2 px-4 py-2 bg-green-600 dark:bg-green-700 hover:bg-green-700 dark:hover:bg-green-800 text-white rounded-xl shadow transition"
          onClick={() => setShowProductoForm(true)}
        >
          <Plus className="w-4 h-4" /> Nuevo producto
        </button>
      </div>

      {/* Formulario de nuevo producto */}
      {showProductoForm && (
        <ProductoEditModal
          producto={null}
          onSave={addProducto}
          onClose={() => setShowProductoForm(false)}
        />
      )}

      {/* Modal de edición de producto */}
      {modalProducto && (
        <ProductoEditModal
          producto={modalProducto}
          onSave={handleModalProductoSave}
          onClose={() => setModalProducto(null)}
        />
      )}


      {/* Input de búsqueda */}
      <div className="mb-6 flex items-center gap-3">
        <div className="relative w-full max-w-xs">
          <input
            type="text"
            placeholder="Buscar producto..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-300 dark:border-indigo-700 bg-white dark:bg-indigo-900 text-slate-800 dark:text-indigo-100 placeholder-slate-400 dark:placeholder-indigo-300 focus:outline-none focus:ring-2 focus:ring-purple-400 dark:focus:ring-indigo-400 transition"
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 dark:text-indigo-300 pointer-events-none" />
        </div>
      </div>

      {/* Filtros activos */}
      <ActiveFilters />

      <div className="divide-y divide-slate-200 dark:divide-darkAccent/20 space-y-8">
        <div className="pt-0">
          {/* Tabla de productos filtrados */}
          <ProductosTable
            productos={productosFiltrados}
            customFields={customFields}
            familias={familias}
            operadores={operadores}
            onEdit={p => setModalProducto(p)}
            onDelete={deleteProducto}
            getSectorIcon={getSectorIcon}
            getSectorColor={getSectorColor}
            handleSort={handleSort}
            sortField={sortField}
            sortDirection={sortDirection}
          />
        </div>
      </div>
      <button className="mt-8 px-4 py-2 bg-purple-600 dark:bg-indigo-700 hover:bg-purple-700 dark:hover:bg-indigo-800 text-white rounded-xl shadow transition" onClick={handleExportCSV}>
        Exportar CSV
      </button>
    </section>
  );
}
