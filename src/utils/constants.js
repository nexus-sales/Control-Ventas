export const LS_KEYS = {
  ventas: "appcv_ventas",
  colaboradores: "appcv_colaboradores",
  niveles: "appcv_niveles",
  operadores: "appcv_operadores",
  productos: "cv_productos_v3",
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
    "Fibra",
    "Convergente",
    "Móvil",
    "PBX",
    "Línea Adicional",
    "Terminal",
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

// Estilos visuales por familia (Iconos y Colores)
export const FAMILIA_STYLES = {
  "Fibra": { icon: "Wifi", color: "blue" },
  "Convergente": { icon: "Zap", color: "purple" },
  "Móvil": { icon: "Smartphone", color: "green" },
  "PBX": { icon: "PhoneCall", color: "indigo" },
  "Alarma": { icon: "Shield", color: "red" },
  "Luz": { icon: "Lightbulb", color: "yellow" },
  "Gas": { icon: "Flame", color: "orange" },
  "default": { icon: "Package", color: "slate" }
};

// Clave de seguridad para administración
export const CLAVE_GERENTE = "@LMB1828re"; // Cambia esta clave aquí
