// Persistencia sencilla en localStorage

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

export function loadLS(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (e) {
    console.warn("loadLS error", key, e);
    return fallback;
  }
}

export function saveLS(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.warn("saveLS error", key, e);
  }
}
