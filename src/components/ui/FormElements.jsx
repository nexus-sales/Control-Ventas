import React, { forwardRef } from 'react';

export const Label = ({ children, className = '' }) => (
  <label className={`block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5 ${className}`}>
    {children}
  </label>
);

export const Input = forwardRef(({ icon: Icon, className = '', ...props }, ref) => (
  <div className="relative">
    {Icon && (
      <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
        <Icon className="w-4 h-4" />
      </div>
    )}
    <input
      ref={ref}
      className={`
        w-full rounded-md border border-slate-300 dark:border-slate-700
        bg-white dark:bg-slate-800
        text-sm text-slate-900 dark:text-white
        placeholder-slate-400 dark:placeholder-slate-500
        px-3 py-2
        focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500
        disabled:bg-slate-50 dark:disabled:bg-slate-900 disabled:text-slate-400
        transition-colors
        ${Icon ? 'pl-9' : ''}
        ${className}
      `}
      {...props}
    />
  </div>
));
Input.displayName = 'Input';

export const Select = forwardRef(({ icon: Icon, children, className = '', ...props }, ref) => (
  <div className="relative">
    {Icon && (
      <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
        <Icon className="w-4 h-4" />
      </div>
    )}
    <select
      ref={ref}
      className={`
        w-full rounded-md border border-slate-300 dark:border-slate-700
        bg-white dark:bg-slate-800
        text-sm text-slate-900 dark:text-white
        px-3 py-2 pr-8 appearance-none
        focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500
        disabled:bg-slate-50 dark:disabled:bg-slate-900 disabled:text-slate-400
        transition-colors
        ${Icon ? 'pl-9' : ''}
        ${className}
      `}
      {...props}
    >
      {children}
    </select>
    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    </div>
  </div>
));
Select.displayName = 'Select';

export const TextArea = ({ className = '', ...props }) => (
  <textarea
    className={`
      w-full rounded-md border border-slate-300 dark:border-slate-700
      bg-white dark:bg-slate-800
      text-sm text-slate-900 dark:text-white
      placeholder-slate-400 dark:placeholder-slate-500
      px-3 py-2 resize-none
      focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500
      transition-colors
      ${className}
    `}
    {...props}
  />
);

export const Button = ({ children, variant = 'primary', icon: Icon, className = '', ...props }) => {
  const variants = {
    primary:   'bg-indigo-600 hover:bg-indigo-700 text-white',
    secondary: 'bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700',
    danger:    'bg-rose-600 hover:bg-rose-700 text-white',
    success:   'bg-emerald-600 hover:bg-emerald-700 text-white',
    ghost:     'bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300',
  };

  return (
    <button
      className={`
        inline-flex items-center justify-center gap-2 px-4 py-2 rounded-md
        text-sm font-medium
        transition-colors disabled:opacity-50 disabled:cursor-not-allowed
        ${variants[variant]} ${className}
      `}
      {...props}
    >
      {Icon && <Icon className="w-4 h-4" />}
      {children}
    </button>
  );
};
