import React, { useState, useEffect } from 'react';
import { validateEmail } from '../../utils/authValidation';

export default function EmailInput({ 
  value, 
  onChange, 
  onValidationChange,
  placeholder = "Email",
  className = "",
  ...props 
}) {
  const [validation, setValidation] = useState({ isValid: false, message: '' });
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    const result = validateEmail(value);
    setValidation(result);
    
    // Notificar al componente padre sobre el estado de validación
    if (onValidationChange) {
      onValidationChange(result.isValid);
    }
  }, [value, onValidationChange]);

  const handleBlur = () => {
    setTouched(true);
  };

  const showError = touched && !validation.isValid && validation.message;
  const showSuccess = touched && validation.isValid && value;

  return (
    <div className="space-y-1">
      <div className="relative">
        <input
          type="email"
          value={value}
          onChange={onChange}
          onBlur={handleBlur}
          placeholder={placeholder}
          className={`
            w-full px-3 py-2 border rounded-xl transition-colors duration-200
            ${showError 
              ? 'border-red-500 focus:border-red-500 focus:ring-red-200' 
              : showSuccess 
                ? 'border-green-500 focus:border-green-500 focus:ring-green-200'
                : 'border-gray-300 focus:border-blue-500 focus:ring-blue-200'
            }
            focus:outline-none focus:ring-2 focus:ring-opacity-50
            dark:bg-gray-800 dark:border-gray-600 dark:text-white
            ${className}
          `}
          {...props}
        />
        
        {/* Icono de validación */}
        {touched && value && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            {validation.isValid ? (
              <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            )}
          </div>
        )}
      </div>
      
      {/* Mensaje de validación */}
      {showError && (
        <p className="text-red-500 text-sm flex items-center">
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {validation.message}
        </p>
      )}
      
      {showSuccess && (
        <p className="text-green-500 text-sm flex items-center">
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          {validation.message}
        </p>
      )}
    </div>
  );
}