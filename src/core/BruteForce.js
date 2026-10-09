/** @file BruteForce.js — exhaustive truth-table solver for ≤ 20 cells */

import { MAX_BRUTE_FORCE_CELLS } from '../config/constants.js';

/**
 * Enumerate all 2^n assignments and return those satisfying all clues.
 * Only call on small boards (n ≤ 20).
 *
 * @param {string[]} cellIds
 * @param {import('./Clue.js').Clue[]} clues
 * @param {number} [limit=Infinity] stop after this many solutions
 * @returns {{ solutions: Array<Map<string,0|1>>, count: number }}
 */
export function bruteForce(cellIds, clues, limit = Infinity) {
  if (cellIds.length > MAX_BRUTE_FORCE_CELLS) {
    throw new Error(`BruteForce: ${cellIds.length} cells exceeds limit of ${MAX_BRUTE_FORCE_CELLS}`);
  }
  const n = cellIds.length;
  const solutions = [];

  for (let mask = 0; mask < (1 << n); mask++) {
    /** @type {Map<string, 0|1>} */
    const assignment = new Map();
    for (let i = 0; i < n; i++) {
      assignment.set(cellIds[i], (mask >> i) & 1);
    }
    if (clues.every((c) => c.evaluate(assignment) === true)) {
      solutions.push(assignment);
      if (solutions.length >= limit) break;
    }
  }

  return { solutions, count: solutions.length };
}

/**
 * Count solutions, stopping at limit (efficient for uniqueness check).
 * @param {string[]} cellIds
 * @param {import('./Clue.js').Clue[]} clues
 * @param {number} [limit=2]
 * @returns {number}
 */
export function bruteForceCount(cellIds, clues, limit = 2) {
  return bruteForce(cellIds, clues, limit).count;
}
