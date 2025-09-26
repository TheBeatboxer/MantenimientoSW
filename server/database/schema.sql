-- SQLite Schema para Libro de Reclamaciones
-- Convertido desde PostgreSQL

-- Tabla de reclamos
CREATE TABLE IF NOT EXISTS claims (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    claim_number VARCHAR(20) NOT NULL,
    date_created DATETIME DEFAULT CURRENT_TIMESTAMP,
    consumer_name VARCHAR(100) NOT NULL,
    consumer_lastname_p VARCHAR(100) NOT NULL,
    consumer_lastname_m VARCHAR(100),
    document_type VARCHAR(20) NOT NULL,
    document_number VARCHAR(20) NOT NULL,
    phone VARCHAR(20),
    email VARCHAR(100),
    is_minor BOOLEAN DEFAULT FALSE,
    address TEXT,
    department VARCHAR(100),
    province VARCHAR(100),
    district VARCHAR(100),
    relationship_with_company VARCHAR(100),
    claim_type VARCHAR(20) NOT NULL,
    product_service_type VARCHAR(100),
    currency VARCHAR(10),
    amount DECIMAL(10,2),
    reason TEXT NOT NULL,
    detail TEXT NOT NULL,
    request TEXT,
    communication_medium VARCHAR(50) NOT NULL,
    status VARCHAR(20) DEFAULT 'pendiente',
    pdf_generated BOOLEAN DEFAULT FALSE,
    pdf_storage VARCHAR(20) DEFAULT 'local',
    pdf_path TEXT,
    pdf_file_id VARCHAR(255),
    pdf_download_url TEXT,
    pdf_view_url TEXT,
    ip_address VARCHAR(45),
    user_agent TEXT,
    email_sent BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de archivos adjuntos
CREATE TABLE IF NOT EXISTS claim_files (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    claim_id INTEGER NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    stored_name VARCHAR(255),
    file_path TEXT,
    file_size INTEGER,
    mime_type VARCHAR(100),
    file_id VARCHAR(255),
    view_url TEXT,
    download_url TEXT,
    uploaded_by INTEGER,
    upload_type VARCHAR(50) DEFAULT 'claim_attachment',
    uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (claim_id) REFERENCES claims(id) ON DELETE CASCADE,
    FOREIGN KEY (uploaded_by) REFERENCES users_admin(id) ON DELETE SET NULL
);

-- Tabla de usuarios administradores
CREATE TABLE IF NOT EXISTS users_admin (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    role VARCHAR(20) DEFAULT 'admin',
    is_active BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de bitácora de auditoría
CREATE TABLE IF NOT EXISTS audit_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    claim_id INTEGER,
    admin_user_id INTEGER,
    action VARCHAR(50) NOT NULL,
    description TEXT,
    old_values TEXT,
    new_values TEXT,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (claim_id) REFERENCES claims(id) ON DELETE SET NULL,
    FOREIGN KEY (admin_user_id) REFERENCES users_admin(id) ON DELETE SET NULL
);

-- Índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_claims_claim_number ON claims(claim_number);
CREATE INDEX IF NOT EXISTS idx_claims_date_created ON claims(date_created);
CREATE INDEX IF NOT EXISTS idx_claims_status ON claims(status);
CREATE INDEX IF NOT EXISTS idx_claims_document_number ON claims(document_number);
CREATE INDEX IF NOT EXISTS idx_claims_email ON claims(email);
CREATE INDEX IF NOT EXISTS idx_claims_ip_address ON claims(ip_address);
CREATE INDEX IF NOT EXISTS idx_claims_status_date ON claims(status, date_created);
CREATE INDEX IF NOT EXISTS idx_claim_files_claim_id ON claim_files(claim_id);
CREATE INDEX IF NOT EXISTS idx_users_admin_username ON users_admin(username);
CREATE INDEX IF NOT EXISTS idx_users_admin_email ON users_admin(email);
CREATE INDEX IF NOT EXISTS idx_audit_log_claim_id ON audit_log(claim_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_admin_user_id ON audit_log(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON audit_log(created_at);

-- Trigger para actualizar updated_at automáticamente
CREATE TRIGGER IF NOT EXISTS update_claims_updated_at 
    AFTER UPDATE ON claims
    FOR EACH ROW
    BEGIN
        UPDATE claims SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;

CREATE TRIGGER IF NOT EXISTS update_users_admin_updated_at
    AFTER UPDATE ON users_admin
    FOR EACH ROW
    BEGIN
        UPDATE users_admin SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;

-- Trigger para auditoría automática de cambios de estado
CREATE TRIGGER IF NOT EXISTS audit_claim_status_change
    AFTER UPDATE ON claims
    FOR EACH ROW
    WHEN OLD.status != NEW.status
    BEGIN
        INSERT INTO audit_log (claim_id, action, description, old_values, new_values, ip_address)
        VALUES (NEW.id, 'status_change', 'Cambio de estado del reclamo', '{"status": "' || OLD.status || '"}', '{"status": "' || NEW.status || '"}', NEW.ip_address);
    END;

-- Tabla de información de la empresa (1 fila)
CREATE TABLE IF NOT EXISTS company_info (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    name VARCHAR(150) NOT NULL,
    ruc VARCHAR(20),
    address TEXT,
    phone VARCHAR(50),
    website VARCHAR(150),
    support_email VARCHAR(150),
    logo_file_id VARCHAR(255),
    logo_view_url TEXT,
    logo_download_url TEXT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Insertar fila por defecto si no existe
INSERT INTO company_info (id, name)
    SELECT 1, 'Mi Empresa'
    WHERE NOT EXISTS (SELECT 1 FROM company_info WHERE id = 1);

-- Agregar constraint de unicidad para claim_number (si no existe)
CREATE UNIQUE INDEX IF NOT EXISTS unique_claim_number ON claims(claim_number);
