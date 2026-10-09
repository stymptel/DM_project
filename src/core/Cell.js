/** @file Cell.js — a single board cell (pure data, no DOM) */

/**
 * @typedef {'unknown'|'mine'|'safe'} CellState
 *
 * @typedef {Object} Cell
 * @property {string} id      — letter label A-Z, AA-AZ, …
 * @property {number} row
 * @property {number} col
 * @property {0|1} value — hidden ground truth: 1=safe, 0=mine
 * @property {CellState} state — player's current declaration
 * @property {boolean} locked  — true once correctly declared
 */

/**
 * Generate sequential cell IDs: A, B, …, Z, AA, AB, …
 * @param {number} index  0-based
 * @returns {string}
 */
export function cellId(index) {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  if (index < 26) return letters[index];
  return letters[Math.floor(index / 26) - 1] + letters[index % 26];
}

/**
 * Create a new cell.
 * @param {number} index 0-based linear index
 * @param {number} row
 * @param {number} col
 * @param {0|1} value
 * @returns {Cell}
 */
export function createCell(index, row, col, value = 1) {
  return { id: cellId(index), row, col, value, state: 'unknown', locked: false };
}
