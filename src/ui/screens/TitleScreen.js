/** @file TitleScreen.js — animated title screen */

import { h } from '../../utils/dom.js';
import { Sound } from '../../audio/Sound.js';
import { storage } from '../../state/storage.js';

const MATH_FACTS = [
  'With n cells there are 2ⁿ possible mine layouts!',
  'Logic puzzles like this are called Constraint Satisfaction Problems (CSP).',
  'XOR (⊕) is how computers add binary numbers!',
  'Boolean algebra was invented by George Boole in 1854.',
  'AND, OR, NOT are enough to build any logical statement.',
];

/**
 * @param {{ onPlay, onTutorial, onLogicLab, onDaily, onSettings }} callbacks
 * @returns {HTMLElement}
 */
export function TitleScreen({ onPlay, onTutorial, onLogicLab, onDaily, onSettings }) {
  const fact = MATH_FACTS[Math.floor(Math.random() * MATH_FACTS.length)];

  // Floating bugs in background
  const bugsEl = h('div', { class: 'floating-bugs', 'aria-hidden': 'true' });
  const emojis = ['🐛', '⚡', '💎', '🔮', '🌟', '⚙️'];
  for (let i = 0; i < 12; i++) {
    const bug = h('span', {
      class: 'floating-bug',
      style: `left:${Math.random()*95}%;top:${Math.random()*90}%;animation-duration:${3+Math.random()*4}s;animation-delay:${Math.random()*3}s;font-size:${1.5+Math.random()}rem;`,
    }, emojis[i % emojis.length]);
    bugsEl.appendChild(bug);
  }

  const btn = (text, cls, onClick) =>
    h('button', { class: `btn ${cls}`, onClick: () => { Sound.click(); onClick(); } }, text);

  const el = h('div', { class: 'screen title-screen', id: 'screen-title' },
    bugsEl,
    h('div', { style: 'position:relative;z-index:1;display:flex;flex-direction:column;align-items:center;' },
      h('div', { class: 'title-logo float' }, '🐛 Logic Minesweeper'),
      h('p', { class: 'title-sub' }, 'Find the Glitch Bugs using Boolean logic!'),
      h('div', { class: 'title-buttons' },
        btn('▶ Play', 'btn-primary', onPlay),
        btn('📖 Tutorial', 'btn-secondary', onTutorial),
        btn('🔬 Logic Lab', 'btn-secondary', onLogicLab),
        btn('📅 Daily Puzzle', 'btn-secondary', onDaily),
        btn('⚙️ Settings', 'btn-ghost', onSettings),
      ),
      h('p', { style: 'margin-top:32px;font-size:0.8rem;color:var(--clr-text-dim);max-width:300px;text-align:center;' }, `💡 ${fact}`),
    )
  );

  return el;
}
