import React, { useMemo } from 'react';
import { Building, Zap, Wrench, Package } from 'lucide-react';
import { glassStyles, cardHoverStyles } from '../../../utils/designUtils';

const SectorCard = ({ label, count, products, icon: Icon, gradientFrom, gradientTo, bgLight, textDark }) => (
    <div className={`${glassStyles} ${cardHoverStyles} p-5 rounded-3xl relative overflow-hidden group`}>
        <div className={`absolute -right-2 -top-2 w-16 h-16 rounded-full bg-gradient-to-br ${gradientFrom} ${gradientTo} opacity-10 group-hover:opacity-20 transition-opacity`} />

        <div className="flex items-center justify-between relative z-10">
            <div>
                <p className={`text-sm font-bold uppercase tracking-wider ${textDark}`}>{label}</p>
                <div className="text-2xl font-black text-slate-800 dark:text-white leading-none mt-1">{count}</div>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">{products} productos</p>
            </div>
            <div className={`p-3 rounded-2xl bg-gradient-to-br ${gradientFrom} ${gradientTo} shadow-md`}>
                <Icon className="w-5 h-5 text-white" />
            </div>
        </div>
    </div>
);

const ProductosOperadorWidget = ({ operadores = [], productos = [] }) => {
    const operadoresLimpios = useMemo(() => operadores.filter(op => op?.id && op?.nombre), [operadores]);
    const productosLimpios = useMemo(() => productos.filter(prod => prod?.id && prod?.nombre), [productos]);

    const productosConteo = useMemo(() => {
        const conteo = {};
        operadoresLimpios.forEach(op => {
            conteo[op.id] = productosLimpios.filter(p => p.operador_id === op.id).length;
        });
        return conteo;
    }, [operadoresLimpios, productosLimpios]);

    const topOperadores = useMemo(() => {
        return operadoresLimpios
            .map(op => ({
                ...op,
                totalProductos: productosConteo[op.id] || 0
            }))
            .sort((a, b) => b.totalProductos - a.totalProductos)
            .slice(0, 5);
    }, [operadoresLimpios, productosConteo]);

    const sectorStats = useMemo(() => {
        const stats = {
            telefonia: { operadores: 0, productos: 0 },
            energia: { operadores: 0, productos: 0 },
            seguridad: { operadores: 0, productos: 0 },
            otros: { operadores: 0, productos: 0 },
        };

        operadoresLimpios.forEach(o => {
            const sector = ['telefonia', 'energia', 'seguridad'].includes(o.sector?.toLowerCase()) ? o.sector.toLowerCase() : 'otros';
            stats[sector].operadores++;
            stats[sector].productos += productosConteo[o.id] || 0;
        });

        return stats;
    }, [operadoresLimpios, productosConteo]);

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <SectorCard
                    label="Telefonía"
                    count={sectorStats.telefonia.operadores}
                    products={sectorStats.telefonia.productos}
                    icon={Building}
                    gradientFrom="from-blue-400"
                    gradientTo="to-indigo-600"
                    textDark="text-blue-600 dark:text-blue-400"
                />

                <SectorCard
                    label="Energía"
                    count={sectorStats.energia.operadores}
                    products={sectorStats.energia.productos}
                    icon={Zap}
                    gradientFrom="from-emerald-400"
                    gradientTo="to-teal-600"
                    textDark="text-emerald-600 dark:text-emerald-400"
                />

                <SectorCard
                    label="Seguridad"
                    count={sectorStats.seguridad.operadores}
                    products={sectorStats.seguridad.productos}
                    icon={Wrench}
                    gradientFrom="from-amber-400"
                    gradientTo="to-orange-600"
                    textDark="text-amber-600 dark:text-amber-400"
                />

                <SectorCard
                    label="Total Global"
                    count={operadoresLimpios.length}
                    products={productosLimpios.length}
                    icon={Package}
                    gradientFrom="from-purple-400"
                    gradientTo="to-fuchsia-600"
                    textDark="text-purple-600 dark:text-purple-400"
                />
            </div>

            <div className={`${glassStyles} p-6 rounded-3xl border-purple-200/50 dark:border-purple-900/30`}>
                <h4 className="text-lg font-black text-slate-800 dark:text-white mb-6 flex items-center gap-3">
                    <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-400">
                        🏆
                    </span>
                    Top Operadores por Portafolio
                </h4>

                {topOperadores.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
                        {topOperadores.map((op, index) => (
                            <div
                                key={op.id}
                                className={`
                  p-4 rounded-2xl bg-white/40 dark:bg-slate-800/40 border border-white/50 dark:border-slate-700/30
                  ${cardHoverStyles} flex flex-col items-center text-center
                `}
                            >
                                <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center mb-3 font-black text-slate-500 dark:text-slate-400">
                                    {index + 1}
                                </div>
                                <div className="text-sm font-bold text-slate-800 dark:text-white truncate w-full mb-1" title={op.nombre}>
                                    {op.nombre}
                                </div>
                                <div className="text-2xl font-black text-purple-600 dark:text-purple-400">{op.totalProductos}</div>
                                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3">{op.sector || 'General'}</p>

                                <div className={`w-full py-1 rounded-full text-[10px] font-black uppercase ${op.totalProductos === 0
                                    ? 'bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400'
                                    : op.totalProductos <= 3
                                        ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400'
                                        : 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400'
                                    }`}>
                                    {op.totalProductos === 0 ? 'Sin Oferta' :
                                        op.totalProductos <= 3 ? 'Catálogo Reducido' :
                                            'Sólido Catálogo'}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-10 bg-slate-50/50 dark:bg-slate-800/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
                        <Building className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-700 mb-4" />
                        <p className="text-slate-500 dark:text-slate-500 font-medium">No hay operadores registrados para analizar</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default React.memo(ProductosOperadorWidget);
