const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { validateAdminLogin, validateStatusChange } = require('../middleware/validation');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const path = require('path');
const multer = require('multer');
const fs = require('fs').promises;
const { v4: uuidv4 } = require('uuid');

const router = express.Router();

// Configuración de multer para adjuntos en cambio de estado
const statusStorage = multer.diskStorage({
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

const statusUpload = multer({
  storage: statusStorage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024, // 10MB
    files: 5
  }
});

// Endpoint para login de administrador
router.post('/login', validateAdminLogin, async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Buscar usuario
    const result = await db.query(`
      SELECT id, username, email, password_hash, full_name, role, is_active 
      FROM users_admin 
      WHERE username = ? OR email = ?
    `, [username, username]);
    
    if (result.length === 0) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }
    
    const user = result[0];
    
    if (!user.is_active) {
      return res.status(401).json({ error: 'Usuario inactivo' });
    }
    
    // Verificar contraseña
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }
    
    // Generar JWT
    const token = jwt.sign(
      { userId: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );
    
    // Guardar sesión
    req.session.userId = user.id;
    req.session.csrfToken = require('crypto').randomBytes(32).toString('hex');
    
    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        full_name: user.full_name,
        role: user.role
      },
      csrfToken: req.session.csrfToken
    });
    
  } catch (error) {
    console.error('Error in admin login:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Endpoint para logout
router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: 'Error al cerrar sesión' });
    }
    res.json({ success: true, message: 'Sesión cerrada exitosamente' });
  });
});

// Endpoint para obtener perfil del usuario autenticado
router.get('/profile', authenticateToken, (req, res) => {
  res.json({
    success: true,
    user: req.user
  });
});

// Endpoint para obtener lista de reclamos (con paginación y filtros)
router.get('/claims', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      claim_type,
      date_from,
      date_to,
      search
    } = req.query;

    // Validar y sanitizar parámetros
    const currentPage = Math.max(1, parseInt(page));
    const itemsPerPage = Math.min(100, Math.max(1, parseInt(limit))); // Máximo 100 items por página
    const offset = (currentPage - 1) * itemsPerPage;

    let whereConditions = [];
    let queryParams = [];

    // Construir condiciones WHERE de forma segura
    if (status && ['pendiente', 'en_revision', 'respondido', 'cerrado'].includes(status)) {
      whereConditions.push(`status = ?`);
      queryParams.push(status);
    }

    if (claim_type && ['reclamo', 'queja'].includes(claim_type)) {
      whereConditions.push(`claim_type = ?`);
      queryParams.push(claim_type);
    }

    if (date_from) {
      whereConditions.push(`date_created >= ?`);
      queryParams.push(date_from);
    }

    if (date_to) {
      whereConditions.push(`date_created <= ?`);
      queryParams.push(date_to);
    }

    if (search && search.trim().length > 0) {
      const searchTerm = search.trim();
      whereConditions.push(`(
        consumer_name LIKE ? OR
        consumer_lastname_p LIKE ? OR
        consumer_lastname_m LIKE ? OR
        document_number LIKE ? OR
        claim_number LIKE ?
      )`);
      const searchPattern = `%${searchTerm}%`;
      queryParams.push(searchPattern, searchPattern, searchPattern, searchPattern, searchPattern);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // Ejecutar consultas en paralelo para mejor rendimiento
    const [claimsResult, countResult] = await Promise.all([
      // Consulta principal con paginación
      db.query(`
        SELECT
          id, claim_number, date_created, status, claim_type,
          consumer_name, consumer_lastname_p, consumer_lastname_m,
          document_type, document_number, phone, email,
          reason, amount, currency, pdf_generated, email_sent
        FROM claims
        ${whereClause}
        ORDER BY date_created DESC
        LIMIT ? OFFSET ?
      `, [...queryParams, itemsPerPage, offset]),

      // Consulta optimizada para contar total (sin ORDER BY ni LIMIT)
      db.query(`
        SELECT COUNT(*) as total
        FROM claims
        ${whereClause}
      `, queryParams)
    ]);

    const total = parseInt(countResult[0].total);
    const totalPages = Math.ceil(total / itemsPerPage);

    res.json({
      success: true,
      data: {
        claims: claimsResult,
        pagination: {
          current_page: currentPage,
          total_pages: totalPages,
          total_items: total,
          items_per_page: itemsPerPage,
          has_next: currentPage < totalPages,
          has_prev: currentPage > 1
        }
      }
    });

  } catch (error) {
    console.error('Error fetching claims:', error);
    res.status(500).json({ error: 'Error al obtener los reclamos' });
  }
});

