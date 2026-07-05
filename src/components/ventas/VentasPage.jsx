// src/components/ventas/VentasPage.jsx
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useData, useAuth } from '../../context/AppContexts';
import { computeVenta } from '../../utils/calculos';
import { useVentasGestion } from '../../hooks/useVentasGestion';
import { usePagination } from '../../hooks/usePagination';
import Pagination from '../ui/Pagination';

import { VentasStats } from './VentasStats';
import { VentasActions } from './VentasActions';
import { VentasTable } from './VentasTable';
import { VentasProcessWidget } from './widgets/VentasProcessWidget';
import VentasFilters from './VentasFilters';
import VentaFormModal from './modals/VentaFormModal';
import { VentaDetailModal } from './modals/VentaDetailModal';
import { PvpEditModal } from './modals/PvpEditModal';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutDashboard, Filter, Zap, Table as TableIcon, Sparkles, TrendingUp, Search } from 'lucide-react';

const LoadingVentas = () => (
  <div className="p-8 space-y-10 min-h-screen bg-slate-50/50 dark:bg-gray-950/10">
    <div className="flex items-center gap-6">
      <div className="w-20 h-20 bg-slate-200 dark:bg-gray-800 rounded-[2.5rem] animate-pulse shadow-2xl" />
      <div className="space-y-3">
        <div className="h-10 bg-slate-200 dark:bg-gray-800 rounded-2xl w-80 animate-pulse" />
        <div className="h-3 bg-slate-200 dark:bg-gray-800 rounded-full w-56 animate-pulse opacity-50" />
      </div>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="h-40 bg-white dark:bg-gray-900/50 rounded-[2.5rem] border border-slate-200 dark:border-gray-800 shadow-sm animate-pulse flex flex-col p-8 space-y-4" />
      ))}
    </div>
    <div className="h-[600px] bg-white/80 dark:bg-gray-900/80 rounded-[3rem] border border-slate-200 dark:border-gray-800 shadow-2xl animate-pulse" />
  </div>
);

