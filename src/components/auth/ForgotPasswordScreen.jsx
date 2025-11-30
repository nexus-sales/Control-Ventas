import React, { useState } from 'react';
// ...existing code...
import Card from '../ui/Card';
import SectionTitle from '../ui/SectionTitle';
import EmailInput from '../ui/EmailInput';
import '../../styles/login-animations.css';

export default function ForgotPasswordScreen({ onBackToLogin }) {
  const [email, setEmail] = useState('');
  const [isEmailValid, setIsEmailValid] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!isEmailValid) {
      setMessage('Por favor, ingresa un email válido.');
      return;
    }

    setIsSubmitting(true);
    setMessage('');

    // Modo localStorage local - sin servicios externos
    setTimeout(() => {
      setMessage('En modo local, contacta al administrador para restablecer tu contraseña.');
      setIsSuccess(true);
      setIsSubmitting(false);
    }, 1000);
  };

  const handleEmailChange = (e) => {
    setEmail(e.target.value);
    setMessage('');
  };

  return (
    <div className="min-h-screen grid place-items-center bg-gradient-to-br from-sky-50 via-indigo-50 to-emerald-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 animate-fadeIn relative overflow-hidden">
      {/* Elementos decorativos de fondo */}
      <div className="absolute inset-0 opacity-10 dark:opacity-5">
        <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-blue-500 rounded-full blur-3xl animate-pulse-slow"></div>
        <div className="absolute bottom-1/4 right-1/4 w-40 h-40 bg-emerald-500 rounded-full blur-3xl animate-pulse-slow animate-delay-300"></div>
        <div className="absolute top-3/4 left-3/4 w-24 h-24 bg-indigo-500 rounded-full blur-3xl animate-pulse-slow animate-delay-500"></div>
      </div>
      
      <Card className="animate-slideUp card-shadow hover-lift smooth-transition relative z-10 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
        <div className="text-center mb-6">
          <SectionTitle className="text-gray-900 dark:text-gray-100">Recuperar Contraseña</SectionTitle>
          <p className="text-gray-600 dark:text-gray-400 text-sm mt-2">
            En modo local, contacta al administrador para restablecer tu contraseña
          </p>
        </div>

        {!isSuccess ? (
          <form onSubmit={handleSubmit} className="grid gap-4 w-80">
            {/* Información de modo local */}
            <div className="text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/50 p-2 rounded border border-gray-200 dark:border-gray-700">
              <p>Estado: {navigator.onLine ? '🟢 Online' : '🔴 Offline'}</p>
              <p>Modo: Solo Local - Sin servicios externos</p>
            </div>
            
            <EmailInput
              value={email}
              onChange={handleEmailChange}
              onValidationChange={setIsEmailValid}
              placeholder="Tu email"
              required
            />

            {message && !isSuccess && (
              <div className="text-red-600 dark:text-red-400 text-sm bg-red-50 dark:bg-red-900/20 p-3 rounded-lg border border-red-200 dark:border-red-800">
                <div className="flex items-center">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {message}
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={!isEmailValid || isSubmitting}
              className={`
                px-4 py-2 rounded-xl text-white font-medium transition-all duration-200
                ${(!isEmailValid || isSubmitting)
                  ? 'bg-gray-400 dark:bg-gray-600 cursor-not-allowed'
                  : 'bg-blue-600 dark:bg-blue-700 hover:bg-blue-700 dark:hover:bg-blue-600 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800'
                }
              `}
            >
              {isSubmitting ? (
                <div className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Enviando...
                </div>
              ) : (
                'Continuar'
              )}
            </button>

            <button
              type="button"
              onClick={onBackToLogin}
              className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm transition-colors duration-200"
            >
              ← Volver al login
            </button>
          </form>
        ) : (
          <div className="w-80 text-center space-y-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-center justify-center mb-2">
                <svg className="w-8 h-8 text-blue-500 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-blue-700 dark:text-blue-300 text-sm">
                {message}
              </p>
            </div>

            <div className="text-gray-600 dark:text-gray-400 text-sm space-y-2">
              <p>Para restablecer tu contraseña:</p>
              <ul className="text-xs space-y-1">
                <li>• Contacta al administrador del sistema</li>
                <li>• Proporciona tu email: {email}</li>
                <li>• El administrador creará una nueva contraseña</li>
              </ul>
            </div>

            <button
              onClick={onBackToLogin}
              className="w-full px-4 py-2 bg-gray-600 dark:bg-gray-700 hover:bg-gray-700 dark:hover:bg-gray-600 text-white rounded-xl transition-colors duration-200"
            >
              Volver al login
            </button>
          </div>
        )}
      </Card>
    </div>
  );
}