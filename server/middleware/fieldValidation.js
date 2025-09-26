/**
 * Middleware para validación de límites superiores en campos
 * Previene ataques de buffer overflow y asegura integridad de datos
 */

const { ValidationError } = require('./errorHandler');

/**
 * Límites de validación para campos comunes
 */
const FIELD_LIMITS = {
  // Información personal
  consumer_name: { max: 100, min: 2 },
  consumer_lastname_p: { max: 50, min: 2 },
  consumer_lastname_m: { max: 50, min: 0 },
  document_number: { max: 20, min: 8 },
  phone: { max: 15, min: 7 },
  email: { max: 254, min: 5 },

  // Ubicación
  address: { max: 200, min: 5 },
  department: { max: 50, min: 2 },
  province: { max: 50, min: 2 },
  district: { max: 50, min: 2 },

  // Reclamo
  detail: { max: 2000, min: 10 },
  request: { max: 2000, min: 10 },

  // Usuario admin
  username: { max: 50, min: 3 },
  full_name: { max: 100, min: 2 },

  // Empresa
  company_name: { max: 100, min: 2 },
  ruc: { max: 11, min: 11 },
  support_email: { max: 254, min: 5 },
  website: { max: 200, min: 0 },

  // Archivos
  original_name: { max: 255, min: 1 },

  // Notas y comentarios
  notes: { max: 1000, min: 0 },
  message: { max: 2000, min: 1 }
};

/**
 * Patrones de validación
 */
const PATTERNS = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  phone: /^[\d\s\-\+\(\)]+$/,
  ruc: /^\d{11}$/,
  document_number: /^[A-Za-z0-9\-]+$/,
  url: /^https?:\/\/.+$/
};

/**
 * Función para validar límites de campo
 */
function validateFieldLimits(fieldName, value, limits = FIELD_LIMITS[fieldName]) {
  if (!limits) return null; // No hay límites definidos para este campo

  const errors = [];

  if (typeof value === 'string') {
    if (value.length < limits.min) {
      errors.push(`muy corto (mínimo ${limits.min} caracteres)`);
    }
    if (value.length > limits.max) {
      errors.push(`muy largo (máximo ${limits.max} caracteres)`);
    }
  } else if (typeof value === 'number') {
    if (value < limits.min) {
      errors.push(`muy pequeño (mínimo ${limits.min})`);
    }
    if (value > limits.max) {
      errors.push(`muy grande (máximo ${limits.max})`);
    }
  }

  return errors.length > 0 ? errors.join(', ') : null;
}

/**
 * Función para validar patrones
 */
function validateFieldPattern(fieldName, value) {
  const pattern = PATTERNS[fieldName];
  if (!pattern) return null;

  if (!pattern.test(value)) {
    switch (fieldName) {
      case 'email':
        return 'formato de email inválido';
      case 'phone':
        return 'formato de teléfono inválido (solo números, espacios, guiones, paréntesis y +)';
      case 'ruc':
        return 'RUC debe tener exactamente 11 dígitos';
      case 'document_number':
        return 'número de documento contiene caracteres inválidos';
      case 'url':
        return 'URL debe comenzar con http:// o https://';
      default:
        return 'formato inválido';
    }
  }

  return null;
}

/**
 * Middleware para validar campos de reclamo
 */
const validateClaimFields = (req, res, next) => {
  const errors = [];

  const fieldsToValidate = [
    'consumer_name', 'consumer_lastname_p', 'consumer_lastname_m',
    'document_number', 'phone', 'email', 'address',
    'department', 'province', 'district',
    'detail', 'request'
  ];

  for (const field of fieldsToValidate) {
    if (req.body[field] !== undefined) {
      const limitError = validateFieldLimits(field, req.body[field]);
      if (limitError) {
        errors.push(`${field}: ${limitError}`);
      }

      const patternError = validateFieldPattern(field, req.body[field]);
      if (patternError) {
        errors.push(`${field}: ${patternError}`);
      }
    }
  }

  // Validaciones específicas
  if (req.body.amount !== undefined) {
    const amount = parseFloat(req.body.amount);
    if (isNaN(amount) || amount < 0 || amount > 999999.99) {
      errors.push('amount: debe ser un número positivo menor a 1,000,000');
    }
  }

  if (req.body.is_minor !== undefined) {
    if (typeof req.body.is_minor !== 'boolean' && req.body.is_minor !== 'true' && req.body.is_minor !== 'false') {
      errors.push('is_minor: debe ser un valor booleano');
    }
  }

  if (errors.length > 0) {
    throw new ValidationError(`Errores de validación: ${errors.join('; ')}`);
  }

  next();
};

