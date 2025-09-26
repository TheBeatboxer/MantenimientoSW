const nodemailer = require('nodemailer');
const path = require('path');
const db = require('../config/database');

class EmailService {
  constructor() {
    this.enabled = process.env.EMAIL_ENABLED !== 'false' && process.env.EMAIL_USER && process.env.EMAIL_PASS;
    
    if (this.enabled) {
      this.transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        secure: false, // true para 465, false para otros puertos
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        }
      });
    } else {
      console.log('⚠️ Servicio de email deshabilitado - configurar EMAIL_USER y EMAIL_PASS');
    }
  }

  async getCompanyInfo() {
    try {
      const rows = await db.query('SELECT * FROM company_info WHERE id = 1');
      console.log('🔍 Datos de empresa desde BD:', rows);
      const companyData = rows.length > 0 ? rows[0] : {
        name: 'BÍOMACRUZ',
        ruc: '20872828607',
        address: 'Parque Bella',
        phone: '960576738',
        website: 'SITECH.SITE.COM',
        support_email: 'sitechsolutions25@gmail.com'
      };
      console.log('📋 Datos de empresa a usar:', companyData);
      return companyData;
    } catch (error) {
      console.error('Error obteniendo información de la empresa:', error);
      return {
        name: 'BÍOMACRUZ',
        ruc: '20872828607',
        address: 'Parque Bella',
        phone: '960576738',
        website: 'SITECH.SITE.COM',
        support_email: 'sitechsolutions25@gmail.com'
      };
    }
  }

  async sendClaimConfirmation(email, claimData, pdfPath, pdfBuffer) {
    if (!this.enabled) {
      console.log('⚠️ Email no enviado - servicio deshabilitado');
      return { messageId: 'disabled' };
    }

    try {
      // Obtener información de la empresa desde la base de datos
      const company = await this.getCompanyInfo();
      
      const attachments = [];
      if (pdfBuffer) {
        attachments.push({
          filename: `reclamo_${claimData.claim_number}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf'
        });
      } else if (pdfPath) {
        attachments.push({
          filename: `reclamo_${claimData.claim_number}.pdf`,
          path: pdfPath,
          contentType: 'application/pdf'
        });
      }

      const mailOptions = {
        from: process.env.EMAIL_FROM || `Libro de Reclamaciones <${company.support_email}>`,
        to: email,
        subject: `Confirmación de Reclamo ${claimData.claim_number} - ${company.name}`,
        html: this.generateEmailHTML(claimData, company),
        attachments: attachments
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log('✅ Email enviado exitosamente:', result.messageId);
      return result;
    } catch (error) {
      console.error('❌ Error enviando email:', error);
      throw new Error('Error al enviar el email de confirmación');
    }
  }

  generateEmailHTML(claimData, company) {
    return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Confirmación de Reclamo</title>
        <style>
            body {
                font-family: Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
            }
            .header {
                background-color: #2c3e50;
                color: white;
                padding: 20px;
                text-align: center;
                border-radius: 5px 5px 0 0;
            }
            .content {
                background-color: #f8f9fa;
                padding: 20px;
                border: 1px solid #dee2e6;
            }
            .claim-info {
                background-color: #e3f2fd;
                padding: 15px;
                border-radius: 5px;
                margin: 15px 0;
                border-left: 4px solid #2196f3;
            }
            .claim-number {
                font-size: 18px;
                font-weight: bold;
                color: #1976d2;
            }
            .footer {
                background-color: #f1f3f4;
                padding: 15px;
                text-align: center;
                font-size: 12px;
                color: #666;
                border-radius: 0 0 5px 5px;
            }
            .button {
                display: inline-block;
                background-color: #28a745;
                color: white;
                padding: 10px 20px;
                text-decoration: none;
                border-radius: 5px;
                margin: 10px 0;
            }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>Libro de Reclamaciones</h1>
            <p>Confirmación de Recepción</p>
        </div>
        
        <div class="content">
            <p>Estimado/a <strong>${claimData.consumer_name} ${claimData.consumer_lastname_p}</strong>,</p>
            
            <p>Hemos recibido su ${claimData.claim_type} y queremos confirmar que ha sido registrado exitosamente en nuestro sistema.</p>
            
            <div class="claim-info">
                <div class="claim-number">Reclamo N° ${claimData.claim_number}</div>
                <p><strong>Fecha de recepción:</strong> ${new Date(claimData.date_created).toLocaleDateString('es-PE')}</p>
                <p><strong>Tipo:</strong> ${claimData.claim_type.toUpperCase()}</p>
                <p><strong>Motivo:</strong> ${claimData.reason}</p>
            </div>
            
            <p>Adjunto encontrará una copia en PDF de su reclamo para sus registros.</p>
            
            <h3>Próximos pasos:</h3>
            <ul>
                <li>Su reclamo será revisado por nuestro equipo especializado</li>
                <li>Recibirá una respuesta dentro del plazo establecido por ley</li>
                <li>Puede consultar el estado de su reclamo contactándonos</li>
            </ul>
            
            <p>Si tiene alguna consulta adicional, no dude en contactarnos.</p>
            
            <p>Atentamente,<br>
            <strong>${company?.name || 'BÍOMACRUZ'}</strong></p>
        </div>
        
        <div class="footer">
            <p>Este es un mensaje automático, por favor no responda a este correo.</p>
            <p>RUC: ${company?.ruc || '20872828607'} | ${company?.address || 'Parque Bella'}</p>
        </div>
    </body>
    </html>
    `;
  }

  async sendAdminNotification(claimData) {
    if (!this.enabled) {
      console.log('⚠️ Notificación de administrador no enviada - servicio deshabilitado');
      return { messageId: 'disabled' };
    }

    try {
      const adminEmail = process.env.ADMIN_EMAIL || process.env.EMAIL_USER;
      
      const mailOptions = {
        from: process.env.EMAIL_FROM || 'Libro de Reclamaciones <noreply@empresa.com>',
        to: adminEmail,
        subject: `Nuevo Reclamo ${claimData.claim_number} - Requiere Revisión`,
        html: this.generateAdminNotificationHTML(claimData)
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log('✅ Notificación de administrador enviada:', result.messageId);
      return result;
    } catch (error) {
      console.error('❌ Error enviando notificación de administrador:', error);
      // No lanzar error para no afectar el flujo principal
    }
  }

  generateAdminNotificationHTML(claimData) {
    return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Nuevo Reclamo - Panel de Administración</title>
        <style>
            body {
                font-family: Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
            }
            .header {
                background-color: #dc3545;
                color: white;
                padding: 20px;
                text-align: center;
                border-radius: 5px 5px 0 0;
            }
            .content {
                background-color: #f8f9fa;
                padding: 20px;
                border: 1px solid #dee2e6;
            }
            .claim-info {
                background-color: #fff3cd;
                padding: 15px;
                border-radius: 5px;
                margin: 15px 0;
                border-left: 4px solid #ffc107;
            }
            .claim-number {
                font-size: 18px;
                font-weight: bold;
                color: #856404;
            }
            .button {
                display: inline-block;
                background-color: #007bff;
                color: white;
                padding: 10px 20px;
                text-decoration: none;
                border-radius: 5px;
                margin: 10px 0;
            }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>Nuevo Reclamo Recibido</h1>
            <p>Panel de Administración</p>
        </div>
        
        <div class="content">
            <p>Se ha recibido un nuevo ${claimData.claim_type} que requiere revisión:</p>
            
            <div class="claim-info">
                <div class="claim-number">Reclamo N° ${claimData.claim_number}</div>
                <p><strong>Consumidor:</strong> ${claimData.consumer_name} ${claimData.consumer_lastname_p} ${claimData.consumer_lastname_m}</p>
                <p><strong>Documento:</strong> ${claimData.document_type} ${claimData.document_number}</p>
                <p><strong>Fecha:</strong> ${new Date(claimData.date_created).toLocaleDateString('es-PE')}</p>
                <p><strong>Motivo:</strong> ${claimData.reason}</p>
                <p><strong>Monto:</strong> ${claimData.currency} ${claimData.amount || 'No especificado'}</p>
            </div>
            
            <p>Por favor, acceda al panel de administración para revisar y gestionar este reclamo.</p>
            
            <a href="${process.env.ADMIN_PANEL_URL || 'http://localhost:3000/admin'}" class="button">
                Ir al Panel de Administración
            </a>
        </div>
    </body>
    </html>
    `;
  }

  async sendClaimResponse(email, claimData, responseData) {
    if (!this.enabled) {
      console.log('⚠️ Email no enviado - servicio deshabilitado');
      return { messageId: 'disabled' };
    }

    try {
      // Obtener información de la empresa desde la base de datos
      const company = await this.getCompanyInfo();
      console.log('📧 Información de la empresa para email de respuesta:', company);
      
      // Procesar archivos adjuntos
      const attachments = [];
      if (responseData.files && responseData.files.length > 0) {
        const googleDriveService = require('./googleDriveOAuthService');
        
        for (const file of responseData.files) {
          try {
            if (file.file_id) {
              // Archivo en Google Drive - descargarlo
              const fileBuffer = await googleDriveService.downloadFile(file.file_id);
              attachments.push({
                filename: file.original_name,
                content: fileBuffer,
                contentType: file.mime_type
              });
            } else if (file.file_path) {
              // Archivo local
              const fs = require('fs');
              if (fs.existsSync(file.file_path)) {
                attachments.push({
                  filename: file.original_name,
                  path: file.file_path,
                  contentType: file.mime_type
                });
              }
            }
          } catch (fileError) {
            console.error('Error procesando archivo adjunto:', fileError);
            // Continuar con otros archivos
          }
        }
      }

      const mailOptions = {
        from: process.env.EMAIL_FROM || `Libro de Reclamaciones <${company.support_email}>`,
        to: email,
        subject: `Respuesta a su Reclamo ${claimData.claim_number} - ${company.name}`,
        html: this.generateResponseHTML(claimData, responseData, company),
        attachments: attachments
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log('✅ Respuesta enviada exitosamente:', result.messageId);
      return result;
    } catch (error) {
      console.error('❌ Error enviando respuesta:', error);
      throw new Error('Error al enviar la respuesta por email');
    }
  }

  generateResponseHTML(claimData, responseData, company) {
    const companyName = company?.name || 'Mi Empresa';
    const companyAddress = company?.address || '';
    const companyPhone = company?.phone || '';
    const companyEmail = company?.support_email || '';
    
    return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Respuesta a su Reclamo</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 20px; background-color: #f4f4f4; }
            .container { max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
            .header { text-align: center; border-bottom: 2px solid #3498db; padding-bottom: 20px; margin-bottom: 30px; }
            .header h1 { color: #2c3e50; margin: 0; }
            .claim-info { background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0; }
            .response-content { background: #e8f5e8; padding: 20px; border-radius: 5px; border-left: 4px solid #27ae60; margin: 20px 0; }
            .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666; text-align: center; }
            .status { display: inline-block; padding: 5px 15px; border-radius: 20px; font-weight: bold; }
            .status.respondido { background: #d4edda; color: #155724; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>Respuesta a su Reclamo</h1>
                <p><strong>${companyName}</strong></p>
            </div>
            
            <div class="claim-info">
                <h3>Información del Reclamo</h3>
                <p><strong>Número:</strong> ${claimData.claim_number}</p>
                <p><strong>Fecha de envío:</strong> ${new Date(claimData.date_created).toLocaleDateString('es-PE')}</p>
                <p><strong>Estado actual:</strong> <span class="status respondido">Respondido</span></p>
            </div>
            
            <div class="response-content">
                <h3>Nuestra Respuesta</h3>
                <p>Estimado/a ${claimData.consumer_name} ${claimData.consumer_lastname_p},</p>
                <p>${responseData.message}</p>
                ${responseData.notes ? `<p><strong>Notas adicionales:</strong> ${responseData.notes}</p>` : ''}
                ${responseData.files && responseData.files.length > 0 ? `
                <div style="margin-top: 15px; padding: 10px; background: #f0f8ff; border-radius: 5px;">
                    <h4>Archivos adjuntos:</h4>
                    <ul>
                        ${responseData.files.map(file => `<li>${file.original_name}</li>`).join('')}
                    </ul>
                </div>
                ` : ''}
            </div>
            
            <div class="footer">
                <p><strong>${companyName}</strong></p>
                ${companyAddress ? `<p>${companyAddress}</p>` : ''}
                ${companyPhone ? `<p>Teléfono: ${companyPhone}</p>` : ''}
                ${companyEmail ? `<p>Email: ${companyEmail}</p>` : ''}
                <p>Este es un mensaje automático, por favor no responda a este correo.</p>
            </div>
        </div>
    </body>
    </html>
    `;
  }
}

module.exports = new EmailService();
