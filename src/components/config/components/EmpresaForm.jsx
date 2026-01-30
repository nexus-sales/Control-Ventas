import React from "react";

const EmpresaForm = React.memo(({ empresa, onChange }) => (
    <form className="grid md:grid-cols-2 gap-6 bg-white/80 dark:bg-gray-800/80 backdrop-blur-md rounded-2xl border border-slate-200 dark:border-gray-700 shadow-sm p-6 transition-colors">
        <div className="space-y-1">
            <label className="block text-sm font-semibold text-slate-700 dark:text-gray-300">Nombre de la empresa</label>
            <input
                className="w-full border border-slate-200 dark:border-gray-700 rounded-xl px-3 py-2.5 bg-white dark:bg-gray-900 shadow-sm focus:ring-2 focus:ring-purple-400 outline-none transition-all"
                value={empresa.nombre}
                onChange={e => onChange({ nombre: e.target.value })}
            />
        </div>
        <div className="space-y-1">
            <label className="block text-sm font-semibold text-slate-700 dark:text-gray-300">CIF / NIF</label>
            <input
                className="w-full border border-slate-200 dark:border-gray-700 rounded-xl px-3 py-2.5 bg-white dark:bg-gray-900 shadow-sm focus:ring-2 focus:ring-purple-400 outline-none transition-all"
                value={empresa.cif}
                onChange={e => onChange({ cif: e.target.value })}
            />
        </div>
        <div className="space-y-1">
            <label className="block text-sm font-semibold text-slate-700 dark:text-gray-300">Dirección Fiscal</label>
            <input
                className="w-full border border-slate-200 dark:border-gray-700 rounded-xl px-3 py-2.5 bg-white dark:bg-gray-900 shadow-sm focus:ring-2 focus:ring-purple-400 outline-none transition-all"
                value={empresa.direccion}
                onChange={e => onChange({ direccion: e.target.value })}
            />
        </div>
        <div className="space-y-1">
            <label className="block text-sm font-semibold text-slate-700 dark:text-gray-300">Teléfono</label>
            <input
                className="w-full border border-slate-200 dark:border-gray-700 rounded-xl px-3 py-2.5 bg-white dark:bg-gray-900 shadow-sm focus:ring-2 focus:ring-purple-400 outline-none transition-all"
                value={empresa.telefono}
                onChange={e => onChange({ telefono: e.target.value })}
            />
        </div>
        <div className="space-y-1">
            <label className="block text-sm font-semibold text-slate-700 dark:text-gray-300">Email Corporativo</label>
            <input
                type="email"
                className="w-full border border-slate-200 dark:border-gray-700 rounded-xl px-3 py-2.5 bg-white dark:bg-gray-900 shadow-sm focus:ring-2 focus:ring-purple-400 outline-none transition-all"
                value={empresa.email}
                onChange={e => onChange({ email: e.target.value })}
            />
        </div>
        <div className="space-y-1">
            <label className="block text-sm font-semibold text-slate-700 dark:text-gray-300">Sitio Web</label>
            <input
                type="url"
                className="w-full border border-slate-200 dark:border-gray-700 rounded-xl px-3 py-2.5 bg-white dark:bg-gray-900 shadow-sm focus:ring-2 focus:ring-purple-400 outline-none transition-all"
                value={empresa.web}
                onChange={e => onChange({ web: e.target.value })}
            />
        </div>
    </form>
));

export default EmpresaForm;
