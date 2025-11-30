import React from "react";
import ImportExcelMapperV2 from "./ImportExcelMapperV2";
import { useData } from "../context/AppContexts";

export default function ImportExcelMapperWrapper() {
  const {
    data,
    dataInitialized,
    setVentas,
    setProductos,
    setOperadores,
    setColaboradores,
    setZonas,
    refreshData,
  } = useData();

  // Callback de éxito: fuerza recarga global de datos tras importar
    const onImportSuccess = async () => {
    if (typeof refreshData === 'function') {
      await refreshData();
    }
    // Aquí podrías mostrar una notificación si lo deseas
    // if (result?.ventasCreadas > 0) {
    //   showSuccess(`🎉 ${result.ventasCreadas} ventas importadas y visibles inmediatamente`);
    // }
  };

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

  return (
    <ImportExcelMapperV2
      productos={data.productos || []}
      operadores={data.operadores || []}
      colaboradores={data.colaboradores || []}
      zonas={data.zonas || []}
      setVentas={setVentas}
      setProductos={setProductos}
      setOperadores={setOperadores}
      setColaboradores={setColaboradores}
      setZonas={setZonas}
      onImportSuccess={onImportSuccess}
    />
  );
}