import React from "react";

const LiquidacionPreviewModal = ({ liquidacion, colaborador, ventas, decomisiones, onClose }) => {
    if (!liquidacion) return null;

    const totalBruto = Number(liquidacion.bruto || 0);
    const totalIrpf = Number(liquidacion.irpf || 0);
    const totalImpuesto = Number(liquidacion.impuesto_zona || 0);
    const totalDecomisiones = Number(liquidacion.decomisiones || 0);
    const totalNeto = Number(liquidacion.neto || 0);
    const totalConImpuesto = Number(
        liquidacion.total_con_impuesto ?? (totalBruto - totalIrpf - totalDecomisiones + totalImpuesto)
    );

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4 animate-in fade-in duration-300">
            <div className="flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-3xl bg-white dark:bg-gray-900 text-slate-800 dark:text-gray-100 shadow-2xl border border-slate-200 dark:border-gray-800">
                {/* Cabecera */}
                <div className="flex items-center justify-between gap-4 border-b border-slate-100 dark:border-gray-800 p-6 bg-slate-50/50 dark:bg-gray-800/50">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-2xl flex items-center justify-center text-purple-600 dark:text-purple-400 font-bold text-xl">
                            {colaborador?.nombre?.substring(0, 1).toUpperCase() || 'L'}
                        </div>
                        <div>
                            <h3 className="text-xl font-black tracking-tight text-slate-900 dark:text-white">Liquidación {liquidacion.periodo}</h3>
                            <p className="text-sm font-medium text-slate-500 dark:text-gray-400">{colaborador?.nombre || liquidacion.colaborador_id}</p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="w-10 h-10 flex items-center justify-center rounded-full bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 text-slate-400 hover:text-red-500 hover:border-red-200 transition-all active:scale-90 shadow-sm"
                    >
                        ✕
                    </button>
                </div>

                {/* Resumen Métricas */}
                <div className="grid gap-4 p-6 sm:grid-cols-2 lg:grid-cols-6 bg-white dark:bg-gray-900">
                    <div className="rounded-2xl border border-slate-100 dark:border-gray-800 p-4 bg-slate-50/30 dark:bg-gray-800/30">
                        <p className="text-[10px] font-black uppercase text-slate-400 dark:text-gray-500 tracking-widest mb-1">Bruto</p>
                        <p className="text-2xl font-black text-slate-900 dark:text-white">{totalBruto.toFixed(2)}€</p>
                    </div>
                    <div className="rounded-2xl border border-slate-100 dark:border-gray-800 p-4 bg-slate-50/30 dark:bg-gray-800/30">
                        <p className="text-[10px] font-black uppercase text-slate-400 dark:text-gray-500 tracking-widest mb-1">IRPF</p>
                        <p className="text-2xl font-black text-amber-600 dark:text-amber-400">-{totalIrpf.toFixed(2)}€</p>
                    </div>
                    <div className="rounded-2xl border border-slate-100 dark:border-gray-800 p-4 bg-slate-50/30 dark:bg-gray-800/30">
                        <p className="text-[10px] font-black uppercase text-slate-400 dark:text-gray-500 tracking-widest mb-1">IVA/IGIC</p>
                        <p className="text-2xl font-black text-blue-600 dark:text-blue-400">+{totalImpuesto.toFixed(2)}€</p>
                    </div>
                    <div className="rounded-2xl border border-slate-100 dark:border-gray-800 p-4 bg-slate-50/30 dark:bg-gray-800/30">
                        <p className="text-[10px] font-black uppercase text-slate-400 dark:text-gray-500 tracking-widest mb-1">Decomis.</p>
                        <p className="text-2xl font-black text-rose-600 dark:text-rose-400">-{totalDecomisiones.toFixed(2)}€</p>
                    </div>
                    <div className="rounded-2xl border-2 border-emerald-100 dark:border-emerald-900/30 p-4 bg-emerald-50/50 dark:bg-emerald-900/20 lg:col-span-2">
                        <p className="text-[10px] font-black uppercase text-emerald-600 dark:text-emerald-400 tracking-widest mb-1">Pago Neto Final</p>
                        <p className="text-3xl font-black text-emerald-700 dark:text-emerald-300">{totalNeto.toFixed(2)}€</p>
                    </div>
                </div>

                {/* Listado de Detalles */}
                <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-slate-50/30 dark:bg-gray-900/30">
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="rounded-2xl border border-slate-100 dark:border-gray-800 p-5 bg-white dark:bg-gray-800 shadow-sm">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Información Fiscal</span>
                            <div className="flex flex-col gap-1">
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-500">Tipo Colaborador:</span>
                                    <span className="font-bold text-slate-900 dark:text-white">
                                        {liquidacion.colaborador_tipo?.toUpperCase() || "N/A"}
                                    </span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-500">Zona Impositiva:</span>
                                    <span className="font-bold text-slate-900 dark:text-white capitalize">{liquidacion.zona_fiscal || "Nacional"}</span>
                                </div>
                            </div>
                        </div>

                        <div className="rounded-2xl border border-slate-100 dark:border-gray-800 p-5 bg-white dark:bg-gray-800 shadow-sm">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Registro Sistema</span>
                            <div className="flex flex-col gap-1">
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-500">Fecha Generación:</span>
                                    <span className="font-bold text-slate-900 dark:text-white">
                                        {new Date(liquidacion.fecha_generacion).toLocaleDateString("es-ES")}
                                    </span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-500">Estado Liquidación:</span>
                                    <span className={`font-black tracking-tighter ${liquidacion.estado === 'Pagada' ? 'text-green-500' : 'text-amber-500'}`}>
                                        {liquidacion.estado?.toUpperCase() || "PENDIENTE"}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h4 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                            <div className="w-2 h-6 bg-purple-500 rounded-full"></div>
                            Ventas Consolidadas ({ventas.length})
                        </h4>
                        <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-gray-800 shadow-sm bg-white dark:bg-gray-900">
                            <table className="min-w-full text-xs md:text-sm">
                                <thead className="bg-slate-50 dark:bg-gray-800/80 border-b border-slate-100 dark:border-gray-800">
                                    <tr>
                                        <th className="px-4 py-3 text-left font-black text-slate-500 dark:text-gray-400 uppercase tracking-widest">ID Venta</th>
                                        <th className="px-4 py-3 text-left font-black text-slate-500 dark:text-gray-400 uppercase tracking-widest">Producto</th>
                                        <th className="px-4 py-3 text-right font-black text-slate-500 dark:text-gray-400 uppercase tracking-widest">Bruto</th>
                                        <th className="px-4 py-3 text-right font-black text-slate-500 dark:text-gray-400 uppercase tracking-widest">IRPF</th>
                                        <th className="px-4 py-3 text-right font-black text-slate-500 dark:text-gray-400 uppercase tracking-widest">Neto</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-gray-800">
                                    {ventas.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="px-4 py-8 text-center text-slate-400 italic">No hay registros de ventas para este periodo.</td>
                                        </tr>
                                    ) : (
                                        ventas.map((venta) => {
                                            const detalle = venta._calc?.detalle || {};
                                            return (
                                                <tr key={venta.id} className="hover:bg-slate-50 dark:hover:bg-gray-800/40 transition-colors">
                                                    <td className="px-4 py-3 font-mono font-bold text-slate-600 dark:text-gray-400">#{venta.id.slice(-6)}</td>
                                                    <td className="px-4 py-3 font-semibold text-slate-800 dark:text-gray-200">{detalle.producto?.nombre || venta.producto_id}</td>
                                                    <td className="px-4 py-3 text-right font-mono font-bold">{(detalle.parteColab || 0).toFixed(2)}€</td>
                                                    <td className="px-4 py-3 text-right font-mono text-amber-600 dark:text-amber-400">{(detalle.irpf || 0).toFixed(2)}€</td>
                                                    <td className="px-4 py-3 text-right font-mono font-black text-slate-900 dark:text-white">{(detalle.netoColab || (detalle.parteColab - (detalle.irpf || 0))).toFixed(2)}€</td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {decomisiones.length > 0 && (
                        <div className="space-y-4">
                            <h4 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                                <div className="w-2 h-6 bg-rose-500 rounded-full"></div>
                                Decomisiones Aplicadas ({decomisiones.length})
                            </h4>
                            <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-gray-800 shadow-sm bg-white dark:bg-gray-900">
                                <table className="min-w-full text-xs md:text-sm">
                                    <thead className="bg-rose-50/50 dark:bg-rose-900/10 border-b border-rose-100 dark:border-rose-900/20">
                                        <tr>
                                            <th className="px-4 py-3 text-left font-black text-rose-600 dark:text-rose-400 uppercase tracking-widest">ID Venta</th>
                                            <th className="px-4 py-3 text-left font-black text-rose-600 dark:text-rose-400 uppercase tracking-widest">Cliente</th>
                                            <th className="px-4 py-3 text-right font-black text-rose-600 dark:text-rose-400 uppercase tracking-widest">Descuento</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-gray-800">
                                        {decomisiones.map((deco) => (
                                            <tr key={deco.id} className="hover:bg-rose-50/30 dark:hover:bg-rose-900/5 transition-colors">
                                                <td className="px-4 py-3 font-mono font-bold text-slate-600 dark:text-gray-400">#{deco.venta_id.slice(-6)}</td>
                                                <td className="px-4 py-3 font-semibold text-slate-800 dark:text-gray-200">{deco.cliente_nombre}</td>
                                                <td className="px-4 py-3 text-right font-mono font-black text-rose-600 dark:text-rose-400">-{Number(deco.importe_decomision || 0).toFixed(2)}€</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default LiquidacionPreviewModal;
