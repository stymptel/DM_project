/** @file Solver.js — constraint propagation + backtracking (DPLL-style) */

/**
 * @typedef {import('./Clue.js').Clue} Clue
 * @typedef {Map<string, 0|1>} Assignment
 */

import { SAFE, MINE } from './values.js';

/**
 * Unit-propagate: for each clue, if enough info is known, force remaining cells.
 * Mutates `known` in place. Returns false if a contradiction is found.
 *
 * @param {Clue[]} clues
 * @param {Map<string, 0|1>} known  mutable
 * @param {string[]} allIds
 * @returns {boolean} true if consistent so far
 */
function propagate(clues, known) {
  let changed = true;
  while (changed) {
    changed = false;
    for (const clue of clues) {
      const { type, cells, expected, params } = clue;
      const values = cells.map((id) => known.get(id)); // 0|1|undefined

      const unknowns = cells.filter((id) => known.get(id) === undefined);
      const mines = cells.filter((id) => known.get(id) === MINE).length;
      const safes = cells.filter((id) => known.get(id) === SAFE).length;
      const total = cells.length;

      const force = (id, v) => {
        if (known.has(id) && known.get(id) !== v) return false;
        if (!known.has(id)) { known.set(id, v); changed = true; }
        return true;
      };

      // Quick violation check
      const result = clue.evaluate(new Map(known));
      if (result === false) return false;
      if (result === true) continue; // already satisfied, no forced deductions needed

      // Type-specific unit propagation
      if (type === 'NOT') {
        if (!force(cells[0], expected === true ? MINE : SAFE)) return false;
      } else if (type === 'AND') {
        if (expected === true) {
          for (const id of cells) { if (!force(id, SAFE)) return false; }
        } else {
          if (safes === total - 1 && unknowns.length === 1) {
            if (!force(unknowns[0], MINE)) return false;
          }
        }
      } else if (type === 'OR') {
        if (expected === true) {
          if (safes === 0 && unknowns.length === 1) {
            if (!force(unknowns[0], SAFE)) return false;
          }
        } else {
          for (const id of cells) { if (!force(id, MINE)) return false; }
        }
      } else if (type === 'XOR') {
        if (expected === true) {
          if (safes === 1 && unknowns.length > 0) {
            for (const id of unknowns) { if (!force(id, MINE)) return false; }
          }
          if (safes === 0 && unknowns.length === 1) { if (!force(unknowns[0], SAFE)) return false; }
        } else {
          if (safes === 1 && unknowns.length === 1) { if (!force(unknowns[0], SAFE)) return false; }
          if (safes === 0 && unknowns.length === 1) { if (!force(unknowns[0], MINE)) return false; }
        }
      } else if (type === 'IMPLIES') {
        if (expected === true) {
          if (known.get(cells[0]) === SAFE) { if (!force(cells[1], SAFE)) return false; }
          if (known.get(cells[1]) === MINE) { if (!force(cells[0], MINE)) return false; }
        } else {
          if (!force(cells[0], SAFE)) return false;
          if (!force(cells[1], MINE)) return false;
        }
      } else if (type === 'CARDINALITY') {
        const { mode = 'exactly', k } = params || {};
        if (mode === 'exactly' || expected === true) {
          const target = typeof k === 'number' ? k : expected;
          if (safes === target) {
            for (const id of unknowns) { if (!force(id, MINE)) return false; }
          } else if (safes + unknowns.length === target) {
            for (const id of unknowns) { if (!force(id, SAFE)) return false; }
          }
          // Check bounds
          if (safes > target) return false;
          if (safes + unknowns.length < target) return false;
        } else if (mode === 'atleast') {
          if (safes + unknowns.length < k) return false;
          if (safes + unknowns.length === k) {
            for (const id of unknowns) { if (!force(id, SAFE)) return false; }
          }
        } else if (mode === 'atmost') {
          if (safes > k) return false;
          if (safes === k) {
            for (const id of unknowns) { if (!force(id, MINE)) return false; }
          }
        }
      }
    }
  }
  return true;
}

/**
 * Pick the most constrained unknown variable (appears in most clues).
 * @param {string[]} allIds
 * @param {Map<string,0|1>} known
 * @param {Clue[]} clues
 * @returns {string|null}
 */
function pickNext(allIds, known, clues) {
  let best = null, bestScore = -1;
  for (const id of allIds) {
    if (known.has(id)) continue;
    const score = clues.filter((c) => c.cells.includes(id)).length;
    if (score > bestScore) { best = id; bestScore = score; }
  }
  return best;
}

/**
 * Recursive backtracking search.
 * @param {string[]} allIds
 * @param {Map<string,0|1>} known   — partial assignment, mutated
 * @param {Clue[]} clues
 * @param {number} limit
 * @param {Array<Assignment>} solutions — accumulated
 */
function search(allIds, known, clues, limit, solutions) {
  if (solutions.length >= limit) return;

  const copy = new Map(known);
  if (!propagate(clues, copy)) return;

  const next = pickNext(allIds, copy, clues);
  if (!next) {
    // All assigned — verify all clues
    if (clues.every((c) => c.evaluate(copy) === true)) {
      solutions.push(new Map(copy));
    }
    return;
  }

  for (const v of [0, 1]) {
    if (solutions.length >= limit) return;
    const branch = new Map(copy);
    branch.set(next, v);
    search(allIds, branch, clues, limit, solutions);
  }
}

/**
 * Main solver entry point.
 *
 * @param {string[]} cellIds
 * @param {Clue[]} clues
 * @param {Map<string,0|1>} [knownValues]  pre-set values (e.g. from previous deductions)
 * @param {number} [limit=2]
 * @returns {{ solutions: Assignment[], solutionCount: number, forcedMines: string[], forcedSafes: string[] }}
 */
export function solve(cellIds, clues, knownValues = new Map(), limit = 2) {
  const solutions = [];
  const start = new Map(knownValues);
  search(cellIds, start, clues, limit, solutions);

  const solutionCount = solutions.length;
  const forcedMines = [];
  const forcedSafes = [];

  if (solutionCount > 0) {
    for (const id of cellIds) {
      if (knownValues.has(id)) continue;
        const allMine = solutions.every((s) => s.get(id) === MINE);
        const allSafe = solutions.every((s) => s.get(id) === SAFE);
      if (allMine) forcedMines.push(id);
      if (allSafe) forcedSafes.push(id);
    }
  }

  return { solutions, solutionCount, forcedMines, forcedSafes };
}

/**
 * Count solutions up to limit (fast uniqueness check).
 * @param {string[]} cellIds
 * @param {Clue[]} clues
 * @param {number} [limit=2]
 * @returns {number}
 */
export function countSolutions(cellIds, clues, limit = 2) {
  return solve(cellIds, clues, new Map(), limit).solutionCount;
}

/**
 * Find cells forced by current known values (for hint engine).
 * @param {string[]} cellIds
 * @param {Clue[]} clues
 * @param {Map<string,0|1>} known
 * @returns {{ forcedMines: string[], forcedSafes: string[] }}
 */
export function findForcedCells(cellIds, clues, known) {
  const r = solve(cellIds, clues, known, 2);
  return { forcedMines: r.forcedMines, forcedSafes: r.forcedSafes };
}
