# Sistema de Protección de Sesión Durante Importación

## Problema resuelto

Durante las importaciones de Excel, la sesión se perdía causando logout automático.

## Solución implementada

Se agregó un sistema de protección de sesión que previene logouts durante importaciones.

## Cómo usar en el componente de importación

```jsx
import { useAuth } from '../context/AuthContext';

export default function ImportExcelMapperV2() {
  const { startImporting, finishImporting, isImporting } = useAuth();

  const handleImportStart = () => {
    try {
      startImporting(); // Protege la sesión
      // ... código de importación
    } finally {
      finishImporting(); // SIEMPRE llamar en el finally
    }
  };
}
```

## Lo que hace automáticamente

- Previene logout durante la importación
- Mantiene token válido
- Ignora errores temporales de red
- Restaura funcionamiento normal al terminar

## Importante

- SIEMPRE llamar `finishImporting()` en el finally
- No olvides importar useAuth donde lo necesites