// Endpoint para obtener detalles de un reclamo específico
router.get('/claims/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    // Ejecutar todas las consultas en paralelo para optimizar rendimiento
    const [claimResult, filesResult, auditResult] = await Promise.all([
      // Consulta del reclamo principal
      db.query(`SELECT * FROM claims WHERE id = ?`, [req.params.id]),

      // Consulta de archivos con URLs optimizadas
      db.query(`
        SELECT
          cf.*,
          CASE
            WHEN cf.file_id IS NOT NULL THEN cf.view_url
            ELSE '${process.env.PUBLIC_BASE_URL || 'http://localhost:5000'}/api/admin/files/' || cf.id || '/download'
          END as view_url,
          CASE
            WHEN cf.file_id IS NOT NULL THEN cf.download_url
            ELSE '${process.env.PUBLIC_BASE_URL || 'http://localhost:5000'}/api/admin/files/' || cf.id || '/download'
          END as download_url
        FROM claim_files cf
        WHERE cf.claim_id = ?
        ORDER BY cf.uploaded_at
      `, [req.params.id]),

      // Consulta del log de auditoría con JOIN optimizado
      db.query(`
        SELECT
          al.*,
          ua.username as admin_username
        FROM audit_log al
        LEFT JOIN users_admin ua ON al.admin_user_id = ua.id
        WHERE al.claim_id = ?
        ORDER BY al.created_at DESC
      `, [req.params.id])
    ]);

    if (claimResult.length === 0) {
      return res.status(404).json({ error: 'Reclamo no encontrado' });
    }

    res.json({
      success: true,
      data: {
        claim: claimResult[0],
        files: filesResult,
        audit_log: auditResult
      }
    });

  } catch (error) {
    console.error('Error fetching claim details:', error);
    res.status(500).json({ error: 'Error al obtener los detalles del reclamo' });
  }
});

// Endpoint para enviar respuesta por email
router.post('/claims/:id/respond', authenticateToken, requireAdmin, statusUpload.array('files', 5), async (req, res) => {
  try {
    const { message, notes } = req.body;
    
    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'El mensaje de respuesta es requerido' });
    }
    
    // Obtener datos del reclamo
    const claimResult = await db.query('SELECT * FROM claims WHERE id = ?', [req.params.id]);
    if (claimResult.length === 0) {
      return res.status(404).json({ error: 'Reclamo no encontrado' });
    }
    
    const claim = claimResult[0];
    
    if (!claim.email) {
      return res.status(400).json({ error: 'El reclamo no tiene email registrado' });
    }
    
    // Procesar archivos adjuntos si los hay
    let uploadedFiles = [];
    if (req.files && req.files.length > 0) {
      const googleDriveService = require('../services/googleDriveOAuthService');
      
      for (const file of req.files) {
        try {
          const fileBuffer = await fs.readFile(file.path);
          const fileName = `respuesta_${Date.now()}_${file.originalname}`;
          
          // Subir a Google Drive en subcarpeta del reclamo
          const subfolderId = await googleDriveService.ensureSubfolderForClaim(claim.claim_number);
          const fileInfo = await googleDriveService.uploadGenericBuffer(
            fileBuffer, 
            fileName, 
            file.mimetype, 
            subfolderId
          );
          
          uploadedFiles.push({
            original_name: file.originalname,
            file_name: fileName,
            file_id: fileInfo.fileId,
            view_url: fileInfo.viewUrl,
            download_url: fileInfo.downloadUrl,
            mime_type: file.mimetype,
            size: file.size
          });
          
          // Eliminar archivo temporal
          await fs.unlink(file.path);
        } catch (fileError) {
          console.error('Error procesando archivo:', fileError);
          // Eliminar archivo temporal en caso de error
          try {
            await fs.unlink(file.path);
          } catch (unlinkError) {
            console.error('Error eliminando archivo temporal:', unlinkError);
          }
        }
      }
    }

    // Enviar email de respuesta
    const emailService = require('../services/emailService');
    await emailService.sendClaimResponse(claim.email, claim, { message, notes, files: uploadedFiles });
    
    // Actualizar estado a "respondido"
    await db.query('UPDATE claims SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', ['respondido', req.params.id]);
    
    // Guardar archivos en la base de datos
    for (const file of uploadedFiles) {
      await db.query(`
        INSERT INTO claim_files (claim_id, stored_name, original_name, file_path, file_id, view_url, download_url, mime_type, file_size, uploaded_by, upload_type)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'email_response')
      `, [
        req.params.id,
        file.file_name,
        file.original_name,
        '', // Use empty string for file_path if no local path is available
        file.file_id,
        file.view_url,
        file.download_url,
        file.mime_type,
        file.size,
        req.user.id
      ]);
    }

    // Registrar en bitácora
    await db.query(`
      INSERT INTO audit_log (claim_id, admin_user_id, action, old_values, new_values, description, ip_address)
      VALUES (?, ?, 'email_response_sent', ?, ?, ?, ?)
    `, [
      req.params.id,
      req.user.id,
      JSON.stringify({ status: claim.status }),
      JSON.stringify({ status: 'respondido', email_sent: true, files_count: uploadedFiles.length }),
      `Respuesta enviada por email a ${claim.email}${uploadedFiles.length > 0 ? ` con ${uploadedFiles.length} archivo(s)` : ''}${notes ? ': ' + notes : ''}`,
      req.ip
    ]);
    
    res.json({
      success: true,
      message: 'Respuesta enviada exitosamente por email'
    });
    
  } catch (error) {
    console.error('Error sending email response:', error);
    res.status(500).json({ error: 'Error al enviar la respuesta por email' });
  }
});

