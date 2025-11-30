import React, { useState } from 'react';
import { getAccessDeniedMessage, ACCESS_REQUEST_CONFIG, AccessRequestManager } from '../../utils/accessControl';
import Card from '../ui/Card';
import SectionTitle from '../ui/SectionTitle';

export default function AccessDeniedScreen({ email, accessInfo, onRetry, onBackToLogin }) {
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [requestData, setRequestData] = useState({
    name: '',
    reason: '',
    email: email || ''
  });
  const [isSubmitting] = useState(false);
  const [requestSent] = useState(false);

  // Usar accessInfo si está disponible, sino usar el mensaje por defecto
  const accessMessage = accessInfo || getAccessDeniedMessage(email);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setRequestData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleRequestAccess = (e) => {
    e.preventDefault();
    // Implementación de solicitud de acceso
  };

  return (
    <div className="min-h-screen grid place-items-center bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 dark:from-gray-900 dark:via-red-900/20 dark:to-gray-800 animate-fadeIn relative overflow-hidden">
      {/* Elementos decorativos de fondo */}
      <div className="absolute inset-0 opacity-10 dark:opacity-5">
        <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-red-500 rounded-full blur-3xl animate-pulse-slow"></div>
        <div className="absolute bottom-1/4 right-1/4 w-40 h-40 bg-orange-500 rounded-full blur-3xl animate-pulse-slow animate-delay-300"></div>
        <div className="absolute top-3/4 left-3/4 w-24 h-24 bg-yellow-500 rounded-full blur-3xl animate-pulse-slow animate-delay-500"></div>
      </div>

      <Card className="animate-slideUp card-shadow hover-lift smooth-transition relative z-10 max-w-md bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
        {!showRequestForm && !requestSent ? (
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

            {/* Opciones de acción */}
            <div className="space-y-3">
              <button
                onClick={() => setShowRequestForm(true)}
                className="w-full px-4 py-2 bg-blue-600 dark:bg-blue-700 hover:bg-blue-700 dark:hover:bg-blue-600 text-white rounded-xl transition-colors duration-200 flex items-center justify-center"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Solicitar Acceso
              </button>

              <div className="text-center">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                  ¿Necesitas ayuda?
                </p>
                <a 
                  href={`mailto:${ACCESS_REQUEST_CONFIG.adminEmail}?subject=Solicitud de Acceso - ${ACCESS_REQUEST_CONFIG.appName}&body=Hola, necesito acceso a ${ACCESS_REQUEST_CONFIG.appName}. Mi email es: ${email || '[tu-email]'}`}
                  className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm transition-colors duration-200"
                >
                  Contactar Administrador
                </a>
              </div>

              {onRetry && (
                <button
                  onClick={onRetry}
                  className="w-full px-4 py-2 bg-blue-600 dark:bg-blue-700 hover:bg-blue-700 dark:hover:bg-blue-600 text-white rounded-xl transition-colors duration-200 mb-3"
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
        ) : showRequestForm && !requestSent ? (
          <div>
            <div className="text-center mb-6">
              <SectionTitle className="text-gray-900 dark:text-gray-100">Solicitar Acceso</SectionTitle>
              <p className="text-gray-600 dark:text-gray-400 text-sm mt-2">
                Completa la información para solicitar acceso al sistema
              </p>
            </div>

            <form onSubmit={handleRequestAccess} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={requestData.email}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors duration-200"
                  required
                  readOnly={!!email}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nombre Completo
                </label>
                <input
                  type="text"
                  name="name"
                  value={requestData.name}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors duration-200"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Motivo de la Solicitud
                </label>
                <textarea
                  name="reason"
                  value={requestData.reason}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors duration-200 resize-none"
                  placeholder="Describe por qué necesitas acceso al sistema..."
                  required
                />
              </div>

              <div className="flex space-x-3">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2 bg-blue-600 dark:bg-blue-700 hover:bg-blue-700 dark:hover:bg-blue-600 disabled:bg-blue-400 dark:disabled:bg-blue-800 text-white rounded-xl transition-colors duration-200 flex items-center justify-center"
                >
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Enviando...
                    </>
                  ) : (
                    'Enviar Solicitud'
                  )}
                </button>
                
                <button
                  type="button"
                  onClick={() => setShowRequestForm(false)}
                  className="px-4 py-2 bg-gray-600 dark:bg-gray-700 hover:bg-gray-700 dark:hover:bg-gray-600 text-white rounded-xl transition-colors duration-200"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className="text-center">
            {/* Icono de éxito */}
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>

            <SectionTitle className="text-green-600 dark:text-green-400">
              Solicitud Enviada
            </SectionTitle>
            
            <p className="text-gray-600 dark:text-gray-400 text-sm mt-4 mb-6 leading-relaxed">
              Tu solicitud de acceso ha sido enviada correctamente. El administrador la revisará y te contactará pronto.
            </p>

            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg mb-6 border border-blue-200 dark:border-blue-800">
              <p className="text-sm text-blue-700 dark:text-blue-300">
                <strong>Próximos pasos:</strong><br />
                1. El administrador revisará tu solicitud<br />
                2. Recibirás una respuesta por email<br />
                3. Una vez aprobada, podrás acceder al sistema
              </p>
            </div>

            <div className="space-y-3">
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
        )}
      </Card>
    </div>
  );
}