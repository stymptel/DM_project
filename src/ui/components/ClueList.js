/** @file ClueList.js — renders clue cards with click-to-pin highlighting */

import { h } from '../../utils/dom.js';
import { ClueCard } from './ClueCard.js';

/**
 * @param {import('../../core/Clue.js').Clue[]} clues
 * @param {Function} onCellHighlight (cellIds: string[]) => void
 * @returns {{ el: HTMLElement, updateStates }}
 */
export function ClueList(clues, onCellHighlight = () => {}) {
  const el = h('div', { class: 'clue-panel', role: 'list', 'aria-label': 'Clues' },
    h('h3', {}, `Clues (${clues.length})`),
  );

  let pinnedId = null;
  const cards = clues.map((clue) => {
    const card = ClueCard(clue, (c) => {
      pinnedId = pinnedId === c.id ? null : c.id;
      cards.forEach(({ clue: item, card: itemCard }) => itemCard.setPinned(item.id === pinnedId));
      onCellHighlight(pinnedId ? c.involvedCells() : []);
    });
    card.el.setAttribute('role', 'listitem');
    el.appendChild(card.el);
    return { clue, card };
  });

  return {
    el,
    cardEls: cards.map(({ card }) => card.el),
    /**
     * Update visual state of all clue cards based on evaluation results.
     * @param {Map<string, boolean|'undetermined'>} results
     */
    updateStates(results) {
      cards.forEach(({ clue, card }) => {
        const r = results.get(clue.id);
        if (r === true) card.setState('satisfied');
        else if (r === false) card.setState('violated');
        else card.setState('default');
      });
    },
    clearPin() {
      pinnedId = null;
      cards.forEach(({ card }) => card.setPinned(false));
      onCellHighlight([]);
    },
    /**
     * Activate cards related to given cell IDs.
     * @param {string[]} cellIds
     */
    activateForCells(cellIds) {
      cards.forEach(({ clue, card }) => {
        const involved = clue.cells.some((id) => cellIds.includes(id));
        card.setState(involved ? 'active' : 'default');
      });
    },
  };
}
