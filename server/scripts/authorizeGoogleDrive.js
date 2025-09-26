const { google } = require('googleapis');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

async function authorizeGoogleDrive(authCode) {
  try {
    // Cargar credenciales OAuth
    const credentialsPath = process.env.GOOGLE_DRIVE_OAUTH_CREDENTIALS_PATH;
    if (!credentialsPath) {
      console.error('❌ GOOGLE_DRIVE_OAUTH_CREDENTIALS_PATH no está configurado en .env');
      return;
    }

    const credentials = await fs.readFile(credentialsPath, 'utf8');
    const credentialsData = JSON.parse(credentials);

    // Configurar OAuth2
    const oauth2Client = new google.auth.OAuth2(
      credentialsData.web.client_id,
      credentialsData.web.client_secret,
      credentialsData.web.redirect_uris[0]
    );

    // Intercambiar código por tokens
    const { tokens } = await oauth2Client.getToken(authCode);
    oauth2Client.setCredentials(tokens);

    // Guardar tokens
    const tokensPath = path.join(__dirname, '../credentials/oauth-tokens.json');
    await fs.writeFile(tokensPath, JSON.stringify(tokens, null, 2));

    console.log('✅ Autorización completada exitosamente');
    console.log('✅ Tokens guardados en:', tokensPath);
    console.log('🚀 Ahora puedes usar Google Drive con tu cuenta personal');

  } catch (error) {
    console.error('❌ Error en la autorización:', error.message);
  }
}

// Ejecutar si se proporciona código de autorización
const authCode = process.argv[2];
if (authCode) {
  authorizeGoogleDrive(authCode);
} else {
  console.log('❌ Uso: node scripts/authorizeGoogleDrive.js [CODIGO_DE_AUTORIZACION]');
  console.log('📝 Primero ejecuta: node scripts/setupGoogleDriveOAuth.js');
}
