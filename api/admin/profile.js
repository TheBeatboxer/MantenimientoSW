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
  if (!user) {
    return res.status(401).json({ error: 'Token inválido' });
  }

  res.json({
    success: true,
    user: {
      id: user.userId,
      username: user.username,
      role: user.role
    }
  });
}
