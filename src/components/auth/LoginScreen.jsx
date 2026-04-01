import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AppContexts';
import Card from '../ui/Card';
import SectionTitle from '../ui/SectionTitle';
import EmailInput from '../ui/EmailInput';
import PasswordInput from '../ui/PasswordInput';
import ForgotPasswordScreen from './ForgotPasswordScreen';
import AccessDeniedScreen from './AccessDeniedScreen';
import { LoginRateLimit, formatTime } from '../../utils/authValidation';
import '../../styles/login-animations.css';
import { motion, AnimatePresence } from 'framer-motion';
import { LogIn, UserPlus, ShieldAlert, CheckCircle2, Loader2, ArrowRight } from 'lucide-react';
import { MagicBackground } from '../ui/MagicBackground';
import { cn } from '../../lib/utils';

export default function LoginScreen() {
  const navigate = useNavigate();
  const { signIn, signUp } = useAuth();

  // Estados del Formulario
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nombre, setNombre] = useState('');
  const [rememberMe, setRememberMe] = useState(false);

  // Estados de UI
  const [isEmailValid, setIsEmailValid] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loginSuccess, setLoginSuccess] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  // Estados de Error y Mensajes
  const [error, setError] = useState('');
  const [registerError, setRegisterError] = useState('');
  const [registerSuccess, setRegisterSuccess] = useState(false);

  // Rate Limiting
  const [isBlocked, setIsBlocked] = useState(false);
  const [blockTimeRemaining, setBlockTimeRemaining] = useState(0);
  const [remainingAttempts, setRemainingAttempts] = useState(5);

  // Inicialización y Carga de Preferencias
  useEffect(() => {
    const blocked = LoginRateLimit.isBlocked();
    if (blocked) {
      setIsBlocked(true);
      setBlockTimeRemaining(LoginRateLimit.getBlockedTimeRemaining());

      const interval = setInterval(() => {
        const remaining = LoginRateLimit.getBlockedTimeRemaining();
        setBlockTimeRemaining(remaining);
        if (remaining <= 0) {
          setIsBlocked(false);
          setRemainingAttempts(5);
          clearInterval(interval);
        }
      }, 1000);
      return () => clearInterval(interval);
    }

    const rememberedEmail = localStorage.getItem('rememberedEmail');
    if (rememberedEmail) {
      setEmail(rememberedEmail);
      setRememberMe(true);
      setIsEmailValid(true);
    }
  }, []);

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (isBlocked || !isEmailValid || !password) return;

    setIsSubmitting(true);
    setError('');

    const { user: _user, error: signInError } = await signIn(email, password);

    if (signInError) {
      setIsSubmitting(false);
      const _attempts = LoginRateLimit.recordAttempt();
      setRemainingAttempts(LoginRateLimit.getRemainingAttempts());

      if (LoginRateLimit.isBlocked()) {
        setIsBlocked(true);
        setBlockTimeRemaining(LoginRateLimit.getBlockedTimeRemaining());
        window.location.reload(); // Recargar para iniciar el timer limpiamente
      }

      setError(signInError.message === 'Invalid login credentials'
        ? 'Email o contraseña incorrectos.'
        : signInError.message);
    } else {
      setIsSubmitting(false);
      setLoginSuccess(true);
      LoginRateLimit.resetAttempts();

      if (rememberMe) {
        localStorage.setItem('rememberedEmail', email);
      } else {
        localStorage.removeItem('rememberedEmail');
      }

      setTimeout(() => {
        navigate('/');
      }, 800);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password || !nombre) {
      setRegisterError('Todos los campos son obligatorios.');
      return;
    }

    setIsSubmitting(true);
    setRegisterError('');

    const { error: signUpError } = await signUp(email, password, nombre);

    setIsSubmitting(false);

    if (signUpError) {
      setRegisterError(signUpError.message);
    } else {
      setRegisterSuccess(true);
      setTimeout(() => {
        setShowRegister(false);
        setRegisterSuccess(false);
        setError('Cuenta creada. Contacta al administrador para que active tu acceso.');
      }, 3000);
    }
  };

  if (showForgotPassword) {
    return <ForgotPasswordScreen onBackToLogin={() => setShowForgotPassword(false)} />;
  }

  return (
    <MagicBackground className="px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md relative z-10"
      >
        {/* Logo/Title Area */}
        <div className="text-center mb-10 overflow-visible">
          <motion.div
            whileHover={{ scale: 1.05, rotate: 5 }}
            whileTap={{ scale: 0.95 }}
            className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-3xl shadow-2xl shadow-blue-500/40 mb-6"
          >
            <LogIn className="w-10 h-10 text-white" />
          </motion.div>
          <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight mb-2">
            Control de <span className="text-blue-600">Ventas</span>
          </h1>
          <p className="text-slate-500 dark:text-gray-400 font-medium tracking-wide">
            Gestión Profesional & Inteligente
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.4 }}
        >
          <Card className="p-8 border-slate-200/50 dark:border-gray-800/50 shadow-[0_20px_50px_rgba(8,_112,_184,_0.1)] backdrop-blur-md bg-white/80 dark:bg-gray-900/80 overflow-hidden relative">
            {/* Animación de brillo superior */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500/20 to-transparent" />
            <AnimatePresence mode="wait">
              {showRegister ? (
                <motion.form
                  key="register"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  onSubmit={handleRegisterSubmit}
                  className="space-y-4"
                >
                  <SectionTitle className="mb-6 flex items-center gap-2">
                    <UserPlus className="w-5 h-5 text-blue-500" />
                    Nueva Cuenta
                  </SectionTitle>

                  <div className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider ml-1">Nombre Completo</label>
                      <input
                        type="text"
                        required
                        placeholder="Tu nombre y apellidos"
                        className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-slate-900 dark:text-white"
                        value={nombre}
                        onChange={e => setNombre(e.target.value)}
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider ml-1">Email Corporativo</label>
                      <EmailInput
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        onValidationChange={setIsEmailValid}
                        className="w-full"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider ml-1">Contraseña</label>
                      <div className="transform transition-all duration-300">
                        <PasswordInput
                          value={password}
                          onChange={e => setPassword(e.target.value)}
                          showStrengthMeter={true}
                          className="w-full"
                        />
                      </div>
                    </div>
                  </div>

                  {registerError && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-xl text-red-600 dark:text-red-400 text-sm flex items-start gap-2"
                    >
                      <ShieldAlert className="w-5 h-5 flex-shrink-0" />
                      <span>{registerError}</span>
                    </motion.div>
                  )}

                  {registerSuccess && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800 rounded-xl text-green-600 dark:text-green-400 text-sm flex items-center gap-2"
                    >
                      <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                      <span>¡Registro exitoso! Redirigiendo...</span>
                    </motion.div>
                  )}

                  <motion.button
                    whileHover={{ scale: 1.02, backgroundColor: '#1d4ed8' }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-4 bg-blue-600 disabled:bg-slate-400 text-white font-bold rounded-xl shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Crear mi cuenta"}
                    {!isSubmitting && <ArrowRight className="w-5 h-5" />}
                  </motion.button>

                  <button
                    type="button"
                    onClick={() => setShowRegister(false)}
                    className="w-full text-sm text-slate-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors font-semibold"
                  >
                    ¿Ya tienes cuenta? Inicia Sesión
                  </button>
                </motion.form>
              ) : (
                <motion.form
                  key="login"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  onSubmit={handleLoginSubmit}
                  className="space-y-6"
                >
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider ml-1">Email</label>
                      <EmailInput
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        onValidationChange={setIsEmailValid}
                        disabled={isBlocked || isSubmitting}
                      />
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between items-center px-1">
                        <label className="text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider">Contraseña</label>
                        <button
                          type="button"
                          onClick={() => setShowForgotPassword(true)}
                          className="text-xs font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400"
                        >
                          ¿Olvidaste la clave?
                        </button>
                      </div>
                      <PasswordInput
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        disabled={isBlocked || isSubmitting}
                        showStrengthMeter={false}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 cursor-pointer group">
                      <div className={`w-5 h-5 rounded-md border-2 transition-all flex items-center justify-center ${rememberMe ? 'bg-blue-600 border-blue-600' : 'bg-slate-50 dark:bg-gray-800 border-slate-200 dark:border-gray-700 group-hover:border-blue-400'}`}>
                        {rememberMe && <div className="w-2.5 h-1.5 border-l-2 border-b-2 border-white -rotate-45 mb-0.5"></div>}
                      </div>
                      <input type="checkbox" className="hidden" checked={rememberMe} onChange={e => setRememberMe(e.target.checked)} />
                      <span className="text-sm font-semibold text-slate-600 dark:text-gray-400 group-hover:text-slate-800 dark:group-hover:text-gray-200 transition-colors">Recordarme</span>
                    </label>

                    {remainingAttempts < 5 && !isBlocked && (
                      <span className="text-xs font-bold text-orange-500 uppercase tracking-tighter">Intentos: {remainingAttempts} / 5</span>
                    )}
                  </div>

                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-xl text-red-600 dark:text-red-400 text-sm flex items-start gap-2"
                    >
                      <ShieldAlert className="w-5 h-5 flex-shrink-0" />
                      <span>{error}</span>
                    </motion.div>
                  )}

                  {isBlocked && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="p-4 bg-red-50 dark:bg-red-900/30 border-2 border-red-200 dark:border-red-800 rounded-2xl text-red-600 dark:text-red-400 text-center"
                    >
                      <h4 className="font-black uppercase text-sm mb-1">Acceso Denegado</h4>
                      <p className="text-xs font-bold">Bloqueado por {formatTime(blockTimeRemaining)}</p>
                    </motion.div>
                  )}

                  <motion.button
                    whileHover={{ scale: 1.02, backgroundColor: loginSuccess ? '#10b981' : '#1d4ed8' }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={isSubmitting || isBlocked || !isEmailValid || !password}
                    className={cn(
                      "w-full py-4 font-black rounded-xl shadow-xl transition-all flex items-center justify-center gap-2",
                      loginSuccess
                        ? 'bg-green-500 text-white'
                        : 'bg-blue-600 disabled:bg-slate-300 dark:disabled:bg-gray-800 text-white shadow-blue-500/20'
                    )}
                  >
                    {isSubmitting ? (
                      <Loader2 className="w-6 h-6 animate-spin" />
                    ) : loginSuccess ? (
                      "¡BIENVENIDO!"
                    ) : (
                      "INICIAR SESIÓN"
                    )}
                    {!isSubmitting && !loginSuccess && <ArrowRight className="w-5 h-5" />}
                  </motion.button>

                  <div className="text-center pt-2">
                    <button
                      type="button"
                      onClick={() => setShowRegister(true)}
                      className="text-xs font-bold text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 tracking-widest transition-colors uppercase"
                    >
                      ¿No tienes acceso? <span className="text-blue-500">Solicitar Registro</span>
                    </button>
                  </div>
                </motion.form>
              )}
            </AnimatePresence>
          </Card>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="text-center mt-12 text-[10px] font-bold text-slate-400 dark:text-gray-600 uppercase tracking-[4px]"
        >
          &copy; {new Date().getFullYear()} Salva1962 AI Systems
        </motion.p>
      </motion.div>
    </MagicBackground>
  );
}
