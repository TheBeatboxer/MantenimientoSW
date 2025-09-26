const { google } = require('googleapis');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

class GoogleDriveOAuthService {
  constructor() {
    this.drive = null;
    this.folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
    // Soportar ambas variables de entorno para compatibilidad
    this.credentialsPath = process.env.GOOGLE_DRIVE_OAUTH_CREDENTIALS_PATH || process.env.GOOGLE_DRIVE_CREDENTIALS_PATH;
    // Acepta valores: true, TRUE, True, 1, yes. Si no está definida, queda deshabilitado (modo local por defecto).
    const enabledRaw = (process.env.GOOGLE_DRIVE_ENABLED ?? '').toString().trim();
    this.enabled = /^(true|1|yes)$/i.test(enabledRaw);
    this.tokensPath = path.join(process.cwd(), 'credentials/oauth-tokens.json');
    this.initialized = false;
    this.initializing = false;
  }

  async initialize() {
    if (!this.enabled) {
      console.log('Google Drive OAuth Service está deshabilitado por configuración.');
      return false;
    }

    try {
      // Cargar credenciales OAuth
      const credentials = await this.loadCredentials();
      if (!credentials) {
        console.log('❌ No se encontraron credenciales OAuth');
        return false;
      }

      // Configurar OAuth2
      const oauth2Client = new google.auth.OAuth2(
        credentials.web.client_id,
        credentials.web.client_secret,
        credentials.web.redirect_uris[0]
      );

      // Cargar tokens existentes
      const tokens = await this.loadTokens();
      if (tokens) {
        oauth2Client.setCredentials(tokens);
      } else {
        // Generar URL de autorización
        const authUrl = oauth2Client.generateAuthUrl({
          access_type: 'offline',
          scope: ['https://www.googleapis.com/auth/drive.file']
        });
        
        console.log('🔗 Autoriza la aplicación visitando esta URL:');
        console.log(authUrl);
        console.log('\n📝 Después de autorizar, copia el código de autorización y ejecuta:');
        console.log('node scripts/authorizeGoogleDrive.js [CODIGO_DE_AUTORIZACION]');
        
        return false;
      }

      // Inicializar Google Drive API
      this.drive = google.drive({ version: 'v3', auth: oauth2Client });

      // Asegurar carpeta (por ID o por nombre)
      await this.ensureFolder();

      console.log('✅ Google Drive OAuth Service inicializado correctamente');
      return true;
    } catch (error) {
      console.error('❌ Error inicializando Google Drive OAuth Service:', error.message);
      return false;
    }
  }

  /**
   * Asegura que this.folderId apunte a una carpeta válida.
   * - Si existe GOOGLE_DRIVE_FOLDER_ID intenta verificarla.
   * - Si falla o no existe, intenta resolver por nombre (GOOGLE_DRIVE_FOLDER_NAME).
   * - Si no existe por nombre, la crea en Mi unidad.
   */
  async ensureFolder() {
    const desiredName = process.env.GOOGLE_DRIVE_FOLDER_NAME || 'Libro de Reclamaciones PDFs';

    // 1) Si hay folderId configurado, intentar verificarlo
    if (this.folderId) {
      try {
        await this.verifyFolder();
        return;
      } catch (_) {
        console.warn('⚠️  El GOOGLE_DRIVE_FOLDER_ID configurado no es válido o no es accesible. Se intentará por nombre.');
      }
    }

    // 2) Intentar encontrar por nombre en Mi unidad o en todas las unidades
    const listResp = await this.drive.files.list({
      q: `mimeType='application/vnd.google-apps.folder' and name='${desiredName.replace(/'/g, "\\'")}'`,
      fields: 'files(id,name,webViewLink)',
      includeItemsFromAllDrives: true,
      supportsAllDrives: true,
      spaces: 'drive'
    });

    const folders = listResp.data.files || [];
    if (folders.length > 0) {
      this.folderId = folders[0].id;
      console.log(`✅ Carpeta encontrada por nombre: ${folders[0].name} (ID: ${this.folderId})`);
      return;
    }

    // 3) Crear la carpeta si no existe
    const createResp = await this.drive.files.create({
      resource: {
        name: desiredName,
        mimeType: 'application/vnd.google-apps.folder'
      },
      fields: 'id,name,webViewLink',
      supportsAllDrives: true
    });

    this.folderId = createResp.data.id;
    console.log(`✅ Carpeta creada: ${createResp.data.name} (ID: ${this.folderId})`);
  }

