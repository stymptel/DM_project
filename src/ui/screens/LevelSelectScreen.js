/** @file LevelSelectScreen.js — difficulty selection map */

import { h } from '../../utils/dom.js';
import { Sound } from '../../audio/Sound.js';
import { storage } from '../../state/storage.js';
import { DIFFICULTIES } from '../../config/difficulties.js';

const ICONS = { beginner: '🌱', intermediate: '⚡', advanced: '🔥', expert: '💀' };
const MODES = [
  { id: 'classic', label: 'Classic', icon: '❤️', desc: '3 hearts — think carefully!' },
  { id: 'practice', label: 'Practice', icon: '📚', desc: 'Unlimited hearts + explanations' },
  { id: 'timed', label: 'Timed', icon: '⏱️', desc: 'Race the clock!' },
];

/**
 * @param {{ onSelect: (difficulty, mode) => void, onBack: () => void }} opts
 * @returns {HTMLElement}
 */
export function LevelSelectScreen({ onSelect, onBack }) {
  let selectedMode = 'classic';
  const unlocked = storage.get('unlocked', ['beginner']);
  const skipLock = storage.get('skipLock', false);

  const modeRow = h('div', { style: 'display:flex;gap:12px;flex-wrap:wrap;justify-content:center;' });
  const modeBtns = {};
  MODES.forEach((m) => {
    const btn = h('button', {
      class: `btn ${m.id === selectedMode ? 'btn-primary' : 'btn-ghost'}`,
      title: m.desc,
      onClick: () => {
        selectedMode = m.id;
        MODES.forEach((mm) => modeBtns[mm.id].className = `btn ${mm.id === selectedMode ? 'btn-primary' : 'btn-ghost'}`);
        Sound.click();
      },
    }, `${m.icon} ${m.label}`);
    modeBtns[m.id] = btn;
    modeRow.appendChild(btn);
  });

  const grid = h('div', { class: 'level-grid' });
  Object.entries(DIFFICULTIES).forEach(([id, cfg]) => {
    const isLocked = !skipLock && !unlocked.includes(id);
    const stars = storage.get(`stars_${id}`, 0);
    const starsHtml = '★'.repeat(stars) + '☆'.repeat(3 - stars);

    const card = h('div', {
      class: `level-card${isLocked ? ' locked' : ''}`,
      role: 'button',
      tabindex: isLocked ? '-1' : '0',
      'aria-disabled': isLocked ? 'true' : 'false',
      'aria-label': `${cfg.name} difficulty${isLocked ? ' (locked)' : ''}`,
      onClick: () => {
        if (isLocked) return;
        Sound.click();
        onSelect(id, selectedMode);
      },
    },
      h('div', { class: 'level-icon' }, isLocked ? '🔒' : ICONS[id]),
      h('h3', {}, cfg.name),
      h('p', {}, cfg.description),
      h('div', { style: 'color:var(--clr-gold);margin-top:8px;font-size:1rem;' }, starsHtml),
      h('div', { style: 'font-size:0.75rem;color:var(--clr-text-dim);margin-top:4px;' },
        `${cfg.rows || '?'}×${cfg.cols || '?'} • ${cfg.allowedClueTypes.join(', ')}`
      ),
    );
    card.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') card.click(); });
    grid.appendChild(card);
  });

  return h('div', { class: 'screen level-select', id: 'screen-levelselect' },
    h('div', { style: 'display:flex;align-items:center;gap:16px;margin-bottom:24px;' },
      h('button', { class: 'btn btn-ghost', onClick: () => { Sound.click(); onBack(); } }, '← Back'),
      h('h1', {}, 'Choose Level'),
    ),
    h('div', { style: 'margin-bottom:16px;' },
      h('p', { style: 'color:var(--clr-text-dim);font-size:0.9rem;margin-bottom:8px;text-align:center;' }, 'Mode'),
      modeRow,
    ),
    grid,
  );
}
