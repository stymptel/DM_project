/** @file ToolPalette.js — Mine / Safe / Clear tool selector with keyboard shortcuts */

import { h } from '../../utils/dom.js';

const TOOLS = [
  { id: 'mine', label: 'Mine', icon: '🐛', key: 'M' },
  { id: 'safe', label: 'Safe', icon: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="3" d="m5 12 4 4L19 6"/></svg>', key: 'S' },
  { id: 'clear', label: 'Clear', icon: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="3" d="m6 6 12 12M18 6 6 18"/></svg>', key: 'C' },
];

/**
 * @param {Function} onChange (toolId) => void
 * @returns {{ el: HTMLElement, activeTool: () => string }}
 */
export function ToolPalette(onChange = () => {}) {
  let active = 'mine';
  const buttons = new Map();

  const el = h('div', {
    class: 'tool-palette',
    role: 'toolbar',
    'aria-label': 'Tool selector',
  });

  TOOLS.forEach((tool) => {
    const btn = h('button', {
      class: `tool-btn${tool.id === active ? ' active' : ''}`,
      'aria-pressed': tool.id === active ? 'true' : 'false',
      title: `${tool.label} (${tool.key})`,
      'aria-label': `${tool.label} tool`,
    },);
    btn.innerHTML = tool.icon;

    btn.addEventListener('click', () => select(tool.id));
    buttons.set(tool.id, btn);
    el.appendChild(btn);
  });

  // Keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    const t = TOOLS.find((t) => t.key === e.key.toUpperCase());
    if (t) select(t.id);
  });

  function select(id) {
    active = id;
    buttons.forEach((btn, tid) => {
      btn.classList.toggle('active', tid === id);
      btn.setAttribute('aria-pressed', tid === id ? 'true' : 'false');
    });
    onChange(id);
  }

  return { el, activeTool: () => active };
}
