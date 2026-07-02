import { describe, it, expect } from 'vitest';
import { calcularDecomisiones } from './liquidacionesUtils';

const operadorDefault = { id: 'op-1', nombre: 'Operador Test' };
const ventaBase = {
  id: 'venta-1',
  cliente: 'Cliente Test',
  operador_id: 'op-1',
  colaborador_id: 'colab-1',
  fecha: '2025-01-01',
  _calc: { ok: true, detalle: { comBruta: 100 } },
};

describe('calcularDecomisiones', () => {
  it('no genera decomisión si la venta no tiene fecha_baja', () => {
    const venta = { ...ventaBase, periodo_compromiso: 12 };
    expect(calcularDecomisiones([venta], [operadorDefault])).toEqual([]);
  });

  it('no genera decomisión si la venta no tiene periodo_compromiso', () => {
    const venta = { ...ventaBase, fecha_baja: '2025-02-01' };
    expect(calcularDecomisiones([venta], [operadorDefault])).toEqual([]);
  });

  it('no genera decomisión si no se encuentra el operador de la venta', () => {
    const venta = { ...ventaBase, fecha_baja: '2025-02-01', periodo_compromiso: 12, operador_id: 'op-inexistente' };
    expect(calcularDecomisiones([venta], [operadorDefault])).toEqual([]);
  });

  it('decomisión al 100% si la baja ocurre antes del límite de meses (regla antes_6_meses)', () => {
    const venta = { ...ventaBase, fecha_baja: '2025-02-01', periodo_compromiso: 12 };
    const resultado = calcularDecomisiones([venta], [operadorDefault]);
    expect(resultado).toHaveLength(1);
    expect(resultado[0]).toMatchObject({
      venta_id: 'venta-1',
      cliente_nombre: 'Cliente Test',
      operador_id: 'op-1',
      regla_aplicada: 'antes_limite',
      porcentaje_decomision: 100,
      comision_original: 100,
      importe_decomision: 100,
    });
  });

  it('decomisión parcial si la baja ocurre después del límite pero dentro del compromiso (regla despues_6_meses)', () => {
    const venta = { ...ventaBase, fecha_baja: '2025-10-01', periodo_compromiso: 12 };
    const resultado = calcularDecomisiones([venta], [operadorDefault]);
    expect(resultado).toHaveLength(1);
    expect(resultado[0].regla_aplicada).toBe('despues_limite');
    expect(resultado[0].importe_decomision).toBeGreaterThan(0);
    expect(resultado[0].importe_decomision).toBeLessThan(100);
  });

  it('no genera decomisión si la baja ocurre después de cumplir todo el período comprometido', () => {
    const venta = { ...ventaBase, periodo_compromiso: 6, fecha_baja: '2026-01-01' };
    expect(calcularDecomisiones([venta], [operadorDefault])).toEqual([]);
  });

  it('no genera decomisión si la comisión original es 0 (venta sin cálculo válido)', () => {
    const venta = { ...ventaBase, fecha_baja: '2025-02-01', periodo_compromiso: 12, _calc: { ok: false } };
    expect(calcularDecomisiones([venta], [operadorDefault])).toEqual([]);
  });

  it('usa reglas de decomisión personalizadas del operador si existen (limite_meses distinto del default)', () => {
    const operadorPersonalizado = {
      id: 'op-1',
      nombre: 'Operador Estricto',
      reglas_decomision: { antes_6_meses: 100, despues_6_meses: 80, limite_meses: 3 },
    };
    const venta = { ...ventaBase, fecha_baja: '2025-05-01', periodo_compromiso: 12 }; // ~4 meses, después del límite de 3
    const resultado = calcularDecomisiones([venta], [operadorPersonalizado]);
    expect(resultado).toHaveLength(1);
    expect(resultado[0].regla_aplicada).toBe('despues_limite');
    expect(resultado[0].importe_decomision).toBeGreaterThan(0);
  });

  it('con despues_6_meses en 0, un operador estricto no genera decomisión tras el límite', () => {
    const operadorSinDecomisionTardia = {
      id: 'op-1',
      nombre: 'Operador Estricto',
      reglas_decomision: { antes_6_meses: 100, despues_6_meses: 0, limite_meses: 3 },
    };
    const venta = { ...ventaBase, fecha_baja: '2025-05-01', periodo_compromiso: 12 };
    const resultado = calcularDecomisiones([venta], [operadorSinDecomisionTardia]);
    expect(resultado).toEqual([]);
  });

  it('procesa varias ventas de forma independiente', () => {
    const ventaConDecomision = { ...ventaBase, id: 'venta-1', fecha_baja: '2025-02-01', periodo_compromiso: 12 };
    const ventaSinBaja = { ...ventaBase, id: 'venta-2' };
    const resultado = calcularDecomisiones([ventaConDecomision, ventaSinBaja], [operadorDefault]);
    expect(resultado).toHaveLength(1);
    expect(resultado[0].venta_id).toBe('venta-1');
  });
});
