/** @file Transitions.js — screen transition helpers */

/**
 * Slide out old screen, slide in new screen.
 * @param {HTMLElement} outEl  going away
 * @param {HTMLElement} inEl   coming in
 * @param {'left'|'right'|'up'|'down'} [direction='left']
 */
export function transition(outEl, inEl, direction = 'left') {
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (prefersReduced) {
    outEl.style.display = 'none';
    inEl.style.display = '';
    return;
  }

  const axis = direction === 'left' || direction === 'right' ? 'X' : 'Y';
  const sign = direction === 'left' || direction === 'up' ? '-' : '';

  outEl.style.transition = 'transform 0.3s ease, opacity 0.3s ease';
  outEl.style.transform = `translate${axis}(${sign}100%)`;
  outEl.style.opacity = '0';

  inEl.style.display = '';
  inEl.style.transform = `translate${axis}(${sign === '' ? '-' : ''}100%)`;
  inEl.style.opacity = '0';
  inEl.style.transition = 'transform 0.3s ease, opacity 0.3s ease';

  requestAnimationFrame(() => {
    inEl.style.transform = 'translate(0)';
    inEl.style.opacity = '1';
  });

  outEl.addEventListener('transitionend', () => {
    outEl.style.display = 'none';
    outEl.style.transform = 'none';
    outEl.style.opacity = '';
    outEl.style.transition = '';
  }, { once: true });

  inEl.addEventListener('transitionend', () => {
    inEl.style.transform = 'none';
    inEl.style.opacity = '';
    inEl.style.transition = '';
  }, { once: true });
}
