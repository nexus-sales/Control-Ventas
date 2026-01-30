/**
 * DashboardUtils.js
 * Funciones de utilidad y estilos comunes para el Dashboard Premium
 */

export const euro = (n) => {
    return new Intl.NumberFormat('es-ES', {
        style: 'currency',
        currency: 'EUR',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(n ?? 0);
};

export const glassStyles = "bg-white/70 dark:bg-slate-900/40 backdrop-blur-md border border-white/20 dark:border-slate-700/30 shadow-xl";

export const cardHoverStyles = "transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:bg-white/80 dark:hover:bg-slate-900/60";

export const sectionTitleStyles = "text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-800 to-slate-500 dark:from-white dark:to-slate-400 mb-6";
