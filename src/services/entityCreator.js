// src/services/entityCreator.js - VERSIÓN CORREGIDA
// Mantiene toda la estructura existente pero con correcciones para errores de importación

// ...resto del archivo: solo lógica local activa...

/**
 * ✅ FUNCIÓN AÑADIDA: Normalización mejorada para búsquedas case insensitive
 */
const normalizeNameSearch = (name) => {
  if (!name || typeof name !== 'string') return '';
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/['`´’]/g, '')
    .trim()
    .toUpperCase();
};

/**
 * ✅ FUNCIÓN AÑADIDA: Buscar entidad existente con case insensitive mejorado
 */
const findExistingEntity = (searchName, entities, nameField = 'nombre', codeField = null) => {
  if (!searchName || !entities || entities.length === 0) return null;
  
  const normalizedSearch = normalizeNameSearch(searchName);
  
  // Buscar por nombre
  let found = entities.find(entity => 
    normalizeNameSearch(entity[nameField] || '') === normalizedSearch
  );
  
  // Si no se encontró y hay campo código, buscar por código también
  if (!found && codeField) {
    found = entities.find(entity => 
      normalizeNameSearch(entity[codeField] || '') === normalizedSearch
    );
  }
  
  return found;
};

// Versiones locales (sin supabase) para crear entidades y mapearlas en memoria
export async function createOperadorLocal(nombre) {
  if (typeof nombre !== "string" || !nombre.trim()) {
    throw new Error("El nombre del operador es obligatorio");
  }
  const id = `op_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`;
  const nombreLimpio = nombre.trim();
  
  return {
    id,
    nombre: nombreLimpio,
    sector: "TELEFONIA", // ✅ CORRECTO: usar TELEFONIA en mayúsculas
    codigo: nombreLimpio.toUpperCase().replace(/\s+/g, '_').slice(0, 10),
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

  const normalized = normalizeNameSearch(nombre);

  if (normalized.includes('CANARI')) return 'Canarias';
  if (normalized.includes('BALEAR')) return 'Baleares';
  if (normalized.includes('CEUTA')) return 'Ceuta';
  if (normalized.includes('MELILLA')) return 'Melilla';

  // Todo lo demás se considera Península
  return 'Península';
}

export async function createZonaLocal(nombre, datosExtras = {}) {
  if (!nombre || typeof nombre !== 'string' || nombre.trim() === '') {
    throw new Error("El nombre de la zona es obligatorio");
  }

  const canonicalName = normalizeZoneName(nombre);
  const canonicalKey = normalizeNameSearch(canonicalName);

  const zoneMeta = {
    CANARIAS: {
      codigo: 'CAN',
      impuesto_tipo: 'IGIC',
      impuesto_pct: datosExtras.impuesto_pct ?? 0.07,
      iva: 0,
      igic: datosExtras.igic ?? 0.07,
    },
    BALEARES: {
      codigo: 'BAL',
      impuesto_tipo: 'IVA',
      impuesto_pct: datosExtras.impuesto_pct ?? datosExtras.iva ?? 0.21,
      iva: datosExtras.iva ?? 0.21,
      igic: 0,
    },
    CEUTA: {
      codigo: 'CEU',
      impuesto_tipo: 'IPSI',
      impuesto_pct: datosExtras.impuesto_pct ?? 0.07,
      iva: 0,
      igic: 0,
    },
    MELILLA: {
      codigo: 'MEL',
      impuesto_tipo: 'IPSI',
      impuesto_pct: datosExtras.impuesto_pct ?? 0.07,
      iva: 0,
      igic: 0,
    },
    PENINSULA: {
      codigo: 'PEN',
      impuesto_tipo: 'IVA',
      impuesto_pct: datosExtras.impuesto_pct ?? datosExtras.iva ?? 0.21,
      iva: datosExtras.iva ?? 0.21,
      igic: 0,
    },
  };

  const meta = zoneMeta[canonicalKey] || zoneMeta.PENINSULA;

  return {
    id: `zona-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    nombre: canonicalName,
    codigo: meta.codigo,
    iva: meta.iva,
    irpf: datosExtras.irpf ?? 0.07,
    igic: meta.igic,
    impuesto_tipo: meta.impuesto_tipo,
    impuesto_pct: meta.impuesto_pct,
    descripcion: `Zona creada automáticamente: ${canonicalName} (de "${nombre.trim()}")`,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
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
    sector: "TELEFONIA", // ✅ CORRECTO: usar TELEFONIA en mayúsculas
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

// ✅ FUNCIÓN CORREGIDA: Crea todas las entidades faltantes en memoria y actualiza los estados locales
export async function createMissingEntitiesLocal(entidadesUnicas, entitiesExistentes, setters) {
  console.log('🚀 Iniciando creación de entidades faltantes (local) - VERSIÓN CORREGIDA');
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
  
  // ✅ 1. ZONAS (UPSERT mejorado con case insensitive)
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
      
      // ✅ BÚSQUEDA MEJORADA: Usar función helper para case insensitive
      let zonaExistente = findExistingEntity(
        zonaObj.nombre, 
        entitiesExistentes.zonas, 
        'nombre'
      );
      
      if (zonaExistente) {
        // Usar zona existente - mapear múltiples variaciones
        const nombreOriginal = zonaObj.nombre;
        const claveOriginal = normalizeNameSearch(nombreOriginal);
        const claveExistente = normalizeNameSearch(zonaExistente.nombre);
        
        mapeos.zonas[nombreOriginal] = zonaExistente.id;
        mapeos.zonas[claveOriginal] = zonaExistente.id;
        mapeos.zonas[claveExistente] = zonaExistente.id;
        mapeos.zonas[zonaExistente.nombre] = zonaExistente.id;
        
        console.log(`♻️ Usando zona existente: "${nombreOriginal}" → ${zonaExistente.nombre} (${zonaExistente.id})`);
      } else {
        try {
          const zona = await createZonaLocal(zonaObj.nombre, zonaObj);
          setters.setZonas((prev) => {
            // ✅ VERIFICACIÓN MEJORADA: evitar duplicados por nombre normalizado
            const yaExiste = prev.some(z => 
              z.id === zona.id || 
              normalizeNameSearch(z.nombre) === normalizeNameSearch(zona.nombre)
            );
            if (!yaExiste) {
              return [...prev, zona];
            }
            return prev;
          });
          
          resumen.zonasNuevas.push(zonaObj.nombre);
          resumen.zonasCreadas++;
          
          // Mapear múltiples variaciones
          const claveOriginal = normalizeNameSearch(zonaObj.nombre);
          const claveResultado = normalizeNameSearch(zona.nombre);
          mapeos.zonas[zonaObj.nombre] = zona.id;
          mapeos.zonas[claveOriginal] = zona.id;
          mapeos.zonas[zona.nombre] = zona.id;
          mapeos.zonas[claveResultado] = zona.id;
          
          zonasCreadas.push(zona.id);
          console.log(`✅ Nueva zona creada: ${zonaObj.nombre} → ${zona.nombre} (${zona.id})`);
        } catch (error) {
          resumen.errores.push(`Error creando zona ${zonaObj.nombre}: ${error.message}`);
        }
      }
    }
  }
  
  // ✅ 2. COLABORADORES (UPSERT mejorado con case insensitive)
  let colaboradoresCreados = [];
  if (setters.setColaboradores) {
    for (const nombre of entidadesUnicas.colaboradores) {
      // ✅ BÚSQUEDA MEJORADA: Usar función helper para case insensitive
      let colaboradorExistente = findExistingEntity(
        nombre, 
        entitiesExistentes.colaboradores, 
        'nombre'
      );
      
      if (colaboradorExistente) {
        // Mapear múltiples variaciones del nombre
  const claveOriginal = normalizeNameSearch(nombre);
  const claveExistente = normalizeNameSearch(colaboradorExistente.nombre);
  mapeos.colaboradores[nombre] = colaboradorExistente.id;
  mapeos.colaboradores[claveOriginal] = colaboradorExistente.id;
  mapeos.colaboradores[colaboradorExistente.nombre] = colaboradorExistente.id;
  mapeos.colaboradores[claveExistente] = colaboradorExistente.id;
        
        console.log(`♻️ Usando colaborador existente: "${nombre}" → ${colaboradorExistente.nombre} (${colaboradorExistente.id})`);
      } else {
        try {
          // Buscar nombre original en entidades únicas para preservar capitalización
          const nombreOriginal = Array.from(entidadesUnicas.colaboradores).find(n => 
            normalizeNameSearch(n) === normalizeNameSearch(nombre)
          ) || nombre;
          
          const colaborador = await createColaboradorLocal(nombreOriginal);
          setters.setColaboradores((prev) => {
            // ✅ VERIFICACIÓN MEJORADA: evitar duplicados por nombre normalizado
            const yaExiste = prev.some(c => 
              c.id === colaborador.id || 
              normalizeNameSearch(c.nombre) === normalizeNameSearch(colaborador.nombre)
            );
            if (!yaExiste) {
              return [...prev, colaborador];
            }
            return prev;
          });
          
          resumen.colaboradoresNuevos.push(nombreOriginal);
          resumen.colaboradoresCreados++;
          
          // Mapear múltiples variaciones
          const claveOriginal = normalizeNameSearch(nombre);
          const claveResultado = normalizeNameSearch(colaborador.nombre);
          mapeos.colaboradores[nombre] = colaborador.id;
          mapeos.colaboradores[claveOriginal] = colaborador.id;
          mapeos.colaboradores[colaborador.nombre] = colaborador.id;
          mapeos.colaboradores[claveResultado] = colaborador.id;
          
          colaboradoresCreados.push(colaborador.id);
          console.log(`✅ Nuevo colaborador creado: ${nombreOriginal} (${colaborador.id})`);
        } catch (error) {
          resumen.errores.push(`Error creando colaborador ${nombre}: ${error.message}`);
        }
      }
    }
  }
  
  // ✅ 3. OPERADORES (UPSERT mejorado con case insensitive y código)
  let operadoresCreados = [];
  if (setters.setOperadores) {
    for (const nombre of entidadesUnicas.operadores) {
      // ✅ BÚSQUEDA MEJORADA: Buscar por nombre Y por código
      let operadorExistente = findExistingEntity(
        nombre, 
        entitiesExistentes.operadores, 
        'nombre',
        'codigo' // También buscar por código
      );
      
      if (operadorExistente) {
        // Mapear múltiples variaciones
        const claveOriginal = normalizeNameSearch(nombre);
        const claveExistente = normalizeNameSearch(operadorExistente.nombre);
        mapeos.operadores[nombre] = operadorExistente.id;
        mapeos.operadores[claveOriginal] = operadorExistente.id;
        mapeos.operadores[operadorExistente.nombre] = operadorExistente.id;
        mapeos.operadores[claveExistente] = operadorExistente.id;
        if (operadorExistente.codigo) {
          mapeos.operadores[operadorExistente.codigo] = operadorExistente.id;
          mapeos.operadores[normalizeNameSearch(operadorExistente.codigo)] = operadorExistente.id;
        }
        
        console.log(`♻️ Usando operador existente: "${nombre}" → ${operadorExistente.nombre} (${operadorExistente.id})`);
      } else {
        try {
          // Buscar nombre original para preservar capitalización
          const nombreOriginal = Array.from(entidadesUnicas.operadores).find(n => 
            normalizeNameSearch(n) === normalizeNameSearch(nombre)
          ) || nombre;
          
          const operador = await createOperadorLocal(nombreOriginal);
          setters.setOperadores((prev) => {
            // ✅ VERIFICACIÓN MEJORADA: evitar duplicados por nombre Y código
            const yaExiste = prev.some(o => 
              o.id === operador.id || 
              normalizeNameSearch(o.nombre) === normalizeNameSearch(operador.nombre) ||
              (o.codigo && normalizeNameSearch(o.codigo) === normalizeNameSearch(operador.codigo))
            );
            if (!yaExiste) {
              return [...prev, operador];
            }
            return prev;
          });
          
          resumen.operadoresNuevos.push(nombreOriginal);
          resumen.operadoresCreados++;
          
          // Mapear múltiples variaciones
          const claveOriginal = normalizeNameSearch(nombre);
          const claveResultado = normalizeNameSearch(operador.nombre);
          const claveCodigo = operador.codigo ? normalizeNameSearch(operador.codigo) : null;
          mapeos.operadores[nombre] = operador.id;
          mapeos.operadores[claveOriginal] = operador.id;
          mapeos.operadores[operador.nombre] = operador.id;
          mapeos.operadores[claveResultado] = operador.id;
          if (operador.codigo) {
            mapeos.operadores[operador.codigo] = operador.id;
            if (claveCodigo) mapeos.operadores[claveCodigo] = operador.id;
          }
          
          operadoresCreados.push(operador.id);
          console.log(`✅ Nuevo operador creado: ${nombreOriginal} (${operador.id})`);
        } catch (error) {
          resumen.errores.push(`Error creando operador ${nombre}: ${error.message}`);
        }
      }
    }
  }
  
  // ✅ 4. PRODUCTOS (UPSERT mejorado con constraint operador_id + nombre)
  if (setters.setProductos) {
    for (const [nombreNormalizado, datos] of entidadesUnicas.productos) {
  const operadorKey = normalizeNameSearch(datos.operador);
  const operadorId = mapeos.operadores[datos.operador] || 
        (operadorKey ? mapeos.operadores[operadorKey] : undefined) || 
        null;
      
      // ✅ BÚSQUEDA CRÍTICA: Verificar constraint único operador_id + nombre
      let productoExistente = null;
      
      if (operadorId) {
        // Buscar por combinación operador_id + nombre (constraint único)
        productoExistente = entitiesExistentes.productos?.find(p => 
          p.operador_id === operadorId && 
          normalizeNameSearch(p.nombre) === normalizeNameSearch(datos.nombre)
        );
      }
      
      // Si no se encontró por constraint, buscar solo por nombre
      if (!productoExistente) {
        productoExistente = findExistingEntity(
          datos.nombre, 
          entitiesExistentes.productos, 
          'nombre'
        );
      }
      
      if (productoExistente) {
        // Mapear múltiples variaciones
    const claveOriginal = normalizeNameSearch(datos.nombre);
    const claveExistente = normalizeNameSearch(productoExistente.nombre);
    mapeos.productos[datos.nombre] = productoExistente.id;
    mapeos.productos[nombreNormalizado] = productoExistente.id;
    mapeos.productos[productoExistente.nombre] = productoExistente.id;
    mapeos.productos[claveOriginal] = productoExistente.id;
    mapeos.productos[claveExistente] = productoExistente.id;
        
        console.log(`♻️ Usando producto existente: "${datos.nombre}" → ${productoExistente.nombre} (${productoExistente.id})`);
      } else {
        try {
          const producto = await createProductoLocal(
            datos.nombre, // Usar nombre original
            operadorId,
            datos.pvp,
            datos.comision_base
          );
          
          setters.setProductos((prev) => {
            // ✅ VERIFICACIÓN CRÍTICA: evitar duplicados por constraint operador_id + nombre
            const yaExiste = prev.some(p => 
              p.id === producto.id || 
              (p.operador_id === producto.operador_id && 
               normalizeNameSearch(p.nombre) === normalizeNameSearch(producto.nombre))
            );
            if (!yaExiste) {
              return [...prev, producto];
            }
            return prev;
          });
          
          resumen.productosNuevos.push(
            `${datos.nombre} (PVP: ${datos.pvp}€, Comisión: ${datos.comision_base}€)`
          );
          resumen.productosCreados++;
          
          // Mapear múltiples variaciones
          const claveOriginal = normalizeNameSearch(datos.nombre);
          mapeos.productos[datos.nombre] = producto.id;
          mapeos.productos[nombreNormalizado] = producto.id;
          mapeos.productos[claveOriginal] = producto.id;
          
          console.log(`✅ Nuevo producto creado: ${datos.nombre} (${producto.id}) para operador ${operadorId}`);
        } catch (error) {
          console.error(`❌ Error creando producto ${datos.nombre}:`, error);
          resumen.errores.push(`Error creando producto ${datos.nombre}: ${error.message}`);
        }
      }
    }
  }
  
  console.log('🎉 Creación local completada (CORREGIDA):', resumen);
  return { resumen, mapeos };
}

/**
 * ✅ FUNCIÓN CORREGIDA: Recopila entidades únicas con normalización mejorada
 */
export function recopilarEntidadesUnicas(rows, mapping) {
  console.log('🔍 Recopilando entidades únicas de', rows.length, 'filas (VERSIÓN CORREGIDA)');
  
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
      // ✅ MANTENER NOMBRE ORIGINAL, no convertir a uppercase automáticamente
      operadores.add(operador);
    }

    const producto = get("producto_id");
    if (producto) {
      const comisionBase = parseFloat(get("comision_base")) || 15.0;
      const pvp = parseFloat(get("pvp")) || 50.0;
      
      // ✅ USAR NOMBRE ORIGINAL como key, normalizar para búsquedas
      const productoKey = producto;

      productos.set(productoKey, {
        nombre: producto, // Mantener original
        operador: operador, // Mantener original del operador
        comision_base: comisionBase,
        pvp: pvp,
      });
    }

    const colaborador = get("colaborador_id");
    if (colaborador) {
      // ✅ MANTENER NOMBRE ORIGINAL
      colaboradores.add(colaborador);
    }

    const zona = get("zona_id");
    if (zona) {
      const zonaNormalizada = normalizeZoneName(zona);
      const claveZona = normalizeNameSearch(zonaNormalizada);

      zonas.add(
        JSON.stringify({
          nombre: zonaNormalizada,
          original: zona.trim(),
          nombre_normalizado: claveZona,
          impuesto_tipo:
            zonaNormalizada === 'Canarias' ? 'IGIC' :
            zonaNormalizada === 'Ceuta' || zonaNormalizada === 'Melilla' ? 'IPSI' :
            'IVA',
          impuesto_pct:
            zonaNormalizada === 'Canarias' ? 0.07 :
            zonaNormalizada === 'Ceuta' || zonaNormalizada === 'Melilla' ? 0.07 :
            0.21,
        }),
      );
    }
  });

  const resultado = { operadores, productos, colaboradores, zonas };
  console.log('📊 Entidades únicas recopiladas (CORREGIDO):', {
    operadores: Array.from(operadores),
    productos: Array.from(productos.keys()),
    colaboradores: Array.from(colaboradores),
    zonas: Array.from(zonas).map(z => {
      try {
        const parsed = JSON.parse(z);
        return `${parsed.nombre} (original: ${parsed.original})`;
      } catch {
        return z;
      }
    })
  });
  
  return resultado;
}

/**
 * ✅ MANTENER FUNCIÓN ORIGINAL: Crea todas las entidades faltantes automáticamente
 */
export async function createMissingEntities(entidadesUnicas, entitiesExistentes, setters) {
  console.log('🚀 Iniciando creación de entidades faltantes (función original mantenida)');
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

      // Esperar que los operadores se confirmen en Supabase
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