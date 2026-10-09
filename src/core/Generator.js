/** @file Generator.js — solution-first puzzle generation with uniqueness check */

import { createBoard, solutionAssignment } from './Board.js';
import { createClue, resetClueCounter } from './Clue.js';
import { countSolutions } from './Solver.js';
import { mulberry32, dailySeed } from './rng.js';
import { DIFFICULTIES, expertDims } from '../config/difficulties.js';
import { MAX_GEN_ATTEMPTS } from '../config/constants.js';
import { SAFE, MINE, isMine } from './values.js';

// ─── Fallback hand-authored puzzles ──────────────────────────────────────────
// Used when generation fails. Each is the worked example from the spec.
const FALLBACK_PUZZLES = {
  beginner: {
    board: { rows: 2, cols: 2, cells: [
      { id: 'A', row: 0, col: 0, value: MINE, state: 'unknown', locked: false },
      { id: 'B', row: 0, col: 1, value: SAFE, state: 'unknown', locked: false },
      { id: 'C', row: 1, col: 0, value: MINE, state: 'unknown', locked: false },
      { id: 'D', row: 1, col: 1, value: SAFE, state: 'unknown', locked: false },
    ]},
    clues: [
      { type: 'XOR',     cells: ['A','B'], expected: true,  params: {} },
      { type: 'AND',     cells: ['B','C'], expected: false, params: {} },
      { type: 'NOT',     cells: ['A'],     expected: true,  params: {} },
      { type: 'OR',      cells: ['C','D'], expected: true,  params: {} },
    ],
  },
};

// ─── Clue builders ────────────────────────────────────────────────────────────

/** Pick a random subset of size k from array, using rng */
function sample(arr, k, rng) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, k);
}

function makeCandidateClue(family, cellIds, solution, maxSize, rng) {
  const safes = cellIds.filter((id) => solution.get(id) === SAFE);
  const mines = cellIds.filter((id) => solution.get(id) === MINE);
  let cells, expected = true, params = {};

  if (family === 'NOT') {
    const pool = rng() < 0.5 ? mines : safes;
    if (!pool.length) return null;
    const id = pool[Math.floor(rng() * pool.length)];
    cells = [id];
    expected = solution.get(id) === MINE;
  } else if (family === 'AND_TRUE') {
    if (safes.length < 2) return null;
    cells = sample(safes, 2, rng);
  } else if (family === 'AND_FALSE') {
    if (!mines.length || cellIds.length < 2) return null;
    cells = [mines[Math.floor(rng() * mines.length)]];
    cells.push(sample(cellIds.filter((id) => id !== cells[0]), 1, rng)[0]);
    expected = false;
  } else if (family === 'OR') {
    if (!safes.length || cellIds.length < 2) return null;
    cells = [safes[Math.floor(rng() * safes.length)]];
    cells.push(sample(cellIds.filter((id) => id !== cells[0]), 1, rng)[0]);
  } else if (family === 'XOR') {
    if (!safes.length || !mines.length) return null;
    cells = [safes[Math.floor(rng() * safes.length)], mines[Math.floor(rng() * mines.length)]];
    if (rng() < 0.5) cells.reverse();
  } else if (family === 'IMPLIES') {
    const rows = [];
    if (safes.length >= 2) rows.push(() => sample(safes, 2, rng));
    if (mines.length && safes.length) rows.push(() => [mines[Math.floor(rng() * mines.length)], safes[Math.floor(rng() * safes.length)]]);
    if (mines.length >= 2) rows.push(() => sample(mines, 2, rng));
    if (!rows.length) return null;
    cells = rows[Math.floor(rng() * rows.length)]();
  } else if (family === 'CARDINALITY') {
    const size = 2 + Math.floor(rng() * Math.max(1, maxSize - 1));
    cells = sample(cellIds, Math.min(size, cellIds.length), rng);
    if (cells.length < 2) return null;
    const count = cells.filter((id) => solution.get(id) === SAFE).length;
    const mode = ['exactly', 'atleast', 'atmost'][Math.floor(rng() * 3)];
    const k = mode === 'atleast' ? Math.max(1, count - Math.floor(rng() * 2))
      : mode === 'atmost' ? Math.min(cells.length - 1, count + Math.floor(rng() * 2))
      : count;
    params = { mode, k };
  } else {
    return null;
  }

  return createClue(family.startsWith('AND') ? 'AND' : family, cells, expected, params);
}

function clueFamily(clue) {
  if (clue.type === 'AND') return clue.expected ? 'AND_TRUE' : 'AND_FALSE';
  return clue.type;
}

