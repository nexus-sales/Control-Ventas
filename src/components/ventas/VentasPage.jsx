import React, { useState, useMemo, useContext, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { DataCtx } from '../../context/contexts';
import { computeVenta } from '../../utils/calculos';
import { useVentasOperations } from '../../hooks/useVentasOperations';
import { useVentasFilters } from '../../hooks/useVentasFilters';
import { useVentasSelection } from '../../hooks/useVentasSelection';
import { usePagination } from '../../hooks/usePagination';
import Loading from '../common/Loading';

// Componentes
import { VentasStats } from './VentasStats';
import { VentasFilters } from './VentasFilters';
import { VentasActions } from './VentasActions';
import { VentasTable } from './VentasTable';
import { NewVentaModal } from './modals/NewVentaModal';
import { EditVentaModal } from './modals/EditVentaModal';
import { VentaDetailModal } from './modals/VentaDetailModal';
import { PvpEditModal } from './modals/PvpEditModal';

export default function VentasPage() {
  // Hooks de React Router
  const location = useLocation();
  const navigate = useNavigate();
  
  // Contexto global
  const { data, isSupabaseAvailable, dataInitialized } = useContext(DataCtx);
  
  // Datos seguros
  const operadores = useMemo(
    () => (Array.isArray(data?.operadores) ? data.operadores : []),
    [data?.operadores]
  );
  const niveles = useMemo(() => Array.isArray(data?.niveles) ? data.niveles : [], [data?.niveles]);
  const reglas = useMemo(() => Array.isArray(data?.reglas) ? data.reglas : [], [data?.reglas]);

  // Hooks personalizados
  const ventasOps = useVentasOperations();
  const filtrosData = useVentasFilters(ventasOps.ventas, ventasOps.productos);
  

  
  // Calcular ventas con datos de negocio ANTES de paginación
  const ventasCalc = useMemo(() => {
    if (!Array.isArray(filtrosData.ventasFiltradas)) return [];
    
    return filtrosData.ventasFiltradas.map((v) => ({
      ...v,
      _calc: computeVenta({
        venta: v,
        productos: ventasOps.productos || [],
        operadores: operadores || [],
        zonas: ventasOps.zonas || [],
        colaboradores: ventasOps.colaboradores || [],
        niveles: niveles || [],
        reglas: reglas || [],
      }),
    }));
  }, [filtrosData.ventasFiltradas, ventasOps.productos, operadores, ventasOps.zonas, ventasOps.colaboradores, niveles, reglas]);

  // Paginación después de calcular las ventas
  const pagination = usePagination(ventasCalc, 25);
  const selectionData = useVentasSelection(pagination.paginatedData);

  // Estados de UI
  const [activeModal, setActiveModal] = useState(null);
  const [selectedVenta, setSelectedVenta] = useState(null);
  const [pvpEdit, setPvpEdit] = useState({
    producto_id: null,
    producto_nombre: "",
    pvp: 0,
  });

  // Efecto para aplicar filtros desde URL y manejar modales
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const filtrosUrl = {};
    
    // Verificar si se debe abrir un modal
    const modal = params.get('modal');
    if (modal === 'newVenta') {
      // Abrir modal de nueva venta automáticamente
      setActiveModal('new'); // CORREGIDO: cambiado de 'newVenta' a 'new'
      // Limpiar el parámetro de la URL
      params.delete('modal');
      const newSearch = params.toString();
      const newUrl = newSearch ? `${location.pathname}?${newSearch}` : location.pathname;
      navigate(newUrl, { replace: true });
      return;
    }
    
    // Procesar parámetros de filtros
    for (const [key, value] of params.entries()) {
      if (key === 'estado' || key === 'colaborador' || key === 'zona') {
        filtrosUrl[key] = value.split(',');
      } else if (key === 'sinPvp') {
        filtrosUrl[key] = value === 'true';
      } else if (key !== 'titulo') {
        filtrosUrl[key] = value;
      }
    }
    
    // Aplicar filtros si existen
    if (Object.keys(filtrosUrl).length > 0) {
      Object.entries(filtrosUrl).forEach(([key, value]) => {
        if (key === 'estado' && filtrosData.setEstadoFiltro) {
          value.forEach(estado => filtrosData.setEstadoFiltro(estado, true));
        } else if (key === 'fechaDesde' && filtrosData.setFechaDesde) {
          filtrosData.setFechaDesde(value);
        } else if (key === 'fechaHasta' && filtrosData.setFechaHasta) {
          filtrosData.setFechaHasta(value);
        }
        // Añadir más filtros según sea necesario
      });
    }
  }, [location.search, location.pathname, filtrosData, navigate, setActiveModal]);

  // Calcular estadísticas
  const estadisticas = useMemo(() => {
    let totalPvp = 0;
    let countConPvp = 0;

    ventasCalc.forEach((v) => {
      const prod = ventasOps.productos.find((p) => p?.id === v.producto_id);
      const pvpValue = prod?.pvp || v.pvp || 0;
      if (pvpValue > 0) {
        totalPvp += pvpValue;
        countConPvp++;
      }
    });

    return {
      totalVentas: ventasCalc.length,
      volumenTotal: totalPvp,
      comisionesTotal: ventasCalc.reduce(
        (sum, v) => sum + (v._calc?.ok ? v._calc.detalle.comBruta : 0),
        0,
      ),
      ticketMedio: countConPvp > 0 ? totalPvp / countConPvp : 0,
      ventasSinPvp: ventasCalc.length - countConPvp,
    };
  }, [ventasCalc, ventasOps.productos]);

  // Handlers de modales
  const openNewVentaModal = () => setActiveModal('new');
  const openEditModal = (venta) => {
    setSelectedVenta(venta);
    setActiveModal('edit');
  };
  const openDetailModal = (venta) => {
    setSelectedVenta(venta);
    setActiveModal('detail');
  };
  const openPvpModal = (productoId, productoNombre) => {
    setPvpEdit({
      producto_id: productoId,
      producto_nombre: productoNombre,
      pvp: 0,
    });
    setActiveModal('pvp');
  };
  const closeModal = () => {
    setActiveModal(null);
    setSelectedVenta(null);
    setPvpEdit({ producto_id: null, producto_nombre: "", pvp: 0 });
  };

  // Handlers de acciones
  const handleDeleteSelected = () => {
    const success = ventasOps.deleteMultipleVentas(selectionData.selectedIds);
    if (success) {
      selectionData.clearSelection();
    }
  };

  const handleExport = () => {
    filtrosData.exportarDatos(ventasCalc, ventasOps.colaboradores, ventasOps.zonas);
  };

  const handleActivate = (ventaId) => {
    ventasOps.updateEstado(ventaId, 'ACTIVO');
  };

  const handleDelete = (ventaId) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar esta venta?')) {
      ventasOps.deleteVenta(ventaId);
    }
  };

  const handleSaveVenta = (ventaData) => {
    ventasOps.addVenta(ventaData);
  };

  const handleUpdateVenta = (ventaId, changes) => {
    ventasOps.updateVenta(ventaId, changes);
  };

  const handleUpdatePvp = (productoId, pvp) => {
    ventasOps.updateProductPvp(productoId, pvp);
  };

  const isAdmin = true; // TODO: Obtener del contexto de usuario

  // Mostrar loading mientras se cargan los datos
  if (!dataInitialized) {
    return <Loading />;
  }

  return (
    <div className="space-y-6">
      {/* Estadísticas */}
      <VentasStats ventasCalc={ventasCalc} productos={ventasOps.productos} />

      {/* Filtros */}
      <VentasFilters
        {...filtrosData}
        onExport={handleExport}
        colaboradores={ventasOps.colaboradores}
        productos={ventasOps.productos}
        operadores={operadores}
        zonas={ventasOps.zonas}
      />

      {/* Acciones */}
      <VentasActions
        ventasCount={ventasCalc.length}
        selectedIds={selectionData.selectedIds}
        onNewVenta={openNewVentaModal}
        onDeleteSelected={handleDeleteSelected}
        isSupabaseAvailable={isSupabaseAvailable}
        isAdmin={isAdmin}
        ventasSinPvp={estadisticas.ventasSinPvp}
      />

      {/* Tabla con Paginación */}
      <VentasTable
        ventasCalc={pagination.paginatedData}
        productos={ventasOps.productos}
        colaboradores={ventasOps.colaboradores}
        zonas={ventasOps.zonas}
        selectedIds={selectionData.selectedIds}
        onSelect={selectionData.handleSelect}
        onSelectAll={selectionData.handleSelectAll}
        isAllSelected={selectionData.isAllSelected}
        onEdit={openEditModal}
        onView={openDetailModal}
        onDelete={handleDelete}
        onActivate={handleActivate}
        onDefinePvp={openPvpModal}
        isVentaBlocked={ventasOps.isVentaBlocked}
        isAdmin={isAdmin}
        // Props de paginación
        currentPage={pagination.currentPage}
        pageSize={pagination.pageSize}
        totalItems={pagination.totalItems}
        onPageChange={pagination.handlePageChange}
        onPageSizeChange={pagination.handlePageSizeChange}
      />

      {/* Modales */}
      {activeModal === 'new' && (
        <NewVentaModal
          isOpen={true}
          onClose={closeModal}
          onSave={handleSaveVenta}
          createInitialDraft={ventasOps.createInitialDraft}
          productos={ventasOps.productos}
          colaboradores={ventasOps.colaboradores}
          zonas={ventasOps.zonas}
        />
      )}

      {activeModal === 'edit' && selectedVenta && (
        <EditVentaModal
          isOpen={true}
          onClose={closeModal}
          onSave={handleUpdateVenta}
          venta={selectedVenta}
          productos={ventasOps.productos}
          colaboradores={ventasOps.colaboradores}
          zonas={ventasOps.zonas}
        />
      )}

      {activeModal === 'detail' && selectedVenta && (
        <VentaDetailModal
          isOpen={true}
          onClose={closeModal}
          onEdit={openEditModal}
          venta={selectedVenta}
          productos={ventasOps.productos}
          colaboradores={ventasOps.colaboradores}
          zonas={ventasOps.zonas}
          isVentaBlocked={ventasOps.isVentaBlocked}
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
