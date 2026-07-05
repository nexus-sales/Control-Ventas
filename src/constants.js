// src/constants.js

// =================== AUTH CONFIGURATION ===================
// Modo de desarrollo: bypass de autenticación. Activa el flag de abajo para
// probarlo en local — `&& import.meta.env.DEV` garantiza que un build de
// producción (vite build) lo deja en false pase lo que pase, aunque alguien
// olvide revertir el flag antes de desplegar.
const AUTH_BYPASS_DEV_FLAG = false;
export const AUTH_BYPASS = AUTH_BYPASS_DEV_FLAG && import.meta.env.DEV;

// Usuario simulado para desarrollo
export const MOCK_USER = {
  id: 'dev-user-1',
  email: 'info@ucoipcanarias.com',
  name: 'Usuario Desarrollo',
  role: 'admin',
  created_at: new Date().toISOString()
};

// =================== APP CONFIGURATION ===================
export const APP_NAME = 'Control Ventas';
export const APP_VERSION = '3.0.0';

// =================== STORAGE KEYS ===================
export const STORAGE_PREFIX = 'cv_';

// =================== DATE FORMATS ===================
export const DATE_FORMAT = 'DD/MM/YYYY';
export const DATETIME_FORMAT = 'DD/MM/YYYY HH:mm';

// =================== VALIDATION RULES ===================
export const VALIDATION = {
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE_REGEX: /^(\+34|0034|34)?[6789]\d{8}$/,
  CIF_REGEX: /^[A-Z][0-9]{8}$/,
  DNI_REGEX: /^[0-9]{8}[A-Z]$/
};

// =================== USER ROLES ===================
export const USER_ROLES = {
  ADMIN: 'admin',
  USER: 'user',
  GUEST: 'guest'
};

// =================== THEME ===================
export const THEME_STORAGE_KEY = 'app_theme';
export const THEMES = {
  LIGHT: 'light',
  DARK: 'dark'
};