import { describe, it, expect, vi, afterEach } from 'vitest';
import { resolveImpuestosZona, createEntityWithReadableId } from './useImportGestion';
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
