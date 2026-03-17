import React from 'react';
import './FormStepper.css';

const FormStepper = ({ steps, currentStep, onStepClick }) => {
  return (
    <div className="step-indicator">
      {steps.map((step, index) => {
        const stepNum = index + 1;
        const isActive = currentStep === stepNum;
        const isCompleted = currentStep > stepNum;
        const isLast = index === steps.length - 1;

        return (
          <React.Fragment key={index}>
            <div
              className={`step-item ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}
              onClick={() => onStepClick && onStepClick(stepNum)}
              style={onStepClick ? { cursor: 'pointer' } : {}}
            >
              <div className="step-circle">
                {isCompleted ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                ) : (
                  stepNum
                )}
              </div>
              <span className="step-label">{step.label}</span>
            </div>
            {!isLast && (
              <div className={`step-line ${isCompleted ? 'active' : ''}`}></div>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

export default FormStepper;
