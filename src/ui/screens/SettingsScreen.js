/** @file SettingsScreen.js — settings for sound, accessibility, theme, and progress */

import { h } from '../../utils/dom.js';
import { Sound } from '../../audio/Sound.js';
import { storage } from '../../state/storage.js';
import { showToast } from '../components/Toast.js';

export function SettingsScreen({ onBack }) {
  // Read saved settings
  const soundMuted = storage.get('sound_muted', false);
  const cbMode = storage.get('colorblind_mode', false);
  const largeText = storage.get('large_text', false);
  const dyslexiaFont = storage.get('dyslexia_font', false);
  const skipLock = storage.get('skipLock', false);

  function createToggle(initialState, onToggle) {
    let state = initialState;
    const btn = h('button', {
      class: `toggle-btn ${state ? 'on' : ''}`,
      'aria-pressed': state ? 'true' : 'false',
      onClick: () => {
        state = !state;
        btn.classList.toggle('on', state);
        btn.setAttribute('aria-pressed', state ? 'true' : 'false');
        Sound.click();
        onToggle(state);
      }
    });
    return btn;
  }

  const soundToggle = createToggle(!soundMuted, (val) => {
    Sound.setMute(!val);
    storage.set('sound_muted', !val);
  });

  const cbToggle = createToggle(cbMode, (val) => {
    document.body.classList.toggle('cb-mode', val);
    storage.set('colorblind_mode', val);
  });

  const textToggle = createToggle(largeText, (val) => {
    document.body.classList.toggle('large-text', val);
    storage.set('large_text', val);
  });

  const fontToggle = createToggle(dyslexiaFont, (val) => {
    document.body.classList.toggle('dyslexia', val);
    storage.set('dyslexia_font', val);
  });

  const lockToggle = createToggle(skipLock, (val) => {
    storage.set('skipLock', val);
    showToast(val ? 'All levels unlocked for testing!' : 'Standard level progression enabled.');
  });

  const resetBtn = h('button', {
    class: 'btn btn-danger',
    onClick: () => {
      if (confirm('Are you sure you want to reset all game progress and stars?')) {
        storage.clear();
        showToast('All progress reset!', 'info');
        setTimeout(() => location.reload(), 600);
      }
    }
  }, 'Reset All Progress');

  return h('div', { class: 'screen settings-screen', id: 'screen-settings' },
    h('div', { style: 'display:flex;align-items:center;gap:16px;width:100%;margin-bottom:16px;' },
      h('button', { class: 'btn btn-ghost', onClick: () => { Sound.click(); onBack(); } }, '← Back'),
      h('h1', { style: 'font-size:1.8rem;font-weight:900;' }, '⚙️ Settings')
    ),

    h('div', { class: 'setting-row', style: 'width:100%;' },
      h('div', {},
        h('div', { class: 'setting-label' }, 'Sound Effects'),
        h('div', { class: 'setting-desc' }, 'Web Audio generated sound feedback')
      ),
      soundToggle
    ),

    h('div', { class: 'setting-row', style: 'width:100%;' },
      h('div', {},
        h('div', { class: 'setting-label' }, 'High-Contrast / Colorblind Mode'),
        h('div', { class: 'setting-desc' }, 'Adjust palette for red-green visibility')
      ),
      cbToggle
    ),

    h('div', { class: 'setting-row', style: 'width:100%;' },
      h('div', {},
        h('div', { class: 'setting-label' }, 'Large Text'),
        h('div', { class: 'setting-desc' }, 'Increase overall font size')
      ),
      textToggle
    ),

    h('div', { class: 'setting-row', style: 'width:100%;' },
      h('div', {},
        h('div', { class: 'setting-label' }, 'Dyslexia-Friendly Font'),
        h('div', { class: 'setting-desc' }, 'Use OpenDyslexic typeface')
      ),
      fontToggle
    ),

    h('div', { class: 'setting-row', style: 'width:100%;' },
      h('div', {},
        h('div', { class: 'setting-label' }, 'Teacher / Tester Mode'),
        h('div', { class: 'setting-desc' }, 'Unlock all difficulty tiers immediately')
      ),
      lockToggle
    ),

    h('div', { style: 'margin-top:24px;width:100%;text-align:center;' },
      resetBtn
    )
  );
}
