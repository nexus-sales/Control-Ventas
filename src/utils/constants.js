export const LS_KEYS = {
  ventas: "appcv_ventas",
  colaboradores: "appcv_colaboradores",
  niveles: "appcv_niveles",
  operadores: "appcv_operadores",
  productos: "appcv_productos",
  zonas: "appcv_zonas",
  reglas: "appcv_reglas",
  liquidaciones: "appcv_liquidaciones",
  currentUser: "appcv_current_user",
  ui: "appcv_ui",
  seedVersion: "appcv_seed_version",
  lastSync: "appcv_last_sync",
};

export const SEED_VERSION = 8;
export const LS_USER = "appcv.user";
export const LS_AUTH = "appcv.auth";

// Sectores y familias de productos
export const SECTORES = {
  TELEFONIA: "Telefonía",
  SEGURIDAD: "Seguridad", 
  ENERGIA: "Energía"
};

export const FAMILIAS_POR_SECTOR = {
  TELEFONIA: [
    "Convergente",
    "Only Fibra", 
    "Only Móvil",
    "Línea Adicional",
    "Terminal",
    "PBX IP",
    "Extensiones IP"
  ],
  SEGURIDAD: [
    "Alarma Básica",
    "Alarma Premium",
    "Videovigilancia",
    "Control Accesos"
  ],
  ENERGIA: [
    "Solo Luz",
    "Solo Gas", 
    "Luz + Gas",
    "Tarifa PYME",
    "Tarifa Empresa"
  ]
};
