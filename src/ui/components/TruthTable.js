/** @file TruthTable.js — interactive truth table for Logic Lab */

import { h } from '../../utils/dom.js';

/**
 * Build an interactive truth table for 1-2 variables and a given operator.
 * @param {'AND'|'OR'|'XOR'|'IMPLIES'|'NOT'} op
 * @returns {HTMLElement}
 */
export function TruthTable(op) {
  const vars = op === 'NOT' ? ['A'] : ['A', 'B'];
  const compute = {
    NOT:    ([a]) => !a,
    AND:    ([a,b]) => a && b,
    OR:     ([a,b]) => a || b,
    XOR:    ([a,b]) => a !== b,
    IMPLIES:([a,b]) => !a || b,
  }[op];

  const rows = vars.length === 1
    ? [[false],[true]]
    : [[false,false],[false,true],[true,false],[true,true]];

  const table = h('table', { class: 'truth-table', 'aria-label': `${op} truth table; 1 is safe and 0 is a mine` });
  const thead = h('thead',{}, h('tr', {},
    ...vars.map((v) => h('th',{},v)),
    h('th',{}, op === 'NOT' ? `¬A` : op === 'IMPLIES' ? 'A→B' : `A ${op === 'XOR' ? '⊕' : op === 'AND' ? '∧' : '∨'} B`)
  ));
  table.appendChild(thead);

  const tbody = h('tbody',{});
  rows.forEach((row) => {
    const result = compute(row);
    const tr = h('tr', {},
      ...row.map((v) => h('td', { class: v?'true':'false' }, v?'1 / Safe':'0 / Mine')),
      h('td', { class: result?'true':'false' }, result?'1 / True':'0 / False')
    );
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);

  return h('div', {}, h('p', { class: 'truth-legend' }, '1 = Safe ✓ (green), 0 = Mine 🐛 (amber)'), table);
}
