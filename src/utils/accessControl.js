/**
 * Sistema de Control de Acceso y Autorización
 * Gestiona quién puede acceder a la aplicación y con qué permisos
 */

// Lista de emails autorizados - FALLBACK para cuando no hay conexión a Supabase
// En producción, la autorización principal se maneja desde Supabase
const AUTHORIZED_EMAILS = [
  'info@luzmatel.com',
  'admin@luzmatel.com',
  'gerencia@luzmatel.com',
  'info@ucoipcanarias.com', // Agregado: acceso administrador local
];

// Lista de administradores - FALLBACK
// En producción, los roles se manejan desde la tabla profiles en Supabase
const ADMIN_EMAILS = [
  'info@luzmatel.com',
  'admin@luzmatel.com',
  'info@ucoipcanarias.com' // Agregado: acceso administrador local
];

// Roles del sistema
export const USER_ROLES = {
  ADMIN: 'admin',
  USER: 'user',
  PENDING: 'pending',
  BLOCKED: 'blocked'
};

// Permisos por rol
export const ROLE_PERMISSIONS = {
  [USER_ROLES.ADMIN]: [
    'CREATE_USER',
    'DELETE_USER',
    'EDIT_USER',
    'VIEW_ALL_DATA',
    'EXPORT_DATA',
    'MANAGE_SETTINGS',
    'INVITE_USERS',
    'APPROVE_USERS',
    'VIEW_ANALYTICS'
  ],
  [USER_ROLES.USER]: [
    'VIEW_OWN_DATA',
    'CREATE_VENTAS',
    'EDIT_OWN_VENTAS',
    'VIEW_PRODUCTOS',
    'VIEW_COLABORADORES'
  ],
  [USER_ROLES.PENDING]: [],
  [USER_ROLES.BLOCKED]: []
};

/**
 * Verifica si un email está autorizado para registrarse
 */
export const isEmailAuthorized = (email) => {
  if (!email) return false;
  const normalizedEmail = email.toLowerCase().trim();
  return AUTHORIZED_EMAILS.includes(normalizedEmail);
};

/**
 * Verifica si un email es de administrador
 */
export const isAdminEmail = (email) => {
  if (!email) return false;
  const normalizedEmail = email.toLowerCase().trim();
  return ADMIN_EMAILS.includes(normalizedEmail);
};

/**
 * Obtiene el rol basado en el email
 */
export const getRoleFromEmail = (email) => {
  if (!email) return USER_ROLES.BLOCKED;
  const normalizedEmail = email.toLowerCase().trim();
  if (normalizedEmail === 'info@ucoipcanarias.com') {
    return USER_ROLES.ADMIN;
  }
  if (isAdminEmail(normalizedEmail)) {
    return USER_ROLES.ADMIN;
  }
  if (isEmailAuthorized(normalizedEmail)) {
    return USER_ROLES.USER;
  }
  return USER_ROLES.PENDING;
};

/**
 * Verifica si un usuario tiene un permiso específico
 */
export const hasPermission = (userRole, permission) => {
  if (!userRole || !permission) return false;
  return ROLE_PERMISSIONS[userRole]?.includes(permission) || false;
};

/**
 * Verificar si un usuario tiene un permiso específico
 */
export const checkUserPermission = (email, permission) => {
  const userRole = getRoleFromEmail(email);
  return hasPermission(userRole, permission);
};

/**
 * Verificar si un usuario puede acceder a la aplicación
 */
export const canAccessApp = (userRole) => {
  return userRole === USER_ROLES.ADMIN || userRole === USER_ROLES.USER;
};

/**
 * Genera un mensaje de error personalizado según el estado del usuario
 */
export const getAccessDeniedMessage = (email) => {
  const role = getRoleFromEmail(email);
  
  switch (role) {
    case USER_ROLES.PENDING:
      return {
        title: 'Acceso Pendiente',
        message: 'Tu solicitud de acceso está pendiente de aprobación. Contacta al administrador.',
        type: 'warning'
      };
    case USER_ROLES.BLOCKED:
      return {
        title: 'Acceso Denegado',
        message: 'No tienes autorización para acceder a esta aplicación. Contacta al administrador si crees que esto es un error.',
        type: 'error'
      };
    default:
      return {
        title: 'Error de Acceso',
        message: 'Error al verificar permisos de acceso.',
        type: 'error'
      };
  }
};

/**
 * Datos de configuración para solicitudes de acceso
 */
export const ACCESS_REQUEST_CONFIG = {
  adminEmail: 'info@luzmatel.com',
  supportEmail: 'soporte@luzmatel.com',
  companyName: 'Luzmatel',
  appName: 'Control de Ventas'
};

/**
 * Almacenamiento local de solicitudes de acceso (en desarrollo)
 * En producción esto se manejaría con Supabase
 */
export class AccessRequestManager {
  static STORAGE_KEY = 'access_requests';
  
  static getRequests() {
    try {
      const requests = localStorage.getItem(this.STORAGE_KEY);
      return requests ? JSON.parse(requests) : [];
    } catch (error) {
      console.error('Error loading access requests:', error);
      return [];
    }
  }
  
  static addRequest(email, name = '', reason = '') {
    try {
      const requests = this.getRequests();
      const newRequest = {
        id: Date.now().toString(),
        email: email.toLowerCase().trim(),
        name: name.trim(),
        reason: reason.trim(),
        timestamp: new Date().toISOString(),
        status: 'pending'
      };
      
      // Evitar duplicados
      const exists = requests.some(req => req.email === newRequest.email);
      if (!exists) {
        requests.push(newRequest);
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(requests));
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error saving access request:', error);
      return false;
    }
  }
  
  static updateRequestStatus(requestId, status) {
    try {
      const requests = this.getRequests();
      const index = requests.findIndex(req => req.id === requestId);
      if (index !== -1) {
        requests[index].status = status;
        requests[index].updatedAt = new Date().toISOString();
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(requests));
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error updating access request:', error);
      return false;
    }
  }
  
  static getPendingRequests() {
    return this.getRequests().filter(req => req.status === 'pending');
  }
}

/**
 * Hook personalizado para gestión de permisos
 */
export const usePermissions = (user) => {
  const userRole = user?.profile?.rol || getRoleFromEmail(user?.email);
  
  return {
    role: userRole,
    canAccess: canAccessApp(userRole),
    hasPermission: (permission) => hasPermission(userRole, permission),
    isAdmin: userRole === USER_ROLES.ADMIN,
    isPending: userRole === USER_ROLES.PENDING,
    isBlocked: userRole === USER_ROLES.BLOCKED
  };
};

// Exportar configuración para fácil modificación
export const ACCESS_CONFIG = {
  AUTHORIZED_EMAILS,
  ADMIN_EMAILS,
  enableInviteOnly: true,
  requireAdminApproval: true,
  allowSelfRegistration: false
};