  async loadCredentials() {
    try {
      if (!this.credentialsPath) {
        console.log('❌ GOOGLE_DRIVE_OAUTH_CREDENTIALS_PATH no está configurado');
        return null;
      }

      const credentialsPath = path.resolve(this.credentialsPath);
      const credentials = await fs.readFile(credentialsPath, 'utf8');
      return JSON.parse(credentials);
    } catch (error) {
      console.error('❌ Error cargando credenciales OAuth:', error.message);
      return null;
    }
  }

  async loadTokens() {
    try {
      const tokens = await fs.readFile(this.tokensPath, 'utf8');
      return JSON.parse(tokens);
    } catch (error) {
      return null;
    }
  }

  async saveTokens(tokens) {
    try {
      await fs.writeFile(this.tokensPath, JSON.stringify(tokens, null, 2));
      console.log('✅ Tokens OAuth guardados');
    } catch (error) {
      console.error('❌ Error guardando tokens:', error.message);
    }
  }

  async verifyFolder() {
    if (!this.folderId) {
      throw new Error('GOOGLE_DRIVE_FOLDER_ID no está configurado');
    }

    try {
      console.log(`🔍 Intentando verificar carpeta con ID: ${this.folderId}`);
      const response = await this.drive.files.get({
        fileId: this.folderId,
        // Incluir mimeType y shortcutDetails para resolver atajos
        fields: 'id,name,mimeType,webViewLink,shortcutDetails/targetId',
        supportsAllDrives: true
      });

      // Si el ID recibido corresponde a un acceso directo, usar el destino real
      if (response.data.mimeType === 'application/vnd.google-apps.shortcut' && response.data.shortcutDetails?.targetId) {
        const targetId = response.data.shortcutDetails.targetId;
        console.log(`ℹ️ El ID corresponde a un acceso directo. Usando el destino real: ${targetId}`);
        this.folderId = targetId;
        // Reconsultar la carpeta real
        const resolved = await this.drive.files.get({
          fileId: this.folderId,
          fields: 'id,name,mimeType,webViewLink',
          supportsAllDrives: true
        });
        console.log(`✅ Carpeta verificada: ${resolved.data.name}`);
        return resolved.data;
      }

      console.log(`✅ Carpeta verificada: ${response.data.name}`);
      return response.data;
    } catch (error) {
      console.error('❌ Error verificando carpeta:', error.message);
      console.error('❌ Detalles del error:', error);
      throw error;
    }
  }

  async ensureInitialized() {
    if (this.initialized) return true;
    if (this.initializing) {
      // Wait for ongoing initialization
      while (this.initializing) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      return this.initialized;
    }

    this.initializing = true;
    try {
      const result = await this.initialize();
      this.initialized = result;
      return result;
    } finally {
      this.initializing = false;
    }
  }

  async uploadPDF(pdfBuffer, fileName, claimNumber) {
    if (!await this.ensureInitialized()) {
      throw new Error('Google Drive OAuth no está inicializado');
    }

    try {
      // Crear metadatos del archivo
      const fileMetadata = {
        name: fileName,
        parents: [this.folderId]
      };

      // Crear un stream desde el buffer
      const { Readable } = require('stream');
      const stream = new Readable();
      stream.push(pdfBuffer);
      stream.push(null);

      // Crear el archivo en Google Drive
      const response = await this.drive.files.create({
        resource: fileMetadata,
        media: {
          mimeType: 'application/pdf',
          body: stream
        },
        fields: 'id,name,webViewLink,webContentLink',
        supportsAllDrives: true
      });

      const fileId = response.data.id;
      const webViewLink = response.data.webViewLink;
      const webContentLink = response.data.webContentLink;

      // Hacer el archivo accesible públicamente para descarga
      try {
        await this.drive.permissions.create({
          fileId: fileId,
          requestBody: { 
            role: 'reader', 
            type: 'anyone' 
          },
          supportsAllDrives: true
        });
        console.log(`✅ Permisos públicos establecidos para: ${fileName}`);
      } catch (permissionError) {
        console.warn('⚠️ No se pudieron establecer permisos públicos:', permissionError.message);
      }

      console.log(`✅ PDF subido a Google Drive: ${fileName} (ID: ${fileId})`);

      return {
        fileId,
        fileName,
        webViewLink,
        webContentLink,
        downloadUrl: `https://drive.google.com/uc?export=download&id=${fileId}`,
        viewUrl: webViewLink
      };
    } catch (error) {
      console.error('❌ Error subiendo PDF a Google Drive:', error.message);
      throw new Error(`Error subiendo PDF a Google Drive: ${error.message}`);
    }
  }

