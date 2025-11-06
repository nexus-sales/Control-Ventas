/**
 * Utilidades de validación y seguridad para autenticación
 */

/**
 * Valida si un email tiene formato correcto
 * @param {string} email 
 * @returns {boolean}
 */
export function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Valida email en tiempo real con más precisión
 * @param {string} email 
 * @returns {object} {isValid, message}
 */
export function validateEmail(email) {
  if (!email) {
    return { isValid: false, message: '' };
  }
  
  if (email.length < 5) {
    return { isValid: false, message: 'Email muy corto' };
  }
  
  if (!email.includes('@')) {
    return { isValid: false, message: 'Debe contener @' };
  }
  
  if (!isValidEmail(email)) {
    return { isValid: false, message: 'Formato de email inválido' };
  }
  
  return { isValid: true, message: 'Email válido' };
}

/**
 * Evalúa la fortaleza de una contraseña
 * @param {string} password 
 * @returns {object} {score, message, suggestions}
 */
export function evaluatePasswordStrength(password) {
  if (!password) {
    return { score: 0, message: '', suggestions: [] };
  }

  let score = 0;
  const suggestions = [];
  
  // Longitud
  if (password.length >= 8) {
    score += 20;
  } else {
    suggestions.push('Mínimo 8 caracteres');
  }
  
  if (password.length >= 12) {
    score += 10;
  }
  
  // Mayúsculas
  if (/[A-Z]/.test(password)) {
    score += 20;
  } else {
    suggestions.push('Al menos una mayúscula');
  }
  
  // Minúsculas
  if (/[a-z]/.test(password)) {
    score += 20;
  } else {
    suggestions.push('Al menos una minúscula');
  }
  
  // Números
  if (/\d/.test(password)) {
    score += 15;
  } else {
    suggestions.push('Al menos un número');
  }
  
  // Caracteres especiales
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    score += 15;
  } else {
    suggestions.push('Al menos un carácter especial');
  }
  
  // Penalizar patrones comunes
  const commonPatterns = ['123', 'abc', 'password', 'admin', '000'];
  const lowerPassword = password.toLowerCase();
  if (commonPatterns.some(pattern => lowerPassword.includes(pattern))) {
    score -= 20;
    suggestions.push('Evita patrones comunes');
  }

  score = Math.max(0, Math.min(100, score));
  
  let message = '';
  if (score < 30) {
    message = 'Muy débil';
  } else if (score < 50) {
    message = 'Débil';
  } else if (score < 70) {
    message = 'Moderada';
  } else if (score < 90) {
    message = 'Fuerte';
  } else {
    message = 'Muy fuerte';
  }
  
  return { score, message, suggestions };
}

/**
 * Rate limiting para intentos de login
 */
const LOGIN_ATTEMPTS_KEY = '__login_attempts';
const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutos en ms

export class LoginRateLimit {
  static getAttempts() {
    try {
      const stored = localStorage.getItem(LOGIN_ATTEMPTS_KEY);
      if (!stored) return { count: 0, lastAttempt: null };
      return JSON.parse(stored);
    } catch {
      return { count: 0, lastAttempt: null };
    }
  }
  
  static recordAttempt() {
    const attempts = this.getAttempts();
    const newAttempts = {
      count: attempts.count + 1,
      lastAttempt: Date.now()
    };
    localStorage.setItem(LOGIN_ATTEMPTS_KEY, JSON.stringify(newAttempts));
    return newAttempts;
  }
  
  static resetAttempts() {
    localStorage.removeItem(LOGIN_ATTEMPTS_KEY);
  }
  
  static isBlocked() {
    const attempts = this.getAttempts();
    if (attempts.count < MAX_ATTEMPTS) return false;
    
    const timeSinceLastAttempt = Date.now() - attempts.lastAttempt;
    return timeSinceLastAttempt < LOCKOUT_DURATION;
  }
  
  static getBlockedTimeRemaining() {
    const attempts = this.getAttempts();
    if (attempts.count < MAX_ATTEMPTS) return 0;
    
    const timeSinceLastAttempt = Date.now() - attempts.lastAttempt;
    const remaining = LOCKOUT_DURATION - timeSinceLastAttempt;
    return Math.max(0, remaining);
  }
  
  static getRemainingAttempts() {
    const attempts = this.getAttempts();
    return Math.max(0, MAX_ATTEMPTS - attempts.count);
  }
}

/**
 * Formatea tiempo en minutos y segundos
 * @param {number} ms - Milisegundos
 * @returns {string}
 */
export function formatTime(ms) {
  const minutes = Math.floor(ms / (60 * 1000));
  const seconds = Math.floor((ms % (60 * 1000)) / 1000);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}