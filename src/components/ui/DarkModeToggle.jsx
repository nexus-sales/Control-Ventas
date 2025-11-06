// src/components/ui/DarkModeToggle.jsx
import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../../context/useTheme';

export default function DarkModeToggle({ className = "" }) {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className={`relative p-2 rounded-lg transition-all duration-300 ease-in-out
        bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600
        text-gray-700 dark:text-gray-200 ${className}`}
      title={isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
    >
      {/* Animación de transición entre iconos */}
      <div className="relative w-5 h-5">
        <Sun 
          className={`absolute w-5 h-5 transition-all duration-300 ${
            isDark ? 'rotate-90 scale-0 opacity-0' : 'rotate-0 scale-100 opacity-100'
          }`}
        />
        <Moon 
          className={`absolute w-5 h-5 transition-all duration-300 ${
            isDark ? 'rotate-0 scale-100 opacity-100' : '-rotate-90 scale-0 opacity-0'
          }`}
        />
      </div>
    </button>
  );
}