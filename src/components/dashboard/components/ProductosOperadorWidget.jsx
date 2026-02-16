import React, { useMemo } from 'react';
import { Building, Zap, Shield, Package, Crown, TrendingUp } from 'lucide-react';
import { glassStyles, cardHoverStyles } from '../../../utils/designUtils';
import { cn } from '../../../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { BorderBeam } from '../../ui/BorderBeam';

const SectorCard = ({ label, count, products, icon: Icon, gradientFrom, gradientTo, textDark, delay = 0 }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay }}
        whileHover={{ y: -5 }}
        className={cn(glassStyles(), cardHoverStyles(), "p-6 rounded-[2rem] relative overflow-hidden group border border-white/20 dark:border-slate-800/50 shadow-xl")}
    >
        <div className={cn("absolute -right-4 -top-4 w-28 h-28 rounded-full bg-gradient-to-br opacity-[0.05] group-hover:opacity-10 transition-opacity duration-500", gradientFrom, gradientTo)} />

        <div className="flex items-center justify-between relative z-10">
            <div className="space-y-2">
                <p className={cn("text-[10px] font-black uppercase tracking-[2px] opacity-70", textDark)}>{label}</p>
                <div className="text-3xl font-black text-slate-800 dark:text-white leading-none tracking-tighter">{count}</div>
                <div className="flex items-center gap-1.5">
                    <div className={cn("w-1.5 h-1.5 rounded-full", gradientTo.replace('to-', 'bg-'))} />
                    <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">{products} SKUs</p>
                </div>
            </div>
            <div className={cn("p-4 rounded-2xl bg-gradient-to-br shadow-lg shadow-inner group-hover:scale-110 transition-transform duration-500", gradientFrom, gradientTo)}>
                <Icon className="w-6 h-6 text-white" />
            </div>
        </div>
    </motion.div>
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
        <div className="space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <SectorCard
                    label="Telecomunicaciones"
                    count={sectorStats.telefonia.operadores}
                    products={sectorStats.telefonia.productos}
                    icon={Building}
                    gradientFrom="from-blue-500"
                    gradientTo="to-indigo-600"
                    textDark="text-blue-600 dark:text-blue-400"
                    delay={0.1}
                />

                <SectorCard
                    label="Energía & Utilities"
                    count={sectorStats.energia.operadores}
                    products={sectorStats.energia.productos}
                    icon={Zap}
                    gradientFrom="from-amber-400"
                    gradientTo="to-orange-500"
                    textDark="text-amber-600 dark:text-amber-400"
                    delay={0.2}
                />

                <SectorCard
                    label="Seguridad & Dom"
                    count={sectorStats.seguridad.operadores}
                    products={sectorStats.seguridad.productos}
                    icon={Shield}
                    gradientFrom="from-emerald-500"
                    gradientTo="to-teal-600"
                    textDark="text-emerald-600 dark:text-emerald-400"
                    delay={0.3}
                />

                <SectorCard
                    label="Crecimiento Global"
                    count={operadoresLimpios.length}
                    products={productosLimpios.length}
                    icon={Package}
                    gradientFrom="from-purple-500"
                    gradientTo="to-fuchsia-600"
                    textDark="text-purple-600 dark:text-purple-400"
                    delay={0.4}
                />
            </div>

            <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.5 }}
                className={cn(glassStyles(), "p-8 rounded-[2.5rem] relative overflow-hidden border border-purple-500/10 shadow-2xl")}
            >
                <BorderBeam size={150} duration={10} colorFrom="#a855f7" colorTo="#3b82f6" />

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                    <div>
                        <h4 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tighter flex items-center gap-3">
                            <Crown className="w-6 h-6 text-amber-500" />
                            Elite de Operadores
                        </h4>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Líderes por profundidad de catálogo</p>
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                        <TrendingUp className="w-4 h-4 text-emerald-500" />
                        <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest leading-none">Análisis en Tiempo Real</span>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-6">
                    {topOperadores.length > 0 ? (
                        topOperadores.map((op, index) => (
                            <motion.div
                                key={op.id}
                                whileHover={{ y: -5, scale: 1.02 }}
                                className={cn(
                                    "p-6 rounded-3xl bg-white/50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 shadow-lg",
                                    cardHoverStyles(),
                                    "flex flex-col items-center text-center relative group"
                                )}
                            >
                                <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />

                                <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4 font-black text-xl text-slate-400 dark:text-slate-600 shadow-inner group-hover:text-blue-500 group-hover:scale-110 transition-all duration-500">
                                    {index + 1}
                                </div>
                                <div className="text-xs font-black text-slate-800 dark:text-white truncate w-full mb-1 uppercase tracking-tight" title={op.nombre}>
                                    {op.nombre}
                                </div>
                                <div className="text-3xl font-black text-blue-600 dark:text-blue-400 tracking-tighter">{op.totalProductos}</div>
                                <p className="text-[9px] font-black uppercase tracking-[2px] text-slate-400 mb-6">{op.sector || 'General'}</p>

                                <div className={cn(
                                    "w-full py-2 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-sm",
                                    op.totalProductos === 0
                                        ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                                        : op.totalProductos <= 3
                                            ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                                            : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                )}>
                                    {op.totalProductos === 0 ? 'Vacío' :
                                        op.totalProductos <= 3 ? 'Básico' :
                                            'Premium'}
                                </div>
                            </motion.div>
                        ))
                    ) : (
                        <div className="col-span-full text-center py-16 bg-slate-50/50 dark:bg-slate-900/40 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
                            <Building className="w-16 h-16 mx-auto text-slate-200 dark:text-slate-700 mb-4" />
                            <p className="text-slate-400 dark:text-slate-500 font-black uppercase tracking-[3px] text-xs">Sin datos operativos</p>
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    );
};

export default React.memo(ProductosOperadorWidget);
