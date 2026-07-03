import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Plus, Edit3, Save, Euro, Percent, AlertCircle, CheckCircle, Smartphone, Phone, ShoppingBag, User, Calendar, CreditCard, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../../lib/utils';
import Modal from '../../ui/Modal';
import { Input, Select, Label, Button, TextArea } from '../../ui/FormElements';
import { SECTORES, FAMILIAS_POR_SECTOR } from '../../../utils/constants';
import { getColaboradorNivelId } from '../../../utils/calculos';

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
export const VentaFormModal = ({
  isOpen,
  onClose,
  onSave,
  venta,
  colaboradores = [],
  zonas = [],
  operadores = [],
  productos = [],
  niveles = [],
  initialCustomFields = [], // Prop opcional
  createInitialDraft,
  resolveColaboradorName,
  resolveZonaName,
  resolveOperadorName,
  resolveProductoName
}) => {
  // Cargar campos personalizados dinámicamente
  const [customFieldsConfig, setCustomFieldsConfig] = useState(initialCustomFields);

  useEffect(() => {
    // Función para cargar
    const loadFields = () => {
      try {
        const saved = localStorage.getItem("customFields");
        if (saved) {
          const fields = JSON.parse(saved).filter(f => f.activo && f.modulo === 'ventas');
          setCustomFieldsConfig(fields);
        }
      } catch (e) {
        console.error("Error cargando campos personalizados en modal", e);
      }
    };

    loadFields(); // Carga inicial

    // Escuchar cambios desde Config
    window.addEventListener('customFieldsUpdated', loadFields);
    return () => window.removeEventListener('customFieldsUpdated', loadFields);
  }, []);
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
        const nivelInfo = nivelesData.find(n => n.id === getColaboradorNivelId(c));
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

  // Colaboradores disponibles para el formulario

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
    if (formData.fecha_baja && formData.fecha && formData.fecha_baja < formData.fecha) {
      errors.fecha_baja = 'La fecha de baja no puede ser anterior a la fecha de venta';
    }
    if (formData.periodo_compromiso !== undefined && formData.periodo_compromiso !== '' && Number(formData.periodo_compromiso) <= 0) {
      errors.periodo_compromiso = 'La permanencia debe ser un número de meses mayor que 0';
    }
    customFieldsConfig?.forEach(field => {
      const key = `cf_${field.id}`;
      if (field.requerido && !formData[key]) {
        errors[key] = `El campo ${field.nombre} es obligatorio`;
      }
    });
    return errors;
  }, [formData, customFieldsConfig]);

  // Estadísticas del formulario
  const formStats = useMemo(() => {
    const pvpValue = Number(formData.pvp) || 0;
    const comisionBase = Number(formData.comision_base) || 0;
    const tipoComision = formData.comision_tipo || 'porcentaje';

    // La comisión estimada es lo que cobra el comercial directamente:
    // - porcentaje: PVP × base% (ej: 50€ × 80% = 40€)
    // - fijo: el importe fijo indicado
    // - mixto: fijo + porcentaje sobre PVP
    let comisionEstimada = 0;
    if (tipoComision === 'porcentaje') {
      comisionEstimada = pvpValue * (comisionBase / 100);
    } else if (tipoComision === 'fijo') {
      comisionEstimada = comisionBase;
    } else if (tipoComision === 'mixto') {
      const fija = Number(formData.comision_fija) || 0;
      const pct = Number(formData.comision_porcentaje) || 0;
      comisionEstimada = fija + (pvpValue * pct / 100);
    }

    return {
      pvp: pvpValue,
      comisionEstimada,
      hasErrors: Object.keys(validationErrors).length > 0,
      isComplete: !!(formData.cliente && formData.fecha && formData.colaborador_id && formData.zona_id),
      hasMissingData: colaboradoresDisponibles.length === 0 || zonasDisponibles.length === 0,
    };
  }, [formData, colaboradoresDisponibles.length, zonasDisponibles.length, validationErrors]);

  // Producto, colaborador, operador y zona seleccionados
  const productoSeleccionado = useMemo(() =>
    productosDisponibles.find(p => p.id === formData.producto_id),
    [productosDisponibles, formData.producto_id]
  );
  const _colaboradorSeleccionado = useMemo(() =>
    colaboradoresDisponibles.find(c => c.id === formData.colaborador_id),
    [colaboradoresDisponibles, formData.colaborador_id]
  );
  const _operadorSeleccionado = useMemo(() =>
    operadoresDisponibles.find(o => o.id === formData.operador_id),
    [operadoresDisponibles, formData.operador_id]
  );
  const _zonaSeleccionada = useMemo(() =>
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
  const _familiasDisponibles = useMemo(() => {
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
      dataToSave.periodo_compromiso = dataToSave.periodo_compromiso === '' || dataToSave.periodo_compromiso == null
        ? null
        : Number(dataToSave.periodo_compromiso);
      dataToSave.fecha_baja = dataToSave.fecha_baja || null;
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

  const modalTitle = isEditing ? 'Editar Expediente' : 'Registrar Nueva Venta';
  const ModalIcon = isEditing ? Edit3 : Plus;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={modalTitle}
      icon={ModalIcon}
      iconColor={isEditing ? 'text-amber-500' : 'text-emerald-500'}
      maxWidth="max-w-7xl"
    >
      <div className="space-y-10">
        {/* Info Bar / Stats */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-wrap items-center gap-6 p-6 rounded-[2rem] bg-slate-100/30 dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 backdrop-blur-sm shadow-inner"
        >
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center shadow-lg",
              formStats.isComplete ? "bg-emerald-500 text-white shadow-emerald-500/20" : "bg-amber-500 text-white shadow-amber-500/20"
            )}>
              <CheckCircle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[2px] opacity-50">Estado Carga</p>
              <p className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-widest">
                {formStats.isComplete ? 'Validación OK' : 'Datos Incompletos'}
              </p>
            </div>
          </div>

          <div className="h-10 w-px bg-slate-200 dark:bg-white/5 mx-2 hidden md:block" />

          <div className="flex items-center gap-3">
            <div className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center shadow-lg",
              formStats.hasErrors ? "bg-rose-500 text-white shadow-rose-500/20" : "bg-slate-500 text-white shadow-slate-500/20"
            )}>
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[2px] opacity-50">Check Seguridad</p>
              <p className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-widest">
                {formStats.hasErrors ? `${Object.keys(validationErrors).length} Errores` : 'Integridad OK'}
              </p>
            </div>
          </div>

          {formStats.comisionEstimada > 0 && (
            <div className="ml-auto flex items-center gap-4 px-6 py-3 rounded-2xl bg-[var(--brand-primary)] text-white shadow-xl shadow-[var(--brand-primary)]/20">
              <div className="p-2 bg-white/20 rounded-lg">
                <Euro className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[2px] opacity-70">Estimación Neta</p>
                <p className="text-lg font-black tracking-tighter">{formStats.comisionEstimada.toFixed(2)}€</p>
              </div>
            </div>
          )}
        </motion.div>

        {/* Global Warnings */}
        <AnimatePresence>
          {(formStats.hasMissingData || errors.submit) && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="p-6 rounded-[2rem] bg-amber-500/5 border border-amber-500/10 flex items-start gap-5 shadow-xl shadow-amber-500/5"
            >
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center shrink-0">
                <AlertCircle className="w-6 h-6 text-amber-600" />
              </div>
              <div className="space-y-2">
                <p className="text-sm font-black text-amber-800 dark:text-amber-500 uppercase tracking-widest">Atención Requerida</p>
                <div className="text-sm text-slate-600 dark:text-amber-200/60 font-medium">
                  {errors.submit ? (
                    <p>{errors.submit}</p>
                  ) : (
                    <ul className="list-disc pl-4 space-y-1">
                      {colaboradoresDisponibles.length === 0 && <li>No hay colaboradores válidos en el sistema. Los despliegues están bloqueados.</li>}
                      {zonasDisponibles.length === 0 && <li>Configuración de zonas incompleta. Verifica la base maestra.</li>}
                    </ul>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleSubmit} className="space-y-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Columna 1: Titular */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="space-y-8"
            >
              <div className="flex items-center gap-4 pb-4 border-b border-slate-200 dark:border-white/5">
                <div className="w-10 h-10 rounded-xl bg-[var(--brand-primary)]/10 flex items-center justify-center">
                  <User className="w-5 h-5 text-[var(--brand-primary)]" />
                </div>
                <h4 className="text-[10px] font-black uppercase tracking-[4px] text-slate-800 dark:text-white">Titular Operación</h4>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <Label>Nombre Completo / Razón Social *</Label>
                  <Input
                    icon={User}
                    placeholder="Introduce el nombre del cliente"
                    value={formData.cliente || ''}
                    onChange={(e) => updateField('cliente', e.target.value)}
                    className={cn(errors.cliente && "border-rose-500 bg-rose-500/5 ring-rose-500/20 shadow-none")}
                  />
                  {errors.cliente && <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest mt-2 ml-2">{errors.cliente}</p>}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Documento Identidad</Label>
                    <Input
                      icon={CreditCard}
                      placeholder="DNI, CIF, NIE"
                      value={formData.cif || ''}
                      onChange={(e) => updateField('cif', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Fecha Solicitud *</Label>
                    <Input
                      type="date"
                      icon={Calendar}
                      value={formData.fecha || ''}
                      onChange={(e) => updateField('fecha', e.target.value)}
                      className={cn(errors.fecha && "border-rose-500 bg-rose-500/5 shadow-none")}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>ID Pedido Externo</Label>
                    <Input
                      placeholder="Nº Referencia CRM"
                      value={formData.id_pedido || ''}
                      onChange={(e) => updateField('id_pedido', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Código Cliente</Label>
                    <Input
                      placeholder="Ref. Operadora"
                      value={formData.id_cliente || ''}
                      onChange={(e) => updateField('id_cliente', e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Teléfono Contacto</Label>
                    <Input
                      icon={Phone}
                      placeholder="Fijo o Secundario"
                      value={formData.telefono_fijo || ''}
                      onChange={(e) => updateField('telefono_fijo', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Terminal Móvil</Label>
                    <Input
                      icon={Smartphone}
                      placeholder="Número de contacto"
                      value={formData.telefono_movil || ''}
                      onChange={(e) => updateField('telefono_movil', e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/5">
                  <div className="space-y-2">
                    <Label>Permanencia Pactada (meses)</Label>
                    <Input
                      type="number"
                      min="1"
                      placeholder="Ej: 12"
                      value={formData.periodo_compromiso ?? ''}
                      onChange={(e) => updateField('periodo_compromiso', e.target.value === '' ? '' : parseInt(e.target.value, 10) || '')}
                      className={cn(errors.periodo_compromiso && "border-rose-500 bg-rose-500/5 shadow-none")}
                    />
                    {errors.periodo_compromiso && <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest mt-2 ml-2">{errors.periodo_compromiso}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label>Fecha de Baja (si canceló)</Label>
                    <Input
                      type="date"
                      icon={Calendar}
                      value={formData.fecha_baja || ''}
                      onChange={(e) => updateField('fecha_baja', e.target.value)}
                      className={cn(errors.fecha_baja && "border-rose-500 bg-rose-500/5 shadow-none")}
                    />
                    {errors.fecha_baja && <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest mt-2 ml-2">{errors.fecha_baja}</p>}
                  </div>
                  <p className="col-span-2 text-[10px] text-slate-400 dark:text-slate-500 -mt-2">
                    Rellena la fecha de baja solo cuando el cliente cancele antes de cumplir la permanencia — activa el descuento de decomisión en la liquidación del colaborador.
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Columna 2: Servicio */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="space-y-8"
            >
              <div className="flex items-center gap-4 pb-4 border-b border-slate-200 dark:border-white/5">
                <div className="w-10 h-10 rounded-xl bg-[var(--brand-primary)]/10 flex items-center justify-center">
                  <ShoppingBag className="w-5 h-5 text-[var(--brand-primary)]" />
                </div>
                <h4 className="text-[10px] font-black uppercase tracking-[4px] text-slate-800 dark:text-white">Parámetros Servicio</h4>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Unidad de Negocio</Label>
                    <Select
                      value={formData.sector || ''}
                      onChange={(e) => handleSectorChange(e.target.value)}
                    >
                      <option value="">Selección Global</option>
                      {Object.entries(SECTORES).map(([key, label]) => (
                        <option key={key} value={key}>{label}</option>
                      ))}
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Zona Geográfica *</Label>
                    <Select
                      value={formData.zona_id || ''}
                      onChange={(e) => updateField('zona_id', e.target.value)}
                      className={cn(errors.zona_id && "border-rose-500 bg-rose-500/5 shadow-none")}
                    >
                      <option value="">Selecciona Provincia</option>
                      {zonasDisponibles.map((z) => (
                        <option key={z.id} value={z.id}>{z.nombreDisplay}</option>
                      ))}
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Partner / Operador</Label>
                  <Select
                    value={formData.operador_id || ''}
                    onChange={(e) => handleOperadorChange(e.target.value)}
                  >
                    <option value="">Seleccionar Master Partner</option>
                    {operadoresDisponibles.map((op) => (
                      <option key={op.id} value={op.id}>
                        {op.nombreDisplay}
                        {op.codigo && op.codigo !== op.nombreDisplay && ` [${op.codigo}]`}
                      </option>
                    ))}
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Solución Técnica ({productosFiltrados.length} disponibles)</Label>
                  <Select
                    value={formData.producto_id || ''}
                    onChange={(e) => handleProductChange(e.target.value)}
                    disabled={!formData.operador_id}
                    className={cn(!formData.operador_id && "opacity-50 cursor-not-allowed")}
                  >
                    <option value="">{formData.operador_id ? "Busca el producto..." : "Bloqueado: Elige Partner"}</option>
                    {productosFiltrados.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.nombreDisplay}
                        {p.pvp > 0 ? ` [${p.pvp}€]` : " [Sin PVP]"}
                      </option>
                    ))}
                  </Select>
                  {productoSeleccionado && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 shadow-sm space-y-2 mt-3"
                    >
                      <div className="flex justify-between items-center">
                        <span className="text-[9px] font-black uppercase tracking-[2px] text-slate-400">PVP Base</span>
                        <span className="text-xs font-black text-emerald-600">{productoSeleccionado.pvp ? `${productoSeleccionado.pvp}€` : 'PVP Variable'}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[9px] font-black uppercase tracking-[2px] text-slate-400">Vigencia</span>
                        <span className="text-[10px] font-bold text-slate-500">{productoSeleccionado.comision_vigencia_desde || 'Master'} → {productoSeleccionado.comision_vigencia_hasta || 'Infinito'}</span>
                      </div>
                      {formData.comision_fuera_vigencia && (
                        <div className="flex items-center gap-2 text-rose-500 mt-2 p-2 bg-rose-500/5 rounded-xl border border-rose-500/10">
                          <AlertCircle className="w-3.5 h-3.5" />
                          <span className="text-[9px] font-black uppercase tracking-[1px]">ALERTA: Tarifa Caducada</span>
                        </div>
                      )}
                    </motion.div>
                  )}
                </div>

                {(formData.sector || productoSeleccionado?.sector || '').toUpperCase() === 'TELEFONIA' && (
                  <div className="grid grid-cols-2 gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/5">
                    <div className="space-y-2">
                      <Label>Captación</Label>
                      <Select
                        value={formData.cliente_tipo || 'NUEVO'}
                        onChange={(e) => updateField('cliente_tipo', e.target.value)}
                        className="bg-transparent shadow-none"
                      >
                        <option value="NUEVO">Cliente Nuevo</option>
                        <option value="EXISTENTE">Fidelización</option>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Tráfico</Label>
                      <Select
                        value={formData.tipo_activacion || 'ALTA'}
                        onChange={(e) => updateField('tipo_activacion', e.target.value)}
                        className="bg-transparent shadow-none"
                      >
                        <option value="ALTA">Alta Nueva</option>
                        <option value="PORTABILIDAD">Portabilidad</option>
                      </Select>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Estado Gestión</Label>
                    <Select
                      value={formData.estado || 'Confirmada'}
                      onChange={(e) => updateField('estado', e.target.value)}
                      className="font-black text-blue-600 dark:text-blue-400"
                    >
                      {ESTADOS_VALIDOS.map((est) => (
                        <option key={est} value={est}>{est}</option>
                      ))}
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Agente Asignado *</Label>
                    <Select
                      value={formData.colaborador_id || ''}
                      onChange={(e) => handleColaboradorChange(e.target.value)}
                      className={cn(errors.colaborador_id && "border-rose-500 bg-rose-500/5 shadow-none")}
                    >
                      <option value="">Selecciona el agente</option>
                      {colaboradoresDisponibles.map((c) => (
                        <option key={c.id} value={c.id}>{c.nombreDisplay}</option>
                      ))}
                    </Select>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Columna 3: Liquidación */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="space-y-8"
            >
              <div className="flex items-center gap-4 pb-4 border-b border-slate-200 dark:border-white/5">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                  <Euro className="w-5 h-5 text-emerald-500" />
                </div>
                <h4 className="text-[10px] font-black uppercase tracking-[4px] text-slate-800 dark:text-white">Motor Económico</h4>
              </div>

              <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-hidden">
                {/* Fila PVP */}
                <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400">PVP declarado</span>
                  <span className="text-sm font-semibold text-slate-800 dark:text-white">{(formStats.pvp || 0).toFixed(2)} €</span>
                </div>

                {/* Base comisión */}
                <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 space-y-2">
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Tasa de comisión</span>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.comision_base || 0}
                      onChange={(e) => updateField('comision_base', parseFloat(e.target.value) || 0)}
                    />
                    <Select
                      value={formData.comision_tipo || 'porcentaje'}
                      onChange={(e) => updateField('comision_tipo', e.target.value)}
                      className="w-28"
                    >
                      <option value="porcentaje">% PVP</option>
                      <option value="fijo">€ Fijo</option>
                    </Select>
                  </div>
                  {formData.comision_tipo === 'porcentaje' && formStats.pvp > 0 && (
                    <p className="text-xs text-slate-400 dark:text-slate-500">
                      = {((formStats.pvp * (Number(formData.comision_base) || 0)) / 100).toFixed(2)} € sobre PVP
                    </p>
                  )}
                </div>

                {/* Factor agente — informativo, no afecta la estimación */}
                <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 space-y-2">
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Factor distribución agente</span>
                  <div className="flex gap-2 items-center">
                    <Input
                      type="number"
                      step="0.001"
                      max="1"
                      value={formData.comision_colaborador || 0}
                      onChange={(e) => updateField('comision_colaborador', parseFloat(e.target.value) || 0)}
                    />
                    <span className="text-sm font-semibold text-slate-600 dark:text-slate-300 w-12 text-right">
                      {((formData.comision_colaborador || 0) * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>

                {/* Estimación neta */}
                <div className="flex items-center justify-between px-5 py-4 bg-slate-50 dark:bg-slate-800/50">
                  <div>
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-0.5">Estimación comisión</p>
                    <p className="text-2xl font-bold text-slate-900 dark:text-white">
                      {formStats.comisionEstimada.toFixed(2)} €
                    </p>
                  </div>
                  <div className="p-2.5 bg-white dark:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-600">
                    <Euro className="w-5 h-5 text-slate-500 dark:text-slate-400" />
                  </div>
                </div>
              </div>

              <div className="space-y-6 pt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Contrato nº / Doc</Label>
                    <Input
                      placeholder="Referencia papel"
                      value={formData.documento || ''}
                      onChange={(e) => updateField('documento', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Numeración / ID</Label>
                    <Input
                      placeholder="Línea o Recurso"
                      value={formData.numeracion || ''}
                      onChange={(e) => updateField('numeracion', e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Notas de Seguimiento</Label>
                  <TextArea
                    placeholder="Anotaciones para administración o reporting..."
                    rows="4"
                    value={formData.observaciones || ''}
                    onChange={(e) => updateField('observaciones', e.target.value)}
                    className="custom-scrollbar"
                  />
                </div>
              </div>
            </motion.div>
          </div>

          {/* Custom Fields Section */}
          <AnimatePresence>
            {customFieldsConfig?.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-10 rounded-[3rem] bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 space-y-8"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-purple-500" />
                  </div>
                  <h4 className="text-[10px] font-black uppercase tracking-[4px] text-slate-800 dark:text-white">Campos Dinámicos Master</h4>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                  {customFieldsConfig.map((field) => {
                    const fieldKey = `cf_${field.id}`;
                    const hasError = !!errors[fieldKey];
                    return (
                      <div key={field.id} className="space-y-2">
                        <Label className="flex items-center gap-2">
                          {field.nombre}
                          {field.requerido && <span className="text-rose-500 font-black">*</span>}
                        </Label>

                        {field.tipo === 'texto' && (
                          <Input
                            id={`customfield-${field.id}`}
                            value={formData[fieldKey] || ''}
                            onChange={e => updateField(fieldKey, e.target.value)}
                            className={cn(hasError && "border-rose-500 bg-rose-500/5 shadow-none")}
                          />
                        )}
                        {field.tipo === 'número' && (
                          <Input
                            id={`customfield-${field.id}`}
                            type="number"
                            value={formData[fieldKey] || ''}
                            onChange={e => updateField(fieldKey, e.target.value)}
                            className={cn(hasError && "border-rose-500 bg-rose-500/5 shadow-none")}
                          />
                        )}
                        {field.tipo === 'fecha' && (
                          <Input
                            id={`customfield-${field.id}`}
                            type="date"
                            value={formData[fieldKey] || ''}
                            onChange={e => updateField(fieldKey, e.target.value)}
                            className={cn(hasError && "border-rose-500 bg-rose-500/5 shadow-none")}
                          />
                        )}
                        {field.tipo === 'select' && (
                          <Select
                            id={`customfield-${field.id}`}
                            value={formData[fieldKey] || ''}
                            onChange={e => updateField(fieldKey, e.target.value)}
                            className={cn(hasError && "border-rose-500 bg-rose-500/5 shadow-none")}
                          >
                            <option value="">Selección</option>
                            {field.opciones?.map(opt => (
                              <option key={opt} value={opt}>{opt}</option>
                            ))}
                          </Select>
                        )}
                        {hasError && <p className="text-[9px] font-black text-rose-500 uppercase tracking-widest mt-1 ml-1">{errors[fieldKey]}</p>}
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Form Actions */}
          <div className="flex justify-end gap-5 pt-10 border-t border-slate-200 dark:border-white/5">
            <Button
              type="button"
              variant="secondary"
              onClick={handleClose}
              disabled={isSubmitting}
              className="px-10 py-4 h-auto rounded-[1.5rem]"
            >
              Abandonar Terminal
            </Button>

            <Button
              type="submit"
              variant={isEditing ? "primary" : "success"}
              disabled={formStats.hasErrors || isSubmitting}
              className="px-12 py-4 h-auto rounded-[1.5rem] shadow-2xl relative overflow-hidden group min-w-[200px]"
            >
              <AnimatePresence mode="wait">
                {isSubmitting ? (
                  <motion.div
                    key="loader"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-3"
                  >
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>{isEditing ? 'Sincronizando...' : 'Procesando...'}</span>
                  </motion.div>
                ) : (
                  <motion.div
                    key="submit"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-3"
                  >
                    <Save className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                    <span>{isEditing ? 'Actualizar Registro' : 'Lanzar Operación'}</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
}

export default VentaFormModal;
