class CacheService {
  constructor() {
    this.cache = new Map();
    this.ttl = 5 * 60 * 1000; // 5 minutos por defecto
  }

  set(key, value, ttl = this.ttl) {
    const expiresAt = Date.now() + ttl;
    this.cache.set(key, { value, expiresAt });
  }

  get(key) {
    const item = this.cache.get(key);
    if (!item) return null;

    if (Date.now() > item.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return item.value;
  }

  delete(key) {
    return this.cache.delete(key);
  }

  clear() {
    this.cache.clear();
  }

  // Método específico para caché de consultas SQL
  async getOrSet(key, queryFn, ttl = this.ttl) {
    let cached = this.get(key);
    if (cached) return cached;

    const result = await queryFn();
    this.set(key, result, ttl);
    return result;
  }

  // Método para invalidar caché relacionado con company info
  invalidateCompanyInfo() {
    for (const key of this.cache.keys()) {
      if (key.startsWith('company_info')) {
        this.cache.delete(key);
      }
    }
  }

  // Método para invalidar caché relacionado con usuarios
  invalidateUserProfile(userId) {
    for (const key of this.cache.keys()) {
      if (key.includes(`user_${userId}`)) {
        this.cache.delete(key);
      }
    }
  }

  // Limpiar entradas expiradas periódicamente
  cleanup() {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiresAt) {
        this.cache.delete(key);
      }
    }
  }
}

// Iniciar limpieza periódica cada 10 minutos
const cacheService = new CacheService();
setInterval(() => cacheService.cleanup(), 10 * 60 * 1000);

module.exports = cacheService;
