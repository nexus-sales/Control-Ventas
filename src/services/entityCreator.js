/**
 * Utilidades para crear y gestionar entidades del sistema
 * Funciones para crear objetos con IDs únicos y validaciones
 */

// Función para generar IDs únicos
export const generateId = (prefix = '') => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substr(2, 9);
  return prefix ? `${prefix}_${timestamp}_${random}` : `${timestamp}_${random}`;
};

// Función para validar email
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Función para crear entidad colaborador
export const createColaborador = (data) => {
  return {
    id: data.id || generateId('col'),
    nombre: data.nombre || '',
    email: data.email || '',
    telefono: data.telefono || '',
    nivel_id: data.nivel_id || null,
    zona_id: data.zona_id || null,
    activo: data.activo !== undefined ? data.activo : true,
    fecha_alta: data.fecha_alta || new Date().toISOString(),
    observaciones: data.observaciones || '',
    ...data
  };
};

// Función para crear entidad venta
export const createVenta = (data) => {
  return {
    id: data.id || generateId('venta'),
    fecha: data.fecha || new Date().toISOString(),
    colaborador_id: data.colaborador_id || null,
    operador_id: data.operador_id || null,
    producto_id: data.producto_id || null,
    zona_id: data.zona_id || null,
    importe: parseFloat(data.importe) || 0,
    comision_operador: parseFloat(data.comision_operador) || 0,
    estado: data.estado || 'activa',
    observaciones: data.observaciones || '',
    ...data
  };
};

// Función para crear entidad operador
export const createOperador = (data) => {
  return {
    id: data.id || generateId('op'),
    nombre: data.nombre || '',
    sector: data.sector || 'telefonia',
    activo: data.activo !== undefined ? data.activo : true,
    reglas_decomision: data.reglas_decomision || {
      antes_6_meses: 100,
      despues_6_meses: 50,
      limite_meses: 6
    },
    ...data
  };
};

// Función para crear entidad producto
export const createProducto = (data) => {
  return {
    id: data.id || generateId('prod'),
    nombre: data.nombre || '',
    operador_id: data.operador_id || null,
    precio: parseFloat(data.precio) || 0,
    comision_base: parseFloat(data.comision_base) || 0,
    activo: data.activo !== undefined ? data.activo : true,
    ...data
  };
};

// Función para crear entidad zona
export const createZona = (data) => {
  return {
    id: data.id || generateId('zona'),
    nombre: data.nombre || '',
    codigo_postal: data.codigo_postal || '',
    provincia: data.provincia || '',
    activo: data.activo !== undefined ? data.activo : true,
    ...data
  };
};

// Función para crear entidad nivel
export const createNivel = (data) => {
  return {
    id: data.id || generateId('nivel'),
    nombre: data.nombre || '',
    tipo: data.tipo || 'COMERCIAL',
    pct_telefonia: parseFloat(data.pct_telefonia) || 0,
    pct_energia: parseFloat(data.pct_energia) || 0,
    fijo_seguridad: parseFloat(data.fijo_seguridad) || 0,
    descripcion: data.descripcion || '',
    activo: data.activo !== undefined ? data.activo : true,
    ...data
  };
};

// Función para crear entidad regla
export const createRegla = (data) => {
  return {
    id: data.id || generateId('regla'),
    operador_id: data.operador_id || null,
    producto_id: data.producto_id || null,
    tipo: data.tipo || '%',
    valor: parseFloat(data.valor) || 0,
    pct_sobre: data.pct_sobre || 'Base',
    prioridad: parseInt(data.prioridad) || 1,
    activa: data.activa !== undefined ? data.activa : true,
    ...data
  };
};

// Función para validar entidades antes de guardar
export const validateEntity = (entity, type) => {
  const errors = [];
  
  switch (type) {
    case 'colaborador':
      if (!entity.nombre) errors.push('Nombre es requerido');
      if (entity.email && !isValidEmail(entity.email)) errors.push('Email no válido');
      break;
    case 'venta':
      if (!entity.colaborador_id) errors.push('Colaborador es requerido');
      if (!entity.operador_id) errors.push('Operador es requerido');
      if (!entity.importe || entity.importe <= 0) errors.push('Importe debe ser mayor a 0');
      break;
    case 'operador':
      if (!entity.nombre) errors.push('Nombre es requerido');
      if (!['telefonia', 'energia', 'seguridad'].includes(entity.sector)) {
        errors.push('Sector debe ser telefonia, energia o seguridad');
      }
      break;
    default:
      if (!entity.nombre) errors.push('Nombre es requerido');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Función para mapear datos de Excel a entidades
export const mapExcelToEntity = (excelRow, fieldMappings, entityType) => {
  const mappedData = {};
  
  for (const [entityField, excelField] of Object.entries(fieldMappings)) {
    if (excelField && excelRow[excelField] !== undefined) {
      mappedData[entityField] = excelRow[excelField];
    }
  }
  
  // Crear la entidad según el tipo
  switch (entityType) {
    case 'colaborador':
      return createColaborador(mappedData);
    case 'venta':
      return createVenta(mappedData);
    case 'operador':
      return createOperador(mappedData);
    case 'producto':
      return createProducto(mappedData);
    case 'zona':
      return createZona(mappedData);
    case 'nivel':
      return createNivel(mappedData);
    case 'regla':
      return createRegla(mappedData);
    default:
      return { id: generateId(), ...mappedData };
  }
};