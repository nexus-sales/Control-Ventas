import React, { useState } from 'react';
import { cleanAllData, cleanZonasData, cleanOperadoresData } from '../utils/dataCleanup';
import Card from './ui/Card';
import SectionTitle from './ui/SectionTitle';

export default function DataCleanupAdmin() {
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState(null);

  const handleCleanAll = async () => {
    setIsLoading(true);
    setResults(null);
    
    try {
      const result = await cleanAllData();
      setResults(result);
    } catch (error) {
      setResults({
        error: true,
        message: error.message
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCleanZonas = async () => {
    setIsLoading(true);
    setResults(null);
    
    try {
      const result = await cleanZonasData();
      setResults({ zonas: result });
    } catch (error) {
      setResults({
        error: true,
        message: error.message
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCleanOperadores = async () => {
    setIsLoading(true);
    setResults(null);
    
    try {
      const result = await cleanOperadoresData();
      setResults({ operadores: result });
    } catch (error) {
      setResults({
        error: true,
        message: error.message
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <SectionTitle>
        🧹 Limpieza de Datos Supabase
      </SectionTitle>

      <Card>
        <div className="p-6">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Normalización de Datos
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Estas herramientas eliminan duplicados y normalizan las mayúsculas/minúsculas 
              en los datos de Supabase para mantener consistencia.
            </p>
          </div>

          <div className="flex flex-wrap gap-3 mb-6">
            <button
              onClick={handleCleanAll}
              disabled={isLoading}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
            >
              {isLoading ? '🔄 Procesando...' : '🧹 Limpiar Todo'}
            </button>

            <button
              onClick={handleCleanZonas}
              disabled={isLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {isLoading ? '🔄 Procesando...' : '📍 Solo Zonas'}
            </button>

            <button
              onClick={handleCleanOperadores}
              disabled={isLoading}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              {isLoading ? '🔄 Procesando...' : '🏢 Solo Operadores'}
            </button>
          </div>

          {/* Resultados */}
          {results && (
            <div className="border-t pt-4">
              <h4 className="font-semibold text-gray-900 mb-3">Resultados:</h4>
              
              {results.error ? (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <span className="text-red-600 mr-2">❌</span>
                    <span className="text-red-800">Error: {results.message}</span>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {results.zonas && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-center mb-2">
                        <span className="text-blue-600 mr-2">📍</span>
                        <span className="font-semibold text-blue-800">Zonas:</span>
                      </div>
                      <p className="text-blue-700 text-sm">
                        {results.zonas.success ? 
                          `✅ ${results.zonas.message}` : 
                          `❌ ${results.zonas.message}`
                        }
                      </p>
                      {results.zonas.zonas && (
                        <ul className="mt-2 text-xs text-blue-600">
                          {results.zonas.zonas.map(zona => (
                            <li key={zona.id}>• {zona.nombre} ({zona.codigo})</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}

                  {results.operadores && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="flex items-center mb-2">
                        <span className="text-green-600 mr-2">🏢</span>
                        <span className="font-semibold text-green-800">Operadores:</span>
                      </div>
                      <p className="text-green-700 text-sm">
                        {results.operadores.success ? 
                          `✅ ${results.operadores.message}` : 
                          `❌ ${results.operadores.message}`
                        }
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start">
              <span className="text-yellow-600 mr-2 mt-0.5">⚠️</span>
              <div>
                <p className="text-yellow-800 font-semibold mb-1">Importante:</p>
                <ul className="text-yellow-700 text-sm space-y-1">
                  <li>• Esta acción elimina y recrea los registros en Supabase</li>
                  <li>• Se normalizarán las mayúsculas/minúsculas</li>
                  <li>• Se eliminarán duplicados automáticamente</li>
                  <li>• Asegúrate de tener backup antes de ejecutar</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
