const rateLimit = require('express-rate-limit');
const helmet = require('helmet');

// Rate limiting para diferentes endpoints
const createRateLimit = (windowMs, max, message) => {
  return rateLimit({
    windowMs,
    max,
    message: { error: message },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      res.status(429).json({
        error: message,
        retryAfter: Math.round(windowMs / 1000)
      });
    }
  });
};

// Rate limiting para creación de reclamos (más estricto)
const claimSubmissionLimit = createRateLimit(
  60 * 60 * 1000, // 1 hora
  5, // máximo 5 reclamos por hora por IP
  'Límite de reclamos excedido. Intente nuevamente en una hora.'
);

// Rate limiting para login de administradores
const adminLoginLimit = createRateLimit(
  15 * 60 * 1000, // 15 minutos
  5, // máximo 5 intentos por 15 minutos
  'Demasiados intentos de inicio de sesión. Intente nuevamente en 15 minutos.'
);

// Rate limiting general para API
const generalApiLimit = createRateLimit(
  15 * 60 * 1000, // 15 minutos
  100, // máximo 100 requests por 15 minutos
  'Demasiadas solicitudes desde esta IP, intente nuevamente más tarde.'
);

// Configuración de Helmet para seguridad
const helmetConfig = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      manifestSrc: ["'self'"],
      workerSrc: ["'self'", "blob:"],
    },
  },
  crossOriginEmbedderPolicy: false,
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
});

// Middleware para validar IPs permitidas (opcional)
const validateIP = (req, res, next) => {
  const allowedIPs = process.env.ALLOWED_IPS ? process.env.ALLOWED_IPS.split(',') : null;
  
  if (allowedIPs && !allowedIPs.includes(req.ip)) {
    return res.status(403).json({ error: 'Acceso denegado desde esta IP' });
  }
  
  next();
};

// Middleware para sanitizar inputs
const sanitizeInput = (req, res, next) => {
  const sanitize = (obj) => {
    if (typeof obj === 'string') {
      return obj
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/javascript:/gi, '')
        .replace(/on\w+\s*=/gi, '');
    }
    
    if (typeof obj === 'object' && obj !== null) {
      for (const key in obj) {
        obj[key] = sanitize(obj[key]);
      }
    }
    
    return obj;
  };
  
  if (req.body) {
    req.body = sanitize(req.body);
  }
  
  if (req.query) {
    req.query = sanitize(req.query);
  }
  
  next();
};

// Middleware para validar tamaño de archivos
const validateFileSize = (maxSize = 10 * 1024 * 1024) => {
  return (req, res, next) => {
    if (req.files) {
      for (const file of req.files) {
        if (file.size > maxSize) {
          return res.status(400).json({
            error: `El archivo ${file.originalname} excede el tamaño máximo permitido`
          });
        }
      }
    }
    
    next();
  };
};

// Middleware para validar tipos de archivos
const validateFileType = (allowedTypes) => {
  return (req, res, next) => {
    if (req.files) {
      for (const file of req.files) {
        if (!allowedTypes.includes(file.mimetype)) {
          return res.status(400).json({
            error: `El archivo ${file.originalname} no es de un tipo permitido`
          });
        }
      }
    }
    
    next();
  };
};

// Middleware para logging de seguridad
const securityLogger = (req, res, next) => {
  const startTime = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const logData = {
      timestamp: new Date().toISOString(),
      method: req.method,
      url: req.url,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      statusCode: res.statusCode,
      duration: duration,
      contentLength: res.get('Content-Length') || 0
    };
    
    // Log eventos de seguridad importantes
    if (res.statusCode >= 400) {
      console.warn('Security Event:', logData);
    }
    
    // Log intentos de acceso sospechosos
    if (res.statusCode === 429 || res.statusCode === 403) {
      console.error('Security Alert:', logData);
    }
  });
  
  next();
};

module.exports = {
  claimSubmissionLimit,
  adminLoginLimit,
  generalApiLimit,
  helmetConfig,
  validateIP,
  sanitizeInput,
  validateFileSize,
  validateFileType,
  securityLogger
};
