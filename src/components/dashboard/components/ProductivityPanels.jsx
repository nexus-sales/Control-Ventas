import React from 'react';
import { Calendar, TrendingUp, Target, Users, BarChart3, PieChart, Award } from 'lucide-react';
import { euro, glassStyles } from '../../../utils/designUtils';

const TrendTile = ({ label, value, sublabel, icon: Icon, variant = 'cyan' }) => {
    const themes = {
        cyan: 'from-cyan-400 to-blue-500',
        teal: 'from-teal-400 to-emerald-600',
        violet: 'from-violet-400 to-purple-600',
        orange: 'from-orange-400 to-amber-600',
        indigo: 'from-indigo-400 to-blue-700',
        rose: 'from-rose-400 to-pink-600',
        emerald: 'from-emerald-400 to-teal-600'
    };

    return (
        <div className={`${glassStyles} p-5 rounded-3xl relative overflow-hidden group hover:scale-[1.03] transition-all`}>
            <div className={`absolute -right-4 -top-4 w-20 h-20 rounded-full bg-gradient-to-br ${themes[variant]} opacity-10 group-hover:opacity-20 transition-opacity`} />
            <div className="flex items-center justify-between relative z-10">
                <div className="space-y-1">
                    <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{label}</p>
                    <p className="text-xl font-black text-slate-800 dark:text-white">{value}</p>
                    <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400">{sublabel}</p>
                </div>
                <div className={`p-3 rounded-2xl bg-gradient-to-br ${themes[variant]} shadow-lg`}>
                    <Icon className="w-5 h-5 text-white" />
                </div>
            </div>
        </div>
    );
};

export const TendenciasPanel = ({ evolucionTemporal, periodoEvolucion, topProductos, topColaboradores }) => {
    const avgVentas = evolucionTemporal.length > 0
        ? (evolucionTemporal.reduce((sum, [, data]) => sum + data.ventas, 0) / evolucionTemporal.length).toFixed(1)
        : 0;

    const maxVentas = evolucionTemporal.length > 0
        ? Math.max(...evolucionTemporal.map(([, data]) => data.ventas))
        : 0;

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <TrendTile
                label="Promedio por Período"
                value={`${avgVentas} ventas`}
                sublabel={`Frecuencia ${periodoEvolucion}`}
                icon={Calendar}
                variant="cyan"
            />
            <TrendTile
                label="Récord Histórico"
                value={`${maxVentas} ventas`}
                sublabel="Mejor desempeño registrado"
                icon={TrendingUp}
                variant="teal"
            />
            <TrendTile
                label="Productos Activos"
                value={topProductos.length}
                sublabel="Con rotación comercial"
                icon={Target}
                variant="violet"
            />
            <TrendTile
                label="Plantilla Activa"
                value={topColaboradores.length}
                sublabel="Generando ventas"
                icon={Users}
                variant="orange"
            />
        </div>
    );
};

export const ProductividadPanel = ({ colaboradores, total, topColaboradores, topProductos, facturacionTotal, margen, comBruta, hayDatos }) => {
    return (
        <div className="grid grid-cols-1 gap-4">
            <TrendTile
                label="Ratio Colab. Activo"
                value={`${(colaboradores.length > 0 && total > 0 ? (total / (topColaboradores.length || 1)).toFixed(1) : 0)} ventas`}
                sublabel="Promedio por vendedor operativo"
                icon={BarChart3}
                variant="indigo"
            />
            <TrendTile
                label="Valorización Producto"
                value={topProductos.length > 0 ? euro(facturacionTotal / topProductos.length) : euro(0)}
                sublabel="Ingreso medio por SKU vendido"
                icon={PieChart}
                variant="rose"
            />
            {hayDatos && (
                <TrendTile
                    label="Factor Eficiencia"
                    value={`${comBruta > 0 ? ((margen / comBruta) * 100).toFixed(1) : 0}%`}
                    sublabel="Margen sobre comisión bruta"
                    icon={Award}
                    variant="emerald"
                />
            )}
        </div>
    );
};
