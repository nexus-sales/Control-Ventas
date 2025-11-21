// src/components/ventas/VentasFilters.jsx
// Componente de filtros extraído y optimizado de VentasPage
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
    <div className="bg-white rounded-lg shadow-sm border p-4">
      <div className="flex items-center gap-2 mb-4">
        <Filter className="w-5 h-5 text-gray-500" />
        <h3 className="font-medium text-gray-900">Filtros</h3>
        {hasActiveFilters && (
          <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
            Activos
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        {/* Búsqueda */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Búsqueda
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={filtros.search || ''}
              onChange={(e) => updateFilter?.('search', e.target.value)}
              placeholder="Cliente, producto..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
        
        {/* Colaborador */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Colaborador
          </label>
          <select
            value={filtros.colaborador_id || ''}
            onChange={(e) => updateFilter?.('colaborador_id', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Estado
          </label>
          <select
            value={filtros.estado || ''}
            onChange={(e) => updateFilter?.('estado', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Operador
          </label>
          <select
            value={filtros.operador_id || ''}
            onChange={(e) => updateFilter?.('operador_id', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
      <div className="flex items-center justify-between pt-4 border-t">
        <div className="flex items-center gap-2">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={filtros.sinPvp || false}
              onChange={(e) => updateFilter?.('sinPvp', e.target.checked)}
              className="mr-2 rounded"
            />
            <span className="text-sm text-gray-700">Solo ventas sin PVP</span>
          </label>
        </div>
        
        <div className="flex items-center gap-2">
          {hasActiveFilters && (
            <button
              onClick={() => clearFilters?.()}
              className="flex items-center gap-1 px-3 py-2 text-gray-600 hover:text-gray-800 text-sm"
            >
              <X className="w-4 h-4" />
              Limpiar filtros
            </button>
          )}
          <button
            onClick={() => onExport?.()}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm font-medium"
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