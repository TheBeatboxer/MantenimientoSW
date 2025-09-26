import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';

const Step3 = ({ formData, errors, updateFormData }) => {
  const productServiceOptions = [
    { value: 'producto', label: 'Disconformidad con un producto' },
    { value: 'servicio', label: 'Disconformidad con un servicio' }
  ];

  const claimTypeOptions = [
    { value: 'reclamo', label: 'Reclamo' },
    { value: 'queja', label: 'Queja' }
  ];

  const currencyOptions = [
    { value: 'PEN', label: 'PEN' },
    { value: 'USD', label: 'USD' }
  ];

  const handleInputChange = (field, value) => {
    updateFormData({ [field]: value });
  };

  const onDrop = useCallback((acceptedFiles) => {
    const newFiles = [...formData.files, ...acceptedFiles].slice(0, 3); // Máximo 3 archivos
    updateFormData({ files: newFiles });
  }, [formData.files, updateFormData]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg'],
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
    },
    maxFiles: 3 - formData.files.length,
    maxSize: 10 * 1024 * 1024 // 10MB
  });

  const removeFile = (index) => {
    const newFiles = formData.files.filter((_, i) => i !== index);
    updateFormData({ files: newFiles });
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div>
      <div className="form-section">
        <h2 className="section-title">¿Qué deseas reportar?</h2>
        
        <div className="radio-group">
          {productServiceOptions.map((option) => (
            <div
              key={option.value}
              className={`radio-option ${
                formData.product_service_type === option.value ? 'selected' : ''
              }`}
              onClick={() => handleInputChange('product_service_type', option.value)}
            >
              <input
                type="radio"
                name="product_service_type"
                className="radio-input"
                checked={formData.product_service_type === option.value}
                onChange={() => handleInputChange('product_service_type', option.value)}
              />
              <label className="radio-label">{option.label}</label>
            </div>
          ))}
        </div>
        
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Moneda</label>
            <select
              className="form-select"
              value={formData.currency}
              onChange={(e) => handleInputChange('currency', e.target.value)}
            >
              {currencyOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          
          <div className="form-group">
            <label className="form-label">Monto del reclamo</label>
            <input
              type="number"
              step="0.01"
              min="0"
              className="form-input"
              value={formData.amount}
              onChange={(e) => handleInputChange('amount', e.target.value)}
              placeholder="Ingresa el monto (opcional)"
            />
          </div>
        </div>
        
      </div>
      
      <div className="form-section">
        <h2 className="section-title">Datos del reclamo</h2>
        
        <div style={{ marginBottom: '1rem', fontSize: '12px', color: '#7f8c8d' }}>
          <strong>Tipo: ¿Cuál debo elegir?</strong>
        </div>
        
        <div style={{ marginBottom: '1rem', fontSize: '12px', color: '#666' }}>
          <p><strong>Reclamo:</strong> Disconformidad relacionada a los productos o servicios.</p>
          <p><strong>Queja:</strong> Disconformidad no relacionada a los productos o servicios; o, malestar o descontento respecto a la atención al público.</p>
        </div>
        
        <div className="radio-group">
          {claimTypeOptions.map((option) => (
            <div
              key={option.value}
              className={`radio-option ${
                formData.claim_type === option.value ? 'selected' : ''
              }`}
              onClick={() => handleInputChange('claim_type', option.value)}
            >
              <input
                type="radio"
                name="claim_type"
                className="radio-input"
                checked={formData.claim_type === option.value}
                onChange={() => handleInputChange('claim_type', option.value)}
              />
              <label className="radio-label">{option.label}</label>
            </div>
          ))}
        </div>
        
        <div className="form-group">
          <label className="form-label required">Detalle</label>
          <textarea
            className={`form-textarea ${errors.detail ? 'error' : ''}`}
            value={formData.detail}
            onChange={(e) => handleInputChange('detail', e.target.value)}
            placeholder="Describe detalladamente tu reclamo o queja..."
            rows={6}
          />
          {errors.detail && <span className="form-error">{errors.detail}</span>}
        </div>
        
        <div className="form-group">
          <label className="form-label">Pedido</label>
          <textarea
            className="form-textarea"
            value={formData.request}
            onChange={(e) => handleInputChange('request', e.target.value)}
            placeholder="¿Qué esperas que haga la empresa para resolver tu reclamo? (opcional)"
            rows={4}
          />
        </div>
      </div>
      
      <div className="form-section">
        <h2 className="section-title">Cargar archivo</h2>
        
        <div style={{ marginBottom: '1rem', fontSize: '12px', color: '#666' }}>
          <p>Puedes adjuntar hasta 3 vouchers, estados de cuenta, imágenes u otros documentos para sustentar tu reclamo.</p>
          <p>Los formatos permitidos son: png / jpeg / docx / doc / pdf</p>
        </div>
        
        <div
          {...getRootProps()}
          className={`file-upload ${isDragActive ? 'dragover' : ''}`}
        >
          <input {...getInputProps()} />
          <div className="file-upload-icon">📁</div>
          <div className="file-upload-text">
            {isDragActive
              ? 'Suelta los archivos aquí...'
              : 'Adjunta o arrastra los archivos aquí'
            }
          </div>
          <div className="file-upload-hint">
            Máximo 3 archivos, 10MB por archivo
          </div>
        </div>
        
        {formData.files.length > 0 && (
          <div className="file-list">
            {formData.files.map((file, index) => (
              <div key={index} className="file-item">
                <div className="file-info">
                  <span className="file-name">{file.name}</span>
                  <span className="file-size">({formatFileSize(file.size)})</span>
                </div>
                <button
                  type="button"
                  className="file-remove"
                  onClick={() => removeFile(index)}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Step3;
