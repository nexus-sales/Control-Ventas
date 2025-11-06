import React, { useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import Card from '../ui/Card';
import SectionTitle from '../ui/SectionTitle';
import EmailInput from '../ui/EmailInput';

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

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        setMessage(error.message);
        setIsSuccess(false);
      } else {
        setMessage('Se ha enviado un enlace de recuperación a tu email. Revisa tu bandeja de entrada.');
        setIsSuccess(true);
      }
    } catch (error) {
      console.error('Error sending reset email:', error);
      setMessage('Error al enviar el email de recuperación. Inténtalo de nuevo.');
      setIsSuccess(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEmailChange = (e) => {
    setEmail(e.target.value);
    setMessage(''); // Limpiar mensaje al cambiar email
  };

  return (
    <div className="min-h-screen grid place-items-center bg-gradient-to-b from-sky-50 to-emerald-50 dark:from-gray-900 dark:to-gray-800">
      <Card>
        <div className="text-center mb-6">
          <SectionTitle>Recuperar Contraseña</SectionTitle>
          <p className="text-gray-600 dark:text-gray-400 text-sm mt-2">
            Ingresa tu email y te enviaremos un enlace para restablecer tu contraseña
          </p>
        </div>

        {!isSuccess ? (
          <form onSubmit={handleSubmit} className="grid gap-4 w-80">
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
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 focus:ring-2 focus:ring-blue-200'
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
                'Enviar enlace de recuperación'
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
            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
              <div className="flex items-center justify-center mb-2">
                <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-green-700 dark:text-green-300 text-sm">
                {message}
              </p>
            </div>

            <div className="text-gray-600 dark:text-gray-400 text-sm space-y-2">
              <p>Si no recibes el email en unos minutos:</p>
              <ul className="text-xs space-y-1">
                <li>• Revisa tu carpeta de spam</li>
                <li>• Verifica que el email sea correcto</li>
                <li>• Contacta al administrador si persiste el problema</li>
              </ul>
            </div>

            <button
              onClick={onBackToLogin}
              className="w-full px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-xl transition-colors duration-200"
            >
              Volver al login
            </button>
          </div>
        )}
      </Card>
    </div>
  );
}