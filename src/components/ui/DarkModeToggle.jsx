// src/components/ui/DarkModeToggle.jsx
import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

export default function DarkModeToggle({ className = "" }) {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className={`relative p-2 rounded-lg transition-all duration-300 ease-in-out
        bg-pink-100 hover:bg-pink-200 dark:bg-pink-400 dark:hover:bg-pink-500
        text-pink-700 dark:text-pink-50 shadow-md ${className}`}
      title={isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
    >
      {/* Animación de transición entre iconos */}
      <div className="relative w-5 h-5">
        <Sun 
          className={`absolute w-5 h-5 transition-all duration-300 text-pink-700 ${
            isDark ? 'rotate-90 scale-0 opacity-0' : 'rotate-0 scale-100 opacity-100'
          }`}
        />
        <Moon 
          className={`absolute w-5 h-5 transition-all duration-300 text-pink-900 ${
            isDark ? 'rotate-0 scale-100 opacity-100' : '-rotate-90 scale-0 opacity-0'
          }`}
        />
      </div>
    </button>
  );
}