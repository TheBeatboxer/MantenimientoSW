const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const db = require('../config/database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const companyInfoService = require('../services/companyInfoService');
const cacheService = require('../services/cacheService');

const router = express.Router();

// Subida de logo (a Drive vía servicio). Guardamos temporal por si acaso.
const upload = multer({
  storage: multer.diskStorage({
    destination: async (req, file, cb) => {
      const dir = path.join(__dirname, '../uploads/company');
      await fs.mkdir(dir, { recursive: true });
      cb(null, dir);
    },
    filename: (req, file, cb) => cb(null, `logo_${Date.now()}_${file.originalname}`)
  })
});

// GET público: devuelve configuración
router.get('/', async (req, res) => {
  try {
    const companyInfo = await companyInfoService.getCompanyInfo();
    res.json(companyInfo);
  } catch (error) {
    console.error('Error fetching company info:', error);
    res.status(500).json({ error: 'Error al obtener la información de la empresa' });
  }
});

// GET público: imagen del logo proxied desde Drive
router.get('/logo', async (req, res) => {
  res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache por 1 día
  try {
    const rows = await db.query('SELECT logo_file_id FROM company_info WHERE id = 1');
    const fileId = rows[0]?.logo_file_id;

    // Si hay logo en Drive y el servicio está habilitado, servir desde Drive
    const drive = require('../services/googleDriveOAuthService');
    if (drive && drive.enabled && fileId) {
      try {
        const stream = await drive.downloadPDF(fileId);
        res.setHeader('Content-Type', 'image/*');
        return stream.pipe(res);
      } catch (_) { /* fallback a local */ }
    }

    // Fallback: servir el último logo subido localmente
    const fsSync = require('fs');
    const path = require('path');
    const dir = path.join(__dirname, '../uploads/company');
    if (!fsSync.existsSync(dir)) {
      return res.status(404).send('No logo');
    }
    const files = fsSync.readdirSync(dir)
      .filter(f => /^logo_/.test(f))
      .map(f => ({ f, t: fsSync.statSync(path.join(dir, f)).mtimeMs }))
      .sort((a, b) => b.t - a.t);
    if (files.length === 0) return res.status(404).send('No logo');
    res.sendFile(path.join(dir, files[0].f));
  } catch (error) {
    console.error('Error serving company logo:', error);
    res.status(500).send('Error');
  }
});

// PUT admin: actualiza campos y sube logo a Drive si se envía
router.put('/', authenticateToken, requireAdmin, upload.single('logo'), async (req, res) => {
  try {
    const { name, ruc, address, phone, website, support_email } = req.body;
    let logo_file_id = null, logo_view_url = null, logo_download_url = null;

    if (req.file) {
      const drive = require('../services/googleDriveOAuthService');
      // Si Drive está habilitado, subir; si no, conservar local
      if (drive && drive.enabled) {
        const folderId = await drive.ensureSubfolderForClaim('Configuración');
        const buffer = await fs.readFile(path.join(req.file.destination, req.file.filename));
        const info = await drive.uploadGenericBuffer(buffer, `logo_${req.file.originalname}`, req.file.mimetype, folderId);
        logo_file_id = info.fileId;
        logo_view_url = info.viewUrl;
        logo_download_url = info.downloadUrl;
      }
    }

    // Upsert
    const exists = await db.query('SELECT 1 FROM company_info WHERE id = 1');
    if (exists.length === 0) {
      await db.query(
        `INSERT INTO company_info (id, name, ruc, address, phone, website, support_email, logo_file_id, logo_view_url, logo_download_url) VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [name, ruc, address, phone, website, support_email, logo_file_id, logo_view_url, logo_download_url]
      );
    } else {
      await db.query(
        `UPDATE company_info SET 
          name = COALESCE(?, name),
          ruc = COALESCE(?, ruc),
          address = COALESCE(?, address),
          phone = COALESCE(?, phone),
          website = COALESCE(?, website),
          support_email = COALESCE(?, support_email),
          logo_file_id = COALESCE(?, logo_file_id),
          logo_view_url = COALESCE(?, logo_view_url),
          logo_download_url = COALESCE(?, logo_download_url),
          updated_at = CURRENT_TIMESTAMP
        WHERE id = 1`,
        [name, ruc, address, phone, website, support_email, logo_file_id, logo_view_url, logo_download_url]
      );
    }

    // Limpiar caché para forzar recarga
    await companyInfoService.refreshCache();
    
    const updatedCompanyInfo = await companyInfoService.getCompanyInfo();
    res.json({ success: true, data: updatedCompanyInfo });
  } catch (error) {
    console.error('Error updating company info:', error);
    res.status(500).json({ error: 'Error al actualizar la información de la empresa' });
  }
});

module.exports = router;