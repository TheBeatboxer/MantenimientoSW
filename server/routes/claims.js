const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const { v4: uuidv4 } = require('uuid');
const db = require('../config/database');
const { validateClaimForm } = require('../middleware/validation');
const { validateClaimFields } = require('../middleware/fieldValidation');
const pdfService = require('../services/pdfService');
const emailService = require('../services/emailService');

// Cache simple para company info (5 minutos)
let companyInfoCache = null;
let companyInfoCacheTime = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

async function getCompanyInfo() {
  const now = Date.now();
  if (companyInfoCache && (now - companyInfoCacheTime) < CACHE_DURATION) {
    return companyInfoCache;
  }

  const companyInfoRows = await db.query('SELECT * FROM company_info WHERE id = 1');
  companyInfoCache = companyInfoRows.length > 0 ? companyInfoRows[0] : { name: 'Mi Empresa', ruc: '', address: '' };
  companyInfoCacheTime = now;
  return companyInfoCache;
}

const router = express.Router();

// Configuración de multer para archivos
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads/claims');
    await fs.mkdir(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}_${file.originalname}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 50 * 1024 * 1024, // 50MB
    files: 3 // Máximo 3 archivos
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = (process.env.ALLOWED_FILE_TYPES || 'image/jpeg,image/png,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document').split(',');
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de archivo no permitido'), false);
    }
  }
});

// Helper: generar número correlativo estilo YYYY-000001 (SQLite)
async function generateClaimNumber() {
  const now = new Date();
  const year = now.getFullYear().toString();
  // Contar cuántos reclamos hay este año
  const rows = await db.query(
    `SELECT COUNT(*) as count FROM claims WHERE strftime('%Y', date_created) = ?`,
    [year]
  );
  const next = (rows[0]?.count || 0) + 1;
  const padded = String(next).padStart(6, '0');
  return `${year}-${padded}`;
}

// Endpoint para crear un nuevo reclamo
router.post('/', upload.array('files', 3), validateClaimForm, validateClaimFields, async (req, res) => {
  try {
    const claimNumber = await generateClaimNumber();
    
    // Extraer datos del formulario
    const {
      consumer_name,
      consumer_lastname_p,
      consumer_lastname_m,
      document_type,
      document_number,
      phone,
      email,
      is_minor = false,
      address,
      department,
      province,
      district,
      relationship_with_company,
      claim_type,
      product_service_type,
      currency = 'PEN',
      amount,
      detail,
      request
    } = req.body;

    // Helper para generar el motivo
    const generateReason = (claimType, productServiceType) => {
      const type = claimType === 'reclamo' ? 'Reclamo' : 'Queja';
      const product = productServiceType === 'producto' ? 'un producto' : 'un servicio';
      return `${type} por disconformidad con ${product}`;
    };

    const reason = generateReason(claim_type, product_service_type);
    
    // Establecer valores por defecto para campos que no vienen del frontend o que son fijos
    const communication_medium = 'Correo electrónico';
    
    // Insertar reclamo en la base de datos (SQLite). Obtenemos el ID con last_insert_rowid()
    await db.query(
      `INSERT INTO claims (
        claim_number, consumer_name, consumer_lastname_p, consumer_lastname_m,
        document_type, document_number, phone, email, is_minor,
        address, department, province, district, communication_medium,
        relationship_with_company, claim_type, product_service_type,
        currency, amount, reason, detail, request,
        ip_address, user_agent
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        claimNumber, consumer_name, consumer_lastname_p, consumer_lastname_m,
        document_type, document_number, phone, email, is_minor ? 1 : 0,
        address, department, province, district, communication_medium,
        relationship_with_company, claim_type, product_service_type,
        currency, amount ? parseFloat(amount) : null, reason, detail, request,
        req.ip, req.get('User-Agent')
      ]
    );
    const newIdRow = await db.query('SELECT last_insert_rowid() AS id');
    const newClaimId = newIdRow[0].id;

    // Fetch the full claim from the database to get all fields, including date_created
    const claimRows = await db.query('SELECT * FROM claims WHERE id = ?', [newClaimId]);
    if (claimRows.length === 0) {
      // This should not happen, but as a safeguard
      throw new Error('Could not find newly created claim');
    }
    const claim = claimRows[0];
    
    // Procesar archivos adjuntos
    const files = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        await db.query(
          `INSERT INTO claim_files (claim_id, original_name, stored_name, file_path, file_size, mime_type)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [claim.id, file.originalname, file.filename, file.path, file.size, file.mimetype]
        );
        const insertedRow = await db.query('SELECT last_insert_rowid() AS id');
        files.push({
          id: insertedRow[0].id,
          claim_id: claim.id,
          original_name: file.originalname,
          stored_name: file.filename,
          file_path: file.path,
          file_size: file.size,
          mime_type: file.mimetype,
          view_url: null, // Se llenará después si se sube a Drive
          download_url: null
        });
      }
    }
    
    // Generar PDF
    const pdfBuffer = await pdfService.generateClaimPDF(claim, files);
    const pdfInfo = await pdfService.savePDF(pdfBuffer, claimNumber);
    
    // Actualizar reclamo con información del PDF
    if (pdfInfo.storage === 'google_drive') {
      await db.query(
        `UPDATE claims SET 
          pdf_generated = 1, 
          pdf_storage = ?,
          pdf_file_id = ?,
          pdf_download_url = ?,
          pdf_view_url = ?
        WHERE id = ?`,
        [pdfInfo.storage, pdfInfo.fileId, pdfInfo.downloadUrl, pdfInfo.viewUrl, claim.id]
      );
    } else {
      await db.query(
        `UPDATE claims SET 
          pdf_generated = 1, 
          pdf_storage = ?,
          pdf_path = ?
        WHERE id = ?`,
        [pdfInfo.storage, pdfInfo.relativePath, claim.id]
      );
    }
    
    // Enviar email de confirmación si se proporcionó email
    if (email) {
      try {
        await emailService.sendClaimConfirmation(email, claim, pdfInfo.filePath, pdfBuffer);
        await db.query('UPDATE claims SET email_sent = 1 WHERE id = ?', [claim.id]);
      } catch (emailError) {
        console.error('Error sending email:', emailError);
        // No fallar el proceso si el email falla
      }
    }
    
    // Enviar notificación a administradores
    try {
      await emailService.sendAdminNotification(claim);
    } catch (notificationError) {
      console.error('Error sending admin notification:', notificationError);
    }
    
    // Registrar en bitácora
    await db.query(
      `INSERT INTO audit_log (claim_id, action, description, ip_address)
       VALUES (?, 'created', 'Reclamo creado por el consumidor', ?)`,
      [claim.id, req.ip]
    );
    
    res.status(201).json({
      success: true,
      message: 'Reclamo creado exitosamente',
      data: {
        claim_number: claim.claim_number,
        id: claim.id,
        pdf_url: `/api/claims/${claim.id}/pdf`,
        email_sent: !!email
      }
    });
    
  } catch (error) {
    console.error('Error creating claim:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'No se pudo procesar el reclamo'
    });
  }
});

