import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const css = fs.readFileSync(path.resolve('src/styles/variables.css'), 'utf8');
const token = (name) => css.match(new RegExp(`${name}:\\s*(#[0-9A-Fa-f]{6})`))[1];
const rgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
const luminance = (hex) => rgb(hex).map((v) => v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4).reduce((sum, value, i) => sum + value * [0.2126, 0.7152, 0.0722][i], 0);
const ratio = (a, b) => {
  const light = Math.max(luminance(a), luminance(b));
  const dark = Math.min(luminance(a), luminance(b));
  return (light + 0.05) / (dark + 0.05);
};

describe('colour tokens', () => {
  it('meet AA contrast for text and marked cells', () => {
    expect(ratio(token('--clr-text'), token('--clr-bg'))).toBeGreaterThanOrEqual(4.5);
    expect(ratio(token('--clr-text-dim'), token('--clr-surface'))).toBeGreaterThanOrEqual(4.5);
    expect(ratio(token('--clr-safe-text'), token('--clr-safe'))).toBeGreaterThanOrEqual(4.5);
    expect(ratio(token('--clr-mine-text'), token('--clr-mine'))).toBeGreaterThanOrEqual(4.5);
    expect(ratio(token('--clr-accent'), token('--clr-surface'))).toBeGreaterThanOrEqual(3);
  });
});
