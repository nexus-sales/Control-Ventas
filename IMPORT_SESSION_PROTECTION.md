// INSTRUCCIONES PARA USAR EL NUEVO SISTEMA DE PROTECCIÓN DE SESIÓN DURANTE IMPORTACIÓN

## Problema resuelto:
Durante las importaciones de Excel, la sesión se perdía causando logout automático.

## Solución implementada:
Se agregó un sistema de protección de sesión que previene logouts durante importaciones.

## Cómo usar en el componente de importación:

```jsx
import { useAuth } from '../context/AuthContext';

export default function ImportExcelMapperV2() {
  const { startImporting, finishImporting, isImporting } = useAuth();

  const handleImport = async () => {
    try {
      // PASO 1: Activar protección antes de iniciar
      startImporting();
      
      // PASO 2: Hacer la importación
      const result = await importExcelData(file, mappings);
      
      // PASO 3: Procesar resultados
      console.log('Importación exitosa:', result);
      
    } catch (error) {
      console.error('Error en importación:', error);
    } finally {
      // PASO 4: SIEMPRE desactivar protección al final
      finishImporting();
    }
  };

  return (
    <div>
      {isImporting && (
        <div className="bg-blue-100 p-2 rounded">
          🔒 Importación en progreso - sesión protegida
        </div>
      )}
      <button onClick={handleImport}>
        Importar Datos
      </button>
    </div>
  );
}
```

## Lo que hace automáticamente:
- ✅ Previene logout durante la importación
- ✅ Bloquea verificaciones automáticas de sesión
- ✅ Mantiene la sesión estable durante operaciones largas
- ✅ Se libera automáticamente al completar

## Importante:
- SIEMPRE llamar `finishImporting()` en el finally
- Usar `isImporting` para mostrar estado al usuario
- No olvides importar useAuth donde lo necesites