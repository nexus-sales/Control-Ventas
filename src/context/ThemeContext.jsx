import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

// Crear el contexto
export const ThemeContext = createContext();

// Hook personalizado integrado
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme debe ser usado dentro de un ThemeProvider');
  }
  return context;
};

// Utilidades para tema
const STORAGE_KEY = 'app_theme_preference';
const THEMES = {
  LIGHT: 'light',
  DARK: 'dark',
  SYSTEM: 'system'
};

const getSystemTheme = () => {
  if (typeof window === 'undefined') return THEMES.LIGHT;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? THEMES.DARK : THEMES.LIGHT;
};

const loadThemePreference = () => {
  if (typeof window === 'undefined') return THEMES.SYSTEM;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved && Object.values(THEMES).includes(saved) ? saved : THEMES.SYSTEM;
  } catch (error) {
    console.warn('[ThemeProvider] Error cargando preferencia de tema:', error);
    return THEMES.SYSTEM;
  }
};

const saveThemePreference = (theme) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch (error) {
    console.warn('[ThemeProvider] Error guardando preferencia de tema:', error);
  }
};

const applyThemeToDOM = (isDark) => {
  if (typeof document === 'undefined') return;
  
  const root = document.documentElement;
  const body = document.body;
  
  if (isDark) {
    // DARK MODE REAL
    root.classList.add('dark');
    body.style.backgroundColor = '#111827'; // bg-gray-900
    body.style.color = '#f9fafb'; // text-gray-50
    
    // Meta theme para móviles
    let themeColor = document.querySelector('meta[name="theme-color"]');
    if (themeColor) {
      themeColor.setAttribute('content', '#111827');
    }
  } else {
    // LIGHT MODE
    root.classList.remove('dark');
    body.style.backgroundColor = '#ffffff'; // bg-white  
    body.style.color = '#111827'; // text-gray-900
    
    // Meta theme para móviles
    let themeColor = document.querySelector('meta[name="theme-color"]');
    if (themeColor) {
      themeColor.setAttribute('content', '#ffffff');
    }
  }
};

export function ThemeProvider({ children }) {
  const [themePreference, setThemePreference] = useState(() => loadThemePreference());
  const [systemTheme, setSystemThemeState] = useState(() => getSystemTheme());
  const [isDark, setIsDark] = useState(() => {
    const preference = loadThemePreference();
    return preference === THEMES.DARK || (preference === THEMES.SYSTEM && getSystemTheme() === THEMES.DARK);
  });

  // Aplicar tema al DOM cuando cambia
  useEffect(() => {
    applyThemeToDOM(isDark);
  }, [isDark]);

  // Escuchar cambios del sistema
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleSystemThemeChange = (e) => {
      const newSystemTheme = e.matches ? THEMES.DARK : THEMES.LIGHT;
      setSystemThemeState(newSystemTheme);
      
      // Si el usuario usa tema del sistema, actualizar
      if (themePreference === THEMES.SYSTEM) {
        setIsDark(newSystemTheme === THEMES.DARK);
      }
    };

    mediaQuery.addEventListener('change', handleSystemThemeChange);
    
    return () => {
      mediaQuery.removeEventListener('change', handleSystemThemeChange);
    };
  }, [themePreference]);

  // Funciones de control de tema
  const setLightTheme = useCallback(() => {
    setThemePreference(THEMES.LIGHT);
    setIsDark(false);
    saveThemePreference(THEMES.LIGHT);
  }, []);

  const setDarkTheme = useCallback(() => {
    setThemePreference(THEMES.DARK);
    setIsDark(true);
    saveThemePreference(THEMES.DARK);
  }, []);

  const setSystemTheme = useCallback(() => {
    setThemePreference(THEMES.SYSTEM);
    const currentSystemTheme = getSystemTheme();
    setIsDark(currentSystemTheme === THEMES.DARK);
    saveThemePreference(THEMES.SYSTEM);
  }, []);

  const toggleTheme = useCallback(() => {
    if (themePreference === THEMES.SYSTEM) {
      // Si está en sistema, cambiar al opuesto del sistema actual
      const newTheme = systemTheme === THEMES.DARK ? THEMES.LIGHT : THEMES.DARK;
      if (newTheme === THEMES.DARK) {
        setDarkTheme();
      } else {
        setLightTheme();
      }
    } else {
      // Si es manual, alternar
      if (isDark) {
        setLightTheme();
      } else {
        setDarkTheme();
      }
    }
  }, [themePreference, systemTheme, isDark, setDarkTheme, setLightTheme]);

  // Función para ciclar entre todos los temas
  const cycleTheme = useCallback(() => {
    switch (themePreference) {
      case THEMES.LIGHT:
        setDarkTheme();
        break;
      case THEMES.DARK:
        setSystemTheme();
        break;
      case THEMES.SYSTEM:
      default:
        setLightTheme();
        break;
    }
  }, [themePreference, setLightTheme, setDarkTheme, setSystemTheme]);

  // Información del tema actual
  const themeInfo = {
    current: isDark ? THEMES.DARK : THEMES.LIGHT,
    preference: themePreference,
    systemTheme: systemTheme,
    isSystemControlled: themePreference === THEMES.SYSTEM,
  };

  const contextValue = {
    // Estado
    isDark,
    isLight: !isDark,
    themePreference,
    systemTheme,
    themeInfo,
    
    // Constantes
    THEMES,
    
    // Acciones
    toggleTheme,
    cycleTheme,
    setLightTheme,
    setDarkTheme,
    setSystemTheme: setSystemTheme,
    
    // Utilidades
    getThemeIcon: () => {
      switch (themePreference) {
        case THEMES.LIGHT: return '☀️';
        case THEMES.DARK: return '🌙';
        case THEMES.SYSTEM: return '💻';
        default: return '🌓';
      }
    },
    
    getThemeLabel: () => {
      switch (themePreference) {
        case THEMES.LIGHT: return 'Claro';
        case THEMES.DARK: return 'Oscuro';
        case THEMES.SYSTEM: return 'Sistema';
        default: return 'Automático';
      }
    },

    // Debug
    debug: () => ({
      preference: themePreference,
      system: systemTheme,
      current: isDark ? 'dark' : 'light',
      isSystemControlled: themePreference === THEMES.SYSTEM,
    })
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
}

// Export default del provider para compatibilidad
export default ThemeProvider;