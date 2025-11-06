import React from "react";

export default function EmpresaForm({ empresa, onChange }) {
  return (
    <form className="grid md:grid-cols-2 gap-6 bg-white/80 dark:bg-darkCard/80 backdrop-blur-md rounded-2xl border border-slate-200 dark:border-darkAccent/30 shadow p-6 transition-colors">
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-darkText mb-1">Nombre de la empresa</label>
        <input className="w-full border border-slate-200 dark:border-darkAccent/30 rounded-xl px-3 py-2 bg-white dark:bg-darkCard shadow-sm focus:ring-2 focus:ring-purple-400 dark:focus:ring-darkAccent" value={empresa.nombre} onChange={e => onChange({ nombre: e.target.value })} />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-darkText mb-1">CIF/NIF</label>
        <input className="w-full border border-slate-200 dark:border-darkAccent/30 rounded-xl px-3 py-2 bg-white dark:bg-darkCard shadow-sm focus:ring-2 focus:ring-purple-400 dark:focus:ring-darkAccent" value={empresa.cif} onChange={e => onChange({ cif: e.target.value })} />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-darkText mb-1">Dirección</label>
        <input className="w-full border border-slate-200 dark:border-darkAccent/30 rounded-xl px-3 py-2 bg-white dark:bg-darkCard shadow-sm focus:ring-2 focus:ring-purple-400 dark:focus:ring-darkAccent" value={empresa.direccion} onChange={e => onChange({ direccion: e.target.value })} />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-darkText mb-1">Teléfono</label>
        <input className="w-full border border-slate-200 dark:border-darkAccent/30 rounded-xl px-3 py-2 bg-white dark:bg-darkCard shadow-sm focus:ring-2 focus:ring-purple-400 dark:focus:ring-darkAccent" value={empresa.telefono} onChange={e => onChange({ telefono: e.target.value })} />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-darkText mb-1">Email</label>
        <input className="w-full border border-slate-200 dark:border-darkAccent/30 rounded-xl px-3 py-2 bg-white dark:bg-darkCard shadow-sm focus:ring-2 focus:ring-purple-400 dark:focus:ring-darkAccent" value={empresa.email} onChange={e => onChange({ email: e.target.value })} />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-darkText mb-1">Web</label>
        <input className="w-full border border-slate-200 dark:border-darkAccent/30 rounded-xl px-3 py-2 bg-white dark:bg-darkCard shadow-sm focus:ring-2 focus:ring-purple-400 dark:focus:ring-darkAccent" value={empresa.web} onChange={e => onChange({ web: e.target.value })} />
      </div>
    </form>
  );
}
