// node scripts/generateAuthUrl.js
const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

const CREDS_PATH = path.resolve('./credentials/oauth-credentials.json');
const PORT = 5000;
const REDIRECT_URI = `http://localhost:${PORT}/auth/google/callback`;
const SCOPE = 'https://www.googleapis.com/auth/drive.file';

(function main() {
  const creds = JSON.parse(fs.readFileSync(CREDS_PATH, 'utf8'));
  const web = creds.web || creds.installed;
  const oAuth2 = new google.auth.OAuth2(web.client_id, web.client_secret, web.redirect_uris?.[0] || REDIRECT_URI);

  const url = oAuth2.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: [SCOPE],
    redirect_uri: web.redirect_uris?.[0] || REDIRECT_URI,
  });

  console.log('\n=== Copia y pega este enlace en tu navegador ===\n');
  console.log(url + '\n');
  console.log('Tras autorizar, copia TODO el valor de "code=" (lo que va antes de &scope=) y sigue con el Paso 2.\n');
})();
