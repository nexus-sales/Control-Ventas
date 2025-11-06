// src/hooks/usePagination.js
// Hook personalizado para manejar paginación
import { useState, useMemo } from 'react';

export function usePagination(data = [], initialPageSize = 25) {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);

  // Calcular datos paginados
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return data.slice(startIndex, endIndex);
  }, [data, currentPage, pageSize]);

  // Calcular información de paginación
  const pagination = useMemo(() => {
    const totalItems = data.length;
    const totalPages = Math.ceil(totalItems / pageSize);
    
    return {
      currentPage,
      pageSize,
      totalItems,
      totalPages,
      hasNextPage: currentPage < totalPages,
      hasPrevPage: currentPage > 1,
      startItem: totalItems > 0 ? (currentPage - 1) * pageSize + 1 : 0,
      endItem: Math.min(currentPage * pageSize, totalItems)
    };
  }, [data.length, currentPage, pageSize]);

  // Handlers
  const handlePageChange = (page) => {
    const validPage = Math.max(1, Math.min(page, pagination.totalPages));
    setCurrentPage(validPage);
  };

  const handlePageSizeChange = (newPageSize) => {
    setPageSize(newPageSize);
    // Ajustar página actual si es necesario
    const newTotalPages = Math.ceil(data.length / newPageSize);
    if (currentPage > newTotalPages) {
      setCurrentPage(1);
    }
  };

  const goToFirstPage = () => handlePageChange(1);
  const goToLastPage = () => handlePageChange(pagination.totalPages);
  const goToNextPage = () => handlePageChange(currentPage + 1);
  const goToPrevPage = () => handlePageChange(currentPage - 1);

  // Reset pagination cuando cambian los datos
  const resetPagination = () => {
    setCurrentPage(1);
  };

  return {
    // Datos paginados
    paginatedData,
    
    // Información de paginación
    ...pagination,
    
    // Handlers
    handlePageChange,
    handlePageSizeChange,
    goToFirstPage,
    goToLastPage,
    goToNextPage,
    goToPrevPage,
    resetPagination
  };
}