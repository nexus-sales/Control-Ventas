import { useState, useCallback } from 'react';

export function useVentasSelection(ventasList = []) {
  const [selectedIds, setSelectedIds] = useState([]);
  const [selectAll, setSelectAll] = useState(false);

  // Manejar selección individual
  const handleSelect = useCallback((id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }, []);

  // Manejar selección global
  const handleSelectAll = useCallback(() => {
    if (selectAll) {
      setSelectedIds([]);
      setSelectAll(false);
    } else {
      setSelectedIds(ventasList.map((v) => v.id));
      setSelectAll(true);
    }
  }, [selectAll, ventasList]);

  // Limpiar selección
  const clearSelection = useCallback(() => {
    setSelectedIds([]);
    setSelectAll(false);
  }, []);

  // Verificar si está seleccionado
  const isSelected = useCallback((id) => {
    return selectedIds.includes(id);
  }, [selectedIds]);

  // Verificar si todos están seleccionados
  const isAllSelected = useCallback(() => {
    return selectedIds.length > 0 && selectedIds.length === ventasList.length;
  }, [selectedIds, ventasList]);

  // Obtener ventas seleccionadas
  const getSelectedVentas = useCallback(() => {
    return ventasList.filter(v => selectedIds.includes(v.id));
  }, [ventasList, selectedIds]);

  return {
    selectedIds,
    selectAll,
    handleSelect,
    handleSelectAll,
    clearSelection,
    isSelected,
    isAllSelected,
    getSelectedVentas,
    hasSelection: selectedIds.length > 0,
    selectionCount: selectedIds.length
  };
}