/** @file HintEngine.js — finds a valid next deduction and explains it */

import { findForcedCells } from './Solver.js';
import { explainDeduction } from './Explainer.js';
import { SAFE } from './values.js';

/**
 * @typedef {import('./Clue.js').Clue} Clue
 */

/**
 * Find one valid hint: a cell that is logically forced by the current known values.
 *
 * @param {string[]} cellIds
 * @param {Clue[]} clues
 * @param {Map<string, 0|1>} known — currently confirmed cells
 * @returns {{ cellId: string, value: 0|1, clue: Clue, explanation: string } | null}
 */
export function findHint(cellIds, clues, known) {
  const { forcedMines, forcedSafes } = findForcedCells(cellIds, clues, known);

  // Pick first forced cell, prefer safes (easier for kids to see)
  const candidates = [
    ...forcedSafes.map((id) => ({ id, value: SAFE })),
    ...forcedMines.map((id) => ({ id, value: 0 })),
  ].filter(({ id }) => !known.has(id));

  if (candidates.length === 0) return null;

  const { id: cellId, value } = candidates[0];

  // Find the clue responsible (the one that, with known values, forces this cell)
  const responsibleClue = clues.find((clue) => {
    if (!clue.cells.includes(cellId)) return false;
    // Simulate: if we set this cell to the opposite, does the clue become violated?
    const testAssign = new Map(known);
    testAssign.set(cellId, value === SAFE ? 0 : SAFE);
    return clue.evaluate(testAssign) === false;
  }) || clues.find((c) => c.cells.includes(cellId)); // fallback

  const explanation = responsibleClue
    ? explainDeduction(responsibleClue, cellId, value, known)
    : `Cell ${cellId} is logically forced to be ${value === SAFE ? 'safe' : 'a mine'}.`;

  return { cellId, value, clue: responsibleClue, explanation };
}
