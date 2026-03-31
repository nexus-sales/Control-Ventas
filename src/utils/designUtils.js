/**
 * designUtils.js — Sistema de diseño profesional
 * Paleta neutral: slate + indigo como único acento.
 */

export const euro = (n) =>
  new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n ?? 0);

// Tarjeta base: blanca con borde sutil
export const glassStyles = () =>
  "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm";

// Hover de tarjeta: sombra, sin escala
export const cardHoverStyles = () =>
  "transition-shadow duration-200 hover:shadow-md";

// Título de sección
export const sectionTitleStyles = () =>
  "text-lg font-semibold text-slate-800 dark:text-white mb-4";

// Input limpio
export const inputStyles = () =>
  "block w-full px-3 py-2 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors";

// Botón primario — sólido, sin gradiente
export const primaryButtonStyles = (color = 'brand') => {
  const colors = {
    brand:   "bg-indigo-600 hover:bg-indigo-700 text-white",
    blue:    "bg-blue-600 hover:bg-blue-700 text-white",
    emerald: "bg-emerald-600 hover:bg-emerald-700 text-white",
    purple:  "bg-violet-600 hover:bg-violet-700 text-white",
    rose:    "bg-rose-600 hover:bg-rose-700 text-white",
    amber:   "bg-amber-500 hover:bg-amber-600 text-white",
    slate:   "bg-slate-700 hover:bg-slate-800 text-white",
  };
  return `inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${colors[color] || colors.brand}`;
};

// Badge — un solo color por estado semántico
export const badgeStyles = (color = 'slate') => {
  const colors = {
    brand:   "bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300",
    slate:   "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
    blue:    "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
    emerald: "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
    rose:    "bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300",
    amber:   "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
    purple:  "bg-violet-50 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300",
  };
  return `inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium ${colors[color] || colors.slate}`;
};
