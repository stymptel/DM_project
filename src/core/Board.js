/** @file Board.js — grid of cells with coordinate helpers (no DOM) */

import { createCell } from './Cell.js';
import { mulberry32 } from './rng.js';
import { SAFE, MINE } from './values.js';

/**
 * @typedef {import('./Cell.js').Cell} Cell
 *
 * @typedef {Object} Board
 * @property {number} rows
 * @property {number} cols
 * @property {Cell[]} cells  — row-major order
 * @property {Map<string, Cell>} byId
 */

/**
 * Create a board. Mine placement uses the seeded RNG.
 * @param {number} rows
 * @param {number} cols
 * @param {number} mineDensity  fraction of cells that are mines
 * @param {number} seed
 * @returns {Board}
 */
export function createBoard(rows, cols, mineDensity, seed) {
  const rng = mulberry32(seed);
  const total = rows * cols;
  const mineCount = Math.round(total * mineDensity);

  // Fisher-Yates to pick mine positions
  const indices = Array.from({ length: total }, (_, i) => i);
  for (let i = total - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }
  const mineSet = new Set(indices.slice(0, mineCount));

  const cells = Array.from({ length: total }, (_, i) =>
    createCell(i, Math.floor(i / cols), i % cols, mineSet.has(i) ? MINE : SAFE)
  );

  const byId = new Map(cells.map((c) => [c.id, c]));
  return { rows, cols, cells, byId };
}

/**
 * Get 8-neighbours (clamped to grid).
 * @param {Board} board
 * @param {Cell} cell
 * @returns {Cell[]}
 */
export function neighbours(board, cell) {
  const { rows, cols } = board;
  const result = [];
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue;
      const r = cell.row + dr, c = cell.col + dc;
      if (r >= 0 && r < rows && c >= 0 && c < cols) {
        result.push(board.cells[r * cols + c]);
      }
    }
  }
  return result;
}

/**
 * Return all cells in the same row.
 * @param {Board} board
 * @param {number} row
 * @returns {Cell[]}
 */
export function rowCells(board, row) {
  return board.cells.filter((c) => c.row === row);
}

/**
 * Return all cells in the same column.
 * @param {Board} board
 * @param {number} col
 * @returns {Cell[]}
 */
export function colCells(board, col) {
  return board.cells.filter((c) => c.col === col);
}

/**
 * Build an assignment map from the hidden solution.
 * @param {Board} board
 * @returns {Map<string, 0|1>}
 */
export function solutionAssignment(board) {
  return new Map(board.cells.map((c) => [c.id, c.value]));
}
