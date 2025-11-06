// src/data/customFieldsModel.js
// Modelo de campo personalizado para la app

/**
 * @typedef {Object} CustomField
 * @property {string} id - UUID único
 * @property {string} nombre - Nombre del campo
 * @property {string} tipo - Tipo de campo ('texto', 'número', 'fecha', 'select', etc.)
 * @property {string} modulo - Módulo asociado ('ventas', 'productos', etc.)
 * @property {Array<string>} [opciones] - Opciones si el tipo es 'select' o similar
 * @property {boolean} requerido - Si el campo es obligatorio
 * @property {number} orden - Orden de aparición
 * @property {boolean} activo - Si el campo está activo
 * @property {string} creado_en - Fecha de creación (ISO)
 * @property {string} actualizado_en - Fecha de actualización (ISO)
 */

/**
 * Ejemplo de campo personalizado
 */
export const ejemploCampoPersonalizado = {
  id: 'uuid-1234',
  nombre: 'Referencia externa',
  tipo: 'texto',
  modulo: 'ventas',
  opciones: [],
  requerido: false,
  orden: 1,
  activo: true,
  creado_en: new Date().toISOString(),
  actualizado_en: new Date().toISOString(),
};

/**
 * Función para crear un campo personalizado
 */
export function crearCampoPersonalizado({ nombre, tipo, modulo, opciones = [], requerido = false, orden = 0, activo = true }) {
  return {
    id: crypto.randomUUID(),
    nombre,
    tipo,
    modulo,
    opciones,
    requerido,
    orden,
    activo,
    creado_en: new Date().toISOString(),
    actualizado_en: new Date().toISOString(),
  };
}
