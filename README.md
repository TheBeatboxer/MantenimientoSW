# Libro de Reclamaciones 2.0

Sistema web completo para la gestión de reclamos y quejas, desarrollado conforme al Código de Protección y Defensa del Consumidor del Perú.

## 🚀 Características

### Frontend Público
- ✅ Formulario de 3 pasos con validaciones completas
- ✅ Datos del consumidor, bien/servicio, tipo de reclamo
- ✅ Monto reclamado, motivo, detalle, archivos adjuntos
- ✅ Generación automática de PDF con numeración correlativa
- ✅ Envío de PDF por email y descarga inmediata
- ✅ Diseño responsive y accesible

### Backend/API
- ✅ API REST completa con Node.js y Express
- ✅ Base de datos PostgreSQL con esquema optimizado
- ✅ Generación de PDFs con Puppeteer
- ✅ Sistema de email con Nodemailer
- ✅ Validaciones de datos y seguridad
- ✅ Control de tasa (rate limiting)
- ✅ Autenticación JWT para administradores

### Panel de Administración
- ✅ Dashboard con estadísticas en tiempo real
- ✅ Gestión completa de reclamos
- ✅ Filtros avanzados y búsqueda
- ✅ Cambio de estados con bitácora de auditoría
- ✅ Exportación de datos a CSV
- ✅ Visualización de archivos adjuntos
- ✅ Descarga de PDFs generados

### Seguridad
- ✅ Autenticación JWT con refresh tokens
- ✅ Rate limiting por IP y endpoint
- ✅ Validación y sanitización de inputs
- ✅ Protección CSRF
- ✅ Helmet para headers de seguridad
- ✅ Validación de tipos y tamaños de archivos

## 🛠️ Tecnologías Utilizadas

### Backend
- **Node.js** - Runtime de JavaScript
- **Express.js** - Framework web
- **PostgreSQL** - Base de datos relacional
- **Puppeteer** - Generación de PDFs
- **Nodemailer** - Envío de emails
- **JWT** - Autenticación
- **Multer** - Manejo de archivos
- **Bcrypt** - Encriptación de contraseñas

### Frontend
- **React 18** - Biblioteca de UI
- **React Router** - Navegación
- **React Hook Form** - Manejo de formularios
- **Styled Components** - Estilos
- **Axios** - Cliente HTTP
- **React Dropzone** - Subida de archivos
- **React Toastify** - Notificaciones

## 📋 Requisitos del Sistema

### Servidor
- Node.js 16+ 
- PostgreSQL 12+
- 2GB RAM mínimo
- 10GB espacio en disco
- Puerto 5000 (backend) y 3000 (frontend)

### Dependencias del Sistema
```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install nodejs npm postgresql postgresql-contrib

# CentOS/RHEL
sudo yum install nodejs npm postgresql-server postgresql-contrib
```

## 🚀 Instalación

### 1. Clonar el Repositorio
```bash
git clone <repository-url>
cd libro-reclamaciones-2.0
```

### 2. Instalar Dependencias
```bash
# Instalar dependencias de todos los módulos
npm run install-all

# O instalar manualmente
npm install
cd server && npm install
cd ../client && npm install
```

### 3. Configurar Base de Datos
```bash
# Crear base de datos PostgreSQL
sudo -u postgres psql
CREATE DATABASE libro_reclamaciones;
CREATE USER libro_user WITH PASSWORD 'tu_password_seguro';
GRANT ALL PRIVILEGES ON DATABASE libro_reclamaciones TO libro_user;
\q

# Ejecutar esquema de base de datos
psql -U libro_user -d libro_reclamaciones -f server/database/schema.sql
```

### 4. Configurar Variables de Entorno
```bash
# Copiar archivo de ejemplo
cp server/.env.example server/.env

# Editar configuración
nano server/.env
```

Configurar las siguientes variables:
```env
# Base de datos
DB_HOST=localhost
DB_PORT=5432
DB_NAME=libro_reclamaciones
DB_USER=libro_user
DB_PASSWORD=tu_password_seguro

# Servidor
PORT=5000
NODE_ENV=production
JWT_SECRET=tu_jwt_secret_muy_seguro_aqui

# Email
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=tu_email@gmail.com
EMAIL_PASS=tu_app_password
EMAIL_FROM=Libro de Reclamaciones <noreply@empresa.com>

# Empresa
COMPANY_NAME=Tu Empresa S.A.C.
COMPANY_RUC=12345678901
COMPANY_ADDRESS=Tu Dirección, Lima, Perú
```

### 5. Configurar Inicial
```bash
# Ejecutar script de configuración inicial
cd server
node scripts/setup.js
```

### 6. Iniciar la Aplicación

#### Desarrollo
```bash
# Iniciar en modo desarrollo (ambos servidores)
npm run dev

# O iniciar por separado
npm run server  # Backend en puerto 5000
npm run client  # Frontend en puerto 3000
```

#### Producción
```bash
# Construir frontend
npm run build

# Iniciar servidor de producción
npm start
```

## 📖 Manual de Uso

### Para Usuarios (Consumidores)

#### 1. Acceder al Formulario
- Visitar `http://tu-dominio.com`
- El formulario se divide en 3 pasos claramente indicados

#### 2. Paso 1: Datos Personales
- Completar nombres y apellidos
- Seleccionar tipo de documento y número
- Ingresar teléfono y email (opcional)
- Especificar dirección completa
- Elegir medio de comunicación preferido

#### 3. Paso 2: Relación con la Empresa (Opcional)
- Seleccionar tu relación con la empresa
- Especificar si es diferente a las opciones mostradas

