import React, { useState, useMemo } from "react";
import { saveAs } from "file-saver";
import Card from "../ui/Card";
import { useImportGestion } from "../../hooks/useImportGestion";
import {
  Package,
  Plus,
  Edit3,
  X,
  Trash2,
  Search,
  Download,
  Save,
  SortAsc,
  SortDesc
} from "lucide-react";
import { getSectorIcon, getSectorColor } from "../../utils/operadores.jsx";

// Modal consolidado para productos (integrado)
function ProductoModal({ producto, onSave, onClose, operadores, customFields }) {
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

  const validate = () => {
    const newErrors = {};
    
    if (!form.nombre?.trim()) newErrors.nombre = "Nombre es obligatorio";
    if (!form.operador_id) newErrors.operador_id = "Operador es obligatorio";
    if (!form.pvp || Number(form.pvp) <= 0) newErrors.pvp = "PVP debe ser mayor que 0";
    if (form.comision_valor && Number(form.comision_valor) < 0) newErrors.comision_valor = "Comisión no puede ser negativa";
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    
    const cleanForm = {
      ...form,
      id: form.id || `p_${Date.now()}`,
      nombre: form.nombre.trim(),
      familia: form.familia?.trim() || "Sin clasificar",
      pvp: Number(form.pvp),
      comision_valor: form.comision_valor ? Number(form.comision_valor) : 0,
      activo: true
    };
    
    onSave(cleanForm);
    onClose();
  };

  const updateCustomField = (fieldId, value) => {
    setForm(prev => ({
      ...prev,
      customFields: { ...prev.customFields, [fieldId]: value }
    }));
  };

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
          {/* Datos principales */}
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
              <label className="block text-sm font-medium mb-1">Fecha Alta</label>
              <input
                type="date"
                className="w-full border border-slate-200 rounded-xl px-3 py-2"
                value={form.fecha_alta}
                onChange={e => setForm(prev => ({...prev, fecha_alta: e.target.value}))}
              />
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

          {/* Campos personalizados */}
          {customFields.length > 0 && (
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold mb-4">Campos Personalizados</h3>
              <div className="grid md:grid-cols-2 gap-4">
                {customFields.map(field => (
                  <div key={field.id}>
                    <label className="block text-sm font-medium mb-1">{field.nombre}</label>
                    <input
                      type={field.tipo || 'text'}
                      className="w-full border border-slate-200 rounded-xl px-3 py-2"
                      value={form.customFields?.[field.id] || ''}
                      onChange={e => updateCustomField(field.id, e.target.value)}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
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
}

// Componente principal consolidado
export default function ProductosSection({ productos, setProductos, operadores }) {
  const { customFields } = useImportGestion({ modulo: 'productos' });
  const [showModal, setShowModal] = useState(false);
  const [editingProducto, setEditingProducto] = useState(null);
  const [error, setError] = useState("");

  // Filtros y búsqueda
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedOperador, setSelectedOperador] = useState("");
  const [selectedFamilia, setSelectedFamilia] = useState("");
  const [selectedComisionTipo, setSelectedComisionTipo] = useState("");
  const [sortField, setSortField] = useState("nombre");
  const [sortDirection, setSortDirection] = useState("asc");

  // Utilidades
  const normalizeText = (text) => {
    return text?.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
  };

  const productExists = (nombre, operadorId, excludeId = null) => {
    return productos.some(p => 
      p.id !== excludeId &&
      p.operador_id === operadorId &&
      normalizeText(p.nombre) === normalizeText(nombre)
    );
  };

  const getOperadorNombre = (operador_id) => {
    return operadores.find(op => op.id === operador_id)?.nombre || "Sin operador";
  };

  // Familias únicas para filtros
  const familias = useMemo(() => {
    const familiasSet = new Set(productos.map(p => p.familia).filter(Boolean));
    return Array.from(familiasSet).sort();
  }, [productos]);

  // Productos filtrados y ordenados
  const productosFiltrados = useMemo(() => {
    let filtered = productos;

    if (searchTerm) {
      filtered = filtered.filter(p => 
        p.nombre?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedOperador) {
      filtered = filtered.filter(p => p.operador_id === selectedOperador);
    }

    if (selectedFamilia) {
      filtered = filtered.filter(p => p.familia === selectedFamilia);
    }

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
        case "pvp":
        case "comision_valor":
          aValue = Number(a[sortField]) || 0;
          bValue = Number(b[sortField]) || 0;
          break;
        default:
          aValue = a[sortField] || "";
          bValue = b[sortField] || "";
      }

      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      return sortDirection === "asc" ? 
        (aValue > bValue ? 1 : -1) : 
        (aValue < bValue ? 1 : -1);
    });

    return filtered;
  }, [productos, searchTerm, selectedOperador, selectedFamilia, selectedComisionTipo, sortField, sortDirection, getOperadorNombre]);

  // Estadísticas
  const estadisticas = useMemo(() => {
    const stats = {
      total: productos.length,
      sinPvp: productos.filter(p => !p.pvp || p.pvp <= 0).length,
      porcentaje: productos.filter(p => p.comision_tipo === 'porcentaje').length,
      fijo: productos.filter(p => p.comision_tipo === 'fijo').length
    };
    
    // Stats por operador
    stats.porOperador = {};
    operadores.forEach(op => {
      stats.porOperador[op.id] = productos.filter(p => p.operador_id === op.id).length;
    });

    return stats;
  }, [productos, operadores]);

  // Guardar producto
  const handleSave = (productoData) => {
    if (productExists(productoData.nombre, productoData.operador_id, productoData.id)) {
      setError(`Ya existe un producto "${productoData.nombre}" para este operador`);
      return;
    }

    if (productoData.id) {
      // Actualizar
      setProductos(prev => prev.map(p => p.id === productoData.id ? productoData : p));
    } else {
      // Crear nuevo
      setProductos(prev => [...prev, productoData]);
    }

    setError("");
  };

  // Eliminar producto
  const handleDelete = (id) => {
    if (window.confirm("¿Seguro que quieres eliminar este producto?")) {
      setProductos(prev => prev.filter(p => p.id !== id));
    }
  };

  // Exportar CSV
  const exportCSV = () => {
    if (!productosFiltrados.length) return;
    
    const baseHeaders = ["ID", "Nombre", "Familia", "PVP", "Tipo Comisión", "Valor Comisión", "Operador"];
    const customHeaders = customFields.map(f => f.nombre);
    const headers = [...baseHeaders, ...customHeaders];
    
    const rows = productosFiltrados.map(p => [
      p.id, p.nombre, p.familia, p.pvp, p.comision_tipo, p.comision_valor, 
      getOperadorNombre(p.operador_id),
      ...customFields.map(f => p.customFields?.[f.id] ?? "")
    ]);
    
    const csv = [headers.join(",")]
      .concat(rows.map(r => r.map(v => `"${String(v || '').replace(/"/g, '""')}"`).join(",")))
      .join("\r\n");
    
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    saveAs(blob, `productos_${new Date().toISOString().slice(0,10)}.csv`);
  };

  // Limpiar filtros
  const clearFilters = () => {
    setSearchTerm("");
    setSelectedOperador("");
    setSelectedFamilia("");
    setSelectedComisionTipo("");
  };

  // Cambiar ordenación
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(prev => prev === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  return (
    <div className="space-y-6">
      {/* Estadísticas */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-600 text-sm font-medium">Total Productos</p>
              <p className="text-2xl font-bold text-green-800">{estadisticas.total}</p>
            </div>
            <Package className="w-8 h-8 text-green-600" />
          </div>
        </Card>
        
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-600 text-sm font-medium">Comisión %</p>
              <p className="text-2xl font-bold text-blue-800">{estadisticas.porcentaje}</p>
            </div>
            <div className="text-blue-600 text-lg font-bold">%</div>
          </div>
        </Card>
        
        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-600 text-sm font-medium">Comisión Fija</p>
              <p className="text-2xl font-bold text-purple-800">{estadisticas.fijo}</p>
            </div>
            <div className="text-purple-600 text-lg font-bold">€</div>
          </div>
        </Card>
        
        {estadisticas.sinPvp > 0 && (
          <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-600 text-sm font-medium">Sin PVP</p>
                <p className="text-2xl font-bold text-red-800">{estadisticas.sinPvp}</p>
              </div>
              <div className="text-red-600 text-lg font-bold">!</div>
            </div>
          </Card>
        )}
      </div>

      {/* Error */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <div className="text-red-700 font-medium">{error}</div>
        </Card>
      )}

      {/* Filtros y búsqueda */}
      <Card>
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar producto..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-green-400"
              />
            </div>

            <select
              value={selectedOperador}
              onChange={e => setSelectedOperador(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-300"
            >
              <option value="">Todos los operadores</option>
              {operadores.map(op => (
                <option key={op.id} value={op.id}>{op.nombre}</option>
              ))}
            </select>

            <select
              value={selectedFamilia}
              onChange={e => setSelectedFamilia(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-300"
            >
              <option value="">Todas las familias</option>
              {familias.map(familia => (
                <option key={familia} value={familia}>{familia}</option>
              ))}
            </select>

            <select
              value={selectedComisionTipo}
              onChange={e => setSelectedComisionTipo(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-300"
            >
              <option value="">Todos los tipos</option>
              <option value="porcentaje">Porcentaje</option>
              <option value="fijo">Fijo</option>
            </select>

            {(searchTerm || selectedOperador || selectedFamilia || selectedComisionTipo) && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-1 px-3 py-2 text-sm text-slate-500 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
                Limpiar
              </button>
            )}
          </div>
        </div>
      </Card>

      {/* Acciones */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">
          Productos ({productosFiltrados.length})
        </h3>
        <div className="flex gap-2">
          <button
            onClick={exportCSV}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700"
          >
            <Download className="w-4 h-4" />
            CSV
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700"
          >
            <Plus className="w-4 h-4" />
            Nuevo Producto
          </button>
        </div>
      </div>

      {/* Tabla consolidada */}
      <Card>
        <div className="overflow-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-slate-500 bg-slate-50">
                <th className="py-4 px-4 font-medium">
                  <button
                    className="flex items-center gap-1 hover:text-slate-700"
                    onClick={() => handleSort('nombre')}
                  >
                    Producto
                    {sortField === 'nombre' && (
                      sortDirection === 'asc' ? <SortAsc className="w-3 h-3" /> : <SortDesc className="w-3 h-3" />
                    )}
                  </button>
                </th>
                <th className="py-4 px-4 font-medium">
                  <button
                    className="flex items-center gap-1 hover:text-slate-700"
                    onClick={() => handleSort('operador_nombre')}
                  >
                    Operador
                    {sortField === 'operador_nombre' && (
                      sortDirection === 'asc' ? <SortAsc className="w-3 h-3" /> : <SortDesc className="w-3 h-3" />
                    )}
                  </button>
                </th>
                <th className="py-4 px-4 font-medium">Familia</th>
                <th className="py-4 px-4 font-medium">
                  <button
                    className="flex items-center gap-1 hover:text-slate-700"
                    onClick={() => handleSort('pvp')}
                  >
                    PVP
                    {sortField === 'pvp' && (
                      sortDirection === 'asc' ? <SortAsc className="w-3 h-3" /> : <SortDesc className="w-3 h-3" />
                    )}
                  </button>
                </th>
                <th className="py-4 px-4 font-medium">Comisión</th>
                <th className="py-4 px-4 font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {productosFiltrados.map((producto, index) => (
                <tr key={producto.id} className={`border-t ${index % 2 === 0 ? 'bg-slate-25' : 'bg-white'} hover:bg-green-50`}>
                  <td className="py-4 px-4">
                    <div className="font-medium text-slate-700">{producto.nombre}</div>
                    {producto.familia && (
                      <div className="text-xs text-slate-500">{producto.familia}</div>
                    )}
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2">
                      {getSectorIcon(producto.operador_id, operadores)}
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSectorColor(producto.operador_id, operadores)}`}>
                        {getOperadorNombre(producto.operador_id)}
                      </span>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <span className="text-slate-600">{producto.familia || "—"}</span>
                  </td>
                  <td className="py-4 px-4">
                    <span className="font-semibold text-slate-700">
                      {producto.pvp ? `€${Number(producto.pvp).toFixed(2)}` : "—"}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <div className="text-sm text-slate-600">
                      <div>
                        {producto.comision_tipo === 'porcentaje' ? 
                          `${producto.comision_valor}%` : 
                          `€${Number(producto.comision_valor).toFixed(2)}`
                        }
                      </div>
                      <div className="text-xs text-slate-400">
                        {producto.comision_tipo === 'porcentaje' ? 'Porcentaje' : 'Fijo'}
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setEditingProducto(producto);
                          setShowModal(true);
                        }}
                        className="p-2 rounded-lg bg-amber-100 text-amber-700 hover:bg-amber-200"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(producto.id)}
                        className="p-2 rounded-lg bg-rose-100 text-rose-700 hover:bg-rose-200"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {productosFiltrados.length === 0 && (
            <div className="text-center py-12">
              <Package className="w-16 h-16 mx-auto text-slate-300 mb-4" />
              <h3 className="text-lg font-medium text-slate-600 mb-2">No hay productos</h3>
              <p className="text-slate-500 mb-4">
                {productos.length === 0 ? 'Crea tu primer producto' : 'Ajusta los filtros'}
              </p>
              <button
                onClick={() => setShowModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
              >
                <Plus className="w-4 h-4" />
                Nuevo Producto
              </button>
            </div>
          )}
        </div>
      </Card>

      {/* Modal */}
      {showModal && (
        <ProductoModal
          producto={editingProducto}
          operadores={operadores}
          customFields={customFields}
          onSave={handleSave}
          onClose={() => {
            setShowModal(false);
            setEditingProducto(null);
            setError("");
          }}
        />
      )}
    </div>
  );
}