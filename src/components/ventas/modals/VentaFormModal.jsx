import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Plus, Edit3, X, Save, Euro, Percent, AlertCircle, CheckCircle } from 'lucide-react';
import Card from '../../ui/Card';
import { SECTORES, FAMILIAS_POR_SECTOR } from '../../../utils/constants';
import { useImportGestion } from '../../../hooks/useImportGestion';

// Estados válidos para ventas
const ESTADOS_VALIDOS = [
  "Confirmada",
  "Pendiente", 
  "En Proceso",
  "Instalada",
  "Cancelada",
  "Rechazada",
];

/**
 * Modal consolidado para crear y editar ventas
 * Reemplaza NewVentaModal.jsx + EditVentaModal.jsx
 * Incluye mejoras de UX, validaciones y optimizaciones
 */
export function VentaFormModal({ 
  isOpen, 
  onClose, 
  onSave,
  venta = null, // null = New, objeto = Edit
  createInitialDraft,
  productos = [],
  operadores = [],
  colaboradores = [],
  zonas = []
}) {
    // Estado para cambios sin guardar y envío
    const [isDirty, setIsDirty] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    // Obtener campos personalizados del módulo ventas
    const { customFields = [] } = useImportGestion({ modulo: "ventas" });

    // =================== ESTADO Y CONFIGURACIÓN ===================

    // Determinar si es modo edición
    const isEditing = !!venta;

    // Estado del formulario SIEMPRE inicializado
    const [formData, setFormData] = useState({});
    const [errors, setErrors] = useState({});

    // Producto seleccionado (después de inicializar formData)
    const productoSeleccionado = useMemo(() =>
      productos.find(p => p.id === formData.producto_id),
      [productos, formData.producto_id]
    );

  // Filtrar colaboradores activos y con nombre
  const colaboradoresFiltrados = useMemo(() =>
    colaboradores.filter(c => {
      // Considerar activo si tiene nombre y no tiene fecha_baja o la fecha_baja es futura
      if (!c.nombre) return false;
      if (!c.fecha_baja) return true;
      // Permitir fechas en formato string o Date
      const fechaBaja = typeof c.fecha_baja === 'string' ? new Date(c.fecha_baja) : c.fecha_baja;
      return fechaBaja > new Date();
    }),
    [colaboradores]
  );

    // Inicialización avanzada del formulario al abrir el modal
    useEffect(() => {
      if (isOpen) {
        if (isEditing && venta) {
          setFormData({ ...venta });
        } else if (createInitialDraft) {
          // Modo creación: usar draft inicial
          const draft = createInitialDraft();
          // Selección automática de colaborador si no está definido
          if (colaboradoresFiltrados.length > 0 && !draft.colaborador_id) {
            draft.colaborador_id = colaboradoresFiltrados[0].id;
            draft.comision_colaborador = colaboradoresFiltrados[0].pct_colaborador_default || 0;
          }
          setFormData(draft);
        } else {
          // Fallback: formulario vacío
          const emptyForm = {
            fecha: new Date().toISOString().slice(0, 10),
            cliente: "",
            cif: "",
            estado: "Confirmada",
            cantidad: 1,
          };
          // Selección automática de colaborador si hay
          if (colaboradoresFiltrados.length > 0) {
            emptyForm.colaborador_id = colaboradoresFiltrados[0].id;
            emptyForm.comision_colaborador = colaboradoresFiltrados[0].pct_colaborador_default || 0;
          }
          setFormData(emptyForm);
        }
        setErrors({});
        setIsDirty(false);
        setIsSubmitting(false);
      }
    }, [isOpen, isEditing, venta, createInitialDraft, colaboradoresFiltrados]);

    const colaboradorSeleccionado = useMemo(() =>
      colaboradoresFiltrados.find(c => c.id === formData.colaborador_id),
      [colaboradoresFiltrados, formData.colaborador_id]
    );
  
  const operadorSeleccionado = useMemo(() => 
    operadores.find(o => o.id === formData.operador_id), 
    [operadores, formData.operador_id]
  );

  // Productos filtrados por operador
  const productosFiltrados = useMemo(() => {
    if (!formData.operador_id) return productos;
    return productos.filter(p => p.operador_id === formData.operador_id);
  }, [productos, formData.operador_id]);

  // Familias disponibles según sector
  const familiasDisponibles = useMemo(() => {
    return formData.sector ? FAMILIAS_POR_SECTOR[formData.sector] || [] : [];
  }, [formData.sector]);

  // 🎯 MEJORA: Validaciones en tiempo real
  const validationErrors = useMemo(() => {
    const newErrors = {};
    
    // Campos requeridos
    if (!formData.cliente?.trim()) newErrors.cliente = "Cliente es obligatorio";
    if (!formData.fecha) newErrors.fecha = "Fecha es obligatoria";
    if (!formData.colaborador_id) newErrors.colaborador_id = "Colaborador es obligatorio";
    if (!formData.zona_id) newErrors.zona_id = "Zona es obligatoria";
    
    // Validaciones de negocio
    if (formData.cliente && formData.cliente.length > 255) {
      newErrors.cliente = "Cliente no puede exceder 255 caracteres";
    }
    
    if (formData.cif && formData.cif.length > 20) {
      newErrors.cif = "CIF no puede exceder 20 caracteres";
    }
    
    // Validar campos personalizados requeridos
    customFields?.filter(f => f.requerido).forEach(field => {
      const fieldKey = `cf_${field.id}`;
      if (!formData[fieldKey]?.trim()) {
        newErrors[fieldKey] = `${field.nombre} es obligatorio`;
      }
    });
    
    return newErrors;
  }, [formData, customFields]);

  // 🎯 MEJORA: Información calculada del formulario
  const formStats = useMemo(() => {
    const pvpValue = productoSeleccionado?.pvp || formData.pvp || 0;
    const comisionBase = formData.comision_base || productoSeleccionado?.comision_valor || 0;
    const tipoComision = formData.comision_tipo || productoSeleccionado?.comision_tipo || 'porcentaje';
    const pctColaborador = formData.comision_colaborador || colaboradorSeleccionado?.pct_colaborador_default || 0;
    
    // Cálculo estimado de comisión
    let comisionEstimada = 0;
    if (tipoComision === 'porcentaje') {
      comisionEstimada = (pvpValue * comisionBase / 100) * pctColaborador;
    } else {
      comisionEstimada = comisionBase * pctColaborador;
    }
    
    return {
      pvp: pvpValue,
      comisionEstimada: comisionEstimada,
      hasErrors: Object.keys(validationErrors).length > 0,
      isComplete: !!(formData.cliente && formData.fecha && formData.colaborador_id && formData.zona_id),
    };
  }, [formData, productoSeleccionado, colaboradorSeleccionado, validationErrors]);

  // =================== HANDLERS DEL FORMULARIO ===================
  
  // 🎯 MEJORA: Handler genérico para actualizar campos
  const updateField = useCallback((field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setIsDirty(true);
    
    // Limpiar error del campo cuando se modifica
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  }, [errors]);

  // Handler específico para producto
  const handleProductChange = useCallback((productoId) => {
    const producto = productos.find(p => p.id === productoId);
    setFormData(prev => ({
      ...prev,
      producto_id: productoId,
      operador_id: producto?.operador_id || prev.operador_id,
      pvp: producto?.pvp || 0,
      comision_base: producto?.comision_valor || prev.comision_base || 15.0,
      comision_tipo: producto?.comision_tipo || prev.comision_tipo || 'porcentaje'
    }));
    setIsDirty(true);
  }, [productos]);

  // Handler específico para operador
  const handleOperadorChange = useCallback((operadorId) => {
    setFormData(prev => ({
      ...prev,
      operador_id: operadorId,
      // En modo creación, limpiar producto
      ...(isEditing ? {} : { producto_id: '' })
    }));
    setIsDirty(true);
  }, [isEditing]);

  // Handler específico para colaborador
  const handleColaboradorChange = useCallback((colaboradorId) => {
    const colaborador = colaboradores.find(c => c.id === colaboradorId);
    setFormData(prev => ({
      ...prev,
      colaborador_id: colaboradorId,
      comision_colaborador: colaborador?.pct_colaborador_default || prev.comision_colaborador || 0
    }));
    setIsDirty(true);
  }, [colaboradores]);

  // 🎯 MEJORA: Handler para sectores con validación
  const handleSectorChange = useCallback((sector) => {
    setFormData(prev => ({
      ...prev,
      sector,
      familia: '', // Limpiar familia al cambiar sector
    }));
    setIsDirty(true);
  }, []);

  // =================== SUBMIT Y VALIDACIÓN ===================
  
  // 🎯 MEJORA: Submit con validación completa
  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    
    // Validar errores
    setErrors(validationErrors);
    if (formStats.hasErrors) {
      // Scroll al primer error
      const firstErrorField = document.querySelector('.border-red-500');
      if (firstErrorField) {
        firstErrorField.scrollIntoView({ behavior: 'smooth', block: 'center' });
        firstErrorField.focus();
      }
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Preparar datos para envío
      const dataToSave = { ...formData };
      
      // Asegurar tipos correctos
      dataToSave.pvp = Number(dataToSave.pvp || 0);
      dataToSave.cantidad = Number(dataToSave.cantidad || 1);
      dataToSave.comision_base = Number(dataToSave.comision_base || 0);
      dataToSave.comision_colaborador = Number(dataToSave.comision_colaborador || 0);
      
      // Separar campos personalizados
      const customFieldsData = {};
      Object.keys(dataToSave).forEach(key => {
        if (key.startsWith('cf_')) {
          customFieldsData[key] = dataToSave[key];
          delete dataToSave[key];
        }
      });
      
      if (Object.keys(customFieldsData).length > 0) {
        dataToSave.customFields = customFieldsData;
      }
      
      // Llamar función de guardado
      if (isEditing) {
        await onSave(formData.id, dataToSave);
      } else {
        await onSave(dataToSave);
      }
      
      // Cerrar modal si el guardado fue exitoso
      onClose();
      
    } catch (error) {
      console.error('Error guardando venta:', error);
      setErrors({ submit: error.message || 'Error al guardar la venta' });
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, validationErrors, formStats.hasErrors, isEditing, onSave, onClose]);

  // 🎯 MEJORA: Confirmar cierre con cambios sin guardar
  const handleClose = useCallback(() => {
    if (isDirty && !window.confirm('¿Seguro que quieres cerrar? Los cambios no guardados se perderán.')) {
      return;
    }
    onClose();
  }, [isDirty, onClose]);

  // =================== RENDER ===================
  
  if (!isOpen) return null;

  const modalTitle = isEditing ? 'Editar Venta' : 'Registrar Nueva Venta';
  const primaryColor = isEditing ? 'amber' : 'emerald';
  const Icon = isEditing ? Edit3 : Plus;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-pink-200/40 dark:bg-pink-900/60 backdrop-blur-sm p-4">
      <div className="card-pastel rounded-2xl shadow-2xl p-6 w-full max-w-7xl max-h-[90vh] overflow-y-auto transition-colors">
        
        {/* Header */}
        <div className="sticky top-0 bg-pink-50 dark:bg-pink-200 pb-4 mb-6 border-b border-pink-200 dark:border-pink-400">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-pink-900 dark:text-pink-700 flex items-center gap-2">
              <Icon className={`w-5 h-5 ${isEditing ? 'text-amber-600' : 'text-emerald-600'}`} />
              {modalTitle}
            </h2>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-pink-100 dark:hover:bg-pink-300 rounded-lg transition-colors"
              disabled={isSubmitting}
            >
              <X className="w-5 h-5 text-pink-700 dark:text-pink-900" />
            </button>
          </div>
          
          {/* 🏆 MEJORA: Indicadores de estado */}
          <div className="mt-4 flex items-center gap-4 text-sm">
            <div className={`flex items-center gap-1 ${formStats.isComplete ? 'text-emerald-600' : 'text-pink-400'}`}>
              <CheckCircle className="w-4 h-4" />
              <span>Datos completos</span>
            </div>
            <div className={`flex items-center gap-1 ${formStats.hasErrors ? 'text-red-600' : 'text-emerald-600'}`}>
              <AlertCircle className="w-4 h-4" />
              <span>{formStats.hasErrors ? `${Object.keys(validationErrors).length} errores` : 'Sin errores'}</span>
            </div>
            {formStats.comisionEstimada > 0 && (
              <div className="flex items-center gap-1 text-blue-600">
                <Euro className="w-4 h-4" />
                <span>Comisión estimada: {formStats.comisionEstimada.toFixed(2)}€</span>
              </div>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6" aria-label={`Formulario para ${isEditing ? 'editar' : 'crear'} venta`}>
          
          {/* Error general */}
          {errors.submit && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-red-800">
                  <strong>Error:</strong> {errors.submit}
                </div>
              </div>
            </div>
          )}

          {/* Layout principal */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Columna 1: Información del Cliente */}
            <div className="space-y-4">
              <h4 className="font-semibold text-pink-900 dark:text-pink-700 pb-2 border-b border-pink-200 dark:border-pink-400">
                📋 Información del Cliente
              </h4>

              <div className="space-y-4">
                <h4 className="font-semibold text-pink-900 dark:text-pink-700 pb-2 border-b border-pink-200 dark:border-pink-400">
                  🏬 Detalles del Servicio
                </h4>
                <div>
                  <label className="text-sm text-slate-500 dark:text-slate-400" htmlFor="venta-cliente">
                    Cliente *
                  </label>
                  <input
                    id="venta-cliente"
                    className={`border rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 ${
                      errors.cliente 
                        ? 'border-red-500 focus:ring-red-400' 
                        : `focus:ring-${primaryColor}-400`
                    } dark:bg-darkInput dark:border-darkAccent dark:text-darkText`}
                    value={formData.cliente || ''}
                    onChange={(e) => updateField('cliente', e.target.value)}
                    required
                    aria-label="Nombre del cliente"
                    maxLength="255"
                  />
                  {errors.cliente && (
                    <p className="text-xs text-red-600 mt-1">{errors.cliente}</p>
                  )}
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm text-slate-500 dark:text-slate-400" htmlFor="venta-cif">
                      CIF/DNI
                    </label>
                    <input
                      id="venta-cif"
                      className={`border rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 ${
                        errors.cif 
                          ? 'border-red-500 focus:ring-red-400' 
                          : `focus:ring-${primaryColor}-400`
                      } dark:bg-darkInput dark:border-darkAccent dark:text-darkText`}
                      value={formData.cif || ''}
                      onChange={(e) => updateField('cif', e.target.value)}
                      aria-label="CIF o DNI"
                      maxLength="20"
                    />
                    {errors.cif && (
                      <p className="text-xs text-red-600 mt-1">{errors.cif}</p>
                    )}
                  </div>
                  <div>
                    <label className="text-sm text-slate-500 dark:text-slate-400" htmlFor="venta-fecha">
                      Fecha *
                    </label>
                    <input
                      id="venta-fecha"
                      type="date"
                      className={`border rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 ${
                        errors.fecha 
                          ? 'border-red-500 focus:ring-red-400' 
                          : `focus:ring-${primaryColor}-400`
                      } dark:bg-darkInput dark:border-darkAccent dark:text-darkText`}
                      value={formData.fecha || ''}
                      onChange={(e) => updateField('fecha', e.target.value)}
                      required
                      aria-label="Fecha de la venta"
                    />
                    {errors.fecha && (
                      <p className="text-xs text-red-600 mt-1">{errors.fecha}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm text-slate-500 dark:text-slate-400" htmlFor="venta-idpedido">
                      ID Pedido
                    </label>
                    <input
                      id="venta-idpedido"
                      className={`border rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-${primaryColor}-400 dark:bg-darkInput dark:border-darkAccent dark:text-darkText`}
                      placeholder="ID del pedido"
                      value={formData.id_pedido || ''}
                      onChange={(e) => updateField('id_pedido', e.target.value)}
                      aria-label="ID del pedido"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-slate-500 dark:text-slate-400" htmlFor="venta-idcliente">
                      ID Cliente
                    </label>
                    <input
                      id="venta-idcliente"
                      className={`border rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-${primaryColor}-400 dark:bg-darkInput dark:border-darkAccent dark:text-darkText`}
                      placeholder="ID del cliente"
                      value={formData.id_cliente || ''}
                      onChange={(e) => updateField('id_cliente', e.target.value)}
                      aria-label="ID del cliente"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm text-slate-500 dark:text-slate-400" htmlFor="venta-telfijo">
                      Teléfono Fijo
                    </label>
                    <input
                      id="venta-telfijo"
                      className={`border rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-${primaryColor}-400 dark:bg-darkInput dark:border-darkAccent dark:text-darkText`}
                      value={formData.telefono_fijo || ''}
                      onChange={(e) => updateField('telefono_fijo', e.target.value)}
                      aria-label="Teléfono fijo"
                      maxLength="20"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-slate-500 dark:text-slate-400" htmlFor="venta-telmovil">
                      Teléfono Móvil
                    </label>
                    <input
                      id="venta-telmovil"
                      className={`border rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-${primaryColor}-400 dark:bg-darkInput dark:border-darkAccent dark:text-darkText`}
                      value={formData.telefono_movil || ''}
                      onChange={(e) => updateField('telefono_movil', e.target.value)}
                      aria-label="Teléfono móvil"
                      maxLength="20"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Columna 2: Detalles del Servicio */}
            <div className="space-y-4">
              <h4 className="font-semibold text-slate-800 dark:text-darkText pb-2 border-b border-slate-200 dark:border-darkAccent/30">
                🛍️ Detalles del Servicio
              </h4>

              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm text-slate-500 dark:text-slate-400">Sector *</label>
                    <select
                      className={`border rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-${primaryColor}-400 dark:bg-darkInput dark:border-darkAccent dark:text-darkText`}
                      value={formData.sector || ''}
                      onChange={(e) => handleSectorChange(e.target.value)}
                      required
                    >
                      <option value="">Seleccionar sector</option>
                      {Object.entries(SECTORES).map(([key, label]) => (
                        <option key={key} value={key}>{label}</option>
                      ))}
                    </select>
                  </div>
                  {formData.sector && (
                    <div>
                      <label className="text-sm text-slate-500 dark:text-slate-400">Familia *</label>
                      <select
                        className={`border rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-${primaryColor}-400 dark:bg-darkInput dark:border-darkAccent dark:text-darkText`}
                        value={formData.familia || ''}
                        onChange={(e) => updateField('familia', e.target.value)}
                        required
                      >
                        <option value="">Seleccionar familia</option>
                        {familiasDisponibles.map((familia) => (
                          <option key={familia} value={familia}>{familia}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                <div>
                  <label className="text-sm text-slate-500 dark:text-slate-400">Operador *</label>
                  <select
                    className={`border rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-${primaryColor}-400 dark:bg-darkInput dark:border-darkAccent dark:text-darkText`}
                    value={formData.operador_id || ''}
                    onChange={(e) => handleOperadorChange(e.target.value)}
                    required
                  >
                    <option value="">Seleccionar operador</option>
                    {operadores.map((op) => (
                      <option key={op.id} value={op.id}>
                        {op.nombre}
                      </option>
                    ))}
                  </select>
                  {operadorSeleccionado && (
                    <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                      Operador seleccionado: {operadorSeleccionado.nombre}
                    </p>
                  )}
                </div>

                <div>
                  <label className="text-sm text-slate-500 dark:text-slate-400">Producto *</label>
                  <select
                    className={`border rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-${primaryColor}-400 dark:bg-darkInput dark:border-darkAccent dark:text-darkText`}
                    value={formData.producto_id || ''}
                    onChange={(e) => handleProductChange(e.target.value)}
                    required
                    disabled={!formData.operador_id}
                  >
                    <option value="">
                      {formData.operador_id ? "Seleccionar producto" : "Primero selecciona un operador"}
                    </option>
                    {productosFiltrados.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.nombre} {(!p.pvp || p.pvp === 0) && "(Sin PVP)"}
                      </option>
                    ))}
                  </select>
                  {productoSeleccionado && (
                    <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                      PVP: {productoSeleccionado.pvp ? `${productoSeleccionado.pvp}€` : 'No definido'}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm text-slate-500 dark:text-slate-400">Zona *</label>
                    <select
                      className={`border rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 ${
                        errors.zona_id 
                          ? 'border-red-500 focus:ring-red-400' 
                          : `focus:ring-${primaryColor}-400`
                      } dark:bg-darkInput dark:border-darkAccent dark:text-darkText`}
                      value={formData.zona_id || ''}
                      onChange={(e) => updateField('zona_id', e.target.value)}
                      required
                    >
                      <option value="">Seleccionar zona</option>
                      {zonas.map((z) => (
                        <option key={z.id} value={z.id}>
                          {z.nombre}
                        </option>
                      ))}
                    </select>
                    {errors.zona_id && (
                      <p className="text-xs text-red-600 mt-1">{errors.zona_id}</p>
                    )}
                  </div>
                  <div>
                    <label className="text-sm text-slate-500 dark:text-slate-400">Estado</label>
                    <select
                      className={`border rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-${primaryColor}-400 dark:bg-darkInput dark:border-darkAccent dark:text-darkText`}
                      value={formData.estado || 'Confirmada'}
                      onChange={(e) => updateField('estado', e.target.value)}
                    >
                      {ESTADOS_VALIDOS.map((estado) => (
                        <option key={estado} value={estado}>{estado}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-sm text-slate-500 dark:text-slate-400">Colaborador *</label>
                  <select
                    className={`border rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 ${
                      errors.colaborador_id 
                        ? 'border-red-500 focus:ring-red-400' 
                        : `focus:ring-${primaryColor}-400`
                    } dark:bg-darkInput dark:border-darkAccent dark:text-darkText`}
                    value={formData.colaborador_id || ''}
                    onChange={(e) => handleColaboradorChange(e.target.value)}
                    required
                  >
                    <option value="">Seleccionar colaborador</option>
                    {colaboradoresFiltrados.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nombre} - {c.nivelId} ({((c.pct_colaborador_default || 0) * 100).toFixed(1)}%)
                      </option>
                    ))}
                  </select>
                  {errors.colaborador_id && (
                    <p className="text-xs text-red-600 mt-1">{errors.colaborador_id}</p>
                  )}
                  {colaboradorSeleccionado && (
                    <p className="text-xs text-blue-600 dark:text-blue-400 mt-1 flex items-center gap-1">
                      <Percent className="w-3 h-3" />
                      Comisión: {((colaboradorSeleccionado.pct_colaborador_default || 0) * 100).toFixed(1)}%
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Columna 3: Precios y Comisiones */}
            <div className="space-y-4">
              <h4 className="font-semibold text-pink-900 dark:text-pink-700 pb-2 border-b border-pink-200 dark:border-pink-400">
                💰 Precios y Comisiones
              </h4>

              <div className="space-y-3">
                <div>
                  <label className="text-sm text-slate-500 dark:text-slate-400">PVP del Producto</label>
                  <input
                    type="number"
                    step="0.01"
                    className="border rounded-lg px-3 py-2 w-full bg-slate-100 dark:bg-slate-700 focus:outline-none dark:border-darkAccent dark:text-darkText"
                    value={formStats.pvp || 0}
                    readOnly
                  />
                  {formStats.pvp === 0 && (
                    <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                      ⚠️ Este producto no tiene PVP definido
                    </p>
                  )}
                </div>

                <div>
                  <label className="text-sm text-slate-500 dark:text-slate-400">Comisión Base del Producto</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      step="0.01"
                      className={`border rounded-lg px-3 py-2 flex-1 focus:outline-none focus:ring-2 focus:ring-${primaryColor}-400 dark:bg-darkInput dark:border-darkAccent dark:text-darkText`}
                      value={formData.comision_base || 0}
                      onChange={(e) => updateField('comision_base', parseFloat(e.target.value) || 0)}
                    />
                    <select
                      className={`border rounded-lg px-3 py-2 w-20 focus:outline-none focus:ring-2 focus:ring-${primaryColor}-400 dark:bg-darkInput dark:border-darkAccent dark:text-darkText`}
                      value={formData.comision_tipo || 'porcentaje'}
                      onChange={(e) => updateField('comision_tipo', e.target.value)}
                    >
                      <option value="porcentaje">%</option>
                      <option value="fijo">€</option>
                    </select>
                  </div>
                  {formData.comision_base > 0 && (
                    <p className="text-xs text-green-600 dark:text-green-400 mt-1 flex items-center gap-1">
                      <Euro className="w-3 h-3" />
                      {formData.comision_tipo === 'porcentaje' 
                        ? `${(formData.comision_base || 0).toFixed(1)}% del PVP`
                        : `${(formData.comision_base || 0).toFixed(2)}€ fijos`
                      }
                    </p>
                  )}
                </div>

                <div>
                  <label className="text-sm text-slate-500 dark:text-slate-400">Comisión Colaborador</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="1"
                      className={`border rounded-lg px-3 py-2 flex-1 focus:outline-none focus:ring-2 focus:ring-${primaryColor}-400 dark:bg-darkInput dark:border-darkAccent dark:text-darkText`}
                      value={formData.comision_colaborador || 0}
                      onChange={(e) => updateField('comision_colaborador', parseFloat(e.target.value) || 0)}
                    />
                    <span className="flex items-center px-3 py-2 bg-slate-100 dark:bg-slate-700 rounded-lg text-slate-600 dark:text-slate-300">%</span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Valor entre 0 y 1 (ej: 0.08 = 8%)
                  </p>
                </div>

                <div>
                  <label className="text-sm text-slate-500 dark:text-slate-400">Cantidad</label>
                  <input
                    type="number"
                    min="1"
                    className={`border rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-${primaryColor}-400 dark:bg-darkInput dark:border-darkAccent dark:text-darkText`}
                    value={formData.cantidad || 1}
                    onChange={(e) => updateField('cantidad', parseInt(e.target.value) || 1)}
                  />
                </div>

                <div>
                  <label className="text-sm text-slate-500 dark:text-slate-400">Documento</label>
                  <input
                    className={`border rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-${primaryColor}-400 dark:bg-darkInput dark:border-darkAccent dark:text-darkText`}
                    value={formData.documento || ''}
                    onChange={(e) => updateField('documento', e.target.value)}
                    maxLength="100"
                  />
                </div>

                <div>
                  <label className="text-sm text-slate-500 dark:text-slate-400">Numeración</label>
                  <input
                    className={`border rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-${primaryColor}-400 dark:bg-darkInput dark:border-darkAccent dark:text-darkText`}
                    value={formData.numeracion || ''}
                    onChange={(e) => updateField('numeracion', e.target.value)}
                    maxLength="50"
                  />
                </div>

                <div>
                  <label className="text-sm text-slate-500 dark:text-slate-400">Observaciones</label>
                  <textarea
                    className={`border rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-${primaryColor}-400 dark:bg-darkInput dark:border-darkAccent dark:text-darkText`}
                    rows="4"
                    value={formData.observaciones || ''}
                    onChange={(e) => updateField('observaciones', e.target.value)}
                    maxLength="500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Campos personalizados */}
          {customFields?.length > 0 && (
            <div className="border-t border-pink-200 dark:border-pink-400 pt-6">
              <h4 className="font-semibold text-pink-900 dark:text-pink-700 mb-4">
                🎛️ Campos Personalizados
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {customFields.map((field) => {
                  const fieldKey = `cf_${field.id}`;
                  const hasError = !!errors[fieldKey];
                  
                  return (
                    <div key={field.id}>
                      <label className="text-sm text-slate-500 dark:text-slate-400" htmlFor={`customfield-${field.id}`}>
                        {field.nombre}{field.requerido && ' *'}
                      </label>
                      {field.tipo === 'texto' && (
                        <input
                          id={`customfield-${field.id}`}
                          className={`border rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 ${
                            hasError 
                              ? 'border-red-500 focus:ring-red-400' 
                              : 'focus:ring-yellow-400'
                          } dark:bg-darkInput dark:border-darkAccent dark:text-darkText`}
                          value={formData[fieldKey] || ''}
                          onChange={e => updateField(fieldKey, e.target.value)}
                          required={field.requerido}
                        />
                      )}
                      {field.tipo === 'número' && (
                        <input
                          id={`customfield-${field.id}`}
                          type="number"
                          className={`border rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 ${
                            hasError 
                              ? 'border-red-500 focus:ring-red-400' 
                              : 'focus:ring-yellow-400'
                          } dark:bg-darkInput dark:border-darkAccent dark:text-darkText`}
                          value={formData[fieldKey] || ''}
                          onChange={e => updateField(fieldKey, e.target.value)}
                          required={field.requerido}
                        />
                      )}
                      {field.tipo === 'fecha' && (
                        <input
                          id={`customfield-${field.id}`}
                          type="date"
                          className={`border rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 ${
                            hasError 
                              ? 'border-red-500 focus:ring-red-400' 
                              : 'focus:ring-yellow-400'
                          } dark:bg-darkInput dark:border-darkAccent dark:text-darkText`}
                          value={formData[fieldKey] || ''}
                          onChange={e => updateField(fieldKey, e.target.value)}
                          required={field.requerido}
                        />
                      )}
                      {field.tipo === 'select' && (
                        <select
                          id={`customfield-${field.id}`}
                          className={`border rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 ${
                            hasError 
                              ? 'border-red-500 focus:ring-red-400' 
                              : 'focus:ring-yellow-400'
                          } dark:bg-darkInput dark:border-darkAccent dark:text-darkText`}
                          value={formData[fieldKey] || ''}
                          onChange={e => updateField(fieldKey, e.target.value)}
                          required={field.requerido}
                        >
                          <option value="">Seleccionar</option>
                          {field.opciones?.map(opt => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                      )}
                      {hasError && (
                        <p className="text-xs text-red-600 mt-1">{errors[fieldKey]}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Botones de acción */}
          <div className="flex justify-end gap-3 pt-6 border-t border-pink-200 dark:border-pink-400">
            <button
              type="button"
              onClick={handleClose}
              className="px-8 py-3 border border-pink-200 dark:border-pink-400 rounded-xl text-pink-700 dark:text-pink-900 hover:bg-pink-100 dark:hover:bg-pink-300 transition-colors"
              disabled={isSubmitting}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={formStats.hasErrors || isSubmitting}
              className={`flex items-center gap-2 px-8 py-3 rounded-xl text-white transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed ${
                isEditing 
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700'
                  : 'bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700'
              }`}
            >
              <Save className="w-4 h-4" />
              {isSubmitting 
                ? (isEditing ? 'Guardando...' : 'Creando...') 
                : (isEditing ? 'Guardar Cambios' : 'Crear Venta')
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
export default VentaFormModal;
