import { describe, it, expect, beforeEach } from 'vitest';
import { findHint } from '../src/core/HintEngine.js';
import { createClue, resetClueCounter } from '../src/core/Clue.js';
import { MINE, SAFE } from '../src/core/values.js';

describe('Hint Engine', () => {
  beforeEach(() => resetClueCounter());

  it('finds a forced deduction without revealing unforced cells', () => {
    const cellIds = ['A', 'B'];
    const clues = [createClue('NOT', ['A'], true)];
    const known = new Map();

    const hint = findHint(cellIds, clues, known);
    expect(hint).not.toBeNull();
    expect(hint.cellId).toBe('A');
    expect(hint.value).toBe(MINE);
    expect(hint.explanation).toContain('mine');
  });

  it('returns null when no cell is logically forced', () => {
    const cellIds = ['A', 'B'];
    const clues = [createClue('OR', ['A', 'B'], true)]; // Neither is forced yet
    const known = new Map();

    const hint = findHint(cellIds, clues, known);
    expect(hint).toBeNull();
  });

  it('explains implication modus ponens in kid-friendly wording', () => {
    const hint = findHint(
      ['K', 'H'],
      [createClue('IMPLIES', ['K', 'H'], true)],
      new Map([['K', SAFE]]),
    );

    expect(hint.cellId).toBe('H');
    expect(hint.value).toBe(SAFE);
    expect(hint.explanation).toContain('if K is safe then H is safe');
    expect(hint.explanation).toContain('H must be safe');
  });

  it('explains implication contrapositive in kid-friendly wording', () => {
    const hint = findHint(
      ['K', 'H'],
      [createClue('IMPLIES', ['K', 'H'], true)],
      new Map([['H', MINE]]),
    );

    expect(hint.cellId).toBe('K');
    expect(hint.value).toBe(MINE);
    expect(hint.explanation).toContain('H is a mine');
    expect(hint.explanation).toContain("K can't be safe");
  });
});
