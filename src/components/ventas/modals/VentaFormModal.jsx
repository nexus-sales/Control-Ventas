import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Plus, Edit3, X, Save, Euro, Percent, AlertCircle, CheckCircle } from 'lucide-react';
import { SECTORES, FAMILIAS_POR_SECTOR } from '../../../utils/constants';
import { getColaboradorComision } from '../../../utils/calculos';

// Estados válidos para ventas
const ESTADOS_VALIDOS = [
  "Confirmada",
  "Pendiente", 
  "En Proceso",
  "Instalada",
  "Cancelada",
  "Rechazada",
  "ACTIVO",
  "PENDIENTE",
  "SCORING",
  "INCIDENCIA",
  "INSTALACION",
  "ENVIADA",
  "CITADA",
  "TRAMITACION",
  "BAJA",
];

const normalizeFactor = (valor) => {
  if (valor === null || valor === undefined) return null;
  const numeric = Number(valor);
  if (!isFinite(numeric) || numeric <= 0) return null;
  return numeric > 1 ? numeric / 100 : numeric;
};

const resolveColaboradorFactorForProduct = (colaborador, producto) => {
  if (!colaborador || !producto) return null;
  const sector = producto.sector ? String(producto.sector).toUpperCase() : '';

  if (sector === 'TELEFONIA') {
    const factorTelefonia = normalizeFactor(
      colaborador.pctTelefonia ?? colaborador.comisionFactorBase ?? colaborador.pct_colaborador_default
    );
    if (factorTelefonia !== null) return factorTelefonia;
  }

  if (sector === 'ENERGIA') {
    const factorEnergia = normalizeFactor(
      colaborador.pctEnergia ?? colaborador.comisionFactorBase ?? colaborador.pct_colaborador_default
    );
    if (factorEnergia !== null) return factorEnergia;
  }

  const fallback = normalizeFactor(
    colaborador.comisionFactorBase ?? colaborador.pct_colaborador_default ?? colaborador.pct_telefonia
  );

  return fallback;
};

const pickComisionSnapshot = (producto, fechaVenta) => {
  const lista = Array.isArray(producto?.comisiones_historial) ? [...producto.comisiones_historial] : [];
  if (!lista.length) return { snap: null, vigenciaOK: (!producto?.comision_vigencia_desde || fechaVenta >= producto.comision_vigencia_desde) && (!producto?.comision_vigencia_hasta || fechaVenta <= producto.comision_vigencia_hasta) };

  const normalizadas = lista
    .map((item) => ({
      ...item,
      desde: item.desde || item.comision_vigencia_desde || '',
      hasta: item.hasta || item.comision_vigencia_hasta || '',
    }))
    .sort((a, b) => (b.desde || '').localeCompare(a.desde || ''));

  const match = normalizadas.find((item) =>
    (!item.desde || fechaVenta >= item.desde) && (!item.hasta || fechaVenta <= item.hasta)
  );

  const chosen = match || normalizadas[0];
  const vigenciaOK = (!chosen.desde || fechaVenta >= chosen.desde) && (!chosen.hasta || fechaVenta <= chosen.hasta);
  return { snap: chosen, vigenciaOK };
};

