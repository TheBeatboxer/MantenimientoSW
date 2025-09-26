const { google } = require('googleapis');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

async function authorizeOAuth(authCode) {
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

    // Intercambiar código por tokens
    const { tokens } = await oauth2Client.getToken(authCode);
    oauth2Client.setCredentials(tokens);

    // Guardar tokens
    const tokensPath = path.join(__dirname, '../credentials/oauth-tokens.json');
    await fs.writeFile(tokensPath, JSON.stringify(tokens, null, 2));
    
    console.log('✅ Tokens OAuth guardados exitosamente');
    console.log('�� Archivo guardado en:', tokensPath);
    
    // Probar conexión
    const drive = google.drive({ version: 'v3', auth: oauth2Client });
    const response = await drive.files.list({ pageSize: 1 });
    console.log('✅ Conexión a Google Drive verificada');
    
  } catch (error) {
    console.error('❌ Error autorizando OAuth:', error.message);
  }
}

const authCode = process.argv[2];
if (!authCode) {
  console.error('❌ Debes proporcionar el código de autorización');
  console.log('Uso: node scripts/authorizeOAuth.js [CODIGO_DE_AUTORIZACION]');
  process.exit(1);
}

authorizeOAuth(authCode);