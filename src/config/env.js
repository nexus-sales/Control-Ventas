/**
 * Validación y gestión de variables de entorno
 * Valida que todas las variables necesarias estén presentes y sean correctas
 */

const requiredEnvVars = {
  VITE_SUPABASE_URL: {
    required: false, // Opcional porque soportamos modo local
    validate: (value) => {
      if (value && !value.startsWith('https://')) {
        throw new Error('VITE_SUPABASE_URL debe ser una URL HTTPS válida');
      }
      return true;
    },
  },
  VITE_SUPABASE_ANON_KEY: {
    required: false,
    validate: (value) => {
      if (value && value.length < 20) {
        throw new Error('VITE_SUPABASE_ANON_KEY parece inválida');
      }
      return true;
    },
  },
};

/**
 * Valida todas las variables de entorno
 * @throws {Error} Si alguna variable requerida falta o es inválida
 */
export function validateEnv() {
  const errors = [];

  Object.entries(requiredEnvVars).forEach(([key, config]) => {
    const value = import.meta.env[key];

    if (config.required && !value) {
      errors.push(`Variable de entorno requerida faltante: ${key}`);
      return;
    }

    if (value && config.validate) {
      try {
        config.validate(value);
      } catch (error) {
        errors.push(`${key}: ${error.message}`);
      }
    }
  });

  if (errors.length > 0) {
    console.error('❌ Errores en variables de entorno:', errors);
    throw new Error(`Variables de entorno inválidas:\n${errors.join('\n')}`);
  }

  console.log('✅ Variables de entorno validadas correctamente');
}

/**
 * Obtiene el valor de una variable de entorno de forma segura
 * @param {string} key - Nombre de la variable
 * @param {string} defaultValue - Valor por defecto si no existe
 * @returns {string}
 */
export function getEnv(key, defaultValue = '') {
  return import.meta.env[key] || defaultValue;
}

/**
 * Verifica si Supabase está configurado
 * @returns {boolean}
 */
export function isSupabaseConfigured() {
  return !!(getEnv('VITE_SUPABASE_URL') && getEnv('VITE_SUPABASE_ANON_KEY'));
}

// Validar en carga inicial solo en desarrollo
if (import.meta.env.DEV) {
  try {
    validateEnv();
  } catch (error) {
    console.warn('⚠️ Advertencia:', error.message);
    console.info('ℹ️ La aplicación funcionará en modo local únicamente');
  }
}
