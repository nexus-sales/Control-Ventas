import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import Card from '../ui/Card';
import SectionTitle from '../ui/SectionTitle';
import EmailInput from '../ui/EmailInput';
import PasswordInput from '../ui/PasswordInput';
import ForgotPasswordScreen from './ForgotPasswordScreen';
import { LoginRateLimit, formatTime } from '../../utils/authValidation';
import '../../styles/login-animations.css';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isEmailValid, setIsEmailValid] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [blockTimeRemaining, setBlockTimeRemaining] = useState(0);
  const [remainingAttempts, setRemainingAttempts] = useState(5);
  const [rememberMe, setRememberMe] = useState(false);
  const [loginSuccess, setLoginSuccess] = useState(false);
  const { login } = useAuth();

  // Verificar rate limiting y cargar email recordado al cargar el componente
  useEffect(() => {
    checkRateLimit();
    
    // Si está bloqueado, iniciar countdown
    if (LoginRateLimit.isBlocked()) {
      startBlockCountdown();
    }

    // Cargar email recordado del localStorage
    const rememberedEmail = localStorage.getItem('rememberedEmail');
    const wasRemembered = localStorage.getItem('rememberMe') === 'true';
    
    if (rememberedEmail && wasRemembered) {
      setEmail(rememberedEmail);
      setRememberMe(true);
      // Simular validación del email cargado
      if (rememberedEmail.includes('@') && rememberedEmail.includes('.')) {
        setIsEmailValid(true);
      }
    }
  }, []);

  const checkRateLimit = () => {
    const blocked = LoginRateLimit.isBlocked();
    const timeRemaining = LoginRateLimit.getBlockedTimeRemaining();
    const attempts = LoginRateLimit.getRemainingAttempts();
    
    setIsBlocked(blocked);
    setBlockTimeRemaining(timeRemaining);
    setRemainingAttempts(attempts);
  };

  const startBlockCountdown = () => {
    const interval = setInterval(() => {
      const timeRemaining = LoginRateLimit.getBlockedTimeRemaining();
      setBlockTimeRemaining(timeRemaining);
      
      if (timeRemaining <= 0) {
        setIsBlocked(false);
        setRemainingAttempts(5);
        clearInterval(interval);
      }
    }, 1000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Verificar rate limiting
    if (LoginRateLimit.isBlocked()) {
      setError(`Demasiados intentos fallidos. Intenta de nuevo en ${formatTime(LoginRateLimit.getBlockedTimeRemaining())}.`);
      return;
    }

    setError('');
    setIsSubmitting(true);
    
    const { error: authError } = await login(email, password);
    
    if (authError) {
      // Registrar intento fallido
      LoginRateLimit.recordAttempt();
      checkRateLimit();
      
      setError(authError.message);
      
      // Si ahora está bloqueado, iniciar countdown
      if (LoginRateLimit.isBlocked()) {
        startBlockCountdown();
        setError(`Demasiados intentos fallidos. Cuenta bloqueada por ${formatTime(LoginRateLimit.getBlockedTimeRemaining())}.`);
      } else {
        const remaining = LoginRateLimit.getRemainingAttempts();
        if (remaining <= 2) {
          setError(`${authError.message} (Te quedan ${remaining} intentos)`);
        }
      }
    } else {
      // Login exitoso, resetear intentos
      LoginRateLimit.resetAttempts();
      setRemainingAttempts(5);
      setLoginSuccess(true);
      
      // Guardar email si se seleccionó recordar
      if (rememberMe) {
        localStorage.setItem('rememberedEmail', email);
        localStorage.setItem('rememberMe', 'true');
      } else {
        localStorage.removeItem('rememberedEmail');
        localStorage.removeItem('rememberMe');
      }
      
      // Pequeña animación de éxito antes de redirigir
      setTimeout(() => {
        setLoginSuccess(false);
      }, 1500);
    }
    
    setIsSubmitting(false);
  };

  const handleEmailChange = (e) => {
    setEmail(e.target.value);
    setError(''); // Limpiar error al cambiar email
  };

  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
    setError(''); // Limpiar error al cambiar contraseña
  };

  const handleForgotPassword = () => {
    setShowForgotPassword(true);
  };

  const handleBackToLogin = () => {
    setShowForgotPassword(false);
  };

  // Si está en modo "olvidé mi contraseña"
  if (showForgotPassword) {
    return <ForgotPasswordScreen onBackToLogin={handleBackToLogin} />;
  }

  return (
    <div className="min-h-screen grid place-items-center bg-gradient-to-br from-sky-50 via-indigo-50 to-emerald-50 dark:from-gray-900 dark:via-slate-900 dark:to-gray-800 animate-fadeIn relative overflow-hidden">
      {/* Elementos decorativos de fondo */}
      <div className="absolute inset-0 opacity-10 dark:opacity-5">
        <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-blue-500 rounded-full blur-3xl animate-pulse-slow"></div>
        <div className="absolute bottom-1/4 right-1/4 w-40 h-40 bg-emerald-500 rounded-full blur-3xl animate-pulse-slow animate-delay-300"></div>
        <div className="absolute top-3/4 left-3/4 w-24 h-24 bg-indigo-500 rounded-full blur-3xl animate-pulse-slow animate-delay-500"></div>
      </div>
      <Card className="animate-slideUp card-shadow hover-lift smooth-transition">
        <div className="text-center mb-6 form-field-enter">
          <SectionTitle>Acceso</SectionTitle>
          <p className="text-gray-600 dark:text-gray-400 text-sm mt-2 animate-fadeIn animate-delay-200">
            Ingresa tus credenciales para acceder al sistema
          </p>
          <div className="mt-3 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800 animate-slideUp animate-delay-300">
            <div className="flex items-center justify-center text-xs text-blue-700 dark:text-blue-300">
              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              Sesión segura - Login requerido en cada acceso
            </div>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="grid gap-4 w-80">
          <div className="form-field-enter animate-delay-300">
            <EmailInput
              value={email}
              onChange={handleEmailChange}
              onValidationChange={setIsEmailValid}
              placeholder="Email"
              disabled={isBlocked}
              required
              className="smooth-transition focus-ring"
            />
          </div>
          
          <div className="form-field-enter animate-delay-400">
            <PasswordInput
              value={password}
              onChange={handlePasswordChange}
              placeholder="Contraseña"
              disabled={isBlocked}
              showStrengthMeter={false}
              required
              className="smooth-transition focus-ring"
            />
          </div>

          {/* Checkbox para recordar usuario */}
          <div className="flex items-center space-x-2 form-field-enter animate-delay-500">
            <input
              id="remember-me"
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              disabled={isBlocked}
              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600 transition-colors duration-200"
            />
            <label 
              htmlFor="remember-me" 
              className="text-sm text-gray-600 dark:text-gray-400 cursor-pointer select-none transition-colors duration-200 hover:text-gray-800 dark:hover:text-gray-200"
            >
              Recordar mi email
            </label>
          </div>

          {/* Información de intentos restantes */}
          {remainingAttempts < 5 && remainingAttempts > 0 && !isBlocked && (
            <div className="text-orange-600 dark:text-orange-400 text-sm bg-orange-50 dark:bg-orange-900/20 p-2 rounded-lg border border-orange-200 dark:border-orange-800 animate-slideUp animate-pulse-slow">
              <div className="flex items-center">
                <svg className="w-4 h-4 mr-2 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                Te quedan {remainingAttempts} intentos
              </div>
            </div>
          )}

          {/* Mensaje de cuenta bloqueada */}
          {isBlocked && (
            <div className="text-red-600 dark:text-red-400 text-sm bg-red-50 dark:bg-red-900/20 p-3 rounded-lg border border-red-200 dark:border-red-800 animate-slideUp animate-shake">
              <div className="flex items-center mb-2">
                <svg className="w-4 h-4 mr-2 text-red-500 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                Cuenta temporalmente bloqueada
              </div>
              <p className="text-xs">
                Tiempo restante: {formatTime(blockTimeRemaining)}
              </p>
            </div>
          )}

          {/* Mensajes de error */}
          {error && (
            <div className="text-red-600 dark:text-red-400 text-sm bg-red-50 dark:bg-red-900/20 p-3 rounded-lg border border-red-200 dark:border-red-800 animate-shake animate-slideUp">
              <div className="flex items-center">
                <svg className="w-4 h-4 mr-2 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {error}
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting || isBlocked || !isEmailValid || !password.trim()}
            className={`
              px-4 py-2 rounded-xl text-white font-medium transition-all duration-300 transform
              ${loginSuccess 
                ? 'bg-green-600 scale-105 shadow-lg' 
                : (isSubmitting || isBlocked || !isEmailValid || !password.trim())
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 hover:scale-105 hover:shadow-lg focus:ring-2 focus:ring-blue-200'
              }
            `}
            aria-label="Entrar al sistema"
          >
            {loginSuccess ? (
              <div className="flex items-center justify-center">
                <svg className="w-5 h-5 mr-2 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                ¡Bienvenido!
              </div>
            ) : isSubmitting ? (
              <div className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Verificando...
              </div>
            ) : isBlocked ? (
              `Bloqueado (${formatTime(blockTimeRemaining)})`
            ) : (
              'Entrar'
            )}
          </button>

          {/* Enlace para recuperar contraseña */}
          <div className="form-field-enter animate-delay-500">
            <button
              type="button"
              onClick={handleForgotPassword}
              className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm smooth-transition hover:scale-105 focus-ring rounded px-2 py-1"
              disabled={isSubmitting}
            >
              ¿Olvidaste tu contraseña?
            </button>
          </div>
        </form>
      </Card>
    </div>
  );
}
