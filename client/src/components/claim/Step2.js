import React from 'react';

const Step2 = ({ formData, errors, updateFormData }) => {
  const relationshipOptions = [
    'Soy un cliente de la empresa',
    'Estoy en proceso de ser un cliente de la empresa',
    'He comprado en un comercio que utiliza los servicios de la empresa',
    'Otro'
  ];

  const handleInputChange = (field, value) => {
    updateFormData({ [field]: value });
  };

  const handleRelationshipChange = (value) => {
    if (value === 'Otro') {
      updateFormData({ 
        relationship_with_company: 'Otro',
        relationship_custom: ''
      });
    } else {
      updateFormData({ 
        relationship_with_company: value,
        relationship_custom: ''
      });
    }
  };

  return (
    <div>
      <div className="form-section">
        <h2 className="section-title">¿Cuál es tu relación con la empresa? (Opcional)</h2>
        
        <div className="radio-group">
          {relationshipOptions.map((option, index) => (
            <div
              key={index}
              className={`radio-option ${
                formData.relationship_with_company === option ? 'selected' : ''
              }`}
              onClick={() => handleRelationshipChange(option)}
            >
              <input
                type="radio"
                name="relationship"
                className="radio-input"
                checked={formData.relationship_with_company === option}
                onChange={() => handleRelationshipChange(option)}
              />
              <label className="radio-label">{option}</label>
            </div>
          ))}
        </div>
        
        {formData.relationship_with_company === 'Otro' && (
          <div className="form-group" style={{ marginTop: '1rem' }}>
            <label className="form-label">Especifica tu relación</label>
            <input
              type="text"
              className="form-input"
              value={formData.relationship_custom || ''}
              onChange={(e) => handleInputChange('relationship_custom', e.target.value)}
              placeholder="Describe tu relación con la empresa"
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default Step2;
