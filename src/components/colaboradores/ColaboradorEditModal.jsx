import React, { useMemo, useState } from 'react';
import { X, User, Building2, Percent, Phone, MapPin, Shield, Save, Zap, Mail, Calendar, Briefcase, FileText, AlertCircle } from 'lucide-react';
import Modal from "../ui/Modal";
import { Input, Select, Label, Button, TextArea } from "../ui/FormElements";
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../lib/utils';
import { getIrpfPct } from '../../utils/calculos';

export default function ColaboradorEditModal({ colaborador, onSave, onClose, niveles, zonas = [] }) {
  const [draft, setDraft] = useState(
    colaborador ? {
      ...colaborador,
      pct_colaborador: colaborador.pct_colaborador ?? "",
      tipo_fiscal: colaborador.tipo_fiscal || "AUTONOMO",
      zona_id: colaborador.zona_id || "",
      telefono: colaborador.telefono || "",
      email: colaborador.email || "",
      cif_dni: colaborador.cif_dni || "",
      direccion: colaborador.direccion || "",
      estado: colaborador.estado || "ACTIVO",
      fecha_baja: colaborador.fecha_baja || "",
      observaciones: colaborador.observaciones || "",
      comision_personalizada_activa: colaborador.comision_personalizada_activa || false,
      telefonia_tipo: colaborador.telefonia_tipo || 'porcentaje',
      telefonia_valor: colaborador.telefonia_valor || 0.05,
      energia_tipo: colaborador.energia_tipo || 'porcentaje',
      energia_valor: colaborador.energia_valor || 0.05,
      seguridad_tipo: colaborador.seguridad_tipo || 'fijo',
      seguridad_valor: colaborador.seguridad_valor || 250,
    } : {
      nombre: "",
      nivel: niveles.length > 0 ? niveles[0].id : "",
      pct_colaborador: "",
      fecha_alta: new Date().toISOString().slice(0, 10),
      tipo_fiscal: "AUTONOMO",
      zona_id: "",
      telefono: "",
      email: "",
      cif_dni: "",
      direccion: "",
      estado: "ACTIVO",
      fecha_baja: "",
      observaciones: "",
      comision_personalizada_activa: false,
      telefonia_tipo: 'porcentaje',
      telefonia_valor: 0.05,
      energia_tipo: 'porcentaje',
      energia_valor: 0.05,
      seguridad_tipo: 'fijo',
      seguridad_valor: 250,
    }
  );

  const [error, setError] = useState("");

  const normalizarTipoFiscal = (tipo = "") =>
    tipo
      .toString()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toUpperCase()
      .replace(/\s+/g, '_');

  // Tramo IRPF a mostrar en la ficha: null si no aplica (empresa/aut. especial/CIF),
  // el % si es autónomo. "Hoy" es la referencia correcta: no hay venta de la que
  // colgarlo, es el tramo que le tocaría si vendiera ahora mismo.
  const calcularIrpfFicha = (tipo_fiscal, fecha_alta, cif_dni = "") => {
    if (normalizarTipoFiscal(tipo_fiscal) !== "AUTONOMO") return null;
    return getIrpfPct({ tipo_fiscal, fecha_alta, cif_dni }, new Date().toISOString()) * 100;
  };

  const handleSave = (e) => {
    if (e) e.preventDefault();
    if (!draft.nombre?.trim()) {
      setError("El nombre del colaborador es obligatorio");
      return;
    }
    if (!draft.nivel) {
      setError("Debes seleccionar un nivel de comisión");
      return;
    }
    if (!draft.fecha_alta) {
      setError("La fecha de alta es obligatoria");
      return;
    }
    if (draft.fecha_baja && draft.fecha_baja <= draft.fecha_alta) {
      setError("La fecha de baja debe ser posterior a la fecha de alta");
      return;
    }

    const cleanedData = {
      ...draft,
      nombre: draft.nombre.trim(),
      cif_dni: draft.cif_dni?.trim() || "",
      email: draft.email?.trim() || "",
      telefono: draft.telefono?.trim() || "",
      direccion: draft.direccion?.trim() || "",
      observaciones: draft.observaciones?.trim() || "",
      pct_colaborador: draft.pct_colaborador === "" ? null : Number(draft.pct_colaborador),
      irpf_calculado: calcularIrpfFicha(draft.tipo_fiscal, draft.fecha_alta, draft.cif_dni),
      exento_impuestos: (() => {
        const tipo = normalizarTipoFiscal(draft.tipo_fiscal);
        const esCIF = draft.cif_dni?.toUpperCase().match(/^[ABCDEFGHJNPQRSUVW]/);
        return tipo === "AUTONOMO_ESPECIAL" || tipo === "EMPRESA" || Boolean(esCIF);
      })(),
      fecha_baja: draft.fecha_baja || null,
    };

    onSave(cleanedData, true);
  };

  const nivelSeleccionado = niveles.find(n => n.id === draft.nivel);

  const zonasDisponibles = useMemo(() => {
    if (!Array.isArray(zonas) || zonas.length === 0) return [];
    const normalizeKey = (value) =>
      value
        ? value
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-zA-Z0-9]+/g, ' ')
          .trim()
          .toLowerCase()
        : '';

    const uniqueMap = new Map();
    zonas.forEach((zona) => {
      if (!zona?.id) return;
      const name = zona.nombre || zona.codigo || zona.id;
      const keyBase = normalizeKey(name);
      const key = keyBase || zona.id.toLowerCase();
      if (!uniqueMap.has(key)) {
        uniqueMap.set(key, zona);
      }
    });

    return Array.from(uniqueMap.values()).sort((a, b) => {
      const nameA = (a.nombre || a.codigo || a.id || '').toLowerCase();
      const nameB = (b.nombre || b.codigo || b.id || '').toLowerCase();
      return nameA.localeCompare(nameB);
    });
  }, [zonas]);

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={colaborador ? "Configurar Agente Maestro" : "Nuevo Agente Master"}
      subtitle={colaborador ? `ID: ${colaborador.id || 'N/A'}` : "Nueva Incorporación"}
      icon={User}
      iconColor="text-sky-500"
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
          {/* Columna 1: Identidad y Contacto */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-8"
          >
            <div className="flex items-center gap-4 pb-4 border-b border-slate-200 dark:border-white/5">
              <div className="w-10 h-10 rounded-xl bg-sky-500/10 flex items-center justify-center">
                <User className="w-5 h-5 text-sky-500" />
              </div>
              <h3 className="text-xs font-black uppercase tracking-[3px] text-slate-500">Perfil Profesional</h3>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <Label>Nombre Completo Master *</Label>
                <Input
                  icon={User}
                  placeholder="Ej: Juan Pérez Sánchez"
                  value={draft.nombre}
                  onChange={(e) => setDraft((d) => ({ ...d, nombre: e.target.value }))}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>CIF / DNI / NIE</Label>
                <Input
                  icon={FileText}
                  placeholder="12345678Z"
                  value={draft.cif_dni}
                  onChange={(e) => setDraft((d) => ({ ...d, cif_dni: e.target.value }))}
                />
              </div>

              <div className="p-6 rounded-[2rem] bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 space-y-4">
                <div className="space-y-2">
                  <Label>Localización y Envío</Label>
                  <Input
                    icon={MapPin}
                    placeholder="Dirección fiscal completa"
                    value={draft.direccion}
                    onChange={(e) => setDraft((d) => ({ ...d, direccion: e.target.value }))}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label className="text-[10px]">Teléfono Directo</Label>
                    <Input icon={Phone} placeholder="600000000" value={draft.telefono} onChange={(e) => setDraft((d) => ({ ...d, telefono: e.target.value }))} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px]">Email Corporativo</Label>
                    <Input icon={Mail} placeholder="agente@nexus.com" value={draft.email} onChange={(e) => setDraft((d) => ({ ...d, email: e.target.value }))} />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Nivel de Red Master *</Label>
                <Select
                  value={draft.nivel}
                  onChange={(e) => setDraft((d) => ({ ...d, nivel: e.target.value }))}
                  required
                >
                  <option value="">Selección de nivel...</option>
                  {niveles.map((nivel) => (
                    <option key={nivel.id} value={nivel.id}>
                      {nivel.nombre} [{nivel.id}]
                    </option>
                  ))}
                </Select>
                {nivelSeleccionado && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex justify-between p-4 rounded-2xl bg-sky-500/5 text-sky-600 dark:text-sky-400 border border-sky-500/10 mt-2"
                  >
                    <div className="text-center">
                      <p className="text-[8px] font-black uppercase tracking-tighter opacity-50">Telco</p>
                      <p className="font-black">{(nivelSeleccionado.pct_telefonia * 100).toFixed(0)}%</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[8px] font-black uppercase tracking-tighter opacity-50">Energía</p>
                      <p className="font-black">{(nivelSeleccionado.pct_energia * 100).toFixed(0)}%</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[8px] font-black uppercase tracking-tighter opacity-50">Segur.</p>
                      <p className="font-black">€{nivelSeleccionado.fijo_seguridad}</p>
                    </div>
                  </motion.div>
                )}
              </div>
            </div>
          </motion.div>

          {/* Columna 2: Gestión y Fiscalidad */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="space-y-8"
          >
            <div className="flex items-center gap-4 pb-4 border-b border-slate-200 dark:border-white/5">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                <Building2 className="w-5 h-5 text-emerald-500" />
              </div>
              <h3 className="text-xs font-black uppercase tracking-[3px] text-slate-500">Configuración Legal</h3>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tipo Fiscal Maestro</Label>
                  <Select
                    value={draft.tipo_fiscal}
                    onChange={(e) => setDraft((d) => ({ ...d, tipo_fiscal: e.target.value }))}
                  >
                    <option value="AUTONOMO">Autónomo</option>
                    <option value="AUTONOMO_ESPECIAL">Autónomo Especial</option>
                    <option value="EMPRESA">Empresa</option>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Zona de Operación</Label>
                  <Select
                    value={draft.zona_id}
                    onChange={(e) => setDraft((d) => ({ ...d, zona_id: e.target.value }))}
                  >
                    <option value="">Zona Nacional / Global</option>
                    {zonasDisponibles.map((zona) => (
                      <option key={zona.id} value={zona.id}>
                        {zona.nombre || zona.codigo || zona.id}
                      </option>
                    ))}
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 p-6 rounded-[2rem] bg-emerald-500/5 border border-emerald-500/10">
                <div className="space-y-2">
                  <Label>Fecha Alta *</Label>
                  <Input
                    type="date"
                    icon={Calendar}
                    value={draft.fecha_alta}
                    onChange={(e) => setDraft((d) => ({ ...d, fecha_alta: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Estado Agente</Label>
                  <Select
                    value={draft.estado}
                    onChange={(e) => setDraft((d) => ({ ...d, estado: e.target.value }))}
                  >
                    <option value="ACTIVO">Activo</option>
                    <option value="INACTIVO">Inactivo</option>
                    <option value="SUSPENDIDO">Suspendido</option>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Fecha Baja (Si procede)</Label>
                <Input
                  type="date"
                  icon={Calendar}
                  value={draft.fecha_baja}
                  onChange={(e) => setDraft((d) => ({ ...d, fecha_baja: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label>Notas de Seguimiento HR</Label>
                <TextArea
                  placeholder="Detalles contractuales, acuerdos previos..."
                  className="rounded-3xl"
                  rows={4}
                  value={draft.observaciones}
                  onChange={(e) => setDraft((d) => ({ ...d, observaciones: e.target.value }))}
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-white/5">
                <Button variant="secondary" onClick={onClose} className="rounded-2xl px-8">Cancelar</Button>
                <Button variant="primary" onClick={handleSave} icon={Save} className="rounded-2xl px-10">Guardar Agente</Button>
              </div>
            </div>
          </motion.div>

          {/* Columna 3: Comisiones Personalizadas */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-8"
          >
            <div className="flex items-center gap-4 pb-4 border-b border-slate-200 dark:border-white/5">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                <Percent className="w-5 h-5 text-purple-500" />
              </div>
              <h3 className="text-xs font-black uppercase tracking-[3px] text-slate-500">Esquema Especial</h3>
            </div>

            <div className="space-y-6">
              <div
                onClick={() => setDraft(d => ({ ...d, comision_personalizada_activa: !d.comision_personalizada_activa }))}
                className={cn(
                  "p-6 rounded-[2.5rem] border-2 border-dashed transition-all cursor-pointer flex flex-col items-center text-center gap-4",
                  draft.comision_personalizada_activa
                    ? "bg-purple-500/10 border-purple-500 border-solid shadow-xl shadow-purple-500/10"
                    : "bg-slate-50 dark:bg-white/[0.02] border-slate-200 dark:border-white/10 opacity-60 hover:opacity-100"
                )}
              >
                <div className={cn(
                  "w-14 h-14 rounded-[1.5rem] flex items-center justify-center shadow-lg transition-transform",
                  draft.comision_personalizada_activa ? "bg-purple-500 text-white rotate-6" : "bg-slate-200 dark:bg-slate-800 text-slate-400"
                )}>
                  <Zap className="w-7 h-7" />
                </div>
                <div>
                  <h4 className="font-black text-sm uppercase tracking-wide">Liquidez Personalizada</h4>
                  <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-widest font-bold">
                    {draft.comision_personalizada_activa ? "Override del Nivel Activo" : "Usando Valores del Nivel"}
                  </p>
                </div>
              </div>

              <AnimatePresence>
                {draft.comision_personalizada_activa && (
                  <motion.div
                    initial={{ opacity: 0, height: 0, scale: 0.95 }}
                    animate={{ opacity: 1, height: 'auto', scale: 1 }}
                    exit={{ opacity: 0, height: 0, scale: 0.95 }}
                    className="space-y-6 overflow-hidden"
                  >
                    <div className="space-y-4 p-6 rounded-[2rem] bg-blue-500/5 border border-blue-500/10">
                      <Label className="flex items-center gap-2"><Phone className="w-3.5 h-3.5" /> Telefonía</Label>
                      <div className="grid grid-cols-2 gap-3">
                        <Select value={draft.telefonia_tipo} onChange={(e) => setDraft(d => ({ ...d, telefonia_tipo: e.target.value }))}>
                          <option value="porcentaje">Porcentaje %</option>
                          <option value="fijo">Importe Fijo €</option>
                        </Select>
                        <Input type="number" step="0.01" value={draft.telefonia_valor} onChange={(e) => setDraft(d => ({ ...d, telefonia_valor: parseFloat(e.target.value) || 0 }))} />
                      </div>
                    </div>

                    <div className="space-y-4 p-6 rounded-[2rem] bg-amber-500/5 border border-amber-500/10">
                      <Label className="flex items-center gap-2"><Zap className="w-3.5 h-3.5" /> Energía</Label>
                      <div className="grid grid-cols-2 gap-3">
                        <Select value={draft.energia_tipo} onChange={(e) => setDraft(d => ({ ...d, energia_tipo: e.target.value }))}>
                          <option value="porcentaje">Porcentaje %</option>
                          <option value="fijo">Importe Fijo €</option>
                        </Select>
                        <Input type="number" step="0.01" value={draft.energia_valor} onChange={(e) => setDraft(d => ({ ...d, energia_valor: parseFloat(e.target.value) || 0 }))} />
                      </div>
                    </div>

                    <div className="space-y-4 p-6 rounded-[2rem] bg-emerald-500/5 border border-emerald-500/10">
                      <Label className="flex items-center gap-2"><Shield className="w-3.5 h-3.5" /> Seguridad</Label>
                      <div className="grid grid-cols-2 gap-3">
                        <Select value={draft.seguridad_tipo} onChange={(e) => setDraft(d => ({ ...d, seguridad_tipo: e.target.value }))}>
                          <option value="fijo">Importe Fijo €</option>
                          <option value="porcentaje">Porcentaje %</option>
                        </Select>
                        <Input type="number" step="0.01" value={draft.seguridad_valor} onChange={(e) => setDraft(d => ({ ...d, seguridad_valor: parseFloat(e.target.value) || 0 }))} />
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="p-10 rounded-[2.5rem] bg-indigo-500/5 border border-indigo-500/10 flex flex-col items-center text-center">
                <Briefcase className="w-10 h-10 text-indigo-500/30 mb-4" />
                <p className="text-[10px] font-black uppercase tracking-[3px] text-slate-400 mb-2">Resumen Contractual</p>
                <p className="text-xs font-bold text-slate-500 max-w-[200px] leading-relaxed">
                  Asegúrese de validar el CIF y la fecha de alta antes de proceder con el registro maestro.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </form>
    </Modal>
  );
}
