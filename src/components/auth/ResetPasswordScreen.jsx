import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Card from '../ui/Card';
import SectionTitle from '../ui/SectionTitle';
import PasswordInput from '../ui/PasswordInput';

export default function ResetPasswordScreen() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isPasswordValid, setIsPasswordValid] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    // Verificar si tenemos los parámetros necesarios para el reset
    const accessToken = searchParams.get('access_token');
    const refreshToken = searchParams.get('refresh_token');
    
    if (!accessToken || !refreshToken) {
      setMessage('Enlace de recuperación inválido o expirado.');
      return;
    }

    // Establecer la sesión con los tokens
    supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken
    });
  }, [searchParams]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!isPasswordValid) {
      setMessage('La contraseña no cumple con los requisitos de seguridad.');
      return;
    }

    if (password !== confirmPassword) {
      setMessage('Las contraseñas no coinciden.');
      return;
    }

    setIsSubmitting(true);
    setMessage('');

    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) {
        setMessage(error.message);
        setIsSuccess(false);
      } else {
        setMessage('Contraseña actualizada exitosamente. Serás redirigido al login.');
        setIsSuccess(true);
        
        // Redirigir al login después de 3 segundos
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      }
    } catch (error) {
      console.error('Error updating password:', error);
      setMessage('Error al actualizar la contraseña. Inténtalo de nuevo.');
      setIsSuccess(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
    setMessage(''); // Limpiar mensaje al cambiar contraseña
  };

  const handleConfirmPasswordChange = (e) => {
    setConfirmPassword(e.target.value);
    setMessage(''); // Limpiar mensaje al cambiar confirmación
  };

  return (
    <div className="min-h-screen grid place-items-center bg-gradient-to-b from-sky-50 to-emerald-50 dark:from-gray-900 dark:to-gray-800">
      <Card>
        <div className="text-center mb-6">
          <SectionTitle>Nueva Contraseña</SectionTitle>
          <p className="text-gray-600 dark:text-gray-400 text-sm mt-2">
            Ingresa tu nueva contraseña
          </p>
        </div>

        {!isSuccess ? (
          <form onSubmit={handleSubmit} className="grid gap-4 w-80">
            <PasswordInput
              value={password}
              onChange={handlePasswordChange}
              onValidationChange={setIsPasswordValid}
              placeholder="Nueva contraseña"
              showStrengthMeter={true}
              required
            />

            <div className="space-y-1">
              <input
                type="password"
                value={confirmPassword}
                onChange={handleConfirmPasswordChange}
                placeholder="Confirmar contraseña"
                className={`
                  w-full px-3 py-2 border rounded-xl transition-colors duration-200
                  ${confirmPassword && password !== confirmPassword
                    ? 'border-red-500 focus:border-red-500 focus:ring-red-200'
                    : confirmPassword && password === confirmPassword
                      ? 'border-green-500 focus:border-green-500 focus:ring-green-200'
                      : 'border-gray-300 focus:border-blue-500 focus:ring-blue-200'
                  }
                  focus:outline-none focus:ring-2 focus:ring-opacity-50
                  dark:bg-gray-800 dark:border-gray-600 dark:text-white
                `}
                required
              />
              
              {confirmPassword && password !== confirmPassword && (
                <p className="text-red-500 text-sm flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Las contraseñas no coinciden
                </p>
              )}
              
              {confirmPassword && password === confirmPassword && (
                <p className="text-green-500 text-sm flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Las contraseñas coinciden
                </p>
              )}
            </div>

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
              disabled={!isPasswordValid || password !== confirmPassword || isSubmitting}
              className={`
                px-4 py-2 rounded-xl text-white font-medium transition-all duration-200
                ${(!isPasswordValid || password !== confirmPassword || isSubmitting)
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
                  Actualizando...
                </div>
              ) : (
                'Actualizar contraseña'
              )}
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

            <div className="flex items-center justify-center text-sm text-gray-600 dark:text-gray-400">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Redirigiendo al login...
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}