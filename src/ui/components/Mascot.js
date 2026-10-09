/** @file Mascot.js — reaction-only helper character */

import { h } from '../../utils/dom.js';

const REACTIONS = {
  idle:      '🤖',
  happy:     '🥳',
  thinking:  '🤔',
  oops:      '😬',
  celebrate: '🎉',
};


/**
 * @returns {{ el: HTMLElement, say, react }}
 */
export function Mascot() {
  const avatarEl = h('div', { class: 'mascot-avatar', 'aria-hidden': 'true' }, REACTIONS.idle);
  const el = h('span', { class: 'mascot-wrap', role: 'img', 'aria-label': 'Helper' }, avatarEl);

  return {
    el,
    /**
     * Show a message in the speech bubble.
     * @param {string} text
     * @param {number} [duration] ms before hiding (0 = don't hide)
     */
    /**
     * @param {'idle'|'happy'|'thinking'|'oops'|'celebrate'} state
     */
    react(state) {
      avatarEl.textContent = REACTIONS[state] || REACTIONS.idle;
    },
  };
}
