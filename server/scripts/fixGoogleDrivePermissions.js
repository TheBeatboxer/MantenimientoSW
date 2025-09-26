const googleDriveService = require('../services/googleDriveOAuthService');
const db = require('../config/database');

async function fixGoogleDrivePermissions() {
  try {
    console.log('🔧 Iniciando corrección de permisos de Google Drive...');
    
    // Inicializar el servicio
    const initialized = await googleDriveService.ensureInitialized();
    if (!initialized) {
      console.error('❌ No se pudo inicializar Google Drive Service');
      return;
    }

    // Obtener todos los reclamos con PDFs en Google Drive
    const claims = await db.query(`
      SELECT id, claim_number, pdf_file_id, pdf_download_url 
      FROM claims 
      WHERE pdf_storage = 'google_drive' AND pdf_file_id IS NOT NULL
    `);

    console.log(`📋 Encontrados ${claims.length} reclamos con PDFs en Google Drive`);

    for (const claim of claims) {
      try {
        console.log(`🔧 Procesando reclamo ${claim.claim_number} (ID: ${claim.pdf_file_id})`);
        
        // Establecer permisos públicos
        await googleDriveService.drive.permissions.create({
          fileId: claim.pdf_file_id,
          requestBody: { 
            role: 'reader', 
            type: 'anyone' 
          },
          supportsAllDrives: true
        });

        // Actualizar la URL de descarga en la base de datos
        const downloadUrl = `https://drive.google.com/uc?export=download&id=${claim.pdf_file_id}`;
        await db.query(
          'UPDATE claims SET pdf_download_url = ? WHERE id = ?',
          [downloadUrl, claim.id]
        );

        console.log(`✅ Permisos corregidos para reclamo ${claim.claim_number}`);
        
      } catch (error) {
        console.error(`❌ Error procesando reclamo ${claim.claim_number}:`, error.message);
      }
    }

    console.log('🎉 Corrección de permisos completada');
    
  } catch (error) {
    console.error('❌ Error en la corrección de permisos:', error);
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  fixGoogleDrivePermissions()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Error:', error);
      process.exit(1);
    });
}

module.exports = fixGoogleDrivePermissions;
