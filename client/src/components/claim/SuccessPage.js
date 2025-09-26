import React from 'react';

const SuccessPage = ({ claimData, companyInfo }) => {
  const downloadPDF = () => {
    if (claimData?.pdf_url) {
      // Agregar la URL base del backend
      const fullUrl = claimData.pdf_url;
      window.open(fullUrl, '_blank');
    }
  };

  const startNewClaim = () => {
    window.location.reload();
  };

  return (
    <div className="success-container">
      <div className="success-icon" style={{ color: '#2c3e50' }}>✅</div>
      
      <h1 className="success-title">¡Reclamo Enviado Exitosamente!</h1>
      
      <div className="success-message">
        <p>Tu {claimData?.claim_type || 'reclamo'} ha sido registrado correctamente en nuestro sistema.</p>
        
        {claimData && (
          <div style={{ 
            background: '#2c3e50', 
            padding: '1rem', 
            borderRadius: '6px', 
            margin: '1rem 0',
            textAlign: 'left',
            color: 'white'
          }}>
            <h3 style={{ color: 'white', marginBottom: '0.5rem' }}>
              Detalles de tu reclamo:
            </h3>
            <p><strong>Número de reclamo:</strong> {claimData.claim_number}</p>
            <p><strong>Fecha de envío:</strong> {new Date().toLocaleDateString('es-PE')}</p>
            <p><strong>Estado:</strong> Pendiente de revisión</p>
          </div>
        )}
        
        <p>
          Hemos enviado una copia de tu reclamo a tu correo electrónico (si lo proporcionaste). 
          También puedes descargar el PDF desde el botón de abajo.
        </p>
        
        <p>
          Nuestro equipo revisará tu {claimData?.claim_type || 'reclamo'} y te contactaremos 
          a través del medio de comunicación que especificaste.
        </p>
      </div>
      
      <div className="success-actions">
        <button
          type="button"
          className="btn btn-primary"
          onClick={downloadPDF}
        >
          📄 Descargar PDF
        </button>
        
        <button
          type="button"
          className="btn btn-secondary"
          onClick={startNewClaim}
        >
          📝 Nuevo Reclamo
        </button>
      </div>
      
      <div style={{ 
        marginTop: '2rem', 
        padding: '1rem', 
        background: '#f8f9fa', 
        borderRadius: '6px',
        fontSize: '14px',
        color: '#666'
      }}>
        <h4 style={{ color: '#2c3e50', marginBottom: '0.5rem' }}>
          Información de contacto:
        </h4>
        <p><strong>{companyInfo.name}</strong></p>
        {companyInfo.ruc && <p>RUC: {companyInfo.ruc}</p>}
        {companyInfo.address && <p>Dirección: {companyInfo.address}</p>}
        {companyInfo.phone && <p>Teléfono: {companyInfo.phone}</p>}
        {companyInfo.website && <p>Web: {companyInfo.website}</p>}
        {companyInfo.support_email && <p>Soporte: {companyInfo.support_email}</p>}
      </div>
      
      <div className="important-notice" style={{ marginTop: '2rem' }}>
        <h4>Próximos pasos:</h4>
        <p>• Tu reclamo será revisado por nuestro equipo especializado</p>
        <p>• Recibirás una respuesta dentro del plazo establecido por ley</p>
        <p>• Puedes consultar el estado contactándonos directamente</p>
        <p>• Guarda el número de reclamo para futuras consultas</p>
      </div>
    </div>
  );
};

export default SuccessPage;
