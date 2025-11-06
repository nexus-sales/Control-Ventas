/**
 * Sistema centralizado de manejo de errores
 * Captura, procesa y registra errores de forma consistente
 */

const IS_PRODUCTION = import.meta.env.PROD;

/**
 * Tipos de errores soportados
 */
export const ErrorTypes = {
  VALIDATION: 'VALIDATION_ERROR',
  NETWORK: 'NETWORK_ERROR',
  AUTH: 'AUTH_ERROR',
  PERMISSION: 'PERMISSION_ERROR',
  NOT_FOUND: 'NOT_FOUND_ERROR',
  SERVER: 'SERVER_ERROR',
  UNKNOWN: 'UNKNOWN_ERROR',
};

/**
 * Clase base para errores de aplicación
 */
export class AppError extends Error {
  constructor(message, type = ErrorTypes.UNKNOWN, statusCode = 500, details = {}) {
    super(message);
    this.name = 'AppError';
    this.type = type;
    this.statusCode = statusCode;
    this.details = details;
    this.timestamp = new Date().toISOString();
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      type: this.type,
      statusCode: this.statusCode,
      details: IS_PRODUCTION ? {} : this.details,
      timestamp: this.timestamp,
      stack: IS_PRODUCTION ? undefined : this.stack,
    };
  }
}

/**
 * Errores específicos
 */
export class ValidationError extends AppError {
  constructor(message, details = {}) {
    super(message, ErrorTypes.VALIDATION, 400, details);
    this.name = 'ValidationError';
  }
}

export class NetworkError extends AppError {
  constructor(message, details = {}) {
    super(message, ErrorTypes.NETWORK, 503, details);
    this.name = 'NetworkError';
  }
}

export class AuthError extends AppError {
  constructor(message, details = {}) {
    super(message, ErrorTypes.AUTH, 401, details);
    this.name = 'AuthError';
  }
}

export class PermissionError extends AppError {
  constructor(message, details = {}) {
    super(message, ErrorTypes.PERMISSION, 403, details);
    this.name = 'PermissionError';
  }
}

export class NotFoundError extends AppError {
  constructor(message, details = {}) {
    super(message, ErrorTypes.NOT_FOUND, 404, details);
    this.name = 'NotFoundError';
  }
}

/**
 * Logger estructurado
 */
class ErrorLogger {
  log(level, message, context = {}) {
    const logEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      ...context,
    };

    // En producción, enviar a servicio de logging (ej. Sentry, LogRocket)
    if (IS_PRODUCTION) {
      // TODO: Integrar con servicio de logging externo
      console[level](JSON.stringify(logEntry));
    } else {
      // En desarrollo, log legible en consola
      console[level](`[${level.toUpperCase()}] ${message}`, context);
    }
  }

  error(message, error, context = {}) {
    this.log('error', message, {
      error: error instanceof Error ? error.toJSON?.() || error.message : error,
      stack: !IS_PRODUCTION ? error?.stack : undefined,
      ...context,
    });
  }

  warn(message, context = {}) {
    this.log('warn', message, context);
  }

  info(message, context = {}) {
    this.log('info', message, context);
  }

  debug(message, context = {}) {
    if (!IS_PRODUCTION) {
      this.log('debug', message, context);
    }
  }
}

export const logger = new ErrorLogger();

/**
 * Handler global de errores
 */
export function globalErrorHandler(error, errorInfo = {}) {
  // Normalizar el error
  const normalizedError = error instanceof AppError ? error : new AppError(
    error?.message || 'Error desconocido',
    ErrorTypes.UNKNOWN,
    500,
    { originalError: error, errorInfo }
  );

  // Logging
  logger.error('Error capturado por el handler global', normalizedError, errorInfo);

  // En producción, ocultar detalles sensibles
  const userMessage = IS_PRODUCTION 
    ? 'Ha ocurrido un error. Por favor, intenta de nuevo más tarde.'
    : normalizedError.message;

  return {
    error: normalizedError,
    userMessage,
  };
}

/**
 * Wrapper para funciones async que captura errores
 */
export function withErrorHandler(fn) {
  return async function (...args) {
    try {
      return await fn(...args);
    } catch (error) {
      const { error: handledError } = globalErrorHandler(error, {
        function: fn.name,
        args: IS_PRODUCTION ? undefined : args,
      });
      
      // Re-lanzar el error manejado
      throw handledError;
    }
  };
}

/**
 * Hook para manejar errores en componentes React
 */
export function useErrorHandler() {
  return function handleError(error, context = {}) {
    const { userMessage } = globalErrorHandler(error, context);
    return userMessage;
  };
}
