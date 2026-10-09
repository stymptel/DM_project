/** @file TutorialScreen.js — 7-step interactive tutorial using the spec's worked example */

import { h } from '../../utils/dom.js';
import { Sound } from '../../audio/Sound.js';
import { storage } from '../../state/storage.js';
import { TruthTable } from '../components/TruthTable.js';

const STEPS = [
  {
    title: '🐛 What are Glitch Bugs?',
    content: `Every cell in the puzzle hides either a Glitch Bug (mine = 0/False) or is Safe (1/True).
    Your job is to figure out which is which using logical clues — no guessing needed!`,
    action: null,
  },
  {
    title: '⚡ Cells as Boolean Variables',
    content: `Each cell is a Boolean variable. True (1) means Safe and False (0) means Mine.
    In maths we write: A = 1 (safe) or A = 0 (mine).
    With 4 cells, there are 2⁴ = 16 possible layouts. The clues narrow it to exactly 1!`,
    action: null,
  },
  {
    title: '¬ NOT clue',
    content: `NOT A = True means A is a mine (¬A). If a clue says "NOT A", mark A as a mine.
    Below is the truth table for NOT:`,
    table: 'NOT',
  },
  {
    title: '∧ AND / ∨ OR clues',
    content: `AND: A ∧ B = True means BOTH are safe.
    OR: A ∨ B = True means AT LEAST ONE is safe.`,
    table: 'OR',
  },
  {
    title: '⊕ XOR clue',
    content: `XOR: A ⊕ B = True means EXACTLY ONE of A, B is safe.
    If you find out one is safe, the other must be a mine!`,
    table: 'XOR',
  },
  {
    title: '→ IMPLIES clue',
    content: `A → B = True means: IF A is safe, THEN B must also be safe.
    (But if A is safe, B can be anything.)`,
    table: 'IMPLIES',
  },
  {
    title: '🎯 Worked Example: Solve A, B, C, D',
    content: `Clues:
    1. A ⊕ B = True  (exactly one of A, B is safe)
    2. B ∧ C = False  (not both B and C are safe)
    3. ¬A = True      (A is a mine)
    4. C ∨ D = True   (at least one of C, D is safe)
    
    From clue 3: A = Mine.
    From clue 1 (A mine): B = Safe.
    From clue 2 (B safe): C = Mine.
    From clue 4 (C mine): D = Safe.
    
    Answer: A=Mine, B=Safe, C=Mine, D=Safe ✓
    Legend: 1 = Safe ✓, 0 = Mine 🐛`,
    action: null,
  },
];

/**
 * @param {{ onDone: Function, onBack: Function }} opts
 * @returns {HTMLElement}
 */
export function TutorialScreen({ onDone, onBack }) {
  let step = 0;
  const progressEl = h('div', { class: 'progress-bar', style: 'width:100%;max-width:400px;' },
    h('div', { class: 'progress-fill', style: `width:${(1/STEPS.length)*100}%` })
  );
  const stepNum = h('span', { style: 'color:var(--clr-text-dim);font-size:0.9rem;' }, `1 / ${STEPS.length}`);
  const titleEl = h('h2', {}, STEPS[0].title);
  const contentEl = h('pre', { style: 'white-space:pre-wrap;text-align:left;font-family:inherit;line-height:1.7;color:var(--clr-text-dim);font-size:0.95rem;' }, STEPS[0].content);
  const tableWrap = h('div', { style: 'margin:16px 0;overflow-x:auto;' });

  const prevBtn = h('button', { class: 'btn btn-ghost', onClick: () => go(-1) }, '← Back');
  const nextBtn = h('button', { class: 'btn btn-primary', onClick: () => go(1) }, 'Next →');

  function render() {
    const s = STEPS[step];
    titleEl.textContent = s.title;
    contentEl.textContent = s.content;
    tableWrap.replaceChildren(s.table ? TruthTable(s.table) : '');
    progressEl.querySelector('.progress-fill').style.width = `${((step+1)/STEPS.length)*100}%`;
    stepNum.textContent = `${step+1} / ${STEPS.length}`;
    prevBtn.disabled = step === 0;
    nextBtn.textContent = step === STEPS.length - 1 ? '🎮 Play!' : 'Next →';
  }

  function go(dir) {
    Sound.click();
    if (dir > 0 && step === STEPS.length - 1) {
      storage.set('tutorialDone', true);
      onDone();
      return;
    }
    step = Math.max(0, Math.min(STEPS.length - 1, step + dir));
    render();
  }

  const el = h('div', { class: 'screen tutorial-screen', id: 'screen-tutorial' },
    h('div', { style: 'display:flex;align-items:center;gap:16px;width:100%;max-width:640px;' },
      h('button', { class: 'btn btn-ghost', onClick: () => { Sound.click(); onBack(); } }, '← Back'),
      h('div', { style: 'flex:1;' }, progressEl),
      stepNum,
    ),
    h('div', { class: 'tutorial-step slide-up' },
      titleEl,
      h('div', { style: 'margin:16px 0;' }, contentEl),
      tableWrap,
      h('div', { class: 'tutorial-nav' }, prevBtn, nextBtn),
    ),
  );

  return el;
}
