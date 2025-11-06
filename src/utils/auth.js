import { LS_USER, LS_AUTH } from './constants';

function simpleHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}

const DEFAULT_ADMIN = {
  id: "u_admin",
  nombre: "Administrador", 
  rol: "admin",
  pass_hash: simpleHash("admin123"),
};

export const authFunctions = {
  getUser: () => {
    try {
      return JSON.parse(localStorage.getItem(LS_USER)) || DEFAULT_ADMIN;
    } catch {
      return DEFAULT_ADMIN;
    }
  },
  setUser: (u) => localStorage.setItem(LS_USER, JSON.stringify(u)),
  isLogged: () => {
    try {
      const a = JSON.parse(localStorage.getItem(LS_AUTH));
      return !!a?.logged;
    } catch {
      return false;
    }
  },
  logout: () => {
    localStorage.removeItem(LS_AUTH);
    localStorage.removeItem(LS_USER);
  },
  loginWithPassword: (pass) => {
    const u = authFunctions.getUser();
    const ok = simpleHash(pass) === u.pass_hash;
    if (ok) {
      localStorage.setItem(LS_AUTH, JSON.stringify({ logged: true, at: Date.now() }));
    }
    return ok;
  },
  currentUser: () => authFunctions.getUser(),
};
