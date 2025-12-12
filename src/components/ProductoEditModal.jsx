import React, { useState } from "react";
import { useImportGestion } from '../hooks/useImportGestion';
import { X, Clock, User } from "lucide-react";

const FIELD_LABELS = {
  nombre: "Nombre",
  familia: "Familia", 
  pvp: "PVP",
  comision_tipo: "Tipo Comisión",
  comision_valor: "Valor Comisión",
  comision_vigencia_desde: "Comisión vigente desde",
  comision_vigencia_hasta: "Comisión vigente hasta",
  comision_cliente_nuevo: "Comisión cliente nuevo (solo Telefonía)",
  comision_cliente_existente: "Comisión cliente existente (solo Telefonía)",
  comision_portabilidad: "Comisión portabilidad (solo Telefonía)",
  comision_alta_nueva: "Comisión alta nueva (solo Telefonía)",
  fecha_alta: "Fecha Alta",
  fecha_baja: "Fecha Baja",
  contacto: "Contacto",
  email: "Email",
  telefono: "Teléfono",
  observaciones: "Observaciones",
};

function getFieldLabel(field) {
  return FIELD_LABELS[field] || field;
}

function formatValue(field, value) {
  if (field === "pvp" || field === "comision_valor") {
    return value === "" ? "" : Number(value).toLocaleString("es-ES", { 
      style: "currency", 
      currency: "EUR" 
    });
  }
  if (field === "fecha_alta" || field === "fecha_baja") {
    return value ? new Date(value).toLocaleDateString("es-ES") : "";
  }
  return value;
}

function createHistoryEntry(original, updated) {
  const changes = {};
  Object.keys(FIELD_LABELS).forEach((field) => {
    const originalValue = original?.[field] ?? "";
    const updatedValue = updated?.[field] ?? "";
    if (String(originalValue) !== String(updatedValue)) {
      changes[field] = { antes: originalValue, despues: updatedValue };
    }
  });
  
  if (Object.keys(changes).length > 0) {
    return {
      fecha: new Date().toISOString(),
      usuario: "Usuario Actual",
      cambios: changes,
    };
  }
  return null;
}

