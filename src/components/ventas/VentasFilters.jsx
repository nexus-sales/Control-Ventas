import React, { useState } from 'react';
import { Filter, Search, Calendar, Download, Euro, Users, Package, Building, MapPin, RotateCcw, ChevronDown, ChevronUp, X } from 'lucide-react';
import Card from '../ui/Card';
import SectionTitle from '../ui/SectionTitle';

const ESTADOS_VALIDOS = [
  "ACTIVO",
  "PENDIENTE", 
  "PENDIENTE VALIDAR",
  "SCORING",
  "INCIDENCIA",
  "INSTALACION",
  "ENVIADA",
  "PENDIENTE INSTALACION",
  "CITADA",
  "TRAMITACION",
  "CANCELADA",
  "BAJA",
  "OFERTA FIRMADA",
  "PDTE FIRMA",
  "RECHAZADA",
];

export function VentasFilters({
  filtros,
  updateFilter,
  clearFilters,
  onExport,
  colaboradores = [],
  productos = [],
  operadores = [],
  zonas = []
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Contador de filtros activos
  const activeFiltersCount = Object.entries(filtros).filter(([key, value]) => {
    if (key === 'sinPvp') return value === true;
    return value && value !== '';
  }).length;

  // Función para aplicar filtros rápidos
  const applyQuickFilter = (type) => {
    clearFilters();
    const today = new Date();
    const currentMonth = today.toISOString().slice(0, 7);
    
    switch (type) {
      case 'hoy': {
        updateFilter('desde', today.toISOString().slice(0, 10));
        updateFilter('hasta', today.toISOString().slice(0, 10));
        break;
      }
      case 'semana': {
        const weekAgo = new Date(today);
        weekAgo.setDate(today.getDate() - 7);
        updateFilter('desde', weekAgo.toISOString().slice(0, 10));
        updateFilter('hasta', today.toISOString().slice(0, 10));
        break;
      }
      case 'mes': {
        updateFilter('mesAno', currentMonth);
        break;
      }
      case 'sinPvp': {
        updateFilter('sinPvp', true);
        break;
      }
      default:
        break;
    }
  };

  return (
    <Card className="bg-gradient-to-r from-slate-50 to-slate-100 border-2 border-slate-200">
      {/* Header mejorado */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-sky-600" />
            <SectionTitle className="text-lg font-semibold">Filtros de Ventas</SectionTitle>
          </div>
          
          {activeFiltersCount > 0 && (
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 text-sm bg-sky-100 text-sky-700 rounded-full font-medium">
                {activeFiltersCount} {activeFiltersCount === 1 ? 'filtro activo' : 'filtros activos'}
              </span>
              <button
                onClick={clearFilters}
                className="flex items-center gap-1 px-3 py-1 text-sm bg-red-100 text-red-700 rounded-full hover:bg-red-200 transition-colors"
                title="Limpiar todos los filtros"
              >
                <X className="w-3 h-3" />
                Limpiar todo
              </button>
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {/* Filtros rápidos */}
          <div className="flex gap-1">
            <button
              onClick={() => applyQuickFilter('hoy')}
              className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
              title="Filtrar ventas de hoy"
            >
              Hoy
            </button>
            <button
              onClick={() => applyQuickFilter('semana')}
              className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
              title="Filtrar última semana"
            >
              7 días
            </button>
            <button
              onClick={() => applyQuickFilter('mes')}
              className="px-2 py-1 text-xs bg-purple-100 text-purple-700 rounded hover:bg-purple-200 transition-colors"
              title="Filtrar mes actual"
            >
              Este mes
            </button>
            <button
              onClick={() => applyQuickFilter('sinPvp')}
              className="px-2 py-1 text-xs bg-orange-100 text-orange-700 rounded hover:bg-orange-200 transition-colors"
              title="Mostrar solo ventas sin PVP"
            >
              Sin PVP
            </button>
          </div>
          
          <button
            onClick={onExport}
            className="flex items-center gap-1 px-3 py-2 text-sm bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors shadow-sm"
            title="Exportar resultados filtrados"
          >
            <Download className="w-4 h-4" />
            Exportar
          </button>
          
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1 px-3 py-2 text-sm bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors"
            title={isExpanded ? "Contraer filtros" : "Expandir filtros"}
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            {isExpanded ? 'Contraer' : 'Expandir'}
          </button>
        </div>
      </div>
      
      {/* Filtros contraíbles */}
      {isExpanded && (
        <div className="space-y-4">
          {/* Sección de búsqueda */}
          <div className="bg-white rounded-lg p-4 border border-slate-200">
            <div className="flex items-center gap-2 mb-3">
              <Search className="w-4 h-4 text-slate-500" />
              <span className="text-sm font-medium text-slate-700">Búsqueda</span>
            </div>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
              <input
                id="ventas-busqueda"
                className="border border-slate-200 rounded-xl px-10 py-3 w-full focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-sky-400 bg-white transition-all focus-visible:ring-4 focus-visible:ring-sky-500"
                placeholder="Buscar por cliente, CIF, numeración o documento..."
                value={filtros.texto}
                onChange={(e) => updateFilter('texto', e.target.value)}
                aria-label="Buscar ventas"
              />
              {filtros.texto && (
                <button
                  onClick={() => updateFilter('texto', '')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  title="Limpiar búsqueda"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Sección de filtros por entidades */}
          <div className="bg-white rounded-lg p-4 border border-slate-200">
            <div className="flex items-center gap-2 mb-3">
              <Users className="w-4 h-4 text-slate-500" />
              <span className="text-sm font-medium text-slate-700">Filtros por Entidades</span>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Colaborador */}
              <div className="space-y-1">
                <label htmlFor="filtro-colaborador" className="text-xs font-medium text-slate-600 flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  Colaborador
                </label>
                <div className="relative">
                  <select
                    id="filtro-colaborador"
                    className="border border-slate-200 rounded-xl px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-sky-400 bg-white transition-all text-sm focus-visible:ring-4 focus-visible:ring-sky-500"
                    value={filtros.colaborador_id}
                    onChange={(e) => updateFilter('colaborador_id', e.target.value)}
                    aria-label="Filtrar por colaborador"
                  >
                    <option value="">Todos ({colaboradores.length})</option>
                    {colaboradores.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nombre}
                      </option>
                    ))}
                  </select>
                  {filtros.colaborador_id && (
                    <button
                      onClick={() => updateFilter('colaborador_id', '')}
                      className="absolute right-8 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      title="Limpiar filtro"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>

              {/* Producto */}
              <div className="space-y-1">
                <label htmlFor="filtro-producto" className="text-xs font-medium text-slate-600 flex items-center gap-1">
                  <Package className="w-3 h-3" />
                  Producto
                </label>
                <div className="relative">
                  <select
                    id="filtro-producto"
                    className="border border-slate-200 rounded-xl px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-sky-400 bg-white transition-all text-sm focus-visible:ring-4 focus-visible:ring-sky-500"
                    value={filtros.producto_id}
                    onChange={(e) => updateFilter('producto_id', e.target.value)}
                    aria-label="Filtrar por producto"
                  >
                    <option value="">Todos ({productos.length})</option>
                    {productos.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.nombre}
                      </option>
                    ))}
                  </select>
                  {filtros.producto_id && (
                    <button
                      onClick={() => updateFilter('producto_id', '')}
                      className="absolute right-8 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      title="Limpiar filtro"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>

              {/* Operador */}
              <div className="space-y-1">
                <label htmlFor="filtro-operador" className="text-xs font-medium text-slate-600 flex items-center gap-1">
                  <Building className="w-3 h-3" />
                  Operador
                </label>
                <div className="relative">
                  <select
                    id="filtro-operador"
                    className="border border-slate-200 rounded-xl px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-sky-400 bg-white transition-all text-sm focus-visible:ring-4 focus-visible:ring-sky-500"
                    value={filtros.operador_id}
                    onChange={(e) => updateFilter('operador_id', e.target.value)}
                    aria-label="Filtrar por operador"
                  >
                    <option value="">Todos ({operadores.length})</option>
                    {operadores.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.nombre}
                      </option>
                    ))}
                  </select>
                  {filtros.operador_id && (
                    <button
                      onClick={() => updateFilter('operador_id', '')}
                      className="absolute right-8 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      title="Limpiar filtro"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>

              {/* Zona */}
              <div className="space-y-1">
                <label htmlFor="filtro-zona" className="text-xs font-medium text-slate-600 flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  Zona
                </label>
                <div className="relative">
                  <select
                    id="filtro-zona"
                    className="border border-slate-200 rounded-xl px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-sky-400 bg-white transition-all text-sm focus-visible:ring-4 focus-visible:ring-sky-500"
                    value={filtros.zona_id}
                    onChange={(e) => updateFilter('zona_id', e.target.value)}
                    aria-label="Filtrar por zona"
                  >
                    <option value="">Todas ({zonas.length})</option>
                    {zonas.map((z) => (
                      <option key={z.id} value={z.id}>
                        {z.nombre}
                      </option>
                    ))}
                  </select>
                  {filtros.zona_id && (
                    <button
                      onClick={() => updateFilter('zona_id', '')}
                      className="absolute right-8 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      title="Limpiar filtro"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Estado */}
          <div className="bg-white rounded-lg p-4 border border-slate-200">
            <div className="flex items-center gap-2 mb-3">
              <Filter className="w-4 h-4 text-slate-500" />
              <span className="text-sm font-medium text-slate-700">Estado de la Venta</span>
            </div>
            <div className="relative">
              <select
                id="filtro-estado"
                className="border border-slate-200 rounded-xl px-3 py-2 w-full md:w-auto focus:outline-none focus:ring-2 focus:ring-sky-400 bg-white transition-all focus-visible:ring-4 focus-visible:ring-sky-500"
                value={filtros.estado || ""}
                onChange={(e) => updateFilter('estado', e.target.value)}
                aria-label="Filtrar por estado"
              >
                <option value="">Todos los estados ({ESTADOS_VALIDOS.length})</option>
                {ESTADOS_VALIDOS.map((s) => (
                  <option key={s} value={s}>
                    {s.replace(/_/g, ' ')}
                  </option>
                ))}
              </select>
              {filtros.estado && (
                <button
                  onClick={() => updateFilter('estado', '')}
                  className="absolute right-8 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  title="Limpiar filtro"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}

          {/* Filtros de fecha y monto */}
          {isExpanded && (
            <div className="space-y-4">
              {/* Filtros de fecha */}
              <div className="bg-white rounded-lg p-4 border border-slate-200">
                <div className="flex items-center gap-2 mb-3">
                  <Calendar className="w-4 h-4 text-slate-500" />
                  <span className="text-sm font-medium text-slate-700">Filtros de Fecha</span>
                </div>
                <div className="grid md:grid-cols-3 gap-4">
                  {/* Fecha desde */}
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-600">
                      Fecha desde
                    </label>
                    <div className="relative">
                      <Calendar className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                      <input
                        id="filtro-fecha-desde"
                        type="date"
                        className="border border-slate-200 rounded-xl pl-10 pr-8 py-2 w-full focus:outline-none focus:ring-2 focus:ring-sky-400 bg-white text-sm focus-visible:ring-4 focus-visible:ring-sky-500"
                        value={filtros.desde}
                        onChange={(e) => updateFilter('desde', e.target.value)}
                        title="Seleccionar fecha de inicio"
                        aria-label="Fecha desde"
                      />
                      {filtros.desde && (
                        <button
                          onClick={() => updateFilter('desde', '')}
                          className="absolute right-2 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                          title="Limpiar fecha desde"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Fecha hasta */}
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-600">
                      Fecha hasta
                    </label>
                    <div className="relative">
                      <Calendar className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                      <input
                        id="filtro-fecha-hasta"
                        type="date"
                        className="border border-slate-200 rounded-xl pl-10 pr-8 py-2 w-full focus:outline-none focus:ring-2 focus:ring-sky-400 bg-white text-sm focus-visible:ring-4 focus-visible:ring-sky-500"
                        value={filtros.hasta}
                        onChange={(e) => updateFilter('hasta', e.target.value)}
                        min={filtros.desde || undefined}
                        title="Seleccionar fecha de fin"
                        aria-label="Fecha hasta"
                      />
                      {filtros.hasta && (
                        <button
                          onClick={() => updateFilter('hasta', '')}
                          className="absolute right-2 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                          title="Limpiar fecha hasta"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Mes/Año */}
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-600">
                      Mes específico
                    </label>
                    <div className="relative">
                      <Calendar className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                      <input
                        id="filtro-mes-ano"
                        type="month"
                        className="border border-slate-200 rounded-xl pl-10 pr-8 py-2 w-full focus:outline-none focus:ring-2 focus:ring-sky-400 bg-white text-sm focus-visible:ring-4 focus-visible:ring-sky-500"
                        value={filtros.mesAno}
                        onChange={(e) => updateFilter('mesAno', e.target.value)}
                        title="Seleccionar mes y año"
                        aria-label="Mes y año"
                      />
                      {filtros.mesAno && (
                        <button
                          onClick={() => updateFilter('mesAno', '')}
                          className="absolute right-2 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                          title="Limpiar mes/año"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Información sobre filtros de fecha */}
                {(filtros.desde || filtros.hasta || filtros.mesAno) && (
                  <div className="mt-2 p-2 bg-blue-50 rounded text-xs text-blue-700">
                    💡 <strong>Filtros de fecha activos:</strong>
                    {filtros.mesAno && ` Mes específico: ${new Date(filtros.mesAno + '-01').toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}`}
                    {filtros.desde && ` Desde: ${new Date(filtros.desde).toLocaleDateString('es-ES')}`}
                    {filtros.hasta && ` Hasta: ${new Date(filtros.hasta).toLocaleDateString('es-ES')}`}
                  </div>
                )}
              </div>

              {/* Filtros de monto */}
              <div className="bg-white rounded-lg p-4 border border-slate-200">
                <div className="flex items-center gap-2 mb-3">
                  <Euro className="w-4 h-4 text-slate-500" />
                  <span className="text-sm font-medium text-slate-700">Filtros de Monto (PVP)</span>
                </div>
                <div className="grid md:grid-cols-3 gap-4">
                  {/* Monto mínimo */}
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-600">
                      Monto mínimo (€)
                    </label>
                    <div className="relative">
                      <Euro className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                      <input
                        id="filtro-monto-min"
                        type="number"
                        step="0.01"
                        min="0"
                        className="border border-slate-200 rounded-xl pl-10 pr-8 py-2 w-full focus:outline-none focus:ring-2 focus:ring-sky-400 bg-white text-sm focus-visible:ring-4 focus-visible:ring-sky-500"
                        placeholder="Ej: 100.00"
                        value={filtros.montoMin}
                        onChange={(e) => updateFilter('montoMin', e.target.value)}
                        title="Filtrar por monto mínimo"
                        aria-label="Monto mínimo"
                      />
                      {filtros.montoMin && (
                        <button
                          onClick={() => updateFilter('montoMin', '')}
                          className="absolute right-2 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                          title="Limpiar monto mínimo"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Monto máximo */}
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-600">
                      Monto máximo (€)
                    </label>
                    <div className="relative">
                      <Euro className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                      <input
                        id="filtro-monto-max"
                        type="number"
                        step="0.01"
                        min={filtros.montoMin || "0"}
                        className="border border-slate-200 rounded-xl pl-10 pr-8 py-2 w-full focus:outline-none focus:ring-2 focus:ring-sky-400 bg-white text-sm focus-visible:ring-4 focus-visible:ring-sky-500"
                        placeholder="Ej: 1000.00"
                        value={filtros.montoMax}
                        onChange={(e) => updateFilter('montoMax', e.target.value)}
                        title="Filtrar por monto máximo"
                        aria-label="Monto máximo"
                      />
                      {filtros.montoMax && (
                        <button
                          onClick={() => updateFilter('montoMax', '')}
                          className="absolute right-2 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                          title="Limpiar monto máximo"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Checkbox sin PVP */}
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-600">
                      Filtros especiales
                    </label>
                    <label className="flex items-center gap-2 px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 hover:bg-slate-100 cursor-pointer transition-colors">
                      <input
                        id="filtro-sin-pvp"
                        type="checkbox"
                        checked={filtros.sinPvp}
                        onChange={(e) => updateFilter('sinPvp', e.target.checked)}
                        className="rounded border-slate-300 text-sky-600 focus:ring-sky-500 focus-visible:ring-4 focus-visible:ring-sky-500"
                        title="Mostrar solo ventas sin PVP definido"
                        aria-label="Solo sin PVP"
                      />
                      <span className="text-sm text-slate-700">Solo sin PVP</span>
                    </label>
                  </div>
                </div>

                {/* Información sobre filtros de monto */}
                {(filtros.montoMin || filtros.montoMax || filtros.sinPvp) && (
                  <div className="mt-2 p-2 bg-green-50 rounded text-xs text-green-700">
                    💰 <strong>Filtros de monto activos:</strong>
                    {filtros.montoMin && ` Min: €${parseFloat(filtros.montoMin).toFixed(2)}`}
                    {filtros.montoMax && ` Max: €${parseFloat(filtros.montoMax).toFixed(2)}`}
                    {filtros.sinPvp && ` Solo ventas sin PVP`}
                  </div>
                )}
              </div>
            </div>
          )}
    </Card>
  );
}
