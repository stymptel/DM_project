/** @file Shake.js — shake animation utility */

/**
 * Apply a shake animation to an element.
 * @param {HTMLElement} el
 */
export function shake(el) {
  el.classList.remove('shake');
  void el.offsetWidth; // reflow to reset animation
  el.classList.add('shake');
  el.addEventListener('animationend', () => el.classList.remove('shake'), { once: true });
}
