/** @file storage.js — localStorage wrapper with try/catch */

const PREFIX = 'lm_';

export const storage = {
  /** @param {string} key @param {any} value */
  set(key, value) {
    try { localStorage.setItem(PREFIX + key, JSON.stringify(value)); } catch (_) {}
  },
  /** @param {string} key @param {any} [fallback] */
  get(key, fallback = null) {
    try {
      const raw = localStorage.getItem(PREFIX + key);
      return raw !== null ? JSON.parse(raw) : fallback;
    } catch (_) { return fallback; }
  },
  remove(key) {
    try { localStorage.removeItem(PREFIX + key); } catch (_) {}
  },
  clear() {
    try {
      Object.keys(localStorage)
        .filter((k) => k.startsWith(PREFIX))
        .forEach((k) => localStorage.removeItem(k));
    } catch (_) {}
  },
};
