import React, { useContext } from 'react';
import ImportExcelMapperV2 from './ImportExcelMapperV2';
import { DataContext } from '../context/DataContextDef';
import Loading from './common/Loading';

export default function ImportExcelMapperWrapper() {
  const { 
    data, 
    dataInitialized,
    setVentas,
    setProductos,
    setOperadores,
    setColaboradores,
    setZonas
  } = useContext(DataContext);
  
  // ✅ FIX CRÍTICO: Función de éxito SIN refreshData para evitar bucles infinitos
  const onImportSuccess = async (result) => {
    console.log('✅ Importación completada exitosamente');
    console.log('📊 Resumen:', result);
    
    // ✅ NO hacer refreshData() - los datos ya están en localStorage
    // ✅ El DataContext los carga automáticamente
    // Sincronización remota eliminada, solo local
    
    // Opcional: mostrar mensaje de éxito adicional
    if (result?.ventasCreadas > 0) {
      console.log(`🎉 ${result.ventasCreadas} ventas importadas y visibles inmediatamente`);
    }
  };

  if (false && !dataInitialized) {
    return <Loading />;
  }

  return (
    <ImportExcelMapperV2
      // Datos actuales
      productos={data.productos || []}
      operadores={data.operadores || []}
      colaboradores={data.colaboradores || []}
      zonas={data.zonas || []}
      
      // Funciones de actualización
      setVentas={setVentas}
      setProductos={setProductos}
      setOperadores={setOperadores}
      setColaboradores={setColaboradores}
      setZonas={setZonas}
      
      // Callback de éxito SIN refreshData
      onImportSuccess={onImportSuccess}
    />
  );
}
