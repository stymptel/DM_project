/** @file Clue.js — Clue classes with evaluate(), toEnglish(), toSymbols() */

import { CLUE_TYPES } from '../config/clueTypes.js';

let _clueCounter = 0;
export function resetClueCounter() { _clueCounter = 0; }

/**
 * Evaluate a single cell in an assignment.
 * @param {Map<string,0|1|undefined>} assignment
 * @param {string} id
 * @returns {0|1|'undetermined'}
 */
function val(assignment, id) {
  const v = assignment.get(id);
  return v === undefined ? 'undetermined' : v;
}

/**
 * @typedef {Object} ClueResult
 * @property {boolean|'undetermined'} value
 */

/**
 * Base evaluate helper: wraps result with expected.
 * If any input is undetermined, result is undetermined.
 */
function tri(raw, expected) {
  if (raw === 'undetermined') return 'undetermined';
  return raw === (expected ? 1 : 0) || raw === expected;
}

// ─── Clue factory ────────────────────────────────────────────────────────────

/**
 * Create a clue object.
 * @param {'NOT'|'AND'|'OR'|'XOR'|'IMPLIES'|'CARDINALITY'} type
 * @param {string[]} cells  — cell IDs
 * @param {boolean|number} expected — expected truth value
 * @param {Object} [params] — extra params (e.g. { mode, k } for cardinality)
 * @returns {Clue}
 */
export function createClue(type, cells, expected, params = {}) {
  const id = `clue-${++_clueCounter}`;
  const meta = CLUE_TYPES[type];

  /** @param {Map<string,0|1|undefined>} assignment */
  function evaluate(assignment) {
    const vs = cells.map((c) => val(assignment, c));
    const raw = meta.evaluate(vs.map((value) => value === 'undetermined' ? undefined : value), expected, params);
    return raw === undefined ? 'undetermined' : raw === expected;
  }

  function toEnglish() {
    return meta.english(cells, expected, params);
  }

  function toSymbols() {
    return meta.symbolic(cells, expected, params);
  }

  function involvedCells() {
    return [...cells];
  }

  return { id, type, cells: [...cells], expected, params, evaluate, toEnglish, toSymbols, involvedCells };
}
