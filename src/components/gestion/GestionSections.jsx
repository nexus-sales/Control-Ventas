// src/components/gestion/GestionSections.jsx
// MÓDULO GESTIÓN CONSOLIDADO - VERSIÓN CORREGIDA
// PROBLEMAS SOLUCIONADOS: Guardado de operadores, función handleSelect, limpieza de duplicados

import React, { useState, useMemo, useCallback } from "react";
import { useData } from "../../context/AppContexts";
import Card from "../ui/Card";
import { 
  Building, Plus, Edit3, X, Trash2, Save, Download, Search, SortAsc, SortDesc, 
  Package, AlertTriangle, CheckCircle, Filter
} from "lucide-react";
import { saveAs } from "file-saver";
import { SECTORES, FAMILIAS_POR_SECTOR } from "../../utils/constants";

// ==========================================
// UTILIDADES DE LIMPIEZA Y VALIDACIÓN - CORREGIDAS
// ==========================================

// Limpieza de operadores - MÁS PERMISIVA
const cleanOperadores = (operadores = []) => {
  if (!Array.isArray(operadores)) return [];
  
  const seen = new Set();
  return operadores.filter(op => {
    // Validación más permisiva - solo requerimos que exista el objeto y tenga algún identificador
    if (!op || typeof op !== 'object') return false;
    
    // Si tiene ID, usamos ID para duplicados
    if (op.id) {
      if (seen.has(op.id)) return false;
      seen.add(op.id);
      return true;
    }
    
    // Si no tiene ID pero tiene nombre, lo permitimos (para operadores en proceso de creación)
    if (op.nombre && op.nombre.trim()) {
      return true;
    }
    
    return false;
  });
};

// Limpieza de productos - MEJORADA
const cleanProductosRobust = (productos = [], operadores = []) => {
  if (!Array.isArray(productos)) return [];
  if (!Array.isArray(operadores)) return [];
  
  const operadorIds = new Set(operadores.map(o => o.id).filter(Boolean));
  const seen = new Set();
  
  return productos.filter(prod => {
    if (!prod || typeof prod !== 'object') return false;
    if (!prod.nombre || !prod.nombre.trim()) return false;
    
    // Permitir productos sin operador asignado (operador_id vacío o null)
    if (prod.operador_id && !operadorIds.has(prod.operador_id)) {
      console.log(`Producto "${prod.nombre}" tiene operador inexistente:`, prod.operador_id);
      return false;
    }
    
    // Prevenir duplicados exactos de ID
    if (prod.id) {
      if (seen.has(prod.id)) {
        console.log(`Producto duplicado por ID eliminado:`, prod.id);
        return false;
      }
      seen.add(prod.id);
    }
    
    return true;
  });
};

// Normalización de texto para búsquedas
const normalizeText = (text) => text?.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim() || "";

// ==========================================
// COMPONENTE: ProductoModal (CORREGIDO)
// ==========================================
const sumarDia = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
};

