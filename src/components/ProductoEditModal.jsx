import React, { useState } from "react";
import { useImportGestion } from '../hooks/useImportGestion';
import { X, Clock, User, Package, DollarSign, Calendar, Mail, Phone, Info, Save, History, Tag, Briefcase, AlertCircle, TrendingUp, Sparkles } from "lucide-react";
import Modal from "./ui/Modal";
import { Input, Select, Label, Button, TextArea } from "./ui/FormElements";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "../lib/utils";
import { euro } from "../utils/designUtils";

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
    return value === "" ? "" : euro(value);
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
  const { customFields } = useImportGestion({ modulo: 'productos' });
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

  const operadorSeleccionado = operadores.find(op => op.id === draft.operador_id);
  const esTelefonia = (operadorSeleccionado?.sector || draft.familia || "").toUpperCase().includes('TELEFO');

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={producto ? "Configurar Catálogo" : "Nuevo Activo Maestro"}
      subtitle={producto ? `ID: ${producto.id?.slice(0, 8)}` : "Nueva Referencia"}
      icon={Package}
      iconColor="text-blue-500"
      maxWidth="max-w-7xl"
    >
      <form onSubmit={handleSave} className="space-y-10">
        {error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-black uppercase tracking-widest flex items-center gap-3"
          >
            <AlertCircle className="w-5 h-5" />
            {error}
          </motion.div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Columna 1: Identificación y Datos Básicos */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-8"
          >
            <div className="flex items-center gap-4 pb-4 border-b border-slate-200 dark:border-white/5">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                <Tag className="w-5 h-5 text-blue-500" />
              </div>
              <h3 className="text-xs font-black uppercase tracking-[3px] text-slate-500">Identificación Maestro</h3>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <Label>Nombre del Producto *</Label>
                <Input
                  name="nombre"
                  icon={Package}
                  placeholder="Ej: Fibra 1GB + Móvil"
                  value={draft.nombre}
                  onChange={handleChange}
                  required
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Familia / Categoría</Label>
                  <Input
                    name="familia"
                    icon={Briefcase}
                    placeholder="Ej: Convergente"
                    value={draft.familia}
                    onChange={handleChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Operador Partner *</Label>
                  <Select
                    name="operador_id"
                    value={draft.operador_id}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Selección...</option>
                    {operadores.map(op => (
                      <option key={op.id} value={op.id}>{op.nombre}</option>
                    ))}
                  </Select>
                </div>
              </div>

              <div className="p-6 rounded-[2rem] bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 space-y-4">
                <div className="space-y-2">
                  <Label className="text-emerald-500">PVP de Mercado (€) *</Label>
                  <Input
                    name="pvp"
                    type="number"
                    step="0.01"
                    icon={DollarSign}
                    className="text-xl font-black"
                    value={draft.pvp}
                    onChange={handleChange}
                    required
                  />
                </div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-2 leading-relaxed">
                  Precio final que paga el cliente mensualmente.
                </p>
              </div>

              <div className="space-y-4 pt-4">
                <Label className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5" /> Contacto Técnico
                </Label>
                <div className="grid grid-cols-1 gap-4">
                  <Input name="contacto" placeholder="Persona de contacto" value={draft.contacto} onChange={handleChange} />
                  <Input name="email" type="email" icon={Mail} placeholder="email@partner.com" value={draft.email} onChange={handleChange} />
                  <Input name="telefono" icon={Phone} placeholder="+34 ..." value={draft.telefono} onChange={handleChange} />
                </div>
              </div>
            </div>
          </motion.div>

          {/* Columna 2: Reglas de Comisión y Vigencia */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="space-y-8"
          >
            <div className="flex items-center gap-4 pb-4 border-b border-slate-200 dark:border-white/5">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-purple-500" />
              </div>
              <h3 className="text-xs font-black uppercase tracking-[3px] text-slate-500">Reglas de Liquidación</h3>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Modelo Atribución</Label>
                  <Select
                    name="comision_tipo"
                    value={draft.comision_tipo}
                    onChange={handleChange}
                  >
                    <option value="porcentaje">Porcentaje (%)</option>
                    <option value="fijo">Fijo (€)</option>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Valor Base</Label>
                  <Input
                    name="comision_valor"
                    type="number"
                    step="0.01"
                    icon={TrendingUp}
                    value={draft.comision_valor}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Vigencia Desde</Label>
                  <Input
                    name="comision_vigencia_desde"
                    type="date"
                    icon={Calendar}
                    value={draft.comision_vigencia_desde}
                    onChange={handleChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Vigencia Hasta</Label>
                  <Input
                    name="comision_vigencia_hasta"
                    type="date"
                    icon={Calendar}
                    value={draft.comision_vigencia_hasta}
                    onChange={handleChange}
                  />
                </div>
              </div>

              {esTelefonia && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="p-6 rounded-[2rem] bg-indigo-500/5 border border-indigo-500/10 space-y-4"
                >
                  <p className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">Parámetros de Telefonía</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label className="text-[10px]">Captación Nueva</Label>
                      <Input name="comision_cliente_nuevo" type="number" step="0.01" value={draft.comision_cliente_nuevo} onChange={handleChange} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px]">Fidelización</Label>
                      <Input name="comision_cliente_existente" type="number" step="0.01" value={draft.comision_cliente_existente} onChange={handleChange} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px]">Alta Nueva</Label>
                      <Input name="comision_alta_nueva" type="number" step="0.01" value={draft.comision_alta_nueva} onChange={handleChange} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px]">Portabilidad</Label>
                      <Input name="comision_portabilidad" type="number" step="0.01" value={draft.comision_portabilidad} onChange={handleChange} />
                    </div>
                  </div>
                </motion.div>
              )}

              <div className="space-y-2">
                <Label>Observaciones de Producto</Label>
                <TextArea
                  name="observaciones"
                  placeholder="Detalles sobre la tarifa o proceso..."
                  className="rounded-3xl"
                  rows={3}
                  value={draft.observaciones}
                  onChange={handleChange}
                />
              </div>

              {/* Botones de acción móvil/desktop footer local */}
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-white/5">
                <Button variant="secondary" onClick={onClose} className="rounded-2xl px-8">Cancelar</Button>
                <Button variant="primary" onClick={handleSave} icon={Save} className="rounded-2xl px-10">Guardar Maestro</Button>
              </div>
            </div>
          </motion.div>

          {/* Columna 3: Historial y Metadatos */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-8"
          >
            <div className="flex items-center gap-4 pb-4 border-b border-slate-200 dark:border-white/5">
              <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center">
                <History className="w-5 h-5 text-orange-500" />
              </div>
              <h3 className="text-xs font-black uppercase tracking-[3px] text-slate-500">Log de Auditoría</h3>
            </div>

            <div className="space-y-6">
              <div className="max-h-[600px] overflow-y-auto pr-2 space-y-4 no-scrollbar">
                {(!draft.historial || draft.historial.length === 0) ? (
                  <div className="p-10 text-center opacity-30 border-2 border-dashed border-slate-300 dark:border-white/10 rounded-[2.5rem]">
                    <Clock className="w-12 h-12 mx-auto mb-4" />
                    <p className="text-[10px] font-black uppercase tracking-widest">Sin registros previos</p>
                  </div>
                ) : (
                  draft.historial.slice().reverse().map((entrada, index) => (
                    <div key={index} className="p-5 rounded-[2rem] bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 relative overflow-hidden group">
                      <div className="absolute top-0 left-0 w-1 h-full bg-blue-500/50" />
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-blue-500/10 flex items-center justify-center">
                            <User className="w-3 h-3 text-blue-500" />
                          </div>
                          <span className="text-[10px] font-black uppercase text-slate-600 dark:text-white/60">{entrada.usuario}</span>
                        </div>
                        <span className="text-[9px] font-bold text-slate-400">
                          {new Date(entrada.fecha).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="space-y-2">
                        {Object.entries(entrada.cambios).map(([campo, cambio]) => (
                          <div key={campo} className="text-[10px] font-medium border-l-2 border-slate-200 dark:border-white/10 pl-3 ml-1">
                            <p className="text-slate-400 mb-1">{getFieldLabel(campo)}</p>
                            <div className="flex items-center gap-2">
                              <span className="text-rose-500 line-through opacity-50">{formatValue(campo, cambio.antes)}</span>
                              <span className="text-slate-300">→</span>
                              <span className="text-emerald-500 font-black tracking-tight">{formatValue(campo, cambio.despues)}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Campos Personalizados (si existen) */}
              {customFields.length > 0 && (
                <div className="pt-8 space-y-4">
                  <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[3px] text-slate-400">
                    <Sparkles className="w-3.5 h-3.5" /> Metadatos Dinámicos
                  </div>
                  <div className="grid grid-cols-1 gap-4">
                    {customFields.map((field) => (
                      <div key={field.id} className="space-y-1">
                        <Label className="text-[10px]">{field.nombre}{field.requerido && ' *'}</Label>
                        {field.tipo === 'texto' && <Input value={draft[`cf_${field.id}`] || ''} onChange={e => setDraft({ ...draft, [`cf_${field.id}`]: e.target.value })} required={field.requerido} />}
                        {field.tipo === 'número' && <Input type="number" value={draft[`cf_${field.id}`] || ''} onChange={e => setDraft({ ...draft, [`cf_${field.id}`]: e.target.value })} required={field.requerido} />}
                        {field.tipo === 'fecha' && <Input type="date" value={draft[`cf_${field.id}`] || ''} onChange={e => setDraft({ ...draft, [`cf_${field.id}`]: e.target.value })} required={field.requerido} />}
                        {field.tipo === 'select' && (
                          <Select value={draft[`cf_${field.id}`] || ''} onChange={e => setDraft({ ...draft, [`cf_${field.id}`]: e.target.value })} required={field.requerido}>
                            <option value="">Selección...</option>
                            {field.opciones.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                          </Select>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </form>
    </Modal>
  );
}
