import React, { useState, useEffect } from 'react';
import { evaluatePasswordStrength } from '../../utils/authValidation';

export default function PasswordInput({ 
  value, 
  onChange, 
  onValidationChange,
  placeholder = "Contraseña",
  showStrengthMeter = true,
  className = "",
  ...props 
}) {
  const [showPassword, setShowPassword] = useState(false);
  const [strength, setStrength] = useState({ score: 0, message: '', suggestions: [] });
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    const result = evaluatePasswordStrength(value);
    setStrength(result);
    
    // Notificar al componente padre sobre el estado de validación
    if (onValidationChange) {
      onValidationChange(result.score >= 50); // Consideramos válido si score >= 50
    }
  }, [value, onValidationChange]);

  const handleBlur = () => {
    setTouched(true);
  };

  const toggleShowPassword = () => {
    setShowPassword(!showPassword);
  };

  const getStrengthColor = (score) => {
    if (score < 30) return 'bg-red-500';
    if (score < 50) return 'bg-orange-500';
    if (score < 70) return 'bg-yellow-500';
    if (score < 90) return 'bg-blue-500';
    return 'bg-green-500';
  };

  const getStrengthTextColor = (score) => {
    if (score < 30) return 'text-red-500';
    if (score < 50) return 'text-orange-500';
    if (score < 70) return 'text-yellow-600';
    if (score < 90) return 'text-blue-500';
    return 'text-green-500';
  };

  return (
    <div className="space-y-2">
      <div className="relative">
        <input
          type={showPassword ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          onBlur={handleBlur}
          placeholder={placeholder}
          className={`
            w-full px-3 py-2 pr-10 border rounded-xl transition-colors duration-200
            border-gray-300 focus:border-blue-500 focus:ring-blue-200
            focus:outline-none focus:ring-2 focus:ring-opacity-50
            dark:bg-gray-800 dark:border-gray-600 dark:text-white
            ${className}
          `}
          {...props}
        />
        
        {/* Botón para mostrar/ocultar contraseña */}
        <button
          type="button"
          onClick={toggleShowPassword}
          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          {showPassword ? (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          )}
        </button>
      </div>
      
      {/* Medidor de fortaleza de contraseña */}
      {showStrengthMeter && touched && value && (
        <div className="space-y-2">
          {/* Barra de fortaleza */}
          <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
            <div 
              className={`h-2 rounded-full transition-all duration-300 ${getStrengthColor(strength.score)}`}
              style={{ width: `${strength.score}%` }}
            ></div>
          </div>
          
          {/* Mensaje de fortaleza */}
          <div className="flex justify-between items-center">
            <span className={`text-sm font-medium ${getStrengthTextColor(strength.score)}`}>
              {strength.message}
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {strength.score}%
            </span>
          </div>
          
          {/* Sugerencias de mejora */}
          {strength.suggestions.length > 0 && strength.score < 70 && (
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Para mejorar tu contraseña:</p>
              <ul className="text-xs text-gray-500 dark:text-gray-500 space-y-1">
                {strength.suggestions.slice(0, 3).map((suggestion, index) => (
                  <li key={index} className="flex items-center">
                    <span className="w-1 h-1 bg-gray-400 rounded-full mr-2"></span>
                    {suggestion}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}