const ProductoModal = React.memo(({ producto, onSave, onClose, operadores = [] }) => {
  const [form, setForm] = useState(
    producto ? {
      ...producto,
      sector: producto.sector || operadores.find(op => op.id === producto.operador_id)?.sector || "",
      comision_vigencia_desde: producto.comision_vigencia_desde || "",
      comision_vigencia_hasta: producto.comision_vigencia_hasta || "",
      comision_cliente_nuevo: producto.comision_cliente_nuevo ?? "",
      comision_cliente_existente: producto.comision_cliente_existente ?? "",
      comision_portabilidad: producto.comision_portabilidad ?? "",
      comision_alta_nueva: producto.comision_alta_nueva ?? "",
      comision_fija: producto.comision_fija ?? "",
      comision_porcentaje: producto.comision_porcentaje ?? "",
      comisiones_historial: Array.isArray(producto.comisiones_historial) ? producto.comisiones_historial : [],
      customFields: { ...producto.customFields }
    } : {
      operador_id: operadores[0]?.id || "",
      sector: operadores[0]?.sector || "",
      nombre: "",
      familia: "",
      pvp: "",
      comision_tipo: "porcentaje",
      comision_valor: "",
      comision_vigencia_desde: "",
      comision_vigencia_hasta: "",
      comision_cliente_nuevo: "",
      comision_cliente_existente: "",
      comision_portabilidad: "",
      comision_alta_nueva: "",
      comision_fija: "",
      comision_porcentaje: "",
      comisiones_historial: [],
      fecha_alta: new Date().toISOString().slice(0, 10),
      contacto: "",
      email: "",
      telefono: "",
      observaciones: "",
      customFields: {}
    }
  );
  
  const [errors, setErrors] = useState({});

  const familiasDisponibles = useMemo(() => {
    return form.sector ? FAMILIAS_POR_SECTOR[form.sector] || [] : [];
  }, [form.sector]);
  
  const validate = useCallback(() => {
    const newErrors = {};
    if (!form.nombre?.trim()) newErrors.nombre = "Nombre es obligatorio";
    if (!form.sector) newErrors.sector = "Sector es obligatorio";
    if (!form.operador_id) newErrors.operador_id = "Operador es obligatorio";
    if (!form.pvp || Number(form.pvp) <= 0) newErrors.pvp = "PVP debe ser mayor que 0";
    if (form.comision_valor && Number(form.comision_valor) < 0) newErrors.comision_valor = "Comisión no puede ser negativa";
    ["comision_cliente_nuevo", "comision_cliente_existente", "comision_portabilidad", "comision_alta_nueva"].forEach((campo) => {
      if (form[campo] !== "" && form[campo] !== null && form[campo] !== undefined && isNaN(Number(form[campo]))) {
        newErrors[campo] = "Debe ser numérico";
      }
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [form]);
  
  const appendSnapshot = useCallback((baseForm) => {
    const snapshotFecha = baseForm.comision_vigencia_desde || baseForm.fecha_alta || new Date().toISOString().slice(0, 10);
    const nowIso = new Date().toISOString();
    const snapshot = {
      id: `hist_${Date.now()}`,
      desde: snapshotFecha,
      hasta: baseForm.comision_vigencia_hasta || "",
      comision_tipo: baseForm.comision_tipo,
      comision_fija: baseForm.comision_fija,
      comision_porcentaje: baseForm.comision_porcentaje,
      comision_valor: baseForm.comision_valor,
      comision_cliente_nuevo: baseForm.comision_cliente_nuevo,
      comision_cliente_existente: baseForm.comision_cliente_existente,
      comision_portabilidad: baseForm.comision_portabilidad,
      comision_alta_nueva: baseForm.comision_alta_nueva,
      comision_vigencia_desde: baseForm.comision_vigencia_desde || "",
      comision_vigencia_hasta: baseForm.comision_vigencia_hasta || "",
      created_at: nowIso,
    };

    const historial = Array.isArray(baseForm.comisiones_historial) ? [...baseForm.comisiones_historial] : [];
    const last = historial[historial.length - 1];
    if (last && !last.hasta && snapshot.desde && last.desde && snapshot.desde > last.desde) {
      historial[historial.length - 1] = { ...last, hasta: last.hasta || snapshot.desde };
    }
    historial.push(snapshot);
    return historial;
  }, []);

  const handleSave = useCallback(() => {
    if (!validate()) return;

    const cleanForm = {
      ...form,
      id: form.id || `p_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      nombre: form.nombre.trim(),
      sector: form.sector || "",
      familia: form.familia?.trim() || "Sin clasificar",
      pvp: Number(form.pvp),
      comision_valor: form.comision_valor ? Number(form.comision_valor) : 0,
      comision_fija: form.comision_fija === "" ? 0 : Number(form.comision_fija),
      comision_porcentaje: form.comision_porcentaje === "" ? 0 : Number(form.comision_porcentaje),
      comision_vigencia_desde: form.comision_vigencia_desde || "",
      comision_vigencia_hasta: form.comision_vigencia_hasta || "",
      comision_cliente_nuevo: form.comision_cliente_nuevo === "" ? "" : Number(form.comision_cliente_nuevo),
      comision_cliente_existente: form.comision_cliente_existente === "" ? "" : Number(form.comision_cliente_existente),
      comision_portabilidad: form.comision_portabilidad === "" ? "" : Number(form.comision_portabilidad),
      comision_alta_nueva: form.comision_alta_nueva === "" ? "" : Number(form.comision_alta_nueva),
      activo: true,
      fecha_actualizacion: new Date().toISOString()
    };

    if (cleanForm.comision_tipo === 'fijo' && !cleanForm.comision_valor) {
      cleanForm.comision_valor = cleanForm.comision_fija;
    }
    if (cleanForm.comision_tipo === 'porcentaje' && !cleanForm.comision_valor) {
      cleanForm.comision_valor = cleanForm.comision_porcentaje;
    }

    cleanForm.comisiones_historial = appendSnapshot(cleanForm);

    console.log('🔄 Guardando producto:', cleanForm);
    onSave(cleanForm);
    onClose();
  }, [form, validate, onSave, onClose, appendSnapshot]);

  const handleNuevaVigencia = useCallback(() => {
    if (!form.comision_vigencia_hasta) {
      setErrors(prev => ({ ...prev, comision_vigencia_hasta: "Indica la fecha fin para cerrar la vigencia actual" }));
      return;
    }
    const cleanBase = {
      ...form,
      comision_fija: form.comision_fija === "" ? 0 : Number(form.comision_fija),
      comision_porcentaje: form.comision_porcentaje === "" ? 0 : Number(form.comision_porcentaje),
      comision_valor: form.comision_valor ? Number(form.comision_valor) : 0,
      comision_cliente_nuevo: form.comision_cliente_nuevo === "" ? "" : Number(form.comision_cliente_nuevo),
      comision_cliente_existente: form.comision_cliente_existente === "" ? "" : Number(form.comision_cliente_existente),
      comision_portabilidad: form.comision_portabilidad === "" ? "" : Number(form.comision_portabilidad),
      comision_alta_nueva: form.comision_alta_nueva === "" ? "" : Number(form.comision_alta_nueva),
      comisiones_historial: form.comisiones_historial,
    };
    const nuevoHist = appendSnapshot(cleanBase);
    const siguienteDesde = sumarDia(form.comision_vigencia_hasta) || "";
    setForm(prev => ({
      ...prev,
      comisiones_historial: nuevoHist,
      comision_vigencia_desde: siguienteDesde,
      comision_vigencia_hasta: "",
      comision_valor: "",
      comision_fija: "",
      comision_porcentaje: "",
      comision_cliente_nuevo: "",
      comision_cliente_existente: "",
      comision_portabilidad: "",
      comision_alta_nueva: "",
    }));
    setErrors(prev => ({ ...prev, comision_vigencia_hasta: undefined }));
  }, [form, appendSnapshot]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-900 text-slate-800 dark:text-gray-100 border border-slate-200 dark:border-gray-700 rounded-xl shadow-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold flex items-center gap-2 text-slate-900 dark:text-white">
            <Package className="w-6 h-6 text-green-500" />
            {producto ? 'Editar Producto' : 'Nuevo Producto'}
          </h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-gray-800">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="space-y-6">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-gray-200">Operador *</label>
              <select 
                className={`w-full border rounded-xl px-3 py-2 bg-white dark:bg-gray-800 text-slate-800 dark:text-gray-100 ${errors.operador_id ? 'border-red-300 dark:border-red-400' : 'border-slate-200 dark:border-gray-700'}`}
                value={form.operador_id}
                onChange={e => {
                  const selected = operadores.find(op => op.id === e.target.value);
                  setForm(prev => ({...prev, operador_id: e.target.value, sector: selected?.sector || prev.sector, familia: ''}));
                }}
              >
                <option value="">Seleccionar operador</option>
                {operadores.map(op => (
                  <option key={op.id} value={op.id}>{op.nombre}</option>
                ))}
              </select>
              {errors.operador_id && <p className="text-xs text-red-600">{errors.operador_id}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-gray-200">Sector *</label>
              <select
                className={`w-full border rounded-xl px-3 py-2 bg-white dark:bg-gray-800 text-slate-800 dark:text-gray-100 ${errors.sector ? 'border-red-300 dark:border-red-400' : 'border-slate-200 dark:border-gray-700'}`}
                value={form.sector}
                onChange={e => setForm(prev => ({...prev, sector: e.target.value, familia: ''}))}
              >
                <option value="">Seleccionar sector</option>
                {Object.keys(SECTORES).map(key => (
                  <option key={key} value={key}>{SECTORES[key]}</option>
                ))}
              </select>
              {errors.sector && <p className="text-xs text-red-600">{errors.sector}</p>}
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-gray-200">Nombre *</label>
              <input 
                type="text"
                className={`w-full border rounded-xl px-3 py-2 bg-white dark:bg-gray-800 text-slate-800 dark:text-gray-100 ${errors.nombre ? 'border-red-300 dark:border-red-400' : 'border-slate-200 dark:border-gray-700'}`}
                value={form.nombre}
                onChange={e => setForm(prev => ({...prev, nombre: e.target.value}))}
              />
              {errors.nombre && <p className="text-xs text-red-600">{errors.nombre}</p>}
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-gray-200">Familia</label>
              <select
                className="w-full border border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-slate-800 dark:text-gray-100 rounded-xl px-3 py-2"
                value={form.familia}
                onChange={e => setForm(prev => ({...prev, familia: e.target.value}))}
                disabled={!form.sector}
              >
                <option value="">{form.sector ? 'Seleccionar familia' : 'Selecciona un sector primero'}</option>
                {familiasDisponibles.map((fam) => (
                  <option key={fam} value={fam}>{fam}</option>
                ))}
                {form.familia && !familiasDisponibles.includes(form.familia) && (
                  <option value={form.familia}>{form.familia}</option>
                )}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-gray-200">PVP (€) *</label>
              <input 
                type="number"
                min="0"
                step="0.01"
                className={`w-full border rounded-xl px-3 py-2 bg-white dark:bg-gray-800 text-slate-800 dark:text-gray-100 ${errors.pvp ? 'border-red-300 dark:border-red-400' : 'border-slate-200 dark:border-gray-700'}`}
                value={form.pvp}
                onChange={e => setForm(prev => ({...prev, pvp: e.target.value}))}
              />
              {errors.pvp && <p className="text-xs text-red-600">{errors.pvp}</p>}
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-gray-200">Tipo Comisión</label>
              <select 
                className="w-full border border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-slate-800 dark:text-gray-100 rounded-xl px-3 py-2"
                value={form.comision_tipo}
                onChange={e => setForm(prev => ({...prev, comision_tipo: e.target.value}))}
              >
                <option value="porcentaje">Porcentaje (%)</option>
                <option value="fijo">Importe Fijo (€)</option>
                <option value="mixto">Mixto (Fijo + %)</option>
              </select>
            </div>

            {/* Campo para comisión fija */}
            {(form.comision_tipo === 'fijo' || form.comision_tipo === 'mixto') && (
              <div>
                <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-gray-200">Importe Fijo (€)</label>
                <input 
                  type="number"
                  min="0"
                  step="0.01"
                  className={`w-full border rounded-xl px-3 py-2 bg-white dark:bg-gray-800 text-slate-800 dark:text-gray-100 ${errors.comision_fija ? 'border-red-300 dark:border-red-400' : 'border-slate-200 dark:border-gray-700'}`}
                  value={form.comision_fija || ''}
                  onChange={e => setForm(prev => ({...prev, comision_fija: e.target.value}))}
                />
                {errors.comision_fija && <p className="text-xs text-red-600">{errors.comision_fija}</p>}
              </div>
            )}

            {/* Campo para comisión porcentaje */}
            {(form.comision_tipo === 'porcentaje' || form.comision_tipo === 'mixto') && (
              <div>
                <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-gray-200">Porcentaje Comisión (%)</label>
                <input 
                  type="number"
                  min="0"
                  step="0.01"
                  className={`w-full border rounded-xl px-3 py-2 bg-white dark:bg-gray-800 text-slate-800 dark:text-gray-100 ${errors.comision_porcentaje ? 'border-red-300 dark:border-red-400' : 'border-slate-200 dark:border-gray-700'}`}
                  value={form.comision_porcentaje || ''}
                  onChange={e => setForm(prev => ({...prev, comision_porcentaje: e.target.value}))}
                />
                {errors.comision_porcentaje && <p className="text-xs text-red-600">{errors.comision_porcentaje}</p>}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-gray-200">Comisión vigente desde</label>
              <input
                type="date"
                className="w-full border border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-slate-800 dark:text-gray-100 rounded-xl px-3 py-2"
                value={form.comision_vigencia_desde}
                onChange={e => setForm(prev => ({ ...prev, comision_vigencia_desde: e.target.value }))}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-gray-200">Comisión vigente hasta</label>
              <input
                type="date"
                className="w-full border border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-slate-800 dark:text-gray-100 rounded-xl px-3 py-2"
                value={form.comision_vigencia_hasta}
                onChange={e => setForm(prev => ({ ...prev, comision_vigencia_hasta: e.target.value }))}
              />
              {errors.comision_vigencia_hasta && <p className="text-xs text-red-600">{errors.comision_vigencia_hasta}</p>}
              <div className="mt-2 flex gap-2">
                <button
                  type="button"
                  onClick={handleNuevaVigencia}
                  className="px-3 py-2 rounded-lg text-sm bg-slate-200 dark:bg-gray-700 text-slate-800 dark:text-gray-100 hover:bg-slate-300 dark:hover:bg-gray-600"
                >
                  Cerrar vigencia y añadir nueva
                </button>
                <p className="text-xs text-slate-500 dark:text-gray-400 self-center">Usa la fecha fin para cerrar; se abrirá una nueva vigencia desde el día siguiente.</p>
              </div>
            </div>

            {String(form.sector || "").toUpperCase() === 'TELEFONIA' && (
              <div className="border border-slate-200 dark:border-gray-700 rounded-xl p-4 space-y-3">
                <p className="text-sm font-semibold text-slate-700 dark:text-gray-200">Condiciones específicas Telefonía</p>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-gray-200">Cliente nuevo (% o €)</label>
                    <input
                      type="number"
                      step="0.01"
                      className={`w-full border rounded-xl px-3 py-2 bg-white dark:bg-gray-800 text-slate-800 dark:text-gray-100 ${errors.comision_cliente_nuevo ? 'border-red-300 dark:border-red-400' : 'border-slate-200 dark:border-gray-700'}`}
                      value={form.comision_cliente_nuevo}
                      onChange={e => setForm(prev => ({ ...prev, comision_cliente_nuevo: e.target.value }))}
                    />
                    {errors.comision_cliente_nuevo && <p className="text-xs text-red-600">{errors.comision_cliente_nuevo}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-gray-200">Cliente existente (% o €)</label>
                    <input
                      type="number"
                      step="0.01"
                      className={`w-full border rounded-xl px-3 py-2 bg-white dark:bg-gray-800 text-slate-800 dark:text-gray-100 ${errors.comision_cliente_existente ? 'border-red-300 dark:border-red-400' : 'border-slate-200 dark:border-gray-700'}`}
                      value={form.comision_cliente_existente}
                      onChange={e => setForm(prev => ({ ...prev, comision_cliente_existente: e.target.value }))}
                    />
                    {errors.comision_cliente_existente && <p className="text-xs text-red-600">{errors.comision_cliente_existente}</p>}
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-gray-200">Alta nueva (% o €)</label>
                    <input
                      type="number"
                      step="0.01"
                      className={`w-full border rounded-xl px-3 py-2 bg-white dark:bg-gray-800 text-slate-800 dark:text-gray-100 ${errors.comision_alta_nueva ? 'border-red-300 dark:border-red-400' : 'border-slate-200 dark:border-gray-700'}`}
                      value={form.comision_alta_nueva}
                      onChange={e => setForm(prev => ({ ...prev, comision_alta_nueva: e.target.value }))}
                    />
                    {errors.comision_alta_nueva && <p className="text-xs text-red-600">{errors.comision_alta_nueva}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-gray-200">Portabilidad (% o €)</label>
                    <input
                      type="number"
                      step="0.01"
                      className={`w-full border rounded-xl px-3 py-2 bg-white dark:bg-gray-800 text-slate-800 dark:text-gray-100 ${errors.comision_portabilidad ? 'border-red-300 dark:border-red-400' : 'border-slate-200 dark:border-gray-700'}`}
                      value={form.comision_portabilidad}
                      onChange={e => setForm(prev => ({ ...prev, comision_portabilidad: e.target.value }))}
                    />
                    {errors.comision_portabilidad && <p className="text-xs text-red-600">{errors.comision_portabilidad}</p>}
                  </div>
                </div>
              </div>
            )}

            <div className="md:col-span-2 border border-slate-200 dark:border-gray-700 rounded-xl p-4 bg-slate-50 dark:bg-gray-900/40">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-semibold text-slate-700 dark:text-gray-200">Historial de comisiones (auto-generado al guardar)</p>
                <span className="text-xs text-slate-500 dark:text-gray-400">Se cierra la vigencia anterior y se añade la nueva</span>
              </div>
              {(!form.comisiones_historial || form.comisiones_historial.length === 0) && (
                <p className="text-xs text-slate-500">Sin entradas aún. Se creará una al guardar.</p>
              )}
              {form.comisiones_historial && form.comisiones_historial.length > 0 && (
                <div className="space-y-2 max-h-44 overflow-y-auto text-xs text-slate-700 dark:text-gray-200">
                  {[...form.comisiones_historial].slice().reverse().map((h) => (
                    <div key={h.id || `${h.desde}-${h.hasta}`} className="p-2 rounded-lg bg-white/70 dark:bg-gray-800 border border-slate-200 dark:border-gray-700">
                      <div className="flex justify-between gap-2">
                        <span className="font-semibold">{h.desde || '—'} → {h.hasta || '—'}</span>
                        <span className="uppercase text-[11px]">{h.comision_tipo || form.comision_tipo}</span>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {h.comision_fija !== undefined && h.comision_fija !== "" && <span className="px-2 py-1 bg-slate-100 dark:bg-gray-700 rounded">Fijo: {h.comision_fija}</span>}
                        {h.comision_porcentaje !== undefined && h.comision_porcentaje !== "" && <span className="px-2 py-1 bg-slate-100 dark:bg-gray-700 rounded">%: {h.comision_porcentaje}</span>}
                        {h.comision_cliente_nuevo !== undefined && h.comision_cliente_nuevo !== "" && <span className="px-2 py-1 bg-slate-100 dark:bg-gray-700 rounded">Nuevo: {h.comision_cliente_nuevo}</span>}
                        {h.comision_cliente_existente !== undefined && h.comision_cliente_existente !== "" && <span className="px-2 py-1 bg-slate-100 dark:bg-gray-700 rounded">Existente: {h.comision_cliente_existente}</span>}
                        {h.comision_alta_nueva !== undefined && h.comision_alta_nueva !== "" && <span className="px-2 py-1 bg-slate-100 dark:bg-gray-700 rounded">Alta: {h.comision_alta_nueva}</span>}
                        {h.comision_portabilidad !== undefined && h.comision_portabilidad !== "" && <span className="px-2 py-1 bg-slate-100 dark:bg-gray-700 rounded">Portab: {h.comision_portabilidad}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-gray-200">Contacto</label>
              <input 
                type="text"
                className="w-full border border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-slate-800 dark:text-gray-100 rounded-xl px-3 py-2"
                value={form.contacto}
                onChange={e => setForm(prev => ({...prev, contacto: e.target.value}))}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-gray-200">Email</label>
              <input 
                type="email"
                className="w-full border border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-slate-800 dark:text-gray-100 rounded-xl px-3 py-2"
                value={form.email}
                onChange={e => setForm(prev => ({...prev, email: e.target.value}))}
              />
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-gray-200">Observaciones</label>
              <textarea 
                rows="3"
                className="w-full border border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-slate-800 dark:text-gray-100 rounded-xl px-3 py-2"
                value={form.observaciones}
                onChange={e => setForm(prev => ({...prev, observaciones: e.target.value}))}
              />
            </div>
          </div>
        </div>
        
        <div className="flex justify-end gap-2 mt-6 pt-6 border-t">
          <button 
            onClick={onClose}
            className="px-4 py-2 border border-slate-300 dark:border-gray-700 rounded-xl text-slate-600 dark:text-gray-200 hover:bg-slate-50 dark:hover:bg-gray-800"
          >
            Cancelar
          </button>
          <button 
            onClick={handleSave}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-500"
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
// COMPONENTE: OperadorModal (CORREGIDO)  
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
    if (!validate()) {
      return;
    }

    // Generar id único si no existe
    const operadorId = form.id || `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const cleanForm = {
      ...form,
      id: operadorId,
      nombre: form.nombre.trim(),
      codigo: form.codigo?.trim().toUpperCase() || '',
      sector: form.sector || '',
      contacto: form.contacto?.trim() || '',
      email: form.email?.trim() || '',
      telefono: form.telefono?.trim() || '',
      reglas_decomision: {
        antes_6_meses: Number(form.reglas_decomision.antes_6_meses),
        despues_6_meses: Number(form.reglas_decomision.despues_6_meses),
        limite_meses: Number(form.reglas_decomision.limite_meses)
      },
      fecha_actualizacion: new Date().toISOString(),
      activo: true
    };

    console.log('🔄 Guardando operador:', cleanForm);
    
    // CORRECIÓN PRINCIPAL: Llamar a onSave sin parámetros extra
    onSave(cleanForm);
    onClose();
  }, [form, validate, onSave, onClose]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-900 text-slate-800 dark:text-gray-100 border border-slate-200 dark:border-gray-700 rounded-xl shadow-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold flex items-center gap-2 text-slate-900 dark:text-white">
            <Building className="w-6 h-6 text-purple-500" />
            {operador ? 'Editar Operador' : 'Nuevo Operador'}
          </h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-gray-800">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="space-y-6">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-gray-200">Nombre *</label>
              <input 
                type="text"
                className={`w-full border rounded-xl px-3 py-2 bg-white dark:bg-gray-800 text-slate-800 dark:text-gray-100 ${errors.nombre ? 'border-red-300 dark:border-red-400' : 'border-slate-200 dark:border-gray-700'}`}
                value={form.nombre}
                onChange={e => setForm(prev => ({...prev, nombre: e.target.value}))}
              />
              {errors.nombre && <p className="text-xs text-red-600">{errors.nombre}</p>}
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-gray-200">Código</label>
              <input 
                type="text"
                className="w-full border border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-slate-800 dark:text-gray-100 rounded-xl px-3 py-2"
                value={form.codigo}
                onChange={e => setForm(prev => ({...prev, codigo: e.target.value}))}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-gray-200">Sector</label>
              <select 
                className="w-full border border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-slate-800 dark:text-gray-100 rounded-xl px-3 py-2"
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
              <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-gray-200">Contacto</label>
              <input 
                type="text"
                className="w-full border border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-slate-800 dark:text-gray-100 rounded-xl px-3 py-2"
                value={form.contacto}
                onChange={e => setForm(prev => ({...prev, contacto: e.target.value}))}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-gray-200">Email</label>
              <input 
                type="email"
                className="w-full border border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-slate-800 dark:text-gray-100 rounded-xl px-3 py-2"
                value={form.email}
                onChange={e => setForm(prev => ({...prev, email: e.target.value}))}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-gray-200">Teléfono</label>
              <input 
                type="tel"
                className="w-full border border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-slate-800 dark:text-gray-100 rounded-xl px-3 py-2"
                value={form.telefono}
                onChange={e => setForm(prev => ({...prev, telefono: e.target.value}))}
              />
            </div>
          </div>
          
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold mb-4 text-slate-900 dark:text-white">Reglas de Decomisión</h3>
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-gray-200">Antes 6M (%)</label>
                <input 
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  className={`w-full border rounded-xl px-3 py-2 bg-white dark:bg-gray-800 text-slate-800 dark:text-gray-100 ${errors.antes_6_meses ? 'border-red-300 dark:border-red-400' : 'border-slate-200 dark:border-gray-700'}`}
                  value={form.reglas_decomision.antes_6_meses}
                  onChange={e => setForm(prev => ({ 
                    ...prev, 
                    reglas_decomision: {...prev.reglas_decomision, antes_6_meses: e.target.value} 
                  }))}
                />
                {errors.antes_6_meses && <p className="text-xs text-red-600">{errors.antes_6_meses}</p>}
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-gray-200">Después 6M (%)</label>
                <input 
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  className={`w-full border rounded-xl px-3 py-2 bg-white dark:bg-gray-800 text-slate-800 dark:text-gray-100 ${errors.despues_6_meses ? 'border-red-300 dark:border-red-400' : 'border-slate-200 dark:border-gray-700'}`}
                  value={form.reglas_decomision.despues_6_meses}
                  onChange={e => setForm(prev => ({ 
                    ...prev, 
                    reglas_decomision: {...prev.reglas_decomision, despues_6_meses: e.target.value} 
                  }))}
                />
                {errors.despues_6_meses && <p className="text-xs text-red-600">{errors.despues_6_meses}</p>}
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-gray-200">Límite (meses)</label>
                <input 
                  type="number"
                  min="1"
                  max="24"
                  className={`w-full border rounded-xl px-3 py-2 bg-white dark:bg-gray-800 text-slate-800 dark:text-gray-100 ${errors.limite_meses ? 'border-red-300 dark:border-red-400' : 'border-slate-200 dark:border-gray-700'}`}
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
            className="px-4 py-2 border border-slate-300 dark:border-gray-700 rounded-xl text-slate-600 dark:text-gray-200 hover:bg-slate-50 dark:hover:bg-gray-800"
          >
            Cancelar
          </button>
          <button 
            onClick={handleSave}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 dark:bg-purple-600 dark:hover:bg-purple-500"
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
// COMPONENTE: ProductosSection (CORREGIDO)
// ==========================================
const ProductosSection = React.memo(() => {
  const { data, setProductos } = useData();
  const [selectedIds, setSelectedIds] = useState([]);
  const PAGE_SIZE = 20;
  
  // Datos limpios y seguros
  const operadores = useMemo(() => cleanOperadores(data.operadores || []), [data.operadores]);
  const productos = useMemo(() => cleanProductosRobust(data.productos || [], operadores), [data.productos, operadores]);
  
  // Estados locales
  const [showModal, setShowModal] = useState(false);
  const [editingProducto, setEditingProducto] = useState(null);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedOperador, setSelectedOperador] = useState("");
  const [selectedFamilia, setSelectedFamilia] = useState("");
  const [sortDirection, setSortDirection] = useState("asc");
  const [currentPage, setCurrentPage] = useState(1);
  
  // FUNCIÓN FALTANTE: handleSelect AÑADIDA
  const handleSelect = useCallback((id) => {
    setSelectedIds(prev => {
      if (prev.includes(id)) {
        return prev.filter(selectedId => selectedId !== id);
      } else {
        return [...prev, id];
      }
    });
  }, []);
  
  // Borrado masivo de productos seleccionados
  const handleDeleteSelected = useCallback(() => {
    if (selectedIds.length === 0) return;
    if (window.confirm(`¿Seguro que quieres eliminar ${selectedIds.length} productos seleccionados?`)) {
      setProductos(prev => {
        const filtered = prev.filter(p => !selectedIds.includes(p.id));
        const cleaned = cleanProductosRobust(filtered, operadores);
        console.log('🗑️ Productos eliminados:', selectedIds.length);
        return cleaned;
      });
      setSelectedIds([]);
    }
  }, [selectedIds, setProductos, operadores]);
  
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
  
  // Función auxiliar para filtros (extraída para reutilizar)
  const getProductosFiltrados = useCallback(() => {
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
  
  // Productos filtrados - usando la función auxiliar
  const productosFiltrados = useMemo(() => getProductosFiltrados(), [getProductosFiltrados]);
  const totalPages = Math.max(1, Math.ceil(productosFiltrados.length / PAGE_SIZE));
  const currentPageSafe = Math.min(currentPage, totalPages);
  const startIndex = productosFiltrados.length === 0 ? 0 : (currentPageSafe - 1) * PAGE_SIZE + 1;
  const endIndex = Math.min(productosFiltrados.length, currentPageSafe * PAGE_SIZE);
  const productosPagina = useMemo(
    () => productosFiltrados.slice((currentPageSafe - 1) * PAGE_SIZE, currentPageSafe * PAGE_SIZE),
    [productosFiltrados, currentPageSafe, PAGE_SIZE]
  );

  // Selección global de productos (solo página actual)
  const handleSelectAll = useCallback(() => {
    const pageItems = productosPagina;
    if (pageItems.length === 0) return;
    const allSelected = pageItems.every(p => selectedIds.includes(p.id));
    if (allSelected) {
      setSelectedIds(prev => prev.filter(id => !pageItems.some(p => p.id === id)));
    } else {
      const nuevos = pageItems
        .map(p => p.id)
        .filter(id => !selectedIds.includes(id));
      setSelectedIds(prev => [...prev, ...nuevos]);
    }
  }, [productosPagina, selectedIds]);
  
  // Validar duplicados
  const productExists = useCallback((nombre, operadorId, excludeId = null) => {
    return productos.some(p => 
      p.id !== excludeId && 
      p.nombre?.toLowerCase().trim() === nombre?.toLowerCase().trim() &&
      p.operador_id === operadorId
    );
  }, [productos]);
  
  // Manejadores CORREGIDOS
  const handleSave = useCallback((productoData) => {
    console.log('💾 Guardando producto:', productoData);
    
    if (productExists(productoData.nombre, productoData.operador_id, productoData.id)) {
      setError(`Ya existe un producto con ese nombre para el operador seleccionado.`);
      return;
    }
    
    setProductos(prev => {
      let updatedProductos;
      
      if (productoData.id && prev.find(p => p.id === productoData.id)) {
        // Actualizar existente
        updatedProductos = prev.map(p => p.id === productoData.id ? productoData : p);
        console.log('✏️ Producto actualizado');
      } else {
        // Crear nuevo
        updatedProductos = [...prev, productoData];
        console.log('➕ Producto creado');
      }
      
      // Limpiar después de la operación
      const cleaned = cleanProductosRobust(updatedProductos, operadores);
      console.log('🧹 Productos después de limpieza:', cleaned.length);
      return cleaned;
    });
    
    setError("");
  }, [productExists, setProductos, operadores]);
  
  const handleDelete = useCallback((id) => {
    if (window.confirm("¿Seguro que quieres eliminar este producto?")) {
      setProductos(prev => {
        const filtered = prev.filter(p => p.id !== id);
        const cleaned = cleanProductosRobust(filtered, operadores);
        console.log('🗑️ Producto eliminado:', id);
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
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 dark:from-gray-800 dark:to-gray-700 dark:border-gray-700 dark:text-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-600 dark:text-green-200 text-sm font-medium">Total Productos</p>
              <div className="text-2xl font-bold text-slate-900 dark:text-white">{productos.length}</div>
            </div>
            <Package className="w-8 h-8 text-green-600 dark:text-green-200" />
          </div>
        </Card>
        
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 dark:from-gray-800 dark:to-gray-700 dark:border-gray-700 dark:text-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-600 dark:text-blue-200 text-sm font-medium">Familias</p>
              <div className="text-2xl font-bold text-slate-900 dark:text-white">{familias.length}</div>
            </div>
          </div>
        </Card>
        
        <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200 dark:from-gray-800 dark:to-gray-700 dark:border-gray-700 dark:text-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-yellow-600 dark:text-yellow-200 text-sm font-medium">Operadores</p>
              <div className="text-2xl font-bold text-slate-900 dark:text-white">{operadores.length}</div>
            </div>
          </div>
        </Card>
        
        <Card className="bg-gradient-to-br from-slate-50 to-slate-100 border-slate-200 dark:from-gray-800 dark:to-gray-700 dark:border-gray-700 dark:text-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-600 dark:text-gray-300 text-sm font-medium">Activos</p>
              <div className="text-2xl font-bold text-slate-900 dark:text-white">{productos.filter(p => p.activo !== false).length}</div>
            </div>
          </div>
        </Card>
      </div>
      
      {/* Filtros */}
      <div className="flex gap-4 mb-6">
        <div className="flex-1">
          <input 
            type="text"
            className="w-full border rounded-xl px-3 py-2 bg-white dark:bg-gray-900 text-slate-800 dark:text-gray-100 border-slate-200 dark:border-gray-700 placeholder-slate-400 dark:placeholder-gray-500"
            placeholder="Buscar producto..."
            value={searchTerm}
            onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
          />
        </div>
        
        <div>
          <select 
            className="border rounded-xl px-3 py-2 bg-white dark:bg-gray-900 text-slate-800 dark:text-gray-100 border-slate-200 dark:border-gray-700"
            value={selectedOperador}
            onChange={e => { setSelectedOperador(e.target.value); setCurrentPage(1); }}
          >
            <option value="">Todos los operadores</option>
            {operadores.map(op => (
              <option key={op.id} value={op.id}>{op.nombre}</option>
            ))}
          </select>
        </div>
        
        <div>
          <select 
            className="border rounded-xl px-3 py-2 bg-white dark:bg-gray-900 text-slate-800 dark:text-gray-100 border-slate-200 dark:border-gray-700"
            value={selectedFamilia}
            onChange={e => { setSelectedFamilia(e.target.value); setCurrentPage(1); }}
          >
            <option value="">Todas las familias</option>
            {familias.map(f => (
              <option key={f} value={f}>{f}</option>
            ))}
          </select>
        </div>
        
        <div>
          <button 
            onClick={() => { setSortDirection(sortDirection === "asc" ? "desc" : "asc"); setCurrentPage(1); }}
            className="px-3 py-2 border rounded-xl flex items-center gap-1 bg-white dark:bg-gray-900 text-slate-800 dark:text-gray-100 border-slate-200 dark:border-gray-700 hover:bg-slate-50 dark:hover:bg-gray-800"
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
      
      {/* Tabla CORREGIDA */}
      <div className="overflow-x-auto">
        <table className="min-w-full border-separate border-spacing-y-2 text-xs md:text-sm text-slate-800 dark:text-gray-100">
          <thead>
            <tr className="text-left text-slate-500 dark:text-gray-300 uppercase tracking-wide text-[11px] md:text-xs">
              <th>
                <input 
                  type="checkbox" 
                  checked={productosPagina.length > 0 && productosPagina.every(p => selectedIds?.includes(p.id))} 
                  onChange={handleSelectAll} 
                />
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
            {productosPagina.map(p => (
              <tr key={p.id} className="bg-white dark:bg-gray-800 hover:bg-green-50 dark:hover:bg-gray-700">
                <td>
                  <input 
                    type="checkbox" 
                    checked={selectedIds?.includes(p.id)} 
                    onChange={() => handleSelect(p.id)} 
                  />
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
                    className="p-1 rounded hover:bg-green-100 dark:hover:bg-gray-700"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => handleDelete(p.id)}
                    className="p-1 rounded hover:bg-red-100 dark:hover:bg-gray-700"
                  >
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </button>
                </td>
              </tr>
            ))}
            {productosFiltrados.length === 0 && (
              <tr>
                <td colSpan={10} className="text-center text-slate-400 dark:text-gray-400 py-6">
                  No hay productos registrados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {productosFiltrados.length > 0 && (
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mt-4 text-xs md:text-sm text-slate-600 dark:text-gray-300">
          <div>
            Mostrando <span className="font-semibold">{startIndex}</span>
            {" - "}
            <span className="font-semibold">{endIndex}</span> de {productosFiltrados.length} productos
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPageSafe === 1}
              className={`px-3 py-1 rounded-lg border text-xs md:text-sm ${currentPageSafe === 1 ? 'opacity-40 cursor-not-allowed' : 'hover:bg-slate-100 dark:hover:bg-gray-800'} border-slate-200 dark:border-gray-700`}
            >
              Anterior
            </button>
            <span className="text-xs md:text-sm">
              Página <span className="font-semibold">{currentPageSafe}</span> / {totalPages}
            </span>
            <button
              type="button"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPageSafe === totalPages}
              className={`px-3 py-1 rounded-lg border text-xs md:text-sm ${currentPageSafe === totalPages ? 'opacity-40 cursor-not-allowed' : 'hover:bg-slate-100 dark:hover:bg-gray-800'} border-slate-200 dark:border-gray-700`}
            >
              Siguiente
            </button>
          </div>
        </div>
      )}
      
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
// COMPONENTE: OperadoresSection (CORREGIDO)
// ==========================================
const OperadoresSection = React.memo(() => {
  const { data, setOperadores } = useData();
  const operadores = useMemo(() => cleanOperadores(data.operadores || []), [data.operadores]);
  const productos = useMemo(() => cleanProductosRobust(data.productos || [], operadores), [data.productos, operadores]);
  
  const [showModal, setShowModal] = useState(false);
  const [editingOperador, setEditingOperador] = useState(null);
  const [error, setError] = useState("");
  const [filtroSector, setFiltroSector] = useState("");
  const [filtroProductos, setFiltroProductos] = useState("");
  
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
  
  // MANEJADOR PRINCIPAL CORREGIDO
  const handleSave = useCallback((operadorData) => {
    console.log('💾 Guardando operador:', operadorData);
    
    if (operadorExists(operadorData.nombre, operadorData.id)) {
      setError(`Ya existe un operador con el nombre "${operadorData.nombre}"`);
      return;
    }

    setOperadores(prev => {
      let updatedOperadores;
      
      if (operadorData.id && prev.find(o => o.id === operadorData.id)) {
        // Actualizar existente
        updatedOperadores = prev.map(o => o.id === operadorData.id ? operadorData : o);
        console.log('✏️ Operador actualizado:', operadorData.id);
      } else {
        // Crear nuevo
        updatedOperadores = [...prev, operadorData];
        console.log('➕ Operador creado:', operadorData.id);
      }
      
      // Limpiar después de la operación
      const cleaned = cleanOperadores(updatedOperadores);
      console.log('🧹 Operadores después de limpieza:', cleaned.length);
      return cleaned;
    });
    
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
      const filtered = prev.filter(o => o.id !== id);
      const cleaned = cleanOperadores(filtered);
      console.log('🗑️ Operador eliminado:', id);
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
      productosConteo[o.id] || 0,
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
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 dark:from-gray-800 dark:to-gray-700 dark:border-gray-700 dark:text-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-600 dark:text-blue-200 text-sm font-medium">Telefonía</p>
              <div className="text-2xl font-bold text-slate-900 dark:text-white">{sectorStats.telefonia.operadores}</div>
              <div className="text-xs text-blue-500 dark:text-blue-200">{sectorStats.telefonia.productos} productos</div>
            </div>
            <Building className="w-8 h-8 text-blue-600 dark:text-blue-200" />
          </div>
        </Card>
        
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 dark:from-gray-800 dark:to-gray-700 dark:border-gray-700 dark:text-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-600 dark:text-green-200 text-sm font-medium">Energía</p>
              <div className="text-2xl font-bold text-slate-900 dark:text-white">{sectorStats.energia.operadores}</div>
              <div className="text-xs text-green-500 dark:text-green-200">{sectorStats.energia.productos} productos</div>
            </div>
          </div>
        </Card>
        
        <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200 dark:from-gray-800 dark:to-gray-700 dark:border-gray-700 dark:text-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-yellow-600 dark:text-yellow-200 text-sm font-medium">Seguridad</p>
              <div className="text-2xl font-bold text-slate-900 dark:text-white">{sectorStats.seguridad.operadores}</div>
              <div className="text-xs text-yellow-500 dark:text-yellow-200">{sectorStats.seguridad.productos} productos</div>
            </div>
          </div>
        </Card>
        
        <Card className="bg-gradient-to-br from-slate-50 to-slate-100 border-slate-200 dark:from-gray-800 dark:to-gray-700 dark:border-gray-700 dark:text-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-600 dark:text-gray-300 text-sm font-medium">Otros</p>
              <div className="text-2xl font-bold text-slate-900 dark:text-white">{sectorStats.otros.operadores}</div>
              <div className="text-xs text-slate-500 dark:text-gray-300">{sectorStats.otros.productos} productos</div>
            </div>
          </div>
        </Card>
      </div>
      
      {/* Top operadores por productos */}
      <Card className="bg-gradient-to-r from-purple-50 to-indigo-50 border-purple-200 dark:from-gray-800 dark:to-gray-700 dark:border-gray-700 dark:text-gray-100">
        <div className="p-4">
          <h3 className="text-lg font-semibold text-purple-800 dark:text-purple-200 mb-3 flex items-center gap-2">
            🏆 Top Operadores por Productos
          </h3>
          <div className="grid md:grid-cols-5 gap-3">
            {topOperadores.map((op, index) => (
              <div key={op.id} className="bg-white dark:bg-gray-900 rounded-lg p-3 text-center shadow-sm">
                <div className="text-sm font-medium text-slate-700 dark:text-gray-200 truncate" title={op.nombre}>
                  {op.nombre}
                </div>
                <div className="text-lg font-bold text-purple-600 dark:text-purple-200">{op.totalProductos}</div>
                <div className="text-xs text-slate-500 dark:text-gray-300">
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
              className="border rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-900 text-slate-800 dark:text-gray-100 border-slate-200 dark:border-gray-700"
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
              className="border rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-900 text-slate-800 dark:text-gray-100 border-slate-200 dark:border-gray-700"
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
      
      {/* Debug info */}
      <Card className="bg-blue-50 border-blue-200 dark:bg-gray-800 dark:border-gray-700">
        <div className="text-blue-800 dark:text-blue-200 text-sm">
          <strong>Debug:</strong> Operadores en memoria: {operadores.length} | 
          Operadores en data raw: {data.operadores?.length || 0} | 
          Productos: {productos.length}
        </div>
      </Card>
      
      {/* Tabla CON conteo productos */}
      <div className="overflow-x-auto">
        <table className="min-w-full border-separate border-spacing-y-2 text-xs md:text-sm text-slate-800 dark:text-gray-100">
          <thead>
            <tr className="text-left text-slate-500 dark:text-gray-300 uppercase tracking-wide text-[11px] md:text-xs">
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
                <tr key={op.id} className="bg-white dark:bg-gray-800 hover:bg-purple-50 dark:hover:bg-gray-700">
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
                      className="p-1 rounded hover:bg-purple-100 dark:hover:bg-gray-700"
                      title="Editar operador"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleDelete(op.id)}
                      className="p-1 rounded hover:bg-red-100 dark:hover:bg-gray-700"
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
                <td colSpan={8} className="text-center text-slate-400 dark:text-gray-400 py-6">
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
          <div className="mt-4 p-3 bg-slate-50 dark:bg-gray-800 rounded-lg">
            <div className="flex flex-wrap items-center gap-2 text-sm text-slate-600 dark:text-gray-200">
              <span>Filtros activos:</span>
              {filtroSector && (
                <span className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded-full text-xs capitalize">
                  Sector: {filtroSector}
                </span>
              )}
              {filtroProductos && (
                <span className="bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 px-2 py-1 rounded-full text-xs">
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
// COMPONENTE: AdministracionSection (IGUAL)
// ==========================================
const AdministracionSection = React.memo(() => {
  const OPERADORES = ["Telefonía", "Energía", "Seguridad"];
  const CLAVE_GERENTE = "@LMB1828re";
  
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
      <div className="max-w-md mx-auto mt-16 p-6 bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-slate-200 dark:border-gray-700 text-slate-800 dark:text-slate-100">
        <h2 className="text-xl font-bold mb-4 text-slate-900 dark:text-slate-100">Acceso Gerente</h2>
        <form onSubmit={handleClaveSubmit} className="space-y-4">
          <input
            type="password"
            className="border border-slate-300 dark:border-gray-600 rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-blue-400 dark:focus:ring-blue-500 bg-white dark:bg-gray-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500"
            placeholder="Clave de acceso"
            value={clave}
            onChange={e => setClave(e.target.value)}
            required
          />
          {errorClave && <div className="text-red-600 dark:text-red-300 text-sm">{errorClave}</div>}
          <button 
            type="submit"
            className="bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-500 text-white px-4 py-2 rounded-lg w-full transition-colors"
          >
            Acceder
          </button>
        </form>
      </div>
    );
  }

  return (
    <section className="max-w-4xl mx-auto mt-8 p-6 bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-slate-200 dark:border-gray-700 text-slate-800 dark:text-slate-100">
      <h2 className="text-2xl font-bold mb-6">Gestión Administrativa</h2>
      
      <form onSubmit={handleFormSubmit} className="space-y-4 mb-8 bg-slate-50 dark:bg-gray-800 p-6 rounded-xl border border-slate-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold mb-4">Nuevo Acuerdo</h3>
        
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-200">Sector</label>
            <select
              className="border border-slate-300 dark:border-gray-600 rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-blue-400 dark:focus:ring-blue-500 bg-white dark:bg-gray-800 text-slate-900 dark:text-slate-100"
              value={form.sector}
              onChange={e => setForm(f => ({ ...f, sector: e.target.value }))}
            >
              {OPERADORES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-200">Operador *</label>
            <input
              type="text"
              className="border border-slate-300 dark:border-gray-600 rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-blue-400 dark:focus:ring-blue-500 bg-white dark:bg-gray-800 text-slate-900 dark:text-slate-100"
              placeholder="Nombre del operador"
              value={form.operador}
              onChange={e => setForm(f => ({ ...f, operador: e.target.value }))}
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-200">Nombre del acuerdo *</label>
            <input
              type="text"
              className="border border-slate-300 dark:border-gray-600 rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-blue-400 dark:focus:ring-blue-500 bg-white dark:bg-gray-800 text-slate-900 dark:text-slate-100"
              placeholder="Ej: Contrato Q4 2024"
              value={form.nombre}
              onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-200">Comisión (%) *</label>
            <input
              type="number"
              min="0"
              max="100"
              step="0.1"
              className="border border-slate-300 dark:border-gray-600 rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-blue-400 dark:focus:ring-blue-500 bg-white dark:bg-gray-800 text-slate-900 dark:text-slate-100"
              placeholder="15.5"
              value={form.comision}
              onChange={e => setForm(f => ({ ...f, comision: e.target.value }))}
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-200">Rapel</label>
            <input
              type="text"
              className="border border-slate-300 dark:border-gray-600 rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-blue-400 dark:focus:ring-blue-500 bg-white dark:bg-gray-800 text-slate-900 dark:text-slate-100"
              placeholder="Ej: 2% adicional por objetivos"
              value={form.rapel}
              onChange={e => setForm(f => ({ ...f, rapel: e.target.value }))}
            />
          </div>
          
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-200">Observaciones</label>
            <textarea
              className="border border-slate-300 dark:border-gray-600 rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-blue-400 dark:focus:ring-blue-500 bg-white dark:bg-gray-800 text-slate-900 dark:text-slate-100"
              rows="3"
              placeholder="Detalles adicionales del acuerdo..."
              value={form.observaciones}
              onChange={e => setForm(f => ({ ...f, observaciones: e.target.value }))}
            />
          </div>
        </div>
        
        <button 
          type="submit"
          className="bg-green-500 hover:bg-green-600 dark:bg-green-700 dark:hover:bg-green-600 text-white px-6 py-2 rounded-lg font-medium transition-colors"
        >
          Guardar acuerdo
        </button>
      </form>
      
      <div>
        <h3 className="text-lg font-semibold mb-4">Acuerdos guardados ({acuerdos.length})</h3>
        
        {acuerdos.length === 0 ? (
          <Card className="text-center py-8 text-slate-500 dark:text-slate-400">
            No hay acuerdos guardados.
          </Card>
        ) : (
          <div className="space-y-3">
            {acuerdos.map(a => (
              <Card key={a.id} className="p-4 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-semibold text-slate-800 dark:text-slate-100">{a.nombre}</h4>
                    <p className="text-sm text-slate-600 dark:text-slate-300">{a.operador} ({a.sector})</p>
                    <p className="text-sm text-slate-600 dark:text-slate-300">Comisión: {a.comision}%</p>
                    {a.rapel && <p className="text-xs text-slate-500 dark:text-slate-400">Rapel: {a.rapel}</p>}
                    {a.observaciones && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">{a.observaciones}</p>
                    )}
                  </div>
                  <button 
                    onClick={() => handleDelete(a.id)}
                    className="text-red-500 dark:text-red-300 hover:text-red-700 dark:hover:text-red-200 text-sm font-medium"
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
// COMPONENTE PRINCIPAL: GestionSections (IGUAL)
// ==========================================
export default function GestionSections() {
  const [activeSection, setActiveSection] = useState('operadores');
  
  const sections = useMemo(() => [
    { id: 'operadores', label: 'Operadores', icon: '🏢', color: 'purple' },
    { id: 'productos', label: 'Productos', icon: '📦', color: 'green' },
    { id: 'administracion', label: 'Administración', icon: '⚙️', color: 'blue' }
  ], []);

  return (
    <div className="space-y-6">
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

export { ProductosSection, OperadoresSection, AdministracionSection };