  async downloadPDF(fileId) {
    if (!await this.ensureInitialized()) {
      throw new Error('Google Drive OAuth no está inicializado');
    }

    try {
      console.log('🔍 Descargando PDF con ID:', fileId);
      
      const response = await this.drive.files.get({
        fileId: fileId,
        alt: 'media',
        supportsAllDrives: true
      }, {
        responseType: 'stream'
      });

      console.log('✅ PDF descargado exitosamente');
      return response.data;
    } catch (error) {
      console.error('❌ Error descargando PDF:', error.message);
      console.error('❌ Detalles del error:', error);
      throw new Error(`Error descargando PDF: ${error.message}`);
    }
  }

  async ensureSubfolderForClaim(claimNumber) {
    if (!await this.ensureInitialized()) {
      throw new Error('Google Drive OAuth no está inicializado');
    }
    const safeName = `Reclamo ${claimNumber}`;
    const list = await this.drive.files.list({
      q: `'${this.folderId}' in parents and mimeType='application/vnd.google-apps.folder' and name='${safeName.replace(/'/g, "\\'")}'`,
      fields: 'files(id,name)',
      includeItemsFromAllDrives: true,
      supportsAllDrives: true
    });
    if (list.data.files && list.data.files.length > 0) {
      return list.data.files[0].id;
    }
    const created = await this.drive.files.create({
      resource: {
        name: safeName,
        mimeType: 'application/vnd.google-apps.folder',
        parents: [this.folderId]
      },
      fields: 'id,name',
      supportsAllDrives: true
    });
    return created.data.id;
  }

  async uploadGenericBuffer(buffer, fileName, mimeType, parentFolderId) {
    if (!await this.ensureInitialized()) {
      throw new Error('Google Drive OAuth no está inicializado');
    }
    const { Readable } = require('stream');
    const stream = new Readable();
    stream.push(buffer);
    stream.push(null);
    const response = await this.drive.files.create({
      resource: {
        name: fileName,
        parents: parentFolderId ? [parentFolderId] : (this.folderId ? [this.folderId] : undefined)
      },
      media: { mimeType, body: stream },
      fields: 'id,name,webViewLink,webContentLink',
      supportsAllDrives: true
    });
    const id = response.data.id;
    // Hacer el archivo accesible por enlace
    try {
      await this.drive.permissions.create({
        fileId: id,
        requestBody: { role: 'reader', type: 'anyone' },
        supportsAllDrives: true
      });
    } catch (_) { /* ignore permission errors */ }
    return {
      fileId: id,
      viewUrl: `https://drive.google.com/uc?export=view&id=${id}`,
      downloadUrl: `https://drive.google.com/uc?export=download&id=${id}`
    };
  }

  async getFolderInfo() {
    if (!this.drive || !this.folderId) {
      return null;
    }

    try {
      const response = await this.drive.files.get({
        fileId: this.folderId,
        fields: 'id,name,webViewLink,size',
        supportsAllDrives: true
      });

      return response.data;
    } catch (error) {
      console.error('❌ Error obteniendo información de carpeta:', error.message);
      return null;
    }
  }

  async listFilesInFolder() {
    if (!this.drive || !this.folderId) {
      return [];
    }

    try {
      const response = await this.drive.files.list({
        q: `'${this.folderId}' in parents and mimeType='application/pdf'`,
        fields: 'files(id,name,size,createdTime,webViewLink)',
        orderBy: 'createdTime desc',
        supportsAllDrives: true,
        includeItemsFromAllDrives: true
      });

      return response.data.files || [];
    } catch (error) {
      console.error('❌ Error listando archivos:', error.message);
      return [];
    }
  }

  async downloadFile(fileId) {
    if (!this.drive) {
      throw new Error('Google Drive OAuth no está inicializado');
    }

    try {
      const response = await this.drive.files.get({
        fileId: fileId,
        alt: 'media',
        supportsAllDrives: true
      }, {
        responseType: 'stream'
      });

      return new Promise((resolve, reject) => {
        const chunks = [];
        response.data.on('data', (chunk) => chunks.push(chunk));
        response.data.on('end', () => resolve(Buffer.concat(chunks)));
        response.data.on('error', reject);
      });
    } catch (error) {
      console.error('❌ Error descargando archivo de Google Drive:', error.message);
      throw new Error(`Error descargando archivo de Google Drive: ${error.message}`);
    }
  }
}

module.exports = new GoogleDriveOAuthService();