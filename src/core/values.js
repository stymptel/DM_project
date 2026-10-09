/** Canonical cell values: 1 is safe, 0 is a mine. */
export const SAFE = 1;
export const MINE = 0;
export const UNKNOWN = undefined;

export function isSafe(value) { return value === SAFE; }
export function isMine(value) { return value === MINE; }
export function fromState(state) {
  return state === 'safe' ? SAFE : state === 'mine' ? MINE : UNKNOWN;
}
export function toState(value) {
  return isSafe(value) ? 'safe' : isMine(value) ? 'mine' : 'unknown';
}
export function valueName(value) { return isSafe(value) ? 'safe' : 'a mine'; }
