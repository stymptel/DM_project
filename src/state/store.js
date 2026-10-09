/** @file store.js — tiny pub/sub store; no framework needed */

const _listeners = new Map(); // key → Set<fn>
const _state = {};

export const store = {
  /** Get current value of a key */
  get(key) { return _state[key]; },

  /** Set and notify */
  set(key, value) {
    _state[key] = value;
    (_listeners.get(key) || new Set()).forEach((fn) => fn(value));
  },

  /** Subscribe to changes */
  on(key, fn) {
    if (!_listeners.has(key)) _listeners.set(key, new Set());
    _listeners.get(key).add(fn);
    return () => _listeners.get(key).delete(fn); // returns unsub
  },
};
