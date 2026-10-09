/** @file HeartsBar.js — animated hearts display */

import { h } from '../../utils/dom.js';

/**
 * @param {number} max
 * @param {number} current
 * @returns {{ el: HTMLElement, setHearts }}
 */
export function HeartsBar(max, current) {
  const hearts = [];

  const el = h('div', { class: 'hearts-bar', 'aria-label': `${current} of ${max} hearts remaining`, role: 'status' });

  for (let i = 0; i < max; i++) {
    const heart = h('span', { class: `heart ${i < current ? 'full' : 'empty'}` }, '❤️');
    hearts.push(heart);
    el.appendChild(heart);
  }

  return {
    el,
    setHearts(n) {
      hearts.forEach((h, i) => {
        if (i < n) {
          h.className = 'heart full';
          h.textContent = '❤️';
        } else if (i === n) {
          h.className = 'heart broken';
          h.textContent = '💔';
          h.addEventListener('animationend', () => {
            h.className = 'heart empty';
            h.textContent = '🖤';
          }, { once: true });
        } else {
          h.className = 'heart empty';
          h.textContent = '🖤';
        }
      });
      el.setAttribute('aria-label', `${n} of ${max} hearts remaining`);
    },
  };
}
