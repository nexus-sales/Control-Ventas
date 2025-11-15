import { useContext, useCallback, useMemo } from 'react';
import { DataContext } from '../context/DataContextDef';

export function useVentasOperations() {
  const { data, setVentas, setProductos } = useContext(DataContext);
  
  const ventas = useMemo(() => Array.isArray(data?.ventas) ? data.ventas : [], [data?.ventas]);
  const productos = useMemo(() => Array.isArray(data?.productos) ? data.productos : [], [data?.productos]);
  const colaboradores = useMemo(() => Array.isArray(data?.colaboradores) ? data.colaboradores : [], [data?.colaboradores]);
  const zonas = useMemo(() => Array.isArray(data?.zonas) ? data.zonas : [], [data?.zonas]);

  // Función para actualizar ventas
  const updateVentas = useCallback((newVentas) => {
    setVentas(newVentas);
  }, [setVentas]);

  // Función para actualizar productos
  const updateProductos = useCallback((newProductos) => {
    setProductos(newProductos);
  }, [setProductos]);

  // Agregar nueva venta
  // Guardar campos personalizados en una propiedad específica
  const addVenta = useCallback((ventaData) => {
    const id = `v_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    // Extraer campos personalizados (cf_*)
    const customFields = {};
    const otherFields = {};
    Object.entries(ventaData).forEach(([key, value]) => {
      if (key.startsWith('cf_')) {
        customFields[key] = value;
      } else {
        otherFields[key] = value;
      }
    });
    const nuevaVenta = {
      id,
      ...otherFields,
      customFields,
      pvp: Number(ventaData.pvp || 0),
      cantidad: Number(ventaData.cantidad || 1),
    };
    updateVentas((arr) => [nuevaVenta, ...arr]);
    return id;
  }, [updateVentas]);

  // Actualizar venta existente
  const updateVenta = useCallback((ventaId, changes) => {
    updateVentas((arr) =>
      arr.map((v) =>
        v.id === ventaId 
          ? { ...v, ...changes, pvp: Number(changes.pvp || v.pvp || 0) } 
          : v
      )
    );
  }, [updateVentas]);

  // Eliminar venta
  const deleteVenta = useCallback((ventaId) => {
    updateVentas((arr) => arr.filter((x) => x.id !== ventaId));
  }, [updateVentas]);

  // Eliminar múltiples ventas
  const deleteMultipleVentas = useCallback((ventaIds) => {
    if (ventaIds.length === 0 || !window.confirm(
      `¿Seguro que quieres eliminar ${ventaIds.length} ventas seleccionadas?`
    )) {
      return false;
    }
    
    updateVentas((arr) => arr.filter((x) => !ventaIds.includes(x.id)));
    return true;
  }, [updateVentas]);

  // Cambiar estado de venta
  const updateEstado = useCallback((ventaId, estado) => {
    updateVentas((arr) => 
      arr.map((x) => (x.id === ventaId ? { ...x, estado } : x))
    );
  }, [updateVentas]);

  // Actualizar PVP de producto
  const updateProductPvp = useCallback((productoId, pvp) => {
    updateProductos((prev) =>
      prev.map((p) =>
        p.id === productoId ? { ...p, pvp: Number(pvp) } : p
      )
    );
  }, [updateProductos]);

  // Helpers para validaciones
  const isVentaBlocked = useCallback((venta) => {
    return ["CANCELADA", "BAJA", "RECHAZADA"].includes(venta?.estado);
  }, []);

  // Crear draft inicial para nueva venta
  const createInitialDraft = useCallback(() => ({
    fecha: new Date().toISOString().slice(0, 10),
    cliente: "",
    cif: "",
    producto_id: productos[0]?.id || "",
    zona_id: zonas[0]?.id || "",
    colaborador_id: colaboradores[0]?.id || "",
    pvp: 0,
    cantidad: 1,
    estado: "PENDIENTE",
    documento: "",
    numeracion: "",
    telefono_fijo: "",
    telefono_movil: "",
    observaciones: "",
  }), [productos, zonas, colaboradores]);

  return {
    // Datos
    ventas,
    productos,
    colaboradores,
    zonas,
    
    // Operaciones
    addVenta,
    updateVenta,
    deleteVenta,
    deleteMultipleVentas,
    updateEstado,
    updateProductPvp,
    
    // Helpers
    isVentaBlocked,
    createInitialDraft,
  };
}