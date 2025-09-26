const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs').promises;
const moment = require('moment');
const googleDriveService = require('./googleDriveOAuthService');
const db = require('../config/database');
const companyInfoService = require('./companyInfoService');

class PDFService {
  constructor() {
    this.templatePath = path.join(__dirname, '../templates/claim-template.html');
  }

  async getCompanyInfo() {
    return await companyInfoService.getCompanyInfo();
  }

  async generateClaimPDF(claimData, files = []) {
    try {
      // Leer la plantilla HTML
      const template = await fs.readFile(this.templatePath, 'utf8');
      
      // Generar el HTML con los datos del reclamo
      const html = await this.generateHTML(template, claimData, files);
      
      // Configurar Puppeteer
      const browser = await puppeteer.launch({
        headless: true,
        executablePath: '/usr/bin/chromium-browser',
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage'
        ]
      });
      
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'networkidle0' });
      
      // Generar PDF
      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '20mm',
          right: '15mm',
          bottom: '20mm',
          left: '15mm'
        }
      });
      
      await browser.close();
      
      return pdfBuffer;
    } catch (error) {
      console.error('Error generating PDF:', error);
      throw new Error('Error al generar el PDF del reclamo');
    }
  }

  async generateHTML(template, claimData, files) {
    // Obtener información de empresa desde la base de datos
    const company = await this.getCompanyInfo();
    const {
      claim_number,
      date_created,
      consumer_name,
      consumer_lastname_p,
      consumer_lastname_m,
      document_type,
      document_number,
      phone,
      email,
      address,
      department,
      province,
      district,
      communication_medium,
      relationship_with_company,
      claim_type,
      product_service_type,
      currency,
      amount,
      reason,
      detail,
      request
    } = claimData;

    const fullName = `${consumer_name} ${consumer_lastname_p} ${consumer_lastname_m}`;
    const fullAddress = `${address}, ${district}, ${province}, ${department}`;
    const formattedDate = moment(date_created).utcOffset(-3).format('DD/MM/YYYY');
    const formattedTime = moment(date_created).utcOffset(-3).format('HH:mm:ss');

    const publicBase = process.env.PUBLIC_BASE_URL || 'http://localhost:5001';
    const logoUrl = `${publicBase}/api/company-info/logo`;
    
    console.log('📋 Información de la empresa para PDF:', company);
    
    return template
      .replace(/{{COMPANY_NAME}}/g, company.name || 'BÍOMACRUZ')
      .replace(/{{COMPANY_RUC}}/g, company.ruc || '20872828607')
      .replace(/{{COMPANY_ADDRESS}}/g, company.address || 'Parque Bella')
      .replace(/{{COMPANY_PHONE}}/g, company.phone || '960576738')
      .replace(/{{COMPANY_WEBSITE}}/g, company.website || 'SITECH.SITE.COM')
      .replace(/{{COMPANY_SUPPORT_EMAIL}}/g, company.support_email || 'sitechsolutions25@gmail.com')
      .replace(/{{COMPANY_LOGO_URL}}/g, logoUrl)
      .replace(/{{CLAIM_NUMBER}}/g, claim_number)
      .replace(/{{DATE}}/g, formattedDate)
      .replace(/{{TIME}}/g, formattedTime)
      .replace(/{{FULL_NAME}}/g, fullName)
      .replace(/{{DOCUMENT_TYPE}}/g, document_type)
      .replace(/{{DOCUMENT_NUMBER}}/g, document_number)
      .replace(/{{PHONE}}/g, phone)
      .replace(/{{EMAIL}}/g, email || 'No proporcionado')
      .replace(/{{ADDRESS}}/g, fullAddress)
      .replace(/{{COMMUNICATION_MEDIUM}}/g, communication_medium)
      .replace(/{{RELATIONSHIP}}/g, relationship_with_company || 'No especificado')
      .replace(/{{CLAIM_TYPE}}/g, claim_type ? claim_type.toUpperCase() : 'NO ESPECIFICADO')
      .replace(/{{PRODUCT_SERVICE_TYPE}}/g, product_service_type || 'No especificado')
      .replace(/{{CURRENCY}}/g, currency || 'PEN')
      .replace(/{{AMOUNT}}/g, amount ? parseFloat(amount).toFixed(2) : 'No especificado')
      .replace(/{{REASON}}/g, reason)
      .replace(/{{DETAIL}}/g, detail)
      .replace(/{{REQUEST}}/g, request || 'No especificado')
      .replace(/{{FILES_COUNT}}/g, files.length.toString())
      .replace(/{{FILES_LIST}}/g, await this.generateFilesList(files));
  }

  async generateFilesList(files) {
    if (files.length === 0) {
      return '<p>No se adjuntaron archivos.</p>';
    }

    let filesList = '<div style="margin-top: 15px;">';
    
    for (const file of files) {
      const isImage = file.mime_type && file.mime_type.startsWith('image/');
      
      if (isImage) {
        try {
          // Convertir imagen a base64 para incluirla en el PDF
          const imageBase64 = await this.getImageAsBase64(file);
          
          filesList += `
            <div style="margin-bottom: 15px; page-break-inside: avoid;">
              <p><strong>${file.original_name}</strong> (${this.formatFileSize(file.file_size)})</p>
              <img src="data:${file.mime_type};base64,${imageBase64}" 
                   style="max-width: 100%; max-height: 300px; border: 1px solid #ddd; border-radius: 4px;" 
                   alt="${file.original_name}" />
            </div>
          `;
        } catch (error) {
          console.error('Error procesando imagen:', error);
          // Fallback: mostrar solo el nombre del archivo
          filesList += `<p><strong>${file.original_name}</strong> (${this.formatFileSize(file.file_size)}) - Error al cargar imagen</p>`;
        }
      } else {
        // Mostrar como lista para documentos
        filesList += `<p><strong>${file.original_name}</strong> (${this.formatFileSize(file.file_size)})</p>`;
      }
    }
    filesList += '</div>';

    return filesList;
  }

  async getImageAsBase64(file) {
    try {
      // Si el archivo tiene una ruta local, leerlo directamente
      if (file.file_path) {
        // Verificar si la ruta ya es absoluta o relativa
        const fullPath = path.isAbsolute(file.file_path) 
          ? file.file_path 
          : path.join(__dirname, '../', file.file_path);
        
        console.log('🔍 Archivo original:', file);
        console.log('🔍 Ruta del archivo:', file.file_path);
        console.log('🔍 Ruta absoluta calculada:', fullPath);
        const imageBuffer = await fs.readFile(fullPath);
        return imageBuffer.toString('base64');
      }
      
      // Si tiene una URL externa, intentar descargarla
      if (file.download_url || file.view_url) {
        const https = require('https');
        const http = require('http');
        const url = require('url');
        
        return new Promise((resolve, reject) => {
          const imageUrl = file.download_url || file.view_url;
          const parsedUrl = url.parse(imageUrl);
          const client = parsedUrl.protocol === 'https:' ? https : http;
          
          client.get(imageUrl, (response) => {
            if (response.statusCode !== 200) {
              reject(new Error(`HTTP ${response.statusCode}`));
              return;
            }
            
            const chunks = [];
            response.on('data', chunk => chunks.push(chunk));
            response.on('end', () => {
              const buffer = Buffer.concat(chunks);
              resolve(buffer.toString('base64'));
            });
          }).on('error', reject);
        });
      }
      
      throw new Error('No se encontró ruta de archivo ni URL');
    } catch (error) {
      console.error('Error convirtiendo imagen a base64:', error);
      throw error;
    }
  }

  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  async savePDF(pdfBuffer, claimNumber) {
    try {
      const fileName = `reclamo_${claimNumber}_${Date.now()}.pdf`;
      
      // Verificar si Google Drive está habilitado
      console.log('🔍 Verificando Google Drive:', {
        enabled: process.env.GOOGLE_DRIVE_ENABLED,
        folderId: process.env.GOOGLE_DRIVE_FOLDER_ID
      });
      
      if (process.env.GOOGLE_DRIVE_ENABLED === 'true') {
        try {
          console.log('📤 Subiendo PDF a Google Drive...');
          // Subir a Google Drive
          const driveResult = await googleDriveService.uploadPDF(pdfBuffer, fileName, claimNumber);
          console.log('✅ PDF subido a Google Drive exitosamente:', driveResult.fileId);
          
          return {
            fileName,
            storage: 'google_drive',
            fileId: driveResult.fileId,
            downloadUrl: driveResult.downloadUrl,
            viewUrl: driveResult.viewUrl,
            webViewLink: driveResult.webViewLink
          };
        } catch (driveError) {
          console.error('❌ Error subiendo a Google Drive, guardando localmente:', driveError.message);
          console.error('❌ Detalles del error:', driveError);
          // Fallback a almacenamiento local
        }
      }
      
      // Almacenamiento local (fallback o por defecto)
      console.log('💾 Guardando PDF localmente...');
      const uploadsDir = path.join(__dirname, '../uploads/pdfs');
      await fs.mkdir(uploadsDir, { recursive: true });
      
      const filePath = path.join(uploadsDir, fileName);
      await fs.writeFile(filePath, pdfBuffer);
      console.log('✅ PDF guardado localmente:', filePath);
      
      return {
        fileName,
        storage: 'local',
        filePath,
        relativePath: `uploads/pdfs/${fileName}`
      };
    } catch (error) {
      console.error('Error saving PDF:', error);
      throw new Error('Error al guardar el PDF');
    }
  }
}

module.exports = new PDFService();
