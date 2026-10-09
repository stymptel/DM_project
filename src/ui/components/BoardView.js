/** @file BoardView.js — renders the full grid of cells */

import { h } from '../../utils/dom.js';
import { CellView, updateCellView, highlightCells } from './CellView.js';

/**
 * @param {import('../../core/Board.js').Board} board
 * @param {Function} onCellClick (cell, e) => void
 * @returns {{ el: HTMLElement, update, highlight }}
 */
export function BoardView(board, onCellClick) {
  const { rows, cols, cells } = board;

  const el = h('div', {
    class: 'board',
    role: 'grid',
    'aria-label': 'Game board',
    style: `--n:${cols};grid-template-columns: repeat(${cols}, 1fr);grid-template-rows: repeat(${rows}, 1fr);`,
  });

  // Build cells with stagger
  const cellEls = new Map();
  cells.forEach((cell, i) => {
    const cellEl = CellView(cell, onCellClick);
    cellEl.style.animationDelay = `${i * 20}ms`;
    cellEl.classList.add('wave-reveal');
    cellEls.set(cell.id, cellEl);
    el.appendChild(cellEl);
  });

  return {
    el,
    /** Update a single cell's visual state */
    update(cell) {
      const cellEl = cellEls.get(cell.id);
      if (cellEl) updateCellView(cellEl, cell);
    },
    /** Highlight given cell IDs */
    highlight(ids) {
      highlightCells([...cellEls.values()], ids);
    },
    /** Get all cell elements */
    cellEls,
  };
}
