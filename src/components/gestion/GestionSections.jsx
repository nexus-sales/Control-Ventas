// src/components/gestion/GestionSections.jsx
// MÓDULO GESTIÓN CONSOLIDADO - Integra ProductosSection, OperadoresSection, AdministracionSection
// CON LIMPIEZA AUTOMÁTICA DE DUPLICADOS Y VALIDACIONES ROBUSTAS

import React, { useState, useMemo, useCallback } from "react";
import { useData } from "../../context/AppContexts";
import Card from "../ui/Card";
import { 
  Building, Plus, Edit3, X, Trash2, Save, Download, Search, SortAsc, SortDesc, 
  Package, AlertTriangle, CheckCircle, Filter
} from "lucide-react";
import { saveAs } from "file-saver";

// ==========================================
// UTILIDADES DE LIMPIEZA Y VALIDACIÓN
// ==========================================

// Limpieza robusta de operadores
const cleanOperadores = (operadores = []) => {
  const seen = new Set();
  return operadores.filter(op => {
    if (!op?.id || !op?.nombre) return false;
    const key = `${op.nombre.toLowerCase().trim()}_${op.sector || 'sin-sector'}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

// Limpieza robusta de productos con validaciones
const cleanProductosRobust = (productos = [], operadores = []) => {
  const operadorIds = new Set(operadores.map(o => o.id));
  const seen = new Set();
  
  return productos.filter(prod => {
    if (!prod?.id || !prod?.nombre) return false;
    
    // Verificar que el operador existe
    if (prod.operador_id && !operadorIds.has(prod.operador_id)) {
      // LOG ELIMINADO
      return false;
    }
    
    // Prevenir duplicados
    const key = `${prod.nombre.toLowerCase().trim()}_${prod.operador_id || 'sin-operador'}`;
    if (seen.has(key)) {
      // LOG ELIMINADO
      return false;
    }
    seen.add(key);
    return true;
  });
};

// Normalización de texto para búsquedas
const normalizeText = (text) => text?.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim() || "";

// ==========================================
// COMPONENTE: ProductoModal (INTEGRADO)
// ==========================================
const ProductoModal = React.memo(({ producto, onSave, onClose, operadores = [] }) => {
  const [form, setForm] = useState(
    producto ? {
      ...producto,
      customFields: { ...producto.customFields }
    } : {
      operador_id: operadores[0]?.id || "",
      nombre: "",
      familia: "",
      pvp: "",
      comision_tipo: "porcentaje",
      comision_valor: "",
      fecha_alta: new Date().toISOString().slice(0, 10),
      contacto: "",
      email: "",
      telefono: "",
      observaciones: "",
      customFields: {}
    }
  );
  
  const [errors, setErrors] = useState({});
  
  const validate = useCallback(() => {
    const newErrors = {};
    if (!form.nombre?.trim()) newErrors.nombre = "Nombre es obligatorio";
    if (!form.operador_id) newErrors.operador_id = "Operador es obligatorio";
    if (!form.pvp || Number(form.pvp) <= 0) newErrors.pvp = "PVP debe ser mayor que 0";
    if (form.comision_valor && Number(form.comision_valor) < 0) newErrors.comision_valor = "Comisión no puede ser negativa";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [form]);
  
  const handleSave = useCallback(() => {
    if (!validate()) return;
    
    const cleanForm = {
      ...form,
      id: form.id || `p_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      nombre: form.nombre.trim(),
      familia: form.familia?.trim() || "Sin clasificar",
      pvp: Number(form.pvp),
      comision_valor: form.comision_valor ? Number(form.comision_valor) : 0,
      activo: true,
      fecha_actualizacion: new Date().toISOString()
    };
    
    onSave(cleanForm);
    onClose();
  }, [form, validate, onSave, onClose]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Package className="w-6 h-6 text-green-500" />
            {producto ? 'Editar Producto' : 'Nuevo Producto'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="space-y-6">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Operador *</label>
              <select 
                className={`w-full border rounded-xl px-3 py-2 ${errors.operador_id ? 'border-red-300' : 'border-slate-200'}`}
                value={form.operador_id}
                onChange={e => setForm(prev => ({...prev, operador_id: e.target.value}))}
              >
                <option value="">Seleccionar operador</option>
                {operadores.map(op => (
                  <option key={op.id} value={op.id}>{op.nombre}</option>
                ))}
              </select>
              {errors.operador_id && <p className="text-xs text-red-600">{errors.operador_id}</p>}
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Nombre *</label>
              <input 
                type="text"
                className={`w-full border rounded-xl px-3 py-2 ${errors.nombre ? 'border-red-300' : 'border-slate-200'}`}
                value={form.nombre}
                onChange={e => setForm(prev => ({...prev, nombre: e.target.value}))}
              />
              {errors.nombre && <p className="text-xs text-red-600">{errors.nombre}</p>}
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Familia</label>
              <input 
                type="text"
                className="w-full border border-slate-200 rounded-xl px-3 py-2"
                value={form.familia}
                onChange={e => setForm(prev => ({...prev, familia: e.target.value}))}
                placeholder="Ej: Fibra, Móvil, Alarmas..."
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">PVP (€) *</label>
              <input 
                type="number"
                min="0"
                step="0.01"
                className={`w-full border rounded-xl px-3 py-2 ${errors.pvp ? 'border-red-300' : 'border-slate-200'}`}
                value={form.pvp}
                onChange={e => setForm(prev => ({...prev, pvp: e.target.value}))}
              />
              {errors.pvp && <p className="text-xs text-red-600">{errors.pvp}</p>}
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Tipo Comisión</label>
              <select 
                className="w-full border border-slate-200 rounded-xl px-3 py-2"
                value={form.comision_tipo}
                onChange={e => setForm(prev => ({...prev, comision_tipo: e.target.value}))}
              >
                <option value="porcentaje">Porcentaje (%)</option>
                <option value="fijo">Importe Fijo (€)</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">
                Valor Comisión ({form.comision_tipo === 'porcentaje' ? '%' : '€'})
              </label>
              <input 
                type="number"
                min="0"
                step="0.01"
                className={`w-full border rounded-xl px-3 py-2 ${errors.comision_valor ? 'border-red-300' : 'border-slate-200'}`}
                value={form.comision_valor}
                onChange={e => setForm(prev => ({...prev, comision_valor: e.target.value}))}
              />
              {errors.comision_valor && <p className="text-xs text-red-600">{errors.comision_valor}</p>}
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Contacto</label>
              <input 
                type="text"
                className="w-full border border-slate-200 rounded-xl px-3 py-2"
                value={form.contacto}
                onChange={e => setForm(prev => ({...prev, contacto: e.target.value}))}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <input 
                type="email"
                className="w-full border border-slate-200 rounded-xl px-3 py-2"
                value={form.email}
                onChange={e => setForm(prev => ({...prev, email: e.target.value}))}
              />
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Observaciones</label>
              <textarea 
                rows="3"
                className="w-full border border-slate-200 rounded-xl px-3 py-2"
                value={form.observaciones}
                onChange={e => setForm(prev => ({...prev, observaciones: e.target.value}))}
              />
            </div>
          </div>
        </div>
        
        <div className="flex justify-end gap-2 mt-6 pt-6 border-t">
          <button 
            onClick={onClose}
            className="px-4 py-2 border border-slate-300 rounded-xl text-slate-600 hover:bg-slate-50"
          >
            Cancelar
          </button>
          <button 
            onClick={handleSave}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700"
          >
            <Save className="w-4 h-4" />
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
});

