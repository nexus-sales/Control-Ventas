import React, { forwardRef } from 'react';
import { glassStyles } from '../../utils/designUtils';

export const Label = ({ children, className = '' }) => (
    <label className={`block text-[11px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-2 ${className}`}>
        {children}
    </label>
);

export const Input = forwardRef(({ icon: Icon, className = '', ...props }, ref) => (
    <div className="relative group">
        {Icon && (
            <div className="absolute left-3 top-3 pointer-events-none transition-colors group-focus-within:text-blue-500">
                <Icon className="w-5 h-5 text-slate-400" />
            </div>
        )}
        <input
            ref={ref}
            className={`
        w-full rounded-2xl border-none outline-none
        bg-slate-50 dark:bg-slate-800/50 
        text-sm font-medium text-slate-900 dark:text-white
        placeholder-slate-400/50
        shadow-inner transition-all duration-300
        focus:bg-white dark:focus:bg-slate-800
        focus:ring-2 focus:ring-blue-500/30
        hover:bg-slate-100 dark:hover:bg-slate-700/50
        ${Icon ? 'pl-11 pr-4' : 'px-4'} py-3
        ${className}
      `}
            {...props}
        />
        <div className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-transparent via-blue-500 to-transparent scale-x-0 group-focus-within:scale-x-100 transition-transform duration-500" />
    </div>
));

export const Select = forwardRef(({ icon: Icon, children, className = '', ...props }, ref) => (
    <div className="relative group">
        {Icon && (
            <div className="absolute left-3 top-3 pointer-events-none transition-colors group-focus-within:text-blue-500">
                <Icon className="w-5 h-5 text-slate-400" />
            </div>
        )}
        <select
            ref={ref}
            className={`
        w-full rounded-2xl border-none outline-none appearance-none
        bg-slate-50 dark:bg-slate-800/50 
        text-sm font-medium text-slate-900 dark:text-white
        shadow-inner transition-all duration-300
        focus:bg-white dark:focus:bg-slate-800
        focus:ring-2 focus:ring-blue-500/30
        hover:bg-slate-100 dark:hover:bg-slate-700/50
        ${Icon ? 'pl-11 pr-10' : 'px-4 pr-10'} py-3
        ${className}
      `}
            {...props}
        >
            {children}
        </select>
        <div className="absolute right-4 top-3.5 pointer-events-none">
            <div className="border-l-4 border-r-4 border-t-4 border-transparent border-t-slate-400" />
        </div>
    </div>
));

export const TextArea = ({ className = '', ...props }) => (
    <div className="relative group">
        <textarea
            className={`
        w-full rounded-2xl border-none outline-none resize-none
        bg-slate-50 dark:bg-slate-800/50 
        text-sm font-medium text-slate-900 dark:text-white
        placeholder-slate-400/50
        shadow-inner transition-all duration-300
        focus:bg-white dark:focus:bg-slate-800
        focus:ring-2 focus:ring-blue-500/30
        hover:bg-slate-100 dark:hover:bg-slate-700/50
        px-4 py-3
        ${className}
      `}
            {...props}
        />
    </div>
);

export const Button = ({ children, variant = 'primary', icon: Icon, className = '', ...props }) => {
    const variants = {
        primary: 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-blue-500/30 hover:from-blue-600 hover:to-indigo-700',
        secondary: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700',
        danger: 'bg-gradient-to-r from-rose-500 to-red-600 text-white shadow-rose-500/30 hover:from-rose-600 hover:to-red-700',
        success: 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-emerald-500/30 hover:from-emerald-600 hover:to-teal-700',
        ghost: 'bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-700'
    };

    return (
        <button
            className={`
        flex items-center justify-center gap-2 px-6 py-3 rounded-xl 
        text-xs font-black uppercase tracking-widest shadow-lg 
        transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed
        ${variants[variant]} ${className}
      `}
            {...props}
        >
            {Icon && <Icon className="w-4 h-4" />}
            {children}
        </button>
    );
};
