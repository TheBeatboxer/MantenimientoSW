// node scripts/exchangeCodeAndSaveToken.js "<code>"
const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

const CODE_RAW = process.argv[2];
if (!CODE_RAW) {
  console.error('Uso: node scripts/exchangeCodeAndSaveToken.js "<code>"');
  process.exit(1);
}
const CODE = decodeURIComponent(CODE_RAW); // acepta %2F o /

const CREDS_PATH = path.resolve('./credentials/oauth-credentials.json');
const TOKEN_PATH = path.resolve('./credentials/google-drive-token.json');
const PORT = 5000;
const REDIRECT_URI = `http://localhost:${PORT}/auth/google/callback`;

(async () => {
  try {
    const creds = JSON.parse(fs.readFileSync(CREDS_PATH, 'utf8'));
    const web = creds.web || creds.installed;
    const redirect = web.redirect_uris?.[0] || REDIRECT_URI;

    const oAuth2 = new google.auth.OAuth2(web.client_id, web.client_secret, redirect);
    const { tokens } = await oAuth2.getToken({ code: CODE, redirect_uri: redirect });
    oAuth2.setCredentials(tokens);

    fs.mkdirSync(path.dirname(TOKEN_PATH), { recursive: true });
    fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens, null, 2), 'utf8');
    console.log('✅ Token guardado en:', TOKEN_PATH);

    console.log('Listo. Ya puedes usar la API de Drive con este token.');
  } catch (e) {
    console.error('❌ Error al canjear el code:', e.response?.data || e.message);
    console.error('Suele ser: code expirado/ya usado, redirect_uri distinto o reloj del sistema desfasado.');
    process.exit(1);
  }
})();