function pickFamily(clues, config, rng) {
  const mix = config.clueMix || {};
  const families = Object.keys(mix).filter((family) => {
    if (family === 'CARDINALITY') return config.allowedClueTypes.includes('CARDINALITY');
    if (family.startsWith('AND')) return config.allowedClueTypes.includes('AND');
    return config.allowedClueTypes.includes(family);
  });
  const total = Math.max(1, clues.length);
  const required = families.filter((family) => (clues.filter((c) => clueFamily(c) === family).length / total) < mix[family][0]);
  const pool = required.length ? required : families;
  const weighted = [];
  for (const family of pool) {
    const share = clues.filter((c) => clueFamily(c) === family).length / total;
    const [min, max] = mix[family];
    if (share >= max) continue;
    const weight = Math.max(1, Math.round(((min + max) / 2 - share) * 100));
    for (let i = 0; i < weight; i++) weighted.push(family);
  }
  return (weighted.length ? weighted : pool)[Math.floor(rng() * (weighted.length || pool.length))];
}

function clueKey(clue) {
  return `${clue.type}:${clue.expected}:${clue.cells.join(',')}:${JSON.stringify(clue.params)}`;
}

/** Interleave clue families so the same operator is not presented in a block. */
function interleaveClues(clues, rng) {
  const buckets = new Map();
  for (const clue of clues) {
    if (!buckets.has(clue.type)) buckets.set(clue.type, []);
    buckets.get(clue.type).push(clue);
  }

  for (const bucket of buckets.values()) {
    for (let i = bucket.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [bucket[i], bucket[j]] = [bucket[j], bucket[i]];
    }
  }

  const result = [];
  let previousType = null;
  while (result.length < clues.length) {
    const choices = [...buckets.entries()]
      .filter(([type, bucket]) => bucket.length > 0 && type !== previousType)
      .sort(([, left], [, right]) => right.length - left.length);
    const choice = choices[0] || [...buckets.entries()].find(([, bucket]) => bucket.length > 0);
    const [type, bucket] = choice;
    result.push(bucket.pop());
    previousType = type;
  }
  return result;
}

function minimizeClues(cellIds, clues, rng) {
  const typeNames = ['XOR', 'AND', 'IMPLIES', 'NOT'];
  const unique = (candidate) => countSolutions(cellIds, candidate, 2) === 1;

  // Remove redundant non-balanced clues first.
  let changed = true;
  while (changed) {
    changed = false;
    for (let i = clues.length - 1; i >= 0; i--) {
      if (clues[i].type === 'OR' && unique([...clues.slice(0, i), ...clues.slice(i + 1)])) {
        clues.splice(i, 1);
        changed = true;
      }
    }
  }

  // Remove one clue from every balanced family at a time. This preserves the
  // equal operator proportions while discarding clues that add no information.
  while (true) {
    const candidates = typeNames.map((type) => clues.findIndex((clue) => clue.type === type));
    if (candidates.some((index) => index < 0)) break;
    const remaining = clues.filter((_, index) => !candidates.includes(index));
    if (!unique(remaining)) break;
    clues.length = 0;
    clues.push(...remaining);
  }

  // A seeded shuffle avoids always selecting the same clue when several
  // equivalent minimal sets exist.
  for (let i = clues.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [clues[i], clues[j]] = [clues[j], clues[i]];
  }
  return clues;
}

function mixReady(clues, config) {
  const [minClues] = config.clueCount || [1, Infinity];
  if (clues.length < minClues) return false;
  const total = clues.length;
  const andTrueCap = config.clueMix?.AND_TRUE?.[1] ?? 1;
  if (clues.filter((c) => clueFamily(c) === 'AND_TRUE').length / total > andTrueCap) return false;
  if (config.allowedClueTypes.includes('IMPLIES') && clues.filter((c) => c.type === 'IMPLIES').length < 1) return false;
  if ((config.name === 'Beginner') && clues.filter((c) => c.type === 'IMPLIES').length < 2) return false;
  return true;
}

function mixFloorReady(clues, config) {
  const [minClues] = config.clueCount || [1, Infinity];
  if (clues.length < Math.min(10, minClues)) return false;
  const total = clues.length;
  for (const [family, [min, max]] of Object.entries(config.clueMix || {})) {
    const share = clues.filter((c) => clueFamily(c) === family).length / total;
    if (share < min || share > max) return false;
  }
  return true;
}

