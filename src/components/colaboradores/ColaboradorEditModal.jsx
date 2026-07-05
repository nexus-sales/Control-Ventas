import React, { useEffect, useMemo, useState } from 'react';
import { X, User, Building2, Percent, Phone, MapPin, Shield, Save, Zap, Mail, Calendar, Briefcase, FileText, AlertCircle } from 'lucide-react';
import Modal from "../ui/Modal";
import { Input, Select, Label, Button, TextArea } from "../ui/FormElements";
import { motion } from 'framer-motion';
import { getIrpfPct, normalizeFactor, getColaboradorNivelId } from '../../utils/calculos';
import { useAuth } from '../../context/AppContexts';
import { supabase } from '../../lib/supabase';

export default function ColaboradorEditModal({ colaborador, onSave, onClose, niveles, zonas = [] }) {
  const { isAdmin } = useAuth();
  // El fetch general de colaboradores ya no trae `direccion` (hallazgo MEDIO
  // Auditor: over-fetching de PII). `direccion` NUNCA viaja por el guardado
  // general (setColaboradores hace upsert de todo el array de golpe; si solo
  // el registro editado incluyera esta columna y el resto no, arriesgamos
  // corromper el upsert o vaciar la dirección de todo el equipo). Un admin
  // editando un colaborador existente la guarda con una llamada aparte, de una
  // sola fila — nunca se ofrece al crear un colaborador nuevo (para no tener
  // que orquestar "crear, luego parchear" con un id que aún no existe).
  const [direccionCargada, setDireccionCargada] = useState(false);

  const [draft, setDraft] = useState(
    colaborador ? {
      ...colaborador,
      // nivel_id es el nombre real de la columna en colaboradores_cv. Antes
      // este formulario guardaba "nivel" — se lee con fallback para no perder
      // la asignación de colaboradores ya guardados en local con ese nombre.
      nivel_id: getColaboradorNivelId(colaborador),
      tipo_fiscal: colaborador.tipo_fiscal || "AUTONOMO",
      zona_id: colaborador.zona_id || "",
      telefono: colaborador.telefono || "",
      email: colaborador.email || "",
      cif_dni: colaborador.cif_dni || "",
      direccion: colaborador.direccion || "",
      estado: colaborador.estado || "ACTIVO",
      fecha_baja: colaborador.fecha_baja || "",
      observaciones: colaborador.observaciones || "",
      // pct_telefonia/pct_energia/fijo_seguridad son las columnas reales que
      // lee getColaboradorComision (calculos.js) para el override por
      // sector de este colaborador sobre los valores de su nivel — no
      // "telefonia_tipo/telefonia_valor/..." (nombres que no existen en
      // colaboradores_cv, así que el panel de "Esquema Especial" nunca
      // había tenido ningún efecto real). El tipo no es elegible: Telefonía/
      // Energía siempre son % y Seguridad siempre importe fijo, igual que en
      // los niveles.
      pct_telefonia: colaborador.pct_telefonia ?? "",
      pct_energia: colaborador.pct_energia ?? "",
      fijo_seguridad: colaborador.fijo_seguridad ?? "",
    } : {
      nombre: "",
      nivel_id: niveles.length > 0 ? niveles[0].id : "",
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
      pct_telefonia: "",
      pct_energia: "",
      fijo_seguridad: "",
    }
  );

  const [error, setError] = useState("");

  useEffect(() => {
    if (!colaborador?.id || !isAdmin) return;
    let cancelado = false;
    supabase
      .from('colaboradores_cv')
      .select('direccion')
      .eq('id', colaborador.id)
      .single()
      .then(({ data, error: fetchError }) => {
        if (cancelado || fetchError) return;
        setDraft((d) => ({ ...d, direccion: data?.direccion || '' }));
        setDireccionCargada(true);
      });
    return () => { cancelado = true; };
  }, [colaborador?.id, isAdmin]);

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
    if (!draft.nivel_id) {
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
      observaciones: draft.observaciones?.trim() || "",
      // pct_colaborador (resto de un modelo de comisión única anterior al
      // actual por sector) no tiene ningún <input> en este formulario ni lo
      // lee getColaboradorComision (calculos.js) — se deja de tocar aquí en
      // vez de seguir arrastrándolo sin uso en cada guardado.
      pct_telefonia: draft.pct_telefonia === "" ? null : Number(draft.pct_telefonia),
      pct_energia: draft.pct_energia === "" ? null : Number(draft.pct_energia),
      fijo_seguridad: draft.fijo_seguridad === "" ? null : Number(draft.fijo_seguridad),
      irpf_calculado: calcularIrpfFicha(draft.tipo_fiscal, draft.fecha_alta, draft.cif_dni),
      exento_impuestos: (() => {
        const tipo = normalizarTipoFiscal(draft.tipo_fiscal);
        const esCIF = draft.cif_dni?.toUpperCase().match(/^[ABCDEFGHJNPQRSUVW]/);
        return tipo === "AUTONOMO_ESPECIAL" || tipo === "EMPRESA" || Boolean(esCIF);
      })(),
      fecha_baja: draft.fecha_baja || null,
    };
    // direccion nunca viaja por aquí — ver comentario junto a direccionCargada.
    delete cleanedData.direccion;
    // Si colaborador ya traía el campo antiguo "nivel"/"nivelId" (datos locales
    // previos a este fix), el spread de ...draft los habría colado aquí — se
    // quitan explícitamente para que solo viaje nivel_id, el nombre real de
    // la columna en Supabase.
    delete cleanedData.nivel;
    delete cleanedData.nivelId;

    if (isAdmin && colaborador?.id && direccionCargada) {
      supabase
        .from('colaboradores_cv')
        .update({ direccion: draft.direccion?.trim() || null })
        .eq('id', colaborador.id)
        .then(({ error: updateError }) => {
          if (updateError) console.error('Error guardando dirección:', updateError);
        });
    }

    onSave(cleanedData, true);
  };

  const nivelSeleccionado = niveles.find(n => n.id === draft.nivel_id);

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
                {colaborador?.id && isAdmin && (
                  <div className="space-y-2">
                    <Label>Localización y Envío</Label>
                    <Input
                      icon={MapPin}
                      placeholder={direccionCargada ? "Dirección fiscal completa" : "Cargando..."}
                      value={draft.direccion || ''}
                      disabled={!direccionCargada}
                      onChange={(e) => setDraft((d) => ({ ...d, direccion: e.target.value }))}
                    />
                  </div>
                )}
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
                  value={draft.nivel_id}
                  onChange={(e) => setDraft((d) => ({ ...d, nivel_id: e.target.value }))}
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
                      <p className="font-black">{((normalizeFactor(nivelSeleccionado.pct_telefonia) ?? 0) * 100).toFixed(0)}%</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[8px] font-black uppercase tracking-tighter opacity-50">Energía</p>
                      <p className="font-black">{((normalizeFactor(nivelSeleccionado.pct_energia) ?? 0) * 100).toFixed(0)}%</p>
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
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Deja un campo en blanco para que este colaborador use el valor de su nivel ({nivelSeleccionado?.nombre || "sin nivel"}). Rellénalo solo para forzar un valor distinto para él.
              </p>

              <div className="space-y-4 p-6 rounded-[2rem] bg-blue-500/5 border border-blue-500/10">
                <Label className="flex items-center gap-2"><Phone className="w-3.5 h-3.5" /> Telefonía (%)</Label>
                <Input
                  type="number" step="0.01" min="0"
                  placeholder={`Nivel: ${((normalizeFactor(nivelSeleccionado?.pct_telefonia) ?? 0) * 100).toFixed(0)}%`}
                  value={draft.pct_telefonia}
                  onChange={(e) => setDraft(d => ({ ...d, pct_telefonia: e.target.value }))}
                />
              </div>

              <div className="space-y-4 p-6 rounded-[2rem] bg-amber-500/5 border border-amber-500/10">
                <Label className="flex items-center gap-2"><Zap className="w-3.5 h-3.5" /> Energía (%)</Label>
                <Input
                  type="number" step="0.01" min="0"
                  placeholder={`Nivel: ${((normalizeFactor(nivelSeleccionado?.pct_energia) ?? 0) * 100).toFixed(0)}%`}
                  value={draft.pct_energia}
                  onChange={(e) => setDraft(d => ({ ...d, pct_energia: e.target.value }))}
                />
              </div>

              <div className="space-y-4 p-6 rounded-[2rem] bg-emerald-500/5 border border-emerald-500/10">
                <Label className="flex items-center gap-2"><Shield className="w-3.5 h-3.5" /> Seguridad (€ fijo)</Label>
                <Input
                  type="number" step="0.01" min="0"
                  placeholder={`Nivel: €${nivelSeleccionado?.fijo_seguridad ?? 0}`}
                  value={draft.fijo_seguridad}
                  onChange={(e) => setDraft(d => ({ ...d, fijo_seguridad: e.target.value }))}
                />
              </div>

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
