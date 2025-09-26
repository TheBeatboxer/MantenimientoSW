const googleDriveOAuthService = require('../services/googleDriveOAuthService');
require('dotenv').config();

async function setupGoogleDriveOAuth() {
  console.log('🔧 Configurando Google Drive OAuth...');
  
  try {
    // Verificar configuración
    console.log('📋 Verificando configuración...');
    console.log('GOOGLE_DRIVE_ENABLED:', process.env.GOOGLE_DRIVE_ENABLED);
    console.log('GOOGLE_DRIVE_FOLDER_ID:', process.env.GOOGLE_DRIVE_FOLDER_ID);
    console.log('GOOGLE_DRIVE_OAUTH_CREDENTIALS_PATH:', process.env.GOOGLE_DRIVE_OAUTH_CREDENTIALS_PATH);
    
    if (!process.env.GOOGLE_DRIVE_OAUTH_CREDENTIALS_PATH) {
      console.log('❌ GOOGLE_DRIVE_OAUTH_CREDENTIALS_PATH no está configurado en .env');
      console.log('📝 Agrega esta línea a tu archivo .env:');
      console.log('GOOGLE_DRIVE_OAUTH_CREDENTIALS_PATH=./credentials/oauth-credentials.json');
      return;
    }

    // Inicializar servicio
    const initialized = await googleDriveOAuthService.initialize();
    
    if (initialized) {
      console.log('✅ Google Drive OAuth configurado exitosamente');
      
      // Mostrar información de la carpeta
      const folderInfo = await googleDriveOAuthService.getFolderInfo();
      if (folderInfo) {
        console.log('📁 Carpeta configurada:', folderInfo.name);
        console.log('🔗 Enlace:', folderInfo.webViewLink);
      }
      
      // Listar archivos existentes
      const files = await googleDriveOAuthService.listFilesInFolder();
      console.log(`📊 Archivos en la carpeta: ${files.length}`);
      
    } else {
      console.log('⚠️  Google Drive OAuth requiere autorización');
      console.log('📝 Sigue las instrucciones que aparecieron arriba');
    }
    
  } catch (error) {
    console.error('❌ Error configurando Google Drive OAuth:', error.message);
  }
}

setupGoogleDriveOAuth();
