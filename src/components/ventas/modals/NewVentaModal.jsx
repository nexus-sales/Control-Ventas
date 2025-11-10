import React, { useState, useEffect } from 'react';
import { Plus, X, Save, Euro, Percent } from 'lucide-react';
import Card from '../../ui/Card';
import { SECTORES, FAMILIAS_POR_SECTOR } from '../../../utils/constants';
import { useCustomFields } from '../../../hooks/useCustomFields';

export function NewVentaModal({ 
  isOpen, 
  onClose, 
  onSave,
  createInitialDraft,
  productos = [],
  colaboradores = [],
  zonas = []
}) {
  const [draft, setDraft] = useState({});

  // Inicializar draft cuando se abre el modal
  useEffect(() => {
    if (isOpen && createInitialDraft) {
      setDraft(createInitialDraft());
    }
  }, [isOpen, createInitialDraft]);

  // Obtener campos personalizados para ventas
  const customFields = useCustomFields('ventas');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(draft);
    onClose();
  };

  const handleProductChange = (productoId) => {
    const prod = productos.find(p => p.id === productoId);
    setDraft(prev => ({
      ...prev,
      producto_id: productoId,
      pvp: prod?.pvp || 0,
      comision_base: prod?.comision_valor || 0,
      comision_tipo: prod?.comision_tipo || 'porcentaje'
    }));
  };

  const handleColaboradorChange = (colaboradorId) => {
    const colaborador = colaboradores.find(c => c.id === colaboradorId);
    setDraft(prev => ({
      ...prev,
      colaborador_id: colaboradorId,
      comision_colaborador: colaborador?.pct_colaborador_default || 0
    }));
  };

  // Calcular información del producto seleccionado
  const productoSeleccionado = productos.find(p => p.id === draft.producto_id);
  const colaboradorSeleccionado = colaboradores.find(c => c.id === draft.colaborador_id);
  
  // Obtener familias disponibles según el sector
  const familiasDisponibles = draft.sector ? FAMILIAS_POR_SECTOR[draft.sector] || [] : [];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 dark:bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-darkCard rounded-2xl shadow-2xl border border-slate-200 dark:border-darkAccent/30 p-6 w-full max-w-7xl max-h-[90vh] overflow-y-auto transition-colors">
        <h2 className="text-xl font-bold text-slate-800 dark:text-darkText mb-6">Registrar nueva venta</h2>
        <form onSubmit={handleSubmit} className="space-y-6" aria-label="Formulario para nueva venta">
          {/* Layout horizontal principal */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Columna 1: Información del Cliente */}
            <div className="space-y-4">
              <h4 className="font-semibold text-slate-800 dark:text-darkText pb-2 border-b border-slate-200 dark:border-darkAccent/30">
                📋 Información del Cliente
              </h4>

              <div className="space-y-3">
                <div>
                  <label className="text-sm text-slate-500 dark:text-slate-400" htmlFor="newventa-cliente">Cliente *</label>
                  <input
                    id="newventa-cliente"
                    className="border rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-sky-400 dark:bg-darkInput dark:border-darkAccent dark:text-darkText"
                    value={draft.cliente || ''}
                    onChange={(e) => setDraft({ ...draft, cliente: e.target.value })}
                    required
                    aria-label="Nombre del cliente"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm text-slate-500 dark:text-slate-400" htmlFor="newventa-cif">CIF/DNI</label>
                    <input
                      id="newventa-cif"
                      className="border rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-sky-400 dark:bg-darkInput dark:border-darkAccent dark:text-darkText"
                      value={draft.cif || ''}
                      onChange={(e) => setDraft({ ...draft, cif: e.target.value })}
                      aria-label="CIF o DNI"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-slate-500 dark:text-slate-400" htmlFor="newventa-fecha">Fecha *</label>
                    <input
                      id="newventa-fecha"
                      type="date"
                      className="border rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-sky-400 dark:bg-darkInput dark:border-darkAccent dark:text-darkText"
                      value={draft.fecha || ''}
                      onChange={(e) => setDraft({ ...draft, fecha: e.target.value })}
                      required
                      aria-label="Fecha de la venta"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm text-slate-500 dark:text-slate-400" htmlFor="newventa-idpedido">ID Pedido</label>
                    <input
                      id="newventa-idpedido"
                      className="border rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-sky-400 dark:bg-darkInput dark:border-darkAccent dark:text-darkText"
                      placeholder="ID del pedido"
                      value={draft.id_pedido || ''}
                      onChange={(e) => setDraft({ ...draft, id_pedido: e.target.value })}
                      aria-label="ID del pedido"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-slate-500 dark:text-slate-400" htmlFor="newventa-idcliente">ID Cliente</label>
                    <input
                      id="newventa-idcliente"
                      className="border rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-sky-400 dark:bg-darkInput dark:border-darkAccent dark:text-darkText"
                      placeholder="ID del cliente"
                      value={draft.id_cliente || ''}
                      onChange={(e) => setDraft({ ...draft, id_cliente: e.target.value })}
                      aria-label="ID del cliente"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm text-slate-500 dark:text-slate-400" htmlFor="newventa-telfijo">Teléfono Fijo</label>
                    <input
                      id="newventa-telfijo"
                      className="border rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-sky-400 dark:bg-darkInput dark:border-darkAccent dark:text-darkText"
                      value={draft.telefono_fijo || ''}
                      onChange={(e) => setDraft({ ...draft, telefono_fijo: e.target.value })}
                      aria-label="Teléfono fijo"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-slate-500 dark:text-slate-400" htmlFor="newventa-telmovil">Teléfono Móvil</label>
                    <input
                      id="newventa-telmovil"
                      className="border rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-sky-400 dark:bg-darkInput dark:border-darkAccent dark:text-darkText"
                      value={draft.telefono_movil || ''}
                      onChange={(e) => setDraft({ ...draft, telefono_movil: e.target.value })}
                      aria-label="Teléfono móvil"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Columna 2: Detalles del Servicio */}
            <div className="space-y-4">
              <h4 className="font-semibold text-slate-800 dark:text-darkText pb-2 border-b border-slate-200 dark:border-darkAccent/30">
                🛍️ Detalles del Servicio
              </h4>

              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm text-slate-500 dark:text-slate-400">Sector *</label>
                    <select
                      className="border rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-sky-400 dark:bg-darkInput dark:border-darkAccent dark:text-darkText"
                      value={draft.sector || ''}
                      onChange={(e) => setDraft({...draft, sector: e.target.value, familia: ''})}
                      required
                    >
                      <option value="">Seleccionar sector</option>
                      {Object.entries(SECTORES).map(([key, label]) => (
                        <option key={key} value={key}>{label}</option>
                      ))}
                    </select>
                  </div>
                  {draft.sector && (
                    <div>
                      <label className="text-sm text-slate-500 dark:text-slate-400">Familia *</label>
                      <select
                        className="border rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-sky-400 dark:bg-darkInput dark:border-darkAccent dark:text-darkText"
                        value={draft.familia || ''}
                        onChange={(e) => setDraft({...draft, familia: e.target.value})}
                        required
                      >
                        <option value="">Seleccionar familia</option>
                        {familiasDisponibles.map((familia) => (
                          <option key={familia} value={familia}>{familia}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                <div>
                  <label className="text-sm text-slate-500 dark:text-slate-400">Producto *</label>
                  <select
                    className="border rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-sky-400 dark:bg-darkInput dark:border-darkAccent dark:text-darkText"
                    value={draft.producto_id || ''}
                    onChange={(e) => handleProductChange(e.target.value)}
                    required
                  >
                    <option value="">Seleccionar producto</option>
                    {productos.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.nombre} {(!p.pvp || p.pvp === 0) && "(Sin PVP)"}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm text-slate-500 dark:text-slate-400">Zona *</label>
                    <select
                      className="border rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-sky-400 dark:bg-darkInput dark:border-darkAccent dark:text-darkText"
                      value={draft.zona_id || ''}
                      onChange={(e) =>
                        setDraft({ ...draft, zona_id: e.target.value })
                      }
                      required
                    >
                      <option value="">Seleccionar zona</option>
                      {zonas.map((z) => (
                        <option key={z.id} value={z.id}>
                          {z.nombre}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm text-slate-500 dark:text-slate-400">Estado</label>
                    <select
                      className="border rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-sky-400 dark:bg-darkInput dark:border-darkAccent dark:text-darkText"
                      value={draft.estado || 'Confirmada'}
                      onChange={(e) => setDraft({ ...draft, estado: e.target.value })}
                    >
                      <option value="Confirmada">Confirmada</option>
                      <option value="Pendiente">Pendiente</option>
                      <option value="Cancelada">Cancelada</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-sm text-slate-500 dark:text-slate-400">Colaborador *</label>
                  <select
                    className="border rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-sky-400 dark:bg-darkInput dark:border-darkAccent dark:text-darkText"
                    value={draft.colaborador_id || ''}
                    onChange={(e) => handleColaboradorChange(e.target.value)}
                    required
                  >
                    <option value="">Seleccionar colaborador</option>
                    {colaboradores.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nombre} - {c.nivelId} ({((c.pct_colaborador_default || 0) * 100).toFixed(1)}%)
                      </option>
                    ))}
                  </select>
                  {colaboradorSeleccionado && (
                    <p className="text-xs text-blue-600 dark:text-blue-400 mt-1 flex items-center gap-1">
                      <Percent className="w-3 h-3" />
                      Comisión: {((colaboradorSeleccionado.pct_colaborador_default || 0) * 100).toFixed(1)}%
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Columna 3: Precios y Comisiones */}
            <div className="space-y-4">
              <h4 className="font-semibold text-slate-800 dark:text-darkText pb-2 border-b border-slate-200 dark:border-darkAccent/30">
                💰 Precios y Comisiones
              </h4>

              <div className="space-y-3">
                <div>
                  <label className="text-sm text-slate-500 dark:text-slate-400">PVP del Producto</label>
                  <input
                    type="number"
                    step="0.01"
                    className="border rounded-lg px-3 py-2 w-full bg-slate-100 dark:bg-slate-700 focus:outline-none dark:border-darkAccent dark:text-darkText"
                    value={draft.pvp || 0}
                    readOnly
                  />
                  {(!draft.pvp || draft.pvp === 0) && (
                    <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                      ⚠️ Este producto no tiene PVP definido
                    </p>
                  )}
                </div>

                <div>
                  <label className="text-sm text-slate-500 dark:text-slate-400">Comisión Base del Producto</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      step="0.01"
                      className="border rounded-lg px-3 py-2 flex-1 focus:outline-none focus:ring-2 focus:ring-sky-400 dark:bg-darkInput dark:border-darkAccent dark:text-darkText"
                      value={draft.comision_base || 0}
                      onChange={(e) => setDraft({...draft, comision_base: parseFloat(e.target.value) || 0})}
                    />
                    <select
                      className="border rounded-lg px-3 py-2 w-20 focus:outline-none focus:ring-2 focus:ring-sky-400 dark:bg-darkInput dark:border-darkAccent dark:text-darkText"
                      value={draft.comision_tipo || 'porcentaje'}
                      onChange={(e) => setDraft({...draft, comision_tipo: e.target.value})}
                    >
                      <option value="porcentaje">%</option>
                      <option value="fijo">€</option>
                    </select>
                  </div>
                  {productoSeleccionado && (
                    <p className="text-xs text-green-600 dark:text-green-400 mt-1 flex items-center gap-1">
                      <Euro className="w-3 h-3" />
                      {draft.comision_tipo === 'porcentaje' 
                        ? `${((draft.comision_base || 0) * 100).toFixed(1)}% del PVP`
                        : `${(draft.comision_base || 0).toFixed(2)}€ fijos`
                      }
                    </p>
                  )}
                </div>

                <div>
                  <label className="text-sm text-slate-500 dark:text-slate-400">Comisión Colaborador</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="1"
                      className="border rounded-lg px-3 py-2 flex-1 focus:outline-none focus:ring-2 focus:ring-sky-400 dark:bg-darkInput dark:border-darkAccent dark:text-darkText"
                      value={draft.comision_colaborador || 0}
                      onChange={(e) => setDraft({...draft, comision_colaborador: parseFloat(e.target.value) || 0})}
                    />
                    <span className="flex items-center px-3 py-2 bg-slate-100 dark:bg-slate-700 rounded-lg text-slate-600 dark:text-slate-300">%</span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Valor entre 0 y 1 (ej: 0.08 = 8%)
                  </p>
                </div>

                <div>
                  <label className="text-sm text-slate-500 dark:text-slate-400">Documento</label>
                  <input
                    className="border rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-sky-400 dark:bg-darkInput dark:border-darkAccent dark:text-darkText"
                    value={draft.documento || ''}
                    onChange={(e) =>
                      setDraft({ ...draft, documento: e.target.value })
                    }
                  />
                </div>

                <div>
                  <label className="text-sm text-slate-500 dark:text-slate-400">Numeración</label>
                  <input
                    className="border rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-sky-400 dark:bg-darkInput dark:border-darkAccent dark:text-darkText"
                    value={draft.numeracion || ''}
                    onChange={(e) =>
                      setDraft({ ...draft, numeracion: e.target.value })
                    }
                  />
                </div>

                <div>
                  <label className="text-sm text-slate-500 dark:text-slate-400">Observaciones</label>
                  <textarea
                    className="border rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-sky-400 dark:bg-darkInput dark:border-darkAccent dark:text-darkText"
                    rows="4"
                    value={draft.observaciones || ''}
                    onChange={(e) =>
                      setDraft({ ...draft, observaciones: e.target.value })
                    }
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Campos personalizados en una sección separada si existen */}
          {customFields.length > 0 && (
            <div className="border-t border-slate-200 dark:border-darkAccent/30 pt-6">
              <h4 className="font-semibold text-slate-800 dark:text-darkText mb-4">
                🎛️ Campos Personalizados
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {customFields.map((field) => (
                  <div key={field.id}>
                    <label className="text-sm text-slate-500 dark:text-slate-400" htmlFor={`customfield-${field.id}`}>
                      {field.nombre}{field.requerido && ' *'}
                    </label>
                    {field.tipo === 'texto' && (
                      <input
                        id={`customfield-${field.id}`}
                        className="border rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-yellow-400 dark:bg-darkInput dark:border-darkAccent dark:text-darkText"
                        value={draft[`cf_${field.id}`] || ''}
                        onChange={e => setDraft({ ...draft, [`cf_${field.id}`]: e.target.value })}
                        required={field.requerido}
                      />
                    )}
                    {field.tipo === 'número' && (
                      <input
                        id={`customfield-${field.id}`}
                        type="number"
                        className="border rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-yellow-400 dark:bg-darkInput dark:border-darkAccent dark:text-darkText"
                        value={draft[`cf_${field.id}`] || ''}
                        onChange={e => setDraft({ ...draft, [`cf_${field.id}`]: e.target.value })}
                        required={field.requerido}
                      />
                    )}
                    {field.tipo === 'fecha' && (
                      <input
                        id={`customfield-${field.id}`}
                        type="date"
                        className="border rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-yellow-400 dark:bg-darkInput dark:border-darkAccent dark:text-darkText"
                        value={draft[`cf_${field.id}`] || ''}
                        onChange={e => setDraft({ ...draft, [`cf_${field.id}`]: e.target.value })}
                        required={field.requerido}
                      />
                    )}
                    {field.tipo === 'select' && (
                      <select
                        id={`customfield-${field.id}`}
                        className="border rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-yellow-400 dark:bg-darkInput dark:border-darkAccent dark:text-darkText"
                        value={draft[`cf_${field.id}`] || ''}
                        onChange={e => setDraft({ ...draft, [`cf_${field.id}`]: e.target.value })}
                        required={field.requerido}
                      >
                        <option value="">Seleccionar</option>
                        {field.opciones.map(opt => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Botones de acción */}
          <div className="flex justify-end gap-3 pt-6 border-t border-slate-200 dark:border-darkAccent/30">
            <button
              type="button"
              onClick={onClose}
              className="px-8 py-3 border border-slate-300 dark:border-darkAccent rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl hover:from-emerald-600 hover:to-emerald-700 transition-all shadow-lg"
            >
              <Save className="w-4 h-4" />
              Guardar Venta
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
