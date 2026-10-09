import { describe, it, expect } from 'vitest';
import { generate } from '../src/core/Generator.js';
import { countSolutions } from '../src/core/Solver.js';
import { solutionAssignment } from '../src/core/Board.js';

const caps = {
  beginner: { min: 4, max: 52 },
  intermediate: { min: 4, max: 102 },
  advanced: { min: 4, max: 168 },
  expert: { min: 4, max: 150 },
};

function countFamily(clues, family) {
  return clues.filter((clue) => {
    if (family === 'AND_TRUE') return clue.type === 'AND' && clue.expected === true;
    if (family === 'AND_FALSE') return clue.type === 'AND' && clue.expected === false;
    return clue.type === family;
  }).length;
}

describe('Puzzle Generator', () => {
  it('generates uniquely solvable beginner puzzles', () => {
    for (let seed = 1; seed <= 3; seed++) {
      const { board, clues } = generate('beginner', seed);
      const cellIds = board.cells.map((c) => c.id);
      const count = countSolutions(cellIds, clues, 2);
      expect(count).toBe(1);
    }
  });

  it('generates valid intermediate puzzles with XOR and Cardinality', () => {
    const { board, clues } = generate('intermediate', 42);
    const cellIds = board.cells.map((c) => c.id);
    const count = countSolutions(cellIds, clues, 2);
    expect(count).toBe(1);
    expect(clues.length).toBeGreaterThan(0);
  });

  it('makes every generated clue true under its hidden solution', () => {
    for (let seed = 1; seed <= 20; seed++) {
      const { board, clues } = generate('beginner', seed);
      const solution = solutionAssignment(board);
      expect(clues.every((clue) => clue.evaluate(solution) === true)).toBe(true);
      expect(board.cells.every((cell) => !('isMine' in cell))).toBe(true);
    }
  });

  it('covers every board cell while keeping literal clues limited', () => {
    for (const level of Object.keys(caps)) {
      for (let seed = 1; seed <= 3; seed++) {
        const { board, clues } = generate(level, seed);
        const covered = new Set(clues.flatMap((clue) => clue.cells));
        const literalCount = clues.filter((clue) => clue.type === 'NOT').length;

        expect(covered).toEqual(new Set(board.cells.map((cell) => cell.id)));
        expect(literalCount / clues.length).toBeLessThanOrEqual(0.3);
      }
    }
  });

  it('balances XOR, AND, implication, and negation clues', () => {
    for (const level of Object.keys(caps)) {
      for (let seed = 1; seed <= 3; seed++) {
        const { board, clues } = generate(level, seed);
        const cellIds = board.cells.map((c) => c.id);
        expect(countSolutions(cellIds, clues, 2)).toBe(1);
        expect(clues.length).toBeGreaterThanOrEqual(caps[level].min);
        expect(clues.length).toBeLessThanOrEqual(caps[level].max);
        const counts = ['XOR', 'AND', 'IMPLIES', 'NOT'].map((type) => countFamily(clues, type));
        expect(new Set(counts).size).toBe(1);
      }
    }
  });

  it('interleaves clue types instead of grouping identical operators', () => {
    for (const level of Object.keys(caps)) {
      const { clues } = generate(level, 7);
      for (let i = 1; i < clues.length; i++) {
        expect(clues[i].type).not.toBe(clues[i - 1].type);
      }
    }
  });

  it('beginner puzzles include NOT, OR, XOR and implication clues', () => {
    for (let seed = 1; seed <= 10; seed++) {
      const { clues } = generate('beginner', seed);
      expect(countFamily(clues, 'NOT')).toBeGreaterThan(0);
      expect(countFamily(clues, 'OR')).toBeGreaterThan(0);
      expect(countFamily(clues, 'XOR')).toBeGreaterThan(0);
      expect(countFamily(clues, 'IMPLIES')).toBe(countFamily(clues, 'XOR'));
    }
  });
});
