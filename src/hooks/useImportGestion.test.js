import { describe, it, expect, vi, afterEach } from 'vitest';
import { resolveImpuestosZona } from './useImportGestion';

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
