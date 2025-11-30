// src/components/ventas/VentasPage.jsx
// VERSIÓN OPTIMIZADA - Consolidación final del módulo ventas
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useData } from '../../context/AppContexts';
import { computeVenta } from '../../utils/calculos';
import { useVentasGestion } from '../../hooks/useVentasGestion';
import { usePagination } from '../../hooks/usePagination';
import Pagination from '../ui/Pagination';

// Componentes consolidados
import { VentasStats } from './VentasStats';
import { VentasActions } from './VentasActions';
import { VentasTable } from './VentasTable';
import VentasFilters from './VentasFilters';
import VentaFormModal from './modals/VentaFormModal';
import { VentaDetailModal } from './modals/VentaDetailModal';
import { PvpEditModal } from './modals/PvpEditModal';

// Componente optimizado de Loading
const LoadingVentas = () => (
  <div className="p-6">
    <div className="animate-pulse space-y-4">
      <div className="h-8 bg-slate-200 rounded w-1/4" />
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-32 bg-slate-200 rounded" />
        ))}
      </div>
      <div className="h-64 bg-slate-200 rounded" />
    </div>
  </div>
);

export default function VentasPage() {
  // Hooks de React Router
  const location = useLocation();
  const navigate = useNavigate();
  // Contexto global
  const { data, dataInitialized } = useData();
  
  // Hook consolidado de gestión de ventas
  const {
    // Datos desde allData
    allData: { productos, colaboradores, zonas },
    // Operaciones CRUD
    addVenta,
    updateVenta,
    deleteVenta,
    deleteMultipleVentas,
    updateEstado,
    updateProductPvp,
    isVentaBlocked,
    createInitialDraft,
    // Filtros
    filtros,
    updateFilter,
    clearFilters,
    ventasFiltradas,
    exportarDatos,
    // Selección
    selectedIds,
    handleSelect,
    handleSelectAll,
    isAllSelected,
    clearSelection
  } = useVentasGestion();

  // Estados de UI
  const [activeModal, setActiveModal] = useState(null);
  const [selectedVenta, setSelectedVenta] = useState(null);
  const [pvpEdit, setPvpEdit] = useState({
    producto_id: null,
    producto_nombre: '',
    pvp: 0,
  });

  // ==========================================
  // DATOS SEGUROS - MEMOIZACIÓN OPTIMIZADA
  // ==========================================
  
  // Arrays defensivos para datos del contexto
  const entidadesSafe = useMemo(() => ({
    operadores: Array.isArray(data?.operadores) ? data.operadores : [],
    niveles: Array.isArray(data?.niveles) ? data.niveles : [],
    reglas: Array.isArray(data?.reglas) ? data.reglas : []
  }), [data?.operadores, data?.niveles, data?.reglas]);

  // Arrays defensivos para datos del hook
  const datosSafe = useMemo(() => ({
    productos: Array.isArray(productos) ? productos : [],
    colaboradores: Array.isArray(colaboradores) ? colaboradores : [],
    zonas: Array.isArray(zonas) ? zonas : [],
    ventasFiltradas: Array.isArray(ventasFiltradas) ? ventasFiltradas : []
  }), [productos, colaboradores, zonas, ventasFiltradas]);

  // ==========================================
  // CÁLCULO DE VENTAS OPTIMIZADO
  // ==========================================
  
  const ventasCalc = useMemo(() => {
    if (datosSafe.ventasFiltradas.length === 0) {
      return [];
    }
    
    return datosSafe.ventasFiltradas.map((venta) => {
      try {
        // Resolver entidades por ID
        const producto = datosSafe.productos.find(p => p?.id === venta?.producto_id);
        const colaborador = datosSafe.colaboradores.find(c => c?.id === venta?.colaborador_id);
        const zona = datosSafe.zonas.find(z => z?.id === venta?.zona_id);
        const operador = entidadesSafe.operadores.find(o => 
          o?.id === (venta?.operador_id || producto?.operador_id)
        ) || null;

        return {
          ...venta,
          // Nombres amigables pre-calculados
          productoNombre: producto?.nombre || venta?.producto_id || '',
          zonaNombre: zona?.nombre || venta?.zona_id || '',
          colaboradorNombre: colaborador?.nombre || venta?.colaborador_id || '',
          operadorNombre: operador?.nombre || venta?.operador_id || '',

          // Cálculo de negocio
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
        // LOG ELIMINADO
        return {
          ...venta,
          productoNombre: venta?.producto_id || '',
          zonaNombre: venta?.zona_id || '',
          colaboradorNombre: venta?.colaborador_id || '',
          operadorNombre: venta?.operador_id || '',
          _calc: { ok: false },
        };
      }
    });
  }, [datosSafe, entidadesSafe]);

  // Paginación después de calcular las ventas
  const pagination = usePagination(ventasCalc, 25);

  // ==========================================
  // ESTADÍSTICAS OPTIMIZADAS
  // ==========================================
  
  const estadisticas = useMemo(() => {
    if (ventasCalc.length === 0) {
      return {
        totalVentas: 0,
        volumenTotal: 0,
        comisionesTotal: 0,
        ticketMedio: 0,
        ventasSinPvp: 0,
      };
    }

    let totalPvp = 0;
    let countConPvp = 0;
    let comisionesTotal = 0;

    ventasCalc.forEach((venta) => {
      try {
        // Calcular PVP
        const producto = datosSafe.productos.find(p => p?.id === venta?.producto_id);
        const pvpValue = producto?.pvp || venta?.pvp || 0;
        
        if (pvpValue > 0) {
          totalPvp += pvpValue;
          countConPvp++;
        }
        
        // Calcular comisiones
        if (venta?._calc?.ok) {
          comisionesTotal += venta._calc.detalle?.comBruta || 0;
        }
      } catch {
        // LOG ELIMINADO
      }
    });

    return {
      totalVentas: ventasCalc.length,
      volumenTotal: totalPvp,
      comisionesTotal,
      ticketMedio: countConPvp > 0 ? totalPvp / countConPvp : 0,
      ventasSinPvp: ventasCalc.length - countConPvp,
    };
  }, [ventasCalc, datosSafe.productos]);

  // ==========================================
  // HANDLERS OPTIMIZADOS
  // ==========================================

  // Handlers de modales con useCallback
  const openNewVentaModal = useCallback(() => setActiveModal('new'), []);
  
  const openEditModal = useCallback((venta) => {
    setSelectedVenta(venta);
    setActiveModal('edit');
  }, []);
  
  const openDetailModal = useCallback((venta) => {
    setSelectedVenta(venta);
    setActiveModal('detail');
  }, []);
  
  const openPvpModal = useCallback((productoId, productoNombre) => {
    setPvpEdit({
      producto_id: productoId,
      producto_nombre: productoNombre,
      pvp: 0,
    });
    setActiveModal('pvp');
  }, []);
  
  const closeModal = useCallback(() => {
    setActiveModal(null);
    setSelectedVenta(null);
    setPvpEdit({ producto_id: null, producto_nombre: "", pvp: 0 });
  }, []);

  // Handlers de acciones con useCallback
  const handleDeleteSelected = useCallback(() => {
    if (deleteMultipleVentas && selectedIds?.length > 0) {
      const success = deleteMultipleVentas(selectedIds);
      if (success && clearSelection) {
        clearSelection();
      }
    }
  }, [deleteMultipleVentas, selectedIds, clearSelection]);

  const handleExport = useCallback(() => {
    if (exportarDatos) {
      exportarDatos(ventasCalc, datosSafe.colaboradores, datosSafe.zonas);
    }
  }, [exportarDatos, ventasCalc, datosSafe.colaboradores, datosSafe.zonas]);

  const handleActivate = useCallback((ventaId) => {
    if (updateEstado) {
      updateEstado(ventaId, 'ACTIVO');
    }
  }, [updateEstado]);

  const handleDelete = useCallback((ventaId) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar esta venta?')) {
      deleteVenta && deleteVenta(ventaId);
    }
  }, [deleteVenta]);

  const handleSaveVenta = useCallback((ventaData) => {
    addVenta && addVenta(ventaData);
  }, [addVenta]);

  const handleUpdateVenta = useCallback((ventaId, changes) => {
    updateVenta && updateVenta(ventaId, changes);
  }, [updateVenta]);

  const handleUpdatePvp = useCallback((productoId, pvp) => {
    updateProductPvp && updateProductPvp(productoId, pvp);
  }, [updateProductPvp]);

  // ==========================================
  // EFECTOS
  // ==========================================

  // Efecto para aplicar filtros desde URL y manejar modales
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const filtrosUrl = {};
    
    // Abrir modal de nueva venta si viene en la URL
    const modal = params.get('modal');
    if (modal === 'newVenta') {
      setActiveModal('new');
      params.delete('modal');
      const newSearch = params.toString();
      const newUrl = newSearch ? `${location.pathname}?${newSearch}` : location.pathname;
      navigate(newUrl, { replace: true });
      return;
    }
    
    // Procesar parámetros de filtros
    for (const [key, value] of params.entries()) {
      // Mapear claves de la URL a las esperadas por el estado de filtros
      let filtroKey = key;
      if (key === 'operador') filtroKey = 'operador_id';
      if (key === 'colaborador') filtroKey = 'colaborador_id';
      if (key === 'zona') filtroKey = 'zona_id';
      // Asignar como string para selects
      if (['estado', 'colaborador_id', 'operador_id', 'zona_id', 'producto_id'].includes(filtroKey)) {
        filtrosUrl[filtroKey] = value;
      } else if (filtroKey === 'sinPvp') {
        filtrosUrl[filtroKey] = value === 'true';
      } else if (filtroKey !== 'titulo') {
        filtrosUrl[filtroKey] = value;
      }
    }
    
    if (Object.keys(filtrosUrl).length > 0 && updateFilter) {
      Object.entries(filtrosUrl).forEach(([key, value]) => {
        updateFilter(key, value);
      });
    }
  }, [location.search, location.pathname, updateFilter, navigate]);

  // ==========================================
  // VARIABLES COMPUTADAS
  // ==========================================

  const isAdmin = true; // TODO: Obtener del contexto de usuario

  // Verificar si hay filtros activos
  const hasActiveFilters = useMemo(() => 
    filtros && Object.values(filtros).some((value) => {
      if (Array.isArray(value)) return value.length > 0;
      if (typeof value === 'string') return value !== '';
      if (typeof value === 'boolean') return value;
      return false;
    }), [filtros]
  );

  // ==========================================
  // RENDERIZADO
  // ==========================================

  // Mostrar loading mientras se cargan los datos
  if (!dataInitialized) {
    return <LoadingVentas />;
  }

  // Helpers de resolución de nombres
  const resolveProductoName = (id) => {
    const prod = datosSafe.productos.find(p => p.id === id);
    return prod?.nombre || id || "";
  };
  const resolveColaboradorName = (id) => {
    const colab = datosSafe.colaboradores.find(c => c.id === id);
    return colab?.nombre || id || "";
  };
  const resolveZonaName = (id) => {
    const zona = datosSafe.zonas.find(z => z.id === id);
    return zona?.nombre || id || "";
  };
  const resolveOperadorName = (id) => {
    const op = entidadesSafe.operadores.find(o => o.id === id);
    return op?.nombre || id || "";
  };

  return (
    <div className="space-y-6">
      {/* Estadísticas */}
      <VentasStats 
        ventasCalc={ventasCalc} 
        productos={datosSafe.productos} 
      />

      {/* Filtros */}
      <VentasFilters
        filtros={filtros}
        updateFilter={updateFilter}
        clearFilters={clearFilters}
        onExport={handleExport}
        colaboradores={datosSafe.colaboradores}
        operadores={entidadesSafe.operadores}
        hasActiveFilters={hasActiveFilters}
      />

      {/* Acciones */}
      <VentasActions
        ventasCount={ventasCalc.length}
        selectedIds={selectedIds || []}
        onNewVenta={openNewVentaModal}
        onDeleteSelected={handleDeleteSelected}
        isAdmin={isAdmin}
        ventasSinPvp={estadisticas.ventasSinPvp}
      />

      {/* Paginador superior */}
      <Pagination
        currentPage={pagination?.currentPage || 1}
        pageSize={pagination?.pageSize || 25}
        totalItems={pagination?.totalItems || 0}
        totalPages={Math.ceil((pagination?.totalItems || 0) / (pagination?.pageSize || 25))}
        onPageChange={pagination?.handlePageChange}
        onPageSizeChange={pagination?.handlePageSizeChange}
      />

      {/* Tabla con Paginación */}
      <VentasTable
        ventasCalc={pagination?.paginatedData || []}
        productos={datosSafe.productos}
        colaboradores={datosSafe.colaboradores}
        zonas={datosSafe.zonas}
        operadores={entidadesSafe.operadores}
        resolveProductoName={resolveProductoName}
        resolveColaboradorName={resolveColaboradorName}
        resolveZonaName={resolveZonaName}
        resolveOperadorName={resolveOperadorName}
        selectedIds={selectedIds || []}
        onSelect={handleSelect}
        onSelectAll={handleSelectAll}
        isAllSelected={isAllSelected}
        onEdit={openEditModal}
        onView={openDetailModal}
        onDelete={handleDelete}
        onActivate={handleActivate}
        onDefinePvp={openPvpModal}
        isVentaBlocked={isVentaBlocked}
        isAdmin={isAdmin}
        currentPage={pagination?.currentPage || 1}
        pageSize={pagination?.pageSize || 25}
        totalItems={pagination?.totalItems || 0}
        totalPages={Math.ceil((pagination?.totalItems || 0) / (pagination?.pageSize || 25))}
        onPageChange={pagination?.handlePageChange}
        onPageSizeChange={pagination?.handlePageSizeChange}
      />

      {/* Paginador inferior */}
      <Pagination
        currentPage={pagination?.currentPage || 1}
        pageSize={pagination?.pageSize || 25}
        totalItems={pagination?.totalItems || 0}
        totalPages={Math.ceil((pagination?.totalItems || 0) / (pagination?.pageSize || 25))}
        onPageChange={pagination?.handlePageChange}
        onPageSizeChange={pagination?.handlePageSizeChange}
      />

      {/* Modales consolidados */}
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
    </div>
  );
}