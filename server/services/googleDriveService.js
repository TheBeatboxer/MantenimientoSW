const { google } = require('googleapis');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

class GoogleDriveService {
  constructor() {
    this.drive = null;
    this.folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
    this.credentialsPath = process.env.GOOGLE_DRIVE_CREDENTIALS_PATH;
    this.isEnabled = process.env.GOOGLE_DRIVE_ENABLED === 'true';
  }

  async initialize() {
    if (!this.isEnabled) {
      console.log('Google Drive está deshabilitado');
      return false;
    }

    try {
      // Verificar que existe el archivo de credenciales
      await fs.access(this.credentialsPath);
      
      // Configurar autenticación
      const auth = new google.auth.GoogleAuth({
        keyFile: this.credentialsPath,
        scopes: ['https://www.googleapis.com/auth/drive']
      });

      // Crear instancia de Google Drive
      this.drive = google.drive({ version: 'v3', auth });

      // Verificar que la carpeta existe
      if (this.folderId) {
        await this.verifyFolder();
      }

      console.log('✅ Google Drive Service inicializado correctamente');
      return true;
    } catch (error) {
      console.error('❌ Error inicializando Google Drive Service:', error.message);
      return false;
    }
  }

  async verifyFolder() {
    try {
      const response = await this.drive.files.get({
        fileId: this.folderId,
        fields: 'id,name,mimeType'
      });

      if (response.data.mimeType !== 'application/vnd.google-apps.folder') {
        throw new Error('El ID proporcionado no corresponde a una carpeta');
      }

      console.log(`✅ Carpeta verificada: ${response.data.name}`);
      return true;
    } catch (error) {
      console.error('❌ Error verificando carpeta:', error.message);
      throw error;
    }
  }

  async uploadPDF(pdfBuffer, fileName, claimNumber) {
    if (!this.isEnabled || !this.drive) {
      throw new Error('Google Drive no está configurado o habilitado');
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
        fields: 'id,name,webViewLink,webContentLink'
      });

      const fileId = response.data.id;
      const webViewLink = response.data.webViewLink;
      const webContentLink = response.data.webContentLink;

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
    if (!this.isEnabled || !this.drive) {
      throw new Error('Google Drive no está configurado o habilitado');
    }

    try {
      const response = await this.drive.files.get({
        fileId: fileId,
        alt: 'media'
      }, {
        responseType: 'stream'
      });

      return response.data;
    } catch (error) {
      console.error('❌ Error descargando PDF de Google Drive:', error.message);
      throw new Error(`Error descargando PDF de Google Drive: ${error.message}`);
    }
  }

  async deletePDF(fileId) {
    if (!this.isEnabled || !this.drive) {
      throw new Error('Google Drive no está configurado o habilitado');
    }

    try {
      await this.drive.files.delete({
        fileId: fileId
      });

      console.log(`✅ PDF eliminado de Google Drive: ${fileId}`);
      return true;
    } catch (error) {
      console.error('❌ Error eliminando PDF de Google Drive:', error.message);
      throw new Error(`Error eliminando PDF de Google Drive: ${error.message}`);
    }
  }

  async listPDFs() {
    if (!this.isEnabled || !this.drive) {
      throw new Error('Google Drive no está configurado o habilitado');
    }

    try {
      const response = await this.drive.files.list({
        q: `'${this.folderId}' in parents and mimeType='application/pdf'`,
        fields: 'files(id,name,createdTime,size,webViewLink)',
        orderBy: 'createdTime desc'
      });

      return response.data.files;
    } catch (error) {
      console.error('❌ Error listando PDFs de Google Drive:', error.message);
      throw new Error(`Error listando PDFs de Google Drive: ${error.message}`);
    }
  }

  async getFileInfo(fileId) {
    if (!this.isEnabled || !this.drive) {
      throw new Error('Google Drive no está configurado o habilitado');
    }

    try {
      const response = await this.drive.files.get({
        fileId: fileId,
        fields: 'id,name,size,createdTime,modifiedTime,webViewLink,webContentLink'
      });

      return response.data;
    } catch (error) {
      console.error('❌ Error obteniendo información del archivo:', error.message);
      throw new Error(`Error obteniendo información del archivo: ${error.message}`);
    }
  }

  // Método para crear la carpeta si no existe
  async createFolder(folderName = 'Libro de Reclamaciones PDFs') {
    if (!this.isEnabled || !this.drive) {
      throw new Error('Google Drive no está configurado o habilitado');
    }

    try {
      const fileMetadata = {
        name: folderName,
        mimeType: 'application/vnd.google-apps.folder'
      };

      const response = await this.drive.files.create({
        resource: fileMetadata,
        fields: 'id,name'
      });

      console.log(`✅ Carpeta creada en Google Drive: ${folderName} (ID: ${response.data.id})`);
      return response.data;
    } catch (error) {
      console.error('❌ Error creando carpeta en Google Drive:', error.message);
      throw new Error(`Error creando carpeta en Google Drive: ${error.message}`);
    }
  }

  // Método para obtener estadísticas de la carpeta
  async getFolderStats() {
    if (!this.isEnabled || !this.drive) {
      throw new Error('Google Drive no está configurado o habilitado');
    }

    try {
      const response = await this.drive.files.list({
        q: `'${this.folderId}' in parents`,
        fields: 'files(id,name,mimeType,size,createdTime)'
      });

      const files = response.data.files;
      const pdfs = files.filter(file => file.mimeType === 'application/pdf');
      
      const totalSize = pdfs.reduce((sum, file) => sum + (parseInt(file.size) || 0), 0);

      return {
        totalFiles: files.length,
        totalPDFs: pdfs.length,
        totalSize: totalSize,
        totalSizeMB: Math.round(totalSize / (1024 * 1024) * 100) / 100
      };
    } catch (error) {
      console.error('❌ Error obteniendo estadísticas de la carpeta:', error.message);
      throw new Error(`Error obteniendo estadísticas de la carpeta: ${error.message}`);
    }
  }
}

module.exports = new GoogleDriveService();
