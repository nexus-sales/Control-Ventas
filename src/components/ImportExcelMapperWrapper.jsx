import React, { useContext } from 'react';
import ImportExcelMapperV2 from './ImportExcelMapperV2';
import { DataCtx } from '../context/contexts';
import Loading from './common/Loading';

export default function ImportExcelMapperWrapper() {
  const { 
    data, 
    refreshData, 
    dataInitialized,
    setVentas,
    setProductos,
    setOperadores,
    setColaboradores,
    setZonas
  } = useContext(DataCtx);
  
  // Función para recargar datos después del éxito
  const onImportSuccess = async () => {
    console.log('🔄 Recargando datos después de importación exitosa...');
    try {
      await refreshData();
      console.log('✅ Datos recargados correctamente');
    } catch (error) {
      console.error('❌ Error recargando datos:', error);
    }
  };

  if (!dataInitialized) {
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
      
      // Callback de éxito
      onImportSuccess={onImportSuccess}
    />
  );
}
