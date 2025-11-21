import React, { useState } from 'react';
import { Edit3, Eye, X, Check, Package, CreditCard as CardIcon } from 'lucide-react';
import Card from '../ui/Card';
import SectionTitle from '../ui/SectionTitle';
import '../../styles/table-optimizations.css';

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

const formatCurrency = (value) => {
  const number = Number(value);
  if (!Number.isFinite(number)) return "-";
  return number.toLocaleString("es-ES", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

export function VentasTable({
  ventasCalc = [],
  productos = [],
  colaboradores = [],
  zonas = [],
  selectedIds = [],
  onSelect,
  onSelectAll,
  isAllSelected,
  onEdit,
  onView,
  onDelete,
  onActivate,
  onDefinePvp,
  isAdmin = true,
  currentPage = 1,
  pageSize = 25,
  totalItems = 0,
  totalPages = 1,
  onPageChange,
  onPageSizeChange,
}) {
  const [ariaMessage, setAriaMessage] = useState("");

  // Helpers para mostrar nombres en vez de IDs (con fallback a campos precalculados)
  const getNombreProducto = (venta) => {
    if (venta.productoNombre) return venta.productoNombre;
    const prod = productos.find((p) => p?.id === venta?.producto_id);
    return prod?.nombre ? prod.nombre : (prod?.codigo || venta?.producto_id || "");
  };

  const getNombreZona = (venta) => {
    if (venta.zonaNombre) return venta.zonaNombre;
    const zona = zonas.find((z) => z?.id === venta?.zona_id);
    return zona?.nombre ? zona.nombre : (venta?.zona_id || "");
  };

  const getNombreColaborador = (venta) => {
    if (venta.colaboradorNombre) return venta.colaboradorNombre;
    const colab = colaboradores.find((c) => c?.id === venta?.colaborador_id);
    return colab?.nombre ? colab.nombre : (venta?.colaborador_id || "");
  };

  // Función para obtener estilo del estado
  const getEstadoStyle = (estado) => {
    const estilos = {
      ACTIVO: "bg-emerald-100 text-emerald-700",
      PENDIENTE: "bg-amber-100 text-amber-700",
      "PENDIENTE VALIDAR": "bg-yellow-100 text-yellow-700",
      SCORING: "bg-blue-100 text-blue-700",
      INCIDENCIA: "bg-orange-100 text-orange-700",
      INSTALACION: "bg-indigo-100 text-indigo-700",
      ENVIADA: "bg-cyan-100 text-cyan-700",
      "PENDIENTE INSTALACION": "bg-purple-100 text-purple-700",
      CITADA: "bg-lime-100 text-lime-700",
      TRAMITACION: "bg-sky-100 text-sky-700",
      CANCELADA: "bg-red-100 text-red-700",
      BAJA: "bg-gray-100 text-gray-700",
      "OFERTA FIRMADA": "bg-green-100 text-green-700",
      "PDTE FIRMA": "bg-pink-100 text-pink-700",
      RECHAZADA: "bg-rose-100 text-rose-700",
    };
    return estilos[estado] || "bg-slate-100 text-slate-700";
  };

  // Feedback ARIA para cambios de página y acciones
  const handlePageChange = (newPage) => {
    onPageChange && onPageChange(newPage);
    setAriaMessage(`Página ${newPage}`);
  };

  if (ventasCalc.length === 0) {
    return (
      <Card>
        <SectionTitle>Lista de Ventas</SectionTitle>
        <div aria-live="polite" className="sr-only">
          {ariaMessage}
        </div>
        <div className="text-center py-12">
          <Package className="w-16 h-16 mx-auto text-slate-300 mb-4" />
          <h3 className="text-lg font-medium text-slate-600 mb-2">No hay ventas</h3>
          <p className="text-slate-500">
            No se encontraron ventas con los filtros actuales.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <div aria-live="polite" className="sr-only">
        {ariaMessage}
      </div>
      <SectionTitle>Listado de Ventas</SectionTitle>

      <div className="overflow-x-auto">
        <table
          className="min-w-full border-separate border-spacing-y-2 text-xs md:text-sm"
          role="table"
          aria-label="Tabla de ventas"
        >
          <thead>
            <tr className="text-left text-slate-500 uppercase tracking-wide text-[11px] md:text-xs">
              <th className="px-2 md:px-4 py-2">
                <input
                  type="checkbox"
                  checked={Boolean(isAllSelected)}
                  onChange={onSelectAll}
                  aria-label="Seleccionar todas las ventas"
                  className="accent-sky-500"
                />
              </th>
              <th className="px-2 md:px-4 py-2">Fecha</th>
              <th className="px-2 md:px-4 py-2">Cliente</th>
              <th className="px-2 md:px-4 py-2">Producto</th>
              <th className="px-2 md:px-4 py-2">Zona</th>
              <th className="px-2 md:px-4 py-2">Colaborador</th>
              <th className="px-2 md:px-4 py-2 text-right">PVP</th>
              <th className="px-2 md:px-4 py-2 text-right">Comisión Base</th>
              <th className="px-2 md:px-4 py-2 text-right">Neto</th>
              <th className="px-2 md:px-4 py-2 text-center">Estado</th>
              <th className="px-2 md:px-4 py-2 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {ventasCalc.map((venta, idx) => {
              const estadoLabel = venta.estado || "SIN ESTADO";
              const comisionBase = venta._calc?.detalle?.comBruta;
              const neto = venta._calc?.detalle?.netoColab;
              const nombreProducto = getNombreProducto(venta);

              return (
                <tr
                  key={venta.id || idx}
                  className="bg-white shadow-sm hover:shadow-md transition-shadow focus-within:ring-2 focus-within:ring-sky-200"
                >
                  <td className="px-2 md:px-4 py-3 align-middle">
                    <input
                      type="checkbox"
                      checked={Boolean(selectedIds?.includes(venta.id))}
                      onChange={() => onSelect && onSelect(venta.id)}
                      aria-label={`Seleccionar venta ${venta.id}`}
                      className="accent-sky-500"
                    />
                  </td>
                  <td className="px-2 md:px-4 py-3 align-middle text-slate-700 font-medium">
                    {formatDate(venta.fecha)}
                  </td>
                  <td className="px-2 md:px-4 py-3 align-middle">
                    <div className="text-slate-900 font-medium uppercase tracking-tight">
                      {venta.cliente || "Sin cliente"}
                    </div>
                    {venta.cif && (
                      <div className="text-[11px] text-slate-500">{venta.cif}</div>
                    )}
                  </td>
                  <td className="px-2 md:px-4 py-3 align-middle text-slate-700">
                    {nombreProducto}
                  </td>
                  <td className="px-2 md:px-4 py-3 align-middle text-slate-600">
                    {getNombreZona(venta)}
                  </td>
                  <td className="px-2 md:px-4 py-3 align-middle text-slate-700">
                    {getNombreColaborador(venta)}
                  </td>
                  <td className="px-2 md:px-4 py-3 align-middle text-right font-semibold text-slate-900">
                    {formatCurrency(venta.pvp ?? venta._calc?.detalle?.producto?.pvp)}
                  </td>
                  <td className="px-2 md:px-4 py-3 align-middle text-right text-indigo-600 font-semibold">
                    {formatCurrency(comisionBase)}
                  </td>
                  <td className="px-2 md:px-4 py-3 align-middle text-right text-emerald-600 font-semibold">
                    {formatCurrency(neto)}
                  </td>
                  <td className="px-2 md:px-4 py-3 align-middle">
                    <span
                      className={`inline-flex items-center justify-center px-2.5 py-1 rounded-full text-[11px] font-semibold ${getEstadoStyle(
                        estadoLabel
                      )}`}
                    >
                      {estadoLabel}
                    </span>
                  </td>
                  <td className="px-2 md:px-4 py-3 align-middle">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        onClick={() => onView && onView(venta)}
                        aria-label={`Ver detalles de venta ${venta.id}`}
                        className="p-2 rounded-lg bg-sky-50 text-sky-600 hover:bg-sky-100 transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {isAdmin && (
                        <>
                          <button
                            onClick={() => onEdit && onEdit(venta)}
                            aria-label={`Editar venta ${venta.id}`}
                            className="p-2 rounded-lg bg-amber-50 text-amber-600 hover:bg-amber-100 transition-colors"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onDelete && onDelete(venta.id)}
                            aria-label={`Eliminar venta ${venta.id}`}
                            className="p-2 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onActivate && onActivate(venta.id)}
                            aria-label={`Activar venta ${venta.id}`}
                            className="p-2 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() =>
                              onDefinePvp &&
                              onDefinePvp(venta.producto_id, nombreProducto)
                            }
                            aria-label={`Definir PVP del producto de la venta ${venta.id}`}
                            className="p-2 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors"
                          >
                            <CardIcon className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Paginación si la usas: */}
      {onPageChange && (
        <div className="mt-4 flex justify-end">
          {/* Aquí puedes seguir usando tu componente Pagination si lo tenías */}
        </div>
      )}
    </Card>
  );
}
