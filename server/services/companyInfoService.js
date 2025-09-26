/**
 * Servicio singleton para gestión de información de la empresa
 * Reemplaza el uso de global.companyInfo con un patrón más estructurado
 */

const db = require('../config/database');
const cacheService = require('./cacheService');

class CompanyInfoService {
  constructor() {
    this.cacheKey = 'company_info_singleton';
    this.cacheDuration = 10 * 60 * 1000; // 10 minutos
    this.defaultInfo = {
      id: 1,
      name: 'Mi Empresa',
      ruc: '',
      address: '',
      phone: '',
      website: '',
      support_email: '',
      logo_file_id: null,
      logo_view_url: null,
      logo_download_url: null,
      updated_at: null
    };
  }

  /**
   * Obtiene la información de la empresa con caché
   */
  async getCompanyInfo() {
    try {
      return await cacheService.getOrSet(
        this.cacheKey,
        async () => {
          const rows = await db.query('SELECT * FROM company_info WHERE id = 1');
          return rows.length > 0 ? rows[0] : this.defaultInfo;
        },
        this.cacheDuration
      );
    } catch (error) {
      console.error('Error obteniendo información de la empresa:', error);
      return this.defaultInfo;
    }
  }

  /**
   * Actualiza la información de la empresa
   */
  async updateCompanyInfo(updates) {
    try {
      const { name, ruc, address, phone, website, support_email, logo_file_id, logo_view_url, logo_download_url } = updates;

      // Verificar si existe el registro
      const exists = await db.query('SELECT 1 FROM company_info WHERE id = 1');

      if (exists.length === 0) {
        // Insertar nuevo registro
        await db.query(
          `INSERT INTO company_info (id, name, ruc, address, phone, website, support_email, logo_file_id, logo_view_url, logo_download_url)
           VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [name || this.defaultInfo.name, ruc, address, phone, website, support_email, logo_file_id, logo_view_url, logo_download_url]
        );
      } else {
        // Actualizar registro existente
        await db.query(
          `UPDATE company_info SET
            name = COALESCE(?, name),
            ruc = COALESCE(?, ruc),
            address = COALESCE(?, address),
            phone = COALESCE(?, phone),
            website = COALESCE(?, website),
            support_email = COALESCE(?, support_email),
            logo_file_id = COALESCE(?, logo_file_id),
            logo_view_url = COALESCE(?, logo_view_url),
            logo_download_url = COALESCE(?, logo_download_url),
            updated_at = CURRENT_TIMESTAMP
           WHERE id = 1`,
          [name, ruc, address, phone, website, support_email, logo_file_id, logo_view_url, logo_download_url]
        );
      }

      // Limpiar caché para forzar recarga
      await cacheService.delete(this.cacheKey);

      // Obtener y retornar la información actualizada
      return await this.getCompanyInfo();

    } catch (error) {
      console.error('Error actualizando información de la empresa:', error);
      throw error;
    }
  }

  /**
   * Obtiene solo el nombre de la empresa (método optimizado)
   */
  async getCompanyName() {
    try {
      const info = await this.getCompanyInfo();
      return info.name || this.defaultInfo.name;
    } catch (error) {
      console.error('Error obteniendo nombre de la empresa:', error);
      return this.defaultInfo.name;
    }
  }

  /**
   * Fuerza la recarga de la información desde la base de datos
   */
  async refreshCache() {
    await cacheService.delete(this.cacheKey);
    return await this.getCompanyInfo();
  }

  /**
   * Verifica si la información de la empresa está configurada
   */
  async isConfigured() {
    try {
      const info = await this.getCompanyInfo();
      return !!(info.name && info.name !== this.defaultInfo.name);
    } catch (error) {
      console.error('Error verificando configuración de empresa:', error);
      return false;
    }
  }
}

// Exportar instancia singleton
const companyInfoService = new CompanyInfoService();

module.exports = companyInfoService;
