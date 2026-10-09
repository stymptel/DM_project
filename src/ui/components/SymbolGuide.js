import { h } from '../../utils/dom.js';
import { CLUE_TYPES } from '../../config/clueTypes.js';
import { SAFE, MINE } from '../../core/values.js';

export function SymbolGuide(clues = []) {
  const operators = ['NOT', 'AND', 'OR', 'XOR', 'IMPLIES', 'CARDINALITY'];
  let x = SAFE;
  let y = MINE;
  const result = h('strong', {}, 'False');
  const tryBox = h('div', { class: 'symbol-try' });

  function renderTry() {
    const values = [x, y];
    const type = CLUE_TYPES.IMPLIES;
    result.textContent = type.evaluate(values) ? 'True' : 'False';
    tryBox.replaceChildren(
      h('button', { class: 'btn btn-ghost', onClick: () => { x = x === SAFE ? MINE : SAFE; renderTry(); } }, `X: ${x === SAFE ? 'Safe' : 'Mine'}`),
      h('button', { class: 'btn btn-ghost', onClick: () => { y = y === SAFE ? MINE : SAFE; renderTry(); } }, `Y: ${y === SAFE ? 'Safe' : 'Mine'}`),
      h('span', {}, 'X → Y = ', result),
    );
  }
  renderTry();

  return h('section', { class: 'symbol-guide', 'aria-label': 'Symbol Guide' },
    h('h3', {}, 'Symbol Guide'),
    h('p', { class: 'truth-legend' }, '1 = Safe ✓ (green), 0 = Mine 🐛 (amber)'),
    h('p', {}, 'Read the statement, then check whether it is True or False. = False means the statement is not true.'),
    h('p', {}, `Example: K ∨ H = True means at least one of K or H is safe.`),
    h('div', { class: 'symbol-rows' }, ...operators.map((key) => {
      const meta = CLUE_TYPES[key];
      return h('div', { class: 'symbol-row' },
        h('strong', {}, meta.symbol),
        h('span', {}, meta.english(key === 'CARDINALITY' ? ['X', 'Y', 'Z'] : key === 'NOT' ? ['X'] : ['X', 'Y'], true, key === 'CARDINALITY' ? { mode: 'exactly', k: 2 } : {})),
      );
    })),
    h('p', { class: 'symbol-try-label' }, 'Try it: toggle X and Y.'),
    tryBox,
    h('p', {}, 'If X is a mine, this clue is automatically true, so it tells you nothing. Look for X being safe or Y being a mine.'),
  );
}
