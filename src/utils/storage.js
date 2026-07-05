// src/utils/storage.js

/**
 * Obtiene un valor de localStorage con valor por defecto
 * @param {string} key - Clave del localStorage
 * @param {*} defaultValue - Valor por defecto si no existe
 * @returns {*} Valor parseado o defaultValue
 */
export const getFromStorage = (key, defaultValue = null) => {
  try {
    const item = localStorage.getItem(key);
    if (item === null) return defaultValue;
    return JSON.parse(item);
  } catch (error) {
    console.warn(`Error al leer ${key} de localStorage:`, error);
    return defaultValue;
  }
};

/**
 * Guarda un valor en localStorage
 * @param {string} key - Clave del localStorage
 * @param {*} value - Valor a guardar (será stringify)
 * @returns {boolean} true si se guardó correctamente
 */
export const saveToStorage = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error(`Error al guardar ${key} en localStorage:`, error);
    return false;
  }
};