function addCoverageClues(clues, cellIds, solution, config, rng, maxClues) {
  const covered = new Set(clues.flatMap((clue) => clue.cells));
  const multiCellFamilies = ['OR', 'XOR', 'IMPLIES', 'AND_FALSE', 'CARDINALITY']
    .filter((family) => family !== 'CARDINALITY' || config.allowedClueTypes.includes('CARDINALITY'));
  const literalIds = new Set(clues.filter((c) => c.type === 'NOT').map((c) => c.cells[0]));

  for (const id of cellIds) {
    if (clues.length >= maxClues || covered.has(id)) continue;

    let coverageClue = null;
    for (let attempt = 0; attempt < 32 && !coverageClue; attempt++) {
      const family = multiCellFamilies[Math.floor(rng() * multiCellFamilies.length)];
      const candidate = makeCandidateClue(family, cellIds, solution, config.maxClueSize, rng);
      if (candidate && candidate.cells.includes(id) && !clues.some((c) => clueKey(c) === clueKey(candidate))) {
        coverageClue = candidate;
      }
    }

    if (coverageClue) {
      clues.push(coverageClue);
      coverageClue.cells.forEach((cellId) => covered.add(cellId));
    } else if (!literalIds.has(id)) {
      clues.push(createClue('NOT', [id], solution.get(id) === MINE));
      literalIds.add(id);
      covered.add(id);
    }
  }

  // Keep NOT available as a teaching concept without returning to one literal
  // clue for every cell.
  if (!clues.some((clue) => clue.type === 'NOT') && clues.length < maxClues && cellIds.length) {
    const id = cellIds[Math.floor(rng() * cellIds.length)];
    clues.push(createClue('NOT', [id], solution.get(id) === MINE));
  }
}

function addLearningClues(clues, cellIds, solution, config, rng, maxClues) {
  const families = ['IMPLIES', 'IMPLIES', 'OR', 'XOR', 'AND_FALSE', 'CARDINALITY']
    .filter((family) => family !== 'CARDINALITY' || config.allowedClueTypes.includes('CARDINALITY'));
  for (const family of families) {
    if (clues.length >= maxClues) break;
    const clue = makeCandidateClue(family, cellIds, solution, config.maxClueSize, rng);
    if (clue && !clues.some((c) => clueKey(c) === clueKey(clue))) clues.push(clue);
  }
}

/**
 * Build a puzzle around a small, multi-cell deduction chain.
 *
 * An OR relationship to a known mine makes the clue set solvable, while the
 * four requested operator families are added in equal-sized groups. The
 * remaining clues are relational OR clues rather than extra direct answers.
 */
function buildStructuredPuzzle(board, solution, config, rng) {
  const cellIds = board.cells.map((cell) => cell.id);
  const [minClues, maxClues = minClues] = config.clueCount || [cellIds.length, cellIds.length + 8];
  const mines = cellIds.filter((id) => solution.get(id) === MINE);
  const clues = [];
  const keys = new Set();
  const backboneSize = Math.max(0, cellIds.length - 1);
  const balancedCount = Math.floor((maxClues - backboneSize) / 4);

  const add = (clue) => {
    if (!clue || keys.has(clueKey(clue)) || clues.length >= maxClues) return false;
    clues.push(clue);
    keys.add(clueKey(clue));
    return true;
  };

  const anchor = mines[0];
  if (!anchor) return null;

  // This small backbone makes every cell deducible from the first mine.
  for (const id of cellIds) {
    if (id !== anchor) add(createClue('OR', [anchor, id], solution.get(id) === SAFE));
  }

  const counts = () => ({
    NOT: clues.filter((clue) => clue.type === 'NOT').length,
    XOR: clues.filter((clue) => clue.type === 'XOR').length,
    AND: clues.filter((clue) => clue.type === 'AND').length,
    IMPLIES: clues.filter((clue) => clue.type === 'IMPLIES').length,
  });
  const families = ['NOT', 'XOR', 'AND_FALSE', 'IMPLIES'];
  let attempts = 0;
  while (attempts++ < maxClues * 20) {
    const current = counts();
    const family = families.find((item) => current[item === 'AND_FALSE' ? 'AND' : item] < balancedCount);
    if (!family) break;
    add(makeCandidateClue(family, cellIds, solution, config.maxClueSize, rng));
  }

  while (clues.length < minClues && clues.length < maxClues && attempts++ < maxClues * 30) {
    add(makeCandidateClue('OR', cellIds, solution, config.maxClueSize, rng));
  }

  if (clues.length < minClues || countSolutions(cellIds, clues, 2) !== 1) return null;
  const minimal = minimizeClues(cellIds, clues, rng);
  return { board, clues: interleaveClues(minimal, rng) };
}

