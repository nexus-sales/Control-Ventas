import React, { useState } from 'react';
import { X, User, Building2, Percent, Phone, MapPin, Shield, Save, Zap } from 'lucide-react';

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

  const calcularIRPF = (tipo_fiscal, fecha_alta, cif_dni = "") => {
    const esCIF = cif_dni.toUpperCase().match(/^[ABCDEFGHJNPQRSUVW]/);
    if (esCIF || tipo_fiscal === "EMPRESA") return 0;
    if (tipo_fiscal === "AUTONOMO_ESPECIAL") return 0;
    if (tipo_fiscal === "AUTONOMO") {
      const fechaAlta = new Date(fecha_alta);
      const ahora = new Date();
      const añosTranscurridos = (ahora - fechaAlta) / (1000 * 60 * 60 * 24 * 365);
      return añosTranscurridos < 2 ? 7 : 15;
    }
    return 0;
  };

  const handleSave = () => {
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
      irpf_calculado: calcularIRPF(draft.tipo_fiscal, draft.fecha_alta, draft.cif_dni),
      exento_impuestos: draft.tipo_fiscal === "AUTONOMO_ESPECIAL",
      fecha_baja: draft.fecha_baja || null,
    };
    
    onSave(cleanedData, true);
  };

  const nivelSeleccionado = niveles.find(n => n.id === draft.nivel);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-5xl max-h-[90vh] overflow-y-auto relative">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-2 hover:bg-slate-100 rounded-full"
        >
          <X className="w-5 h-5 text-slate-500" />
        </button>

        <h2 className="text-xl font-bold mb-6 text-slate-800 flex items-center gap-2">
          <User className="w-6 h-6 text-sky-600" />
          {colaborador ? `Editar: ${colaborador.nombre}` : 'Nuevo Colaborador'}
        </h2>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Datos básicos */}
        <div className="grid md:grid-cols-2 gap-4 mb-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Nombre completo *</label>
            <input
              className="border border-slate-200 rounded-xl px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-sky-400"
              value={draft.nombre}
              onChange={(e) => {
                setDraft((d) => ({ ...d, nombre: e.target.value }));
                setError("");
              }}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">CIF/DNI</label>
            <input
              className="border border-slate-200 rounded-xl px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-sky-400"
              placeholder="12345678Z o B12345678"
              value={draft.cif_dni}
              onChange={(e) => setDraft((d) => ({ ...d, cif_dni: e.target.value }))}
            />
          </div>
        </div>

        {/* Nivel y tipo fiscal */}
        <div className="grid md:grid-cols-2 gap-4 mb-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Nivel de Comisión *</label>
            <select
              className="border border-slate-200 rounded-xl px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-sky-400"
              value={draft.nivel}
              onChange={(e) => {
                setDraft((d) => ({ ...d, nivel: e.target.value }));
                setError("");
              }}
            >
              <option value="">Selecciona un nivel</option>
              {niveles.map((nivel) => (
                <option key={nivel.id} value={nivel.id}>
                  {nivel.nombre} ({nivel.id})
                </option>
              ))}
            </select>
            {nivelSeleccionado && (
              <div className="text-xs text-slate-600 bg-slate-50 p-2 rounded">
                <div className="flex gap-4">
                  <span>📞 {(nivelSeleccionado.pct_telefonia * 100).toFixed(0)}%</span>
                  <span>⚡ {(nivelSeleccionado.pct_energia * 100).toFixed(0)}%</span>
                  <span>🛡️ €{nivelSeleccionado.fijo_seguridad}</span>
                </div>
              </div>
            )}
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Tipo Fiscal</label>
            <select
              className="border border-slate-200 rounded-xl px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-sky-400"
              value={draft.tipo_fiscal}
              onChange={(e) => setDraft((d) => ({ ...d, tipo_fiscal: e.target.value }))}
            >
              <option value="AUTONOMO">Autónomo</option>
              <option value="AUTONOMO_ESPECIAL">Autónomo Especial</option>
              <option value="EMPRESA">Empresa</option>
            </select>
          </div>
        </div>

        {/* Fechas y estado */}
        <div className="grid md:grid-cols-3 gap-4 mb-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Fecha de alta *</label>
            <input
              className="border border-slate-200 rounded-xl px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-sky-400"
              type="date"
              value={draft.fecha_alta}
              onChange={(e) => setDraft((d) => ({ ...d, fecha_alta: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Fecha de baja</label>
            <input
              className="border border-slate-200 rounded-xl px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-sky-400"
              type="date"
              value={draft.fecha_baja}
              onChange={(e) => setDraft((d) => ({ ...d, fecha_baja: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Estado</label>
            <select
              className="border border-slate-200 rounded-xl px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-sky-400"
              value={draft.estado}
              onChange={(e) => setDraft((d) => ({ ...d, estado: e.target.value }))}
            >
              <option value="ACTIVO">Activo</option>
              <option value="INACTIVO">Inactivo</option>
              <option value="SUSPENDIDO">Suspendido</option>
            </select>
          </div>
        </div>

        {/* Información de contacto */}
        <div className="mb-6 p-4 bg-slate-50 border border-slate-200 rounded-xl">
          <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <Phone className="w-4 h-4" />
            Información de Contacto
          </h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Teléfono</label>
              <input
                className="border border-slate-200 rounded-xl px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-sky-400"
                placeholder="600123456"
                value={draft.telefono}
                onChange={(e) => setDraft((d) => ({ ...d, telefono: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Email</label>
              <input
                className="border border-slate-200 rounded-xl px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-sky-400"
                placeholder="colaborador@email.com"
                type="email"
                value={draft.email}
                onChange={(e) => setDraft((d) => ({ ...d, email: e.target.value }))}
              />
            </div>
          </div>
          <div className="space-y-2 mt-4">
            <label className="text-sm font-medium text-slate-700">Dirección</label>
            <input
              className="border border-slate-200 rounded-xl px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-sky-400"
              placeholder="Calle, número, ciudad, código postal"
              value={draft.direccion}
              onChange={(e) => setDraft((d) => ({ ...d, direccion: e.target.value }))}
            />
          </div>
        </div>

        {/* Zona */}
        {zonas.length > 0 && (
          <div className="mb-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Zona de trabajo
              </label>
              <select
                className="border border-slate-200 rounded-xl px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-sky-400"
                value={draft.zona_id}
                onChange={(e) => setDraft((d) => ({ ...d, zona_id: e.target.value }))}
              >
                <option value="">Sin asignar</option>
                {zonas.map((zona) => (
                  <option key={zona.id} value={zona.id}>
                    {zona.nombre}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Comisiones personalizadas */}
        <div className="mb-6 p-4 bg-slate-50 border border-slate-200 rounded-xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-800 flex items-center gap-2">
              <Percent className="w-4 h-4" />
              Comisiones Personalizadas
            </h3>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={draft.comision_personalizada_activa}
                onChange={(e) => setDraft((d) => ({ ...d, comision_personalizada_activa: e.target.checked }))}
                className="rounded"
              />
              <span className="text-sm text-slate-700">Activar comisiones personalizadas</span>
            </label>
          </div>

          {draft.comision_personalizada_activa && (
            <div className="grid md:grid-cols-3 gap-4">
              {/* Telefonía */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                  <Phone className="w-4 h-4 text-blue-600" />
                  Telefonía
                </label>
                <select
                  className="border border-slate-200 rounded-xl px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-sky-400"
                  value={draft.telefonia_tipo}
                  onChange={(e) => setDraft((d) => ({ ...d, telefonia_tipo: e.target.value }))}
                >
                  <option value="porcentaje">Porcentaje</option>
                  <option value="fijo">Importe fijo</option>
                </select>
                <input
                  className="border border-slate-200 rounded-xl px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-sky-400"
                  type="number"
                  step="0.01"
                  placeholder={draft.telefonia_tipo === 'porcentaje' ? '0.05' : '50'}
                  value={draft.telefonia_valor}
                  onChange={(e) => setDraft((d) => ({ ...d, telefonia_valor: parseFloat(e.target.value) || 0 }))}
                />
              </div>

              {/* Energía */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-yellow-600" />
                  Energía
                </label>
                <select
                  className="border border-slate-200 rounded-xl px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-sky-400"
                  value={draft.energia_tipo}
                  onChange={(e) => setDraft((d) => ({ ...d, energia_tipo: e.target.value }))}
                >
                  <option value="porcentaje">Porcentaje</option>
                  <option value="fijo">Importe fijo</option>
                </select>
                <input
                  className="border border-slate-200 rounded-xl px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-sky-400"
                  type="number"
                  step="0.01"
                  placeholder={draft.energia_tipo === 'porcentaje' ? '0.05' : '50'}
                  value={draft.energia_valor}
                  onChange={(e) => setDraft((d) => ({ ...d, energia_valor: parseFloat(e.target.value) || 0 }))}
                />
              </div>

              {/* Seguridad */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-green-600" />
                  Seguridad
                </label>
                <select
                  className="border border-slate-200 rounded-xl px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-sky-400"
                  value={draft.seguridad_tipo}
                  onChange={(e) => setDraft((d) => ({ ...d, seguridad_tipo: e.target.value }))}
                >
                  <option value="fijo">Importe fijo</option>
                  <option value="porcentaje">Porcentaje</option>
                </select>
                <input
                  className="border border-slate-200 rounded-xl px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-sky-400"
                  type="number"
                  step="0.01"
                  placeholder={draft.seguridad_tipo === 'fijo' ? '250' : '0.15'}
                  value={draft.seguridad_valor}
                  onChange={(e) => setDraft((d) => ({ ...d, seguridad_valor: parseFloat(e.target.value) || 0 }))}
                />
              </div>
            </div>
          )}
        </div>

        {/* Observaciones */}
        <div className="space-y-2 mb-6">
          <label className="text-sm font-medium text-slate-700">Observaciones</label>
          <textarea
            className="border border-slate-200 rounded-xl px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-sky-400"
            rows="3"
            placeholder="Notas adicionales sobre el colaborador..."
            value={draft.observaciones}
            onChange={(e) => setDraft((d) => ({ ...d, observaciones: e.target.value }))}
          />
        </div>

        {/* Botones */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-slate-300 rounded-xl text-slate-600 hover:bg-slate-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-gradient-to-r from-sky-500 to-sky-600 text-white rounded-xl hover:from-sky-600 hover:to-sky-700 flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            Guardar Colaborador
          </button>
        </div>
      </div>
    </div>
  );
}
