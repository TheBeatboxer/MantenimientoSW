/**
 * Middleware de manejo de errores consistente
 * Proporciona respuestas de error estandarizadas y logging apropiado
 */

const isDevelopment = process.env.NODE_ENV === 'development';

/**
 * Clase base para errores personalizados
 */
class AppError extends Error {
  constructor(message, statusCode = 500, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.name = this.constructor.name;

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Error de validación
 */
class ValidationError extends AppError {
  constructor(message) {
    super(message, 400);
  }
}

/**
 * Error de autenticación
 */
class AuthenticationError extends AppError {
  constructor(message = 'Credenciales inválidas') {
    super(message, 401);
  }
}

/**
 * Error de autorización
 */
class AuthorizationError extends AppError {
  constructor(message = 'No autorizado') {
    super(message, 403);
  }
}

/**
 * Error de recurso no encontrado
 */
class NotFoundError extends AppError {
  constructor(resource = 'Recurso') {
    super(`${resource} no encontrado`, 404);
  }
}

/**
 * Error de conflicto (ej: duplicados)
 */
class ConflictError extends AppError {
  constructor(message = 'Conflicto con el recurso existente') {
    super(message, 409);
  }
}

/**
 * Error de límite excedido (rate limiting, archivos, etc.)
 */
class LimitExceededError extends AppError {
  constructor(message = 'Límite excedido') {
    super(message, 429);
  }
}

/**
 * Middleware principal de manejo de errores
 */
const errorHandler = (error, req, res, next) => {
  let statusCode = error.statusCode || 500;
  let message = error.message || 'Error interno del servidor';
  let isOperational = error.isOperational !== undefined ? error.isOperational : true;

  // Logging basado en el tipo de error
  if (statusCode >= 500) {
    // Errores del servidor - logging detallado
    console.error('🔴 Error del servidor:', {
      message: error.message,
      stack: error.stack,
      url: req.originalUrl,
      method: req.method,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      timestamp: new Date().toISOString()
    });
  } else if (statusCode >= 400 && statusCode < 500) {
    // Errores del cliente - logging moderado
    console.warn('🟡 Error del cliente:', {
      statusCode,
      message,
      url: req.originalUrl,
      method: req.method,
      ip: req.ip,
      timestamp: new Date().toISOString()
    });
  }

  // En desarrollo, incluir stack trace para debugging
  const response = {
    error: message,
    ...(isDevelopment && {
      stack: error.stack,
      details: error.details || null
    })
  };

  // Para errores 500, usar mensaje genérico en producción
  if (statusCode >= 500 && !isDevelopment) {
    response.error = 'Error interno del servidor';
  }

  res.status(statusCode).json(response);
};

/**
 * Middleware para capturar errores asíncronos no manejados
 */
const asyncErrorHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Middleware para validar y sanitizar errores de Multer
 */
const multerErrorHandler = (error, req, res, next) => {
  if (error instanceof require('multer').MulterError) {
    let message = 'Error al procesar el archivo';

    switch (error.code) {
      case 'LIMIT_FILE_SIZE':
        message = 'El archivo es demasiado grande';
        break;
      case 'LIMIT_FILE_COUNT':
        message = 'Demasiados archivos';
        break;
      case 'LIMIT_UNEXPECTED_FILE':
        message = 'Tipo de archivo no esperado';
        break;
    }

    throw new ValidationError(message);
  }

  // Para otros errores de archivos
  if (error.message && error.message.includes('tipo de archivo')) {
    throw new ValidationError(error.message);
  }

  next(error);
};

/**
 * Middleware para errores de base de datos
 */
const databaseErrorHandler = (error, req, res, next) => {
  if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
    return next(new ConflictError('Ya existe un registro con estos datos'));
  }

  if (error.code === 'SQLITE_CONSTRAINT_FOREIGN') {
    return next(new ValidationError('Referencia a recurso inexistente'));
  }

  next(error);
};

/**
 * Función helper para crear respuestas de éxito consistentes
 */
const createSuccessResponse = (data, message = null, meta = null) => {
  const response = {
    success: true,
    data
  };

  if (message) response.message = message;
  if (meta) response.meta = meta;

  return response;
};

/**
 * Función helper para crear respuestas de error consistentes
 */
const createErrorResponse = (message, statusCode = 400, details = null) => {
  const response = {
    error: message,
    ...(details && { details })
  };

  return { response, statusCode };
};

module.exports = {
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  LimitExceededError,
  errorHandler,
  asyncErrorHandler,
  multerErrorHandler,
  databaseErrorHandler,
  createSuccessResponse,
  createErrorResponse
};
