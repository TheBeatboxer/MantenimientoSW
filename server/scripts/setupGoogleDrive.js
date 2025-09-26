const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();
const googleDriveService = require('../services/googleDriveService');

async function setupGoogleDrive() {
  try {
    console.log('🔧 Configurando Google Drive...');
    
    // Verificar que existe el archivo de credenciales
    const credentialsPath = process.env.GOOGLE_DRIVE_CREDENTIALS_PATH || './credentials/google-drive-credentials.json';
    
    try {
      await fs.access(credentialsPath);
      console.log('✅ Archivo de credenciales encontrado');
    } catch (error) {
      console.log('❌ Archivo de credenciales no encontrado en:', credentialsPath);
      console.log('📝 Por favor, coloca tu archivo JSON de credenciales en:', credentialsPath);
      return false;
    }
    
    // Inicializar Google Drive Service
    const initialized = await googleDriveService.initialize();
    if (!initialized) {
      console.log('❌ No se pudo inicializar Google Drive Service');
      return false;
    }
    
    // Verificar o crear carpeta
    const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
    if (!folderId) {
      console.log('📁 Creando carpeta en Google Drive...');
      const folder = await googleDriveService.createFolder('Libro de Reclamaciones PDFs');
      console.log(`✅ Carpeta creada con ID: ${folder.id}`);
      console.log(`📝 Agrega esta línea a tu archivo .env:`);
      console.log(`GOOGLE_DRIVE_FOLDER_ID=${folder.id}`);
    } else {
      console.log('✅ Carpeta de Google Drive configurada');
    }
    
    // Obtener estadísticas de la carpeta
    try {
      const stats = await googleDriveService.getFolderStats();
      console.log('📊 Estadísticas de la carpeta:');
      console.log(`   - Total de archivos: ${stats.totalFiles}`);
      console.log(`   - Total de PDFs: ${stats.totalPDFs}`);
      console.log(`   - Tamaño total: ${stats.totalSizeMB} MB`);
    } catch (error) {
      console.log('⚠️  No se pudieron obtener estadísticas de la carpeta');
    }
    
    console.log('🎉 Google Drive configurado exitosamente');
    return true;
    
  } catch (error) {
    console.error('❌ Error configurando Google Drive:', error.message);
    return false;
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  setupGoogleDrive().then((success) => {
    process.exit(success ? 0 : 1);
  });
}

module.exports = setupGoogleDrive;
