const bcrypt = require('bcryptjs');
const db = require('../config/database');
require('dotenv').config();

async function setupDatabase() {
  try {
    console.log('🔧 Configurando base de datos...');
    
    // Conectar a SQLite
    await db.connect();
    console.log('✅ Conexión a SQLite establecida');
    
    // Crear usuario administrador por defecto
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    
    const result = await db.query(`
      SELECT id FROM users_admin WHERE username = ?
    `, ['admin']);
    
    if (result.length === 0) {
      await db.query(`
        INSERT INTO users_admin (username, email, password_hash, full_name, role)
        VALUES (?, ?, ?, ?, ?)
      `, ['admin', 'admin@empresa.com', hashedPassword, 'Administrador Principal', 'admin']);
      
      console.log('✅ Usuario administrador creado');
      console.log('   Usuario: admin');
      console.log('   Contraseña: ' + adminPassword);
    } else {
      console.log('ℹ️  Usuario administrador ya existe');
    }
    
    // Crear directorios necesarios
    const fs = require('fs').promises;
    const path = require('path');
    const dirs = ['uploads', 'uploads/claims', 'uploads/pdfs', 'temp'];
    
    for (const dir of dirs) {
      try {
        await fs.mkdir(path.join(__dirname, '../', dir), { recursive: true });
        console.log(`✅ Directorio creado: ${dir}`);
      } catch (error) {
        if (error.code !== 'EEXIST') {
          console.log(`⚠️  Error creando directorio ${dir}:`, error.message);
        }
      }
    }
    
    console.log('🎉 Configuración completada exitosamente');
    
  } catch (error) {
    console.error('❌ Error en la configuración:', error);
    process.exit(1);
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  setupDatabase().then(() => {
    process.exit(0);
  });
}

module.exports = setupDatabase;
