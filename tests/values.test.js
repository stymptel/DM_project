import { describe, expect, it } from 'vitest';
import { SAFE, MINE, UNKNOWN, fromState, toState } from '../src/core/values.js';

describe('canonical cell values', () => {
  it('uses 1 for safe and 0 for mine everywhere', () => {
    expect(fromState('safe')).toBe(SAFE);
    expect(fromState('mine')).toBe(MINE);
    expect(fromState('unknown')).toBe(UNKNOWN);
    expect(toState(SAFE)).toBe('safe');
    expect(toState(MINE)).toBe('mine');
  });
});
