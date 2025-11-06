// src/components/ui/Card.jsx
import React from 'react';

export default function Card({ children, className = "" }) {
  return (
    <div className={`rounded-2xl shadow-sm border border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 hover:shadow-md dark:hover:shadow-xl transition-all duration-300 text-slate-800 dark:text-white ${className}`}>
      {children}
    </div>
  );
}