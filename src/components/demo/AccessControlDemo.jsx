import React from 'react';
import { useAuth } from '../../context/AppContexts';
import Card from '../ui/Card';
import SectionTitle from '../ui/SectionTitle';
import AccessRequestsManager from '../admin/AccessRequestsManager';
import { USER_ROLES } from '../../utils/accessControl';

export default function AccessControlDemo() {
  const { user, userRole, hasAccess, accessMessage } = useAuth();

  return (
    <div className="space-y-6 p-6">
      {/* Estado del usuario */}
      <Card>
        <SectionTitle>Estado de Control de Acceso</SectionTitle>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div>
            <h4 className="font-medium text-gray-900 dark:text-white mb-2">Usuario Actual</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              <strong>Email:</strong> {user?.email || 'No disponible'}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              <strong>Rol:</strong> {userRole || 'No asignado'}
            </p>
          </div>
          
          <div>
            <h4 className="font-medium text-gray-900 dark:text-white mb-2">Estado de Acceso</h4>
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${hasAccess ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className={`text-sm font-medium ${hasAccess ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}`}>
                {hasAccess ? 'Acceso Autorizado' : 'Acceso Denegado'}
              </span>
            </div>
            {accessMessage && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {accessMessage.message}
              </p>
            )}
          </div>
        </div>
      </Card>

      {/* Panel de administración (solo para admins) */}
      {userRole === USER_ROLES.ADMIN && (
        <div>
          <SectionTitle className="mb-4">Panel de Administración</SectionTitle>
          <AccessRequestsManager userEmail={user?.email} />
        </div>
      )}

      {/* Información del sistema */}
      <Card>
        <SectionTitle>Información del Sistema de Control de Acceso</SectionTitle>
        <div className="space-y-4 mt-4">
          <div>
            <h4 className="font-medium text-gray-900 dark:text-white">Roles Disponibles:</h4>
            <ul className="text-sm text-gray-600 dark:text-gray-400 mt-2 space-y-1">
              <li><strong>admin:</strong> Acceso completo + gestión de usuarios</li>
              <li><strong>user:</strong> Acceso estándar a la aplicación</li>
              <li><strong>pending:</strong> En espera de aprobación</li>
              <li><strong>blocked:</strong> Acceso bloqueado</li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-medium text-gray-900 dark:text-white">Funcionalidades:</h4>
            <ul className="text-sm text-gray-600 dark:text-gray-400 mt-2 space-y-1">
              <li>✅ Control de emails autorizados</li>
              <li>✅ Sistema de roles y permisos</li>
              <li>✅ Solicitudes de acceso automáticas</li>
              <li>✅ Panel de administración</li>
              <li>✅ Integración con autenticación</li>
              <li>✅ Experiencia de usuario optimizada</li>
            </ul>
          </div>
        </div>
      </Card>

      {/* Acciones de prueba */}
      <Card>
        <SectionTitle>Acciones de Prueba</SectionTitle>
        <div className="space-y-3 mt-4">
          <button
            onClick={() => {
              // LOG ELIMINADO
            }}
            className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200"
          >
            Mostrar Estado en Consola
          </button>
          
          <button
            onClick={() => {
              window.location.reload();
            }}
            className="w-full px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors duration-200"
          >
            Recargar y Verificar Acceso
          </button>
        </div>
      </Card>
    </div>
  );
}