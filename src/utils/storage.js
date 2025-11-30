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

/**
 * Elimina un valor de localStorage
 * @param {string} key - Clave a eliminar
 * @returns {boolean} true si se eliminó correctamente
 */
export const removeFromStorage = (key) => {
  try {
    localStorage.removeItem(key);
    return true;
  } catch (error) {
    console.error(`Error al eliminar ${key} de localStorage:`, error);
    return false;
  }
};

/**
 * Limpia todo el localStorage
 * @returns {boolean} true si se limpió correctamente
 */
export const clearStorage = () => {
  try {
    localStorage.clear();
    return true;
  } catch (error) {
    console.error('Error al limpiar localStorage:', error);
    return false;
  }
};

/**
 * Obtiene todas las claves de localStorage
 * @returns {string[]} Array de claves
 */
export const getAllKeys = () => {
  try {
    return Object.keys(localStorage);
  } catch (error) {
    console.error('Error al obtener claves de localStorage:', error);
    return [];
  }
};

/**
 * Verifica si una clave existe en localStorage
 * @param {string} key - Clave a verificar
 * @returns {boolean} true si existe
 */
export const hasKey = (key) => {
  try {
    return localStorage.getItem(key) !== null;
  } catch (error) {
    console.error(`Error al verificar clave ${key}:`, error);
    return false;
  }
};