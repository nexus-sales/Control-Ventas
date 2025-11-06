import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import Card from '../ui/Card';
import SectionTitle from '../ui/SectionTitle';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false); // Estado de carga local
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true); // Iniciar carga
    const { error: authError } = await login(email, password);
    if (authError) {
      setError(authError.message);
    }
    setIsSubmitting(false); // Finalizar carga
  };

  return (
    <div className="min-h-screen grid place-items-center bg-gradient-to-b from-sky-50 to-emerald-50">
      <Card>
        <SectionTitle>Acceso</SectionTitle>
        <form onSubmit={handleSubmit} className="grid gap-3 w-80">
          <input
            type="email"
            className="border rounded-xl px-3 py-2"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            aria-label="Email"
            required
          />
          <input
            type="password"
            className="border rounded-xl px-3 py-2"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            aria-label="Contraseña"
            required
          />
          {error && <div className="text-rose-600 text-sm">{error}</div>}
          <button
            type="submit"
            className="px-3 py-2 rounded-xl bg-sky-600 text-white disabled:bg-sky-300"
            aria-label="Entrar al sistema"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Verificando...' : 'Entrar'}
          </button>
        </form>
      </Card>
    </div>
  );
}
