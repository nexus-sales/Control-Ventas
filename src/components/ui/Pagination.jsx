import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { glassStyles } from '../../utils/designUtils';

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

  // Generar páginas (mismo algoritmo)
  const getPageNumbers = () => {
    const pages = [];
    const delta = 2;
    if (totalPages > 1) pages.push(1);
    const rangeStart = Math.max(2, currentPage - delta);
    const rangeEnd = Math.min(totalPages - 1, currentPage + delta);
    if (rangeStart > 2) pages.push('...');
    for (let i = rangeStart; i <= rangeEnd; i++) {
      pages.push(i);
    }
    if (rangeEnd < totalPages - 1) pages.push('...');
    if (totalPages > 1 && totalPages !== 1) pages.push(totalPages);
    return pages;
  };

  const pageNumbers = getPageNumbers();

  return (
    <div className={`${glassStyles()} flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl`}>
      {/* Información de elementos */}
      <div className="flex flex-col sm:flex-row items-center gap-4 text-xs font-semibold text-slate-500 dark:text-slate-400">
        <div>
          Mostrando <span className="text-slate-800 dark:text-white font-black">{startItem}</span> - <span className="text-slate-800 dark:text-white font-black">{endItem}</span> de <span className="text-slate-800 dark:text-white font-black">{totalItems}</span>
        </div>

        {/* Selector de tamaño de página */}
        <div className="flex items-center gap-2">
          <label>Mostrar</label>
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="bg-white/50 dark:bg-slate-800/50 border-none rounded-lg px-2 py-1 text-xs font-bold text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 cursor-pointer shadow-sm"
          >
            {pageSizeOptions.map(size => (
              <option key={size} value={size}>{size}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Controles de navegación */}
      {totalPages > 1 && (
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => onPageChange(1)}
            disabled={currentPage === 1}
            className="p-2 rounded-xl bg-white/50 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm"
          >
            <ChevronsLeft className="w-4 h-4" />
          </button>

          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="p-2 rounded-xl bg-white/50 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-1 px-2">
            {pageNumbers.map((page, index) => {
              if (typeof page !== 'number') return <span key={index} className="text-slate-400 font-black">...</span>;
              const isActive = page === currentPage;
              return (
                <button
                  key={index}
                  onClick={() => onPageChange(page)}
                  className={`
                     w-8 h-8 rounded-xl text-xs font-black transition-all shadow-sm
                     ${isActive
                      ? 'bg-blue-600 text-white shadow-blue-500/30 scale-110'
                      : 'bg-white/50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700'}
                   `}
                >
                  {page}
                </button>
              );
            })}
          </div>

          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="p-2 rounded-xl bg-white/50 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <button
            onClick={() => onPageChange(totalPages)}
            disabled={currentPage === totalPages}
            className="p-2 rounded-xl bg-white/50 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm"
          >
            <ChevronsRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}

