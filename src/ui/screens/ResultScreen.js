/** @file ResultScreen.js — win/lose screen with stars, confetti, and deduction recap */

import { h } from '../../utils/dom.js';
import { Sound } from '../../audio/Sound.js';
import { launchConfetti } from '../effects/Confetti.js';
import { sparkle } from '../effects/Sparkles.js';

function fmtTime(s) {
  const m = Math.floor(s / 60);
  const ss = (s % 60).toString().padStart(2, '0');
  return `${m}:${ss}`;
}

/**
 * @param {{ won: boolean, stats: { elapsed: number, stars: number, mistakes: number, hintsUsed: number, journal?: string[] }, onNext: Function, onReplay: Function, onMenu: Function }} opts
 * @returns {HTMLElement}
 */
export function ResultScreen({ won, stats, onNext, onReplay, onMenu }) {
  const canvas = h('canvas', { style: 'position:fixed;inset:0;pointer-events:none;z-index:99;' });
  let stopConfetti;

  const titleText = won ? '🎉 Puzzle Solved!' : '💔 Out of Hearts!';
  const subText = won
    ? 'Great deduction work! All clues satisfied.'
    : "Don't worry, every mistake teaches us something about logic.";

  // Stars (for win)
  const starsContainer = h('div', { class: 'stars' });
  if (won) {
    for (let i = 1; i <= 3; i++) {
      const star = h('span', { class: `star ${i <= stats.stars ? 'earned' : ''}`, style: `animation-delay: ${i * 200}ms;` }, '★');
      starsContainer.appendChild(star);
    }
  }

  // Stats row
  const statsRow = h('div', { class: 'result-stats' },
    h('div', { class: 'result-stat' },
      h('div', { class: 'stat-val' }, fmtTime(stats.elapsed || 0)),
      h('div', { class: 'stat-label' }, 'Time')
    ),
    h('div', { class: 'result-stat' },
      h('div', { class: 'stat-val' }, `${stats.mistakes || 0}`),
      h('div', { class: 'stat-label' }, 'Mistakes')
    ),
    h('div', { class: 'result-stat' },
      h('div', { class: 'stat-val' }, `${stats.hintsUsed || 0}`),
      h('div', { class: 'stat-label' }, 'Hints Used')
    )
  );

  // Math fact or deduction recap
  const recap = h('div', { style: 'background:var(--clr-surface);padding:var(--sp-md);border-radius:var(--r-md);max-width:500px;text-align:left;font-size:0.9rem;border:1px solid var(--clr-border);' },
    h('h4', { style: 'color:var(--clr-accent);margin-bottom:8px;' }, '🧠 Logic Takeaway'),
    h('p', { style: 'color:var(--clr-text-dim);line-height:1.5;' },
      won
        ? 'By systematically eliminating impossible states with Boolean operators (AND, OR, NOT, XOR), the solution space contracted from 2ⁿ down to exactly 1 unique truth assignment!'
        : 'When a deduction fails, check the truth table of the constraining clue. Even 1 false assignment propagates a contradiction.'
    )
  );

  const btnRow = h('div', { style: 'display:flex;gap:12px;margin-top:16px;flex-wrap:wrap;justify-content:center;' },
    won ? h('button', { class: 'btn btn-primary', onClick: () => { cleanup(); onNext(); } }, 'Next Level ➔') : '',
    h('button', { class: 'btn btn-secondary', onClick: () => { cleanup(); onReplay(); } }, '↺ Try Again'),
    h('button', { class: 'btn btn-ghost', onClick: () => { cleanup(); onMenu(); } }, '☰ Menu')
  );

  const el = h('div', { class: 'screen result-screen', id: 'screen-result' },
    canvas,
    h('h1', { class: 'slide-up' }, titleText),
    h('p', { class: 'title-sub' }, subText),
    won ? starsContainer : '',
    statsRow,
    recap,
    btnRow
  );

  function cleanup() {
    if (stopConfetti) stopConfetti();
  }

  // Run celebration animations if won
  if (won) {
    setTimeout(() => {
      stopConfetti = launchConfetti(canvas);
      sparkle(el);
    }, 100);
  }

  return el;
}
