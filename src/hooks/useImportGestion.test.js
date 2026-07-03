import { describe, it, expect, vi, afterEach } from 'vitest';
import { resolveImpuestosZona, createEntityWithReadableId, resolverMotivosRechazoVenta } from './useImportGestion';
import { computeVenta } from '../utils/calculos';

describe('resolveImpuestosZona', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('devuelve IGIC 0.07 para Canarias', () => {
    expect(resolveImpuestosZona('Canarias')).toEqual({ impuesto_tipo: 'IGIC', impuesto_pct: 0.07 });
  });

  it('devuelve IVA 0.21 para Península', () => {
    expect(resolveImpuestosZona('Península')).toEqual({ impuesto_tipo: 'IVA', impuesto_pct: 0.21 });
  });

  it('aplica IVA 21% por defecto y avisa por consola cuando el nombre no se reconoce', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const resultado = resolveImpuestosZona('Baleares');

    expect(resultado).toEqual({ impuesto_tipo: 'IVA', impuesto_pct: 0.21 });
    expect(resultado.impuesto_pct).not.toBeUndefined();
    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(warnSpy.mock.calls[0][0]).toContain('Baleares');
  });

  it('el fallback también cubre un typo del nombre esperado', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const resultado = resolveImpuestosZona('Canaria');

    expect(resultado).toEqual({ impuesto_tipo: 'IVA', impuesto_pct: 0.21 });
    expect(warnSpy).toHaveBeenCalledTimes(1);
  });
});

describe('createEntityWithReadableId', () => {
  it('un producto autocreado con operador y comisión resueltos en la fila del Excel no queda incompleto', () => {
    const existingIds = new Set();

    const producto = createEntityWithReadableId('productos', 'Fibra 600MB', existingIds, {
      pvp: 40,
      operador_id: 'oper_existente_123',
      comision_valor: 12.5,
    });

    expect(producto.operador_id).toBe('oper_existente_123');
    expect(producto.comision_valor).toBe(12.5);
    expect(producto.id).toMatch(/^prod_/);
  });

  it('un producto autocreado sin pvp en el Excel queda null, no 50€ fijo', () => {
    const existingIds = new Set();

    const producto = createEntityWithReadableId('productos', 'Fibra 600MB', existingIds, {
      operador_id: 'oper_existente_123',
    });

    expect(producto.pvp).toBeNull();
  });

  it('un producto autocreado sin ningún additionalData también queda con pvp/comision_valor/operador_id null (no hay default oculto)', () => {
    const existingIds = new Set();

    const producto = createEntityWithReadableId('productos', 'Fibra 600MB', existingIds);

    expect(producto.pvp).toBeNull();
    expect(producto.comision_valor).toBeNull();
    expect(producto.operador_id).toBeNull();
  });

  it('un producto autocreado sin operador ni comisión en el Excel queda explícitamente incompleto (null, no un valor inventado)', () => {
    const existingIds = new Set();

    const producto = createEntityWithReadableId('productos', 'Fibra 600MB', existingIds, {
      pvp: 40,
      operador_id: null,
      comision_valor: null,
    });

    expect(producto.operador_id).toBeNull();
    expect(producto.comision_valor).toBeNull();
  });

  it('un colaborador autocreado por import no recibe un nivel_id falso (antes: placeholder "NIVEL_COLABORADOR" inexistente)', () => {
    const existingIds = new Set();

    const colaborador = createEntityWithReadableId('colaboradores', 'Juan Pérez', existingIds);

    expect(colaborador.nivel_id).toBeNull();
  });

  it('un colaborador autocreado por import no incluye pct_colaborador_default ni irpf_retencion (no son columnas reales de colaboradores_cv, confirmado contra Supabase)', () => {
    const existingIds = new Set();

    const colaborador = createEntityWithReadableId('colaboradores', 'Juan Pérez', existingIds);

    expect(colaborador).not.toHaveProperty('pct_colaborador_default');
    expect(colaborador).not.toHaveProperty('irpf_retencion');
    expect(colaborador.tipo_fiscal).toBe('AUTONOMO');
  });

  it('computeVenta() da ok:true cuando el producto importado tiene operador_id resuelto', () => {
    const existingIds = new Set();
    const operador = { id: 'oper_test_1', nombre: 'FINETWORK' };
    const producto = createEntityWithReadableId('productos', 'Fibra 600MB', existingIds, {
      pvp: 40,
      operador_id: operador.id,
      comision_valor: 12.5,
    });
    const zona = { id: 'zona_test_1', impuesto_pct: 0.21 };
    const colaborador = { id: 'colab_test_1', nivel_id: 'nivel_test_1' };
    const nivel = { id: 'nivel_test_1', pct_colaborador_default: 0.5 };
    const venta = {
      id: 'venta_test_1',
      fecha: '2026-07-03',
      producto_id: producto.id,
      colaborador_id: colaborador.id,
      zona_id: zona.id,
      pvp: 40,
    };

    const resultado = computeVenta({
      venta,
      productos: [producto],
      operadores: [operador],
      zonas: [zona],
      colaboradores: [colaborador],
      niveles: [nivel],
      reglas: [],
    });

    expect(resultado.ok).toBe(true);
  });

  it('computeVenta() da ok:false cuando el producto importado se quedó sin operador_id (el bug original)', () => {
    const existingIds = new Set();
    const producto = createEntityWithReadableId('productos', 'Fibra 600MB', existingIds, {
      pvp: 40,
      operador_id: null, // el Excel no traía operador para esta fila
      comision_valor: null,
    });
    const zona = { id: 'zona_test_1', impuesto_pct: 0.21 };
    const colaborador = { id: 'colab_test_1', nivel_id: 'nivel_test_1' };
    const venta = {
      id: 'venta_test_2',
      fecha: '2026-07-03',
      producto_id: producto.id,
      colaborador_id: colaborador.id,
      zona_id: zona.id,
      pvp: 40,
    };

    const resultado = computeVenta({
      venta,
      productos: [producto],
      operadores: [], // sin operador que resuelva producto.operador_id === null
      zonas: [zona],
      colaboradores: [colaborador],
      niveles: [],
      reglas: [],
    });

    expect(resultado.ok).toBe(false);
  });
});

