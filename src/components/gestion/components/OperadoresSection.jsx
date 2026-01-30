import React, { useState, useMemo, useCallback } from "react";
import { useData } from "../../../context/AppContexts";
import Card from "../../ui/Card";
import {
    Building, Plus, Edit3, Trash2, Download, AlertCircle
} from "lucide-react";
import { saveAs } from "file-saver";
import OperadorModal from "./OperadorModal";
import { cleanOperadores, cleanProductosRobust } from "../utils/gestionUtils";

const OperadoresSection = React.memo(() => {
    const { data, setOperadores } = useData();
    const operadores = useMemo(() => cleanOperadores(data.operadores || []), [data.operadores]);
    const productos = useMemo(() => cleanProductosRobust(data.productos || [], operadores), [data.productos, operadores]);

    const [showModal, setShowModal] = useState(false);
    const [editingOperador, setEditingOperador] = useState(null);
    const [error, setError] = useState("");
    const [filtroSector, setFiltroSector] = useState("");
    const [filtroProductos, setFiltroProductos] = useState("");

    const productosConteo = useMemo(() => {
        const conteo = {};
        operadores.forEach(op => {
            conteo[op.id] = productos.filter(p => p.operador_id === op.id).length;
        });
        return conteo;
    }, [operadores, productos]);

    const sectorStats = useMemo(() => {
        const stats = {
            telefonia: { operadores: 0, productos: 0 },
            energia: { operadores: 0, productos: 0 },
            seguridad: { operadores: 0, productos: 0 },
            otros: { operadores: 0, productos: 0 },
        };

        operadores.forEach(o => {
            const sector = ['telefonia', 'energia', 'seguridad'].includes(o.sector) ? o.sector : 'otros';
            stats[sector].operadores++;
            stats[sector].productos += productosConteo[o.id] || 0;
        });

        return stats;
    }, [operadores, productosConteo]);

    const topOperadores = useMemo(() => {
        return operadores
            .map(op => ({ ...op, totalProductos: productosConteo[op.id] || 0 }))
            .sort((a, b) => b.totalProductos - a.totalProductos)
            .slice(0, 5);
    }, [operadores, productosConteo]);

    const operadoresFiltrados = useMemo(() => {
        let filtered = operadores;

        if (filtroSector) {
            if (filtroSector === 'otros') {
                filtered = filtered.filter(o => !['telefonia', 'energia', 'seguridad'].includes(o.sector));
            } else {
                filtered = filtered.filter(o => o.sector === filtroSector);
            }
        }

        if (filtroProductos === 'con-productos') {
            filtered = filtered.filter(o => (productosConteo[o.id] || 0) > 0);
        } else if (filtroProductos === 'sin-productos') {
            filtered = filtered.filter(o => (productosConteo[o.id] || 0) === 0);
        }

        return filtered.sort((a, b) => {
            const productosA = productosConteo[a.id] || 0;
            const productosB = productosConteo[b.id] || 0;
            if (productosA !== productosB) return productosB - productosA;
            return a.nombre.localeCompare(b.nombre);
        });
    }, [operadores, productosConteo, filtroSector, filtroProductos]);

    const operadorExists = useCallback((nombre, excludeId = null) => {
        return operadores.some(o =>
            o.id !== excludeId &&
            o.nombre?.toLowerCase().trim() === nombre?.toLowerCase().trim()
        );
    }, [operadores]);

    const handleSave = useCallback((operadorData) => {
        if (operadorExists(operadorData.nombre, operadorData.id)) {
            setError(`Ya existe un operador con el nombre "${operadorData.nombre}"`);
            return;
        }

        setOperadores(prev => {
            let updatedOperadores;
            if (operadorData.id && prev.find(o => o.id === operadorData.id)) {
                updatedOperadores = prev.map(o => o.id === operadorData.id ? operadorData : o);
            } else {
                updatedOperadores = [...prev, operadorData];
            }
            return cleanOperadores(updatedOperadores);
        });

        setError("");
    }, [operadorExists, setOperadores]);

    const handleDelete = useCallback((id) => {
        const numProductos = productosConteo[id] || 0;
        const operador = operadores.find(o => o.id === id);

        if (numProductos > 0) {
            if (!window.confirm(`¿Estás seguro de eliminar "${operador?.nombre}"?\nTen en cuenta que tiene ${numProductos} productos asociados.`)) return;
        } else {
            if (!window.confirm(`¿Seguro que quieres eliminar "${operador?.nombre}"?`)) return;
        }

        setOperadores(prev => {
            const filtered = prev.filter(o => o.id !== id);
            return cleanOperadores(filtered);
        });
    }, [setOperadores, productosConteo, operadores]);

    const exportCSV = useCallback(() => {
        if (!operadoresFiltrados.length) return;

        const headers = ["ID", "Nombre", "Sector", "Código", "Productos", "Contacto", "Teléfono", "Email"];
        const rows = operadoresFiltrados.map(o => [
            o.id,
            o.nombre,
            o.sector,
            o.codigo,
            productosConteo[o.id] || 0,
            o.contacto,
            o.telefono,
            o.email
        ]);
        const csv = [headers.join(",")]
            .concat(rows.map(r => r.map(v => `"${String(v || '').replace(/"/g, '""')}"`).join(",")))
            .join("\r\n");

        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        saveAs(blob, `operadores_${new Date().toISOString().slice(0, 10)}.csv`);
    }, [operadoresFiltrados, productosConteo]);

    return (
        <section className="space-y-6">
            {data.operadores && data.operadores.length !== operadores.length && (
                <Card className="bg-amber-50 border-amber-200">
                    <div className="flex items-center gap-3">
                        <AlertCircle className="w-5 h-5 text-amber-600" />
                        <div>
                            <p className="font-medium text-amber-800">Operadores duplicados eliminados</p>
                            <p className="text-sm text-amber-700">Se eliminaron {data.operadores.length - operadores.length} operadores duplicados.</p>
                        </div>
                    </div>
                </Card>
            )}

            <div className="grid md:grid-cols-4 gap-4">
                <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 dark:from-gray-800 dark:to-gray-700">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-blue-600 dark:text-blue-200 text-sm font-medium">Telefonía</p>
                            <div className="text-2xl font-bold">{sectorStats.telefonia.operadores}</div>
                            <div className="text-xs text-blue-500">{sectorStats.telefonia.productos} prod.</div>
                        </div>
                        <Building className="w-8 h-8 text-blue-600 dark:text-blue-200" />
                    </div>
                </Card>
                <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 dark:from-gray-800 dark:to-gray-700">
                    <div>
                        <p className="text-green-600 dark:text-green-200 text-sm font-medium">Energía</p>
                        <div className="text-2xl font-bold">{sectorStats.energia.operadores}</div>
                        <div className="text-xs text-green-500">{sectorStats.energia.productos} prod.</div>
                    </div>
                </Card>
                <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200 dark:from-gray-800 dark:to-gray-700">
                    <div>
                        <p className="text-yellow-600 dark:text-yellow-200 text-sm font-medium">Seguridad</p>
                        <div className="text-2xl font-bold">{sectorStats.seguridad.operadores}</div>
                        <div className="text-xs text-yellow-500">{sectorStats.seguridad.productos} prod.</div>
                    </div>
                </Card>
                <Card className="bg-gradient-to-br from-slate-50 to-slate-100 border-slate-200 dark:from-gray-800 dark:to-gray-700">
                    <div>
                        <p className="text-slate-600 dark:text-gray-300 text-sm font-medium">Otros</p>
                        <div className="text-2xl font-bold">{sectorStats.otros.operadores}</div>
                        <div className="text-xs text-slate-500">{sectorStats.otros.productos} prod.</div>
                    </div>
                </Card>
            </div>

            <Card className="bg-gradient-to-r from-purple-50 to-indigo-50 border-purple-200 dark:from-gray-800 dark:to-gray-700">
                <div className="p-4">
                    <h3 className="text-lg font-semibold text-purple-800 dark:text-purple-200 mb-3 flex items-center gap-2">🏆 Top Operadores</h3>
                    <div className="grid md:grid-cols-5 gap-3">
                        {topOperadores.map((op, idx) => (
                            <div key={op.id} className="bg-white dark:bg-gray-900 rounded-lg p-3 text-center shadow-sm">
                                <div className="text-sm font-medium truncate">{op.nombre}</div>
                                <div className="text-lg font-bold text-purple-600">{op.totalProductos}</div>
                                <div className="text-xs text-slate-500">{idx < 3 ? '⭐' : ''} {op.sector}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </Card>

            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mt-8 mb-4 gap-4">
                <h2 className="text-xl font-bold">Gestión de Operadores ({operadoresFiltrados.length})</h2>
                <div className="flex flex-wrap gap-2">
                    <select
                        className="border rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-900 border-slate-200 dark:border-gray-700"
                        value={filtroSector}
                        onChange={e => setFiltroSector(e.target.value)}
                    >
                        <option value="">Todos los sectores</option>
                        <option value="telefonia">Telefonía</option>
                        <option value="energia">Energía</option>
                        <option value="seguridad">Seguridad</option>
                        <option value="otros">Otros</option>
                    </select>
                    <select
                        className="border rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-900 border-slate-200 dark:border-gray-700"
                        value={filtroProductos}
                        onChange={e => setFiltroProductos(e.target.value)}
                    >
                        <option value="">Todos</option>
                        <option value="con-productos">Con productos</option>
                        <option value="sin-productos">Sin productos</option>
                    </select>
                    <button
                        onClick={() => { setEditingOperador(null); setShowModal(true); }}
                        className="px-4 py-2 bg-purple-600 text-white rounded-xl flex items-center gap-2 hover:bg-purple-700 transition-colors"
                    >
                        <Plus className="w-4 h-4" /> Nuevo
                    </button>
                    <button
                        onClick={exportCSV}
                        className="px-4 py-2 border border-purple-300 rounded-xl text-purple-600 flex items-center gap-2 hover:bg-purple-50 transition-colors"
                    >
                        <Download className="w-4 h-4" /> CSV
                    </button>
                </div>
            </div>

            {error && <div className="text-red-600 bg-red-50 p-3 rounded-lg border border-red-200">{error}</div>}

            <div className="overflow-x-auto">
                <table className="min-w-full border-separate border-spacing-y-2 text-sm">
                    <thead>
                        <tr className="text-left text-slate-500 uppercase text-[11px] font-bold">
                            <th className="px-4 py-2">Nombre</th>
                            <th className="px-4 py-2">Sector</th>
                            <th className="px-4 py-2 text-center">Productos</th>
                            <th className="px-4 py-2 text-center">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {operadoresFiltrados.map(op => (
                            <tr key={op.id} className="bg-white dark:bg-gray-800 hover:bg-purple-50 dark:hover:bg-gray-700/50 transition-colors">
                                <td className="px-4 py-3 font-medium">{op.nombre}</td>
                                <td className="px-4 py-3 capitalize">{op.sector}</td>
                                <td className="px-4 py-3 text-center">
                                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${productosConteo[op.id] > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                        {productosConteo[op.id] || 0}
                                    </span>
                                </td>
                                <td className="px-4 py-3">
                                    <div className="flex justify-center gap-2">
                                        <button onClick={() => { setEditingOperador(op); setShowModal(true); }} className="p-1.5 rounded-lg hover:bg-purple-100 transition-colors text-slate-400 hover:text-purple-600"><Edit3 className="w-4 h-4" /></button>
                                        <button onClick={() => handleDelete(op.id)} className="p-1.5 rounded-lg hover:bg-red-100 transition-colors text-slate-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {showModal && (
                <OperadorModal
                    operador={editingOperador}
                    onSave={handleSave}
                    onClose={() => setShowModal(false)}
                />
            )}
        </section>
    );
});

export default OperadoresSection;