#### 4. Paso 3: Detalles del Reclamo
- Seleccionar si es producto o servicio
- Especificar tipo: reclamo o queja
- Ingresar monto (opcional) y motivo
- Describir detalladamente el problema
- Agregar archivos de respaldo (máximo 3)
- Especificar qué esperas de la empresa

#### 5. Envío y Confirmación
- Revisar toda la información
- Hacer clic en "Enviar"
- Recibir confirmación con número de reclamo
- Descargar PDF del reclamo
- Recibir copia por email (si se proporcionó)

### Para Administradores

#### 1. Acceso al Panel
- Visitar `http://tu-dominio.com/admin/login`
- Usar credenciales de administrador
- Credenciales por defecto: admin / admin123

#### 2. Dashboard
- Ver estadísticas generales
- Reclamos pendientes, respondidos, etc.
- Tendencias mensuales
- Reclamos recientes

#### 3. Gestión de Reclamos
- Ver lista completa de reclamos
- Usar filtros por estado, tipo, fecha
- Buscar por nombre, documento o número
- Exportar datos a CSV

#### 4. Detalles de Reclamo
- Ver información completa del consumidor
- Revisar detalles del reclamo
- Descargar archivos adjuntos
- Cambiar estado del reclamo
- Agregar notas
- Ver bitácora de cambios

#### 5. Cambio de Estados
- **Pendiente**: Reclamo recién recibido
- **En Revisión**: Siendo analizado por el equipo
- **Respondido**: Respuesta enviada al consumidor
- **Cerrado**: Reclamo resuelto completamente

## 🔧 Configuración Avanzada

### Configuración de Email
Para Gmail:
1. Habilitar autenticación de 2 factores
2. Generar contraseña de aplicación
3. Usar la contraseña de aplicación en `EMAIL_PASS`

### Configuración de Archivos
```env
# Tamaño máximo de archivos (en bytes)
MAX_FILE_SIZE=10485760  # 10MB

# Tipos de archivos permitidos
ALLOWED_FILE_TYPES=image/jpeg,image/png,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document
```

### Configuración de Seguridad
```env
# Rate limiting
RATE_LIMIT_WINDOW_MS=900000  # 15 minutos
RATE_LIMIT_MAX_REQUESTS=100  # 100 requests por ventana

# IPs permitidas (opcional)
ALLOWED_IPS=192.168.1.0/24,10.0.0.0/8
```

## 🐛 Solución de Problemas

### Error de Conexión a Base de Datos
```bash
# Verificar que PostgreSQL esté ejecutándose
sudo systemctl status postgresql

# Verificar configuración de conexión
psql -U libro_user -d libro_reclamaciones -c "SELECT NOW();"
```

### Error de Generación de PDF
```bash
# Instalar dependencias de Puppeteer
cd server
npm install puppeteer

# En sistemas Linux, instalar dependencias adicionales
sudo apt-get install -y gconf-service libasound2 libatk1.0-0 libc6 libcairo2 libcups2 libdbus-1-3 libexpat1 libfontconfig1 libgcc1 libgconf-2-4 libgdk-pixbuf2.0-0 libglib2.0-0 libgtk-3-0 libnspr4 libpango-1.0-0 libpangocairo-1.0-0 libstdc++6 libx11-6 libx11-xcb1 libxcb1 libxcomposite1 libxcursor1 libxdamage1 libxext6 libxfixes3 libxi6 libxrandr2 libxrender1 libxss1 libxtst6 ca-certificates fonts-liberation libappindicator1 libnss3 lsb-release xdg-utils wget
```

### Error de Envío de Email
1. Verificar credenciales de email
2. Comprobar configuración SMTP
3. Revisar logs del servidor
4. Verificar que el puerto 587 esté abierto

### Problemas de Permisos de Archivos
```bash
# Crear directorios con permisos correctos
sudo mkdir -p /ruta/a/tu/app/uploads
sudo chown -R $USER:$USER /ruta/a/tu/app/uploads
sudo chmod -R 755 /ruta/a/tu/app/uploads
```

## 📊 Monitoreo y Mantenimiento

### Logs del Sistema
```bash
# Ver logs del servidor
tail -f server/logs/app.log

# Ver logs de errores
tail -f server/logs/error.log
```

### Backup de Base de Datos
```bash
# Backup completo
pg_dump -U libro_user -h localhost libro_reclamaciones > backup_$(date +%Y%m%d).sql

# Restaurar backup
psql -U libro_user -h localhost libro_reclamaciones < backup_20231201.sql
```

### Limpieza de Archivos Temporales
```bash
# Limpiar archivos PDF antiguos (opcional)
find server/uploads/pdfs -name "*.pdf" -mtime +30 -delete

# Limpiar archivos de reclamos antiguos (opcional)
find server/uploads/claims -name "*" -mtime +90 -delete
```

## 🔒 Seguridad

### Recomendaciones de Producción
1. **Cambiar credenciales por defecto**
2. **Usar HTTPS en producción**
3. **Configurar firewall**
4. **Realizar backups regulares**
5. **Monitorear logs de seguridad**
6. **Actualizar dependencias regularmente**

### Configuración de Firewall
```bash
# Permitir solo puertos necesarios
sudo ufw allow 22    # SSH
sudo ufw allow 80    # HTTP
sudo ufw allow 443   # HTTPS
sudo ufw enable
```

## 📞 Soporte

Para soporte técnico o reportar problemas:
- Crear un issue en el repositorio
- Contactar al equipo de desarrollo
- Revisar la documentación técnica

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 🤝 Contribuciones

Las contribuciones son bienvenidas. Por favor:
1. Fork el proyecto
2. Crear una rama para tu feature
3. Commit tus cambios
4. Push a la rama
5. Abrir un Pull Request

---

**Desarrollado con ❤️ para cumplir con las normativas del Código de Protección y Defensa del Consumidor del Perú.**
