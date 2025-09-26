const jwt = require('jsonwebtoken');
const db = require('../config/database');

// Middleware para verificar JWT
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token de acceso requerido' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Verificar que el usuario aún existe y está activo
    const userResult = await db.query(
      'SELECT id, username, email, full_name, role, is_active FROM users_admin WHERE id = ?',
      [decoded.userId]
    );

    if (userResult.length === 0 || !userResult[0].is_active) {
      return res.status(401).json({ error: 'Usuario no válido o inactivo' });
    }

    req.user = userResult[0];
    next();
  } catch (error) {
    console.error('Error verifying token:', error);
    return res.status(403).json({ error: 'Token inválido' });
  }
};

// Middleware para verificar roles de administrador
const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
    return res.status(403).json({ error: 'Acceso denegado. Se requieren permisos de administrador.' });
  }
  next();
};

// Middleware para verificar CSRF (simplificado)
const csrfProtection = (req, res, next) => {
  if (req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS') {
    return next();
  }

  const csrfToken = req.headers['x-csrf-token'];
  const sessionToken = req.session.csrfToken;

  if (!csrfToken || !sessionToken || csrfToken !== sessionToken) {
    return res.status(403).json({ error: 'Token CSRF inválido' });
  }

  next();
};

module.exports = {
  authenticateToken,
  requireAdmin,
  csrfProtection
};
