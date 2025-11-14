import React, { useState, useCallback, useEffect } from 'react';
import { DataContext } from './DataContextDef';

// Utilidades para localStorage
const loadFromStorage = (key, defaultValue = []) => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.warn(`Error cargando ${key} desde localStorage:`, error);
    return defaultValue;
  }
};

const saveToStorage = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Error guardando ${key} en localStorage:`, error);
  }
};

export function DataProvider({ children }) {
  // Estados principales
  const [data, setData] = useState({
    ventas: [],
    colaboradores: [],
    niveles: [],
    operadores: [],
    productos: [],
    zonas: [],
    reglas: [],
    liquidaciones: [],
  });

  const [dataInitialized, setDataInitialized] = useState(false);

  // Función para inicializar datos desde localStorage
  const initializeFromStorage = useCallback(() => {
    console.log('[DataContext] Inicializando datos desde localStorage...');
    
    // Cargar datos existentes
    const initialData = {
      ventas: loadFromStorage('appcv_ventas', []),
      colaboradores: loadFromStorage('appcv_colaboradores', []),
      niveles: loadFromStorage('appcv_niveles', []),
      operadores: loadFromStorage('appcv_operadores', []),
      productos: loadFromStorage('appcv_productos', []),
      zonas: loadFromStorage('appcv_zonas', []),
      reglas: loadFromStorage('appcv_reglas', []),
      liquidaciones: loadFromStorage('appcv_liquidaciones', []),
    };

    console.log('[DataContext] Datos cargados:', {
      ventas: initialData.ventas.length,
      colaboradores: initialData.colaboradores.length,
      niveles: initialData.niveles.length,
      operadores: initialData.operadores.length,
      productos: initialData.productos.length,
      zonas: initialData.zonas.length,
      reglas: initialData.reglas.length,
      liquidaciones: initialData.liquidaciones.length,
    });

    setData(initialData);
    setDataInitialized(true);
    console.log('[DataContext] Datos inicializados correctamente');
    
    return initialData;
  }, []);

  // Funciones setter para cada entidad
  const setVentas = useCallback((ventas) => {
    const ventasArray = typeof ventas === 'function' ? ventas(data.ventas) : ventas;
    const finalVentas = Array.isArray(ventasArray) ? ventasArray : [];
    setData(prev => ({ ...prev, ventas: finalVentas }));
    saveToStorage('appcv_ventas', finalVentas);
  }, [data.ventas]);

  const setColaboradores = useCallback((colaboradores) => {
    const colaboradoresArray = typeof colaboradores === 'function' ? colaboradores(data.colaboradores) : colaboradores;
    const finalColaboradores = Array.isArray(colaboradoresArray) ? colaboradoresArray : [];
    setData(prev => ({ ...prev, colaboradores: finalColaboradores }));
    saveToStorage('appcv_colaboradores', finalColaboradores);
  }, [data.colaboradores]);

  const setNiveles = useCallback((niveles) => {
    const nivelesArray = typeof niveles === 'function' ? niveles(data.niveles) : niveles;
    const finalNiveles = Array.isArray(nivelesArray) ? nivelesArray : [];
    setData(prev => ({ ...prev, niveles: finalNiveles }));
    saveToStorage('appcv_niveles', finalNiveles);
  }, [data.niveles]);

  const setOperadores = useCallback((operadores) => {
    const operadoresArray = typeof operadores === 'function' ? operadores(data.operadores) : operadores;
    const finalOperadores = Array.isArray(operadoresArray) ? operadoresArray : [];
    setData(prev => ({ ...prev, operadores: finalOperadores }));
    saveToStorage('appcv_operadores', finalOperadores);
  }, [data.operadores]);

  const setProductos = useCallback((productos) => {
    const productosArray = typeof productos === 'function' ? productos(data.productos) : productos;
    const finalProductos = Array.isArray(productosArray) ? productosArray : [];
    setData(prev => ({ ...prev, productos: finalProductos }));
    saveToStorage('appcv_productos', finalProductos);
  }, [data.productos]);

  const setZonas = useCallback((zonas) => {
    const zonasArray = typeof zonas === 'function' ? zonas(data.zonas) : zonas;
    const finalZonas = Array.isArray(zonasArray) ? zonasArray : [];
    setData(prev => ({ ...prev, zonas: finalZonas }));
    saveToStorage('appcv_zonas', finalZonas);
  }, [data.zonas]);

  const setReglas = useCallback((reglas) => {
    const reglasArray = typeof reglas === 'function' ? reglas(data.reglas) : reglas;
    const finalReglas = Array.isArray(reglasArray) ? reglasArray : [];
    setData(prev => ({ ...prev, reglas: finalReglas }));
    saveToStorage('appcv_reglas', finalReglas);
  }, [data.reglas]);

  const setLiquidaciones = useCallback((liquidaciones) => {
    const liquidacionesArray = typeof liquidaciones === 'function' ? liquidaciones(data.liquidaciones) : liquidaciones;
    const finalLiquidaciones = Array.isArray(liquidacionesArray) ? liquidacionesArray : [];
    setData(prev => ({ ...prev, liquidaciones: finalLiquidaciones }));
    saveToStorage('appcv_liquidaciones', finalLiquidaciones);
  }, [data.liquidaciones]);

  // Inicialización al montar el componente
  useEffect(() => {
    console.log('[DataContext] Componente montado, inicializando...');
    initializeFromStorage();
  }, [initializeFromStorage]);


  // Función para limpiar todos los datos y localStorage
  const resetAllData = useCallback(() => {
    const emptyData = {
      ventas: [],
      colaboradores: [],
      niveles: [],
      operadores: [],
      productos: [],
      zonas: [],
      reglas: [],
      liquidaciones: [],
    };
    Object.keys(emptyData).forEach(key => {
      localStorage.setItem(`appcv_${key}`, JSON.stringify([]));
    });
    setData(emptyData);
    setDataInitialized(true);
  }, []);

  // Función para validar relaciones y limpiar duplicados
  const validateAllRelations = useCallback(() => {
    // Eliminar duplicados por id en cada entidad
    function uniqueById(arr) {
      const seen = new Set();
      return arr.filter(item => {
        if (!item.id || seen.has(item.id)) return false;
        seen.add(item.id);
        return true;
      });
    }
    // Limpiar operadores
    let operadores = uniqueById(data.operadores).filter(op => op.nombre && op.id);
    // Limpiar zonas
    let zonas = uniqueById(data.zonas).filter(z => z.nombre && z.id);
    // Limpiar colaboradores
    let colaboradores = uniqueById(data.colaboradores).filter(c => c.nombre && c.id);
    // Limpiar productos y validar operador
    let productos = uniqueById(data.productos).filter(p => p.nombre && p.id && operadores.some(op => op.id === p.operador_id));
    // Limpiar ventas y validar relaciones
    let ventas = uniqueById(data.ventas).filter(v =>
      v.id &&
      productos.some(p => p.id === v.producto_id) &&
      operadores.some(op => op.id === v.operador_id) &&
      colaboradores.some(c => c.id === v.colaborador_id) &&
      zonas.some(z => z.id === v.zona_id)
    );
    // Limpiar niveles, reglas, liquidaciones
    let niveles = uniqueById(data.niveles);
    let reglas = uniqueById(data.reglas);
    let liquidaciones = uniqueById(data.liquidaciones);
    // Guardar y actualizar
    setData({ ventas, colaboradores, niveles, operadores, productos, zonas, reglas, liquidaciones });
    saveToStorage('appcv_ventas', ventas);
    saveToStorage('appcv_colaboradores', colaboradores);
    saveToStorage('appcv_niveles', niveles);
    saveToStorage('appcv_operadores', operadores);
    saveToStorage('appcv_productos', productos);
    saveToStorage('appcv_zonas', zonas);
    saveToStorage('appcv_reglas', reglas);
    saveToStorage('appcv_liquidaciones', liquidaciones);
    setDataInitialized(true);
  }, [data]);

  // Valor del contexto
  const contextValue = {
    data,
    dataInitialized,
    setVentas,
    setColaboradores,
    setNiveles,
    setOperadores,
    setProductos,
    setZonas,
    setReglas,
    setLiquidaciones,
    resetAllData,
    validateAllRelations,
  };

  return (
    <DataContext.Provider value={contextValue}>
      {children}
    </DataContext.Provider>
  );
}