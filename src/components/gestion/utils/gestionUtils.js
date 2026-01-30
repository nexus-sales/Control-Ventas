import { FAMILIA_STYLES } from "../../../utils/constants";

// Limpieza de operadores - MÁS PERMISIVA
export const cleanOperadores = (operadores = []) => {
    if (!Array.isArray(operadores)) return [];

    const seen = new Set();
    return operadores.filter(op => {
        if (!op || typeof op !== 'object') return false;

        if (op.id) {
            if (seen.has(op.id)) return false;
            seen.add(op.id);
            return true;
        }

        if (op.nombre && op.nombre.trim()) {
            return true;
        }

        return false;
    });
};

// Limpieza de productos - MEJORADA
export const cleanProductosRobust = (productos = [], operadores = []) => {
    if (!Array.isArray(productos)) return [];
    if (!Array.isArray(operadores)) return [];

    const operadorIds = new Set(operadores.map(o => o.id).filter(Boolean));
    const seen = new Set();

    return productos.filter(prod => {
        if (!prod || typeof prod !== 'object') return false;
        if (!prod.nombre || !prod.nombre.trim()) return false;

        if (prod.operador_id && !operadorIds.has(prod.operador_id)) {
            return false;
        }

        if (prod.id) {
            if (seen.has(prod.id)) {
                return false;
            }
            seen.add(prod.id);
        }

        return true;
    });
};

// Normalización de texto para búsquedas
export const normalizeText = (text) => text?.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim() || "";

// Utilidad para sumar un día a una fecha ISO
export const sumarDia = (iso) => {
    if (!iso) return "";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "";
    d.setDate(d.getDate() + 1);
    return d.toISOString().slice(0, 10);
};

// Obtener configuración visual de familia
export const getFamiliaConfig = (familia = "") => {
    if (!familia) return FAMILIA_STYLES.default;

    const famKey = Object.keys(FAMILIA_STYLES).find(key =>
        familia.toLowerCase().includes(key.toLowerCase())
    );

    return FAMILIA_STYLES[famKey] || FAMILIA_STYLES.default;
};
