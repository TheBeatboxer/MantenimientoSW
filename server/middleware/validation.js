const { body, validationResult } = require('express-validator');

// Middleware para manejar errores de validación
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Datos de entrada inválidos',
      details: errors.array()
    });
  }
  next();
};

// Validaciones para el formulario de reclamos
const validateClaimForm = [
  // Datos personales
  body('consumer_name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('El nombre debe tener entre 2 y 100 caracteres'),
  
  body('consumer_lastname_p')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('El apellido paterno debe tener entre 2 y 100 caracteres'),
  
  body('consumer_lastname_m')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('El apellido materno debe tener entre 2 y 100 caracteres'),
  
  body('document_type')
    .isIn(['DNI', 'CE', 'PASAPORTE'])
    .withMessage('Tipo de documento inválido'),
  
  body('document_number')
    .trim()
    .isLength({ min: 8, max: 20 })
    .withMessage('El número de documento debe tener entre 8 y 20 caracteres'),
  
  body('phone')
    .trim()
    .matches(/^[0-9+\-\s()]{9,15}$/)
    .withMessage('Número de teléfono inválido'),
  
  body('email')
    .optional()
    .isEmail()
    .withMessage('Email inválido'),
  
  // Dirección
  body('address')
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('La dirección debe tener entre 5 y 200 caracteres'),
  
  body('department')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('El departamento es requerido'),
  
  body('province')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('La provincia es requerida'),
  
  body('district')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('El distrito es requerido'),
  
  body('relationship_with_company').optional().isLength({ max: 100 }).withMessage('La relación con la empresa no puede exceder los 100 caracteres'),
  
  
  // Datos del reclamo
  body('claim_type')
    .isIn(['reclamo', 'queja'])
    .withMessage('Tipo de reclamo inválido'),
  
  body('product_service_type')
    .isIn(['producto', 'servicio'])
    .withMessage('Tipo de producto/servicio inválido'),
  
  body('currency')
    .optional()
    .isIn(['PEN', 'USD'])
    .withMessage('Moneda inválida'),
  
  body('amount')
    .optional()
    .isFloat({ min: 0, max: 999999.99 })
    .withMessage('Monto inválido'),
  
  
  body('detail')
    .trim()
    .isLength({ min: 10, max: 2000 })
    .withMessage('El detalle debe tener entre 10 y 2000 caracteres'),
  
  body('request')
    .optional()
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage('El pedido no puede exceder 1000 caracteres'),
  
  handleValidationErrors
];

// Validaciones para login de administrador
const validateAdminLogin = [
  body('username')
    .trim()
    .isLength({ min: 3, max: 50 })
    .withMessage('Usuario inválido'),
  
  body('password')
    .isLength({ min: 6 })
    .withMessage('La contraseña debe tener al menos 6 caracteres'),
  
  handleValidationErrors
];

// Validaciones para cambio de estado de reclamo
const validateStatusChange = [
  body('status')
    .isIn(['pendiente', 'en_revision', 'respondido', 'cerrado'])
    .withMessage('Estado inválido'),
  
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Las notas no pueden exceder 500 caracteres'),
  
  handleValidationErrors
];

module.exports = {
  validateClaimForm,
  validateAdminLogin,
  validateStatusChange,
  handleValidationErrors
};
