import { describe, it, expect } from 'vitest';
import { MAPEO_CAMPOS, validateRow } from './importValidation';

describe('MAPEO_CAMPOS.pvp — no debe confundirse con una columna de importe/comisión', () => {
  it('no incluye "importe_base" (alias que causaba que la columna IMPORTE se mapeara como PVP)', () => {
    expect(MAPEO_CAMPOS.pvp).not.toContain('importe_base');
  });

  it('sigue reconociendo los alias de PVP genuinos', () => {
    expect(MAPEO_CAMPOS.pvp).toEqual(expect.arrayContaining(['PVP', 'pvp', 'precio', 'price']));
  });
});

describe('validateRow — PVP es obligatorio, sin sustituto ni valor por defecto', () => {
  const mapping = { fecha: 'FECHA', cliente: 'CLIENTE', colaborador_id: 'COLABORADOR', pvp: 'PVP' };

  it('fila con PVP real es válida', () => {
    const row = { FECHA: '2026-07-03', CLIENTE: 'Cliente Real', COLABORADOR: 'Juan', PVP: '29.9' };
    const resultado = validateRow(row, mapping, { modoAutomatico: true });
    expect(resultado.isValid).toBe(true);
  });

  it('fila sin PVP es inválida en modo automático (antes: solo un warning, se usaba 50€ por defecto)', () => {
    const row = { FECHA: '2026-07-03', CLIENTE: 'Cliente Real', COLABORADOR: 'Juan', PVP: '' };
    const resultado = validateRow(row, mapping, { modoAutomatico: true });
    expect(resultado.isValid).toBe(false);
    expect(resultado.errors).toContain('PVP es requerido (no se admite un valor por defecto ni se infiere de otra columna)');
  });

  it('fila sin PVP es inválida en modo manual también', () => {
    const row = { FECHA: '2026-07-03', CLIENTE: 'Cliente Real', COLABORADOR: 'Juan', PVP: '' };
    const indexers = { colaboradores: { byId: {}, byName: {} }, productos: { byId: {}, byName: {} }, zonas: { byId: {}, byName: {} } };
    const resultado = validateRow(row, mapping, { modoAutomatico: false, indexers });
    expect(resultado.isValid).toBe(false);
    expect(resultado.errors).toContain('PVP es requerido (no se admite un valor por defecto ni se infiere de otra columna)');
  });

  it('una columna "importe" en la fila no cuenta como sustituto de PVP', () => {
    const mappingConImporte = { ...mapping, importe: 'IMPORTE' };
    const row = { FECHA: '2026-07-03', CLIENTE: 'Cliente Real', COLABORADOR: 'Juan', PVP: '', IMPORTE: '66.5' };
    const resultado = validateRow(row, mappingConImporte, { modoAutomatico: true });
    expect(resultado.isValid).toBe(false);
  });
});