/**
 * Middleware para validar campos de login admin
 */
const validateAdminLoginFields = (req, res, next) => {
  const errors = [];

  if (!req.body.username || typeof req.body.username !== 'string') {
    errors.push('username: requerido y debe ser texto');
  } else {
    const limitError = validateFieldLimits('username', req.body.username);
    if (limitError) {
      errors.push(`username: ${limitError}`);
    }
  }

  if (!req.body.password || typeof req.body.password !== 'string') {
    errors.push('password: requerido y debe ser texto');
  } else if (req.body.password.length < 6) {
    errors.push('password: muy corto (mínimo 6 caracteres)');
  } else if (req.body.password.length > 128) {
    errors.push('password: muy largo (máximo 128 caracteres)');
  }

  if (errors.length > 0) {
    throw new ValidationError(`Errores de validación: ${errors.join('; ')}`);
  }

  next();
};

/**
 * Middleware para validar campos de actualización de empresa
 */
const validateCompanyFields = (req, res, next) => {
  const errors = [];

  const fieldsToValidate = ['name', 'ruc', 'address', 'phone', 'website', 'support_email'];

  for (const field of fieldsToValidate) {
    if (req.body[field] !== undefined) {
      const mappedField = field === 'name' ? 'company_name' : field;
      const limitError = validateFieldLimits(mappedField, req.body[field]);
      if (limitError) {
        errors.push(`${field}: ${limitError}`);
      }

      const patternError = validateFieldPattern(field, req.body[field]);
      if (patternError) {
        errors.push(`${field}: ${patternError}`);
      }
    }
  }

  if (errors.length > 0) {
    throw new ValidationError(`Errores de validación: ${errors.join('; ')}`);
  }

  next();
};

/**
 * Middleware para validar campos de respuesta admin
 */
const validateAdminResponseFields = (req, res, next) => {
  const errors = [];

  if (!req.body.message || typeof req.body.message !== 'string') {
    errors.push('message: requerido y debe ser texto');
  } else {
    const limitError = validateFieldLimits('message', req.body.message);
    if (limitError) {
      errors.push(`message: ${limitError}`);
    }
  }

  if (req.body.notes !== undefined) {
    const limitError = validateFieldLimits('notes', req.body.notes);
    if (limitError) {
      errors.push(`notes: ${limitError}`);
    }
  }

  if (errors.length > 0) {
    throw new ValidationError(`Errores de validación: ${errors.join('; ')}`);
  }

  next();
};

/**
 * Middleware para validar campos de cambio de estado
 */
const validateStatusChangeFields = (req, res, next) => {
  const errors = [];

  const validStatuses = ['pendiente', 'en_revision', 'respondido', 'cerrado'];
  if (!req.body.status || !validStatuses.includes(req.body.status)) {
    errors.push(`status: debe ser uno de: ${validStatuses.join(', ')}`);
  }

  if (req.body.notes !== undefined) {
    const limitError = validateFieldLimits('notes', req.body.notes);
    if (limitError) {
      errors.push(`notes: ${limitError}`);
    }
  }

  if (errors.length > 0) {
    throw new ValidationError(`Errores de validación: ${errors.join('; ')}`);
  }

  next();
};

/**
 * Middleware genérico para sanitizar inputs
 */
const sanitizeInput = (req, res, next) => {
  // Función recursiva para sanitizar objetos
  const sanitize = (obj) => {
    for (const key in obj) {
      if (typeof obj[key] === 'string') {
        // Remover caracteres de control y normalizar espacios
        obj[key] = obj[key].trim().replace(/[\x00-\x1F\x7F]/g, '');
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        sanitize(obj[key]);
      }
    }
  };

  if (req.body) sanitize(req.body);
  if (req.query) sanitize(req.query);
  if (req.params) sanitize(req.params);

  next();
};

module.exports = {
  validateClaimFields,
  validateAdminLoginFields,
  validateCompanyFields,
  validateAdminResponseFields,
  validateStatusChangeFields,
  sanitizeInput,
  validateFieldLimits,
  validateFieldPattern
};