// Endpoint para descargar PDF
router.get('/:id/pdf', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT 
        claim_number, 
        pdf_path, 
        pdf_storage, 
        pdf_file_id, 
        pdf_download_url,
        pdf_view_url
      FROM claims 
      WHERE id = ? AND pdf_generated = 1
    `, [req.params.id]);
    
    if (result.length === 0) {
      return res.status(404).json({ error: 'PDF no encontrado' });
    }
    
    const claim = result[0];
    
    // Si está en Google Drive
    if (claim.pdf_storage === 'google_drive' && claim.pdf_file_id) {
      try {
        console.log('🔍 Intentando descargar PDF de Google Drive:', claim.pdf_file_id);
        
        // Intentar descarga directa con buffer
        const googleDriveService = require('../services/googleDriveOAuthService');
        const pdfBuffer = await googleDriveService.downloadFile(claim.pdf_file_id);
        
        res.setHeader('Content-Type', 'application/octet-stream');
        res.setHeader('Content-Disposition', `attachment; filename="reclamo_${claim.claim_number}.pdf"`);
        res.setHeader('Content-Length', pdfBuffer.length);
        
        res.send(pdfBuffer);
        return;
        
      } catch (driveError) {
        console.error('❌ Error descargando de Google Drive:', driveError);
        console.error('❌ Detalles del error:', driveError.message);
        
        // Intentar descarga alternativa usando la URL directa
        const downloadUrl = `https://drive.google.com/uc?export=download&id=${claim.pdf_file_id}`;
        console.log('🔄 Intentando descarga alternativa con URL directa:', downloadUrl);
        return res.redirect(downloadUrl);
      }
    }
    
    // Si está almacenado localmente
    if (claim.pdf_storage === 'local' && claim.pdf_path) {
      const pdfPath = path.join(__dirname, '../', claim.pdf_path);
      
      // Verificar que el archivo existe
      try {
        await fs.access(pdfPath);
      } catch (error) {
        return res.status(404).json({ error: 'Archivo PDF no encontrado en el servidor' });
      }
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="reclamo_${claim.claim_number}.pdf"`);
      
      const pdfBuffer = await fs.readFile(pdfPath);
      res.send(pdfBuffer);
      return;
    }
    
    return res.status(404).json({ error: 'PDF no disponible' });
    
  } catch (error) {
    console.error('Error downloading PDF:', error);
    res.status(500).json({ error: 'Error al descargar el PDF' });
  }
});

// Endpoint para obtener información de un reclamo (público)
router.get('/:id', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT 
        id, claim_number, date_created, status,
        consumer_name, consumer_lastname_p, consumer_lastname_m,
        claim_type, reason, amount, currency
      FROM claims 
      WHERE id = ?
    `, [req.params.id]);
    
    if (result.length === 0) {
      return res.status(404).json({ error: 'Reclamo no encontrado' });
    }
    
    res.json({
      success: true,
      data: result[0]
    });
    
  } catch (error) {
    console.error('Error fetching claim:', error);
    res.status(500).json({ error: 'Error al obtener el reclamo' });
  }
});

// Middleware para manejar errores de multer
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'El archivo es demasiado grande' });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({ error: 'Demasiados archivos' });
    }
  }
  
  if (error.message === 'Tipo de archivo no permitido') {
    return res.status(400).json({ error: 'Tipo de archivo no permitido' });
  }
  
  next(error);
});

module.exports = router;
