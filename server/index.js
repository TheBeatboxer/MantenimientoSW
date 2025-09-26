const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const session = require('express-session');
const SQLiteStore = require('connect-sqlite3')(session);
const path = require('path');
const compression = require('compression');
require('dotenv').config({ path: path.join(__dirname, '.env') });

// Importar rutas
const claimsRoutes = require('./routes/claims');
const adminRoutes = require('./routes/admin');

// Importar configuración de base de datos
const db = require('./config/database');

// Importar servicios
const googleDriveService = require('./services/googleDriveOAuthService');

// Importar middleware de validación de campos
const { sanitizeInput } = require('./middleware/fieldValidation');
const companyInfoService = require('./services/companyInfoService');

const app = express();
const PORT = process.env.PORT || 5000;

// Configurar trust proxy para rate limiting
app.set('trust proxy', 1);

// Middleware de compresión para respuestas
app.use(compression());

// Middleware de seguridad
app.use(helmet({
  contentSecurityPolicy: process.env.NODE_ENV === 'production' ? {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  } : false, // Deshabilitar CSP en desarrollo para facilitar debugging
}));

// Configuración de CORS
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://tu-dominio.com'] 
    : ['http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token']
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutos
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 1000, // límite más alto para desarrollo
  message: {
    error: 'Demasiadas solicitudes desde esta IP, intente nuevamente más tarde.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Saltar rate limiting en desarrollo para localhost
    return process.env.NODE_ENV === 'development' && req.ip === '::1';
  }
});

// Endpoint temporal para limpiar rate limiting en desarrollo
if (process.env.NODE_ENV === 'development') {
  app.get('/api/clear-rate-limit', (req, res) => {
    // Limpiar la caché del rate limiter
    limiter.resetKey(req.ip);
    res.json({ message: 'Rate limit limpiado para esta IP' });
  });
}

app.use('/api/', limiter);

// Rate limiting granular por endpoint
const createClaimLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: process.env.NODE_ENV === 'production' ? 5 : 50, // 5 en producción, 50 en desarrollo
  message: {
    error: 'Límite de reclamos excedido. Intente nuevamente en una hora.'
  }
});

const adminLoginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // máximo 5 intentos de login por IP
  message: {
    error: 'Demasiados intentos de login. Intente nuevamente en 15 minutos.'
  }
});

const adminActionsLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 50, // máximo 50 acciones admin por IP
  message: {
    error: 'Demasiadas acciones administrativas. Intente nuevamente en 15 minutos.'
  }
});

const fileDownloadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 20, // máximo 20 descargas por hora por IP
  message: {
    error: 'Límite de descargas excedido. Intente nuevamente en una hora.'
  }
});

// Aplicar rate limiting granular
app.use('/api/claims', createClaimLimiter);
app.use('/api/admin/login', adminLoginLimiter);
app.use('/api/admin', adminActionsLimiter);
app.use('/api/claims/*/pdf', fileDownloadLimiter);
app.use('/api/admin/files/*/download', fileDownloadLimiter);

// Configuración de sesiones con SQLite
app.use(session({
  store: new SQLiteStore({
    db: 'sessions.db',
    dir: path.join(__dirname, 'database')
  }),
  secret: process.env.JWT_SECRET || 'fallback-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 8 * 60 * 60 * 1000 // 8 horas
  }
}));

// Middleware para parsing
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Middleware para sanitizar inputs
app.use(sanitizeInput);

// Servir archivos estáticos
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Servir archivos estáticos del frontend construido (para producción)
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/build')));

  // Para cualquier ruta que no sea /api, servir el index.html del frontend
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/build/index.html'));
  });
}

// Middleware para logging de requests
app.use((req, res, next) => {
  const isProduction = process.env.NODE_ENV === 'production';
  const isHealthCheck = req.path === '/api/health';

  // En producción, solo loggear errores y requests importantes
  if (isProduction) {
    // Solo loggear requests que no sean health checks o requests GET simples
    if (!isHealthCheck && req.method !== 'GET') {
      console.log(`${new Date().toISOString()} - ${req.method} ${req.path} - IP: ${req.ip}`);
    }
  } else {
    // En desarrollo, loggear todo
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path} - IP: ${req.ip}`);
  }

  next();
});

// Rutas de la API
app.use('/api/claims', claimsRoutes);
app.use('/api/admin', adminRoutes);

// Ruta de salud del servidor
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Rutas de información de la empresa
const companyRouter = require('./routes/company');
app.use('/api/company-info', companyRouter);

// Middleware para manejar rutas no encontradas
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Ruta no encontrada',
    message: 'La ruta solicitada no existe en este servidor'
  });
});

// Middleware global de manejo de errores
app.use((error, req, res, next) => {
  console.error('Error no manejado:', error);
  
  // No exponer detalles del error en producción
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  res.status(error.status || 500).json({
    error: 'Error interno del servidor',
    message: isDevelopment ? error.message : 'Algo salió mal',
    ...(isDevelopment && { stack: error.stack })
  });
});

// Función para inicializar el servidor
async function startServer() {
  try {
    // Conectar a SQLite
    await db.connect();
    console.log('✅ Conexión a SQLite establecida');
    
    // Inicializar Google Drive Service
    const driveInitialized = await googleDriveService.initialize();
    if (driveInitialized) {
      console.log('✅ Google Drive Service inicializado');
    } else {
      console.log('⚠️  Google Drive Service no disponible, usando almacenamiento local');
    }
    // Cargar información de la empresa al inicio usando el servicio singleton
    try {
      const companyInfo = await companyInfoService.getCompanyInfo();
      console.log('✅ Información de la empresa cargada:', companyInfo.name);
    } catch (error) {
      console.error('❌ Error cargando información de la empresa:', error);
      console.log('⚠️  Usando valores por defecto para la empresa.');
    }
    
    // Crear directorios necesarios
    const fs = require('fs').promises;
    const dirs = ['uploads', 'uploads/claims', 'uploads/pdfs', 'temp', 'credentials'];
    
    for (const dir of dirs) {
      try {
        await fs.mkdir(path.join(__dirname, dir), { recursive: true });
      } catch (error) {
        // El directorio ya existe, continuar
      }
    }
    
    // Iniciar servidor
    app.listen(PORT, () => {
      console.log(`🚀 Servidor iniciado en puerto ${PORT}`);
      console.log(`📊 Entorno: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🌐 API disponible en: http://localhost:${PORT}/api`);
    });
    
  } catch (error) {
    console.error('❌ Error al iniciar el servidor:', error);
    process.exit(1);
  }
}

// Middleware de manejo de errores consistente
const { errorHandler, multerErrorHandler, databaseErrorHandler } = require('./middleware/errorHandler');

// Middleware para errores de base de datos
app.use(databaseErrorHandler);

// Middleware para errores de archivos
app.use(multerErrorHandler);

// Middleware de manejo de errores (debe ser el último)
app.use(errorHandler);

// Manejo de señales para cierre graceful
process.on('SIGTERM', () => {
  console.log('🛑 Señal SIGTERM recibida, cerrando servidor...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 Señal SIGINT recibida, cerrando servidor...');
  process.exit(0);
});

// Iniciar servidor
startServer();