// Endpoint para cambiar estado de un reclamo
router.patch('/claims/:id/status', authenticateToken, requireAdmin, validateStatusChange, async (req, res) => {
  try {
    const { status, notes } = req.body;
    
    // Obtener estado actual
    const currentResult = await db.query(`
      SELECT status FROM claims WHERE id = ?
    `, [req.params.id]);
    
    if (currentResult.length === 0) {
      return res.status(404).json({ error: 'Reclamo no encontrado' });
    }
    
    const oldStatus = currentResult[0].status;
    
    // Actualizar estado
    await db.query(`
      UPDATE claims 
      SET status = ?, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `, [status, req.params.id]);
    
    // Obtener el reclamo actualizado
    const updatedResult = await db.query(`
      SELECT * FROM claims WHERE id = ?
    `, [req.params.id]);
    

    // Registrar en bitácora
    await db.query(`
      INSERT INTO audit_log (claim_id, admin_user_id, action, old_values, new_values, description, ip_address)
      VALUES (?, ?, 'status_changed', ?, ?, ?, ?)
    `, [
      req.params.id,
      req.user.id,
      JSON.stringify({ status: oldStatus }),
      JSON.stringify({ status: status, notes: notes }),
      `Estado cambiado de "${oldStatus}" a "${status}"${notes ? ': ' + notes : ''}`,
      req.ip
    ]);
    
    res.json({
      success: true,
      message: 'Estado actualizado exitosamente',
      data: updatedResult[0]
    });
    
  } catch (error) {
    console.error('Error updating claim status:', error);
    res.status(500).json({ error: 'Error al actualizar el estado del reclamo' });
  }
});

// Endpoint para descargar archivos adjuntos
router.get('/files/:fileId/download', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { fileId } = req.params;
    
    // Obtener información del archivo
    const fileResult = await db.query(`
      SELECT cf.*, c.claim_number 
      FROM claim_files cf
      JOIN claims c ON cf.claim_id = c.id
      WHERE cf.id = ?
    `, [fileId]);
    
    if (fileResult.length === 0) {
      return res.status(404).json({ error: 'Archivo no encontrado' });
    }
    
    const file = fileResult[0];
    
    // Si el archivo está en Google Drive, redirigir a la URL de descarga
    if (file.file_id && file.download_url) {
      return res.redirect(file.download_url);
    }
    
    // Si es un archivo local, servirlo directamente
    const fs = require('fs');
    const path = require('path');
    
    if (!fs.existsSync(file.file_path)) {
      return res.status(404).json({ error: 'Archivo no encontrado en el servidor' });
    }
    
    // Establecer headers para la descarga
    res.setHeader('Content-Disposition', `attachment; filename="${file.original_name}"`);
    res.setHeader('Content-Type', file.mime_type || 'application/octet-stream');
    
    // Enviar el archivo
    const fileStream = fs.createReadStream(file.file_path);
    fileStream.pipe(res);
    
  } catch (error) {
    console.error('Error downloading file:', error);
    res.status(500).json({ error: 'Error al descargar el archivo' });
  }
});

