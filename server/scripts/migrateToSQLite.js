const fs = require('fs').promises;
const path = require('path');
const db = require('../config/database');
require('dotenv').config();

async function migrateToSQLite() {
  try {
    console.log('🚀 Iniciando migración a SQLite...');
    
    // Conectar a SQLite
    await db.connect();
    console.log('✅ Conectado a SQLite');
    
    // Crear directorio de base de datos si no existe
    const dbDir = path.dirname(process.env.DB_PATH || './database/libro_reclamaciones.db');
    await fs.mkdir(dbDir, { recursive: true });
    console.log('✅ Directorio de base de datos creado');
    
    // Leer y ejecutar schema
    const schemaPath = path.join(__dirname, '../database/schema.sql');
    const schema = await fs.readFile(schemaPath, 'utf8');
    
    console.log('📋 Ejecutando schema completo...');
    await db.exec(schema);
    
    console.log('✅ Schema ejecutado exitosamente');
    
    // Verificar que las tablas se crearon
    const tables = await db.query(
      "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"
    );
    
    console.log('📊 Tablas creadas:');
    tables.forEach(table => {
      console.log(`  - ${table.name}`);
    });
    
    console.log('🎉 Migración a SQLite completada exitosamente!');
    
  } catch (error) {
    console.error('❌ Error en la migración:', error);
    throw error;
  } finally {
    await db.close();
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  migrateToSQLite()
    .then(() => {
      console.log('✅ Script de migración completado');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Error en script de migración:', error);
      process.exit(1);
    });
}

module.exports = migrateToSQLite;
