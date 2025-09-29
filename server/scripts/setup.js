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
      // Update existing admin password
      await db.query(`
        UPDATE users_admin 
        SET password_hash = ?, email = ?, full_name = ?, role = ?
        WHERE username = ?
      `, [hashedPassword, 'admin@empresa.com', 'Administrador Principal', 'admin', 'admin']);
      
      console.log('✅ Contraseña del usuario administrador actualizada');
      console.log('   Usuario: admin');
      console.log('   Nueva Contraseña: ' + adminPassword);
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
    throw error;
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  setupDatabase()
    .then(async () => {
      await db.close();
      process.exit(0);
    })
    .catch(async (error) => {
      console.error('Error in setup:', error);
      await db.close();
      process.exit(1);
    });
}

module.exports = setupDatabase;
