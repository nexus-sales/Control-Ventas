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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 dark:bg-black/70 backdrop-blur-sm">
      <div className="bg-white dark:bg-darkCard rounded-2xl shadow-2xl border border-slate-200 dark:border-darkAccent/30 p-8 w-full max-w-lg transition-colors">
        <h2 className="text-xl font-bold text-slate-800 dark:text-darkText mb-4">Registrar nueva venta</h2>
        <form onSubmit={handleSubmit} className="space-y-6" aria-label="Formulario para nueva venta">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="font-semibold text-slate-800 pb-2 border-b border-slate-200">
                Información del Cliente
              </h4>

              <div className="space-y-3">
                <div>
                  <label className="text-sm text-slate-500" htmlFor="newventa-cliente">Cliente *</label>
                  <input
                    id="newventa-cliente"
                    className="border rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-sky-400"
                    value={draft.cliente || ''}
                    onChange={(e) => setDraft({ ...draft, cliente: e.target.value })}
                    required
                    aria-label="Nombre del cliente"
                  />
                </div>
                <div>
                  <label className="text-sm text-slate-500" htmlFor="newventa-cif">CIF/DNI</label>
                  <input
                    id="newventa-cif"
                    className="border rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-sky-400"
                    value={draft.cif || ''}
                    onChange={(e) => setDraft({ ...draft, cif: e.target.value })}
                    aria-label="CIF o DNI"
                  />
                </div>
                <div>
                  <label className="text-sm text-slate-500" htmlFor="newventa-idpedido">ID Pedido</label>
                  <input
                    id="newventa-idpedido"
                    className="border rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-sky-400"
                    placeholder="ID del pedido en el operador"
                    value={draft.id_pedido || ''}
                    onChange={(e) => setDraft({ ...draft, id_pedido: e.target.value })}
                    aria-label="ID del pedido"
                  />
                </div>
                <div>
                  <label className="text-sm text-slate-500" htmlFor="newventa-idcliente">ID Cliente</label>
                  <input
                    id="newventa-idcliente"
                    className="border rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-sky-400"
                    placeholder="ID del cliente en el operador"
                    value={draft.id_cliente || ''}
                    onChange={(e) => setDraft({ ...draft, id_cliente: e.target.value })}
                    aria-label="ID del cliente"
                  />
                </div>
                <div>
                  <label className="text-sm text-slate-500" htmlFor="newventa-fecha">Fecha *</label>
                  <input
                    id="newventa-fecha"
                    type="date"
                    className="border rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-sky-400"
                    value={draft.fecha || ''}
                    onChange={(e) => setDraft({ ...draft, fecha: e.target.value })}
                    required
                    aria-label="Fecha de la venta"
                  />
                </div>
                <div>
                  <label className="text-sm text-slate-500" htmlFor="newventa-telfijo">Teléfono Fijo</label>
                  <input
                    id="newventa-telfijo"
                    className="border rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-sky-400"
                    value={draft.telefono_fijo || ''}
                    onChange={(e) => setDraft({ ...draft, telefono_fijo: e.target.value })}
                    aria-label="Teléfono fijo"
                  />
                </div>
                <div>
                  <label className="text-sm text-slate-500" htmlFor="newventa-telmovil">Teléfono Móvil</label>
                  <input
                    id="newventa-telmovil"
                    className="border rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-sky-400"
                    value={draft.telefono_movil || ''}
                    onChange={(e) => setDraft({ ...draft, telefono_movil: e.target.value })}
                    aria-label="Teléfono móvil"
                  />
                </div>
              </div>

              {/* Campos personalizados */}
              {customFields.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-semibold text-slate-800 pt-2 pb-1 border-b border-slate-200">Campos Personalizados</h4>
                  {customFields.map((field) => (
                    <div key={field.id}>
                      <label className="text-sm text-slate-500" htmlFor={`customfield-${field.id}`}>{field.nombre}{field.requerido && ' *'}</label>
                      {field.tipo === 'texto' && (
                        <input
                          id={`customfield-${field.id}`}
                          className="border rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-yellow-400"
                          value={draft[`cf_${field.id}`] || ''}
                          onChange={e => setDraft({ ...draft, [`cf_${field.id}`]: e.target.value })}
                          required={field.requerido}
                        />
                      )}
                      {field.tipo === 'número' && (
                        <input
                          id={`customfield-${field.id}`}
                          type="number"
                          className="border rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-yellow-400"
                          value={draft[`cf_${field.id}`] || ''}
                          onChange={e => setDraft({ ...draft, [`cf_${field.id}`]: e.target.value })}
                          required={field.requerido}
                        />
                      )}
                      {field.tipo === 'fecha' && (
                        <input
                          id={`customfield-${field.id}`}
                          type="date"
                          className="border rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-yellow-400"
                          value={draft[`cf_${field.id}`] || ''}
                          onChange={e => setDraft({ ...draft, [`cf_${field.id}`]: e.target.value })}
                          required={field.requerido}
                        />
                      )}
                      {field.tipo === 'select' && (
                        <select
                          id={`customfield-${field.id}`}
                          className="border rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-yellow-400"
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
              )}
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold text-slate-800 pb-2 border-b border-slate-200">
                Detalles del Servicio
              </h4>

              <div className="space-y-3">
                <div>
                  <label className="text-sm text-slate-500">Sector *</label>
                  <select
                    className="border rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-sky-400"
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
                    <label className="text-sm text-slate-500">Familia *</label>
                    <select
                      className="border rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-sky-400"
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
                <div>
                  <label className="text-sm text-slate-500">Producto *</label>
                  <select
                    className="border rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-sky-400"
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
                <div>
                  <label className="text-sm text-slate-500">Zona *</label>
                  <select
                    className="border rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-sky-400"
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
                  <label className="text-sm text-slate-500">Colaborador *</label>
                  <select
                    className="border rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-sky-400"
                    value={draft.colaborador_id || ''}
                    onChange={(e) => handleColaboradorChange(e.target.value)}
                    required
                  >
                    <option value="">Seleccionar colaborador</option>
                    {colaboradores.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nombre} - Nivel {c.nivelId} ({((c.pct_colaborador_default || 0) * 100).toFixed(1)}%)
                      </option>
                    ))}
                  </select>
                  {colaboradorSeleccionado && (
                    <p className="text-xs text-blue-600 mt-1 flex items-center gap-1">
                      <Percent className="w-3 h-3" />
                      Comisión del colaborador: {((colaboradorSeleccionado.pct_colaborador_default || 0) * 100).toFixed(1)}%
                    </p>
                  )}
                </div>
                <div>
                  <label className="text-sm text-slate-500">PVP del Producto</label>
                  <input
                    type="number"
                    step="0.01"
                    className="border rounded-lg px-3 py-2 w-full bg-slate-100 focus:outline-none"
                    value={draft.pvp || 0}
                    readOnly
                  />
                  {(!draft.pvp || draft.pvp === 0) && (
                    <p className="text-xs text-amber-600 mt-1">
                      ⚠️ Este producto no tiene PVP definido
                    </p>
                  )}
                </div>
                <div>
                  <label className="text-sm text-slate-500">Comisión Base del Producto</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      step="0.01"
                      className="border rounded-lg px-3 py-2 flex-1 focus:outline-none focus:ring-2 focus:ring-sky-400"
                      value={draft.comision_base || 0}
                      onChange={(e) => setDraft({...draft, comision_base: parseFloat(e.target.value) || 0})}
                    />
                    <select
                      className="border rounded-lg px-3 py-2 w-32 focus:outline-none focus:ring-2 focus:ring-sky-400"
                      value={draft.comision_tipo || 'porcentaje'}
                      onChange={(e) => setDraft({...draft, comision_tipo: e.target.value})}
                    >
                      <option value="porcentaje">%</option>
                      <option value="fijo">€</option>
                    </select>
                  </div>
                  {productoSeleccionado && (
                    <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                      <Euro className="w-3 h-3" />
                      {draft.comision_tipo === 'porcentaje' 
                        ? `${((draft.comision_base || 0) * 100).toFixed(1)}% del PVP`
                        : `${(draft.comision_base || 0).toFixed(2)}€ fijos`
                      }
                    </p>
                  )}
                </div>
                <div>
                  <label className="text-sm text-slate-500">Comisión Colaborador (Editable)</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="1"
                      className="border rounded-lg px-3 py-2 flex-1 focus:outline-none focus:ring-2 focus:ring-sky-400"
                      value={draft.comision_colaborador || 0}
                      onChange={(e) => setDraft({...draft, comision_colaborador: parseFloat(e.target.value) || 0})}
                    />
                    <span className="flex items-center px-3 py-2 bg-slate-100 rounded-lg text-slate-600">%</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Valor entre 0 y 1 (ej: 0.08 = 8%)
                  </p>
                </div>
                <div>
                  <label className="text-sm text-slate-500">Documento</label>
                  <input
                    className="border rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-sky-400"
                    value={draft.documento || ''}
                    onChange={(e) =>
                      setDraft({ ...draft, documento: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="text-sm text-slate-500">Numeración</label>
                  <input
                    className="border rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-sky-400"
                    value={draft.numeracion || ''}
                    onChange={(e) =>
                      setDraft({ ...draft, numeracion: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="text-sm text-slate-500">Observaciones</label>
                  <textarea
                    className="border rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-sky-400"
                    rows="3"
                    value={draft.observaciones || ''}
                    onChange={(e) =>
                      setDraft({ ...draft, observaciones: e.target.value })
                    }
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-slate-300 rounded-xl text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl hover:from-emerald-600 hover:to-emerald-700 transition-all"
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
