// src/hooks/useCustomFieldsExport.js
import { useEffect, useState } from 'react';

export function useCustomFieldsExport(modulo) {
  const [fields, setFields] = useState([]);
  useEffect(() => {
    let campos = [];
    try {
      const raw = localStorage.getItem('customFields');
      if (raw) {
        campos = JSON.parse(raw);
      }
    } catch {/* ignore */}
    setFields(campos.filter(f => f.modulo === modulo && f.activo));
  }, [modulo]);
  return fields;
}
