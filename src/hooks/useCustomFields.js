// src/hooks/useCustomFields.js
import { useState, useEffect } from 'react';


// En el futuro, esto puede venir de Supabase o contexto global
export function useCustomFields(modulo) {
  // Por ahora, solo localStorage o ejemplo
  const [fields, setFields] = useState([]);

  useEffect(() => {
    // Simulación: cargar campos personalizados del módulo
    // Reemplazar por fetch a Supabase o contexto global
    let campos = [];
    try {
      const raw = localStorage.getItem('customFields');
      if (raw) {
        campos = JSON.parse(raw);
      }
  } catch { /* ignore */ }
    setFields(campos.filter(f => f.modulo === modulo && f.activo));
  }, [modulo]);

  return fields;
}
