// src/components/ventas/VentasFilters.jsx
// Componente de filtros con DARK MODE COMPLETO
import React from 'react';
import { Search, Filter, Download, X } from 'lucide-react';

export function VentasFilters({
  filtros = {},
  updateFilter,
  clearFilters,
  onExport,
  colaboradores = [],
  operadores = [],
  hasActiveFilters = false
}) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
      <div className="flex items-center gap-2 mb-4">
        <Filter className="w-5 h-5 text-gray-500 dark:text-gray-400" />
        <h3 className="font-medium text-gray-900 dark:text-gray-100">Filtros</h3>
        {hasActiveFilters && (
          <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 text-xs px-2 py-1 rounded-full">
            Activos
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        {/* Búsqueda */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Búsqueda
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
            <input
              type="text"
              value={filtros.search || ''}
              onChange={(e) => updateFilter?.('search', e.target.value)}
              placeholder="Cliente, producto..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
            />
          </div>
        </div>
        
        {/* Colaborador */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Colaborador
          </label>
          <select
            value={filtros.colaborador_id || ''}
            onChange={(e) => updateFilter?.('colaborador_id', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          >
            <option value="">Todos los colaboradores</option>
            {colaboradores.map((colab) => (
              <option key={colab.id} value={colab.id}>
                {colab.nombre}
              </option>
            ))}
          </select>
        </div>

        {/* Estado */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Estado
          </label>
          <select
            value={filtros.estado || ''}
            onChange={(e) => updateFilter?.('estado', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          >
            <option value="">Todos los estados</option>
            <option value="Confirmada">Confirmada</option>
            <option value="Pendiente">Pendiente</option>
            <option value="Cancelada">Cancelada</option>
            <option value="En proceso">En proceso</option>
          </select>
        </div>

        {/* Operador */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Operador
          </label>
          <select
            value={filtros.operador_id || ''}
            onChange={(e) => updateFilter?.('operador_id', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          >
            <option value="">Todos los operadores</option>
            {operadores.map((op) => (
              <option key={op.id} value={op.id}>
                {op.nombre}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Acciones de filtros */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={filtros.sinPvp || false}
              onChange={(e) => updateFilter?.('sinPvp', e.target.checked)}
              className="mr-2 rounded accent-blue-500"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">Solo ventas sin PVP</span>
          </label>
        </div>
        
        <div className="flex items-center gap-2">
          {hasActiveFilters && (
            <button
              onClick={() => clearFilters?.()}
              className="flex items-center gap-1 px-3 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 text-sm transition-colors"
            >
              <X className="w-4 h-4" />
              Limpiar filtros
            </button>
          )}
          <button
            onClick={() => onExport?.()}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 dark:bg-green-700 text-white rounded-md hover:bg-green-700 dark:hover:bg-green-600 text-sm font-medium transition-colors"
          >
            <Download className="w-4 h-4" />
            Exportar
          </button>
        </div>
      </div>
    </div>
  );
}

export default VentasFilters;