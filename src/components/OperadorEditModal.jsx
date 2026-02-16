import React, { useState } from "react";
import { X, Settings, Percent, Building2, User, Phone, Mail, FileText, LayoutGrid, Save, AlertCircle, TrendingDown, Clock, Tag, TrendingUp } from "lucide-react";
import Modal from "./ui/Modal";
import { Input, Select, Label, Button, TextArea } from "./ui/FormElements";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "../lib/utils";

export default function OperadorEditModal({ operador, onSave, onClose }) {
  const [draft, setDraft] = useState(
    operador ? {
      ...operador,
      reglas_decomision: operador.reglas_decomision || {
        antes_6_meses: 100,
        despues_6_meses: 50,
        limite_meses: 6
      }
    } : {
      nombre: "",
      sector: "telefonia",
      codigo: "",
      contacto: "",
      telefono: "",
      email: "",
      fecha_alta: "",
      fecha_baja: "",
      observaciones: "",
      reglas_decomision: {
        antes_6_meses: 100,
        despues_6_meses: 50,
        limite_meses: 6
      },
      historial: [],
    }
  );

  const [error, setError] = useState("");

  const handleSave = (e) => {
    if (e) e.preventDefault();

    if (!draft.nombre?.trim()) {
      setError("El nombre del operador es obligatorio");
      return;
    }

    const { antes_6_meses, despues_6_meses, limite_meses } = draft.reglas_decomision;
    if (antes_6_meses < 0 || antes_6_meses > 100) {
      setError("El porcentaje antes del límite debe estar entre 0 y 100");
      return;
    }
    if (despues_6_meses < 0 || despues_6_meses > 100) {
      setError("El porcentaje después del límite debe estar entre 0 y 100");
      return;
    }
    if (limite_meses < 1 || limite_meses > 24) {
      setError("El límite de meses debe estar entre 1 y 24");
      return;
    }

    let operadorId = draft.id || `op-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

    const cleanedData = {
      ...draft,
      id: operadorId,
      nombre: draft.nombre.trim(),
      codigo: draft.codigo?.trim().toUpperCase() || "",
      contacto: draft.contacto?.trim() || "",
      email: draft.email?.trim() || "",
      telefono: draft.telefono?.trim() || "",
      reglas_decomision: {
        antes_6_meses: Number(draft.reglas_decomision.antes_6_meses) || 100,
        despues_6_meses: Number(draft.reglas_decomision.despues_6_meses) || 50,
        limite_meses: Number(draft.reglas_decomision.limite_meses) || 6
      }
    };

    onSave(cleanedData, true);
  };

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={operador ? "Configurar Partner Master" : "Nuevo Partner Maestro"}
      subtitle={operador ? `EXP: ${operador.id?.slice(0, 8)}` : "Nueva Homologación"}
      icon={Building2}
      iconColor="text-emerald-500"
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
          {/* Columna 1: Identificación y Sector */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-8"
          >
            <div className="flex items-center gap-4 pb-4 border-b border-slate-200 dark:border-white/5">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                <Tag className="w-5 h-5 text-emerald-500" />
              </div>
              <h3 className="text-xs font-black uppercase tracking-[3px] text-slate-500">Identificación Maestro</h3>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <Label>Nombre Comercial *</Label>
                <Input
                  icon={Building2}
                  placeholder="Ej: Vodafone Business"
                  value={draft.nombre}
                  onChange={(e) => setDraft((d) => ({ ...d, nombre: e.target.value }))}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Sector Actividad</Label>
                  <Select
                    value={draft.sector}
                    onChange={(e) => setDraft((d) => ({ ...d, sector: e.target.value }))}
                  >
                    <option value="telefonia">Telefonía</option>
                    <option value="energia">Energía</option>
                    <option value="seguridad">Seguridad</option>
                    <option value="internet">Internet</option>
                    <option value="seguros">Seguros</option>
                    <option value="otros">Otros</option>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Código Interno</Label>
                  <Input
                    icon={FileText}
                    placeholder="COD-X"
                    value={draft.codigo}
                    onChange={(e) => setDraft((d) => ({ ...d, codigo: e.target.value }))}
                  />
                </div>
              </div>

              <div className="p-8 rounded-[2.5rem] bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 flex flex-col items-center text-center gap-4">
                <div className="w-16 h-16 rounded-[2rem] bg-emerald-500/10 flex items-center justify-center">
                  <LayoutGrid className="w-8 h-8 text-emerald-500" />
                </div>
                <div>
                  <h4 className="font-black text-sm uppercase tracking-wider">Gestión de Catálogo</h4>
                  <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-widest font-bold leading-relaxed">
                    Este partner agrupa todos los productos asociados a su sector.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Columna 2: Contacto Corporativo */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="space-y-8"
          >
            <div className="flex items-center gap-4 pb-4 border-b border-slate-200 dark:border-white/5">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                <User className="w-5 h-5 text-blue-500" />
              </div>
              <h3 className="text-xs font-black uppercase tracking-[3px] text-slate-500">Contacto Directo</h3>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <Label>Gestor de Cuenta</Label>
                <Input
                  icon={User}
                  placeholder="Nombre del Account Manager"
                  value={draft.contacto}
                  onChange={(e) => setDraft((d) => ({ ...d, contacto: e.target.value }))}
                />
              </div>

              <div className="space-y-4 p-6 rounded-[2rem] bg-blue-500/5 border border-blue-500/10">
                <div className="space-y-2">
                  <Label className="text-[10px] text-blue-500">Email Soporte</Label>
                  <Input
                    icon={Mail}
                    type="email"
                    placeholder="soporte@operador.com"
                    value={draft.email}
                    onChange={(e) => setDraft((d) => ({ ...d, email: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] text-blue-500">Teléfono Canal</Label>
                  <Input
                    icon={Phone}
                    placeholder="+34 900 ..."
                    value={draft.telefono}
                    onChange={(e) => setDraft((d) => ({ ...d, telefono: e.target.value }))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Observaciones Master</Label>
                <TextArea
                  placeholder="Notas internas sobre el acuerdo o niveles de servicio..."
                  className="rounded-3xl"
                  rows={4}
                  value={draft.observaciones}
                  onChange={(e) => setDraft((d) => ({ ...d, observaciones: e.target.value }))}
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-white/5">
                <Button variant="secondary" onClick={onClose} className="rounded-2xl px-8">Cancelar</Button>
                <Button variant="primary" onClick={handleSave} icon={Save} className="rounded-2xl px-10">Guardar Partner</Button>
              </div>
            </div>
          </motion.div>

          {/* Columna 3: Reglas de Decomisión */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-8"
          >
            <div className="flex items-center gap-4 pb-4 border-b border-slate-200 dark:border-white/5">
              <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center">
                <Percent className="w-5 h-5 text-orange-500" />
              </div>
              <h3 className="text-xs font-black uppercase tracking-[3px] text-slate-500">Reglas de Decomisión</h3>
            </div>

            <div className="space-y-6">
              <div className="p-8 rounded-[2.5rem] bg-orange-500/5 border border-orange-500/10 space-y-6 shadow-xl shadow-orange-500/5">
                <div className="flex items-center gap-3 mb-2">
                  <Settings className="w-4 h-4 text-orange-500 animate-spin-slow" />
                  <p className="text-[10px] font-black uppercase tracking-widest text-orange-600">Configuración Crítica</p>
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px]">Límite de Fidelidad (Meses)</Label>
                  <Input
                    type="number"
                    min="1"
                    max="24"
                    icon={Clock}
                    className="text-xl font-black"
                    value={draft.reglas_decomision.limite_meses}
                    onChange={(e) => setDraft((d) => ({ ...d, reglas_decomision: { ...d.reglas_decomision, limite_meses: e.target.value } }))}
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 pt-4">
                  <div className="space-y-4 p-5 rounded-2xl bg-white/50 dark:bg-white/[0.02] border border-orange-200/50 dark:border-white/5">
                    <Label className="text-[10px] flex items-center gap-2">
                      <TrendingDown className="w-3 h-3 text-rose-500" />
                      Antes de {draft.reglas_decomision.limite_meses} meses
                    </Label>
                    <div className="flex items-center gap-4">
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        className="text-lg font-black text-rose-500"
                        value={draft.reglas_decomision.antes_6_meses}
                        onChange={(e) => setDraft((d) => ({ ...d, reglas_decomision: { ...d.reglas_decomision, antes_6_meses: e.target.value } }))}
                      />
                      <span className="text-xl font-black text-rose-500/50">%</span>
                    </div>
                  </div>

                  <div className="space-y-4 p-5 rounded-2xl bg-white/50 dark:bg-white/[0.02] border border-orange-200/50 dark:border-white/5">
                    <Label className="text-[10px] flex items-center gap-2">
                      <TrendingUp className="w-3 h-3 text-emerald-500" />
                      Después de {draft.reglas_decomision.limite_meses} meses
                    </Label>
                    <div className="flex items-center gap-4">
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        className="text-lg font-black text-emerald-500"
                        value={draft.reglas_decomision.despues_6_meses}
                        onChange={(e) => setDraft((d) => ({ ...d, reglas_decomision: { ...d.reglas_decomision, despues_6_meses: e.target.value } }))}
                      />
                      <span className="text-xl font-black text-emerald-500/50">%</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-10 rounded-[2.5rem] bg-blue-500/5 border border-dashed border-blue-500/20 text-center opacity-60">
                <Info className="w-10 h-10 text-blue-500/50 mx-auto mb-4" />
                <p className="text-[9px] font-black uppercase tracking-widest leading-relaxed">
                  Los porcentajes de decomisión regulan el retorno de comisiones en caso de bajas prematuras del cliente.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </form>
    </Modal>
  );
}
