import { describe, it, expect } from 'vitest';
import { getIrpfPercentage } from './calculos';

describe('getIrpfPercentage', () => {
  const threeYearsAgo = new Date();
  threeYearsAgo.setFullYear(threeYearsAgo.getFullYear() - 3);
  const threeYearsAgoISO = threeYearsAgo.toISOString();

  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
  const oneYearAgoISO = oneYearAgo.toISOString();

  it('should return 0 for a company (EMPRESA)', () => {
    const colaborador = {
      tipo_fiscal: 'EMPRESA',
      fecha_alta: threeYearsAgoISO,
    };
    expect(getIrpfPercentage(colaborador)).toBe(0);
  });

  it('should return 0 for a company identified by CIF', () => {
    const colaborador = {
      tipo_fiscal: 'AUTONOMO',
      fecha_alta: threeYearsAgoISO,
      cif_dni: 'B12345678',
    };
    expect(getIrpfPercentage(colaborador)).toBe(0);
  });

  it('should return 0 for a special autonomous worker (AUTONOMO_ESPECIAL)', () => {
    const colaborador = {
      tipo_fiscal: 'AUTONOMO_ESPECIAL',
      fecha_alta: threeYearsAgoISO,
    };
    expect(getIrpfPercentage(colaborador)).toBe(0);
  });

  it('should return 0.07 (7%) for an autonomous worker with less than 2 years of activity', () => {
    const colaborador = {
      tipo_fiscal: 'AUTONOMO',
      fecha_alta: oneYearAgoISO,
      cif_dni: '12345678Z',
    };
    expect(getIrpfPercentage(colaborador)).toBe(0.07);
  });

  it('should return 0.15 (15%) for an autonomous worker with 2 or more years of activity', () => {
    const colaborador = {
      tipo_fiscal: 'AUTONOMO',
      fecha_alta: threeYearsAgoISO,
      cif_dni: '12345678Z',
    };
    expect(getIrpfPercentage(colaborador)).toBe(0.15);
  });

  it('should return 0 if tipo_fiscal is not specified', () => {
    const colaborador = {
      fecha_alta: threeYearsAgoISO,
    };
    expect(getIrpfPercentage(colaborador)).toBe(0);
  });
});
