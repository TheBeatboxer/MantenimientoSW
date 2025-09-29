const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const db = require('../../server/config/database');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

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
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '8h' }
    );

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
      csrfToken: require('crypto').randomBytes(32).toString('hex')
    });

  } catch (error) {
    console.error('Error in admin login:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}
