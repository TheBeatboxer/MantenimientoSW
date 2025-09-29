const jwt = require('jsonwebtoken');
const db = require('../../server/config/database');

function authenticateToken(req) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return null;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    return decoded;
  } catch (err) {
    return null;
  }
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const user = authenticateToken(req);
  if (!user || user.role !== 'admin') {
    return res.status(401).json({ error: 'No autorizado' });
  }

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
}
