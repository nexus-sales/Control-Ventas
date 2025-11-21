import React, { useState, useMemo, useContext, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { DataContext } from '../../context/DataContext';
import { computeVenta } from '../../utils/calculos';
import { useVentasGestion } from '../../hooks/useVentasGestion';
import { usePagination } from '../../hooks/usePagination';
import Loading from '../common/Loading';
import { Search, Filter, Download, X } from 'lucide-react';

// Componentes consolidados
import { VentasStats } from './VentasStats';
import { VentasActions } from './VentasActions';
import { VentasTable } from './VentasTable';
import VentaFormModal from './modals/VentaFormModal';
import { VentaDetailModal } from './modals/VentaDetailModal';
import { PvpEditModal } from './modals/PvpEditModal';

export default function VentasPage() {
  // Hooks de React Router
  const location = useLocation();
  const navigate = useNavigate();
  
  // Contexto global
  const { data, dataInitialized } = useContext(DataContext);
  
  // Hook consolidado de gestión de ventas
  const {
    // Datos
    ventas,
    productos,
    colaboradores,
    zonas,
    
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

  // Datos seguros - ARRAYS DEFENSIVOS MEJORADOS
  const operadores = useMemo(
    () => (Array.isArray(data?.operadores) ? data.operadores : []),
    [data?.operadores]
  );
  const niveles = useMemo(() => Array.isArray(data?.niveles) ? data.niveles : [], [data?.niveles]);
  const reglas = useMemo(() => Array.isArray(data?.reglas) ? data.reglas : [], [data?.reglas]);

  // Arrays defensivos para props y selects - VALIDACIÓN MEJORADA
  const productosSafe = useMemo(() => Array.isArray(productos) ? productos : [], [productos]);
  const colaboradoresSafe = useMemo(() => Array.isArray(colaboradores) ? colaboradores : [], [colaboradores]);
  const zonasSafe = useMemo(() => Array.isArray(zonas) ? zonas : [], [zonas]);
  const operadoresSafe = useMemo(() => Array.isArray(operadores) ? operadores : [], [operadores]);
  const ventasFiltradasSafe = useMemo(() => Array.isArray(ventasFiltradas) ? ventasFiltradas : [], [ventasFiltradas]);
  
  // Calcular ventas con datos de negocio ANTES de paginación - USANDO ARRAYS SEGUROS
  const ventasCalc = useMemo(() => {
    if (!Array.isArray(ventasFiltradasSafe) || ventasFiltradasSafe.length === 0) {
      return [];
    }
    
    return ventasFiltradasSafe.map((v) => {
      try {
        return {
          ...v,
          _calc: computeVenta({
            venta: v,
            productos: productosSafe,
            operadores: operadoresSafe,
            zonas: zonasSafe,
            colaboradores: colaboradoresSafe,
            niveles: niveles,
            reglas: reglas,
          }),
        };
      } catch (error) {
        console.error('Error calculando venta:', error, v);
        return {
          ...v,
          _calc: { ok: false, error: error.message }
        };
      }
    });
  }, [ventasFiltradasSafe, productosSafe, operadoresSafe, zonasSafe, colaboradoresSafe, niveles, reglas]);

  // Paginación después de calcular las ventas - CON VALIDACIÓN
  const ventasCalcSafe = useMemo(() => Array.isArray(ventasCalc) ? ventasCalc : [], [ventasCalc]);
  const pagination = usePagination(ventasCalcSafe, 25);

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
      setActiveModal('new');
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
        updateFilter && updateFilter(key, value);
      });
    }
  }, [location.search, location.pathname, updateFilter, navigate]);

  // Calcular estadísticas - CON ARRAYS DEFENSIVOS COMPLETOS
  const estadisticas = useMemo(() => {
    let totalPvp = 0;
    let countConPvp = 0;

    // Validar que ventasCalcSafe sea un array válido
    if (!Array.isArray(ventasCalcSafe)) {
      return {
        totalVentas: 0,
        volumenTotal: 0,
        comisionesTotal: 0,
        ticketMedio: 0,
        ventasSinPvp: 0,
      };
    }
    
    ventasCalcSafe.forEach((v) => {
      try {
        // Usar array defensivo para evitar errores cuando productos es undefined
        const prod = productosSafe.find((p) => p?.id === v?.producto_id);
        const pvpValue = prod?.pvp || v?.pvp || 0;
        
        if (pvpValue > 0) {
          totalPvp += pvpValue;
          countConPvp++;
        }
      } catch (error) {
        console.error('Error procesando estadística de venta:', error, v);
      }
    });

    const comisionesTotal = ventasCalcSafe.reduce((sum, v) => {
      try {
        return sum + (v?._calc?.ok ? (v._calc.detalle?.comBruta || 0) : 0);
      } catch (error) {
        console.error('Error calculando comisión:', error, v);
        return sum;
      }
    }, 0);

    return {
      totalVentas: ventasCalcSafe.length,
      volumenTotal: totalPvp,
      comisionesTotal,
      ticketMedio: countConPvp > 0 ? totalPvp / countConPvp : 0,
      ventasSinPvp: ventasCalcSafe.length - countConPvp,
    };
  }, [ventasCalcSafe, productosSafe]);

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

  // Handlers de acciones - CON VALIDACIONES
  const handleDeleteSelected = () => {
    if (deleteMultipleVentas && Array.isArray(selectedIds) && selectedIds.length > 0) {
      const success = deleteMultipleVentas(selectedIds);
      if (success && clearSelection) {
        clearSelection();
      }
    }
  };

  const handleExport = () => {
    if (exportarDatos) {
      exportarDatos(ventasCalcSafe, colaboradoresSafe, zonasSafe);
    }
  };

  const handleActivate = (ventaId) => {
    if (updateEstado) {
      updateEstado(ventaId, 'ACTIVO');
    }
  };

  const handleDelete = (ventaId) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar esta venta?') && deleteVenta) {
      deleteVenta(ventaId);
    }
  };

  const handleSaveVenta = (ventaData) => {
    if (addVenta) {
      addVenta(ventaData);
    }
  };

  const handleUpdateVenta = (ventaId, changes) => {
    if (updateVenta) {
      updateVenta(ventaId, changes);
    }
  };

  const handleUpdatePvp = (productoId, pvp) => {
    if (updateProductPvp) {
      updateProductPvp(productoId, pvp);
    }
  };

  const isAdmin = true; // TODO: Obtener del contexto de usuario

  // Mostrar loading mientras se cargan los datos
  if (!dataInitialized) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-slate-200 rounded w-1/4" />
          <div className="h-64 bg-slate-200 rounded" />
        </div>
      </div>
    );
  }

  // Verificar si hay filtros activos - CON VALIDACIÓN
  const hasActiveFilters = filtros && Object.values(filtros).some(value => {
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === 'string') return value !== '';
    if (typeof value === 'boolean') return value;
    return false;
  });

  return (
    <div className="space-y-6">
      {/* Estadísticas */}
      <VentasStats ventasCalc={ventasCalcSafe} productos={productosSafe} />

      {/* Filtros integrados - reemplaza VentasFilters */}
      <div className="bg-white rounded-lg shadow-sm border p-4">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-5 h-5 text-gray-500" />
          <h3 className="font-medium text-gray-900">Filtros</h3>
          {hasActiveFilters && (
            <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
              Activos
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          {/* Búsqueda */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Búsqueda
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={(filtros || {}).search || ''}
                onChange={(e) => updateFilter && updateFilter('search', e.target.value)}
                placeholder="Cliente, producto..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          
          {/* Colaborador */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Colaborador
            </label>
            <select
              value={(filtros || {}).colaborador_id || ''}
              onChange={(e) => updateFilter && updateFilter('colaborador_id', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Todos los colaboradores</option>
              {colaboradoresSafe.map(colab => (
                <option key={colab.id} value={colab.id}>{colab.nombre}</option>
              ))}
            </select>
          </div>

          {/* Estado */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Estado
            </label>
            <select
              value={(filtros || {}).estado || ''}
              onChange={(e) => updateFilter && updateFilter('estado', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Todos los estados</option>
              <option value="Confirmada">Confirmada</option>
              <option value="Pendiente">Pendiente</option>
              <option value="Cancelada">Cancelada</option>
              <option value="En proceso">En proceso</option>
            </select>
          </div>

          {/* Operador */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Operador
            </label>
            <select
              value={(filtros || {}).operador_id || ''}
              onChange={(e) => updateFilter && updateFilter('operador_id', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Todos los operadores</option>
              {operadoresSafe.map(op => (
                <option key={op.id} value={op.id}>{op.nombre}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Acciones de filtros */}
        <div className="flex items-center justify-between pt-4 border-t">
          <div className="flex items-center gap-2">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={(filtros || {}).sinPvp || false}
                onChange={(e) => updateFilter && updateFilter('sinPvp', e.target.checked)}
                className="mr-2 rounded"
              />
              <span className="text-sm text-gray-700">Solo ventas sin PVP</span>
            </label>
          </div>
          
          <div className="flex items-center gap-2">
            {hasActiveFilters && (
              <button
                onClick={() => clearFilters && clearFilters()}
                className="flex items-center gap-1 px-3 py-2 text-gray-600 hover:text-gray-800 text-sm"
              >
                <X className="w-4 h-4" />
                Limpiar filtros
              </button>
            )}
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm font-medium"
            >
              <Download className="w-4 h-4" />
              Exportar
            </button>
          </div>
        </div>
      </div>

      {/* Acciones */}
      <VentasActions
        ventasCount={ventasCalcSafe.length}
        selectedIds={selectedIds || []}
        onNewVenta={openNewVentaModal}
        onDeleteSelected={handleDeleteSelected}
        isAdmin={isAdmin}
        ventasSinPvp={estadisticas.ventasSinPvp}
      />

      {/* Tabla con Paginación */}
      <VentasTable
        ventasCalc={pagination?.paginatedData || []}
        productos={productosSafe}
        colaboradores={colaboradoresSafe}
        zonas={zonasSafe}
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
        // Props de paginación
        currentPage={pagination?.currentPage || 1}
        pageSize={pagination?.pageSize || 25}
        totalItems={pagination?.totalItems || 0}
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
          productos={productosSafe}
          operadores={operadoresSafe}
          colaboradores={colaboradoresSafe}
          zonas={zonasSafe}
        />
      )}

      {activeModal === 'detail' && selectedVenta && (
        <VentaDetailModal
          isOpen={true}
          onClose={closeModal}
          onEdit={openEditModal}
          venta={selectedVenta}
          productos={productosSafe}
          colaboradores={colaboradoresSafe}
          zonas={zonasSafe}
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