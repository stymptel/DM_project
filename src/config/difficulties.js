/** @file difficulties.js — per-difficulty settings */

export const DIFFICULTIES = {
  beginner: {
    name: 'Beginner',
    rows: 5,
    cols: 5,
    mineDensity: 0.25,
    hearts: 3,
    allowedClueTypes: ['NOT', 'AND', 'OR', 'XOR', 'IMPLIES'],
    maxClueSize: 3,
    clueCount: [4, 52],
    clueMix: {
      NOT: [0.04, 0.10],
      OR: [0.24, 0.34],
      XOR: [0.24, 0.34],
      IMPLIES: [0.15, 0.25],
      AND_TRUE: [0, 0.08],
      AND_FALSE: [0.05, 0.12],
    },
    hintLimit: 3,
    description: 'Learn the basics with simple clues',
  },
  intermediate: {
    name: 'Intermediate',
    rows: 7,
    cols: 7,
    mineDensity: 0.28,
    hearts: 3,
    allowedClueTypes: ['NOT', 'AND', 'OR', 'XOR', 'IMPLIES', 'CARDINALITY'],
    maxClueSize: 4,
    clueCount: [4, 102],
    clueMix: {
      NOT: [0.04, 0.08],
      OR: [0.20, 0.28],
      XOR: [0.20, 0.28],
      IMPLIES: [0.15, 0.20],
      AND_TRUE: [0, 0.08],
      AND_FALSE: [0.05, 0.10],
      CARDINALITY: [0.15, 0.20],
    },
    hintLimit: 3,
    description: 'Combine constraints to find the answer',
  },
  advanced: {
    name: 'Advanced',
    rows: 9,
    cols: 9,
    mineDensity: 0.3,
    hearts: 3,
    allowedClueTypes: ['NOT', 'AND', 'OR', 'XOR', 'IMPLIES', 'CARDINALITY'],
    maxClueSize: 5,
    clueCount: [4, 168],
    clueMix: {
      NOT: [0.03, 0.07],
      OR: [0.18, 0.24],
      XOR: [0.18, 0.24],
      IMPLIES: [0.20, 0.30],
      AND_TRUE: [0, 0.06],
      AND_FALSE: [0.06, 0.10],
      CARDINALITY: [0.15, 0.20],
    },
    hintLimit: 2,
    description: 'Multi-step deductions with all clue types',
  },
  expert: {
    name: 'Expert',
    rowsRange: [6, 10],
    colsRange: [6, 10],
    mineDensity: 0.32,
    hearts: 3,
    allowedClueTypes: ['NOT', 'AND', 'OR', 'XOR', 'IMPLIES', 'CARDINALITY'],
    maxClueSize: 6,
    clueCount: [4, 150],
    clueMix: {
      NOT: [0.03, 0.08],
      OR: [0.18, 0.28],
      XOR: [0.18, 0.28],
      IMPLIES: [0.15, 0.30],
      AND_TRUE: [0, 0.05],
      AND_FALSE: [0.05, 0.15],
      CARDINALITY: [0.10, 0.25],
    },
    hintLimit: 1,
    minimise: true,
    description: 'Minimal clue sets — every clue counts',
  },
};

/** Build grid dimensions for expert from random within range */
export function expertDims(rng) {
  const d = DIFFICULTIES.expert;
  const rows = d.rowsRange[0] + Math.floor(rng() * (d.rowsRange[1] - d.rowsRange[0] + 1));
  const cols = d.colsRange[0] + Math.floor(rng() * (d.colsRange[1] - d.colsRange[0] + 1));
  return { rows, cols };
}
