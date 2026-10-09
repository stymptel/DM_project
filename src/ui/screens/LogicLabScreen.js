/** @file LogicLabScreen.js — sandbox for truth tables and solution space visualization */

import { h } from '../../utils/dom.js';
import { TruthTable } from '../components/TruthTable.js';
import { Sound } from '../../audio/Sound.js';
import { createClue, resetClueCounter } from '../../core/Clue.js';
import { bruteForce } from '../../core/BruteForce.js';

export function LogicLabScreen({ onBack }) {
  let activeOp = 'AND';
  const opSelectWrap = h('div', { style: 'display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px;' });
  const ops = ['NOT', 'AND', 'OR', 'XOR', 'IMPLIES'];
  const opButtons = {};

  const tableContainer = h('div', { style: 'overflow-x:auto;margin-top:12px;' });

  function setOp(op) {
    activeOp = op;
    ops.forEach((o) => {
      opButtons[o].className = `btn ${o === activeOp ? 'btn-primary' : 'btn-ghost'}`;
    });
    tableContainer.replaceChildren(TruthTable(activeOp));
  }

  ops.forEach((op) => {
    const btn = h('button', {
      class: `btn ${op === activeOp ? 'btn-primary' : 'btn-ghost'}`,
      onClick: () => { Sound.click(); setOp(op); }
    }, op);
    opButtons[op] = btn;
    opSelectWrap.appendChild(btn);
  });
  setOp('AND');

  // Solution space playground (Demo on 4 cells: A, B, C, D -> 16 total assignments)
  const cellIds = ['A', 'B', 'C', 'D'];
  const clueCheckboxes = [
    { label: '¬A = True (A is safe)', type: 'NOT', cells: ['A'], expected: true },
    { label: 'A ⊕ B = True (Exactly one mine)', type: 'XOR', cells: ['A', 'B'], expected: true },
    { label: 'B ∧ C = False (NOT both mines)', type: 'AND', cells: ['B', 'C'], expected: false },
    { label: 'C ∨ D = True (At least one mine)', type: 'OR', cells: ['C', 'D'], expected: true },
  ];

  const selectedClues = new Set([0]); // start with first clue active
  const spaceCountEl = h('div', { style: 'font-size:2rem;font-weight:900;color:var(--clr-accent);margin:8px 0;' }, '8');
  const spaceBar = h('div', { class: 'progress-fill', style: 'width: 50%; height: 12px;' });
  const assignmentsList = h('div', { style: 'font-family:var(--font-mono);font-size:0.85rem;color:var(--clr-text-dim);max-height:140px;overflow-y:auto;background:var(--clr-surface2);padding:8px;border-radius:var(--r-sm);margin-top:10px;' });

  function updateSolutionSpace() {
    resetClueCounter();
    const activeClueObjs = [];
    selectedClues.forEach((idx) => {
      const c = clueCheckboxes[idx];
      activeClueObjs.push(createClue(c.type, c.cells, c.expected));
    });

    const { solutions, count } = bruteForce(cellIds, activeClueObjs);
    spaceCountEl.textContent = `${count} / 16 valid assignments`;
    const pct = Math.round((count / 16) * 100);
    spaceBar.style.width = `${pct}%`;

    const reprs = solutions.map((s) => {
      return cellIds.map((id) => `${id}:${s.get(id)}`).join(' | ');
    });
    assignmentsList.replaceChildren(
      h('div', { style: 'margin-bottom:4px;font-weight:bold;' }, `Remaining Possibilities (${count}):`),
      ...reprs.map((txt) => h('div', {}, txt))
    );
  }

  const cluesListWrap = h('div', { style: 'display:flex;flex-direction:column;gap:8px;margin:12px 0;' });
  clueCheckboxes.forEach((clue, idx) => {
    const cb = h('input', {
      type: 'checkbox',
      id: `lab-clue-${idx}`,
      style: 'width:20px;height:20px;accent-color:var(--clr-accent);cursor:pointer;',
      onChange: (e) => {
        Sound.click();
        if (e.target.checked) selectedClues.add(idx);
        else selectedClues.delete(idx);
        updateSolutionSpace();
      }
    });
    if (selectedClues.has(idx)) cb.checked = true;

    const row = h('label', {
      for: `lab-clue-${idx}`,
      style: 'display:flex;align-items:center;gap:10px;cursor:pointer;background:var(--clr-surface2);padding:8px 12px;border-radius:var(--r-sm);'
    }, cb, h('span', { style: 'font-size:0.95rem;' }, clue.label));
    cluesListWrap.appendChild(row);
  });

  updateSolutionSpace();

  return h('div', { class: 'screen logic-lab', id: 'screen-logiclab' },
    h('div', { style: 'display:flex;align-items:center;gap:16px;width:100%;margin-bottom:16px;' },
      h('button', { class: 'btn btn-ghost', onClick: () => { Sound.click(); onBack(); } }, '← Back'),
      h('h1', { style: 'font-size:1.8rem;font-weight:900;' }, '🔬 Logic Lab Sandbox')
    ),

    // Section 1: Truth Table explorer
    h('div', { class: 'lab-section', style: 'width:100%;' },
      h('h3', {}, '1. Interactive Truth Tables'),
      h('p', { style: 'color:var(--clr-text-dim);font-size:0.9rem;margin-bottom:12px;' },
        'Choose a logical connective to inspect its exact truth values across all inputs.'
      ),
      opSelectWrap,
      tableContainer
    ),

    // Section 2: Constraint Satisfaction & Solution Space
    h('div', { class: 'lab-section', style: 'width:100%;' },
      h('h3', {}, '2. Solution Space Contraction (2ⁿ ➔ 1)'),
      h('p', { style: 'color:var(--clr-text-dim);font-size:0.9rem;' },
        'Consider a 4-cell system (A, B, C, D) with 2⁴ = 16 initial possibilities. Toggle constraints to see how the valid space shrinks:'
      ),
      cluesListWrap,
      spaceCountEl,
      h('div', { class: 'progress-bar', style: 'height:10px;margin-bottom:10px;' }, spaceBar),
      assignmentsList
    )
  );
}
