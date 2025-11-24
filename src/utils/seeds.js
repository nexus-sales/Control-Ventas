import { loadLS, saveLS, LS_KEYS } from './storage';

const SEED_VERSION = 3;

const seedNiveles = [
  { id: "BASIC", nombre: "BASIC", pct_colaborador_default: 0.06, porcentaje: 0.06, comision_tipo: "porcentaje", comision_valor: 0.06, tipo: "COMERCIAL" },
  { id: "PRO", nombre: "PRO", pct_colaborador_default: 0.08, porcentaje: 0.08, comision_tipo: "porcentaje", comision_valor: 0.08, tipo: "COMERCIAL" },
  { id: "PREMIUM", nombre: "PREMIUM", pct_colaborador_default: 0.10, porcentaje: 0.10, comision_tipo: "porcentaje", comision_valor: 0.10, tipo: "SUPERVISOR" },
  { id: "MASTER", nombre: "MASTER", pct_colaborador_default: 0.12, porcentaje: 0.12, comision_tipo: "porcentaje", comision_valor: 0.12, tipo: "MANAGER" },
];

const seedColaboradores = [
  { 
    id: "u-1", 
    nombre: "Salvador Muñoz", 
    nivelId: "MASTER", 
    nivel: "MASTER",
    rol: "admin",
    email: "salvador@empresa.com",
    telefono: "600000000",
    fecha_alta: "2024-01-01",
    tipo_fiscal: "AUTONOMO"
  },
];

const seedOperadores = [
  { id: "op-1", nombre: "Operador Telco A", sector: "telefonia", codigo: "TELCO_A" },
  { id: "op-2", nombre: "Energía X", sector: "energia", codigo: "ENERG_X" },
  { id: "op-3", nombre: "Segurma", sector: "alarmas", codigo: "SEGUR_M" },
];

const seedProductos = [
  { 
    id: "p-1", 
    operadorId: "op-1", 
    operador_id: "op-1",
    nombre: "Fibra 1Gb", 
    base: 30,
    pvp: 60,
    comision_tipo: "porcentaje",
    comision_valor: 0.1
  },
  { 
    id: "p-2", 
    operadorId: "op-2", 
    operador_id: "op-2",
    nombre: "Tarifa Luz PYME", 
    base: 25,
    pvp: 50,
    comision_tipo: "fijo",
    comision_valor: 25
  },
  { 
    id: "p-3", 
    operadorId: "op-3", 
    operador_id: "op-3",
    nombre: "Kit Alarma Hogar", 
    base: 36.4,
    pvp: 72.8,
    comision_tipo: "porcentaje",
    comision_valor: 0.08
  },
];

const seedZonas = [
  { id: "z-peninsula", nombre: "Península", iva: 0.21, irpf: 0.07, impuesto_tipo: "IVA", impuesto_pct: 0.21 },
  { id: "z-canarias", nombre: "Canarias", igic: 0.07, irpf: 0.07, impuesto_tipo: "IGIC", impuesto_pct: 0.07 },
];

const seedReglas = [
  { id: "r-1", productoId: "p-1", producto_id: "p-1", nivelId: "MASTER", nivel: "MASTER", comision: 60, operador_id: "op-1", tipo: "%", valor: 0.1, pct_sobre: "Base", prioridad: 10 },
  { id: "r-2", productoId: "p-3", producto_id: "p-3", nivelId: "MASTER", nivel: "MASTER", comision: 90, operador_id: "op-3", tipo: "%", valor: 0.08, pct_sobre: "Base", prioridad: 10 },
];

const seedVentas = [
  {
    id: "v-1",
    fecha: "2024-09-15",
    cliente: "Empresa ABC S.L.",
    colaborador_id: "u-1",
    colaboradorId: "u-1",
    producto_id: "p-1",
    productoId: "p-1",
    zona_id: "z-peninsula",
    zonaId: "z-peninsula",
    pvp: 60,
    cantidad: 1,
    estado: "Confirmada",
    comision: 45.6,
    mes: 9,
    año: 2024
  }
];

export function runSeedIfNeeded() {
  const current = loadLS(LS_KEYS.seedVersion, 0);
  if (current >= SEED_VERSION) return;

  // LOG ELIMINADO

  if (!loadLS(LS_KEYS.niveles, null) || loadLS(LS_KEYS.niveles, []).length === 0) {
    saveLS(LS_KEYS.niveles, seedNiveles);
  }
  if (!loadLS(LS_KEYS.colaboradores, null) || loadLS(LS_KEYS.colaboradores, []).length === 0) {
    saveLS(LS_KEYS.colaboradores, seedColaboradores);
  }
  if (!loadLS(LS_KEYS.operadores, null) || loadLS(LS_KEYS.operadores, []).length === 0) {
    saveLS(LS_KEYS.operadores, seedOperadores);
  }
  if (!loadLS(LS_KEYS.productos, null) || loadLS(LS_KEYS.productos, []).length === 0) {
    saveLS(LS_KEYS.productos, seedProductos);
  }
  if (!loadLS(LS_KEYS.zonas, null) || loadLS(LS_KEYS.zonas, []).length === 0) {
    saveLS(LS_KEYS.zonas, seedZonas);
  }
  if (!loadLS(LS_KEYS.reglas, null) || loadLS(LS_KEYS.reglas, []).length === 0) {
    saveLS(LS_KEYS.reglas, seedReglas);
  }
  if (!loadLS(LS_KEYS.ventas, null) || loadLS(LS_KEYS.ventas, []).length === 0) {
    saveLS(LS_KEYS.ventas, seedVentas);
  }

  saveLS(LS_KEYS.seedVersion, SEED_VERSION);
  // LOG ELIMINADO
}
