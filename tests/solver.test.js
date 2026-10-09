import { describe, it, expect, beforeEach } from 'vitest';
import { solve, countSolutions } from '../src/core/Solver.js';
import { bruteForce } from '../src/core/BruteForce.js';
import { createClue, resetClueCounter } from '../src/core/Clue.js';
import { SAFE, MINE } from '../src/core/values.js';

describe('Solver & Constraint Propagation', () => {
  beforeEach(() => resetClueCounter());

  it('solves the worked example from the specification', () => {
    // Clues from Section 1 & Section 8 worked example:
    // A ⊕ B = True
    // B ∧ C = False
    // ¬A = True
    // C ∨ D = True
    const cellIds = ['A', 'B', 'C', 'D'];
    const clues = [
      createClue('XOR', ['A', 'B'], true),
      createClue('AND', ['B', 'C'], false),
      createClue('NOT', ['A'], true),
      createClue('OR', ['C', 'D'], true),
    ];

    const { solutions, solutionCount } = solve(cellIds, clues);
    expect(solutionCount).toBe(1);
    const sol = solutions[0];
    expect(sol.get('A')).toBe(MINE);
    expect(sol.get('B')).toBe(SAFE);
    expect(sol.get('C')).toBe(MINE);
    expect(sol.get('D')).toBe(SAFE);
  });

  it('matches brute force output on small boards', () => {
    const cellIds = ['A', 'B', 'C'];
    const clues = [
      createClue('OR', ['A', 'B'], true),
      createClue('XOR', ['B', 'C'], true),
    ];

    const bf = bruteForce(cellIds, clues);
    const { solutions } = solve(cellIds, clues, new Map(), 10);

    expect(solutions.length).toBe(bf.solutions.length);
  });

  it('stops early when counting solutions with limit', () => {
    const cellIds = ['A', 'B', 'C', 'D'];
    const clues = []; // 2^4 = 16 solutions
    const count = countSolutions(cellIds, clues, 2);
    expect(count).toBe(2);
  });

  it('propagates implication both ways', () => {
    const cellIds = ['A', 'B'];
    const clue = createClue('IMPLIES', ['A', 'B'], true);

    expect(solve(cellIds, [clue], new Map([['A', SAFE]])).forcedSafes).toContain('B');
    expect(solve(cellIds, [clue], new Map([['B', MINE]])).forcedMines).toContain('A');
    expect(solve(cellIds, [clue], new Map([['A', MINE]])).forcedSafes).not.toContain('B');
    expect(solve(cellIds, [clue], new Map([['A', MINE]])).forcedMines).not.toContain('B');
  });

  it('matches brute force on small implication puzzles', () => {
    const cellIds = ['A', 'B', 'C', 'D'];
    for (let mask = 0; mask < 32; mask++) {
      const clues = [
        createClue('IMPLIES', ['A', 'B'], true),
        createClue(mask & 1 ? 'OR' : 'XOR', ['B', 'C'], true),
        createClue('IMPLIES', ['C', 'D'], (mask & 2) === 0),
      ];
      const known = new Map();
      if (mask & 4) known.set('A', SAFE);
      if (mask & 8) known.set('B', MINE);
      if (mask & 16) known.set('D', SAFE);

      const bfCount = bruteForce(cellIds, clues, 10).solutions
        .filter((solution) => [...known].every(([id, value]) => solution.get(id) === value))
        .length;
      const solved = solve(cellIds, clues, known, 10);
      expect(solved.solutionCount).toBe(bfCount);
    }
  });
});
