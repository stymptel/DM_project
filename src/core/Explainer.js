/** @file Explainer.js — builds human-readable reasoning chains for hints and results */

/**
 * @typedef {import('./Clue.js').Clue} Clue
 */

import { SAFE } from './values.js';

/**
 * Generate a plain-English explanation for why a cell was forced.
 * @param {Clue} clue  — the clue responsible for the deduction
 * @param {string} cellId — the cell being forced
 * @param {0|1} value  — 1=safe, 0=mine
 * @param {Map<string, 0|1>} known — assignments already known
 * @returns {string}
 */
export function explainDeduction(clue, cellId, value, known) {
  const outcome = value === SAFE ? 'safe' : 'a mine';

  // Build a "we know X=mine, Y=safe…" prefix from known values in this clue
  const knownParts = clue.cells
    .filter((id) => id !== cellId && known.has(id))
    .map((id) => `${id} is ${known.get(id) === SAFE ? 'safe' : 'a mine'}`);

  const knownStr = knownParts.length
    ? `We know ${knownParts.join(' and ')}. `
    : '';

  let ruleStr = '';
  switch (clue.type) {
    case 'IMPLIES': {
      const [a, b] = clue.cells;
      if (clue.expected && cellId === b && known.get(a) === SAFE) {
        ruleStr = `${a} is safe, and the clue says if ${a} is safe then ${b} is safe, so ${b} must be safe.`;
      } else if (clue.expected && cellId === a && known.get(b) !== SAFE) {
        ruleStr = `${b} is a mine. If ${a} were safe, ${b} would have to be safe too, so ${a} can't be safe. ${a} must be a mine.`;
      } else {
        ruleStr = `${clue.toEnglish()} so ${cellId} must be ${outcome}.`;
      }
      break;
    }
    default: ruleStr = `${clue.toEnglish()} so ${cellId} must be ${outcome}.`;
  }

  return `${knownStr}${ruleStr}`;
}

/**
 * Explain why a player's declaration was WRONG.
 * @param {Clue} violatedClue
 * @param {string} cellId
 * @param {0|1} playerValue
 * @returns {string}
 */
export function explainViolation(violatedClue, cellId, playerValue) {
  const claimed = playerValue === SAFE ? 'safe' : 'a mine';
  return (
    `Not quite! ${violatedClue.toEnglish()} means the clue is not true with that mark. ` +
    `So ${cellId} has to be ${claimed === 'safe' ? 'a mine' : 'safe'}. Try again!`
  );
}

/**
 * Build a full deduction journal for a solved board.
 * @param {Array<{clue: Clue, cellId: string, value: 0|1, known: Map}>} steps
 * @returns {string[]}
 */
export function buildJournal(steps) {
  return steps.map(({ clue, cellId, value, known }, i) =>
    `Step ${i + 1}: ${explainDeduction(clue, cellId, value, known)}`
  );
}
