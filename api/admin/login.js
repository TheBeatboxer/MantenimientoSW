const jwt = require('jsonwebtoken');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { username, password } = req.body;

  // Simple mock for demo - replace with real DB logic
  if (username === 'admin' && password === 'admin123') {
    const token = jwt.sign(
      { userId: 1, username: 'admin', role: 'admin' },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '8h' }
    );

    res.json({
      success: true,
      token,
      user: {
        id: 1,
        username: 'admin',
        email: 'admin@example.com',
        full_name: 'Administrator',
        role: 'admin'
      },
      csrfToken: 'dummy-csrf-token'
    });
  } else {
    res.status(401).json({ error: 'Credenciales inválidas' });
  }
}
