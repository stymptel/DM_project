/** @file rng.js — mulberry32 seeded PRNG for reproducible puzzles */

/**
 * Create a mulberry32 RNG from a seed.
 * @param {number} seed
 * @returns {() => number} function returning float in [0, 1)
 */
export function mulberry32(seed) {
  let s = seed >>> 0;
  return function () {
    s |= 0; s = s + 0x6d2b79f5 | 0;
    let t = Math.imul(s ^ s >>> 15, 1 | s);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

/**
 * Seed from today's date for daily puzzles.
 * @returns {number}
 */
export function dailySeed() {
  const d = new Date();
  return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
}
