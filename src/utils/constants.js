// Único uso real: LayoutShell.jsx guarda si el sidebar está colapsado. Las
// demás colecciones (ventas, colaboradores, niveles...) usan STORAGE_KEYS en
// AppContexts.jsx — tener una segunda copia aquí, sin uso, solo arriesgaba
// que alguien la editara pensando que era la fuente real y las dos
// terminaran desincronizadas.
export const LS_KEYS = {
  ui: "appcv_ui",
};

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

