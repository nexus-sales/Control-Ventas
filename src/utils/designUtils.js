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

// Estilos glassmorphism - ahora como función para permitir uso con ()
export const glassStyles = (variant = 'default') => {
    const base = "bg-white/70 dark:bg-slate-900/40 backdrop-blur-md border border-white/20 dark:border-slate-700/30 shadow-xl";

    switch (variant) {
        case 'subtle':
            return "bg-white/50 dark:bg-slate-900/30 backdrop-blur-sm border border-white/10 dark:border-slate-700/20";
        case 'strong':
            return "bg-white/90 dark:bg-slate-900/70 backdrop-blur-xl border border-white/30 dark:border-slate-700/40 shadow-2xl";
        default:
            return base;
    }
};

// Estilos de hover para tarjetas - ahora como función
export const cardHoverStyles = () => {
    return "transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:bg-white/80 dark:hover:bg-slate-900/60";
};

// Estilos de título de sección
export const sectionTitleStyles = () => {
    return "text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-800 to-slate-500 dark:from-white dark:to-slate-400 mb-6";
};

// Estilos para inputs premium
export const inputStyles = () => {
    return "block w-full px-4 py-3 rounded-2xl border-none bg-slate-100 dark:bg-slate-800/50 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:ring-2 focus:ring-blue-500/50 focus:bg-white dark:focus:bg-slate-800 transition-all shadow-inner text-sm font-medium";
};

// Estilos para botones primarios
export const primaryButtonStyles = (color = 'blue') => {
    const colors = {
        blue: "from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 shadow-blue-500/30",
        emerald: "from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 shadow-emerald-500/30",
        purple: "from-purple-500 to-violet-600 hover:from-purple-600 hover:to-violet-700 shadow-purple-500/30",
        rose: "from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 shadow-rose-500/30",
        amber: "from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 shadow-amber-500/30"
    };

    return `flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r ${colors[color] || colors.blue} text-white rounded-xl transition-all shadow-lg hover:shadow-xl text-xs font-bold uppercase tracking-widest active:scale-95`;
};

// Estilos para badges/etiquetas
export const badgeStyles = (color = 'slate') => {
    const colors = {
        slate: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400",
        blue: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
        emerald: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
        purple: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
        rose: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400",
        amber: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
    };

    return `px-3 py-1 rounded-xl text-xs font-bold uppercase tracking-wider ${colors[color] || colors.slate}`;
};