const computeComisionProducto = (producto, formData) => {
  if (!producto) {
    return { base: 0, tipo: 'porcentaje', vigenciaOK: true, origen: 'sin producto' };
  }

  const fechaVenta = formData?.fecha || new Date().toISOString().slice(0, 10);
  const { snap, vigenciaOK: vigenciaHist } = pickComisionSnapshot(producto, fechaVenta);
  const ref = snap || producto;
  const sector = ref.sector ? String(ref.sector).toUpperCase() : (producto.sector ? String(producto.sector).toUpperCase() : '');

  let tipo = ref.comision_tipo || (ref.comision_porcentaje ? 'porcentaje' : 'fijo');
  let base = ref.comision_valor || ref.comision_fija || ref.comision_porcentaje || 0;
  let origen = snap ? 'historial' : 'base producto';
  let vigenciaOK = snap ? vigenciaHist : (
    (!ref.comision_vigencia_desde || fechaVenta >= ref.comision_vigencia_desde) &&
    (!ref.comision_vigencia_hasta || fechaVenta <= ref.comision_vigencia_hasta)
  );

  if (sector === 'TELEFONIA') {
    const clienteTipo = (formData?.cliente_tipo || 'NUEVO').toUpperCase();
    const tipoActivacion = (formData?.tipo_activacion || 'ALTA').toUpperCase();

    const candidataCliente = clienteTipo === 'NUEVO'
      ? ref.comision_cliente_nuevo
      : ref.comision_cliente_existente;

    const candidataActivacion = tipoActivacion === 'PORTABILIDAD'
      ? ref.comision_portabilidad
      : ref.comision_alta_nueva;

    const candidatos = [
      candidataActivacion,
      candidataCliente,
      ref.comision_valor,
      ref.comision_fija,
      ref.comision_porcentaje,
    ];

    const firstDefined = candidatos.find(v => v !== null && v !== undefined && v !== '');
    if (firstDefined !== undefined) {
      base = Number(firstDefined) || 0;
      origen = 'telefonia';
    }
  }

  if (sector === 'ENERGIA' || sector === 'SEGURIDAD') {
    base = ref.comision_valor || ref.comision_fija || ref.comision_porcentaje || base;
    tipo = ref.comision_tipo || tipo;
    origen = snap ? 'historial' : 'vigencia producto';
  }

  return { base, tipo, vigenciaOK, origen };
};
export function VentaFormModal({
  isOpen,
  onClose,
  onSave,
  venta,
  colaboradores = [],
  zonas = [],
  operadores = [],
  productos = [],
  niveles = [],
  customFields = [],
  createInitialDraft,
  resolveColaboradorName,
  resolveZonaName,
  resolveOperadorName,
  resolveProductoName
}) {
  // Estado principal del formulario
  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState({});
  const [isDirty, setIsDirty] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Detectar si es edición o alta
  const isEditing = !!(venta && venta.id);

  // Memoizar arrays de datos
  const productosData = useMemo(() => productos || [], [productos]);
  const operadoresData = useMemo(() => operadores || [], [operadores]);
  const colaboradoresData = useMemo(() => colaboradores || [], [colaboradores]);
  const zonasData = useMemo(() => zonas || [], [zonas]);
  const nivelesData = useMemo(() => niveles || [], [niveles]);

  // Filtrar y preparar zonas asegurando que tengan nombre
  const zonasDisponibles = useMemo(() => {
    if (!Array.isArray(zonasData) || zonasData.length === 0) return [];

    const normalizeKey = (value) =>
      value
        ? value
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-zA-Z0-9]+/g, ' ')
            .trim()
            .toLowerCase()
        : '';

    const uniqueMap = new Map();

    zonasData.forEach((zona) => {
      if (!zona?.id) return;
      const resolvedName = zona.nombre || (resolveZonaName ? resolveZonaName(zona.id) : '') || zona.id;
      const keyBase = normalizeKey(resolvedName);
      const codePart = zona.codigo ? `|${zona.codigo.toLowerCase()}` : '';
      const mapKey = keyBase ? `${keyBase}${codePart}` : zona.id.toLowerCase();
      if (!uniqueMap.has(mapKey)) {
        uniqueMap.set(mapKey, { zona, resolvedName });
      }
    });

    return Array.from(uniqueMap.values())
      .map(({ zona, resolvedName }) => ({
        ...zona,
        nombreDisplay: resolvedName || zona.id,
      }))
      .sort((a, b) => a.nombreDisplay.localeCompare(b.nombreDisplay));
  }, [zonasData, resolveZonaName]);

  // Filtrar y preparar colaboradores asegurando que tengan nombre
  const colaboradoresDisponibles = useMemo(() => {
    if (!Array.isArray(colaboradoresData) || colaboradoresData.length === 0) return [];
    return colaboradoresData
      .filter(c => c?.id && (c.nombre || (resolveColaboradorName && resolveColaboradorName(c.id)) || c.id))
      .map(c => {
        const nivelInfo = nivelesData.find(n => n.id === (c.nivel || c.nivelId));
        return {
          ...c,
          nombreDisplay: c.nombre || (resolveColaboradorName ? resolveColaboradorName(c.id) : c.id),
          nivelInfo,
          pctTelefonia: c.pct_telefonia ?? nivelInfo?.pct_telefonia ?? null,
          pctEnergia: c.pct_energia ?? nivelInfo?.pct_energia ?? null,
          fijoSeguridad: c.fijo_seguridad ?? nivelInfo?.fijo_seguridad ?? null,
          comisionFactorBase: c.pct_colaborador_default ?? nivelInfo?.pct_colaborador_default ?? null,
        };
      })
      .sort((a, b) => a.nombreDisplay.localeCompare(b.nombreDisplay));
  }, [colaboradoresData, nivelesData, resolveColaboradorName]);

  // Log de depuración para colaboradores (después de inicializar los hooks)
  useEffect(() => {
    if (isOpen) {
      console.log('Colaboradores recibidos:', colaboradores);
      console.log('Colaboradores disponibles:', colaboradoresDisponibles);
    }
  }, [isOpen, colaboradores, colaboradoresDisponibles]);

  const operadoresDisponibles = useMemo(() => {
    if (!Array.isArray(operadoresData)) return [];
    return operadoresData
      .filter(o => o?.id && (o.nombre || o.codigo || o.id))
      .map(o => ({
        ...o,
        nombreDisplay: o.nombre || (resolveOperadorName ? resolveOperadorName(o.id) : o.id)
      }))
      .sort((a, b) => a.nombreDisplay.localeCompare(b.nombreDisplay));
  }, [operadoresData, resolveOperadorName]);

  const productosDisponibles = useMemo(() => {
    if (!Array.isArray(productosData)) return [];
    return productosData
      .filter(p => p?.id && (p.nombre || (resolveProductoName && resolveProductoName(p.id)) || p.id))
      .map(p => ({
        ...p,
        nombreDisplay: p.nombre || (resolveProductoName ? resolveProductoName(p.id) : p.id)
      }))
      .sort((a, b) => a.nombreDisplay.localeCompare(b.nombreDisplay));
  }, [productosData, resolveProductoName]);

  // Validaciones
  const validationErrors = useMemo(() => {
    const errors = {};
    if (!formData.cliente || !formData.cliente.trim()) errors.cliente = 'El cliente es obligatorio';
    if (!formData.fecha) errors.fecha = 'La fecha es obligatoria';
    if (!formData.colaborador_id) errors.colaborador_id = 'El colaborador es obligatorio';
    if (!formData.zona_id) errors.zona_id = 'La zona es obligatoria';
    customFields?.forEach(field => {
      const key = `cf_${field.id}`;
      if (field.requerido && !formData[key]) errors[key] = 'Campo obligatorio';
    });
    return errors;
  }, [formData, customFields]);

  // Estadísticas del formulario
  const formStats = useMemo(() => {
    const pvpValue = Number(formData.pvp) || 0;
    const comisionBase = Number(formData.comision_base) || 0;
    const pctColaborador = Number(formData.comision_colaborador) || 0;
    const tipoComision = formData.comision_tipo || 'porcentaje';

    const colaborador = colaboradoresDisponibles.find(c => c.id === formData.colaborador_id);
    const producto = productosDisponibles.find(p => p.id === formData.producto_id);

    let comisionEstimada = 0;

    if (comisionBase > 0 && colaborador && producto && nivelesData.length > 0) {
      const parte = getColaboradorComision(colaborador, nivelesData, comisionBase, producto);
      if (Number.isFinite(parte)) {
        comisionEstimada = parte;
      }
    }

    if (comisionEstimada === 0 && comisionBase > 0 && pctColaborador > 0) {
      if (tipoComision === 'porcentaje') {
        const comisionProducto = (pvpValue * comisionBase) / 100;
        comisionEstimada = comisionProducto * pctColaborador;
      } else if (tipoComision === 'fijo') {
        comisionEstimada = comisionBase * pctColaborador;
      }
    }

    return {
      pvp: pvpValue,
      comisionEstimada,
      hasErrors: Object.keys(validationErrors).length > 0,
      isComplete: !!(formData.cliente && formData.fecha && formData.colaborador_id && formData.zona_id),
      hasMissingData: colaboradoresDisponibles.length === 0 || zonasDisponibles.length === 0,
    };
  }, [formData, colaboradoresDisponibles, productosDisponibles, nivelesData, zonasDisponibles.length, validationErrors]);

  // Producto, colaborador, operador y zona seleccionados
  const productoSeleccionado = useMemo(() =>
    productosDisponibles.find(p => p.id === formData.producto_id),
    [productosDisponibles, formData.producto_id]
  );
  const colaboradorSeleccionado = useMemo(() =>
    colaboradoresDisponibles.find(c => c.id === formData.colaborador_id),
    [colaboradoresDisponibles, formData.colaborador_id]
  );
  const operadorSeleccionado = useMemo(() =>
    operadoresDisponibles.find(o => o.id === formData.operador_id),
    [operadoresDisponibles, formData.operador_id]
  );
  const zonaSeleccionada = useMemo(() =>
    zonasDisponibles.find(z => z.id === formData.zona_id),
    [zonasDisponibles, formData.zona_id]
  );

  useEffect(() => {
    if (!isOpen) return;
    if (!formData.colaborador_id || !formData.producto_id) return;

    const colaborador = colaboradoresDisponibles.find(c => c.id === formData.colaborador_id);
    const producto = productosDisponibles.find(p => p.id === formData.producto_id);
    if (!colaborador || !producto) return;

    const factor = resolveColaboradorFactorForProduct(colaborador, producto);
    const actual = Number(formData.comision_colaborador ?? 0);

    if (factor !== null && factor > 0 && (!Number.isFinite(actual) || actual <= 0)) {
      setFormData(prev => ({
        ...prev,
        comision_colaborador: factor,
      }));
    }
  }, [isOpen, formData.colaborador_id, formData.producto_id, formData.comision_colaborador, colaboradoresDisponibles, productosDisponibles]);

  // Productos filtrados por operador
  const productosFiltrados = useMemo(() => {
    if (!formData.operador_id) return productosDisponibles;
    return productosDisponibles.filter(p => p.operador_id === formData.operador_id);
  }, [productosDisponibles, formData.operador_id]);

  // Familias disponibles según sector
  const familiasDisponibles = useMemo(() => {
    return formData.sector ? FAMILIAS_POR_SECTOR[formData.sector] || [] : [];
  }, [formData.sector]);

  // Inicialización del formulario
  useEffect(() => {
    if (isOpen) {
      if (isEditing && venta) {
        setFormData({
          cliente_tipo: venta?.cliente_tipo || 'NUEVO',
          tipo_activacion: venta?.tipo_activacion || 'ALTA',
          comision_fuera_vigencia: venta?.comision_fuera_vigencia || false,
          ...venta,
        });
      } else if (createInitialDraft && typeof createInitialDraft === 'function') {
        const draft = createInitialDraft();
        draft.cliente_tipo = draft.cliente_tipo || 'NUEVO';
        draft.tipo_activacion = draft.tipo_activacion || 'ALTA';
        draft.comision_fuera_vigencia = false;
        if (colaboradoresDisponibles.length > 0 && !draft.colaborador_id) {
          const primerColaborador = colaboradoresDisponibles[0];
          draft.colaborador_id = primerColaborador.id;
        }
        if (zonasDisponibles.length === 1) draft.zona_id = zonasDisponibles[0].id;
        if (operadoresDisponibles.length === 1) draft.operador_id = operadoresDisponibles[0].id;
        if (draft.producto_id && productosDisponibles.length > 0) {
          const producto = productosDisponibles.find(p => p.id === draft.producto_id);
          if (producto) {
            draft.pvp = producto.pvp || 0;
            const { base, tipo, vigenciaOK } = computeComisionProducto(producto, draft);
            draft.comision_tipo = tipo || producto.comision_tipo || 'fijo';
            draft.comision_base = Number(base) || 0;
            draft.comision_fija = tipo === 'fijo' ? Number(base) || 0 : 0;
            draft.comision_porcentaje = tipo === 'porcentaje' ? Number(base) || 0 : 0;
            draft.comision_fuera_vigencia = !vigenciaOK;
          }
        }
        const colabDraft = colaboradoresDisponibles.find(c => c.id === draft.colaborador_id);
        const productoDraft = productosDisponibles.find(p => p.id === draft.producto_id);
        const factorDraft = resolveColaboradorFactorForProduct(colabDraft, productoDraft);
        if (factorDraft !== null && factorDraft > 0) {
          draft.comision_colaborador = factorDraft;
        } else if (!draft.comision_colaborador && colabDraft) {
          draft.comision_colaborador = colabDraft.comisionFactorBase ?? 0;
        }
        setFormData(draft);
      } else {
        const emptyForm = {
          fecha: new Date().toISOString().slice(0, 10),
          cliente: "",
          cif: "",
          estado: "Confirmada",
          cantidad: 1,
          pvp: 0,
          comision_base: 0,
          comision_tipo: 'porcentaje',
          comision_fija: 0,
          comision_porcentaje: 0,
          cliente_tipo: 'NUEVO',
          tipo_activacion: 'ALTA',
          comision_fuera_vigencia: false,
        };
        if (colaboradoresDisponibles.length > 0) {
          emptyForm.colaborador_id = colaboradoresDisponibles[0].id;
        }
        if (zonasDisponibles.length > 0) emptyForm.zona_id = zonasDisponibles[0].id;
        if (operadoresDisponibles.length > 0) emptyForm.operador_id = operadoresDisponibles[0].id;
        if (productosDisponibles.length > 0) {
          const producto = productosDisponibles[0];
          emptyForm.producto_id = producto.id;
          const { base, tipo, vigenciaOK } = computeComisionProducto(producto, emptyForm);
          emptyForm.comision_base = Number(base) || 0;
          emptyForm.comision_tipo = tipo || 'porcentaje';
          emptyForm.comision_fija = tipo === 'fijo' ? Number(base) || 0 : 0;
          emptyForm.comision_porcentaje = tipo === 'porcentaje' ? Number(base) || 0 : 0;
          emptyForm.comision_fuera_vigencia = !vigenciaOK;
        }
        const colabEmpty = colaboradoresDisponibles.find(c => c.id === emptyForm.colaborador_id);
        const productoEmpty = productosDisponibles.find(p => p.id === emptyForm.producto_id) || productosDisponibles[0];
        const factorEmpty = resolveColaboradorFactorForProduct(colabEmpty, productoEmpty);
        if (factorEmpty !== null && factorEmpty > 0) {
          emptyForm.comision_colaborador = factorEmpty;
        } else if (!emptyForm.comision_colaborador && colabEmpty) {
          emptyForm.comision_colaborador = colabEmpty.comisionFactorBase ?? 0;
        }
        setFormData(emptyForm);
      }
      setErrors({});
      setIsDirty(false);
      setIsSubmitting(false);
    }
  }, [isOpen, isEditing, venta, createInitialDraft, colaboradoresDisponibles, zonasDisponibles, operadoresDisponibles, productosDisponibles]);

  // Handlers
  const updateField = useCallback((field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setIsDirty(true);
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: undefined }));
  }, [errors]);

  const handleProductChange = useCallback((productoId) => {
    const producto = productosDisponibles.find(p => p.id === productoId);
    setFormData(prev => {
      const colaborador = colaboradoresDisponibles.find(c => c.id === prev.colaborador_id);
      const nuevoFactor = resolveColaboradorFactorForProduct(colaborador, producto);
      const { base, tipo, vigenciaOK } = computeComisionProducto(producto, { ...prev, fecha: prev.fecha, cliente_tipo: prev.cliente_tipo, tipo_activacion: prev.tipo_activacion });
      return {
        ...prev,
        producto_id: productoId,
        operador_id: producto?.operador_id || prev.operador_id,
        sector: producto?.sector || prev.sector,
        pvp: producto?.pvp || 0,
        comision_base: Number(base) || 0,
        comision_tipo: tipo || producto?.comision_tipo || prev.comision_tipo || 'porcentaje',
        comision_fija: (tipo || producto?.comision_tipo) === 'fijo' ? Number(base) || 0 : 0,
        comision_porcentaje: (tipo || producto?.comision_tipo) === 'porcentaje' ? Number(base) || 0 : 0,
        comision_fuera_vigencia: !vigenciaOK,
        comision_colaborador: nuevoFactor ?? prev.comision_colaborador ?? 0
      };
    });
    setIsDirty(true);
  }, [productosDisponibles, colaboradoresDisponibles]);

  const handleOperadorChange = useCallback((operadorId) => {
    setFormData(prev => ({
      ...prev,
      operador_id: operadorId,
      ...(isEditing ? {} : { producto_id: '' })
    }));
    setIsDirty(true);
  }, [isEditing]);

  const handleColaboradorChange = useCallback((colaboradorId) => {
    const nuevoColaborador = colaboradoresDisponibles.find(c => c.id === colaboradorId);
    setFormData(prev => {
      const producto = productosDisponibles.find(p => p.id === prev.producto_id);
      const nuevoFactor = resolveColaboradorFactorForProduct(nuevoColaborador, producto);
      return {
        ...prev,
        colaborador_id: colaboradorId,
        comision_colaborador: nuevoFactor ?? nuevoColaborador?.comisionFactorBase ?? prev.comision_colaborador ?? 0.15
      };
    });
    setIsDirty(true);
  }, [colaboradoresDisponibles, productosDisponibles]);

  const handleSectorChange = useCallback((sector) => {
    setFormData(prev => ({
      ...prev,
      sector,
      familia: '',
      cliente_tipo: sector === 'TELEFONIA' ? prev.cliente_tipo || 'NUEVO' : prev.cliente_tipo,
      tipo_activacion: sector === 'TELEFONIA' ? prev.tipo_activacion || 'ALTA' : prev.tipo_activacion,
    }));
    setIsDirty(true);
  }, []);

  // Recalcula la comisión base cuando cambia fecha, tipo de cliente o activación (y hay producto seleccionado)
  useEffect(() => {
    if (!formData.producto_id) return;
    const producto = productosDisponibles.find(p => p.id === formData.producto_id);
    if (!producto) return;
    const { base, tipo, vigenciaOK } = computeComisionProducto(producto, formData);
    setFormData(prev => ({
      ...prev,
      comision_base: Number(base) || 0,
      comision_tipo: tipo || prev.comision_tipo || producto.comision_tipo || 'porcentaje',
      comision_fija: (tipo || producto.comision_tipo) === 'fijo' ? Number(base) || 0 : 0,
      comision_porcentaje: (tipo || producto.comision_tipo) === 'porcentaje' ? Number(base) || 0 : 0,
      comision_fuera_vigencia: !vigenciaOK,
    }));
  }, [formData.fecha, formData.cliente_tipo, formData.tipo_activacion, formData.producto_id, productosDisponibles]);

  // Submit
  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    setErrors(validationErrors);
    if (formStats.hasErrors) {
      const firstErrorField = document.querySelector('.border-red-500');
      if (firstErrorField) {
        firstErrorField.scrollIntoView({ behavior: 'smooth', block: 'center' });
        firstErrorField.focus();
      }
      return;
    }
    setIsSubmitting(true);
    try {
      const dataToSave = { ...formData };
      dataToSave.pvp = Number(dataToSave.pvp || 0);
      dataToSave.cantidad = Number(dataToSave.cantidad || 1);
      dataToSave.comision_base = Number(dataToSave.comision_base || 0);
      dataToSave.comision_colaborador = Number(dataToSave.comision_colaborador || 0);
      dataToSave.comision_fija = Number(dataToSave.comision_fija ?? productoSeleccionado?.comision_fija ?? 0);
      dataToSave.comision_porcentaje = Number(dataToSave.comision_porcentaje ?? productoSeleccionado?.comision_porcentaje ?? 0);
      dataToSave.comision_tipo = dataToSave.comision_tipo ?? productoSeleccionado?.comision_tipo ?? 'fijo';
      dataToSave.cliente_tipo = dataToSave.cliente_tipo || 'NUEVO';
      dataToSave.tipo_activacion = dataToSave.tipo_activacion || 'ALTA';
      dataToSave.comision_fuera_vigencia = !!formData.comision_fuera_vigencia;
      dataToSave.comision_vigencia_aplicada_desde = productoSeleccionado?.comision_vigencia_desde || null;
      dataToSave.comision_vigencia_aplicada_hasta = productoSeleccionado?.comision_vigencia_hasta || null;
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
      if (isEditing) {
        await onSave(formData.id, dataToSave);
      } else {
        await onSave(dataToSave);
      }
      onClose();
    } catch (error) {
      setErrors({ submit: error.message || 'Error al guardar la venta' });
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, validationErrors, formStats.hasErrors, isEditing, onSave, onClose, productoSeleccionado]);

  const handleClose = useCallback(() => {
    if (isDirty && !window.confirm('¿Seguro que quieres cerrar? Los cambios no guardados se perderán.')) return;
    onClose();
  }, [isDirty, onClose]);

  // Render
  if (!isOpen) return null;

  const modalTitle = isEditing ? 'Editar Venta' : 'Registrar Nueva Venta';
  const primaryColor = isEditing ? 'amber' : 'emerald';
  const Icon = isEditing ? Edit3 : Plus;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-6 w-full max-w-7xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-slate-800 pb-4 mb-6 border-b border-slate-200 dark:border-slate-600">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Icon className={`w-5 h-5 ${isEditing ? 'text-amber-600' : 'text-emerald-600'}`} />
              {modalTitle}
            </h2>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              disabled={isSubmitting}
            >
              <X className="w-5 h-5 text-slate-700 dark:text-slate-300" />
            </button>
          </div>
          {/* Indicadores de estado */}
          <div className="mt-4 flex items-center gap-4 text-sm">
            <div className={`flex items-center gap-1 ${formStats.isComplete ? 'text-emerald-600' : 'text-amber-500'}`}>
              <CheckCircle className="w-4 h-4" />
              <span>Datos completos</span>
            </div>
            <div className={`flex items-center gap-1 ${formStats.hasErrors ? 'text-red-600' : 'text-emerald-600'}`}>
              <AlertCircle className="w-4 h-4" />
              <span>{formStats.hasErrors ? `${Object.keys(validationErrors).length} errores` : 'Sin errores'}</span>
            </div>
            {formStats.hasMissingData && (
              <div className="flex items-center gap-1 text-orange-600">
                <AlertCircle className="w-4 h-4" />
                <span>Datos faltantes en el sistema</span>
              </div>
            )}
            {formStats.comisionEstimada > 0 && (
              <div className="flex items-center gap-1 text-blue-600">
                <Euro className="w-4 h-4" />
                <span>Comisión estimada: {formStats.comisionEstimada.toFixed(2)}€</span>
              </div>
            )}
          </div>
          {/* Alertas de datos faltantes */}
          {formStats.hasMissingData && (
            <div className="mt-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-orange-800">
                  <strong>Atención:</strong>
                  {colaboradoresDisponibles.length === 0 && " No hay colaboradores válidos en el sistema."}
                  {zonasDisponibles.length === 0 && " No hay zonas válidas en el sistema."}
                  {" Verifica que existan entidades con nombres válidos antes de crear ventas."}
                </div>
              </div>
            </div>
          )}
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
              <h4 className="font-semibold text-slate-900 dark:text-slate-100 pb-2 border-b border-slate-200 dark:border-slate-600">
                📋 Información del Cliente
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
                  } dark:bg-slate-700 dark:border-slate-600 dark:text-slate-100`}
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
                    } dark:bg-slate-700 dark:border-slate-600 dark:text-slate-100`}
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
                    } dark:bg-slate-700 dark:border-slate-600 dark:text-slate-100`}
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
                    className={`border rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-${primaryColor}-400 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-100`}
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
                    className={`border rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-${primaryColor}-400 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-100`}
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
                    className={`border rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-${primaryColor}-400 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-100`}
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
                    className={`border rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-${primaryColor}-400 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-100`}
                    value={formData.telefono_movil || ''}
                    onChange={(e) => updateField('telefono_movil', e.target.value)}
                    aria-label="Teléfono móvil"
                    maxLength="20"
                  />
                </div>
              </div>
            </div>
            {/* Columna 2: Detalles del Servicio */}
            <div className="space-y-4">
              <h4 className="font-semibold text-slate-900 dark:text-slate-100 pb-2 border-b border-slate-200 dark:border-slate-600">
                🛍️ Detalles del Servicio
              </h4>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm text-slate-500 dark:text-slate-400">Sector</label>
                    <select
                      className={`border rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-${primaryColor}-400 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-100`}
                      value={formData.sector || ''}
                      onChange={(e) => handleSectorChange(e.target.value)}
                    >
                      <option value="">Seleccionar sector</option>
                      {Object.entries(SECTORES).map(([key, label]) => (
                        <option key={key} value={key}>{label}</option>
                      ))}
                    </select>
                  </div>
                  {formData.sector && (
                    <div>
                      <label className="text-sm text-slate-500 dark:text-slate-400">Familia</label>
                      <select
                        className={`border rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-${primaryColor}-400 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-100`}
                        value={formData.familia || ''}
                        onChange={(e) => updateField('familia', e.target.value)}
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
                  <label className="text-sm text-slate-500 dark:text-slate-400">
                    Operador ({operadoresDisponibles.length} disponibles)
                  </label>
                  <select
                    className={`border rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-${primaryColor}-400 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-100`}
                    value={formData.operador_id || ''}
                    onChange={(e) => handleOperadorChange(e.target.value)}
                  >
                    <option value="">Seleccionar operador</option>
                    {operadoresDisponibles.map((op) => (
                      <option key={op.id} value={op.id}>
                        {op.nombreDisplay}
                        {op.codigo && op.codigo !== op.nombreDisplay && ` (${op.codigo})`}
                      </option>
                    ))}
                  </select>
                  {operadoresDisponibles.length === 0 && (
                    <p className="text-xs text-orange-600 mt-1">
                      ⚠️ No hay operadores disponibles en el sistema
                    </p>
                  )}
                  {operadorSeleccionado && (
                    <p className="text-xs text-blue-600 mt-1">
                      Operador: {operadorSeleccionado.nombreDisplay}
                    </p>
                  )}
                </div>
                <div>
                  <label className="text-sm text-slate-500 dark:text-slate-400">
                    Producto ({productosFiltrados.length} disponibles)
                  </label>
                  <select
                    className={`border rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-${primaryColor}-400 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-100`}
                    value={formData.producto_id || ''}
                    onChange={(e) => handleProductChange(e.target.value)}
                    disabled={!formData.operador_id}
                  >
                    <option value="">
                      {formData.operador_id ? "Seleccionar producto" : "Primero selecciona un operador"}
                    </option>
                    {productosFiltrados.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.nombreDisplay}
                        {(!p.pvp || p.pvp === 0) && " (Sin PVP)"}
                        {p.pvp > 0 && ` (${p.pvp}€)`}
                      </option>
                    ))}
                  </select>
                  {productoSeleccionado && (
                    <p className="text-xs text-green-600 mt-1">
                      PVP: {productoSeleccionado.pvp ? `${productoSeleccionado.pvp}€` : 'No definido'}
                    </p>
                  )}
                  {productoSeleccionado && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Comisión vigente: {productoSeleccionado.comision_vigencia_desde || '—'} → {productoSeleccionado.comision_vigencia_hasta || '—'}
                    </p>
                  )}
                  {formData.comision_fuera_vigencia && (
                    <p className="text-xs text-amber-600 mt-1">⚠️ La fecha de la venta queda fuera de la vigencia definida en el producto.</p>
                  )}
                </div>

                { (formData.sector || productoSeleccionado?.sector || '').toUpperCase() === 'TELEFONIA' && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-sm text-slate-500 dark:text-slate-400">Tipo de cliente</label>
                      <select
                        className={`border rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-${primaryColor}-400 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-100`}
                        value={formData.cliente_tipo || 'NUEVO'}
                        onChange={(e) => updateField('cliente_tipo', e.target.value)}
                      >
                        <option value="NUEVO">Nuevo</option>
                        <option value="EXISTENTE">Existente</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-sm text-slate-500 dark:text-slate-400">Tipo activación</label>
                      <select
                        className={`border rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-${primaryColor}-400 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-100`}
                        value={formData.tipo_activacion || 'ALTA'}
                        onChange={(e) => updateField('tipo_activacion', e.target.value)}
                      >
                        <option value="ALTA">Alta nueva</option>
                        <option value="PORTABILIDAD">Portabilidad</option>
                      </select>
                    </div>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm text-slate-500 dark:text-slate-400">
                      Zona * ({zonasDisponibles.length} disponibles)
                    </label>
                    <select
                      className={`border rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 ${
                        errors.zona_id 
                          ? 'border-red-500 focus:ring-red-400' 
                          : `focus:ring-${primaryColor}-400`
                      } dark:bg-slate-700 dark:border-slate-600 dark:text-slate-100`}
                      value={formData.zona_id || ''}
                      onChange={(e) => updateField('zona_id', e.target.value)}
                      required
                    >
                      <option value="">Seleccionar zona</option>
                      {zonasDisponibles.map((z) => (
                        <option key={z.id} value={z.id}>
                          {z.nombreDisplay}
                        </option>
                      ))}
                    </select>
                    {errors.zona_id && (
                      <p className="text-xs text-red-600 mt-1">{errors.zona_id}</p>
                    )}
                    {zonaSeleccionada && (
                      <p className="text-xs text-blue-600 mt-1">
                        Zona: {zonaSeleccionada.nombreDisplay}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="text-sm text-slate-500 dark:text-slate-400">Estado</label>
                    <select
                      className={`border rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-${primaryColor}-400 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-100`}
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
                  <label className="text-sm text-slate-500 dark:text-slate-400">
                    Colaborador * ({colaboradoresDisponibles.length} disponibles)
                  </label>
                  <select
                    className={`border rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 ${
                      errors.colaborador_id 
                        ? 'border-red-500 focus:ring-red-400' 
                        : `focus:ring-${primaryColor}-400`
                    } dark:bg-slate-700 dark:border-slate-600 dark:text-slate-100`}
                    value={formData.colaborador_id || ''}
                    onChange={(e) => handleColaboradorChange(e.target.value)}
                    required
                  >
                    <option value="">Seleccionar colaborador</option>
                    {colaboradoresDisponibles.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nombreDisplay}
                        {c.nivel && ` - ${c.nivel}`}
                        {c.pct_colaborador_default && ` (${(c.pct_colaborador_default * 100).toFixed(1)}%)`}
                      </option>
                    ))}
                  </select>
                  {errors.colaborador_id && (
                    <p className="text-xs text-red-600 mt-1">{errors.colaborador_id}</p>
                  )}
                  {colaboradorSeleccionado && (
                    <p className="text-xs text-blue-600 mt-1 flex items-center gap-1">
                      <Percent className="w-3 h-3" />
                      Comisión: {((colaboradorSeleccionado.pct_colaborador_default || 0) * 100).toFixed(1)}%
                    </p>
                  )}
                </div>
              </div>
            </div>
            {/* Columna 3: Precios y Comisiones */}
            <div className="space-y-4">
              <h4 className="font-semibold text-slate-900 dark:text-slate-100 pb-2 border-b border-slate-200 dark:border-slate-600">
                💰 Precios y Comisiones
              </h4>
              <div className="space-y-3">
                <div>
                  <label className="text-sm text-slate-500 dark:text-slate-400">PVP del Producto</label>
                  <input
                    type="number"
                    step="0.01"
                    className="border rounded-lg px-3 py-2 w-full bg-slate-100 dark:bg-slate-700 focus:outline-none dark:border-slate-600 dark:text-slate-100"
                    value={formStats.pvp || 0}
                    readOnly
                  />
                  {formStats.pvp === 0 && (
                    <p className="text-xs text-amber-600 mt-1">
                      ⚠️ Este producto no tiene PVP definido
                    </p>
                  )}
                </div>
                <div>
                  <label className="text-sm text-slate-500 dark:text-slate-400">Comisión Base</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      step="0.01"
                      className={`border rounded-lg px-3 py-2 flex-1 focus:outline-none focus:ring-2 focus:ring-${primaryColor}-400 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-100`}
                      value={formData.comision_base || 0}
                      onChange={(e) => updateField('comision_base', parseFloat(e.target.value) || 0)}
                    />
                    <select
                      className={`border rounded-lg px-3 py-2 w-20 focus:outline-none focus:ring-2 focus:ring-${primaryColor}-400 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-100`}
                      value={formData.comision_tipo || 'porcentaje'}
                      onChange={(e) => updateField('comision_tipo', e.target.value)}
                    >
                      <option value="porcentaje">%</option>
                      <option value="fijo">€</option>
                    </select>
                  </div>
                  {formData.comision_base > 0 && (
                    <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                      <Euro className="w-3 h-3" />
                      {formData.comision_tipo === 'porcentaje' 
                        ? `${(formData.comision_base || 0).toFixed(1)}% del PVP`
                        : `${(formData.comision_base || 0).toFixed(2)}€ fijos`
                      }
                    </p>
                  )}
                  {formStats.comisionEstimada > 0 && (
                    <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1">
                      <Euro className="w-3 h-3" />
                      {/* Eliminado Parte colaborador */}
                    </p>
                  )}
                </div>
                <div>
                  <label className="text-sm text-slate-500 dark:text-slate-400">
                    Comisión Colaborador
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="1"
                      className={`border rounded-lg px-3 py-2 flex-1 focus:outline-none focus:ring-2 focus:ring-${primaryColor}-400 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-100`}
                      value={formData.comision_colaborador || 0}
                      onChange={(e) => updateField('comision_colaborador', parseFloat(e.target.value) || 0)}
                    />
                    <span className="flex items-center px-3 py-2 bg-slate-100 dark:bg-slate-700 rounded-lg text-slate-600 dark:text-slate-300">%</span>
                  </div>
                  {formStats.comisionEstimada > 0 && (
                    <div className="mt-2 p-2 bg-green-50 dark:bg-green-900/30 rounded-lg">
                      <p className="text-sm text-green-700 dark:text-green-400 flex items-center gap-2">
                        <span className="font-medium">Comisión estimada del colaborador:</span>
                        <span className="font-bold text-lg">{formStats.comisionEstimada.toFixed(2)}€</span>
                      </p>
                      {formData.comision_tipo === 'porcentaje' && (
                        <p className="text-xs text-green-600 dark:text-green-500 mt-1">
                          {(formData.comision_base || 0).toFixed(1)}% de {formStats.pvp.toFixed(2)}€ × {((formData.comision_colaborador || 0) * 100).toFixed(1)}% colaborador
                        </p>
                      )}
                      {formData.comision_tipo === 'fijo' && (
                        <p className="text-xs text-green-600 dark:text-green-500 mt-1">
                          {(formData.comision_base || 0).toFixed(2)}€ fijos × {((formData.comision_colaborador || 0) * 100).toFixed(1)}% colaborador
                        </p>
                      )}
                    </div>
                  )}
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Valor entre 0 y 1 (ej: 0.08 = 8%)
                  </p>
                </div>
                <div>
                  <label className="text-sm text-slate-500 dark:text-slate-400">Cantidad</label>
                  <input
                    type="number"
                    min="1"
                    className={`border rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-${primaryColor}-400 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-100`}
                    value={formData.cantidad || 1}
                    onChange={(e) => updateField('cantidad', parseInt(e.target.value) || 1)}
                  />
                </div>
                <div>
                  <label className="text-sm text-slate-500 dark:text-slate-400">Documento</label>
                  <input
                    className={`border rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-${primaryColor}-400 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-100`}
                    value={formData.documento || ''}
                    onChange={(e) => updateField('documento', e.target.value)}
                    maxLength="100"
                  />
                </div>
                <div>
                  <label className="text-sm text-slate-500 dark:text-slate-400">Numeración</label>
                  <input
                    className={`border rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-${primaryColor}-400 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-100`}
                    value={formData.numeracion || ''}
                    onChange={(e) => updateField('numeracion', e.target.value)}
                    maxLength="50"
                  />
                </div>
                <div>
                  <label className="text-sm text-slate-500 dark:text-slate-400">Observaciones</label>
                  <textarea
                    className={`border rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-${primaryColor}-400 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-100`}
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
            <div className="border-t border-slate-200 dark:border-slate-600 pt-6">
              <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-4">
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
                          } dark:bg-slate-700 dark:border-slate-600 dark:text-slate-100`}
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
                          } dark:bg-slate-700 dark:border-slate-600 dark:text-slate-100`}
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
                          } dark:bg-slate-700 dark:border-slate-600 dark:text-slate-100`}
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
                          } dark:bg-slate-700 dark:border-slate-600 dark:text-slate-100`}
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
          <div className="flex justify-end gap-3 pt-6 border-t border-slate-200 dark:border-slate-600">
            <button
              type="button"
              onClick={handleClose}
              className="px-8 py-3 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
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
                  : 'bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700'
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