// ─── Main generator ──────────────────────────────────────────────────────────

/**
 * Generate a puzzle for a given difficulty.
 * Runs synchronously; caller should wrap in Web Worker or setTimeout chunks.
 *
 * @param {'beginner'|'intermediate'|'advanced'|'expert'} difficulty
 * @param {number} seed
 * @returns {{ board: Board, clues: Clue[] }}
 */
export function generate(difficulty, seed) {
  const config = DIFFICULTIES[difficulty];
  resetClueCounter();
  const rng = mulberry32(seed);

  let rows = config.rows;
  let cols = config.cols;
  if (difficulty === 'expert') {
    const dims = expertDims(rng);
    rows = dims.rows; cols = dims.cols;
  }

  for (let attempt = 0; attempt < MAX_GEN_ATTEMPTS; attempt++) {
    const attemptSeed = (seed + attempt * 31337) >>> 0;
    const board = createBoard(rows, cols, config.mineDensity, attemptSeed);
    const solution = solutionAssignment(board);
    const cellIds = board.cells.map((c) => c.id);

    // Check we have a non-trivial board (at least 1 mine, 1 safe)
    const mineCount = board.cells.filter((c) => isMine(c.value)).length;
    if (mineCount === 0 || mineCount === board.cells.length) continue;

    const structured = buildStructuredPuzzle(board, solution, config, rng);
    if (structured) return structured;

    // Generate clues until unique solution
    const clues = [];
    let uniqueSolution = false;
    const [, maxClues = 60] = config.clueCount || [];

    if (cellIds.length > 50) {
      addLearningClues(clues, cellIds, solution, config, rng, maxClues);
      addCoverageClues(clues, cellIds, solution, config, rng, maxClues);
      if (countSolutions(cellIds, clues, 2) === 1 && mixReady(clues, config)) return { board, clues };
      continue;
    }

    let currentCount = countSolutions(cellIds, clues, 2);

    for (let clueTry = 0; clueTry < 160 && clues.length < maxClues; clueTry++) {
      const family = pickFamily(clues, config, rng);
      let best = null;
      let bestCount = currentCount;
      for (let i = 0; i < 16; i++) {
        const candidate = makeCandidateClue(family, cellIds, solution, config.maxClueSize, rng);
        if (!candidate || clues.some((c) => clueKey(c) === clueKey(candidate))) continue;
        const nextCount = countSolutions(cellIds, [...clues, candidate], 2);
        if (nextCount > 0 && nextCount <= bestCount) {
          best = candidate;
          bestCount = nextCount;
          if (nextCount < currentCount) break;
        }
      }
      if (!best) continue;
      clues.push(best);
      currentCount = bestCount;
      uniqueSolution = currentCount === 1;
      if (uniqueSolution && mixReady(clues, config)) break;
      if (mixFloorReady(clues, config) && clues.length < maxClues) {
        addCoverageClues(clues, cellIds, solution, config, rng, maxClues);
        currentCount = countSolutions(cellIds, clues, 2);
        uniqueSolution = currentCount === 1;
        if (uniqueSolution && mixReady(clues, config)) break;
      }
    }

    if (!uniqueSolution || !mixReady(clues, config)) continue;

    if (config.minimise) {
      const [minClues] = config.clueCount || [1];
      for (let i = clues.length - 1; i >= 0 && clues.length > minClues; i--) {
        const without = [...clues.slice(0, i), ...clues.slice(i + 1)];
        if (countSolutions(cellIds, without, 2) === 1 && mixReady(without, config)) clues.splice(i, 1);
      }
    }

    return { board, clues };
  }

  // Fallback
  console.warn('Generator: exceeded max attempts, using fallback puzzle');
  return buildFallback(difficulty);
}

function buildFallback(difficulty) {
  const fb = FALLBACK_PUZZLES[difficulty] || FALLBACK_PUZZLES.beginner;
  const board = fb.board;
  board.byId = new Map(board.cells.map((c) => [c.id, c]));
  resetClueCounter();
  const clues = fb.clues.map((c) => createClue(c.type, c.cells, c.expected, c.params));
  return { board, clues };
}

/**
 * Generate a daily puzzle (seeded by today's date).
 * @param {'beginner'|'intermediate'|'advanced'|'expert'} difficulty
 * @returns {{ board: Board, clues: Clue[] }}
 */
export function generateDaily(difficulty) {
  return generate(difficulty, dailySeed());
}
