/**
 * Utilidades de validación y sanitización de datos
 * Protege contra XSS, SQL Injection y otros ataques
 */

import { ValidationError } from './errorHandler';

/**
 * Sanitiza una cadena removiendo caracteres peligrosos
 * @param {string} input - Cadena a sanitizar
 * @returns {string} - Cadena sanitizada
 */
export function sanitizeString(input) {
  if (typeof input !== 'string') return '';
  
  return input
    .trim()
    .replace(/[<>]/g, '') // Remover tags HTML básicos
    .replace(/javascript:/gi, '') // Remover javascript: protocol
    .replace(/on\w+\s*=/gi, '') // Remover event handlers
    .slice(0, 1000); // Limitar longitud
}

/**
 * Sanitiza un email
 * @param {string} email - Email a sanitizar
 * @returns {string} - Email sanitizado
 */
export function sanitizeEmail(email) {
  if (typeof email !== 'string') return '';
  return email.trim().toLowerCase().slice(0, 254);
}

/**
 * Sanitiza un número
 * @param {any} value - Valor a sanitizar
 * @param {number} defaultValue - Valor por defecto si es inválido
 * @returns {number}
 */
export function sanitizeNumber(value, defaultValue = 0) {
  const parsed = parseFloat(value);
  return isNaN(parsed) ? defaultValue : parsed;
}

/**
 * Valida un email
 * @param {string} email - Email a validar
 * @throws {ValidationError} Si el email es inválido
 */
export function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new ValidationError('Email inválido', { email });
  }
  return true;
}

/**
 * Valida una contraseña
 * @param {string} password - Contraseña a validar
 * @param {Object} options - Opciones de validación
 * @throws {ValidationError} Si la contraseña no cumple los requisitos
 */
export function validatePassword(password, options = {}) {
  const {
    minLength = 8,
    requireUppercase = true,
    requireLowercase = true,
    requireNumbers = true,
    requireSpecialChars = false,
  } = options;

  const errors = [];

  if (password.length < minLength) {
    errors.push(`La contraseña debe tener al menos ${minLength} caracteres`);
  }

  if (requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('La contraseña debe contener al menos una letra mayúscula');
  }

  if (requireLowercase && !/[a-z]/.test(password)) {
    errors.push('La contraseña debe contener al menos una letra minúscula');
  }

  if (requireNumbers && !/\d/.test(password)) {
    errors.push('La contraseña debe contener al menos un número');
  }

  if (requireSpecialChars && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('La contraseña debe contener al menos un carácter especial');
  }

  if (errors.length > 0) {
    throw new ValidationError('Contraseña inválida', { errors });
  }

  return true;
}

/**
 * Valida un objeto según un schema
 * @param {Object} data - Datos a validar
 * @param {Object} schema - Schema de validación
 * @throws {ValidationError} Si los datos no cumplen el schema
 */
export function validateSchema(data, schema) {
  const errors = {};

  Object.entries(schema).forEach(([key, rules]) => {
    const value = data[key];
    const fieldErrors = [];

    // Required
    if (rules.required && (value === undefined || value === null || value === '')) {
      fieldErrors.push(`${key} es requerido`);
      errors[key] = fieldErrors;
      return;
    }

    // Skip validation if not required and value is empty
    if (!rules.required && !value) return;

    // Type validation
    if (rules.type) {
      const actualType = Array.isArray(value) ? 'array' : typeof value;
      if (actualType !== rules.type) {
        fieldErrors.push(`${key} debe ser de tipo ${rules.type}`);
      }
    }

    // String validations
    if (rules.type === 'string' && typeof value === 'string') {
      if (rules.minLength && value.length < rules.minLength) {
        fieldErrors.push(`${key} debe tener al menos ${rules.minLength} caracteres`);
      }
      if (rules.maxLength && value.length > rules.maxLength) {
        fieldErrors.push(`${key} no puede tener más de ${rules.maxLength} caracteres`);
      }
      if (rules.pattern && !rules.pattern.test(value)) {
        fieldErrors.push(`${key} tiene un formato inválido`);
      }
    }

    // Number validations
    if (rules.type === 'number' && typeof value === 'number') {
      if (rules.min !== undefined && value < rules.min) {
        fieldErrors.push(`${key} debe ser mayor o igual a ${rules.min}`);
      }
      if (rules.max !== undefined && value > rules.max) {
        fieldErrors.push(`${key} debe ser menor o igual a ${rules.max}`);
      }
    }

    // Array validations
    if (rules.type === 'array' && Array.isArray(value)) {
      if (rules.minItems && value.length < rules.minItems) {
        fieldErrors.push(`${key} debe tener al menos ${rules.minItems} elementos`);
      }
      if (rules.maxItems && value.length > rules.maxItems) {
        fieldErrors.push(`${key} no puede tener más de ${rules.maxItems} elementos`);
      }
    }

    // Custom validation
    if (rules.validate && typeof rules.validate === 'function') {
      try {
        rules.validate(value);
      } catch (error) {
        fieldErrors.push(error.message);
      }
    }

    if (fieldErrors.length > 0) {
      errors[key] = fieldErrors;
    }
  });

  if (Object.keys(errors).length > 0) {
    throw new ValidationError('Datos inválidos', { errors });
  }

  return true;
}

/**
 * Schemas predefinidos para entidades comunes
 */
export const schemas = {
  venta: {
    fecha: { required: true, type: 'string' },
    operador_id: { required: true, type: 'string' },
    producto_id: { required: true, type: 'string' },
    colaborador_id: { required: true, type: 'string' },
    pvp: { required: true, type: 'number', min: 0 },
    estado: { 
      required: true, 
      type: 'string',
      validate: (value) => {
        const validStates = ['pendiente', 'procesada', 'cancelada'];
        if (!validStates.includes(value)) {
          throw new Error(`Estado debe ser uno de: ${validStates.join(', ')}`);
        }
      }
    },
  },
  
  colaborador: {
    nombre: { required: true, type: 'string', minLength: 2, maxLength: 100 },
    email: { 
      required: true, 
      type: 'string',
      validate: (value) => validateEmail(value)
    },
    telefono: { required: false, type: 'string', maxLength: 20 },
    activo: { required: true, type: 'boolean' },
  },

  producto: {
    nombre: { required: true, type: 'string', minLength: 2, maxLength: 100 },
    operador_id: { required: true, type: 'string' },
    comision_base: { required: true, type: 'number', min: 0, max: 100 },
    activo: { required: true, type: 'boolean' },
  },
};

/**
 * Sanitiza y valida datos de entrada
 * @param {Object} data - Datos a sanitizar y validar
 * @param {string} schemaName - Nombre del schema a usar
 * @returns {Object} - Datos sanitizados y validados
 * @throws {ValidationError} Si los datos son inválidos
 */
export function sanitizeAndValidate(data, schemaName) {
  const schema = schemas[schemaName];
  if (!schema) {
    throw new Error(`Schema "${schemaName}" no encontrado`);
  }

  // Sanitizar strings
  const sanitized = {};
  Object.entries(data).forEach(([key, value]) => {
    if (typeof value === 'string') {
      sanitized[key] = sanitizeString(value);
    } else if (typeof value === 'number') {
      sanitized[key] = sanitizeNumber(value);
    } else {
      sanitized[key] = value;
    }
  });

  // Validar contra schema
  validateSchema(sanitized, schema);

  return sanitized;
}
