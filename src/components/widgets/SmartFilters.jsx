// src/components/widgets/SmartFilters.jsx
// Filtros inteligentes y presets para uso frecuente
import React, { useState } from 'react';
import * as Tooltip from '@radix-ui/react-tooltip';
import { Filter, Star, Clock, TrendingUp, Users, Calendar, X, Save } from 'lucide-react';

/* eslint-disable no-unused-vars */

function FilterPreset({ name, description, icon: Icon, isActive, onClick, onDelete, canDelete = false }) {
  const tooltip = `${name}\n${description}`;
  return (
    <Tooltip.Root delayDuration={200}>
      <Tooltip.Trigger asChild>
        <div 
          className={`relative group border rounded-lg p-3 cursor-pointer transition-all ${
            isActive 
              ? 'border-sky-500 bg-sky-50 text-sky-800' 
              : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700'
          }`}
          onClick={onClick}
        >
          <div className="flex items-center gap-2">
            <Icon className="w-4 h-4" />
            <div className="flex-1">
              <div className="font-medium text-sm">{name}</div>
              <div className="text-xs opacity-75">{description}</div>
            </div>
            {canDelete && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
                className="opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:text-red-700"
                title="Eliminar preset"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      </Tooltip.Trigger>
      <Tooltip.Portal>
        <Tooltip.Content side="top" align="center" className="z-50 px-3 py-2 rounded-lg bg-slate-900 text-white text-xs shadow-lg animate-fadeIn whitespace-pre-line" style={{ pointerEvents: 'auto' }}>
          {tooltip}
          <Tooltip.Arrow className="fill-slate-900" />
        </Tooltip.Content>
      </Tooltip.Portal>
    </Tooltip.Root>
  );
}

export default function SmartFilters({ currentFilters, onApplyFilters, colaboradores }) {
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [newPresetName, setNewPresetName] = useState('');
  const [savedPresets, setSavedPresets] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('ventasFilterPresets')) || [];
    } catch {
      return [];
    }
  });

  // Presets predefinidos inteligentes
  const defaultPresets = [
    {
      id: 'hoy',
      name: 'Ventas de Hoy',
      description: 'Solo las ventas de hoy',
      icon: Calendar,
      filters: {
        desde: new Date().toISOString().slice(0, 10),
        hasta: new Date().toISOString().slice(0, 10)
      }
    },
    {
      id: 'semana',
      name: 'Última Semana',
      description: 'Últimos 7 días',
      icon: Clock,
      filters: (() => {
        const hasta = new Date();
        const desde = new Date();
        desde.setDate(desde.getDate() - 7);
        return {
          desde: desde.toISOString().slice(0, 10),
          hasta: hasta.toISOString().slice(0, 10)
        };
      })()
    },
    {
      id: 'mes',
      name: 'Este Mes',
      description: 'Mes actual completo',
      icon: Calendar,
      filters: {
        mesAno: new Date().toISOString().slice(0, 7)
      }
    },
    {
      id: 'sinPvp',
      name: 'Sin Precio',
      description: 'Ventas que necesitan PVP',
      icon: TrendingUp,
      filters: {
        sinPvp: true
      }
    },
    {
      id: 'cerradas',
      name: 'Cerradas',
      description: 'Listas para liquidar',
      icon: Users,
      filters: {
        estado: 'Cerrada'
      }
    },
    {
      id: 'pendientes',
      name: 'Pendientes',
      description: 'Necesitan seguimiento',
      icon: Clock,
      filters: {
        estado: 'PENDIENTE'
      }
    }
  ];

  // Top colaboradores (los que más ventas tienen)
  const topColaboradores = colaboradores
    .map(c => ({
      ...c,
      ventasCount: (currentFilters.ventasData || []).filter(v => v.colaborador_id === c.id).length
    }))
    .sort((a, b) => b.ventasCount - a.ventasCount)
    .slice(0, 3);

  const dynamicPresets = topColaboradores.map((colab) => ({
    id: `colab_${colab.id}`,
    name: colab.nombre.split(' ')[0], // Solo el primer nombre
    description: `${colab.ventasCount} ventas`,
    icon: Users,
    filters: {
      colaborador_id: colab.id
    }
  }));

  // const allPresets = [...defaultPresets, ...dynamicPresets, ...savedPresets];

  const saveCurrentFilters = () => {
    if (!newPresetName.trim()) return;
    
    const newPreset = {
      id: `custom_${Date.now()}`,
      name: newPresetName,
      description: `Filtro personalizado`,
      icon: Star,
      filters: { ...currentFilters },
      isCustom: true
    };

    const updated = [...savedPresets, newPreset];
    setSavedPresets(updated);
    localStorage.setItem('ventasFilterPresets', JSON.stringify(updated));
    
    setNewPresetName('');
    setShowSaveModal(false);
  };

  const deletePreset = (presetId) => {
    const updated = savedPresets.filter(p => p.id !== presetId);
    setSavedPresets(updated);
    localStorage.setItem('ventasFilterPresets', JSON.stringify(updated));
  };

  const isPresetActive = (preset) => {
    return Object.keys(preset.filters).every(key => 
      currentFilters[key] === preset.filters[key]
    );
  };

  const hasActiveFilters = Object.entries(currentFilters).some(([key, value]) => {
    if (key === 'sinPvp') return value === true;
    return value && value !== '';
  });

  return (
    <div className="bg-white rounded-2xl p-6 border-2 border-slate-200 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-slate-600" />
          <h3 className="text-lg font-semibold text-slate-800">Filtros Rápidos</h3>
        </div>
        
        <div className="flex items-center gap-2">
          {hasActiveFilters && (
            <button
              onClick={() => setShowSaveModal(true)}
              className="flex items-center gap-1 px-3 py-1 text-sm bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
              title="Guardar filtros actuales"
            >
              <Save className="w-3 h-3" />
              Guardar
            </button>
          )}
          
          {hasActiveFilters && (
            <button
              onClick={() => onApplyFilters({})}
              className="flex items-center gap-1 px-3 py-1 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
              title="Limpiar todos los filtros"
            >
              <X className="w-3 h-3" />
              Limpiar
            </button>
          )}
        </div>
      </div>

      {/* Presets organizados por categorías */}
      <div className="space-y-4">
        {/* Filtros temporales */}
        <div>
          <h4 className="text-sm font-medium text-slate-600 mb-2 flex items-center gap-1">
            <Calendar className="w-4 h-4" />
            Por Fecha
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {defaultPresets.slice(0, 3).map(preset => (
              <FilterPreset
                key={preset.id}
                {...preset}
                isActive={isPresetActive(preset)}
                onClick={() => onApplyFilters(preset.filters)}
              />
            ))}
          </div>
        </div>

        {/* Filtros por estado */}
        <div>
          <h4 className="text-sm font-medium text-slate-600 mb-2 flex items-center gap-1">
            <Filter className="w-4 h-4" />
            Por Estado
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {defaultPresets.slice(3).map(preset => (
              <FilterPreset
                key={preset.id}
                {...preset}
                isActive={isPresetActive(preset)}
                onClick={() => onApplyFilters(preset.filters)}
              />
            ))}
          </div>
        </div>

        {/* Top colaboradores */}
        {topColaboradores.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-slate-600 mb-2 flex items-center gap-1">
              <Users className="w-4 h-4" />
              Top Colaboradores
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {dynamicPresets.map(preset => (
                <FilterPreset
                  key={preset.id}
                  {...preset}
                  isActive={isPresetActive(preset)}
                  onClick={() => onApplyFilters(preset.filters)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Filtros guardados */}
        {savedPresets.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-slate-600 mb-2 flex items-center gap-1">
              <Star className="w-4 h-4" />
              Mis Filtros
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {savedPresets.map(preset => (
                <FilterPreset
                  key={preset.id}
                  {...preset}
                  isActive={isPresetActive(preset)}
                  onClick={() => onApplyFilters(preset.filters)}
                  canDelete={true}
                  onDelete={() => deletePreset(preset.id)}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Modal para guardar filtro */}
      {showSaveModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-lg max-w-md w-full p-6">
            <h3 className="text-lg font-bold mb-4">Guardar Filtro</h3>
            <input
              type="text"
              placeholder="Nombre del filtro..."
              className="w-full border border-slate-300 rounded-lg px-3 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-sky-400"
              value={newPresetName}
              onChange={(e) => setNewPresetName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && saveCurrentFilters()}
              autoFocus
            />
            <div className="flex gap-2">
              <button
                onClick={saveCurrentFilters}
                disabled={!newPresetName.trim()}
                className="flex-1 bg-sky-500 text-white rounded-lg py-2 hover:bg-sky-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Guardar
              </button>
              <button
                onClick={() => setShowSaveModal(false)}
                className="flex-1 bg-slate-200 text-slate-700 rounded-lg py-2 hover:bg-slate-300"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
