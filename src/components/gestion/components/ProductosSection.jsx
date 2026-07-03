import React, { useState, useMemo, useCallback } from "react";
import { useData } from "../../../context/AppContexts";
import {
    Plus, Edit3, Trash2, Download, Package, AlertCircle, ArrowUpAZ, ArrowDownZA,
    Search, Filter, Layers, Activity, ChevronLeft, ChevronRight
} from "lucide-react";
import { saveAs } from "file-saver";
import ProductoModal from "./ProductoModal";
import FamiliaBadge from "./FamiliaBadge";
import { cleanOperadores, cleanProductosRobust, normalizeText } from "../utils/gestionUtils";
import { glassStyles, cardHoverStyles } from "../../../utils/designUtils";

// ==========================================
// COMPONENTE: Tarjeta de Estadística Premium
// ==========================================
const StatCard = ({ title, value, icon: Icon, gradientFrom, gradientTo }) => (
    <div className={`${glassStyles()} ${cardHoverStyles()} rounded-3xl p-6 relative overflow-hidden group`}>
        <div className={`absolute -right-4 -top-4 w-24 h-24 rounded-full bg-gradient-to-br ${gradientFrom} ${gradientTo} opacity-10 group-hover:opacity-20 transition-opacity duration-500`} />
        <div className="flex items-center justify-between relative z-10">
            <div className="space-y-1">
                <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-widest">{title}</p>
                <p className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">{value}</p>
            </div>
            <div className={`p-4 rounded-2xl bg-gradient-to-br ${gradientFrom} ${gradientTo} shadow-lg`}>
                <Icon className="w-6 h-6 text-white" />
            </div>
        </div>
    </div>
);

