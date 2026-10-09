/** @file ClueCard.js — renders a single clue with English + symbols */

import { h } from '../../utils/dom.js';

/**
 * @param {import('../../core/Clue.js').Clue} clue
 * @param {Function} onClick  (clue) => void
 * @returns {{ el: HTMLElement, setState }}
 */
export function ClueCard(clue, onClick = () => {}) {
  const englishEl = h('div', { class: 'clue-english' }, clue.toEnglish());
  const symbolicEl = h('div', { class: 'clue-symbolic' }, clue.toSymbols());
  const statusEl = h('span', { class: 'clue-status' }, '');

  const el = h('div', {
    class: 'clue-card',
    'aria-label': `Clue: ${clue.toEnglish()}`,
    tabindex: '0',
  },
    h('div', { class: 'clue-header', style: 'display:flex;justify-content:space-between;align-items:flex-start;' },
      h('div', {},
        englishEl,
        symbolicEl,
      ),
      statusEl,
    )
  );

  el.addEventListener('click', () => onClick(clue));
  el.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onClick(clue); }
    if (event.key === 'Escape') onClick({ ...clue, id: null });
  });

  return {
    el,
    /** @param {'satisfied'|'violated'|'active'|'default'} state */
    setState(state) {
      el.className = `clue-card${state !== 'default' ? ` ${state}` : ''}`;
      statusEl.textContent = state === 'satisfied' ? '✓' : state === 'violated' ? '✗' : '';
      statusEl.className = `clue-status${state === 'satisfied' ? ' clue-satisfied-icon' : ''}`;
    },
    setPinned(pinned) { el.classList.toggle('pinned-clue', pinned); },
  };
}
