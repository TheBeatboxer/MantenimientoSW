import React from 'react';

const ProgressBar = ({ currentStep }) => {
  const steps = [
    { number: 1, label: 'Datos Personales' },
    { number: 2, label: 'Relación con la Empresa' },
    { number: 3, label: 'Detalles del Reclamo' }
  ];

  return (
    <div className="progress-bar">
      {steps.map((step, index) => (
        <React.Fragment key={step.number}>
          <div className="progress-step">
            <div
              className={`progress-circle ${
                currentStep > step.number
                  ? 'completed'
                  : currentStep === step.number
                  ? 'active'
                  : 'pending'
              }`}
            >
              {currentStep > step.number ? '✓' : step.number}
            </div>
          </div>
          {index < steps.length - 1 && (
            <div
              className={`progress-line ${
                currentStep > step.number ? 'completed' : ''
              }`}
            />
          )}
        </React.Fragment>
      ))}
    </div>
  );
};

export default ProgressBar;