// ==========================================
// COMPONENTE PRINCIPAL
// ==========================================
const ProductosSection = React.memo(() => {
    const { data, setProductos } = useData();
    const [selectedIds, setSelectedIds] = useState([]);
    const PAGE_SIZE = 20;

    // Datos limpios y seguros
    const operadores = useMemo(() => cleanOperadores(data.operadores || []), [data.operadores]);
    const productos = useMemo(() => cleanProductosRobust(data.productos || [], operadores), [data.productos, operadores]);

    // Estados locales
    const [showModal, setShowModal] = useState(false);
    const [editingProducto, setEditingProducto] = useState(null);
    const [error, setError] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedOperador, setSelectedOperador] = useState("");
    const [selectedFamilia, setSelectedFamilia] = useState("");
    const [sortDirection, setSortDirection] = useState("asc");
    const [currentPage, setCurrentPage] = useState(1);

    const handleSelect = useCallback((id) => {
        setSelectedIds(prev => {
            if (prev.includes(id)) {
                return prev.filter(selectedId => selectedId !== id);
            } else {
                return [...prev, id];
            }
        });
    }, []);

    const handleDeleteSelected = useCallback(() => {
        if (selectedIds.length === 0) return;
        if (window.confirm(`¿Seguro que quieres eliminar ${selectedIds.length} productos seleccionados?`)) {
            setProductos(prev => {
                const filtered = prev.filter(p => !selectedIds.includes(p.id));
                const cleaned = cleanProductosRobust(filtered, operadores);
                return cleaned;
            });
            setSelectedIds([]);
        }
    }, [selectedIds, setProductos, operadores]);

    const familias = useMemo(() => {
        const famSet = new Set();
        productos.forEach(p => {
            if (p.familia && p.familia !== 'Sin clasificar') {
                famSet.add(p.familia);
            }
        });
        return Array.from(famSet).sort();
    }, [productos]);

    const getOperadorNombre = useCallback((operadorId) => {
        const operador = operadores.find(op => op.id === operadorId);
        return operador?.nombre || "Sin operador";
    }, [operadores]);

    const getProductosFiltrados = useCallback(() => {
        let filtered = productos;

        if (searchTerm) {
            const searchNorm = normalizeText(searchTerm);
            filtered = filtered.filter(p =>
                normalizeText(p.nombre).includes(searchNorm) ||
                normalizeText(getOperadorNombre(p.operador_id)).includes(searchNorm) ||
                normalizeText(p.familia || '').includes(searchNorm)
            );
        }

        if (selectedOperador) {
            filtered = filtered.filter(p => p.operador_id === selectedOperador);
        }

        if (selectedFamilia) {
            filtered = filtered.filter(p => p.familia === selectedFamilia);
        }

        filtered.sort((a, b) => {
            const comparison = a.nombre.localeCompare(b.nombre);
            return sortDirection === "asc" ? comparison : -comparison;
        });

        return filtered;
    }, [productos, searchTerm, selectedOperador, selectedFamilia, sortDirection, getOperadorNombre]);

    const productosFiltrados = useMemo(() => getProductosFiltrados(), [getProductosFiltrados]);
    const totalPages = Math.max(1, Math.ceil(productosFiltrados.length / PAGE_SIZE));
    const currentPageSafe = Math.min(currentPage, totalPages);
    const startIndex = productosFiltrados.length === 0 ? 0 : (currentPageSafe - 1) * PAGE_SIZE + 1;
    const endIndex = Math.min(productosFiltrados.length, currentPageSafe * PAGE_SIZE);
    const productosPagina = useMemo(
        () => productosFiltrados.slice((currentPageSafe - 1) * PAGE_SIZE, currentPageSafe * PAGE_SIZE),
        [productosFiltrados, currentPageSafe]
    );

    const handleSelectAll = useCallback(() => {
        const pageItems = productosPagina;
        if (pageItems.length === 0) return;
        const allSelected = pageItems.every(p => selectedIds.includes(p.id));
        if (allSelected) {
            setSelectedIds(prev => prev.filter(id => !pageItems.some(p => p.id === id)));
        } else {
            const nuevos = pageItems
                .map(p => p.id)
                .filter(id => !selectedIds.includes(id));
            setSelectedIds(prev => [...prev, ...nuevos]);
        }
    }, [productosPagina, selectedIds]);

    const productExists = useCallback((nombre, operadorId, excludeId = null) => {
        return productos.some(p =>
            p.id !== excludeId &&
            p.nombre?.toLowerCase().trim() === nombre?.toLowerCase().trim() &&
            p.operador_id === operadorId
        );
    }, [productos]);

    const handleSave = useCallback((productoData) => {
        if (productExists(productoData.nombre, productoData.operador_id, productoData.id)) {
            setError(`Ya existe un producto con ese nombre para el operador seleccionado.`);
            return;
        }

        setProductos(prev => {
            let updatedProductos;
            if (productoData.id && prev.find(p => p.id === productoData.id)) {
                updatedProductos = prev.map(p => p.id === productoData.id ? productoData : p);
            } else {
                updatedProductos = [...prev, productoData];
            }
            return cleanProductosRobust(updatedProductos, operadores);
        });

        setError("");
    }, [productExists, setProductos, operadores]);

    const handleDelete = useCallback((id) => {
        if (window.confirm("¿Seguro que quieres eliminar este producto?")) {
            setProductos(prev => {
                const filtered = prev.filter(p => p.id !== id);
                return cleanProductosRobust(filtered, operadores);
            });
        }
    }, [setProductos, operadores]);

    const exportCSV = useCallback(() => {
        if (!productosFiltrados.length) return;

        const headers = ["ID", "Nombre", "Operador", "Familia", "PVP", "Comisión", "Tipo Comisión", "Contacto", "Email", "Teléfono"];
        const rows = productosFiltrados.map(p => [
            p.id,
            p.nombre,
            getOperadorNombre(p.operador_id),
            p.familia,
            p.pvp,
            p.comision_valor,
            p.comision_tipo,
            p.contacto,
            p.email,
            p.telefono
        ]);

        const csv = [headers.join(",")]
            .concat(rows.map(r => r.map(v => `"${String(v || '').replace(/"/g, '""')}"`).join(",")))
            .join("\r\n");

        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        saveAs(blob, `productos_${new Date().toISOString().slice(0, 10)}.csv`);
    }, [productosFiltrados, getOperadorNombre]);

    return (
        <section className="space-y-8">
            {/* Alerta de productos duplicados */}
            {data.productos && data.productos.length !== productos.length && (
                <div className={`${glassStyles()} bg-amber-50/50 dark:bg-amber-900/20 border-amber-200/50 dark:border-amber-700/30 p-4 rounded-2xl flex items-start gap-3`}>
                    <div className="p-2 bg-amber-100 dark:bg-amber-900/50 rounded-xl">
                        <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div>
                        <p className="font-bold text-amber-900 dark:text-amber-100 text-sm uppercase tracking-wide">
                            Productos duplicados eliminados
                        </p>
                        <p className="text-amber-700 dark:text-amber-300 text-xs mt-1 font-medium">
                            Se eliminaron {data.productos.length - productos.length} productos duplicados o con operadores inexistentes.
                        </p>
                    </div>
                </div>
            )}

            {/* Header y Acciones */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight flex items-center gap-3">
                        <div className="p-2 bg-[var(--brand-primary)] rounded-xl shadow-lg">
                            <Package className="w-6 h-6 text-white" />
                        </div>
                        Gestión de Productos
                    </h2>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                        Administra el catálogo de productos y sus comisiones
                    </p>
                </div>
                <div className="flex gap-2 flex-wrap">
                    <button
                        onClick={() => { setEditingProducto(null); setShowModal(true); }}
                        className="flex items-center gap-2 px-5 py-2.5 bg-[var(--brand-primary)] text-white rounded-xl hover:opacity-90 transition-all shadow-lg shadow-[var(--brand-primary)]/20 text-xs font-bold uppercase tracking-widest active:scale-95"
                    >
                        <Plus className="w-4 h-4" />
                        Nuevo Producto
                    </button>
                    <button
                        onClick={exportCSV}
                        className="flex items-center gap-2 px-5 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-all text-xs font-bold uppercase tracking-widest active:scale-95"
                    >
                        <Download className="w-4 h-4" />
                        Exportar
                    </button>
                    {selectedIds.length > 0 && (
                        <button
                            onClick={handleDeleteSelected}
                            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-rose-500 to-red-600 text-white rounded-xl hover:from-rose-600 hover:to-red-700 transition-all shadow-lg hover:shadow-rose-500/30 text-xs font-bold uppercase tracking-widest active:scale-95"
                        >
                            <Trash2 className="w-4 h-4" />
                            Eliminar ({selectedIds.length})
                        </button>
                    )}
                </div>
            </div>

            {/* Grid de Estadísticas */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    title="Total Productos"
                    value={productos.length}
                    icon={Package}
                    gradientFrom="from-[var(--brand-primary)]"
                    gradientTo="to-[var(--brand-primary)]"
                />
                <StatCard
                    title="Familias"
                    value={familias.length}
                    icon={Layers}
                    gradientFrom="from-blue-500"
                    gradientTo="to-indigo-600"
                />
                <StatCard
                    title="Operadores"
                    value={operadores.length}
                    icon={Filter}
                    gradientFrom="from-amber-500"
                    gradientTo="to-orange-600"
                />
                <StatCard
                    title="Activos"
                    value={productos.filter(p => p.activo !== false).length}
                    icon={Activity}
                    gradientFrom="from-slate-500"
                    gradientTo="to-slate-700"
                />
            </div>

            {/* Barra de Filtros */}
            <div className={`${glassStyles()} p-5 rounded-3xl`}>
                <div className="flex flex-col md:flex-row gap-4">
                    {/* Búsqueda */}
                    <div className="relative flex-1 group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <Search className="h-4 w-4 text-slate-400 group-focus-within:text-[var(--brand-primary)] transition-colors" />
                        </div>
                        <input
                            type="text"
                            className="block w-full pl-11 pr-4 py-3 rounded-2xl border-none bg-slate-100 dark:bg-slate-800/50 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:ring-2 focus:ring-[var(--brand-primary)]/50 focus:bg-white dark:focus:bg-slate-800 transition-all shadow-inner text-sm font-medium"
                            placeholder="Buscar por nombre, operador o familia..."
                            value={searchTerm}
                            onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                        />
                    </div>

                    {/* Filtros */}
                    <div className="flex gap-2 flex-wrap">
                        <select
                            className="px-4 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300 border-none focus:ring-2 focus:ring-[var(--brand-primary)]/50 text-sm font-medium"
                            value={selectedOperador}
                            onChange={e => { setSelectedOperador(e.target.value); setCurrentPage(1); }}
                        >
                            <option value="">Todos los operadores</option>
                            {operadores.map(op => (
                                <option key={op.id} value={op.id}>{op.nombre}</option>
                            ))}
                        </select>

                        <select
                            className="px-4 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300 border-none focus:ring-2 focus:ring-[var(--brand-primary)]/50 text-sm font-medium"
                            value={selectedFamilia}
                            onChange={e => { setSelectedFamilia(e.target.value); setCurrentPage(1); }}
                        >
                            <option value="">Todas las familias</option>
                            {familias.map(f => (
                                <option key={f} value={f}>{f}</option>
                            ))}
                        </select>

                        <button
                            onClick={() => { setSortDirection(sortDirection === "asc" ? "desc" : "asc"); setCurrentPage(1); }}
                            className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all text-xs font-bold uppercase tracking-widest"
                        >
                            {sortDirection === "asc" ? <ArrowUpAZ className="w-4 h-4" /> : <ArrowDownZA className="w-4 h-4" />}
                            A-Z
                        </button>
                    </div>
                </div>
            </div>

            {/* Error */}
            {error && (
                <div className="bg-red-50/50 border border-red-200/50 text-red-700 px-4 py-3 rounded-2xl flex items-center gap-3">
                    <AlertCircle className="w-5 h-5" />
                    <span className="font-medium">{error}</span>
                </div>
            )}

            {/* Tabla de Productos */}
            <div className={`${glassStyles()} overflow-hidden rounded-3xl`}>
                <div className="overflow-x-auto">
                    <table className="min-w-full text-sm text-left">
                        <thead className="bg-slate-50/80 dark:bg-slate-800/80 backdrop-blur-sm">
                            <tr>
                                <th className="px-4 py-4 text-center">
                                    <input
                                        type="checkbox"
                                        checked={productosPagina.length > 0 && productosPagina.every(p => selectedIds?.includes(p.id))}
                                        onChange={handleSelectAll}
                                        className="rounded border-slate-300 text-[var(--brand-primary)] focus:ring-[var(--brand-primary)]"
                                    />
                                </th>
                                <th className="px-4 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Nombre</th>
                                <th className="px-4 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Operador</th>
                                <th className="px-4 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Familia</th>
                                <th className="px-4 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">PVP</th>
                                <th className="px-4 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Comisión</th>
                                <th className="px-4 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 text-center">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                            {productosPagina.map(p => (
                                <tr key={p.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors group">
                                    <td className="px-4 py-4 text-center">
                                        <input
                                            type="checkbox"
                                            checked={selectedIds?.includes(p.id)}
                                            onChange={() => handleSelect(p.id)}
                                            className="rounded border-slate-300 text-[var(--brand-primary)] focus:ring-[var(--brand-primary)]"
                                        />
                                    </td>
                                    <td className="px-4 py-4">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="font-bold text-slate-900 dark:text-white">{p.nombre}</span>
                                            {(!p.operador_id || p.comision_valor === null || p.comision_valor === undefined) && (
                                                <span
                                                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wide bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                                                    title="El Excel de origen no traía operador y/o comisión para este producto — complétalo manualmente"
                                                >
                                                    ⚠️ Incompleto
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-4 py-4">
                                        <span className="text-slate-600 dark:text-slate-300 font-medium">{getOperadorNombre(p.operador_id)}</span>
                                    </td>
                                    <td className="px-4 py-4">
                                        <FamiliaBadge familia={p.familia} />
                                    </td>
                                    <td className="px-4 py-4">
                                        <span className="font-black text-[var(--brand-primary)]">{p.pvp} €</span>
                                    </td>
                                    <td className="px-4 py-4">
                                        {p.comision_valor === null || p.comision_valor === undefined ? (
                                            <span className="text-slate-400 dark:text-slate-500 text-xs font-medium italic">Sin definir</span>
                                        ) : (
                                            <>
                                                <span className="font-bold text-slate-800 dark:text-white">{p.comision_valor}</span>
                                                <span className="ml-1 text-slate-500 text-xs font-medium">{p.comision_tipo === 'porcentaje' ? '%' : '€'}</span>
                                            </>
                                        )}
                                    </td>
                                    <td className="px-4 py-4">
                                        <div className="flex justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => { setEditingProducto(p); setShowModal(true); }}
                                                className="p-2 rounded-xl text-slate-400 hover:text-[var(--brand-primary)] hover:bg-[var(--brand-primary)]/10 transition-all"
                                                title="Editar"
                                            >
                                                <Edit3 className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(p.id)}
                                                className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-all"
                                                title="Eliminar"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {productosFiltrados.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="px-4 py-12 text-center">
                                        <Package className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
                                        <p className="text-slate-400 dark:text-slate-500 font-medium">
                                            No se encontraron productos con los filtros aplicados.
                                        </p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Paginación */}
                {productosFiltrados.length > 0 && (
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-5 border-t border-slate-100 dark:border-slate-700/50">
                        <div className="text-sm text-slate-500 dark:text-slate-400">
                            Mostrando <span className="font-bold text-slate-900 dark:text-white">{startIndex} - {endIndex}</span> de {productosFiltrados.length} productos
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPageSafe === 1}
                                className={`flex items-center gap-1 px-4 py-2 rounded-xl text-sm font-bold transition-all ${currentPageSafe === 1 ? 'opacity-40 cursor-not-allowed bg-slate-100 dark:bg-slate-800' : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-95'}`}
                            >
                                <ChevronLeft className="w-4 h-4" />
                                Anterior
                            </button>
                            <div className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl">
                                <span className="text-sm text-slate-500">Página</span>
                                <span className="text-sm font-black text-slate-900 dark:text-white">{currentPageSafe}</span>
                                <span className="text-sm text-slate-500">de {totalPages}</span>
                            </div>
                            <button
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPageSafe === totalPages}
                                className={`flex items-center gap-1 px-4 py-2 rounded-xl text-sm font-bold transition-all ${currentPageSafe === totalPages ? 'opacity-40 cursor-not-allowed bg-slate-100 dark:bg-slate-800' : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-95'}`}
                            >
                                Siguiente
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Modal de Producto */}
            {showModal && (
                <ProductoModal
                    producto={editingProducto}
                    onSave={handleSave}
                    onClose={() => setShowModal(false)}
                    operadores={operadores}
                />
            )}
        </section>
    );
});

export default ProductosSection;
