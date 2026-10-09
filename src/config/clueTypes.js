/** @file clueTypes.js — the single source of truth for clue semantics and wording */

import { SAFE, MINE } from '../core/values.js';

const names = (cells) => cells.join(' and ');

export const CLUE_TYPES = {
  NOT: {
    symbol: '¬',
    arity: 1,
    evaluate: ([value]) => value === undefined ? undefined : value === MINE,
    english: (cells, expected) => expected ? `${cells[0]} is a mine` : `${cells[0]} is safe`,
    symbolic: (cells, expected) => expected ? `¬${cells[0]} = True` : `${cells[0]} = True`,
    concept: 'Propositional Logic — Negation',
  },
  AND: {
    symbol: '∧',
    arity: 2,
    evaluate: (values) => values.includes(MINE) ? false : values.includes(undefined) ? undefined : true,
    english: (cells, expected) => expected ? `${names(cells)} are both safe` : `${cells[0]} and ${cells[1]} are not both safe`,
    symbolic: (cells, expected) => `${cells[0]} ∧ ${cells[1]} = ${expected ? 'True' : 'False'}`,
    concept: 'Boolean Algebra — Conjunction',
  },
  OR: {
    symbol: '∨',
    arity: 2,
    evaluate: (values) => values.includes(SAFE) ? true : values.includes(undefined) ? undefined : false,
    english: (cells, expected) => expected ? `At least one of ${cells[0]} or ${cells[1]} is safe` : `Neither ${cells[0]} nor ${cells[1]} is safe`,
    symbolic: (cells, expected) => `${cells[0]} ∨ ${cells[1]} = ${expected ? 'True' : 'False'}`,
    concept: 'Boolean Algebra — Disjunction',
  },
  XOR: {
    symbol: '⊕',
    arity: 2,
    evaluate: (values) => values.includes(undefined) ? undefined : values.filter((v) => v === SAFE).length === 1,
    english: (cells, expected) => expected ? `Exactly one of ${cells[0]} or ${cells[1]} is safe` : `${cells[0]} and ${cells[1]} are both safe or both mines`,
    symbolic: (cells, expected) => `${cells[0]} ⊕ ${cells[1]} = ${expected ? 'True' : 'False'}`,
    concept: 'Boolean Algebra — Exclusive Or',
  },
  IMPLIES: {
    symbol: '→',
    arity: 2,
    evaluate: (values) => values.includes(undefined) ? undefined : values[0] !== SAFE || values[1] === SAFE,
    english: (cells, expected) => expected ? `If ${cells[0]} is safe, then ${cells[1]} is safe` : `${cells[0]} is safe and ${cells[1]} is a mine`,
    symbolic: (cells, expected) => `${cells[0]} → ${cells[1]} = ${expected ? 'True' : 'False'}`,
    concept: 'Propositional Logic — Implication',
  },
  CARDINALITY: {
    symbol: '|{…}|',
    arity: -1, // variable
    evaluate: (values, _expected, params = {}) => {
      if (values.includes(undefined)) return undefined;
      const count = values.filter((v) => v === SAFE).length;
      return params.mode === 'atleast' ? count >= params.k : params.mode === 'atmost' ? count <= params.k : count === params.k;
    },
    english: (cells, expected, params) => {
      const list = cells.join(', ');
      const { mode = 'exactly', k } = params || {};
      if (mode === 'exactly') return `Exactly ${k} of {${list}} are safe`;
      if (mode === 'atleast') return `At least ${k} of {${list}} are safe`;
      if (mode === 'atmost') return `At most ${k} of {${list}} are safe`;
      return `${k} of {${list}} are safe`;
    },
    symbolic: (cells, expected, params) => {
      const { mode = 'exactly', k } = params || {};
      const op = mode === 'atleast' ? '≥' : mode === 'atmost' ? '≤' : '=';
      return `|{${cells.join(',')}}| ${op} ${k}`;
    },
    concept: 'Set Theory — Cardinality Constraint',
  },
};
