import { LS_KEYS, SEED_VERSION } from '../utils/constants';
import { loadLS, saveLS } from '../utils/storage';

export const seedNiveles = [
  { 
    id: "BASIC", 
    nombre: "BASIC", 
    pct_colaborador_default: 0.50, 
    porcentaje: 0.50, 
    comision_tipo: "porcentaje", 
    comision_valor: 0.50, 
    tipo: "COMERCIAL",
    pct_telefonia: 0.50,
    pct_energia: 0.50,
    fijo_seguridad: 225
  },
  { 
    id: "PRO", 
    nombre: "PRO", 
    pct_colaborador_default: 0.90, 
    porcentaje: 0.90, 
    comision_tipo: "porcentaje", 
    comision_valor: 0.90, 
    tipo: "COMERCIAL",
    pct_telefonia: 0.90,
    pct_energia: 0.80,
    fijo_seguridad: 300
  },
  { 
    id: "PREMIUM", 
    nombre: "PREMIUM", 
    pct_colaborador_default: 0.80, 
    porcentaje: 0.80, 
    comision_tipo: "porcentaje", 
    comision_valor: 0.80, 
    tipo: "SUPERVISOR",
    pct_telefonia: 0.80,
    pct_energia: 0.80,
    fijo_seguridad: 300
  },
  { 
    id: "MASTER", 
    nombre: "MASTER", 
    pct_colaborador_default: 0.75, 
    porcentaje: 0.75, 
    comision_tipo: "porcentaje", 
    comision_valor: 0.75, 
    tipo: "MANAGER",
    pct_telefonia: 0.75,
    pct_energia: 0.75,
    fijo_seguridad: 250
  },
  { 
    id: "GOLD", 
    nombre: "GOLD", 
    pct_colaborador_default: 0.60, 
    porcentaje: 0.60, 
    comision_tipo: "porcentaje", 
    comision_valor: 0.60, 
    tipo: "COMERCIAL",
    pct_telefonia: 0.60,
    pct_energia: 0.60,
    fijo_seguridad: 250
  },
  { 
    id: "BASE", 
    nombre: "BASE", 
    pct_colaborador_default: 0.50, 
    porcentaje: 0.50, 
    comision_tipo: "porcentaje", 
    comision_valor: 0.50, 
    tipo: "COMERCIAL",
    pct_telefonia: 0.50,
    pct_energia: 0.50,
    fijo_seguridad: 225
  },
];

export const seedColaboradores = [
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

export const seedOperadores = [
  { id: "op-1", nombre: "Vodafone", sector: "TELEFONIA", codigo: "VODAFONE", contacto: "comercial@vodafone.es", telefono: "900123456" },
  { id: "op-2", nombre: "Movistar", sector: "TELEFONIA", codigo: "MOVISTAR", contacto: "comercial@movistar.es", telefono: "900234567" },
  { id: "op-3", nombre: "Orange", sector: "TELEFONIA", codigo: "ORANGE", contacto: "comercial@orange.es", telefono: "900345678" },
  { id: "op-4", nombre: "Endesa", sector: "ENERGIA", codigo: "ENDESA", contacto: "comercial@endesa.com", telefono: "900456789" },
  { id: "op-5", nombre: "Iberdrola", sector: "ENERGIA", codigo: "IBERDROLA", contacto: "comercial@iberdrola.es", telefono: "900567890" },
  { id: "op-6", nombre: "Naturgy", sector: "ENERGIA", codigo: "NATURGY", contacto: "comercial@naturgy.com", telefono: "900678901" },
  { id: "op-7", nombre: "Securitas Direct", sector: "SEGURIDAD", codigo: "SECURITAS", contacto: "comercial@securitasdirect.es", telefono: "900789012" },
  { id: "op-8", nombre: "Prosegur", sector: "SEGURIDAD", codigo: "PROSEGUR", contacto: "comercial@prosegur.com", telefono: "900890123" },
  { id: "op-9", nombre: "ADT", sector: "SEGURIDAD", codigo: "ADT", contacto: "comercial@adt.es", telefono: "900901234" },
];

export const seedProductos = [
  { 
    id: "p-1", 
    operador_id: "op-1",
    nombre: "Fibra 1Gb Vodafone", 
    sector: "TELEFONIA",
    familia: "Only Fibra",
    base: 35,
    pvp: 65,
    comision_tipo: "porcentaje",
    comision_valor: 0.12
  },
  { 
    id: "p-2", 
    operador_id: "op-2",
    nombre: "Fibra 600Mb + Móvil Movistar", 
    sector: "TELEFONIA",
    familia: "Convergente",
    base: 40,
    pvp: 70,
    comision_tipo: "porcentaje",
    comision_valor: 0.10
  },
];

export const seedZonas = [
  { 
    id: "z-peninsula", 
    nombre: "Península", 
    codigo: "PEN",
    iva: 0.21, 
    irpf: 0.07, 
    impuesto_tipo: "IVA", 
    impuesto_pct: 0.21 
  },
  { 
    id: "z-canarias", 
    nombre: "Canarias", 
    codigo: "CAN",
    igic: 0.07, 
    irpf: 0.07, 
    impuesto_tipo: "IGIC", 
    impuesto_pct: 0.07 
  },
  { 
    id: "z-baleares", 
    nombre: "Baleares", 
    codigo: "BAL",
    iva: 0.21, 
    irpf: 0.07, 
    impuesto_tipo: "IVA", 
    impuesto_pct: 0.21 
  },
];

export const seedReglas = [];
export const seedVentas = [];
export const seedLiquidaciones = [];

export function runSeedIfNeeded() {
  const current = loadLS(LS_KEYS.seedVersion, 0);
  if (current >= SEED_VERSION) return;

  const seedMap = {
    [LS_KEYS.niveles]: seedNiveles,
    [LS_KEYS.colaboradores]: seedColaboradores,
    [LS_KEYS.operadores]: seedOperadores,
    [LS_KEYS.productos]: seedProductos,
    [LS_KEYS.zonas]: seedZonas,
    [LS_KEYS.reglas]: seedReglas,
    [LS_KEYS.ventas]: seedVentas,
    [LS_KEYS.liquidaciones]: seedLiquidaciones,
  };

  Object.entries(seedMap).forEach(([key, seedData]) => {
    const existingData = loadLS(key, []);
    // Para niveles, siempre actualizar para obtener las nuevas propiedades
    if (key === LS_KEYS.niveles || !existingData || existingData.length === 0) {
      // LOG ELIMINADO
      saveLS(key, seedData);
    } else {
      // LOG ELIMINADO
    }
  });

  saveLS(LS_KEYS.seedVersion, SEED_VERSION);
}