// Endpoint para exportar reclamos a CSV
router.get('/claims/export/csv', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { status, claim_type, date_from, date_to } = req.query;
    
    let whereConditions = [];
    let queryParams = [];
    let paramCount = 0;
    
    // Construir condiciones WHERE (mismo logic que en GET /claims)
    if (status) {
      paramCount++;
      whereConditions.push(`status = $${paramCount}`);
      queryParams.push(status);
    }
    
    if (claim_type) {
      paramCount++;
      whereConditions.push(`claim_type = $${paramCount}`);
      queryParams.push(claim_type);
    }
    
    if (date_from) {
      paramCount++;
      whereConditions.push(`date_created >= $${paramCount}`);
      queryParams.push(date_from);
    }
    
    if (date_to) {
      paramCount++;
      whereConditions.push(`date_created <= $${paramCount}`);
      queryParams.push(date_to);
    }
    
    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
    
    const result = await db.query(`
      SELECT 
        claim_number,
        date_created,
        status,
        claim_type,
        consumer_name,
        consumer_lastname_p,
        consumer_lastname_m,
        document_type,
        document_number,
        phone,
        email,
        reason,
        amount,
        currency,
        detail,
        request
      FROM claims 
      ${whereClause}
      ORDER BY date_created DESC
    `, queryParams);
    
    // Configurar CSV Writer
    const csvWriter = createCsvWriter({
      path: path.join(__dirname, '../temp/claims_export.csv'),
      header: [
        { id: 'claim_number', title: 'Número de Reclamo' },
        { id: 'date_created', title: 'Fecha de Creación' },
        { id: 'status', title: 'Estado' },
        { id: 'claim_type', title: 'Tipo' },
        { id: 'consumer_name', title: 'Nombres' },
        { id: 'consumer_lastname_p', title: 'Apellido Paterno' },
        { id: 'consumer_lastname_m', title: 'Apellido Materno' },
        { id: 'document_type', title: 'Tipo de Documento' },
        { id: 'document_number', title: 'Número de Documento' },
        { id: 'phone', title: 'Teléfono' },
        { id: 'email', title: 'Email' },
        { id: 'reason', title: 'Motivo' },
        { id: 'amount', title: 'Monto' },
        { id: 'currency', title: 'Moneda' },
        { id: 'detail', title: 'Detalle' },
        { id: 'request', title: 'Pedido' }
      ]
    });
    
    // Escribir CSV
    await csvWriter.writeRecords(result);
    
    // Enviar archivo
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="reclamos_${new Date().toISOString().split('T')[0]}.csv"`);
    
    const csvPath = path.join(__dirname, '../temp/claims_export.csv');
    const csvContent = await require('fs').promises.readFile(csvPath);
    res.send(csvContent);
    
    // Limpiar archivo temporal
    await require('fs').promises.unlink(csvPath);
    
  } catch (error) {
    console.error('Error exporting claims:', error);
    res.status(500).json({ error: 'Error al exportar los reclamos' });
  }
});

// Endpoint para obtener estadísticas del dashboard
router.get('/dashboard/stats', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const statsResult = await db.query(`
      SELECT 
        COUNT(*) as total_claims,
        COUNT(CASE WHEN status = 'pendiente' THEN 1 END) as pending_claims,
        COUNT(CASE WHEN status = 'en_revision' THEN 1 END) as in_review_claims,
        COUNT(CASE WHEN status = 'respondido' THEN 1 END) as responded_claims,
        COUNT(CASE WHEN status = 'cerrado' THEN 1 END) as closed_claims,
        COUNT(CASE WHEN claim_type = 'reclamo' THEN 1 END) as claims_count,
        COUNT(CASE WHEN claim_type = 'queja' THEN 1 END) as complaints_count,
        COUNT(CASE WHEN date(date_created) = date('now') THEN 1 END) as today_claims,
        COUNT(CASE WHEN date_created >= date('now', '-7 days') THEN 1 END) as week_claims,
        COUNT(CASE WHEN date_created >= date('now', '-30 days') THEN 1 END) as month_claims
      FROM claims
    `);
    
    const monthlyStatsResult = await db.query(`
      SELECT 
        strftime('%Y-%m', date_created) as month,
        COUNT(*) as count
      FROM claims
      WHERE date_created >= date('now', '-12 months')
      GROUP BY strftime('%Y-%m', date_created)
      ORDER BY month
    `);
    
    res.json({
      success: true,
      data: {
        overview: statsResult[0],
        monthly_trend: monthlyStatsResult
      }
    });
    
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ error: 'Error al obtener las estadísticas' });
  }
});

module.exports = router;