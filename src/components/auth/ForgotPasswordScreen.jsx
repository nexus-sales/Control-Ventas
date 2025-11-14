import React, { useState, useEffect } from 'react';
// Eliminado: Supabase no se usa en modo local
import { useAuth } from '../../hooks/useAuth';
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
  const { offlineMode } = useAuth();

  useEffect(() => {
    if (offlineMode) {
      setMessage('La recuperación de contraseña no está disponible en modo offline. Conéctate a internet para continuar.');
    }
  }, [offlineMode]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!isEmailValid) {
      setMessage('Por favor, ingresa un email válido.');
      return;
    }

    // Verificar modo offline primero
    if (offlineMode) {
      setMessage('La recuperación de contraseña no está disponible en modo offline. Conéctate a internet para continuar.');
      return;
    }

    setIsSubmitting(true);
    setMessage('');

    try {
      // Verificar conectividad primero
      if (typeof navigator !== 'undefined' && navigator.onLine === false) {
        setMessage('No hay conexión a internet. Verifica tu conectividad.');
        setIsSuccess(false);
        return;
      }

      console.log('Attempting to send reset email to:', email);
      
      const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      console.log('Reset password response:', { data, error });

      if (error) {
        console.error('Supabase reset password error:', error);
        
        // Manejar errores específicos de Supabase
        if (error.message.includes('fetch')) {
          setMessage('Error de conexión. Verifica tu internet y que Supabase esté configurado correctamente.');
        } else if (error.message.includes('Invalid email')) {
          setMessage('El email ingresado no es válido.');
        } else if (error.message.includes('Email not confirmed')) {
          setMessage('El email no está confirmado. Contacta al administrador.');
        } else if (error.message.includes('User not found')) {
          setMessage('No existe una cuenta con ese email.');
        } else {
          setMessage(`Error: ${error.message}`);
        }
        setIsSuccess(false);
      } else {
        console.log('Reset email sent successfully');
        setMessage('Se ha enviado un enlace de recuperación a tu email. Revisa tu bandeja de entrada y la carpeta de spam.');
        setIsSuccess(true);
      }
    } catch (error) {
      console.error('Unexpected error sending reset email:', error);
      
      // Manejar errores de red
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        setMessage('Error de conexión. Verifica tu internet y que el servidor esté disponible.');
      } else if (error.name === 'AbortError') {
        setMessage('La solicitud tardó demasiado. Inténtalo de nuevo.');
      } else {
        setMessage(`Error inesperado: ${error.message || 'Problema de conexión'}`);
      }
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
    <div className="min-h-screen grid place-items-center bg-gradient-to-br from-sky-50 via-indigo-50 to-emerald-50 dark:from-gray-900 dark:via-slate-900 dark:to-gray-800 animate-fadeIn relative overflow-hidden">
      {/* Elementos decorativos de fondo */}
      <div className="absolute inset-0 opacity-10 dark:opacity-5">
        <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-blue-500 rounded-full blur-3xl animate-pulse-slow"></div>
        <div className="absolute bottom-1/4 right-1/4 w-40 h-40 bg-emerald-500 rounded-full blur-3xl animate-pulse-slow animate-delay-300"></div>
        <div className="absolute top-3/4 left-3/4 w-24 h-24 bg-indigo-500 rounded-full blur-3xl animate-pulse-slow animate-delay-500"></div>
      </div>
      
      <Card className="animate-slideUp card-shadow hover-lift smooth-transition relative z-10">
        <div className="text-center mb-6">
          <SectionTitle>Recuperar Contraseña</SectionTitle>
          <p className="text-gray-600 dark:text-gray-400 text-sm mt-2">
            Ingresa tu email y te enviaremos un enlace para restablecer tu contraseña
          </p>
        </div>

        {!isSuccess ? (
          <form onSubmit={handleSubmit} className="grid gap-4 w-80">
            {/* Información de diagnóstico */}
            <div className="text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 p-2 rounded">
              <p>Estado: {navigator.onLine ? '🟢 Online' : '🔴 Offline'}</p>
              <p>Modo: {offlineMode ? '🔴 Offline Mode' : '🟢 Online Mode'}</p>
              <p>Supabase: {import.meta.env.VITE_SUPABASE_URL ? '🟢 Configurado' : '🔴 No configurado'}</p>
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

            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={async () => {
                  try {
                    const response = await fetch(import.meta.env.VITE_SUPABASE_URL + '/rest/v1/', {
                      method: 'GET',
                      headers: {
                        'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
                        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
                      }
                    });
                    if (response.ok) {
                      setMessage('✅ Conexión con Supabase exitosa');
                    } else {
                      setMessage(`❌ Error de conexión: ${response.status}`);
                    }
                  } catch (error) {
                    setMessage(`❌ Error de red: ${error.message}`);
                  }
                }}
                className="text-xs bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 px-2 py-1 rounded transition-colors duration-200"
              >
                🔧 Probar conexión
              </button>
              
              <button
                type="button"
                onClick={onBackToLogin}
                className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm transition-colors duration-200"
              >
                ← Volver al login
              </button>
            </div>
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