/** @file HintPanel.js — shows hint explanation with animated text */

import { h } from '../../utils/dom.js';

/**
 * @returns {{ el: HTMLElement, showHint, hide }}
 */
export function HintPanel() {
  const textEl = h('p', { class: 'hint-text' }, '');
  const liveEl = h('span', { class: 'visually-hidden', 'aria-live': 'polite' }, '');
  const el = h('div', { class: 'hint-panel', role: 'status', style: 'display:none;' },
    h('div', { style: 'display:flex;align-items:center;gap:8px;margin-bottom:8px;' },
      h('span', {}, '💡'),
      h('strong', {}, 'Hint'),
    ),
    h('span', { class: 'feedback-title' }, ''), textEl, liveEl,
  );

  let _timeout;
  let _timer = null;

  return {
    el,
    showHint(text, autohide = 6000, title = 'Hint') {
      clearTimeout(_timeout);
      clearInterval(_timer);
      el.style.display = '';
      el.querySelector('.feedback-title').textContent = title;
      liveEl.textContent = text;
      textEl.textContent = '';
      if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
        textEl.textContent = text;
      } else {
      let i = 0;
      _timer = setInterval(() => {
        textEl.textContent = text.slice(0, ++i);
        if (i >= text.length) clearInterval(_timer);
      }, 18);
      }

      if (autohide) {
        _timeout = setTimeout(() => { el.style.display = 'none'; }, autohide);
      }
    },
    hide() {
      clearTimeout(_timeout);
      clearInterval(_timer);
      el.style.display = 'none';
    },
  };
}
