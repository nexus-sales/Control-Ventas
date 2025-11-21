import React, { useContext } from "react";
import ImportExcelMapperV2 from "./ImportExcelMapperV2";
import { DataContext } from "../context/DataContext";

export default function ImportExcelMapperWrapper() {
  const {
    data,
    dataInitialized,
    setVentas,
    setProductos,
    setOperadores,
    setColaboradores,
    setZonas,
  } = useContext(DataContext);

  // Callback de éxito SIN refresh remoto, solo log + mensaje
  const onImportSuccess = async (result) => {
    console.log("✅ Importación completada exitosamente");
    console.log("📊 Resumen:", result);

    if (result?.ventasCreadas > 0) {
      console.log(
        `🎉 ${result.ventasCreadas} ventas importadas y visibles inmediatamente`
      );
    }
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