describe('resolverMotivosRechazoVenta — una venta sin datos críticos se rechaza, no se completa con un valor arbitrario', () => {
  const filaCompleta = {
    cliente: 'Cliente Real', colaborador_id: 'colab_1', zona_id: 'zona_1',
    producto_id: 'prod_1', operador_id: 'oper_1', pvpValido: true,
  };

  it('una fila con todo resuelto no se rechaza', () => {
    expect(resolverMotivosRechazoVenta(filaCompleta)).toEqual([]);
  });

  it('sin zona resuelta, se rechaza específicamente por "zona" (antes: caía a zonas[0])', () => {
    const motivos = resolverMotivosRechazoVenta({ ...filaCompleta, zona_id: null });
    expect(motivos).toEqual(['zona']);
  });

  it('sin producto resuelto, se rechaza específicamente por "producto" (antes: caía a productos[0])', () => {
    const motivos = resolverMotivosRechazoVenta({ ...filaCompleta, producto_id: null });
    expect(motivos).toEqual(['producto']);
  });

  it('sin operador resuelto, se rechaza específicamente por "operador" (antes: caía a operadores[0])', () => {
    const motivos = resolverMotivosRechazoVenta({ ...filaCompleta, operador_id: null });
    expect(motivos).toEqual(['operador']);
  });

  it('sin cliente real, se rechaza específicamente por "cliente" (antes: se rellenaba "Cliente N")', () => {
    const motivos = resolverMotivosRechazoVenta({ ...filaCompleta, cliente: null });
    expect(motivos).toEqual(['cliente']);
  });

  it('sin PVP válido, se rechaza específicamente por "PVP" (antes: 50€ fijo)', () => {
    const motivos = resolverMotivosRechazoVenta({ ...filaCompleta, pvpValido: false });
    expect(motivos).toEqual(['PVP']);
  });

  it('con varios campos sin resolver a la vez, lista todos los motivos, no solo el primero', () => {
    const motivos = resolverMotivosRechazoVenta({
      cliente: null, colaborador_id: 'colab_1', zona_id: null,
      producto_id: null, operador_id: 'oper_1', pvpValido: false,
    });
    expect(motivos).toEqual(['cliente', 'zona', 'producto', 'PVP']);
  });
});
