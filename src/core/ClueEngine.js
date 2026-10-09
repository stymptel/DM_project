/** @file ClueEngine.js — holds clues, evaluates them, simplifies with known values */

/**
 * @typedef {import('./Clue.js').Clue} Clue
 */

export class ClueEngine {
  /** @param {Clue[]} clues */
  constructor(clues) {
    this.clues = clues;
    // Map: cellId → Set of clue ids that involve it
    this._cellToClues = new Map();
    for (const clue of clues) {
      for (const cellId of clue.cells) {
        if (!this._cellToClues.has(cellId)) this._cellToClues.set(cellId, new Set());
        this._cellToClues.get(cellId).add(clue.id);
      }
    }
  }

  /**
   * Evaluate all clues under an assignment.
   * @param {Map<string, 0|1|undefined>} assignment
   * @returns {Map<string, boolean|'undetermined'>} clueId → result
   */
  evaluateAll(assignment) {
    const results = new Map();
    for (const clue of this.clues) {
      results.set(clue.id, clue.evaluate(assignment));
    }
    return results;
  }

  /**
   * Check if any clue is violated (false, not undetermined).
   * @param {Map<string, 0|1|undefined>} assignment
   * @returns {Clue|null} first violated clue or null
   */
  firstViolation(assignment) {
    for (const clue of this.clues) {
      const r = clue.evaluate(assignment);
      if (r === false) return clue;
    }
    return null;
  }

  /**
   * Get all clues that involve a given cell.
   * @param {string} cellId
   * @returns {Clue[]}
   */
  cluesForCell(cellId) {
    const ids = this._cellToClues.get(cellId) || new Set();
    return this.clues.filter((c) => ids.has(c.id));
  }

  /**
   * Check all clues satisfied (no undetermined, no false).
   * @param {Map<string, 0|1>} assignment — must be complete
   * @returns {boolean}
   */
  allSatisfied(assignment) {
    return this.clues.every((c) => c.evaluate(assignment) === true);
  }
}
