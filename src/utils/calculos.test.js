import { describe, it, expect } from 'vitest';
import { getIrpfPct } from './calculos';

describe('getIrpfPct', () => {
  // Fecha fija: la antigüedad se mide contra esta referencia, no contra "hoy".
  const fechaReferencia = '2026-01-01T00:00:00.000Z';
  const masDeDosAnios = '2023-06-01'; // ~2.6 años antes de fechaReferencia
  const menosDeDosAnios = '2025-01-01'; // 1 año antes de fechaReferencia

  it('devuelve 0 para una empresa (EMPRESA)', () => {
    const colaborador = { tipo_fiscal: 'EMPRESA', fecha_alta: masDeDosAnios };
    expect(getIrpfPct(colaborador, fechaReferencia)).toBe(0);
  });

  it('devuelve 0 para un autónomo identificado por CIF de empresa', () => {
    const colaborador = { tipo_fiscal: 'AUTONOMO', fecha_alta: masDeDosAnios, cif_dni: 'B12345678' };
    expect(getIrpfPct(colaborador, fechaReferencia)).toBe(0);
  });

  it('devuelve 0 para un autónomo especial (AUTONOMO_ESPECIAL)', () => {
    const colaborador = { tipo_fiscal: 'AUTONOMO_ESPECIAL', fecha_alta: masDeDosAnios };
    expect(getIrpfPct(colaborador, fechaReferencia)).toBe(0);
  });

  it('devuelve 0 para un colaborador exento (EXENTO)', () => {
    const colaborador = { tipo_fiscal: 'EXENTO', fecha_alta: masDeDosAnios };
    expect(getIrpfPct(colaborador, fechaReferencia)).toBe(0);
  });

  it('devuelve 0.07 (7%) para un autónomo con menos de 2 años de antigüedad en la fecha de referencia', () => {
    const colaborador = { tipo_fiscal: 'AUTONOMO', fecha_alta: menosDeDosAnios, cif_dni: '12345678Z' };
    expect(getIrpfPct(colaborador, fechaReferencia)).toBe(0.07);
  });

  it('devuelve 0.15 (15%) para un autónomo con 2 o más años de antigüedad en la fecha de referencia', () => {
    const colaborador = { tipo_fiscal: 'AUTONOMO', fecha_alta: masDeDosAnios, cif_dni: '12345678Z' };
    expect(getIrpfPct(colaborador, fechaReferencia)).toBe(0.15);
  });

  it('devuelve 0 si no se especifica tipo_fiscal', () => {
    const colaborador = { fecha_alta: masDeDosAnios };
    expect(getIrpfPct(colaborador, fechaReferencia)).toBe(0);
  });

  it('congela el tramo a la fecha de referencia, no a "hoy": la misma alta da tramos distintos según cuándo se evalúe', () => {
    const colaborador = { tipo_fiscal: 'AUTONOMO', fecha_alta: '2024-01-01' };
    expect(getIrpfPct(colaborador, '2024-07-01')).toBe(0.07); // 6 meses de antigüedad en esa venta
    expect(getIrpfPct(colaborador, '2027-07-01')).toBe(0.15); // misma alta, evaluada 3 años después
  });
});
