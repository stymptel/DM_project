import { describe, it, expect, beforeEach } from 'vitest';
import { createClue, resetClueCounter } from '../src/core/Clue.js';
import { SAFE, MINE } from '../src/core/values.js';

describe('Clue Evaluation & Truth Tables', () => {
  beforeEach(() => resetClueCounter());

  it('evaluates NOT correctly', () => {
    const clueTrue = createClue('NOT', ['A'], true);
    expect(clueTrue.evaluate(new Map([['A', MINE]]))).toBe(true);
    expect(clueTrue.evaluate(new Map([['A', SAFE]]))).toBe(false);

    const clueFalse = createClue('NOT', ['A'], false);
    expect(clueFalse.evaluate(new Map([['A', SAFE]]))).toBe(true);
    expect(clueFalse.evaluate(new Map([['A', MINE]]))).toBe(false);
  });

  it('evaluates AND correctly', () => {
    const clue = createClue('AND', ['A', 'B'], true);
    expect(clue.evaluate(new Map([['A', 1], ['B', 1]]))).toBe(true);
    expect(clue.evaluate(new Map([['A', 1], ['B', 0]]))).toBe(false);
    expect(clue.evaluate(new Map([['A', 0], ['B', 1]]))).toBe(false);
    expect(clue.evaluate(new Map([['A', 0], ['B', 0]]))).toBe(false);
  });

  it('evaluates OR correctly', () => {
    const clue = createClue('OR', ['A', 'B'], true);
    expect(clue.evaluate(new Map([['A', 0], ['B', 0]]))).toBe(false);
    expect(clue.evaluate(new Map([['A', 1], ['B', 0]]))).toBe(true);
    expect(clue.evaluate(new Map([['A', 0], ['B', 1]]))).toBe(true);
    expect(clue.evaluate(new Map([['A', 1], ['B', 1]]))).toBe(true);
  });

  it('evaluates XOR correctly', () => {
    const clue = createClue('XOR', ['A', 'B'], true);
    expect(clue.evaluate(new Map([['A', 0], ['B', 0]]))).toBe(false);
    expect(clue.evaluate(new Map([['A', 1], ['B', 0]]))).toBe(true);
    expect(clue.evaluate(new Map([['A', 0], ['B', 1]]))).toBe(true);
    expect(clue.evaluate(new Map([['A', 1], ['B', 1]]))).toBe(false);
  });

  it('evaluates IMPLIES correctly', () => {
    const clue = createClue('IMPLIES', ['A', 'B'], true);
    // A -> B is false only when A=1, B=0
    expect(clue.evaluate(new Map([['A', 0], ['B', 0]]))).toBe(true);
    expect(clue.evaluate(new Map([['A', 0], ['B', 1]]))).toBe(true);
    expect(clue.evaluate(new Map([['A', 1], ['B', 0]]))).toBe(false);
    expect(clue.evaluate(new Map([['A', 1], ['B', 1]]))).toBe(true);
  });

  it('evaluates CARDINALITY correctly', () => {
    const clueExact = createClue('CARDINALITY', ['A', 'B', 'C'], true, { mode: 'exactly', k: 2 });
    expect(clueExact.evaluate(new Map([['A', 1], ['B', 1], ['C', 0]]))).toBe(true);
    expect(clueExact.evaluate(new Map([['A', 1], ['B', 0], ['C', 0]]))).toBe(false);
    expect(clueExact.evaluate(new Map([['A', 1], ['B', 1], ['C', 1]]))).toBe(false);
  });

  it('handles partial assignments and short-circuits', () => {
    const orClue = createClue('OR', ['A', 'B'], true);
    expect(orClue.evaluate(new Map([['A', 1]]))).toBe(true); // short-circuit
    expect(orClue.evaluate(new Map([['A', 0]]))).toBe('undetermined');

    const andClue = createClue('AND', ['A', 'B'], false);
    expect(andClue.evaluate(new Map([['A', 0]]))).toBe(true); // 0 & ? is always 0 (so = False is satisfied)
  });
});