export default function ProductoEditModal({ producto, onSave, onClose }) {
  // Obtener campos personalizados para productos
  const { customFields } = useImportGestion({ modulo: 'productos' });
  // Obtener operadores desde window (por props no llegan)
  const operadores = window.__operadores || [];
  const [draft, setDraft] = useState(() => ({
    operador_id: producto?.operador_id || operadores[0]?.id || "",
    nombre: producto?.nombre || "",
    familia: producto?.familia || "",
    pvp: producto?.pvp ?? "",
    comision_tipo: producto?.comision_tipo || "porcentaje",
    comision_valor: producto?.comision_valor ?? "",
    comision_fija: producto?.comision_fija ?? "",
    comision_porcentaje: producto?.comision_porcentaje ?? "",
    comision_vigencia_desde: producto?.comision_vigencia_desde || "",
    comision_vigencia_hasta: producto?.comision_vigencia_hasta || "",
    comision_cliente_nuevo: producto?.comision_cliente_nuevo ?? "",
    comision_cliente_existente: producto?.comision_cliente_existente ?? "",
    comision_portabilidad: producto?.comision_portabilidad ?? "",
    comision_alta_nueva: producto?.comision_alta_nueva ?? "",
    fecha_alta: producto?.fecha_alta || "",
    fecha_baja: producto?.fecha_baja || "",
    contacto: producto?.contacto || "",
    email: producto?.email || "",
    telefono: producto?.telefono || "",
    observaciones: producto?.observaciones || "",
    historial: producto?.historial || [],
    comisiones_historial: Array.isArray(producto?.comisiones_historial) ? producto.comisiones_historial : [],
  }));
  
  const [error, setError] = useState("");

  function validate() {
    if (!draft.nombre.trim()) return "El nombre es obligatorio.";
    if (draft.comision_valor !== "" && isNaN(Number(draft.comision_valor))) {
      return "El valor de comisión debe ser un número.";
    }
    const camposNumericos = [
      "comision_cliente_nuevo",
      "comision_cliente_existente",
      "comision_portabilidad",
      "comision_alta_nueva",
    ];
    for (const campo of camposNumericos) {
      if (draft[campo] !== "" && isNaN(Number(draft[campo]))) {
        return `El campo ${getFieldLabel(campo)} debe ser numérico.`;
      }
    }
    if (draft.pvp !== "" && isNaN(Number(draft.pvp))) {
      return "El PVP debe ser un número.";
    }
    if (draft.email && !/^\S+@\S+\.\S+$/.test(draft.email)) {
      return "El email no es válido.";
    }
    if (draft.telefono && !/^\+?\d{7,15}$/.test(draft.telefono.replace(/\s/g, ""))) {
      return "El teléfono no es válido.";
    }
    return "";
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setDraft((d) => ({ ...d, [name]: value }));
  }

  function handleSave(e) {
    if (e) e.preventDefault();
    
    const err = validate();
    if (err) {
      setError(err);
      return;
    }

    const finalData = {
      ...draft,
      pvp: draft.pvp === "" ? "" : Number(draft.pvp),
      comision_valor: draft.comision_valor === "" ? "" : Number(draft.comision_valor),
      comision_fija: draft.comision_fija === "" ? 0 : Number(draft.comision_fija),
      comision_porcentaje: draft.comision_porcentaje === "" ? 0 : Number(draft.comision_porcentaje),
      comision_cliente_nuevo: draft.comision_cliente_nuevo === "" ? "" : Number(draft.comision_cliente_nuevo),
      comision_cliente_existente: draft.comision_cliente_existente === "" ? "" : Number(draft.comision_cliente_existente),
      comision_portabilidad: draft.comision_portabilidad === "" ? "" : Number(draft.comision_portabilidad),
      comision_alta_nueva: draft.comision_alta_nueva === "" ? "" : Number(draft.comision_alta_nueva),
    };

    if (finalData.comision_tipo === 'fijo' && !finalData.comision_valor) {
      finalData.comision_valor = finalData.comision_fija;
    }
    if (finalData.comision_tipo === 'porcentaje' && !finalData.comision_valor) {
      finalData.comision_valor = finalData.comision_porcentaje;
    }

    const snapshotFecha = draft.comision_vigencia_desde || draft.fecha_alta || new Date().toISOString().slice(0, 10);
    const nowIso = new Date().toISOString();
    const snapshot = {
      id: `hist_${Date.now()}`,
      desde: snapshotFecha,
      hasta: draft.comision_vigencia_hasta || "",
      comision_tipo: finalData.comision_tipo,
      comision_fija: finalData.comision_fija,
      comision_porcentaje: finalData.comision_porcentaje,
      comision_valor: finalData.comision_valor,
      comision_cliente_nuevo: finalData.comision_cliente_nuevo,
      comision_cliente_existente: finalData.comision_cliente_existente,
      comision_portabilidad: finalData.comision_portabilidad,
      comision_alta_nueva: finalData.comision_alta_nueva,
      comision_vigencia_desde: draft.comision_vigencia_desde || "",
      comision_vigencia_hasta: draft.comision_vigencia_hasta || "",
      created_at: nowIso,
    };

    const historico = Array.isArray(draft.comisiones_historial) ? [...draft.comisiones_historial] : [];
    const last = historico[historico.length - 1];
    if (last && !last.hasta && snapshot.desde && last.desde && snapshot.desde > last.desde) {
      historico[historico.length - 1] = { ...last, hasta: last.hasta || snapshot.desde };
    }
    historico.push(snapshot);
    finalData.comisiones_historial = historico;

    let historial = draft.historial || [];
    
    // Solo crear entrada de historial si estamos editando un producto existente
    if (producto && producto.id) {
      const newHistoryEntry = createHistoryEntry(producto, finalData);
      if (newHistoryEntry) {
        historial = [...historial, newHistoryEntry];
      }
    }
    
    finalData.historial = historial;
    setError("");
    onSave(finalData, true);
    onClose();
  }

  return (
    <div 
      className="fixed inset-0 bg-black/40 dark:bg-black/70 backdrop-blur-sm flex items-center justify-center z-50" 
      role="dialog" 
      aria-modal="true"
    >
      <div className="bg-white dark:bg-darkCard rounded-xl shadow-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto relative text-slate-800 dark:text-darkText transition-colors">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-2 hover:bg-slate-100 rounded-full"
          aria-label="Cerrar edición de producto"
        >
          <X className="w-5 h-5 text-slate-500" aria-hidden="true" />
        </button>
        
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          {producto ? "Editar Producto" : "Nuevo Producto"}
        </h2>
        
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm" role="alert">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSave} aria-label="Formulario de producto" autoComplete="off">
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Formulario principal - 2 columnas */}
            <div className="lg:col-span-2 space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700" htmlFor="producto-nombre">
                    Nombre *
                  </label>
                  <input
                    id="producto-nombre"
                    name="nombre"
                    className="border border-slate-200 rounded-xl px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-purple-400"
                    value={draft.nombre}
                    onChange={handleChange}
                    required
                    aria-label="Nombre del producto"
                    autoFocus
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700" htmlFor="producto-familia">
                    Familia
                  </label>
                  <input
                    id="producto-familia"
                    name="familia"
                    className="border border-slate-200 rounded-xl px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-purple-400"
                    value={draft.familia}
                    onChange={handleChange}
                    aria-label="Familia del producto"
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

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700" htmlFor="producto-pvp">
                    PVP (€) *
                  </label>
                  <input
                    id="producto-pvp"
                    name="pvp"
                    className="border border-slate-200 rounded-xl px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-purple-400"
                    type="number"
                    step="0.01"
                    value={draft.pvp}
                    onChange={handleChange}
                    required
                    aria-label="Precio de venta al público"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700" htmlFor="producto-comision-tipo">
                    Tipo Comisión
                  </label>
                  <select
                    id="producto-comision-tipo"
                    name="comision_tipo"
                    className="border border-slate-200 rounded-xl px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-purple-400"
                    value={draft.comision_tipo}
                    onChange={handleChange}
                    aria-label="Tipo de comisión"
                  >
                    <option value="porcentaje">Porcentaje (%)</option>
                    <option value="fijo">Fijo (€)</option>
                  </select>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700" htmlFor="producto-comision-valor">
                    Valor Comisión (por defecto)
                  </label>
                  <input
                    id="producto-comision-valor"
                    name="comision_valor"
                    className="border border-slate-200 rounded-xl px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-purple-400"
                    type="number"
                    step="0.01"
                    value={draft.comision_valor}
                    onChange={handleChange}
                    aria-label="Valor de la comisión"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700" htmlFor="producto-fecha-alta">
                    Fecha Alta (producto)
                  </label>
                  <input
                    id="producto-fecha-alta"
                    name="fecha_alta"
                    className="border border-slate-200 rounded-xl px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-purple-400"
                    type="date"
                    value={draft.fecha_alta}
                    onChange={handleChange}
                    aria-label="Fecha de alta"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700" htmlFor="producto-vigencia-desde">
                    Comisión vigente desde
                  </label>
                  <input
                    id="producto-vigencia-desde"
                    name="comision_vigencia_desde"
                    className="border border-slate-200 rounded-xl px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-purple-400"
                    type="date"
                    value={draft.comision_vigencia_desde}
                    onChange={handleChange}
                    aria-label="Comisión vigente desde"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700" htmlFor="producto-vigencia-hasta">
                    Comisión vigente hasta
                  </label>
                  <input
                    id="producto-vigencia-hasta"
                    name="comision_vigencia_hasta"
                    className="border border-slate-200 rounded-xl px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-purple-400"
                    type="date"
                    value={draft.comision_vigencia_hasta}
                    onChange={handleChange}
                    aria-label="Comisión vigente hasta"
                  />
                </div>
              </div>

              <div className="md:col-span-2 border border-slate-200 rounded-xl p-3 bg-slate-50">
                <div className="flex items-center justify-between text-sm text-slate-700 mb-2">
                  <span className="font-semibold">Historial de comisiones</span>
                  <span className="text-xs text-slate-500">Se añade una entrada al guardar</span>
                </div>
                {(!draft.comisiones_historial || draft.comisiones_historial.length === 0) && (
                  <p className="text-xs text-slate-500">Sin entradas aún.</p>
                )}
                {draft.comisiones_historial && draft.comisiones_historial.length > 0 && (
                  <div className="space-y-2 max-h-40 overflow-y-auto text-xs text-slate-700">
                    {[...draft.comisiones_historial].slice().reverse().map((h) => (
                      <div key={h.id || `${h.desde}-${h.hasta}`} className="p-2 bg-white border border-slate-200 rounded-lg">
                        <div className="flex justify-between">
                          <span className="font-semibold">{h.desde || '—'} → {h.hasta || '—'}</span>
                          <span className="uppercase">{h.comision_tipo || draft.comision_tipo}</span>
                        </div>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {h.comision_fija !== undefined && h.comision_fija !== "" && <span className="px-2 py-1 bg-slate-100 rounded">Fijo: {h.comision_fija}</span>}
                          {h.comision_porcentaje !== undefined && h.comision_porcentaje !== "" && <span className="px-2 py-1 bg-slate-100 rounded">%: {h.comision_porcentaje}</span>}
                          {h.comision_cliente_nuevo !== undefined && h.comision_cliente_nuevo !== "" && <span className="px-2 py-1 bg-slate-100 rounded">Nuevo: {h.comision_cliente_nuevo}</span>}
                          {h.comision_cliente_existente !== undefined && h.comision_cliente_existente !== "" && <span className="px-2 py-1 bg-slate-100 rounded">Existente: {h.comision_cliente_existente}</span>}
                          {h.comision_alta_nueva !== undefined && h.comision_alta_nueva !== "" && <span className="px-2 py-1 bg-slate-100 rounded">Alta: {h.comision_alta_nueva}</span>}
                          {h.comision_portabilidad !== undefined && h.comision_portabilidad !== "" && <span className="px-2 py-1 bg-slate-100 rounded">Portab: {h.comision_portabilidad}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700" htmlFor="producto-fecha-baja">
                    Fecha Baja
                  </label>
                  <input
                    id="producto-fecha-baja"
                    name="fecha_baja"
                    className="border border-slate-200 rounded-xl px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-purple-400"
                    type="date"
                    value={draft.fecha_baja}
                    onChange={handleChange}
                    aria-label="Fecha de baja"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700" htmlFor="producto-operador">
                    Operador *
                  </label>
                  <select
                    id="producto-operador"
                    name="operador_id"
                    className="border border-slate-200 rounded-xl px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-green-400"
                    value={draft.operador_id}
                    onChange={handleChange}
                    required
                    aria-label="Operador del producto"
                  >
                    <option value="">Selecciona un operador</option>
                    {operadores.map(op => (
                      <option key={op.id} value={op.id}>{op.nombre}</option>
                    ))}
                  </select>
                </div>
              </div>

              { (operadores.find(op => op.id === draft.operador_id)?.sector || draft.familia)?.toUpperCase().includes('TELE') && (
                <div className="space-y-4">
                  <div className="pt-2 pb-1 border-b border-slate-200 text-sm font-semibold text-slate-700">Condiciones específicas Telefonía</div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700" htmlFor="producto-comision-cliente-nuevo">
                        Cliente nuevo (% o €)
                      </label>
                      <input
                        id="producto-comision-cliente-nuevo"
                        name="comision_cliente_nuevo"
                        className="border border-slate-200 rounded-xl px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-purple-400"
                        type="number"
                        step="0.01"
                        value={draft.comision_cliente_nuevo}
                        onChange={handleChange}
                        aria-label="Comisión cliente nuevo"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700" htmlFor="producto-comision-cliente-existente">
                        Cliente existente (% o €)
                      </label>
                      <input
                        id="producto-comision-cliente-existente"
                        name="comision_cliente_existente"
                        className="border border-slate-200 rounded-xl px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-purple-400"
                        type="number"
                        step="0.01"
                        value={draft.comision_cliente_existente}
                        onChange={handleChange}
                        aria-label="Comisión cliente existente"
                      />
                    </div>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700" htmlFor="producto-comision-alta-nueva">
                        Alta nueva (% o €)
                      </label>
                      <input
                        id="producto-comision-alta-nueva"
                        name="comision_alta_nueva"
                        className="border border-slate-200 rounded-xl px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-purple-400"
                        type="number"
                        step="0.01"
                        value={draft.comision_alta_nueva}
                        onChange={handleChange}
                        aria-label="Comisión alta nueva"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700" htmlFor="producto-comision-portabilidad">
                        Portabilidad (% o €)
                      </label>
                      <input
                        id="producto-comision-portabilidad"
                        name="comision_portabilidad"
                        className="border border-slate-200 rounded-xl px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-purple-400"
                        type="number"
                        step="0.01"
                        value={draft.comision_portabilidad}
                        onChange={handleChange}
                        aria-label="Comisión portabilidad"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700" htmlFor="producto-email">
                    Email
                  </label>
                  <input
                    id="producto-email"
                    name="email"
                    className="border border-slate-200 rounded-xl px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-purple-400"
                    type="email"
                    value={draft.email}
                    onChange={handleChange}
                    aria-label="Email de contacto"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700" htmlFor="producto-telefono">
                    Teléfono
                  </label>
                  <input
                    id="producto-telefono"
                    name="telefono"
                    className="border border-slate-200 rounded-xl px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-purple-400"
                    value={draft.telefono}
                    onChange={handleChange}
                    aria-label="Teléfono de contacto"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700" htmlFor="producto-observaciones">
                  Observaciones
                </label>
                <textarea
                  id="producto-observaciones"
                  name="observaciones"
                  className="border border-slate-200 rounded-xl px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-purple-400"
                  value={draft.observaciones}
                  onChange={handleChange}
                  aria-label="Observaciones"
                  rows={2}
                />
              </div>
            </div>

            {/* Historial de cambios - 1 columna */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-slate-700">
                <Clock className="w-5 h-5" />
                <h3 className="font-semibold">Historial de Cambios</h3>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 max-h-96 overflow-y-auto">
                {(!draft.historial || draft.historial.length === 0) ? (
                  <div className="text-center py-8 text-slate-500">
                    <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p className="text-sm">Sin historial de cambios</p>
                    <p className="text-xs">Los cambios aparecerán aquí cuando edites el producto</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {draft.historial.slice().reverse().map((entrada, index) => (
                      <div key={index} className="bg-white border border-slate-200 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2 text-sm text-slate-600">
                            <User className="w-4 h-4" />
                            <span className="font-medium">{entrada.usuario}</span>
                          </div>
                          <div className="text-xs text-slate-500">
                            {new Date(entrada.fecha).toLocaleString("es-ES", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </div>
                        </div>
                        <div className="space-y-2">
                          {Object.entries(entrada.cambios).map(([campo, cambio]) => (
                            <div key={campo} className="text-sm">
                              <span className="font-medium text-slate-700">
                                {getFieldLabel(campo)}:
                              </span>
                              <div className="ml-2 flex items-center gap-2 flex-wrap">
                                <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs">
                                  {formatValue(campo, cambio.antes)}
                                </span>
                                <span className="text-slate-400">→</span>
                                <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs">
                                  {formatValue(campo, cambio.despues)}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Botones de acción */}
          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors"
              aria-label="Cancelar edición de producto"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg hover:from-purple-600 hover:to-purple-700 transition-all"
              aria-label="Guardar producto"
            >
              Guardar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