// ==========================================
// COMPONENTE: OperadorModal (INTEGRADO)  
// ==========================================
const OperadorModal = React.memo(({ operador, onSave, onClose }) => {
  const [form, setForm] = useState(
    operador ? {
      ...operador,
      reglas_decomision: {
        antes_6_meses: 100,
        despues_6_meses: 50,
        limite_meses: 6,
        ...operador.reglas_decomision
      }
    } : {
      nombre: "",
      codigo: "",
      sector: "",
      contacto: "",
      email: "",
      telefono: "",
      fecha_alta: new Date().toISOString().slice(0, 10),
      reglas_decomision: {
        antes_6_meses: 100,
        despues_6_meses: 50,
        limite_meses: 6
      }
    }
  );
  
  const [errors, setErrors] = useState({});
  
  const validate = useCallback(() => {
    const newErrors = {};
    if (!form.nombre?.trim()) newErrors.nombre = "Nombre es obligatorio";
    if (form.reglas_decomision.antes_6_meses < 0 || form.reglas_decomision.antes_6_meses > 100) {
      newErrors.antes_6_meses = "Debe estar entre 0 y 100";
    }
    if (form.reglas_decomision.despues_6_meses < 0 || form.reglas_decomision.despues_6_meses > 100) {
      newErrors.despues_6_meses = "Debe estar entre 0 y 100";
    }
    if (form.reglas_decomision.limite_meses < 1 || form.reglas_decomision.limite_meses > 24) {
      newErrors.limite_meses = "Debe estar entre 1 y 24";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [form]);
  
  const handleSave = useCallback(() => {
    if (!validate()) return;

    // Generar id único si no existe
    let operadorId = form.id || `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const cleanForm = {
      ...form,
      id: operadorId,
      nombre: form.nombre.trim(),
      codigo: form.codigo?.trim().toUpperCase() || '',
      reglas_decomision: {
        antes_6_meses: Number(form.reglas_decomision.antes_6_meses),
        despues_6_meses: Number(form.reglas_decomision.despues_6_meses),
        limite_meses: Number(form.reglas_decomision.limite_meses)
      },
      fecha_actualizacion: new Date().toISOString()
    };

    // Guardar y cerrar
    onSave(cleanForm, true);
    setTimeout(() => { onClose(); }, 100); // Pequeño delay para asegurar persistencia visual
  }, [form, validate, onSave, onClose]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Building className="w-6 h-6 text-purple-500" />
            {operador ? 'Editar Operador' : 'Nuevo Operador'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="space-y-6">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Nombre *</label>
              <input 
                type="text"
                className={`w-full border rounded-xl px-3 py-2 ${errors.nombre ? 'border-red-300' : 'border-slate-200'}`}
                value={form.nombre}
                onChange={e => setForm(prev => ({...prev, nombre: e.target.value}))}
              />
              {errors.nombre && <p className="text-xs text-red-600">{errors.nombre}</p>}
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Código</label>
              <input 
                type="text"
                className="w-full border border-slate-200 rounded-xl px-3 py-2"
                value={form.codigo}
                onChange={e => setForm(prev => ({...prev, codigo: e.target.value}))}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Sector</label>
              <select 
                className="w-full border border-slate-200 rounded-xl px-3 py-2"
                value={form.sector}
                onChange={e => setForm(prev => ({...prev, sector: e.target.value}))}
              >
                <option value="">Seleccionar sector</option>
                <option value="telefonia">Telefonía</option>
                <option value="energia">Energía</option>
                <option value="seguridad">Seguridad/Alarmas</option>
                <option value="internet">Internet</option>
                <option value="seguros">Seguros</option>
                <option value="otros">Otros</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Contacto</label>
              <input 
                type="text"
                className="w-full border border-slate-200 rounded-xl px-3 py-2"
                value={form.contacto}
                onChange={e => setForm(prev => ({...prev, contacto: e.target.value}))}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <input 
                type="email"
                className="w-full border border-slate-200 rounded-xl px-3 py-2"
                value={form.email}
                onChange={e => setForm(prev => ({...prev, email: e.target.value}))}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Teléfono</label>
              <input 
                type="tel"
                className="w-full border border-slate-200 rounded-xl px-3 py-2"
                value={form.telefono}
                onChange={e => setForm(prev => ({...prev, telefono: e.target.value}))}
              />
            </div>
          </div>
          
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold mb-4">Reglas de Decomisión</h3>
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Antes 6M (%)</label>
                <input 
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  className={`w-full border rounded-xl px-3 py-2 ${errors.antes_6_meses ? 'border-red-300' : 'border-slate-200'}`}
                  value={form.reglas_decomision.antes_6_meses}
                  onChange={e => setForm(prev => ({ 
                    ...prev, 
                    reglas_decomision: {...prev.reglas_decomision, antes_6_meses: e.target.value} 
                  }))}
                />
                {errors.antes_6_meses && <p className="text-xs text-red-600">{errors.antes_6_meses}</p>}
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Después 6M (%)</label>
                <input 
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  className={`w-full border rounded-xl px-3 py-2 ${errors.despues_6_meses ? 'border-red-300' : 'border-slate-200'}`}
                  value={form.reglas_decomision.despues_6_meses}
                  onChange={e => setForm(prev => ({ 
                    ...prev, 
                    reglas_decomision: {...prev.reglas_decomision, despues_6_meses: e.target.value} 
                  }))}
                />
                {errors.despues_6_meses && <p className="text-xs text-red-600">{errors.despues_6_meses}</p>}
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Límite (meses)</label>
                <input 
                  type="number"
                  min="1"
                  max="24"
                  className={`w-full border rounded-xl px-3 py-2 ${errors.limite_meses ? 'border-red-300' : 'border-slate-200'}`}
                  value={form.reglas_decomision.limite_meses}
                  onChange={e => setForm(prev => ({ 
                    ...prev, 
                    reglas_decomision: {...prev.reglas_decomision, limite_meses: e.target.value} 
                  }))}
                />
                {errors.limite_meses && <p className="text-xs text-red-600">{errors.limite_meses}</p>}
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex justify-end gap-2 mt-6 pt-6 border-t">
          <button 
            onClick={onClose}
            className="px-4 py-2 border border-slate-300 rounded-xl text-slate-600 hover:bg-slate-50"
          >
            Cancelar
          </button>
          <button 
            onClick={handleSave}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700"
          >
            <Save className="w-4 h-4" />
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
});

// ==========================================
// COMPONENTE: ProductosSection (INTEGRADO + OPTIMIZADO)
// ==========================================
const ProductosSection = React.memo(() => {
  const { data, setProductos } = useData();
  // Estado para selección múltiple de productos
  const [selectedIds, setSelectedIds] = useState([]);
  // Datos limpios y seguros
  const operadores = useMemo(() => cleanOperadores(data.operadores || []), [data.operadores]);
  const productos = useMemo(() => cleanProductosRobust(data.productos || [], operadores), [data.productos, operadores]);
  // Borrado masivo de productos seleccionados
  const handleDeleteSelected = useCallback(() => {
    if (selectedIds.length === 0) return;
    if (window.confirm(`¿Seguro que quieres eliminar ${selectedIds.length} productos seleccionados?`)) {
      setProductos(prev => {
        const cleaned = cleanProductosRobust(prev.filter(p => !selectedIds.includes(p.id)), operadores);
        return cleaned;
      });
      setSelectedIds([]);
    }
  }, [selectedIds, setProductos, operadores]);
  // Selección global de productos
  const handleSelectAll = () => {
    if (selectedIds.length === productosFiltrados.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(productosFiltrados.map(p => p.id));
    }
  };
  
  // Estados locales
  const [showModal, setShowModal] = useState(false);
  const [editingProducto, setEditingProducto] = useState(null);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedOperador, setSelectedOperador] = useState("");
  const [selectedFamilia, setSelectedFamilia] = useState("");
  const [sortDirection, setSortDirection] = useState("asc");
  
  // Familias únicas
  const familias = useMemo(() => {
    const famSet = new Set();
    productos.forEach(p => {
      if (p.familia && p.familia !== 'Sin clasificar') {
        famSet.add(p.familia);
      }
    });
    return Array.from(famSet).sort();
  }, [productos]);
  
  // Función para obtener nombre del operador
  const getOperadorNombre = useCallback((operadorId) => {
    const operador = operadores.find(op => op.id === operadorId);
    return operador?.nombre || "Sin operador";
  }, [operadores]);
  
  // Productos filtrados
  const productosFiltrados = useMemo(() => {
    let filtered = productos;
    
    // Filtro por búsqueda
    if (searchTerm) {
      const searchNorm = normalizeText(searchTerm);
      filtered = filtered.filter(p => 
        normalizeText(p.nombre).includes(searchNorm) ||
        normalizeText(getOperadorNombre(p.operador_id)).includes(searchNorm) ||
        normalizeText(p.familia || '').includes(searchNorm)
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
    
    // Ordenamiento
    filtered.sort((a, b) => {
      const comparison = a.nombre.localeCompare(b.nombre);
      return sortDirection === "asc" ? comparison : -comparison;
    });
    
    return filtered;
  }, [productos, searchTerm, selectedOperador, selectedFamilia, sortDirection, getOperadorNombre]);
  
  // Validar duplicados
  const productExists = useCallback((nombre, operadorId, excludeId = null) => {
    return productos.some(p => 
      p.id !== excludeId && 
      p.nombre?.toLowerCase().trim() === nombre?.toLowerCase().trim() &&
      p.operador_id === operadorId
    );
  }, [productos]);
  
  // Manejadores
  const handleSave = useCallback((productoData) => {
    if (productExists(productoData.nombre, productoData.operador_id, productoData.id)) {
      setError(`Ya existe un producto con ese nombre para el operador seleccionado.`);
      return;
    }
    
    if (productoData.id) {
      // Actualizar
      setProductos(prev => {
        const cleaned = cleanProductosRobust(prev, operadores);
        return cleaned.map(p => p.id === productoData.id ? productoData : p);
      });
    } else {
      // Crear nuevo
      setProductos(prev => {
        const cleaned = cleanProductosRobust(prev, operadores);
        return [...cleaned, productoData];
      });
    }
    setError("");
  }, [productExists, setProductos, operadores]);
  
  const handleDelete = useCallback((id) => {
    if (window.confirm("¿Seguro que quieres eliminar este producto?")) {
      setProductos(prev => {
        const cleaned = cleanProductosRobust(prev.filter(p => p.id !== id), operadores);
        return cleaned;
      });
    }
  }, [setProductos, operadores]);
  
  const exportCSV = useCallback(() => {
    if (!productosFiltrados.length) return;
    
    const headers = ["ID", "Nombre", "Operador", "Familia", "PVP", "Comisión", "Tipo Comisión", "Contacto", "Email", "Teléfono"];
    const rows = productosFiltrados.map(p => [
      p.id, 
      p.nombre, 
      getOperadorNombre(p.operador_id), 
      p.familia, 
      p.pvp, 
      p.comision_valor, 
      p.comision_tipo, 
      p.contacto, 
      p.email, 
      p.telefono
    ]);
    
    const csv = [headers.join(",")]
      .concat(rows.map(r => r.map(v => `"${String(v || '').replace(/"/g, '""')}"`).join(",")))
      .join("\r\n");
    
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    saveAs(blob, `productos_${new Date().toISOString().slice(0,10)}.csv`);
  }, [productosFiltrados, getOperadorNombre]);

  return (
    <section className="space-y-6">
      {/* Limpieza automática notificación */}
      {data.productos && data.productos.length !== productos.length && (
        <Card className="bg-amber-50 border-amber-200">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
            <div>
              <p className="font-medium text-amber-800">Productos duplicados eliminados</p>
              <p className="text-sm text-amber-700">
                Se eliminaron {data.productos.length - productos.length} productos duplicados o con operadores inexistentes.
              </p>
            </div>
          </div>
        </Card>
      )}
      
      {/* Encabezado */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Gestión de Productos</h2>
        <div className="flex gap-2">
          <button 
            onClick={() => { setEditingProducto(null); setShowModal(true); }}
            className="px-4 py-2 bg-green-600 text-white rounded-xl flex items-center gap-2 hover:bg-green-700"
          >
            <Plus className="w-4 h-4" />
            Nuevo Producto
          </button>
          <button 
            onClick={exportCSV}
            className="px-4 py-2 border border-green-300 rounded-xl text-green-600 flex items-center gap-2 hover:bg-green-50"
          >
            <Download className="w-4 h-4" />
            Exportar CSV
          </button>
          <button
            onClick={handleDeleteSelected}
            disabled={selectedIds.length === 0}
            className={`px-4 py-2 bg-red-600 text-white rounded-xl flex items-center gap-2 hover:bg-red-700 ${selectedIds.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <Trash2 className="w-4 h-4" />
            Borrar seleccionados
          </button>
        </div>
      </div>
      
      {/* Estadísticas */}
      <div className="grid md:grid-cols-4 gap-4 mb-6">
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-600 text-sm font-medium">Total Productos</p>
              <div className="text-2xl font-bold">{productos.length}</div>
            </div>
            <Package className="w-8 h-8 text-green-600" />
          </div>
        </Card>
        
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-600 text-sm font-medium">Familias</p>
              <div className="text-2xl font-bold">{familias.length}</div>
            </div>
          </div>
        </Card>
        
        <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-yellow-600 text-sm font-medium">Operadores</p>
              <div className="text-2xl font-bold">{operadores.length}</div>
            </div>
          </div>
        </Card>
        
        <Card className="bg-gradient-to-br from-slate-50 to-slate-100 border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-600 text-sm font-medium">Activos</p>
              <div className="text-2xl font-bold">{productos.filter(p => p.activo !== false).length}</div>
            </div>
          </div>
        </Card>
      </div>
      
      {/* Filtros */}
      <div className="flex gap-4 mb-6">
        <div className="flex-1">
          <input 
            type="text"
            className="w-full border rounded-xl px-3 py-2"
            placeholder="Buscar producto..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div>
          <select 
            className="border rounded-xl px-3 py-2"
            value={selectedOperador}
            onChange={e => setSelectedOperador(e.target.value)}
          >
            <option value="">Todos los operadores</option>
            {operadores.map(op => (
              <option key={op.id} value={op.id}>{op.nombre}</option>
            ))}
          </select>
        </div>
        
        <div>
          <select 
            className="border rounded-xl px-3 py-2"
            value={selectedFamilia}
            onChange={e => setSelectedFamilia(e.target.value)}
          >
            <option value="">Todas las familias</option>
            {familias.map(f => (
              <option key={f} value={f}>{f}</option>
            ))}
          </select>
        </div>
        
        <div>
          <button 
            onClick={() => setSortDirection(sortDirection === "asc" ? "desc" : "asc")}
            className="px-3 py-2 border rounded-xl flex items-center gap-1"
          >
            {sortDirection === "asc" ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />}
            Ordenar
          </button>
        </div>
      </div>
      
      {/* Error */}
      {error && (
        <Card className="bg-red-50 border-red-200">
          <div className="text-red-600">{error}</div>
        </Card>
      )}
      
      {/* Selección múltiple y borrado masivo */}
      <div className="overflow-x-auto">
        <table className="min-w-full border-separate border-spacing-y-2 text-xs md:text-sm">
          <thead>
            <tr className="text-left text-slate-500 uppercase tracking-wide text-[11px] md:text-xs">
              <th>
                <input type="checkbox" checked={selectedIds?.length === productosFiltrados.length && productosFiltrados.length > 0} onChange={handleSelectAll} />
              </th>
              <th>Nombre</th>
              <th>Operador</th>
              <th>Familia</th>
              <th>PVP</th>
              <th>Comisión</th>
              <th>Tipo</th>
              <th>Contacto</th>
              <th>Email</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {productosFiltrados.map(p => (
              <tr key={p.id} className="bg-white hover:bg-green-50">
                <td>
                  <input type="checkbox" checked={selectedIds?.includes(p.id)} onChange={() => handleSelect(p.id)} />
                </td>
                <td className="font-medium">{p.nombre}</td>
                <td>{getOperadorNombre(p.operador_id)}</td>
                <td>{p.familia || 'Sin clasificar'}</td>
                <td>{p.pvp} €</td>
                <td>{p.comision_valor} {p.comision_tipo === 'porcentaje' ? '%' : '€'}</td>
                <td className="capitalize">{p.comision_tipo}</td>
                <td>{p.contacto}</td>
                <td>{p.email}</td>
                <td className="flex gap-2">
                  <button 
                    onClick={() => { setEditingProducto(p); setShowModal(true); }}
                    className="p-1 rounded hover:bg-green-100"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => handleDelete(p.id)}
                    className="p-1 rounded hover:bg-red-100"
                  >
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </button>
                </td>
              </tr>
            ))}
            {productosFiltrados.length === 0 && (
              <tr>
                <td colSpan={10} className="text-center text-slate-400 py-6">
                  No hay productos registrados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      {/* Modal */}
      {showModal && (
        <ProductoModal 
          producto={editingProducto}
          onSave={handleSave}
          onClose={() => setShowModal(false)}
          operadores={operadores}
        />
      )}
    </section>
  );
});

// ==========================================
// COMPONENTE: OperadoresSection (INTEGRADO + CONTEO PRODUCTOS)
// ==========================================
const OperadoresSection = React.memo(() => {
  const { data, setOperadores } = useData();
  const operadores = useMemo(() => cleanOperadores(data.operadores || []), [data.operadores]);
  const productos = useMemo(() => cleanProductosRobust(data.productos || [], operadores), [data.productos, operadores]);
  
  const [showModal, setShowModal] = useState(false);
  const [editingOperador, setEditingOperador] = useState(null);
  const [error, setError] = useState("");
  const [filtroSector, setFiltroSector] = useState("");
  const [filtroProductos, setFiltroProductos] = useState(""); // "con-productos", "sin-productos", ""
  
  // Conteo de productos por operador
  const productosConteo = useMemo(() => {
    const conteo = {};
    operadores.forEach(op => {
      conteo[op.id] = productos.filter(p => p.operador_id === op.id).length;
    });
    return conteo;
  }, [operadores, productos]);
  
  // Estadísticas por sector CON productos
  const sectorStats = useMemo(() => {
    const stats = {
      telefonia: { operadores: 0, productos: 0 },
      energia: { operadores: 0, productos: 0 },
      seguridad: { operadores: 0, productos: 0 },
      otros: { operadores: 0, productos: 0 },
    };
    
    operadores.forEach(o => {
      const sector = ['telefonia', 'energia', 'seguridad'].includes(o.sector) ? o.sector : 'otros';
      stats[sector].operadores++;
      stats[sector].productos += productosConteo[o.id] || 0;
    });
    
    return stats;
  }, [operadores, productosConteo]);
  
  // Top operadores por productos
  const topOperadores = useMemo(() => {
    return operadores
      .map(op => ({ ...op, totalProductos: productosConteo[op.id] || 0 }))
      .sort((a, b) => b.totalProductos - a.totalProductos)
      .slice(0, 5);
  }, [operadores, productosConteo]);
  
  // Operadores filtrados
  const operadoresFiltrados = useMemo(() => {
    let filtered = operadores;
    
    // Filtro por sector
    if (filtroSector) {
      if (filtroSector === 'otros') {
        filtered = filtered.filter(o => !['telefonia', 'energia', 'seguridad'].includes(o.sector));
      } else {
        filtered = filtered.filter(o => o.sector === filtroSector);
      }
    }
    
    // Filtro por productos
    if (filtroProductos === 'con-productos') {
      filtered = filtered.filter(o => (productosConteo[o.id] || 0) > 0);
    } else if (filtroProductos === 'sin-productos') {
      filtered = filtered.filter(o => (productosConteo[o.id] || 0) === 0);
    }
    
    // Ordenar por número de productos (descendente) y luego por nombre
    return filtered.sort((a, b) => {
      const productosA = productosConteo[a.id] || 0;
      const productosB = productosConteo[b.id] || 0;
      
      if (productosA !== productosB) {
        return productosB - productosA; // Más productos primero
      }
      return a.nombre.localeCompare(b.nombre); // Alfabético si mismo número productos
    });
  }, [operadores, productosConteo, filtroSector, filtroProductos]);
  
  // Validar duplicados
  const operadorExists = useCallback((nombre, excludeId = null) => {
    return operadores.some(o => 
      o.id !== excludeId && 
      o.nombre?.toLowerCase().trim() === nombre?.toLowerCase().trim()
    );
  }, [operadores]);
  
  const handleSave = useCallback((operadorData) => {
    if (operadorExists(operadorData.nombre, operadorData.id)) {
      setError(`Ya existe un operador con el nombre "${operadorData.nombre}"`);
      return;
    }
    
    if (operadorData.id) {
      setOperadores(prev => {
        const cleaned = cleanOperadores(prev);
        return cleaned.map(o => o.id === operadorData.id ? operadorData : o);
      });
    } else {
      setOperadores(prev => {
        const cleaned = cleanOperadores(prev);
        return [...cleaned, operadorData];
      });
    }
    setError("");
  }, [operadorExists, setOperadores]);
  
  const handleDelete = useCallback((id) => {
    const numProductos = productosConteo[id] || 0;
    const operador = operadores.find(o => o.id === id);
    
    if (numProductos > 0) {
      const confirm = window.confirm(
        `¿Estás seguro de eliminar "${operador?.nombre}"?\n\n` +
        `⚠️  ATENCIÓN: Este operador tiene ${numProductos} producto(s) asociado(s).\n` +
        `Los productos quedarán sin operador asignado.\n\n` +
        `¿Continuar con la eliminación?`
      );
      if (!confirm) return;
    } else {
      if (!window.confirm(`¿Seguro que quieres eliminar "${operador?.nombre}"?`)) return;
    }
    
    setOperadores(prev => {
      const cleaned = cleanOperadores(prev.filter(o => o.id !== id));
      return cleaned;
    });
  }, [setOperadores, productosConteo, operadores]);
  
  const exportCSV = useCallback(() => {
    if (!operadoresFiltrados.length) return;
    
    const headers = ["ID", "Nombre", "Sector", "Código", "Productos", "Contacto", "Teléfono", "Email"];
    const rows = operadoresFiltrados.map(o => [
      o.id, 
      o.nombre, 
      o.sector, 
      o.codigo, 
      productosConteo[o.id] || 0, // <- Nueva columna productos
      o.contacto, 
      o.telefono, 
      o.email
    ]);
    const csv = [headers.join(",")]
      .concat(rows.map(r => r.map(v => `"${String(v || '').replace(/"/g, '""')}"`).join(",")))
      .join("\r\n");
    
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const filename = filtroSector || filtroProductos 
      ? `operadores_filtrado_${new Date().toISOString().slice(0,10)}.csv`
      : `operadores_${new Date().toISOString().slice(0,10)}.csv`;
    saveAs(blob, filename);
  }, [operadoresFiltrados, productosConteo, filtroSector, filtroProductos]);

  return (
    <section className="space-y-6">
      {/* Notificación de limpieza */}
      {data.operadores && data.operadores.length !== operadores.length && (
        <Card className="bg-amber-50 border-amber-200">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
            <div>
              <p className="font-medium text-amber-800">Operadores duplicados eliminados</p>
              <p className="text-sm text-amber-700">
                Se eliminaron {data.operadores.length - operadores.length} operadores duplicados.
              </p>
            </div>
          </div>
        </Card>
      )}
      
      {/* Estadísticas por sector CON productos */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-600 text-sm font-medium">Telefonía</p>
              <div className="text-2xl font-bold">{sectorStats.telefonia.operadores}</div>
              <div className="text-xs text-blue-500">{sectorStats.telefonia.productos} productos</div>
            </div>
            <Building className="w-8 h-8 text-blue-600" />
          </div>
        </Card>
        
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-600 text-sm font-medium">Energía</p>
              <div className="text-2xl font-bold">{sectorStats.energia.operadores}</div>
              <div className="text-xs text-green-500">{sectorStats.energia.productos} productos</div>
            </div>
          </div>
        </Card>
        
        <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-yellow-600 text-sm font-medium">Seguridad</p>
              <div className="text-2xl font-bold">{sectorStats.seguridad.operadores}</div>
              <div className="text-xs text-yellow-500">{sectorStats.seguridad.productos} productos</div>
            </div>
          </div>
        </Card>
        
        <Card className="bg-gradient-to-br from-slate-50 to-slate-100 border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-600 text-sm font-medium">Otros</p>
              <div className="text-2xl font-bold">{sectorStats.otros.operadores}</div>
              <div className="text-xs text-slate-500">{sectorStats.otros.productos} productos</div>
            </div>
          </div>
        </Card>
      </div>
      
      {/* Top operadores por productos */}
      <Card className="bg-gradient-to-r from-purple-50 to-indigo-50 border-purple-200">
        <div className="p-4">
          <h3 className="text-lg font-semibold text-purple-800 mb-3 flex items-center gap-2">
            🏆 Top Operadores por Productos
          </h3>
          <div className="grid md:grid-cols-5 gap-3">
            {topOperadores.map((op, index) => (
              <div key={op.id} className="bg-white rounded-lg p-3 text-center shadow-sm">
                <div className="text-sm font-medium text-slate-700 truncate" title={op.nombre}>
                  {op.nombre}
                </div>
                <div className="text-lg font-bold text-purple-600">{op.totalProductos}</div>
                <div className="text-xs text-slate-500">
                  {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : ''}
                  {op.sector && <span className="capitalize"> {op.sector}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>
      
      {/* Encabezado CON filtros */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mt-8 mb-4 gap-4">
        <h2 className="text-xl font-bold">Gestión de Operadores ({operadoresFiltrados.length})</h2>
        
        <div className="flex flex-wrap gap-2">
          {/* Filtros */}
          <div className="flex gap-2">
            <select 
              className="border rounded-lg px-3 py-2 text-sm bg-white"
              value={filtroSector}
              onChange={e => setFiltroSector(e.target.value)}
            >
              <option value="">Todos los sectores</option>
              <option value="telefonia">Telefonía</option>
              <option value="energia">Energía</option>
              <option value="seguridad">Seguridad</option>
              <option value="otros">Otros</option>
            </select>
            
            <select 
              className="border rounded-lg px-3 py-2 text-sm bg-white"
              value={filtroProductos}
              onChange={e => setFiltroProductos(e.target.value)}
            >
              <option value="">Todos</option>
              <option value="con-productos">Con productos</option>
              <option value="sin-productos">Sin productos</option>
            </select>
          </div>
          
          {/* Botones acción */}
          <div className="flex gap-2">
            <button 
              onClick={() => { setEditingOperador(null); setShowModal(true); }}
              className="px-4 py-2 bg-purple-600 text-white rounded-xl flex items-center gap-2 hover:bg-purple-700 text-sm"
            >
              <Plus className="w-4 h-4" />
              Nuevo Operador
            </button>
            <button 
              onClick={exportCSV}
              className="px-4 py-2 border border-purple-300 rounded-xl text-purple-600 flex items-center gap-2 hover:bg-purple-50 text-sm"
            >
              <Download className="w-4 h-4" />
              Exportar CSV
            </button>
          </div>
        </div>
      </div>
      
      {/* Error */}
      {error && (
        <Card className="bg-red-50 border-red-200">
          <div className="text-red-600">{error}</div>
        </Card>
      )}
      
      {/* Tabla CON conteo productos */}
      <div className="overflow-x-auto">
        <table className="min-w-full border-separate border-spacing-y-2 text-xs md:text-sm">
          <thead>
            <tr className="text-left text-slate-500 uppercase tracking-wide text-[11px] md:text-xs">
              <th>Nombre</th>
              <th>Código</th>
              <th>Sector</th>
              <th className="text-center">📦 Productos</th>
              <th>Contacto</th>
              <th>Email</th>
              <th>Teléfono</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {operadoresFiltrados.map(op => {
              const numProductos = productosConteo[op.id] || 0;
              return (
                <tr key={op.id} className="bg-white hover:bg-purple-50">
                  <td className="font-medium">{op.nombre}</td>
                  <td>{op.codigo}</td>
                  <td className="capitalize">{op.sector || 'Sin sector'}</td>
                  <td className="text-center">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      numProductos === 0 
                        ? 'bg-red-100 text-red-700' 
                        : numProductos <= 3 
                        ? 'bg-yellow-100 text-yellow-700' 
                        : 'bg-green-100 text-green-700'
                    }`}>
                      {numProductos}
                    </span>
                  </td>
                  <td>{op.contacto}</td>
                  <td>{op.email}</td>
                  <td>{op.telefono}</td>
                  <td className="flex gap-2">
                    <button 
                      onClick={() => { setEditingOperador(op); setShowModal(true); }}
                      className="p-1 rounded hover:bg-purple-100"
                      title="Editar operador"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleDelete(op.id)}
                      className="p-1 rounded hover:bg-red-100"
                      title={numProductos > 0 ? `Tiene ${numProductos} productos asociados` : 'Eliminar operador'}
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </button>
                  </td>
                </tr>
              );
            })}
            {operadoresFiltrados.length === 0 && (
              <tr>
                <td colSpan={8} className="text-center text-slate-400 py-6">
                  {filtroSector || filtroProductos ? 
                    'No se encontraron operadores con los filtros aplicados.' : 
                    'No hay operadores registrados.'
                  }
                </td>
              </tr>
            )}
          </tbody>
        </table>
        
        {/* Resumen de filtros */}
        {(filtroSector || filtroProductos) && (
          <div className="mt-4 p-3 bg-slate-50 rounded-lg">
            <div className="flex flex-wrap items-center gap-2 text-sm text-slate-600">
              <span>Filtros activos:</span>
              {filtroSector && (
                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs capitalize">
                  Sector: {filtroSector}
                </span>
              )}
              {filtroProductos && (
                <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs">
                  {filtroProductos === 'con-productos' ? 'Con productos' : 'Sin productos'}
                </span>
              )}
              <button 
                onClick={() => {setFiltroSector(''); setFiltroProductos('');}}
                className="text-red-600 hover:text-red-800 text-xs underline"
              >
                Limpiar filtros
              </button>
            </div>
          </div>
        )}
      </div>
      
      {/* Modal */}
      {showModal && (
        <OperadorModal 
          operador={editingOperador}
          onSave={handleSave}
          onClose={() => setShowModal(false)}
        />
      )}
    </section>
  );
});

// ==========================================
// COMPONENTE: AdministracionSection (INTEGRADO)
// ==========================================
const AdministracionSection = React.memo(() => {
  const OPERADORES = ["Telefonía", "Energía", "Seguridad"];
  const CLAVE_GERENTE = "@LMB1828re"; // Puedes cambiarla luego
  
  const [acuerdos, setAcuerdos] = useState([]);
  const [form, setForm] = useState({
    sector: "Telefonía",
    operador: "",
    nombre: "",
    comision: "",
    rapel: "",
    observaciones: "",
    archivo: null,
    archivoNombre: ""
  });
  const [clave, setClave] = useState("");
  const [acceso, setAcceso] = useState(false);
  const [errorClave, setErrorClave] = useState("");

  // Validar clave
  const handleClaveSubmit = useCallback((e) => {
    e.preventDefault();
    if (clave === CLAVE_GERENTE) {
      setAcceso(true);
      setErrorClave("");
    } else {
      setErrorClave("Clave incorrecta");
    }
  }, [clave]);

  // Guardar acuerdo
  const handleFormSubmit = useCallback((e) => {
    e.preventDefault();
    
    // Validación básica
    if (!form.operador.trim() || !form.nombre.trim() || !form.comision.trim()) {
      alert("Por favor, rellena los campos obligatorios.");
      return;
    }
    
    setAcuerdos(prev => [...prev, { ...form, id: Date.now() }]);
    setForm({ 
      sector: "Telefonía", 
      operador: "", 
      nombre: "", 
      comision: "", 
      rapel: "", 
      observaciones: "", 
      archivo: null, 
      archivoNombre: "" 
    });
  }, [form]);

  const handleDelete = useCallback((id) => {
    setAcuerdos(prev => prev.filter(a => a.id !== id));
  }, []);

  if (!acceso) {
    return (
      <div className="max-w-md mx-auto mt-16 p-6 bg-white rounded-xl shadow-lg">
        <h2 className="text-xl font-bold mb-4">Acceso Gerente</h2>
        <form onSubmit={handleClaveSubmit} className="space-y-4">
          <input
            type="password"
            className="border rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-blue-400"
            placeholder="Clave de acceso"
            value={clave}
            onChange={e => setClave(e.target.value)}
            required
          />
          {errorClave && <div className="text-red-600 text-sm">{errorClave}</div>}
          <button 
            type="submit"
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg w-full transition-colors"
          >
            Acceder
          </button>
        </form>
      </div>
    );
  }

  return (
    <section className="max-w-4xl mx-auto mt-8 p-6 bg-white rounded-xl shadow-lg">
      <h2 className="text-2xl font-bold mb-6">Gestión Administrativa</h2>
      
      <form onSubmit={handleFormSubmit} className="space-y-4 mb-8 bg-slate-50 p-6 rounded-xl">
        <h3 className="text-lg font-semibold mb-4">Nuevo Acuerdo</h3>
        
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Sector</label>
            <select
              className="border rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-blue-400"
              value={form.sector}
              onChange={e => setForm(f => ({ ...f, sector: e.target.value }))}
            >
              {OPERADORES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Operador *</label>
            <input
              type="text"
              className="border rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-blue-400"
              placeholder="Nombre del operador"
              value={form.operador}
              onChange={e => setForm(f => ({ ...f, operador: e.target.value }))}
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Nombre del acuerdo *</label>
            <input
              type="text"
              className="border rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-blue-400"
              placeholder="Ej: Contrato Q4 2024"
              value={form.nombre}
              onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Comisión (%) *</label>
            <input
              type="number"
              min="0"
              max="100"
              step="0.1"
              className="border rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-blue-400"
              placeholder="15.5"
              value={form.comision}
              onChange={e => setForm(f => ({ ...f, comision: e.target.value }))}
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Rapel</label>
            <input
              type="text"
              className="border rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-blue-400"
              placeholder="Ej: 2% adicional por objetivos"
              value={form.rapel}
              onChange={e => setForm(f => ({ ...f, rapel: e.target.value }))}
            />
          </div>
          
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-1">Observaciones</label>
            <textarea
              className="border rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-blue-400"
              rows="3"
              placeholder="Detalles adicionales del acuerdo..."
              value={form.observaciones}
              onChange={e => setForm(f => ({ ...f, observaciones: e.target.value }))}
            />
          </div>
        </div>
        
        <button 
          type="submit"
          className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-lg font-medium transition-colors"
        >
          Guardar acuerdo
        </button>
      </form>
      
      <div>
        <h3 className="text-lg font-semibold mb-4">Acuerdos guardados ({acuerdos.length})</h3>
        
        {acuerdos.length === 0 ? (
          <Card className="text-center py-8 text-slate-500">
            No hay acuerdos guardados.
          </Card>
        ) : (
          <div className="space-y-3">
            {acuerdos.map(a => (
              <Card key={a.id} className="p-4 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-semibold text-slate-800">{a.nombre}</h4>
                    <p className="text-sm text-slate-600">{a.operador} ({a.sector})</p>
                    <p className="text-sm text-slate-600">Comisión: {a.comision}%</p>
                    {a.rapel && <p className="text-xs text-slate-500">Rapel: {a.rapel}</p>}
                    {a.observaciones && (
                      <p className="text-xs text-slate-500 mt-2">{a.observaciones}</p>
                    )}
                  </div>
                  <button 
                    onClick={() => handleDelete(a.id)}
                    className="text-red-500 hover:text-red-700 text-sm font-medium"
                  >
                    Eliminar
                  </button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </section>
  );
});

// ==========================================
// COMPONENTE PRINCIPAL: GestionSections (CONSOLIDADO)
// ==========================================
export default function GestionSections() {
  const [activeSection, setActiveSection] = useState('operadores');
  
  // Secciones de gestión
  const sections = useMemo(() => [
    { id: 'operadores', label: 'Operadores', icon: '🏢', color: 'purple' },
    { id: 'productos', label: 'Productos', icon: '📦', color: 'green' },
    { id: 'administracion', label: 'Administración', icon: '⚙️', color: 'blue' }
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
                  ? `bg-${section.color}-100 dark:bg-${section.color}-900/30 text-${section.color}-700 dark:text-${section.color}-300`
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
      <div className="min-h-[600px]">
        {activeSection === 'operadores' && (
          <div className="bg-gradient-to-br from-white via-slate-50 to-purple-50 dark:from-darkBg dark:via-darkCard dark:to-darkCard rounded-2xl shadow-xl border border-slate-200 dark:border-darkAccent/30 p-6 transition-colors">
            <OperadoresSection />
          </div>
        )}

        {activeSection === 'productos' && (
          <div className="bg-gradient-to-br from-white via-slate-50 to-green-50 dark:from-darkBg dark:via-darkCard dark:to-darkCard rounded-2xl shadow-xl border border-slate-200 dark:border-darkAccent/30 p-6 transition-colors">
            <ProductosSection />
          </div>
        )}

        {activeSection === 'administracion' && (
          <div className="bg-gradient-to-br from-white via-slate-50 to-blue-50 dark:from-darkBg dark:via-darkCard dark:to-darkCard rounded-2xl shadow-xl border border-slate-200 dark:border-darkAccent/30 p-6 transition-colors">
            <AdministracionSection />
          </div>
        )}
      </div>
    </div>
  );
}

// Exportar también los subcomponentes para uso independiente si es necesario
export { ProductosSection, OperadoresSection, AdministracionSection };