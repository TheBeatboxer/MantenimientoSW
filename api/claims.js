const jwt = require('jsonwebtoken');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Simple validation
  const { consumer_name, consumer_lastname_p, consumer_lastname_m, document_type, document_number, phone, email, claim_type, detail, request } = req.body;

  if (!consumer_name || !consumer_lastname_p || !document_number || !claim_type || !detail) {
    return res.status(400).json({ error: 'Campos requeridos faltantes' });
  }

  // Mock claim creation
  const claimNumber = `RCL-${Date.now()}`;

  res.status(201).json({
    success: true,
    message: 'Reclamo creado exitosamente',
    data: {
      claim_number: claimNumber,
      id: Date.now(),
      pdf_url: `/api/claims/${Date.now()}/pdf`,
      email_sent: !!email
    }
  });
}
