const sqlite3 = require('sqlite3').verbose();
const path = require('path');
require('dotenv').config();

class Database {
  constructor() {
    this.db = null;
    this.dbPath = process.env.DB_PATH || path.join(__dirname, '../database/libro_reclamaciones.db');
  }

  async connect() {
    return new Promise((resolve, reject) => {
      this.db = new sqlite3.Database(this.dbPath, (err) => {
        if (err) {
          console.error('❌ Error conectando a SQLite:', err.message);
          reject(err);
        } else {
          console.log('✅ Conectado a SQLite database');
          resolve();
        }
      });
    });
  }

  async query(sql, params = []) {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      
      if (sql.trim().toLowerCase().startsWith('select')) {
        // Para SELECT queries
        this.db.all(sql, params, (err, rows) => {
          const duration = Date.now() - startTime;
          if (err) {
            console.error('Database query error:', err);
            reject(err);
          } else {
            console.log('Query executed', { text: sql, duration, rows: rows.length });
            resolve(rows);
          }
        });
      } else {
        // Para INSERT, UPDATE, DELETE queries
        this.db.run(sql, params, function(err) {
          const duration = Date.now() - startTime;
          if (err) {
            console.error('Database query error:', err);
            reject(err);
          } else {
            console.log('Query executed', { text: sql, duration, changes: this.changes });
            resolve({ 
              rows: [], 
              rowCount: this.changes, 
              insertId: this.lastID 
            });
          }
        });
      }
    });
  }

  // Ejecutar múltiples statements en un solo batch (útil para migraciones/schema)
  async exec(sql) {
    return new Promise((resolve, reject) => {
      this.db.exec(sql, (err) => {
        if (err) {
          console.error('Database exec error:', err);
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  async transaction(callback) {
    return new Promise(async (resolve, reject) => {
      try {
        await this.query('BEGIN TRANSACTION');
        const result = await callback();
        await this.query('COMMIT');
        resolve(result);
      } catch (error) {
        await this.query('ROLLBACK');
        reject(error);
      }
    });
  }

  async close() {
    return new Promise((resolve) => {
      if (this.db) {
        this.db.close((err) => {
          if (err) {
            console.error('Error cerrando database:', err.message);
          } else {
            console.log('✅ Database connection cerrada');
          }
          resolve();
        });
      } else {
        resolve();
      }
    });
  }

  // Método para verificar si la tabla existe
  async tableExists(tableName) {
    const result = await this.query(
      "SELECT name FROM sqlite_master WHERE type='table' AND name=?",
      [tableName]
    );
    return result.length > 0;
  }

  // Método para obtener el último ID insertado
  async getLastInsertId() {
    const result = await this.query('SELECT last_insert_rowid() as id');
    return result[0].id;
  }
}

// Crear instancia única
const database = new Database();

module.exports = database;