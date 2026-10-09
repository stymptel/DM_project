/** @file Sound.js — Web Audio synth: click, correct, wrong, win, hint */

let _ctx = null;
let _muted = false;
let _volume = 0.3;

function ctx() {
  if (!_ctx) _ctx = new (window.AudioContext || window.webkitAudioContext)();
  if (_ctx.state === 'suspended') _ctx.resume();
  return _ctx;
}

/**
 * Play a simple synthesised tone.
 * @param {number} freq  Hz
 * @param {number} dur   seconds
 * @param {'sine'|'square'|'triangle'|'sawtooth'} [type]
 * @param {number} [vol]  0–1
 */
function tone(freq, dur, type = 'sine', vol = _volume) {
  if (_muted) return;
  try {
    const c = ctx();
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(vol, c.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + dur);
    osc.connect(gain);
    gain.connect(c.destination);
    osc.start();
    osc.stop(c.currentTime + dur);
  } catch (_) {}
}

export const Sound = {
  click() { tone(440, 0.05, 'square', 0.15); },
  correct() {
    tone(523, 0.1); // C5
    setTimeout(() => tone(659, 0.1), 80); // E5
    setTimeout(() => tone(784, 0.2), 160); // G5
  },
  wrong() { tone(220, 0.3, 'sawtooth', 0.2); },
  hint() { tone(880, 0.15, 'sine', 0.2); setTimeout(() => tone(1047, 0.2), 120); },
  win() {
    [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => tone(f, 0.3), i * 120));
  },
  unlock() { tone(660, 0.1); setTimeout(() => tone(880, 0.2), 100); },

  setMute(m) { _muted = m; },
  isMuted() { return _muted; },
  setVolume(v) { _volume = Math.max(0, Math.min(1, v)); },
};
