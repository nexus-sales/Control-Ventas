import React, { useState, useMemo, useCallback } from "react";
import { useData } from "../../../context/AppContexts";
import Card from "../../ui/Card";
import {
    Plus, Edit3, Trash2, Download, Package, AlertCircle, ArrowUpAZ, ArrowDownZA
} from "lucide-react";
import { saveAs } from "file-saver";
import ProductoModal from "./ProductoModal";
import FamiliaBadge from "./FamiliaBadge";
import { cleanOperadores, cleanProductosRobust, normalizeText } from "../utils/gestionUtils";

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
        <section className="space-y-6">
            {data.productos && data.productos.length !== productos.length && (
                <Card className="bg-amber-50 border-amber-200">
                    <div className="flex items-center gap-3">
                        <AlertCircle className="w-5 h-5 text-amber-600" />
                        <div>
                            <p className="font-medium text-amber-800">Productos duplicados eliminados</p>
                            <p className="text-sm text-amber-700">
                                Se eliminaron {data.productos.length - productos.length} productos duplicados o con operadores inexistentes.
                            </p>
                        </div>
                    </div>
                </Card>
            )}

            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Gestión de Productos</h2>
                <div className="flex gap-2">
                    <button
                        onClick={() => { setEditingProducto(null); setShowModal(true); }}
                        className="px-4 py-2 bg-green-600 text-white rounded-xl flex items-center gap-2 hover:bg-green-700 transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        Nuevo Producto
                    </button>
                    <button
                        onClick={exportCSV}
                        className="px-4 py-2 border border-green-300 rounded-xl text-green-600 flex items-center gap-2 hover:bg-green-50 transition-colors"
                    >
                        <Download className="w-4 h-4" />
                        Exportar CSV
                    </button>
                    <button
                        onClick={handleDeleteSelected}
                        disabled={selectedIds.length === 0}
                        className={`px-4 py-2 bg-red-600 text-white rounded-xl flex items-center gap-2 hover:bg-red-700 transition-colors ${selectedIds.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        <Trash2 className="w-4 h-4" />
                        Borrar seleccionados
                    </button>
                </div>
            </div>

            <div className="grid md:grid-cols-4 gap-4 mb-6">
                <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 dark:from-gray-800 dark:to-gray-700 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-green-600 dark:text-green-200 text-sm font-medium">Total Productos</p>
                            <div className="text-2xl font-bold text-slate-900 dark:text-white">{productos.length}</div>
                        </div>
                        <Package className="w-8 h-8 text-green-600 dark:text-green-200" />
                    </div>
                </Card>

                <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 dark:from-gray-800 dark:to-gray-700 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-blue-600 dark:text-blue-200 text-sm font-medium">Familias</p>
                            <div className="text-2xl font-bold text-slate-900 dark:text-white">{familias.length}</div>
                        </div>
                    </div>
                </Card>

                <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200 dark:from-gray-800 dark:to-gray-700 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-yellow-600 dark:text-yellow-200 text-sm font-medium">Operadores</p>
                            <div className="text-2xl font-bold text-slate-900 dark:text-white">{operadores.length}</div>
                        </div>
                    </div>
                </Card>

                <Card className="bg-gradient-to-br from-slate-50 to-slate-100 border-slate-200 dark:from-gray-800 dark:to-gray-700 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-slate-600 dark:text-gray-300 text-sm font-medium">Activos</p>
                            <div className="text-2xl font-bold text-slate-900 dark:text-white">{productos.filter(p => p.activo !== false).length}</div>
                        </div>
                    </div>
                </Card>
            </div>

            <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="flex-1">
                    <input
                        type="text"
                        className="w-full border rounded-xl px-4 py-2 bg-white dark:bg-gray-900 text-slate-800 dark:text-gray-100 border-slate-200 dark:border-gray-700"
                        placeholder="Buscar producto por nombre, operador o familia..."
                        value={searchTerm}
                        onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                    />
                </div>

                <div className="flex gap-2">
                    <select
                        className="border rounded-xl px-3 py-2 bg-white dark:bg-gray-900 text-slate-800 dark:text-gray-100 border-slate-200 dark:border-gray-700"
                        value={selectedOperador}
                        onChange={e => { setSelectedOperador(e.target.value); setCurrentPage(1); }}
                    >
                        <option value="">Todos los operadores</option>
                        {operadores.map(op => (
                            <option key={op.id} value={op.id}>{op.nombre}</option>
                        ))}
                    </select>

                    <select
                        className="border rounded-xl px-3 py-2 bg-white dark:bg-gray-900 text-slate-800 dark:text-gray-100 border-slate-200 dark:border-gray-700"
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
                        className="px-4 py-2 border rounded-xl flex items-center gap-2 bg-white dark:bg-gray-900 text-slate-800 dark:text-gray-100 border-slate-200 dark:border-gray-700 hover:bg-slate-50 transition-colors"
                    >
                        {sortDirection === "asc" ? <ArrowUpAZ className="w-4 h-4" /> : <ArrowDownZA className="w-4 h-4" />}
                        A-Z
                    </button>
                </div>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl mb-6">
                    {error}
                </div>
            )}

            <div className="overflow-x-auto bg-white dark:bg-gray-900 rounded-xl border border-slate-200 dark:border-gray-700">
                <table className="min-w-full text-xs md:text-sm text-left">
                    <thead className="bg-slate-50 dark:bg-gray-800 text-slate-500 dark:text-gray-400 uppercase text-[11px] font-bold">
                        <tr>
                            <th className="px-4 py-3 text-center">
                                <input
                                    type="checkbox"
                                    checked={productosPagina.length > 0 && productosPagina.every(p => selectedIds?.includes(p.id))}
                                    onChange={handleSelectAll}
                                    className="rounded border-slate-300"
                                />
                            </th>
                            <th className="px-4 py-3">Nombre</th>
                            <th className="px-4 py-3">Operador</th>
                            <th className="px-4 py-3">Familia</th>
                            <th className="px-4 py-3">PVP</th>
                            <th className="px-4 py-3">Comisión</th>
                            <th className="px-4 py-3 text-center">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-gray-800">
                        {productosPagina.map(p => (
                            <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-gray-800/50 transition-colors">
                                <td className="px-4 py-3 text-center">
                                    <input
                                        type="checkbox"
                                        checked={selectedIds?.includes(p.id)}
                                        onChange={() => handleSelect(p.id)}
                                        className="rounded border-slate-300"
                                    />
                                </td>
                                <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">{p.nombre}</td>
                                <td className="px-4 py-3">{getOperadorNombre(p.operador_id)}</td>
                                <td className="px-4 py-3"><FamiliaBadge familia={p.familia} /></td>
                                <td className="px-4 py-3 font-semibold text-blue-600 dark:text-blue-400">{p.pvp} €</td>
                                <td className="px-4 py-3">
                                    <span className="font-semibold">{p.comision_valor}</span>
                                    <span className="ml-1 text-slate-500">{p.comision_tipo === 'porcentaje' ? '%' : '€'}</span>
                                </td>
                                <td className="px-4 py-3">
                                    <div className="flex justify-center gap-2">
                                        <button
                                            onClick={() => { setEditingProducto(p); setShowModal(true); }}
                                            className="p-1.5 rounded-lg text-slate-400 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors"
                                            title="Editar"
                                        >
                                            <Edit3 className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(p.id)}
                                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
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
                                <td colSpan={7} className="px-4 py-8 text-center text-slate-400 dark:text-gray-500">
                                    No se encontraron productos con los filtros aplicados.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {productosFiltrados.length > 0 && (
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 py-4">
                    <div className="text-sm text-slate-500">
                        Mostrando <span className="font-semibold text-slate-900 dark:text-white">{startIndex} - {endIndex}</span> de {productosFiltrados.length} productos
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPageSafe === 1}
                            className={`px-4 py-2 rounded-xl border border-slate-200 dark:border-gray-700 text-sm font-medium ${currentPageSafe === 1 ? 'opacity-40 cursor-not-allowed' : 'hover:bg-slate-50 dark:hover:bg-gray-800'} transition-colors`}
                        >
                            Anterior
                        </button>
                        <div className="flex items-center gap-1 px-4">
                            <span className="text-sm text-slate-500">Página</span>
                            <span className="text-sm font-bold text-slate-900 dark:text-white">{currentPageSafe}</span>
                            <span className="text-sm text-slate-500">de {totalPages}</span>
                        </div>
                        <button
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPageSafe === totalPages}
                            className={`px-4 py-2 rounded-xl border border-slate-200 dark:border-gray-700 text-sm font-medium ${currentPageSafe === totalPages ? 'opacity-40 cursor-not-allowed' : 'hover:bg-slate-50 dark:hover:bg-gray-800'} transition-colors`}
                        >
                            Siguiente
                        </button>
                    </div>
                </div>
            )}

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
