const db = require('../config/database');
const cacheService = require('../services/cacheService');

async function updateCompanyInfo() {
  try {
    console.log('🔧 Actualizando información de la empresa...');
    
    // Conectar a la base de datos
    await db.connect();
    
    // Datos actualizados de BÍOMACRUZ
    const companyData = {
      name: 'BÍOMACRUZ',
      ruc: '20872828607',
      address: 'Parque Bella',
      phone: '960576738',
      website: 'SITECH.SITE.COM',
      support_email: 'sitechsolutions25@gmail.com'
    };

    // Verificar si existe el registro
    const exists = await db.query('SELECT 1 FROM company_info WHERE id = 1');

    if (exists.length === 0) {
      // Insertar nuevo registro
      await db.query(
        `INSERT INTO company_info (id, name, ruc, address, phone, website, support_email, updated_at)
         VALUES (1, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
        [companyData.name, companyData.ruc, companyData.address, companyData.phone, companyData.website, companyData.support_email]
      );
      console.log('✅ Información de la empresa insertada');
    } else {
      // Actualizar registro existente
      await db.query(
        `UPDATE company_info SET
          name = ?,
          ruc = ?,
          address = ?,
          phone = ?,
          website = ?,
          support_email = ?,
          updated_at = CURRENT_TIMESTAMP
         WHERE id = 1`,
        [companyData.name, companyData.ruc, companyData.address, companyData.phone, companyData.website, companyData.support_email]
      );
      console.log('✅ Información de la empresa actualizada');
    }

    // Limpiar caché
    await cacheService.delete('company_info_main');
    await cacheService.delete('company_info_singleton');

    // Verificar la actualización
    const result = await db.query('SELECT * FROM company_info WHERE id = 1');
    console.log('📋 Información actualizada:', result[0]);

    console.log('🎉 Actualización completada');
    
  } catch (error) {
    console.error('❌ Error actualizando información de la empresa:', error);
  } finally {
    // Cerrar conexión
    await db.close();
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  updateCompanyInfo()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Error:', error);
      process.exit(1);
    });
}

module.exports = updateCompanyInfo;
