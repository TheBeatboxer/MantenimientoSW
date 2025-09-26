import React from 'react';

const Step1 = ({ formData, errors, updateFormData, companyInfo }) => {
  const departments = [
    { value: 'AMAZONAS', label: 'Amazonas' },
    { value: 'ANCASH', label: 'Áncash' },
    { value: 'APURIMAC', label: 'Apurímac' },
    { value: 'AREQUIPA', label: 'Arequipa' },
    { value: 'AYACUCHO', label: 'Ayacucho' },
    { value: 'CAJAMARCA', label: 'Cajamarca' },
    { value: 'CALLAO', label: 'Callao' },
    { value: 'CUSCO', label: 'Cusco' },
    { value: 'HUANCAVELICA', label: 'Huancavelica' },
    { value: 'HUANUCO', label: 'Huánuco' },
    { value: 'ICA', label: 'Ica' },
    { value: 'JUNIN', label: 'Junín' },
    { value: 'LA LIBERTAD', label: 'La Libertad' },
    { value: 'LAMBAYEQUE', label: 'Lambayeque' },
    { value: 'LIMA', label: 'Lima' },
    { value: 'LORETO', label: 'Loreto' },
    { value: 'MADRE DE DIOS', label: 'Madre de Dios' },
    { value: 'MOQUEGUA', label: 'Moquegua' },
    { value: 'PASCO', label: 'Pasco' },
    { value: 'PIURA', label: 'Piura' },
    { value: 'PUNO', label: 'Puno' },
    { value: 'SAN MARTIN', label: 'San Martín' },
    { value: 'TACNA', label: 'Tacna' },
    { value: 'TUMBES', label: 'Tumbes' },
    { value: 'UCAYALI', label: 'Ucayali' },
  ];

  const provinces = {
    AMAZONAS: ['Chachapoyas', 'Bagua', 'Bongará', 'Condorcanqui', 'Luya', 'Rodríguez de Mendoza', 'Utcubamba'],
    ANCASH: ['Huaraz', 'Aija', 'Antonio Raymondi', 'Asunción', 'Bolognesi', 'Carhuaz', 'Carlos Fermín Fitzcarrald', 'Casma', 'Corongo', 'Huari', 'Huarmey', 'Huaylas', 'Mariscal Luzuriaga', 'Ocros', 'Pallasca', 'Pomabamba', 'Recuay', 'Santa', 'Sihuas', 'Yungay'],
    APURIMAC: ['Abancay', 'Andahuaylas', 'Antabamba', 'Aymaraes', 'Cotabambas', 'Chincheros', 'Grau'],
    AREQUIPA: ['Arequipa', 'Camaná', 'Caravelí', 'Castilla', 'Caylloma', 'Condesuyos', 'Islay', 'La Unión'],
    AYACUCHO: ['Huamanga', 'Cangallo', 'Huanca Sancos', 'Huanta', 'La Mar', 'Lucanas', 'Parinacochas', 'Pàucar del Sara Sara', 'Sucre', 'Víctor Fajardo', 'Vilcas Huamán'],
    CAJAMARCA: ['Cajamarca', 'Cajabamba', 'Celendín', 'Chota', 'Contumazá', 'Cutervo', 'Hualgayoc', 'Jaén', 'San Ignacio', 'San Marcos', 'San Miguel', 'San Pablo', 'Santa Cruz'],
    CALLAO: ['Callao'],
    CUSCO: ['Cusco', 'Acomayo', 'Anta', 'Calca', 'Canas', 'Canchis', 'Chumbivilcas', 'Espinar', 'La Convención', 'Paruro', 'Paucartambo', 'Quispicanchi', 'Urubamba'],
    HUANCAVELICA: ['Huancavelica', 'Acobamba', 'Angaraes', 'Castrovirreyna', 'Churcampa', 'Huaytará', 'Tayacaja'],
    HUANUCO: ['Huánuco', 'Ambo', 'Dos de Mayo', 'Huacaybamba', 'Huamalíes', 'Leoncio Prado', 'Marañón', 'Pachitea', 'Puerto Inca', 'Lauricocha', 'Yarowilca'],
    ICA: ['Ica', 'Chincha', 'Nazca', 'Palpa', 'Pisco'],
    JUNIN: ['Huancayo', 'Chanchamayo', 'Chupaca', 'Concepción', 'Jauja', 'Junín', 'Satipo', 'Tarma', 'Yauli'],
    'LA LIBERTAD': ['Trujillo', 'Ascope', 'Bolívar', 'Chepén', 'Gran Chimú', 'Julcán', 'Otuzco', 'Pacasmayo', 'Pataz', 'Sánchez Carrión', 'Santiago de Chuco', 'Virú'],
    LAMBAYEQUE: ['Chiclayo', 'Ferreñafe', 'Lambayeque'],
    LIMA: ['Lima', 'Barranca', 'Cajatambo', 'Canta', 'Cañete', 'Huaral', 'Huarochirí', 'Huaura', 'Oyón', 'Yauyos'],
    LORETO: ['Maynas', 'Alto Amazonas', 'Datem del Marañón', 'Loreto', 'Mariscal Ramón Castilla', 'Putumayo', 'Requena', 'Ucayali'],
    'MADRE DE DIOS': ['Tambopata', 'Manu', 'Tahuamanu'],
    MOQUEGUA: ['Mariscal Nieto', 'General Sánchez Cerro', 'Ilo'],
    PASCO: ['Pasco', 'Daniel Alcides Carrión', 'Oxapampa'],
    PIURA: ['Piura', 'Ayabaca', 'Huancabamba', 'Morropón', 'Paita', 'Sechura', 'Sullana', 'Talara'],
    PUNO: ['Puno', 'Azángaro', 'Carabaya', 'Chucuito', 'El Collao', 'Huancané', 'Lampa', 'Melgar', 'Moho', 'San Antonio de Putina', 'San Román', 'Sandia', 'Yunguyo'],
    'SAN MARTIN': ['Moyobamba', 'Bellavista', 'El Dorado', 'Huallaga', 'Lamas', 'Mariscal Cáceres', 'Picota', 'Rioja', 'San Martín', 'Tocache'],
    TACNA: ['Tacna', 'Candarave', 'Jorge Basadre', 'Tarata'],
    TUMBES: ['Tumbes', 'Contralmirante Villar', 'Zarumilla'],
    UCAYALI: ['Coronel Portillo', 'Atalaya', 'Padre Abad', 'Purús'],
  };

  const documentTypes = [
    { value: 'DNI', label: 'DNI' },
    { value: 'CE', label: 'Carné de Extranjería' },
    { value: 'PASAPORTE', label: 'Pasaporte' }
  ];


  const handleInputChange = (field, value) => {
    updateFormData({ [field]: value });
  };

  const handleDepartmentChange = (department) => {
    const newProvinces = provinces[department] || [];
    updateFormData({ 
      department,
      province: newProvinces[0] || ''
    });
  };

  return (
    <div>
      <div className="form-section">
        <h2 className="section-title">Completa tus datos personales</h2>
        
        <div className="form-row three-columns">
          <div className="form-group">
            <label className="form-label required">Nombres</label>
            <input
              type="text"
              className={`form-input ${errors.consumer_name ? 'error' : ''}`}
              value={formData.consumer_name}
              onChange={(e) => handleInputChange('consumer_name', e.target.value)}
              placeholder="Ingresa tus nombres"
            />
            {errors.consumer_name && <span className="form-error">{errors.consumer_name}</span>}
          </div>
          
          <div className="form-group">
            <label className="form-label required">Apellido paterno</label>
            <input
              type="text"
              className={`form-input ${errors.consumer_lastname_p ? 'error' : ''}`}
              value={formData.consumer_lastname_p}
              onChange={(e) => handleInputChange('consumer_lastname_p', e.target.value)}
              placeholder="Ingresa tu apellido paterno"
            />
            {errors.consumer_lastname_p && <span className="form-error">{errors.consumer_lastname_p}</span>}
          </div>
          
          <div className="form-group">
            <label className="form-label required">Apellido materno</label>
            <input
              type="text"
              className={`form-input ${errors.consumer_lastname_m ? 'error' : ''}`}
              value={formData.consumer_lastname_m}
              onChange={(e) => handleInputChange('consumer_lastname_m', e.target.value)}
              placeholder="Ingresa tu apellido materno"
            />
            {errors.consumer_lastname_m && <span className="form-error">{errors.consumer_lastname_m}</span>}
          </div>
        </div>
        
        <div className="form-row">
          <div className="form-group">
            <label className="form-label required">Tipo de documento</label>
            <select
              className={`form-select ${errors.document_type ? 'error' : ''}`}
              value={formData.document_type}
              onChange={(e) => handleInputChange('document_type', e.target.value)}
            >
              {documentTypes.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
            {errors.document_type && <span className="form-error">{errors.document_type}</span>}
          </div>
          
          <div className="form-group">
            <label className="form-label required">Número de documento</label>
            <input
              type="text"
              className={`form-input ${errors.document_number ? 'error' : ''}`}
              value={formData.document_number}
              onChange={(e) => handleInputChange('document_number', e.target.value)}
              placeholder="Ingresa tu número de documento"
              maxLength={formData.document_type === 'DNI' ? '8' : '15'}
              pattern={formData.document_type === 'DNI' ? '[0-9]{8}' : '[A-Za-z0-9]+'}
            />
            {errors.document_number && <span className="form-error">{errors.document_number}</span>}
          </div>
        </div>
        
        <div className="form-row">
          <div className="form-group">
            <label className="form-label required">Celular</label>
            <input
              type="tel"
              className={`form-input ${errors.phone ? 'error' : ''}`}
              value={formData.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              placeholder="Ingresa tu número de celular"
              maxLength="9"
              pattern="[0-9]{9}"
            />
            {errors.phone && <span className="form-error">{errors.phone}</span>}
          </div>
          
          <div className="form-group">
            <div className="checkbox-group">
              <input
                type="checkbox"
                id="is_minor"
                className="checkbox-input"
                checked={formData.is_minor}
                onChange={(e) => handleInputChange('is_minor', e.target.checked)}
              />
              <label htmlFor="is_minor" className="form-label">Soy menor de edad</label>
            </div>
          </div>
        </div>
      </div>
      
      <div className="form-section">
        <h2 className="section-title">Datos para el envío de respuesta</h2>
        
        <div className="form-group">
          <label className="form-label">Email</label>
          <input
            type="email"
            className={`form-input ${errors.email ? 'error' : ''}`}
            value={formData.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
            placeholder="Ingresa tu correo electrónico"
          />
          {errors.email && <span className="form-error">{errors.email}</span>}
          <small style={{ color: '#7f8c8d', fontSize: '12px', marginTop: '0.5rem', display: 'block' }}>
            Es importante que proporciones un email para recibir una copia de tu reclamo virtual. 
            Si no lo proporcionas, no impedirá que se presente tu reclamo, pero deberás descargar 
            e imprimir manualmente el comprobante.
          </small>
        </div>
        
        <div className="form-row">
          <div className="form-group">
            <label className="form-label required">Dirección</label>
            <input
              type="text"
              className={`form-input ${errors.address ? 'error' : ''}`}
              value={formData.address}
              onChange={(e) => handleInputChange('address', e.target.value)}
              placeholder="Ingresa tu dirección"
            />
            {errors.address && <span className="form-error">{errors.address}</span>}
          </div>
          
          <div className="form-group">
            <label className="form-label required">Departamento</label>
            <select
              className={`form-select ${errors.department ? 'error' : ''}`}
              value={formData.department}
              onChange={(e) => handleDepartmentChange(e.target.value)}
            >
              {departments.map(dept => (
                <option key={dept.value} value={dept.value}>{dept.label}</option>
              ))}
            </select>
            {errors.department && <span className="form-error">{errors.department}</span>}
          </div>
        </div>
        
        <div className="form-row">
          <div className="form-group">
            <label className="form-label required">Provincia</label>
            <select
              className={`form-select ${errors.province ? 'error' : ''}`}
              value={formData.province}
              onChange={(e) => handleInputChange('province', e.target.value)}
            >
              {(provinces[formData.department] || []).map(prov => (
                <option key={prov} value={prov}>{prov}</option>
              ))}
            </select>
            {errors.province && <span className="form-error">{errors.province}</span>}
          </div>
          
          <div className="form-group">
            <label className="form-label required">Distrito</label>
            <input
              type="text"
              className={`form-input ${errors.district ? 'error' : ''}`}
              value={formData.district}
              onChange={(e) => handleInputChange('district', e.target.value)}
              placeholder="Ingresa tu distrito"
            />
            {errors.district && <span className="form-error">{errors.district}</span>}
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Relación con la empresa (opcional)</label>
            <input
              type="text"
              className={`form-input ${errors.relationship_with_company ? 'error' : ''}`}
              value={formData.relationship_with_company}
              onChange={(e) => handleInputChange('relationship_with_company', e.target.value)}
              placeholder="Ej: Cliente, Proveedor, etc."
              maxLength="100"
            />
            {errors.relationship_with_company && <span className="form-error">{errors.relationship_with_company}</span>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Step1;
