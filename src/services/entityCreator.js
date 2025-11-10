


// ...resto del archivo: solo lógica local activa...


// Versiones locales (sin supabase) para crear entidades y mapearlas en memoria
export async function createOperadorLocal(nombre) {
  if (typeof nombre !== "string" || !nombre.trim()) {
    throw new Error("El nombre del operador es obligatorio");
  }
  const id = `op_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`;
  return {
    id,
    nombre: nombre.trim(),
    sector: "telefonia",
    codigo: nombre.trim().toUpperCase().replace(/\s+/g, '_').slice(0, 10),
    contacto: null,
    telefono: null,
    email: null,
    observaciones: "Operador creado automáticamente desde importación (local)",
    fecha_alta: new Date().toISOString().slice(0, 10),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
}

export async function createZonaLocal(nombre, datosExtras = {}) {
  if (typeof nombre !== "string" || !nombre.trim()) {
    throw new Error("El nombre de la zona es obligatorio");
  }
  const id = `z_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`;
  return {
    id,
    nombre: nombre.trim(),
    codigo: nombre.trim().toUpperCase().slice(0, 3),
    impuesto_tipo: datosExtras.impuesto_tipo || "IVA",
    impuesto_pct: datosExtras.impuesto_pct || 0.21,
    descripcion: `Zona creada automáticamente: ${nombre.trim()} (local)` ,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
}

export async function createColaboradorLocal(nombre) {
  if (typeof nombre !== "string" || !nombre.trim()) {
    throw new Error("El nombre del colaborador es obligatorio");
  }
  const id = `c_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`;
  const nombreLimpio = nombre.trim();
  return {
    id,
    nombre: nombreLimpio,
    nivel: "BASIC",
    comision_personalizada: null,
    comision_tipo_personalizada: null,
    fecha_alta: new Date().toISOString().slice(0, 10),
    telefono: null,
    email: `${nombreLimpio.toLowerCase().replace(/\s+/g, ".")}@empresa.com`,
    direccion: null,
    cif_dni: null,
    tipo_fiscal: "AUTONOMO",
    irpf: 0,
    pct_colaborador: 0.50,
    zona_id: null,
    estado: "ACTIVO",
    irpf_calculado: null,
    exento_impuestos: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    observaciones: null,
    rol: "colaborador"
  };
}

export async function createProductoLocal(nombre, operadorId = null, pvp = 50.0, comisionBase = 15.0) {
  if (typeof nombre !== "string" || !nombre.trim()) {
    throw new Error("El nombre del producto es obligatorio");
  }
  const id = `p_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`;
  return {
    id,
    operador_id: operadorId,
    nombre: nombre.trim(),
    familia: "importado",
    pvp: pvp || 50.0,
    comision_tipo: "porcentaje",
    comision_valor: (comisionBase || 15.0) / 100,
    codigo_producto: nombre.trim().toUpperCase().replace(/\s+/g, '_').slice(0, 15),
    descripcion: "Producto creado automáticamente desde importación (local)",
    activo: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    fecha_alta: new Date().toISOString().slice(0, 10),
    fecha_baja: null,
    contacto: null,
    email: null,
    telefono: null,
    observaciones: "Creado automáticamente (local)",
    historial: {} // Cambiado de [] a {} para que sea un objeto JSON válido
  };
}

// Crea todas las entidades faltantes en memoria y actualiza los estados locales
export async function createMissingEntitiesLocal(entidadesUnicas, entitiesExistentes, setters) {
  console.log('🚀 Iniciando creación de entidades faltantes (local)');
  const resumen = {
    operadoresCreados: 0,
    productosCreados: 0,
    colaboradoresCreados: 0,
    zonasCreadas: 0,
    operadoresNuevos: [],
    productosNuevos: [],
    colaboradoresNuevos: [],
    zonasNuevas: [],
    errores: [],
  };
  const mapeos = {
    operadores: {},
    productos: {},
    colaboradores: {},
    zonas: {},
  };
  // 1. Zonas
  let zonasCreadas = [];
  if (setters.setZonas) {
    for (const zonaJson of entidadesUnicas.zonas) {
      let zonaObj;
      try {
        zonaObj = JSON.parse(zonaJson);
      } catch {
        zonaObj = {
          nombre: zonaJson,
          impuesto_tipo: "IVA",
          impuesto_pct: 0.21,
        };
      }
      try {
        const zona = await createZonaLocal(zonaObj.nombre, zonaObj);
        setters.setZonas((prev) => {
          if (!prev.some(z => z.id === zona.id)) return [...prev, zona];
          return prev;
        });
        resumen.zonasNuevas.push(zonaObj.nombre);
        resumen.zonasCreadas++;
        mapeos.zonas[zonaObj.nombre] = zona.id;
        zonasCreadas.push(zona.id);
      } catch (error) {
        resumen.errores.push(`Error creando zona ${zonaObj.nombre}: ${error.message}`);
      }
    }
  }
  // 2. Colaboradores
  let colaboradoresCreados = [];
  if (setters.setColaboradores) {
    for (const nombre of entidadesUnicas.colaboradores) {
      try {
        const colaborador = await createColaboradorLocal(nombre);
        setters.setColaboradores((prev) => {
          if (!prev.some(c => c.id === colaborador.id)) return [...prev, colaborador];
          return prev;
        });
        resumen.colaboradoresNuevos.push(nombre);
        resumen.colaboradoresCreados++;
        mapeos.colaboradores[nombre] = colaborador.id;
        colaboradoresCreados.push(colaborador.id);
      } catch (error) {
        resumen.errores.push(`Error creando colaborador ${nombre}: ${error.message}`);
      }
    }
  }
  // 3. Operadores
  let operadoresCreados = [];
  if (setters.setOperadores) {
    for (const nombre of entidadesUnicas.operadores) {
      try {
        const operador = await createOperadorLocal(nombre);
        setters.setOperadores((prev) => {
          if (!prev.some(o => o.id === operador.id)) return [...prev, operador];
          return prev;
        });
        resumen.operadoresNuevos.push(nombre);
        resumen.operadoresCreados++;
        mapeos.operadores[nombre] = operador.id;
        operadoresCreados.push(operador.id);
      } catch (error) {
        resumen.errores.push(`Error creando operador ${nombre}: ${error.message}`);
      }
    }
  }
  // 4. Productos
  if (setters.setProductos) {
    for (const [nombre, datos] of entidadesUnicas.productos) {
      const operadorId = mapeos.operadores[datos.operador] || null;
      try {
        const producto = await createProductoLocal(
          nombre,
          operadorId,
          datos.pvp,
          datos.comision_base
        );
        setters.setProductos((prev) => {
          if (!prev.some(p => p.id === producto.id)) return [...prev, producto];
          return prev;
        });
        resumen.productosNuevos.push(
          `${nombre} (PVP: ${datos.pvp}€, Comisión: ${datos.comision_base}€)`
        );
        resumen.productosCreados++;
        mapeos.productos[nombre] = producto.id;
      } catch (error) {
        resumen.errores.push(`Error creando producto ${nombre}: ${error.message}`);
      }
    }
  }
  return { resumen, mapeos };
}

/**
 * Recopila entidades únicas de las filas de datos
 */
export function recopilarEntidadesUnicas(rows, mapping) {
  console.log('Recopilando entidades únicas de', rows.length, 'filas');
  
  const operadores = new Set();
  const productos = new Map();
  const colaboradores = new Set();
  const zonas = new Set();

  rows.forEach((row) => {
    const get = (key) => {
      const value = row[mapping[key]];
      return value ? String(value).trim() : null;
    };

    const operador = get("operador_id");
    if (operador) {
      operadores.add(operador);
    }

    const producto = get("producto_id");
    if (producto) {
      const comisionBase = parseFloat(get("comision_base")) || 15.0;
      const pvp = parseFloat(get("pvp")) || 50.0;

      productos.set(producto, {
        nombre: producto,
        operador: operador || null,
        comision_base: comisionBase,
        pvp: pvp,
      });
    }

    const colaborador = get("colaborador_id");
    if (colaborador) {
      colaboradores.add(colaborador);
    }

    const zona = get("zona_id");
    if (zona) {
      const impuesto_tipo = get("impuesto_tipo") || "IVA";
      const impuesto_pct = parseFloat(get("impuesto_pct")) || 0.21;

      zonas.add(
        JSON.stringify({
          nombre: zona,
          impuesto_tipo: impuesto_tipo,
          impuesto_pct: impuesto_pct,
        }),
      );
    }
  });

  const resultado = { operadores, productos, colaboradores, zonas };
  console.log('Entidades únicas recopiladas:', {
    operadores: Array.from(operadores),
    productos: Array.from(productos.keys()),
    colaboradores: Array.from(colaboradores),
    zonas: Array.from(zonas).map(z => JSON.parse(z).nombre)
  });
  
  return resultado;
}

/**
 * Crea todas las entidades faltantes automáticamente
 */
export async function createMissingEntities(entidadesUnicas, entitiesExistentes, setters) {
  console.log('🚀 Iniciando creación de entidades faltantes');
  console.log('Setters disponibles:', {
    setOperadores: !!setters.setOperadores,
    setZonas: !!setters.setZonas,
    setColaboradores: !!setters.setColaboradores,
    setProductos: !!setters.setProductos,
  });

  const resumen = {
    operadoresCreados: 0,
    productosCreados: 0,
    colaboradoresCreados: 0,
    zonasCreadas: 0,
    operadoresNuevos: [],
    productosNuevos: [],
    colaboradoresNuevos: [],
    zonasNuevas: [],
    errores: [],
  };

  const mapeos = {
    operadores: {},
    productos: {},
    colaboradores: {},
    zonas: {},
  };

  try {
    // 1. CREAR ZONAS PRIMERO (solo local)
    if (setters.setZonas) {
      for (const zonaJson of entidadesUnicas.zonas) {
        let zonaObj;
        try {
          zonaObj = JSON.parse(zonaJson);
        } catch {
          zonaObj = {
            nombre: zonaJson,
            impuesto_tipo: "IVA",
            impuesto_pct: 0.21,
          };
        }
        try {
          const zona = await createZonaLocal(zonaObj.nombre, zonaObj);
          setters.setZonas((prev) => {
            if (!prev.some(z => z.id === zona.id)) return [...prev, zona];
            return prev;
          });
          resumen.zonasNuevas.push(zonaObj.nombre);
          resumen.zonasCreadas++;
          mapeos.zonas[zonaObj.nombre] = zona.id;
        } catch (error) {
          resumen.errores.push(`Error creando zona ${zonaObj.nombre}: ${error.message}`);
        }
      }
    }

    // 2. CREAR COLABORADORES (solo local)
    if (setters.setColaboradores) {
      for (const nombre of entidadesUnicas.colaboradores) {
        try {
          const colaborador = await createColaboradorLocal(nombre);
          setters.setColaboradores((prev) => {
            if (!prev.some(c => c.id === colaborador.id)) return [...prev, colaborador];
            return prev;
          });
          resumen.colaboradoresNuevos.push(nombre);
          resumen.colaboradoresCreados++;
          mapeos.colaboradores[nombre] = colaborador.id;
        } catch (error) {
          resumen.errores.push(`Error creando colaborador ${nombre}: ${error.message}`);
        }
      }
    }

    // 3. CREAR OPERADORES (solo local)
    if (setters.setOperadores) {
      for (const nombre of entidadesUnicas.operadores) {
        try {
          const operador = await createOperadorLocal(nombre);
          setters.setOperadores((prev) => {
            if (!prev.some(o => o.id === operador.id)) return [...prev, operador];
            return prev;
          });
          resumen.operadoresNuevos.push(nombre);
          resumen.operadoresCreados++;
          mapeos.operadores[nombre] = operador.id;
        } catch (error) {
          resumen.errores.push(`Error creando operador ${nombre}: ${error.message}`);
        }
      }
    }

    // CRÍTICO: Esperar que los operadores se confirmen en Supabase
    console.log('⏳ Esperando confirmación de operadores en Supabase...');
    await new Promise(resolve => setTimeout(resolve, 3000));

    // 4. CREAR PRODUCTOS (solo local)
    if (setters.setProductos) {
      for (const [nombre, datos] of entidadesUnicas.productos) {
        const operadorId = mapeos.operadores[datos.operador] || null;
        try {
          const producto = await createProductoLocal(
            nombre,
            operadorId,
            datos.pvp,
            datos.comision_base
          );
          setters.setProductos((prev) => {
            if (!prev.some(p => p.id === producto.id)) return [...prev, producto];
            return prev;
          });
          resumen.productosNuevos.push(
            `${nombre} (PVP: ${datos.pvp}€, Comisión: ${datos.comision_base}€)`
          );
          resumen.productosCreados++;
          mapeos.productos[nombre] = producto.id;
        } catch (error) {
          resumen.errores.push(`Error creando producto ${nombre}: ${error.message}`);
        }
      }
    }

    console.log('✅ Creación de entidades completada');
    console.log('Resumen:', resumen);
    console.log('Mapeos:', mapeos);

  } catch (error) {
    console.error("Error general creando entidades:", error);
    resumen.errores.push(`Error general: ${error.message}`);
  }

  return { resumen, mapeos };
}