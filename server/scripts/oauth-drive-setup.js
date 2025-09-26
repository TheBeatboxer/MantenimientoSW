// node scripts/oauth-drive-setup.js
const fs = require('fs');
const path = require('path');
const express = require('express');
const open = require('open');
const { google } = require('googleapis');

const CREDS_PATH = path.resolve('./credentials/oauth-credentials.json');
const TOKEN_PATH = path.resolve('./credentials/google-drive-token.json');
const PORT = 5000;
const REDIRECT_PATH = '/auth/google/callback';

(async () => {
  // 1) Cargar credenciales
  if (!fs.existsSync(CREDS_PATH)) {
    console.error('No existe ./credentials/oauth-credentials.json');
    process.exit(1);
  }
  const creds = JSON.parse(fs.readFileSync(CREDS_PATH, 'utf8'));
  const web = creds.web || creds.installed;
  const clientId = web.client_id;
  const clientSecret = web.client_secret;
  const redirectUri = web.redirect_uris?.[0] || `http://localhost:${PORT}${REDIRECT_PATH}`;

  // 2) Instanciar OAuth2
  const oAuth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);

  // 3) Generar URL de consentimiento (siempre offline + prompt=consent)
  const scope = process.env.GDRIVE_SCOPE || 'https://www.googleapis.com/auth/drive.file';
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: [scope],
    redirect_uri: redirectUri,
  });

  // 4) Server para recibir el code y canjearlo por tokens
  const app = express();
  const server = app.listen(PORT, () => {
    console.log(`Servidor escuchando en http://localhost:${PORT}`);
    console.log('Abriendo navegador para autorizar...');
    open(authUrl);
  });

  app.get(REDIRECT_PATH, async (req, res) => {
    try {
      const { code, error } = req.query;
      if (error) throw new Error(String(error));
      if (!code) throw new Error('No llegó el parámetro "code".');

      // Intercambio code -> tokens (IMPORTANTE: usar el mismo redirect_uri)
      const { tokens } = await oAuth2Client.getToken({ code, redirect_uri: redirectUri });
      oAuth2Client.setCredentials(tokens);

      fs.mkdirSync(path.dirname(TOKEN_PATH), { recursive: true });
      fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens, null, 2), 'utf8');

      // Verificación opcional: carpeta
      const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
      if (folderId) {
        const drive = google.drive({ version: 'v3', auth: oAuth2Client });
        const { data } = await drive.files.get({
          fileId: folderId,
          fields: 'id,name,mimeType,driveId',
          supportsAllDrives: true,
        });
        if (data.mimeType !== 'application/vnd.google-apps.folder') {
          throw new Error('El ID no corresponde a una carpeta.');
        }
        console.log(`📁 Carpeta OK: ${data.name} (${data.id}) ${data.driveId ? '[Unidad compartida]' : ''}`);
      } else {
        console.log('ℹ️ Define GOOGLE_DRIVE_FOLDER_ID para verificar carpeta');
      }

      res.send('<h3>✅ Autorización completada. Puedes cerrar esta pestaña.</h3>');
    } catch (e) {
      console.error('❌ Error al intercambiar el code:', e.message);
      res.status(500).send(`<h3>Error: ${e.message}</h3>`);
    } finally {
      setTimeout(() => server.close(), 500);
    }
  });
})();
