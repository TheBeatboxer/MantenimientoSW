import React, { useState } from 'react';
import { useCompany } from '../context/CompanyContext';
import Step1 from './claim/Step1';
import Step2 from './claim/Step2';
import Step3 from './claim/Step3';
import SuccessPage from './claim/SuccessPage';
import ProgressBar from './claim/ProgressBar';

const ClaimForm = () => {
  const { companyInfo } = useCompany();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    // Datos personales
    consumer_name: '',
    consumer_lastname_p: '',
    consumer_lastname_m: '',
    document_type: 'DNI',
    document_number: '',
    phone: '',
    email: '',
    is_minor: false,
    
    // Dirección
    address: '',
    department: 'LIMA',
    province: 'LIMA',
    district: '',
    
    // Medio de comunicación
    communication_medium: 'Correo electrónico',
    
    // Relación con la empresa
    relationship_with_company: '',
    
    // Datos del reclamo
    claim_type: 'reclamo',
    product_service_type: 'servicio',
    currency: 'PEN',
    amount: '',
    detail: '',
    request: '',
    
    // Archivos
    files: []
  });
  
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedClaim, setSubmittedClaim] = useState(null);

  const validateStep = (step) => {
    const newErrors = {};
    
    switch (step) {
      case 1:
        if (!formData.consumer_name.trim()) newErrors.consumer_name = 'El nombre es requerido';
        if (!formData.consumer_lastname_p.trim()) newErrors.consumer_lastname_p = 'El apellido paterno es requerido';
        if (!formData.consumer_lastname_m.trim()) newErrors.consumer_lastname_m = 'El apellido materno es requerido';
        if (!formData.document_number.trim()) newErrors.document_number = 'El número de documento es requerido';
        if (!formData.phone.trim()) newErrors.phone = 'El teléfono es requerido';
        if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'El email no es válido';
        if (formData.address.trim().length < 5) newErrors.address = 'La dirección debe tener al menos 5 caracteres';
        if (!formData.district.trim()) newErrors.district = 'El distrito es requerido';
        if (formData.relationship_with_company && formData.relationship_with_company.length > 100) {
          newErrors.relationship_with_company = 'La relación con la empresa no puede exceder 100 caracteres';
        }
        break;
        
      case 2:
        // El paso 2 es opcional según las imágenes
        break;
        
      case 3:
        if (!formData.detail.trim()) newErrors.detail = 'El detalle es requerido';
        if (formData.detail.trim().length < 10) newErrors.detail = 'El detalle debe tener al menos 10 caracteres';
        if (formData.request.trim().length > 0 && formData.request.trim().length < 10) newErrors.request = 'El pedido debe tener al menos 10 caracteres';
        break;
      default:
        break;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 3));
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    if (!validateStep(3)) return;
    
    setIsSubmitting(true);
    
    try {
      const formDataToSend = new FormData();
      
      // Agregar todos los campos del formulario
      Object.keys(formData).forEach(key => {
        if (key !== 'files') {
          formDataToSend.append(key, formData[key]);
        }
      });
      
      // Agregar archivos
      formData.files.forEach(file => {
        formDataToSend.append('files', file);
      });
      
      const response = await fetch('/api/claims', {
        method: 'POST',
        body: formDataToSend
      });
      
      const result = await response.json();
      
      if (response.ok) {
        setSubmittedClaim(result.data);
        setCurrentStep(4); // Ir a página de éxito
      } else {
        const errorMsg = result.details ? result.details.map(d => d.msg).join(', ') : result.error;
        throw new Error(errorMsg || 'Error al enviar el reclamo');
      }
    } catch (error) {
      console.error('Error submitting claim:', error);
      setErrors({ submit: error.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateFormData = (updates) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <Step1
            formData={formData}
            errors={errors}
            updateFormData={updateFormData}
            companyInfo={companyInfo}
          />
        );
      case 2:
        return (
          <Step2
            formData={formData}
            errors={errors}
            updateFormData={updateFormData}
          />
        );
      case 3:
        return (
          <Step3
            formData={formData}
            errors={errors}
            updateFormData={updateFormData}
          />
        );
      case 4:
        return (
          <SuccessPage
            claimData={submittedClaim}
            companyInfo={companyInfo}
          />
        );
      default:
        return null;
    }
  };

  if (currentStep === 4) {
    return renderStep();
  }

  return (
    <div className="form-container">
      <div className="form-header" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', textAlign: 'center', background: 'white' }}>
        {(companyInfo?.logo_view_url || true) && (
          <img src={`/api/company-info/logo`} alt="Logo" style={{ height: 64, objectFit: 'contain' }} />
        )}
      </div>
      
      <div className="form-content">
        <div className="company-info">
          <p><strong>{companyInfo?.name || ''}</strong></p>
          {companyInfo?.ruc && <p>RUC: {companyInfo.ruc}</p>}
          {companyInfo?.address && <p>Dirección: {companyInfo.address}</p>}
          {companyInfo?.phone && <p>Teléfono: {companyInfo.phone}</p>}
          {companyInfo?.website && <p>Sitio web: {companyInfo.website}</p>}
          {companyInfo?.support_email && <p>Soporte: {companyInfo.support_email}</p>}
          <p>Fecha: {new Date().toLocaleDateString('es-PE')}</p>
        </div>
        
        <ProgressBar currentStep={currentStep} />
        
        {renderStep()}
        
        {currentStep < 4 && (
          <div className="form-actions">
            <div className="page-indicator">
              {currentStep}/3
            </div>
            
            <div style={{ display: 'flex', gap: '1rem' }}>
              {currentStep > 1 && (
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={prevStep}
                  disabled={isSubmitting}
                >
                  Atrás
                </button>
              )}
              
              {currentStep < 3 ? (
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={nextStep}
                  disabled={isSubmitting}
                >
                  Siguiente
                </button>
              ) : (
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <div className="spinner"></div>
                      Enviando...
                    </>
                  ) : (
                    'Enviar'
                  )}
                </button>
              )}
            </div>
          </div>
        )}
        
        {errors.submit && (
          <div className="form-error" style={{ textAlign: 'center', marginTop: '1rem' }}>
            {errors.submit}
          </div>
        )}
        
        <div className="important-notice">
          <h4>Importante:</h4>
          <p>La presente hoja de reclamación implica únicamente la recepción de la reclamación, más no la aceptación de su contenido; esta reclamación será tramitada de acuerdo a ley.</p>
          <p>La formulación del reclamo no impide acudir a otras vías de solución de controversias ni es requisito previo para interponer una denuncia ante el INDECOPI.</p>
          <p>En caso no consigne como mínimo su nombre, DNI, domicilio o correo electrónico, reclamo o queja y el detalle del mismo, de conformidad con el artículo 5 del Reglamento del Libro de Reclamaciones, su reclamo o queja se considera como no presentado.</p>
        </div>
      </div>
    </div>
  );
};

export default ClaimForm;
