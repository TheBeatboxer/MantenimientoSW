const jwt = require('jsonwebtoken');

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

  // Mock data for demo
  const mockClaims = [
    {
      id: 1,
      claim_number: 'RCL-001',
      date_created: '2024-01-15',
      status: 'pendiente',
      claim_type: 'reclamo',
      consumer_name: 'Juan',
      consumer_lastname_p: 'Pérez',
      consumer_lastname_m: 'García',
      document_number: '12345678',
      phone: '987654321',
      email: 'juan@example.com',
      reason: 'Producto defectuoso'
    }
  ];

  res.json({
    success: true,
    data: {
      claims: mockClaims,
      pagination: {
        current_page: 1,
        total_pages: 1,
        total_items: 1,
        items_per_page: 20,
        has_next: false,
        has_prev: false
      }
    }
  });
}
