import React, { useState, useMemo } from "react";
import { saveAs } from "file-saver";
import Card from "../ui/Card";
import { Building, Plus, Edit3, X, Trash2, Phone, Zap, Shield, Briefcase, Home, Save, Download } from "lucide-react";
import { getSectorIcon, getSectorColor } from "../../utils/operadores.jsx";

// Modal consolidado para operadores
function OperadorModal({ operador, onSave, onClose }) {
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

  const validate = () => {
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
  };

  const handleSave = () => {
    if (!validate()) return;
    
    const cleanForm = {
      ...form,
      id: form.id || `op_${Date.now()}`,
      nombre: form.nombre.trim(),
      codigo: form.codigo?.trim().toUpperCase() || '',
      reglas_decomision: {
        antes_6_meses: Number(form.reglas_decomision.antes_6_meses),
        despues_6_meses: Number(form.reglas_decomision.despues_6_meses),
        limite_meses: Number(form.reglas_decomision.limite_meses)
      }
    };
    
    onSave(cleanForm);
    onClose();
  };

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
          {/* Datos básicos */}
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

          {/* Reglas de decomisión */}
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
}

// Componente principal consolidado
export default function OperadoresSection({ operadores, setOperadores }) {
  const [showModal, setShowModal] = useState(false);
  const [editingOperador, setEditingOperador] = useState(null);
  const [error, setError] = useState("");

  // Verificar duplicados
  const operadorExists = (nombre, excludeId = null) => {
    return operadores.some(o => 
      o.id !== excludeId && 
      o.nombre?.toLowerCase().trim() === nombre?.toLowerCase().trim()
    );
  };

  // Estadísticas por sector
  const sectorStats = useMemo(() => ({
    telefonia: operadores.filter(o => o.sector === 'telefonia').length,
    energia: operadores.filter(o => o.sector === 'energia').length,
    seguridad: operadores.filter(o => o.sector === 'seguridad').length,
    otros: operadores.filter(o => !['telefonia', 'energia', 'seguridad'].includes(o.sector)).length,
  }), [operadores]);

  // Guardar operador
  const handleSave = (operadorData) => {
    if (operadorExists(operadorData.nombre, operadorData.id)) {
      setError(`Ya existe un operador con el nombre "${operadorData.nombre}"`);
      return;
    }

    if (operadorData.id) {
      // Actualizar
      setOperadores(prev => prev.map(o => o.id === operadorData.id ? operadorData : o));
    } else {
      // Crear nuevo
      setOperadores(prev => [...prev, operadorData]);
    }

    setError("");
  };

  // Eliminar operador
  const handleDelete = (id) => {
    if (window.confirm("¿Seguro que quieres eliminar este operador?")) {
      setOperadores(prev => prev.filter(o => o.id !== id));
    }
  };

  // Exportar CSV
  const exportCSV = () => {
    if (!operadores.length) return;
    
    const headers = ["ID", "Nombre", "Sector", "Código", "Contacto", "Teléfono", "Email"];
    const rows = operadores.map(o => [
      o.id, o.nombre, o.sector, o.codigo, o.contacto, o.telefono, o.email
    ]);
    
    const csv = [headers.join(",")]
      .concat(rows.map(r => r.map(v => `"${String(v || '').replace(/"/g, '""')}"`).join(",")))
      .join("\r\n");
    
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    saveAs(blob, `operadores_${new Date().toISOString().slice(0,10)}.csv`);
  };

  return (
    <div className="space-y-6">
      {/* Estadísticas */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-600 text-sm font-medium">Telefonía</p>
              <p className="text-2xl font-bold text-blue-800">{sectorStats.telefonia}</p>
            </div>
            <Phone className="w-8 h-8 text-blue-600" />
          </div>
        </Card>
        
        <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-yellow-600 text-sm font-medium">Energía</p>
              <p className="text-2xl font-bold text-yellow-800">{sectorStats.energia}</p>
            </div>
            <Zap className="w-8 h-8 text-yellow-600" />
          </div>
        </Card>
        
        <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-600 text-sm font-medium">Seguridad</p>
              <p className="text-2xl font-bold text-red-800">{sectorStats.seguridad}</p>
            </div>
            <Shield className="w-8 h-8 text-red-600" />
          </div>
        </Card>
        
        <Card className="bg-gradient-to-br from-slate-50 to-slate-100 border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-600 text-sm font-medium">Total</p>
              <p className="text-2xl font-bold text-slate-800">{operadores.length}</p>
            </div>
            <Building className="w-8 h-8 text-slate-600" />
          </div>
        </Card>
      </div>

      {/* Error */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <div className="text-red-700 font-medium">{error}</div>
        </Card>
      )}

      {/* Acciones */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Operadores</h3>
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
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700"
          >
            <Plus className="w-4 h-4" />
            Nuevo Operador
          </button>
        </div>
      </div>

      {/* Tabla */}
      <Card>
        <div className="overflow-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-slate-500 bg-slate-50">
                <th className="py-4 px-4 font-medium">Operador</th>
                <th className="py-4 px-4 font-medium">Sector</th>
                <th className="py-4 px-4 font-medium">Contacto</th>
                <th className="py-4 px-4 font-medium">Reglas</th>
                <th className="py-4 px-4 font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {operadores.map((op, index) => (
                <tr key={op.id} className={`border-t ${index % 2 === 0 ? 'bg-slate-25' : 'bg-white'} hover:bg-purple-50`}>
                  <td className="py-4 px-4">
                    <div className="font-medium text-slate-700">{op.nombre}</div>
                    {op.codigo && <div className="text-xs text-slate-500">{op.codigo}</div>}
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2">
                      {getSectorIcon(op.sector)}
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSectorColor(op.sector)}`}>
                        {op.sector || 'Sin sector'}
                      </span>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="text-sm text-slate-600">
                      <div>{op.contacto}</div>
                      <div className="text-xs">{op.telefono}</div>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="text-xs text-slate-600">
                      {op.reglas_decomision?.antes_6_meses || 100}% → {op.reglas_decomision?.despues_6_meses || 50}%
                      <br />
                      <span className="text-slate-400">({op.reglas_decomision?.limite_meses || 6} meses)</span>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setEditingOperador(op);
                          setShowModal(true);
                        }}
                        className="p-2 rounded-lg bg-amber-100 text-amber-700 hover:bg-amber-200"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(op.id)}
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

          {operadores.length === 0 && (
            <div className="text-center py-12">
              <Building className="w-16 h-16 mx-auto text-slate-300 mb-4" />
              <h3 className="text-lg font-medium text-slate-600 mb-2">No hay operadores</h3>
              <button
                onClick={() => setShowModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600"
              >
                <Plus className="w-4 h-4" />
                Agregar Operador
              </button>
            </div>
          )}
        </div>
      </Card>

      {/* Modal */}
      {showModal && (
        <OperadorModal
          operador={editingOperador}
          onSave={handleSave}
          onClose={() => {
            setShowModal(false);
            setEditingOperador(null);
            setError("");
          }}
        />
      )}
    </div>
  );
}