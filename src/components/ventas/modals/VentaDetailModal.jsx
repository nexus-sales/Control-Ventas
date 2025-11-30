import React, { useState } from 'react';
import { Eye, X, Edit3 } from 'lucide-react';
import Card from '../../ui/Card';
import Pill from '../../ui/Pill';

// Función para formatear fecha
const formatDate = (dateStr) => {
  if (!dateStr) return "";
  try {
    if (dateStr.match(/^\d{2}\/\d{2}\/\d{4}$/)) return dateStr;
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  } catch {
    return dateStr;
  }
};

export function VentaDetailModal({ 
  isOpen, 
  onClose, 
  onEdit,
  venta,
  productos = [],
  colaboradores = [],
  zonas = [],
  isVentaBlocked
}) {
  if (!isOpen || !venta) return null;

  // Funciones para obtener nombres por ID o desde campos precalculados
  const getProductoNombre = () =>
    venta.productoNombre ||
    productos.find((p) => p?.id === venta.producto_id)?.nombre ||
    venta.producto_id;

  const getZonaNombre = () =>
    venta.zonaNombre ||
    zonas.find((z) => z?.id === venta.zona_id)?.nombre ||
    venta.zona_id;

  const getColaboradorNombre = () =>
    venta.colaboradorNombre ||
    colaboradores.find((c) => c?.id === venta.colaborador_id)?.nombre ||
    venta.colaborador_id;

  const producto = productos.find((p) => p?.id === venta.producto_id);
  const pvpValue = producto?.pvp || venta.pvp || 0;
  const blocked = isVentaBlocked ? isVentaBlocked(venta) : false;

  // Función para obtener estilo del estado
  const getEstadoStyle = (estado) => {
    const estilos = {
      ACTIVO: "bg-emerald-100 text-emerald-700",
      PENDIENTE: "bg-amber-100 text-amber-700",
      CANCELADA: "bg-red-100 text-red-700",
      BAJA: "bg-gray-100 text-gray-700",
      RECHAZADA: "bg-rose-100 text-rose-700",
    };
    return estilos[estado] || "bg-slate-100 text-slate-700";
  };

  const [activeTab, setActiveTab] = useState('info');

  return (
    <div className="fixed inset-0 bg-pink-200/40 dark:bg-pink-900/60 flex items-center justify-center p-4 z-50">
      <Card className="max-w-3xl w-full max-h-[90vh] overflow-auto card-pastel">
        {/* Header */}
        <div className="sticky top-0 bg-pink-50 dark:bg-pink-200 border-b border-pink-200 dark:border-pink-400 pb-4 mb-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-pink-900 dark:text-pink-700 flex items-center gap-2">
              <Eye className="w-5 h-5 text-pink-700 dark:text-pink-900" />
              Detalles de Venta
            </h3>
            <button
              onClick={onClose}
              className="p-2 hover:bg-pink-100 dark:hover:bg-pink-300 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-pink-700 dark:text-pink-900" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mt-4">
            <button
              className={`px-4 py-2 rounded-t-lg font-medium ${
                activeTab === 'info'
                  ? 'bg-pink-100 text-pink-700'
                  : 'bg-pink-50 text-pink-900'
              }`}
              onClick={() => setActiveTab('info')}
            >
                const [activeTab, setActiveTab] = useState('info');
              Información
            </button>
            <button
              className={`px-4 py-2 rounded-t-lg font-medium ${
                activeTab === 'extras'
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-pink-50 text-pink-900'
              }`}
              onClick={() => setActiveTab('extras')}
            >
              Extras
            </button>
          </div>
        </div>

        {/* Contenido principal */}
        <div className="space-y-6">
          {activeTab === 'info' && (
            <>
              <div className="grid md:grid-cols-2 gap-6">
                {/* Información cliente */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-pink-900 dark:text-pink-700 pb-2 border-b border-pink-200 dark:border-pink-400">
                    Información del Cliente
                  </h4>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm text-pink-700 dark:text-pink-900">
                        Cliente
                      </label>
                      <p className="font-medium text-pink-900 dark:text-pink-700">
                        {venta.cliente}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm text-pink-700 dark:text-pink-900">
                        CIF/DNI
                      </label>
                      <p className="font-medium text-pink-900 dark:text-pink-700">
                        {venta.cif || "No especificado"}
                      </p>
                    </div>
                    {venta.telefono_fijo && (
                      <div>
                        <label className="text-sm text-pink-700 dark:text-pink-900">
                          Teléfono Fijo
                        </label>
                        <p className="font-medium text-pink-900 dark:text-pink-700">
                          {venta.telefono_fijo}
                        </p>
                      </div>
                    )}
                    {venta.telefono_movil && (
                      <div>
                        <label className="text-sm text-pink-700 dark:text-pink-900">
                          Teléfono Móvil
                        </label>
                        <p className="font-medium text-pink-900 dark:text-pink-700">
                          {venta.telefono_movil}
                        </p>
                      </div>
                    )}
                    {venta.documento && (
                      <div>
                        <label className="text-sm text-pink-700 dark:text-pink-900">
                          Documento
                        </label>
                        <p className="font-medium text-pink-900 dark:text-pink-700">
                          {venta.documento}
                        </p>
                      </div>
                    )}
                    {venta.numeracion && (
                      <div>
                        <label className="text-sm text-pink-700 dark:text-pink-900">
                          Numeración
                        </label>
                        <p className="font-medium text-pink-900 dark:text-pink-700">
                          {venta.numeracion}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Información servicio */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-slate-800 pb-2 border-b border-slate-200">
                    Información del Servicio
                  </h4>

                  <div className="space-y-3">
                    <div>
                      <label className="text-sm text-slate-500">Fecha</label>
                      <p className="font-medium text-slate-800">
                        {formatDate(venta.fecha)}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm text-slate-500">Producto</label>
                      <p className="font-medium text-slate-800">
                        {getProductoNombre()}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm text-slate-500">Zona</label>
                      <p className="font-medium text-slate-800">
                        {getZonaNombre()}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm text-slate-500">Colaborador</label>
                      <p className="font-medium text-slate-800">
                        {getColaboradorNombre()}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm text-slate-500">
                        PVP del Producto
                      </label>
                      {pvpValue > 0 ? (
                        <p className="font-medium text-slate-800 text-lg text-sky-600">
                          {Number(pvpValue).toFixed(2)}€
                        </p>
                      ) : (
                        <p className="text-slate-400 italic">Por definir</p>
                      )}
                    </div>
                    <div>
                      <label className="text-sm text-slate-500">
                        Comisión Base
                      </label>
                      <p className="font-medium text-slate-800">
                        {producto?.comision_base
                          ? `${producto.comision_base.toFixed(2)}€`
                          : "0.00€"}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm text-slate-500">
                        Comisión Comercial
                      </label>
                      <p className="font-medium text-slate-800 text-lg text-emerald-600">
                        {venta._calc?.ok
                          ? `${venta._calc.detalle.netoColab.toFixed(2)}€`
                          : "0.00€"}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm text-slate-500">Estado</label>
                      <div className="mt-1">
                        <Pill className={getEstadoStyle(venta.estado)}>
                          {venta.estado}
                        </Pill>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Observaciones */}
              {venta.observaciones && (
                <div className="space-y-2">
                  <h4 className="font-semibold text-slate-800 pb-2 border-b border-slate-200">
                    Observaciones
                  </h4>
                  <p className="text-slate-700 bg-slate-50 p-3 rounded-lg">
                    {venta.observaciones}
                  </p>
                </div>
              )}

              {/* Cálculos detallados */}
              {venta._calc?.ok && (
                <div className="space-y-2">
                  <h4 className="font-semibold text-slate-800 pb-2 border-b border-slate-200">
                    Detalles de Comisión
                  </h4>
                  <div className="bg-slate-50 p-4 rounded-lg space-y-2">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Comisión Bruta:</span>
                      <span className="font-medium">
                        {venta._calc.detalle.comBruta.toFixed(2)}€
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">IRPF:</span>
                      <span className="font-medium text-red-600">
                        -{venta._calc.detalle.irpf.toFixed(2)}€
                      </span>
                    </div>
                    <div className="flex justify-between border-t border-slate-200 pt-2">
                      <span className="font-semibold text-slate-800">
                        Neto Colaborador:
                      </span>
                      <span className="font-bold text-emerald-600">
                        {venta._calc.detalle.netoColab.toFixed(2)}€
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {activeTab === 'extras' && (
            <div className="space-y-6">
              <h4 className="font-semibold text-emerald-700 pb-2 border-b border-emerald-200">
                Campos Extras Importados
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {venta.extras && Object.keys(venta.extras).length > 0 ? (
                  Object.entries(venta.extras).map(([key, value]) => (
                    <div
                      key={key}
                      className="bg-pink-100 dark:bg-pink-300 rounded-lg p-3"
                    >
                      <span className="text-xs font-semibold text-pink-700 dark:text-pink-900">
                        {key}
                      </span>
                      <div className="text-sm text-pink-900 dark:text-pink-700 break-all">
                        {value}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-pink-700 dark:text-pink-900">
                    No hay campos extras importados.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Botones */}
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
            {!blocked && onEdit && (
              <button
                onClick={() => {
                  onClose();
                  onEdit(venta);
                }}
                className="px-4 py-2 bg-sky-500 text-white rounded-lg hover:bg-sky-600 transition-colors flex items-center gap-2"
              >
                <Edit3 className="w-4 h-4" />
                Editar Venta
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
}
