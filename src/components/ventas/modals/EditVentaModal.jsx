import React, { useState, useEffect } from 'react';
import { Edit3, X, Save, Euro, Percent } from 'lucide-react';
import Card from '../../ui/Card';
import { SECTORES, FAMILIAS_POR_SECTOR } from '../../../utils/constants';

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

export function EditVentaModal({ 
  isOpen, 
  onClose, 
  onSave,
  venta,
  productos = [],
  colaboradores = [],
  zonas = []
}) {
  const [edit, setEdit] = useState({});

  // Inicializar edit cuando se abre el modal
  useEffect(() => {
    if (isOpen && venta) {
      setEdit({ ...venta });
    }
  }, [isOpen, venta]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(edit.id, edit);
    onClose();
  };

  const handleProductChange = (productoId) => {
    const prod = productos.find(p => p.id === productoId);
    setEdit(prev => ({
      ...prev,
      producto_id: productoId,
      comision_base: prod?.comision_valor || prev.comision_base || 0,
      comision_tipo: prod?.comision_tipo || prev.comision_tipo || 'porcentaje'
    }));
  };

  const handleColaboradorChange = (colaboradorId) => {
    const colaborador = colaboradores.find(c => c.id === colaboradorId);
    setEdit(prev => ({
      ...prev,
      colaborador_id: colaboradorId,
      comision_colaborador: colaborador?.pct_colaborador_default || prev.comision_colaborador || 0
    }));
  };

  // Calcular información del producto y colaborador seleccionados
  const productoSeleccionado = productos.find(p => p.id === edit.producto_id);
  const colaboradorSeleccionado = colaboradores.find(c => c.id === edit.colaborador_id);
  
  // Obtener familias disponibles según el sector
  const familiasDisponibles = edit.sector ? FAMILIAS_POR_SECTOR[edit.sector] || [] : [];



  if (!isOpen || !venta) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-darkCard rounded-2xl shadow-2xl border border-slate-200 dark:border-darkAccent/30 p-6 w-full max-w-7xl max-h-[90vh] overflow-y-auto transition-colors">
        <div className="sticky top-0 bg-white dark:bg-darkCard border-b border-slate-200 dark:border-darkAccent/30 pb-4 mb-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-slate-800 dark:text-darkText flex items-center gap-2">
              <Edit3 className="w-5 h-5 text-amber-600" />
              Editar Venta
            </h3>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-slate-600 dark:text-slate-300" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6" aria-label="Formulario para editar venta">
          {/* Layout horizontal principal */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Columna 1: Información del Cliente */}
            <div className="space-y-4">
              <h4 className="font-semibold text-slate-800 dark:text-darkText pb-2 border-b border-slate-200 dark:border-darkAccent/30">
                📋 Información del Cliente
              </h4>

              <div className="space-y-3">
                <div>
                  <label className="text-sm text-slate-500 dark:text-slate-400" htmlFor="editventa-cliente">Cliente *</label>
                  <input
                    id="editventa-cliente"
                    className="border rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-amber-400 dark:bg-darkInput dark:border-darkAccent dark:text-darkText"
                    value={edit.cliente || ''}
                    onChange={(e) => setEdit({ ...edit, cliente: e.target.value })}
                    required
                    aria-label="Nombre del cliente"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm text-slate-500 dark:text-slate-400" htmlFor="editventa-cif">CIF/DNI</label>
                    <input
                      id="editventa-cif"
                      className="border rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-amber-400 dark:bg-darkInput dark:border-darkAccent dark:text-darkText"
                      value={edit.cif || ''}
                      onChange={(e) => setEdit({ ...edit, cif: e.target.value })}
                      aria-label="CIF o DNI"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-slate-500 dark:text-slate-400" htmlFor="editventa-fecha">Fecha *</label>
                    <input
                      id="editventa-fecha"
                      type="date"
                      className="border rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-amber-400 dark:bg-darkInput dark:border-darkAccent dark:text-darkText"
                      value={edit.fecha || ''}
                      onChange={(e) => setEdit({ ...edit, fecha: e.target.value })}
                      required
                      aria-label="Fecha de la venta"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm text-slate-500 dark:text-slate-400" htmlFor="editventa-idpedido">ID Pedido</label>
                    <input
                      id="editventa-idpedido"
                      className="border rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-amber-400 dark:bg-darkInput dark:border-darkAccent dark:text-darkText"
                      placeholder="ID del pedido"
                      value={edit.id_pedido || ''}
                      onChange={(e) => setEdit({ ...edit, id_pedido: e.target.value })}
                      aria-label="ID del pedido"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-slate-500 dark:text-slate-400" htmlFor="editventa-idcliente">ID Cliente</label>
                    <input
                      id="editventa-idcliente"
                      className="border rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-amber-400 dark:bg-darkInput dark:border-darkAccent dark:text-darkText"
                      placeholder="ID del cliente"
                      value={edit.id_cliente || ''}
                      onChange={(e) => setEdit({ ...edit, id_cliente: e.target.value })}
                      aria-label="ID del cliente"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm text-slate-500 dark:text-slate-400" htmlFor="editventa-estado">Estado</label>
                  <select
                    id="editventa-estado"
                    className="border rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-amber-400 dark:bg-darkInput dark:border-darkAccent dark:text-darkText"
                    value={edit.estado || ''}
                    onChange={(e) => setEdit({ ...edit, estado: e.target.value })}
                    aria-label="Estado de la venta"
                  >
                    {ESTADOS_VALIDOS.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm text-slate-500 dark:text-slate-400" htmlFor="editventa-telfijo">Teléfono Fijo</label>
                    <input
                      id="editventa-telfijo"
                      className="border rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-amber-400 dark:bg-darkInput dark:border-darkAccent dark:text-darkText"
                      value={edit.telefono_fijo || ''}
                      onChange={(e) => setEdit({ ...edit, telefono_fijo: e.target.value })}
                      aria-label="Teléfono fijo"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-slate-500 dark:text-slate-400" htmlFor="editventa-telmovil">Teléfono Móvil</label>
                    <input
                      id="editventa-telmovil"
                      className="border rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-amber-400 dark:bg-darkInput dark:border-darkAccent dark:text-darkText"
                      value={edit.telefono_movil || ''}
                      onChange={(e) => setEdit({ ...edit, telefono_movil: e.target.value })}
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
                      className="border rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-amber-400 dark:bg-darkInput dark:border-darkAccent dark:text-darkText"
                      value={edit.sector || ''}
                      onChange={(e) => setEdit({...edit, sector: e.target.value, familia: ''})}
                      required
                    >
                      <option value="">Seleccionar sector</option>
                      {Object.entries(SECTORES).map(([key, label]) => (
                        <option key={key} value={key}>{label}</option>
                      ))}
                    </select>
                  </div>
                  {edit.sector && (
                    <div>
                      <label className="text-sm text-slate-500 dark:text-slate-400">Familia *</label>
                      <select
                        className="border rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-amber-400 dark:bg-darkInput dark:border-darkAccent dark:text-darkText"
                        value={edit.familia || ''}
                        onChange={(e) => setEdit({...edit, familia: e.target.value})}
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
                    className="border rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-amber-400 dark:bg-darkInput dark:border-darkAccent dark:text-darkText"
                    value={edit.producto_id || ''}
                    onChange={(e) => handleProductChange(e.target.value)}
                    required
                  >
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
                      className="border rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-amber-400 dark:bg-darkInput dark:border-darkAccent dark:text-darkText"
                      value={edit.zona_id || ''}
                      onChange={(e) =>
                        setEdit({ ...edit, zona_id: e.target.value })
                      }
                      required
                    >
                      {zonas.map((z) => (
                        <option key={z.id} value={z.id}>
                          {z.nombre}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm text-slate-500 dark:text-slate-400">Cantidad</label>
                    <input
                      type="number"
                      min="1"
                      className="border rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-amber-400 dark:bg-darkInput dark:border-darkAccent dark:text-darkText"
                      value={edit.cantidad || 1}
                      onChange={(e) => setEdit({ ...edit, cantidad: parseInt(e.target.value) || 1 })}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm text-slate-500 dark:text-slate-400">Colaborador *</label>
                  <select
                    className="border rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-amber-400 dark:bg-darkInput dark:border-darkAccent dark:text-darkText"
                    value={edit.colaborador_id || ''}
                    onChange={(e) => handleColaboradorChange(e.target.value)}
                    required
                  >
                    {colaboradores.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nombre} - {c.nivelId} ({((c.pct_colaborador_default || 0) * 100).toFixed(1)}%)
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Columna 3: Precios, Comisiones y Documentos */}
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
                    value={(() => {
                      const prod = productos.find(p => p.id === edit.producto_id);
                      return prod?.pvp || 0;
                    })()}
                    readOnly
                  />
                  {(() => {
                    const prod = productos.find(p => p.id === edit.producto_id);
                    return (!prod?.pvp || prod.pvp === 0) && (
                      <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                        ⚠️ Este producto no tiene PVP definido
                      </p>
                    );
                  })()}
                </div>

                <div>
                  <label className="text-sm text-slate-500 dark:text-slate-400">Comisión Base del Producto</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      step="0.01"
                      className="border rounded-lg px-3 py-2 flex-1 focus:outline-none focus:ring-2 focus:ring-amber-400 dark:bg-darkInput dark:border-darkAccent dark:text-darkText"
                      value={edit.comision_base || 0}
                      onChange={(e) => setEdit({...edit, comision_base: parseFloat(e.target.value) || 0})}
                    />
                    <select
                      className="border rounded-lg px-3 py-2 w-20 focus:outline-none focus:ring-2 focus:ring-amber-400 dark:bg-darkInput dark:border-darkAccent dark:text-darkText"
                      value={edit.comision_tipo || 'porcentaje'}
                      onChange={(e) => setEdit({...edit, comision_tipo: e.target.value})}
                    >
                      <option value="porcentaje">%</option>
                      <option value="fijo">€</option>
                    </select>
                  </div>
                  {productoSeleccionado && (
                    <p className="text-xs text-green-600 dark:text-green-400 mt-1 flex items-center gap-1">
                      <Euro className="w-3 h-3" />
                      {edit.comision_tipo === 'porcentaje' 
                        ? `${((edit.comision_base || 0) * 100).toFixed(1)}% del PVP`
                        : `${(edit.comision_base || 0).toFixed(2)}€ fijos`
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
                      className="border rounded-lg px-3 py-2 flex-1 focus:outline-none focus:ring-2 focus:ring-amber-400 dark:bg-darkInput dark:border-darkAccent dark:text-darkText"
                      value={edit.comision_colaborador || 0}
                      onChange={(e) => setEdit({...edit, comision_colaborador: parseFloat(e.target.value) || 0})}
                    />
                    <span className="flex items-center px-3 py-2 bg-slate-100 dark:bg-slate-700 rounded-lg text-slate-600 dark:text-slate-300">%</span>
                  </div>
                  {colaboradorSeleccionado && (
                    <p className="text-xs text-blue-600 dark:text-blue-400 mt-1 flex items-center gap-1">
                      <Percent className="w-3 h-3" />
                      Comisión sugerida: {((colaboradorSeleccionado.pct_colaborador_default || 0) * 100).toFixed(1)}%
                    </p>
                  )}
                </div>

                <div>
                  <label className="text-sm text-slate-500 dark:text-slate-400">Documento</label>
                  <input
                    className="border rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-amber-400 dark:bg-darkInput dark:border-darkAccent dark:text-darkText"
                    value={edit.documento || ''}
                    onChange={(e) =>
                      setEdit({ ...edit, documento: e.target.value })
                    }
                  />
                </div>

                <div>
                  <label className="text-sm text-slate-500 dark:text-slate-400">Numeración</label>
                  <input
                    className="border rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-amber-400 dark:bg-darkInput dark:border-darkAccent dark:text-darkText"
                    value={edit.numeracion || ''}
                    onChange={(e) =>
                      setEdit({ ...edit, numeracion: e.target.value })
                    }
                  />
                </div>

                <div>
                  <label className="text-sm text-slate-500 dark:text-slate-400">Observaciones</label>
                  <textarea
                    className="border rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-amber-400 dark:bg-darkInput dark:border-darkAccent dark:text-darkText"
                    rows="4"
                    value={edit.observaciones || ''}
                    onChange={(e) =>
                      setEdit({ ...edit, observaciones: e.target.value })
                    }
                  />
                </div>
              </div>
            </div>
          </div>

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
              className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-xl hover:from-amber-600 hover:to-amber-700 transition-all shadow-lg"
            >
              <Save className="w-4 h-4" />
              Guardar Cambios
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
