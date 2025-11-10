


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
    sector: "TELEFONIA", // ✅ CORREGIDO: usar TELEFONIA en mayúsculas
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

// Función para normalizar zonas a solo PENÍNSULA o CANARIAS
function normalizeZoneName(nombre) {
  if (!nombre || typeof nombre !== 'string') return null;
  
  const normalized = nombre.trim().toUpperCase();
  
  // Si contiene "CANARIA" (en cualquier variación), es CANARIAS
  if (normalized.includes('CANARIA')) {
    return 'CANARIAS';
  }
  
  // Si contiene "PENINSULA" o es cualquier otra cosa, es PENÍNSULA
  if (normalized.includes('PENINSULA') || normalized.includes('PENINSULAR')) {
    return 'PENÍNSULA';
  }
  
  // Por defecto, todo lo demás es PENÍNSULA (Madrid, Barcelona, Valencia, etc.)
  return 'PENÍNSULA';
}

export async function createZonaLocal(nombre, datosExtras = {}) {
  if (!nombre || typeof nombre !== 'string' || nombre.trim() === '') {
    throw new Error("El nombre de la zona es obligatorio");
  }

  // Normalizar nombre a PENÍNSULA o CANARIAS
  const nombreNormalizado = normalizeZoneName(nombre);
  const isCanarias = nombreNormalizado === 'CANARIAS';

  const zona = {
    id: `zona-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    nombre: nombreNormalizado,
    codigo: nombreNormalizado.replace(/\s+/g, '_'),
    // Datos específicos según la zona
    iva: isCanarias ? 0 : (datosExtras.iva || 0.21),
    irpf: datosExtras.irpf || 0.07,
    igic: isCanarias ? (datosExtras.igic || 0.07) : 0,
    impuesto_tipo: isCanarias ? 'IGIC' : 'IVA',
    impuesto_pct: isCanarias ? 0.07 : 0.21,
    descripcion: `Zona creada automáticamente: ${nombreNormalizado} (de "${nombre.trim()}")`,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  return zona;
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
    sector: "TELEFONIA", // ✅ CORREGIDO: usar TELEFONIA en mayúsculas
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
  
  // 1. Zonas (UPSERT por nombre normalizado)
  let zonasCreadas = [];
  if (setters.setZonas) {
    for (const zonaJson of entidadesUnicas.zonas) {
      let zonaObj;
      try {
        zonaObj = JSON.parse(zonaJson);
      } catch {
        zonaObj = {
          nombre: zonaJson,
          nombre_normalizado: zonaJson.toUpperCase(),
          impuesto_tipo: "IVA",
          impuesto_pct: 0.21,
        };
      }
      
      // UPSERT: Buscar zona existente por nombre normalizado (case-insensitive)
      let zonaExistente = entitiesExistentes.zonas?.find(z => 
        z.nombre.toUpperCase() === (zonaObj.nombre_normalizado || zonaObj.nombre.toUpperCase())
      );
      
      if (zonaExistente) {
        // Usar zona existente
        mapeos.zonas[zonaObj.nombre] = zonaExistente.id;
        mapeos.zonas[zonaObj.nombre.toUpperCase()] = zonaExistente.id; // También mapear versión mayúscula
        console.log(`♻️ Usando zona existente: ${zonaObj.nombre} → ${zonaExistente.nombre} (${zonaExistente.id})`);
      } else {
        try {
          const zona = await createZonaLocal(zonaObj.nombre, zonaObj);
          setters.setZonas((prev) => {
            if (!prev.some(z => z.id === zona.id || z.nombre.toUpperCase() === zona.nombre.toUpperCase())) {
              return [...prev, zona];
            }
            return prev;
          });
          resumen.zonasNuevas.push(zonaObj.nombre);
          resumen.zonasCreadas++;
          mapeos.zonas[zonaObj.nombre] = zona.id;
          mapeos.zonas[zonaObj.nombre.toUpperCase()] = zona.id; // También mapear versión mayúscula
          zonasCreadas.push(zona.id);
          console.log(`✅ Nueva zona creada: ${zonaObj.nombre} (${zona.id})`);
        } catch (error) {
          resumen.errores.push(`Error creando zona ${zonaObj.nombre}: ${error.message}`);
        }
      }
    }
  }
  
  // 2. Colaboradores (UPSERT por nombre normalizado)
  let colaboradoresCreados = [];
  if (setters.setColaboradores) {
    for (const nombre of entidadesUnicas.colaboradores) {
      // UPSERT: Buscar colaborador existente por nombre normalizado (case-insensitive)
      let colaboradorExistente = entitiesExistentes.colaboradores?.find(c => 
        c.nombre.toUpperCase() === nombre.toUpperCase()
      );
      
      if (colaboradorExistente) {
        // Usar colaborador existente - mapear tanto original como normalizado
        mapeos.colaboradores[nombre] = colaboradorExistente.id;
        mapeos.colaboradores[nombre.toUpperCase()] = colaboradorExistente.id;
        console.log(`♻️ Usando colaborador existente: ${nombre} → ${colaboradorExistente.nombre} (${colaboradorExistente.id})`);
      } else {
        try {
          // Usar el nombre original (no normalizado) para crear
          const nombreOriginal = Array.from(entidadesUnicas.colaboradores).find(n => 
            n.toUpperCase() === nombre.toUpperCase()
          ) || nombre;
          
          const colaborador = await createColaboradorLocal(nombreOriginal);
          setters.setColaboradores((prev) => {
            if (!prev.some(c => c.id === colaborador.id || c.nombre.toUpperCase() === colaborador.nombre.toUpperCase())) {
              return [...prev, colaborador];
            }
            return prev;
          });
          resumen.colaboradoresNuevos.push(nombreOriginal);
          resumen.colaboradoresCreados++;
          mapeos.colaboradores[nombre] = colaborador.id;
          mapeos.colaboradores[nombre.toUpperCase()] = colaborador.id;
          colaboradoresCreados.push(colaborador.id);
          console.log(`✅ Nuevo colaborador creado: ${nombreOriginal} (${colaborador.id})`);
        } catch (error) {
          resumen.errores.push(`Error creando colaborador ${nombre}: ${error.message}`);
        }
      }
    }
  }
  
  // 3. Operadores (UPSERT por nombre normalizado) 
  let operadoresCreados = [];
  if (setters.setOperadores) {
    for (const nombre of entidadesUnicas.operadores) {
      // UPSERT: Buscar operador existente por nombre normalizado (case-insensitive)
      let operadorExistente = entitiesExistentes.operadores?.find(o => 
        o.nombre.toUpperCase() === nombre.toUpperCase()
      );
      
      if (operadorExistente) {
        // Usar operador existente - mapear tanto original como normalizado
        mapeos.operadores[nombre] = operadorExistente.id;
        mapeos.operadores[nombre.toUpperCase()] = operadorExistente.id;
        console.log(`♻️ Usando operador existente: ${nombre} → ${operadorExistente.nombre} (${operadorExistente.id})`);
      } else {
        try {
          // Usar el nombre original (no normalizado) para crear
          const nombreOriginal = Array.from(entidadesUnicas.operadores).find(n => 
            n.toUpperCase() === nombre.toUpperCase()
          ) || nombre;
          
          const operador = await createOperadorLocal(nombreOriginal);
          setters.setOperadores((prev) => {
            if (!prev.some(o => o.id === operador.id || o.nombre.toUpperCase() === operador.nombre.toUpperCase())) {
              return [...prev, operador];
            }
            return prev;
          });
          resumen.operadoresNuevos.push(nombreOriginal);
          resumen.operadoresCreados++;
          mapeos.operadores[nombre] = operador.id;
          mapeos.operadores[nombre.toUpperCase()] = operador.id;
          operadoresCreados.push(operador.id);
          console.log(`✅ Nuevo operador creado: ${nombreOriginal} (${operador.id})`);
        } catch (error) {
          resumen.errores.push(`Error creando operador ${nombre}: ${error.message}`);
        }
      }
    }
  }
  // 4. Productos (UPSERT por nombre normalizado)
  if (setters.setProductos) {
    for (const [nombreNormalizado, datos] of entidadesUnicas.productos) {
      const operadorId = mapeos.operadores[datos.operador] || mapeos.operadores[datos.operador?.toUpperCase()] || null;
      
      // UPSERT: Buscar producto existente por nombre normalizado (case-insensitive)
      let productoExistente = entitiesExistentes.productos?.find(p => 
        p.nombre.toUpperCase() === datos.nombre.toUpperCase()
      );
      
      if (productoExistente) {
        // Usar producto existente - mapear tanto original como normalizado
        mapeos.productos[datos.nombre] = productoExistente.id;
        mapeos.productos[nombreNormalizado] = productoExistente.id;
        console.log(`♻️ Usando producto existente: ${datos.nombre} → ${productoExistente.nombre} (${productoExistente.id})`);
      } else {
        try {
          const producto = await createProductoLocal(
            datos.nombre, // Usar nombre original
            operadorId,
            datos.pvp,
            datos.comision_base
          );
          setters.setProductos((prev) => {
            if (!prev.some(p => p.id === producto.id || p.nombre.toUpperCase() === producto.nombre.toUpperCase())) {
              return [...prev, producto];
            }
            return prev;
          });
          resumen.productosNuevos.push(
            `${datos.nombre} (PVP: ${datos.pvp}€, Comisión: ${datos.comision_base}€)`
          );
          resumen.productosCreados++;
          mapeos.productos[datos.nombre] = producto.id;
          mapeos.productos[nombreNormalizado] = producto.id;
          console.log(`✅ Nuevo producto creado: ${datos.nombre} (${producto.id})`);
        } catch (error) {
          resumen.errores.push(`Error creando producto ${datos.nombre}: ${error.message}`);
        }
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
      // Normalizar a UPPERCASE para evitar duplicados
      operadores.add(operador.toUpperCase());
    }

    const producto = get("producto_id");
    if (producto) {
      const comisionBase = parseFloat(get("comision_base")) || 15.0;
      const pvp = parseFloat(get("pvp")) || 50.0;
      // Normalizar a UPPERCASE para evitar duplicados
      const productoNormalizado = producto.toUpperCase();

      productos.set(productoNormalizado, {
        nombre: producto, // Mantener el original para mostrar
        operador: operador ? operador.toUpperCase() : null,
        comision_base: comisionBase,
        pvp: pvp,
      });
    }

    const colaborador = get("colaborador_id");
    if (colaborador) {
      // Normalizar a UPPERCASE para evitar duplicados
      colaboradores.add(colaborador.toUpperCase());
    }

    const zona = get("zona_id");
    if (zona) {
      // Normalizar zona a PENÍNSULA o CANARIAS
      const zonaNormalizada = normalizeZoneName(zona);
      
      zonas.add(
        JSON.stringify({
          nombre: zonaNormalizada, // Usar nombre normalizado
          original: zona.trim(),   // Mantener referencia al original
          nombre_normalizado: zonaNormalizada.toUpperCase(),
          impuesto_tipo: zonaNormalizada === 'CANARIAS' ? 'IGIC' : 'IVA',
          impuesto_pct: zonaNormalizada === 'CANARIAS' ? 0.07 : 0.21,
        }),
      );
    }
  });

  const resultado = { operadores, productos, colaboradores, zonas };
  console.log('Entidades únicas recopiladas:', {
    operadores: Array.from(operadores),
    productos: Array.from(productos.keys()),
    colaboradores: Array.from(colaboradores),
    zonas: Array.from(zonas).map(z => {
      try {
        return JSON.parse(z).nombre;
      } catch {
        return z;
      }
    })
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