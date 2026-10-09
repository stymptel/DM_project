/** @file Modal.js — accessible modal dialog */

import { h } from '../../utils/dom.js';
import { trapFocus } from '../../utils/a11y.js';

/**
 * Create and show a modal.
 * @param {{ title: string, body: HTMLElement|string, buttons: Array<{text, onClick, primary}> }} opts
 * @returns {{ close: Function }}
 */
export function Modal({ title, body, buttons = [] }) {
  let releaseTrap;

  const btnEls = buttons.map(({ text, onClick, primary }) =>
    h('button', {
      class: `btn ${primary ? 'btn-primary' : 'btn-secondary'}`,
      onClick: () => { onClick?.(); close(); },
    }, text)
  );

  const modal = h('div', { class: 'modal', role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'modal-title' },
    h('h2', { id: 'modal-title' }, title),
    typeof body === 'string' ? h('p', { style: 'margin-bottom:16px;color:var(--clr-text-dim);' }, body) : body,
    h('div', { style: 'display:flex;gap:12px;justify-content:flex-end;margin-top:16px;flex-wrap:wrap;' }, ...btnEls),
  );

  const backdrop = h('div', { class: 'modal-backdrop' }, modal);
  backdrop.addEventListener('click', (e) => { if (e.target === backdrop) close(); });

  document.body.appendChild(backdrop);
  releaseTrap = trapFocus(modal);

  // Close on Escape
  function onKey(e) { if (e.key === 'Escape') close(); }
  document.addEventListener('keydown', onKey);

  function close() {
    releaseTrap?.();
    document.removeEventListener('keydown', onKey);
    backdrop.remove();
  }

  return { close };
}
