/** @file Timer.js — live elapsed timer display */

import { h } from '../../utils/dom.js';

function fmt(s) {
  const m = Math.floor(s / 60).toString().padStart(2, '0');
  const ss = (s % 60).toString().padStart(2, '0');
  return `${m}:${ss}`;
}

/**
 * @returns {{ el: HTMLElement, setTime }}
 */
export function Timer() {
  const el = h('div', { class: 'timer', role: 'timer', 'aria-label': 'Elapsed time' }, '00:00');

  return {
    el,
    /** @param {number} seconds */
    setTime(seconds) {
      el.textContent = fmt(seconds);
    },
  };
}
