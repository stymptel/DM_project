/** @file dom.js — minimal element factory + event helpers */

/**
 * Create a DOM element with optional attrs, classes, children.
 * @param {string} tag
 * @param {Object} [attrs]
 * @param {...(Node|string)} children
 * @returns {HTMLElement}
 */
export function h(tag, attrs = {}, ...children) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'class') {
      el.className = v;
    } else if (k.startsWith('on')) {
      el.addEventListener(k.slice(2).toLowerCase(), v);
    } else if (k === 'data') {
      Object.entries(v).forEach(([dk, dv]) => el.dataset[dk] = dv);
    } else {
      el.setAttribute(k, v);
    }
  }
  for (const child of children) {
    el.append(typeof child === 'string' ? document.createTextNode(child) : child);
  }
  return el;
}

/**
 * Shorthand: clear and re-render element children.
 * @param {HTMLElement} el
 * @param {...(Node|string)} children
 */
export function render(el, ...children) {
  el.replaceChildren(...children.map((c) =>
    typeof c === 'string' ? document.createTextNode(c) : c
  ));
}

/**
 * Add and automatically-removing event listener.
 * @param {EventTarget} target
 * @param {string} event
 * @param {Function} handler
 * @param {Object} [opts]
 * @returns {Function} remove listener
 */
export function on(target, event, handler, opts) {
  target.addEventListener(event, handler, opts);
  return () => target.removeEventListener(event, handler, opts);
}
