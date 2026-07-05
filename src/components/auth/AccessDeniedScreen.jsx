import React from 'react';
import Card from '../ui/Card';
import SectionTitle from '../ui/SectionTitle';

const DEFAULT_MESSAGE = {
  title: 'Acceso no disponible',
  message: 'No se pudo determinar tu nivel de acceso a la aplicación. Contacta con tu administrador si el problema persiste.',
};

export default function AccessDeniedScreen({ email, accessInfo, onRetry, onBackToLogin }) {
  const accessMessage = accessInfo || DEFAULT_MESSAGE;

  return (
    <div className="min-h-screen grid place-items-center bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 dark:from-gray-900 dark:via-red-900/20 dark:to-gray-800 animate-fadeIn relative overflow-hidden">
      {/* Elementos decorativos de fondo */}
      <div className="absolute inset-0 opacity-10 dark:opacity-5">
        <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-red-500 rounded-full blur-3xl animate-pulse-slow"></div>
        <div className="absolute bottom-1/4 right-1/4 w-40 h-40 bg-orange-500 rounded-full blur-3xl animate-pulse-slow animate-delay-300"></div>
        <div className="absolute top-3/4 left-3/4 w-24 h-24 bg-yellow-500 rounded-full blur-3xl animate-pulse-slow animate-delay-500"></div>
      </div>

      <Card className="animate-slideUp card-shadow hover-lift smooth-transition relative z-10 max-w-md bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
        <div className="text-center">
          {/* Icono de acceso denegado */}
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L5.636 5.636" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0 0v2m0-2h2m-2 0h-2" />
              </svg>
            </div>
          </div>

          <SectionTitle className="text-red-600 dark:text-red-400">
            {accessMessage.title}
          </SectionTitle>

          <p className="text-gray-600 dark:text-gray-400 text-sm mt-4 mb-6 leading-relaxed">
            {accessMessage.message}
          </p>

          {email && (
            <div className="bg-gray-50 dark:bg-gray-900/50 p-3 rounded-lg mb-6 border border-gray-200 dark:border-gray-700">
              <p className="text-xs text-gray-500 dark:text-gray-400">Email:</p>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{email}</p>
            </div>
          )}

          <div className="space-y-3">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Si crees que esto es un error, contacta con tu administrador para que revise tu cuenta.
            </p>

            {onRetry && (
              <button
                onClick={onRetry}
                className="w-full px-4 py-2 bg-blue-600 dark:bg-blue-700 hover:bg-blue-700 dark:hover:bg-blue-600 text-white rounded-xl transition-colors duration-200"
              >
                Intentar de Nuevo
              </button>
            )}

            {onBackToLogin && (
              <button
                onClick={onBackToLogin}
                className="w-full px-4 py-2 bg-gray-600 dark:bg-gray-700 hover:bg-gray-700 dark:hover:bg-gray-600 text-white rounded-xl transition-colors duration-200"
              >
                ← Volver al Login
              </button>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