export default function VentasPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { data, dataInitialized, notify } = useData();
  const { isAdmin } = useAuth();

  const {
    allData: { productos, colaboradores, zonas },
    addVenta,
    updateVenta,
    deleteVenta,
    deleteMultipleVentas,
    updateProductPvp,
    isVentaBlocked,
    createInitialDraft,
    filtros,
    updateFilter,
    clearFilters,
    ventasFiltradas,
    exportarDatos,
    selectedIds,
    handleSelect,
    handleSelectAll,
    isAllSelected,
    clearSelection
  } = useVentasGestion();

  const [activeModal, setActiveModal] = useState(null);
  const [selectedVenta, setSelectedVenta] = useState(null);
  const [pvpEdit, setPvpEdit] = useState({
    producto_id: null,
    producto_nombre: '',
    pvp: 0,
  });
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  const handleSort = useCallback((key) => {
    setSortConfig(prev => {
      if (prev && prev.key === key) {
        return { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' };
      }
      return { key, direction: 'asc' };
    });
  }, []);

  const entidadesSafe = useMemo(() => ({
    operadores: Array.isArray(data?.operadores) ? data.operadores : [],
    niveles: Array.isArray(data?.niveles) ? data.niveles : [],
    reglas: Array.isArray(data?.reglas) ? data.reglas : []
  }), [data?.operadores, data?.niveles, data?.reglas]);

  const datosSafe = useMemo(() => ({
    productos: Array.isArray(productos) ? productos : [],
    colaboradores: Array.isArray(colaboradores) ? colaboradores : [],
    zonas: Array.isArray(zonas) ? zonas : [],
    ventasFiltradas: Array.isArray(ventasFiltradas) ? ventasFiltradas : []
  }), [productos, colaboradores, zonas, ventasFiltradas]);

  const ventasCalc = useMemo(() => {
    if (datosSafe.ventasFiltradas.length === 0) return [];

    const enriched = datosSafe.ventasFiltradas.map((venta) => {
      try {
        const producto = datosSafe.productos.find(p => p?.id === venta?.producto_id);
        const colaborador = datosSafe.colaboradores.find(c => c?.id === venta?.colaborador_id);
        const zona = datosSafe.zonas.find(z => z?.id === venta?.zona_id);
        const operador = entidadesSafe.operadores.find(o =>
          o?.id === (venta?.operador_id || producto?.operador_id)
        ) || null;

        return {
          ...venta,
          productoNombre: producto?.nombre || venta?.producto_id || '',
          zonaNombre: zona?.nombre || venta?.zona_id || '',
          colaboradorNombre: colaborador?.nombre || venta?.colaborador_id || '',
          operadorNombre: operador?.nombre || venta?.operador_id || '',
          _calc: computeVenta({
            venta,
            productos: datosSafe.productos,
            operadores: entidadesSafe.operadores,
            zonas: datosSafe.zonas,
            colaboradores: datosSafe.colaboradores,
            niveles: entidadesSafe.niveles,
            reglas: entidadesSafe.reglas,
          }),
        };
      } catch {
        return {
          ...venta,
          _calc: { ok: false },
        };
      }
    });

    if (sortConfig && sortConfig.key) {
      enriched.sort((a, b) => {
        let valA = '';
        let valB = '';
        if (sortConfig.key === 'cliente') {
          valA = a.cliente || '';
          valB = b.cliente || '';
        }
        return sortConfig.direction === 'asc'
          ? valA.localeCompare(valB, 'es', { sensitivity: 'base' })
          : valB.localeCompare(valA, 'es', { sensitivity: 'base' });
      });
    }

    return enriched;
  }, [datosSafe, entidadesSafe, sortConfig]);

  const pagination = usePagination(ventasCalc, 25);

  const estadisticas = useMemo(() => {
    if (ventasCalc.length === 0) {
      return { totalVentas: 0, volumenTotal: 0, comisionesTotal: 0, ticketMedio: 0, ventasSinPvp: 0 };
    }

    let totalPvp = 0;
    let countConPvp = 0;
    let comisionesTotal = 0;

    ventasCalc.forEach((venta) => {
      const producto = datosSafe.productos.find(p => p?.id === venta?.producto_id);
      const pvpValue = producto?.pvp || venta?.pvp || 0;
      if (pvpValue > 0) {
        totalPvp += pvpValue;
        countConPvp++;
      }
      if (venta?._calc?.ok) comisionesTotal += venta._calc.detalle?.comBruta || 0;
    });

    return {
      totalVentas: ventasCalc.length,
      volumenTotal: totalPvp,
      comisionesTotal,
      ticketMedio: countConPvp > 0 ? totalPvp / countConPvp : 0,
      ventasSinPvp: ventasCalc.length - countConPvp,
    };
  }, [ventasCalc, datosSafe.productos]);

  const openNewVentaModal = useCallback(() => setActiveModal('new'), []);
  const openEditModal = useCallback((venta) => { setSelectedVenta(venta); setActiveModal('edit'); }, []);
  const openDetailModal = useCallback((venta) => { setSelectedVenta(venta); setActiveModal('detail'); }, []);
  const openPvpModal = useCallback((productoId, productoNombre) => {
    setPvpEdit({ producto_id: productoId, producto_nombre: productoNombre, pvp: 0 });
    setActiveModal('pvp');
  }, []);
  const closeModal = useCallback(() => {
    setActiveModal(null);
    setSelectedVenta(null);
    setPvpEdit({ producto_id: null, producto_nombre: "", pvp: 0 });
  }, []);

  const handleDeleteSelected = useCallback(() => {
    if (deleteMultipleVentas && selectedIds?.length > 0) {
      if (window.confirm(`¿Estás seguro de que quieres eliminar ${selectedIds.length} ventas?`)) {
        const success = deleteMultipleVentas(selectedIds);
        if (success && clearSelection) clearSelection();
      }
    }
  }, [deleteMultipleVentas, selectedIds, clearSelection]);

  const handleExport = useCallback(() => {
    if (exportarDatos) exportarDatos(ventasCalc, datosSafe.colaboradores, datosSafe.zonas);
  }, [exportarDatos, ventasCalc, datosSafe.colaboradores, datosSafe.zonas]);

  // El guardado local es instantáneo (addVenta/updateVenta ya lo hicieron
  // cuando resuelven); no se espera la sincronización remota para cerrar el
  // formulario — bloquear el cierre en la red reintroduciría el riesgo de
  // reenvíos duplicados si el usuario reintenta con la red caída. El aviso de
  // que la sincronización remota falló llega aparte, vía notify(), atribuido
  // a esta venta en concreto (antes solo quedaba el toast genérico de
  // "ventas" sin sincronizar, sin decir de qué venta se trataba).
  const handleSaveVenta = useCallback((ventaData) => {
    closeModal();
    addVenta(ventaData).then(({ synced }) => {
      if (!synced) {
        notify?.(`La venta de "${ventaData.cliente || 'este cliente'}" se guardó en este dispositivo, pero no se pudo sincronizar con el servidor.`, 'error');
      }
    });
  }, [addVenta, closeModal, notify]);

  // VentaFormModal llama a onSave(formData.id, dataToSave) al editar (2
  // argumentos) — esta función solo recibía uno (ventaData), así que
  // `ventaData` terminaba siendo en realidad el id (un string) y
  // `dataToSave` (los cambios reales) se descartaba en silencio. updateVenta
  // recibía entonces `changes` = un string: `{...venta, ...changes}` no
  // mezcla ningún campo real de un string (solo índices numéricos), así que
  // NINGÚN cambio de edición llegaba a guardarse jamás, aunque el guardado
  // "tuviera éxito" (local + Supabase, sin avisar de nada porque no fallaba,
  // simplemente no aplicaba los cambios).
  const handleUpdateVenta = useCallback((ventaId, ventaData) => {
    if (ventaId) {
      closeModal();
      updateVenta(ventaId, ventaData).then((synced) => {
        if (!synced) {
          notify?.(`Los cambios en la venta de "${ventaData.cliente || selectedVenta?.cliente || 'este cliente'}" se guardaron en este dispositivo, pero no se pudieron sincronizar con el servidor.`, 'error');
        }
      });
    }
  }, [updateVenta, selectedVenta, closeModal, notify]);

  const handleUpdatePvp = useCallback((id, pvp) => {
    const targetId = id || pvpEdit.producto_id;
    if (targetId) {
      updateProductPvp(targetId, pvp);
      closeModal();
    }
  }, [updateProductPvp, pvpEdit.producto_id, closeModal]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const filtrosUrl = {};
    const modal = params.get('modal');
    if (modal === 'newVenta') {
      setActiveModal('new');
      params.delete('modal');
      navigate(location.pathname + (params.toString() ? `?${params.toString()}` : ''), { replace: true });
      return;
    }

    for (const [key, value] of params.entries()) {
      let filtroKey = key;
      if (key === 'operador') filtroKey = 'operador_id';
      if (key === 'colaborador') filtroKey = 'colaborador_id';
      if (key === 'zona') filtroKey = 'zona_id';
      if (['estado', 'colaborador_id', 'operador_id', 'zona_id', 'producto_id'].includes(filtroKey)) {
        filtrosUrl[filtroKey] = value;
      } else if (filtroKey === 'sinPvp') {
        filtrosUrl[filtroKey] = value === 'true';
      } else if (filtroKey !== 'titulo') {
        filtrosUrl[filtroKey] = value;
      }
    }

    if (Object.keys(filtrosUrl).length > 0 && updateFilter) {
      Object.entries(filtrosUrl).forEach(([key, value]) => updateFilter(key, value));
    }
  }, [location.search, location.pathname, updateFilter, navigate]);

  const hasActiveFilters = useMemo(() =>
    filtros && Object.values(filtros).some(v => v !== "" && v !== false && (Array.isArray(v) ? v.length > 0 : true)),
    [filtros]
  );

  if (!dataInitialized) return <LoadingVentas />;

  const resolveProductoName = (id) => datosSafe.productos.find(p => p.id === id)?.nombre || id || "";
  const resolveColaboradorName = (id) => datosSafe.colaboradores.find(c => c.id === id)?.nombre || id || "";
  const resolveZonaName = (id) => datosSafe.zonas.find(z => z.id === id)?.nombre || id || "";
  const resolveOperadorName = (id) => entidadesSafe.operadores.find(o => o.id === id)?.nombre || id || "";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-10 pb-32 px-4"
    >
      {/* SECTION MASTER HEADER */}
      <div className="relative group pt-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 relative z-10">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 rounded-[2.5rem] bg-gradient-to-br from-[var(--brand-primary)] to-[var(--brand-primary)] opacity-90 flex items-center justify-center shadow-2xl shadow-[var(--brand-primary)]/20 group-hover:scale-105 transition-transform duration-500">
              <TableIcon className="w-10 h-10 text-white" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <h1 className="text-4xl font-black text-slate-800 dark:text-white tracking-tighter uppercase leading-none">Ventas Master</h1>
                <div className="px-3 py-1 bg-emerald-500/10 text-emerald-500 rounded-full border border-emerald-500/20 text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 animate-pulse">
                  <Zap className="w-3 h-3" /> Live
                </div>
              </div>
              <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[3px]">Inteligencia de Negocio y Control de Operaciones</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 px-6 py-3 rounded-[2rem] bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/5">
              <Search className="w-4 h-4 text-[var(--brand-primary)] opacity-60" />
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Global Scan Active</span>
            </div>
            <div className="w-1.5 h-10 bg-[var(--brand-primary)] opacity-20 rounded-full hidden lg:block" />
            <div className="text-right hidden sm:block">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest opacity-60">Último Sinc</p>
              <p className="text-xs font-bold text-slate-800 dark:text-white">{new Date().toLocaleTimeString()}</p>
            </div>
          </div>
        </div>

        {/* Ambient background glow */}
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-[var(--brand-primary)]/10 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--brand-primary)]/5 blur-[100px] rounded-full pointer-events-none" />
      </div>

      {/* STATS MASTER GRID */}
      <VentasStats
        ventasCalc={ventasCalc}
        productos={datosSafe.productos}
      />

      {/* PIPELINE & PROCESS VISUALIZER */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="space-y-6"
      >
        <div className="flex items-center gap-3">
          <Zap className="w-5 h-5 text-amber-500" />
          <h3 className="text-sm font-black text-slate-500 uppercase tracking-[4px]">Flujo de Sincronización</h3>
        </div>
        <VentasProcessWidget
          ventas={ventasCalc}
          onFilterChange={updateFilter}
        />
      </motion.section>

      {/* ACTIONS & FILTERS ORCHESTRATOR */}
      <div className="grid grid-cols-1 gap-8">
        <div className="rounded-[3rem] bg-white/50 dark:bg-gray-900/50 border border-slate-200 dark:border-white/5 backdrop-blur-3xl p-8 shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[var(--brand-primary)]/50 to-transparent" />

          <VentasFilters
            filtros={filtros}
            updateFilter={updateFilter}
            clearFilters={clearFilters}
            onExport={handleExport}
            colaboradores={datosSafe.colaboradores}
            operadores={entidadesSafe.operadores}
            zonas={datosSafe.zonas}
            hasActiveFilters={hasActiveFilters}
          />

          <div className="h-px bg-slate-200 dark:bg-white/5 mt-10 mb-8" />

          <VentasActions
            selectedIds={selectedIds || []}
            onNewVenta={openNewVentaModal}
            onDeleteSelected={handleDeleteSelected}
            isAdmin={isAdmin}
            ventasSinPvp={estadisticas.ventasSinPvp}
          />
        </div>

        {/* DATA TABLE SECTION */}
        <div className="space-y-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-5 px-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-[var(--brand-primary)]/10 rounded-2xl">
                <TrendingUp className="w-5 h-5 text-[var(--brand-primary)]" />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-800 dark:text-white tracking-tighter uppercase">Vista Maestra de Registros</h3>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mt-1">Sincronización en tiempo real protegida</p>
              </div>
            </div>

            <div className="flex items-center gap-3 bg-white/5 dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 p-1.5 rounded-2xl shadow-inner">
              <Pagination
                currentPage={pagination?.currentPage || 1}
                pageSize={pagination?.pageSize || 25}
                totalItems={pagination?.totalItems || 0}
                totalPages={Math.ceil((pagination?.totalItems || 0) / (pagination?.pageSize || 25))}
                onPageChange={pagination?.handlePageChange}
                onPageSizeChange={pagination?.handlePageSizeChange}
              />
            </div>
          </div>

          <VentasTable
            ventasCalc={pagination?.paginatedData || []}
            productos={datosSafe.productos}
            colaboradores={datosSafe.colaboradores}
            zonas={datosSafe.zonas}
            operadores={entidadesSafe.operadores}
            selectedIds={selectedIds || []}
            onSelect={handleSelect}
            onSelectAll={handleSelectAll}
            isAllSelected={isAllSelected}
            onEdit={openEditModal}
            onView={openDetailModal}
            onDelete={(id) => deleteVenta(id)}
            onDefinePvp={openPvpModal}
            isVentaBlocked={isVentaBlocked}
            isAdmin={isAdmin}
            sortConfig={sortConfig}
            onSort={handleSort}
          />
        </div>
      </div>

      {/* MODAL ORCHESTRATOR (UPGRADED) */}
      <AnimatePresence>
        {(activeModal === 'new' || activeModal === 'edit') && (
          <VentaFormModal
            isOpen={true}
            onClose={closeModal}
            onSave={activeModal === 'new' ? handleSaveVenta : handleUpdateVenta}
            venta={activeModal === 'edit' ? selectedVenta : null}
            createInitialDraft={createInitialDraft}
            productos={datosSafe.productos}
            operadores={entidadesSafe.operadores}
            colaboradores={datosSafe.colaboradores}
            zonas={datosSafe.zonas}
            niveles={entidadesSafe.niveles}
            reglas={entidadesSafe.reglas}
            resolveProductoName={resolveProductoName}
            resolveColaboradorName={resolveColaboradorName}
            resolveZonaName={resolveZonaName}
            resolveOperadorName={resolveOperadorName}
          />
        )}

        {activeModal === 'detail' && selectedVenta && (
          <VentaDetailModal
            isOpen={true}
            onClose={closeModal}
            onEdit={openEditModal}
            venta={selectedVenta}
            productos={datosSafe.productos}
            colaboradores={datosSafe.colaboradores}
            zonas={datosSafe.zonas}
            isVentaBlocked={isVentaBlocked}
          />
        )}

        {activeModal === 'pvp' && pvpEdit.producto_id && (
          <PvpEditModal
            isOpen={true}
            onClose={closeModal}
            onSave={handleUpdatePvp}
            productoId={pvpEdit.producto_id}
            productoNombre={pvpEdit.producto_nombre}
            pvpInicial={pvpEdit.pvp}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
