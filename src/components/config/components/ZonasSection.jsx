import React from "react";
import { Globe, MapPin } from "lucide-react";

const ZonasSection = React.memo(({ zonas = [] }) => {
    // Asegurar que las zonas sean únicas por nombre
    const uniqueZonas = Array.from(new Map(zonas.map(z => [z.nombre, z])).values());

    return (
        <section className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center gap-3 mb-2">
                <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-lg text-blue-600 dark:text-blue-400">
                    <Globe className="w-6 h-6" />
                </div>
                <div>
                    <h3 className="text-2xl font-bold text-slate-800 dark:text-white">Zonas Fiscales</h3>
                    <p className="text-sm text-slate-500 dark:text-gray-400">Regiones configuradas para gestión de impuestos y precios.</p>
                </div>
            </div>

            {uniqueZonas.length === 0 ? (
                <div className="text-center py-12 bg-slate-50 dark:bg-gray-800/50 rounded-2xl border-2 border-dashed border-slate-200 dark:border-gray-700">
                    <MapPin className="w-12 h-12 text-slate-300 dark:text-gray-600 mx-auto mb-3" />
                    <p className="text-slate-500 dark:text-gray-400">No hay zonas fiscales registradas en el sistema.</p>
                </div>
            ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {uniqueZonas.map(zona => (
                        <div
                            key={zona.id}
                            className="group p-5 rounded-2xl bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-600 hover:shadow-xl hover:shadow-blue-500/5 transition-all duration-300"
                        >
                            <div className="flex items-start justify-between mb-3">
                                <div className="font-bold text-lg text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                    {zona.nombre}
                                </div>
                                {zona.codigo && (
                                    <span className="bg-slate-100 dark:bg-gray-700 text-slate-500 dark:text-gray-300 px-2 py-0.5 rounded text-[10px] font-black tracking-widest">
                                        {zona.codigo}
                                    </span>
                                )}
                            </div>

                            {zona.descripcion && (
                                <p className="text-sm text-slate-500 dark:text-gray-400 line-clamp-2 italic mb-4">
                                    "{zona.descripcion}"
                                </p>
                            )}

                            <div className="flex items-center gap-2 pt-4 border-t border-slate-50 dark:border-gray-700/50">
                                <div className="w-2 h-2 rounded-full bg-green-500 shadow-sm shadow-green-500/50"></div>
                                <span className="text-[10px] font-bold text-slate-400 dark:text-gray-500 uppercase tracking-tighter">Área de Actuación Activa</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </section>
    );
});

export default ZonasSection;
