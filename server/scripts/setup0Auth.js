const { google } = require('googleapis');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

async function setupOAuth() {
  try {
    // Cargar credenciales
    const credentialsPath = path.resolve(process.env.GOOGLE_DRIVE_OAUTH_CREDENTIALS_PATH);
    const credentials = JSON.parse(await fs.readFile(credentialsPath, 'utf8'));
    
    // Configurar OAuth2
    const oauth2Client = new google.auth.OAuth2(
      credentials.web.client_id,
      credentials.web.client_secret,
      credentials.web.redirect_uris[0]
    );

    // Generar URL de autorización
    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: ['https://www.googleapis.com/auth/drive.file'],
      prompt: 'consent'
    });

    console.log('�� Autoriza la aplicación visitando esta URL:');
    console.log(authUrl);
    console.log('\n�� Después de autorizar, copia el código de autorización y ejecuta:');
    console.log('node scripts/authorizeOAuth.js [CODIGO_DE_AUTORIZACION]');
    
  } catch (error) {
    console.error('❌ Error configurando OAuth:', error.message);
  }
}

setupOAuth();