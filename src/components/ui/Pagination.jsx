// src/components/ui/Pagination.jsx
// Componente de paginación con opciones de tamaño de página
import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

export default function Pagination({
  currentPage,
  totalPages,
  pageSize,
  totalItems,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [25, 50, 100, 200]
}) {
  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  // Generar números de página para mostrar
  const getPageNumbers = () => {
    const pages = [];
    const delta = 2; // Páginas a mostrar antes y después de la actual
    
    // Siempre mostrar primera página
    if (totalPages > 1) pages.push(1);
    
    // Calcular rango de páginas a mostrar
    const rangeStart = Math.max(2, currentPage - delta);
    const rangeEnd = Math.min(totalPages - 1, currentPage + delta);
    
    // Añadir separador si hay gap después de la primera página
    if (rangeStart > 2) pages.push('...');
    
    // Añadir páginas del rango
    for (let i = rangeStart; i <= rangeEnd; i++) {
      if (i > 1 && i < totalPages) pages.push(i);
    }
    
    // Añadir separador si hay gap antes de la última página
    if (rangeEnd < totalPages - 1) pages.push('...');
    
    // Siempre mostrar última página
    if (totalPages > 1) pages.push(totalPages);
    
    return pages;
  };

  const pageNumbers = getPageNumbers();

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
      {/* Información de elementos */}
      <div className="flex items-center gap-4">
        <div className="text-sm text-slate-600">
          Mostrando <span className="font-medium">{startItem}</span> a{' '}
          <span className="font-medium">{endItem}</span> de{' '}
          <span className="font-medium">{totalItems}</span> resultados
        </div>
        
        {/* Selector de tamaño de página */}
        <div className="flex items-center gap-2">
          <label className="text-sm text-slate-600">Ver:</label>
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="border border-slate-300 rounded px-2 py-1 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-sky-400"
          >
            {pageSizeOptions.map(size => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
          <span className="text-sm text-slate-600">por página</span>
        </div>
      </div>

      {/* Controles de navegación */}
      {totalPages > 1 && (
        <div className="flex items-center gap-1">
          {/* Primera página */}
          <button
            onClick={() => onPageChange(1)}
            disabled={currentPage === 1}
            className="p-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="Primera página"
          >
            <ChevronsLeft className="w-4 h-4" />
          </button>
          
          {/* Página anterior */}
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="p-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="Página anterior"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {/* Números de página */}
          <div className="flex items-center gap-1 mx-2">
            {pageNumbers.map((page, index) => (
              <button
                key={index}
                onClick={() => typeof page === 'number' ? onPageChange(page) : null}
                disabled={typeof page !== 'number'}
                className={`min-w-[32px] h-8 px-2 rounded-lg text-sm font-medium transition-colors ${
                  page === currentPage
                    ? 'bg-sky-500 text-white'
                    : typeof page === 'number'
                    ? 'border border-slate-300 bg-white hover:bg-slate-50'
                    : 'bg-transparent text-slate-400 cursor-default'
                }`}
              >
                {page}
              </button>
            ))}
          </div>

          {/* Página siguiente */}
          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="p-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="Página siguiente"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          
          {/* Última página */}
          <button
            onClick={() => onPageChange(totalPages)}
            disabled={currentPage === totalPages}
            className="p-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="Última página"
          >
            <ChevronsRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
