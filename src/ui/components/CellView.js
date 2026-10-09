/** @file CellView.js — renders a single cell, emits click events */

import { h } from '../../utils/dom.js';

/**
 * Create a cell DOM element.
 * @param {import('../../core/Cell.js').Cell} cell
 * @param {Function} onClick  (cell, e) => void
 * @returns {HTMLElement}
 */
export function CellView(cell, onClick) {
  const icon = () => {
    if (cell.state === 'mine') return '🐛'; // Glitch Bug theme
    if (cell.state === 'safe') return '✓';
    return '';
  };

  const el = h('button', {
    class: `cell state-${cell.state}${cell.locked ? ' locked' : ''}`,
    'aria-label': `Cell ${cell.id}, ${cell.state}`,
    'aria-pressed': cell.state !== 'unknown' ? 'true' : 'false',
    data: { id: cell.id },
    role: 'gridcell',
    onClick: (e) => onClick(cell, e),
  },
    h('span', { class: 'cell-id' }, cell.id),
    h('span', { class: 'cell-icon' }, icon())
  );

  return el;
}

/**
 * Update an existing cell element to match new state.
 * @param {HTMLElement} el
 * @param {import('../../core/Cell.js').Cell} cell
 */
export function updateCellView(el, cell) {
  el.className = `cell state-${cell.state}${cell.locked ? ' locked' : ''}`;
  el.setAttribute('aria-label', `Cell ${cell.id}, ${cell.state}`);
  el.querySelector('.cell-icon').textContent =
    cell.state === 'mine' ? '🐛' :
    cell.state === 'safe' ? '✓' : '';

  // Trigger ripple
  const ripple = document.createElement('div');
  ripple.className = 'cell-ripple';
  el.appendChild(ripple);
  ripple.addEventListener('animationend', () => ripple.remove(), { once: true });
}

/**
 * Highlight cells involved in a clue.
 * @param {NodeList|HTMLElement[]} cellEls
 * @param {string[]} cellIds
 */
export function highlightCells(cellEls, cellIds) {
  cellEls.forEach((el) => {
    const id = el.dataset.id;
    el.classList.toggle('highlighted', cellIds.includes(id));
  });
}
