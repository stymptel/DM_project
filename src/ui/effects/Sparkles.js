/** @file Sparkles.js — sparkle sweep effect on win */

/**
 * Animate a sparkle sweep across an element.
 * @param {HTMLElement} el
 * @param {number} [duration=800] ms
 */
export function sparkle(el, duration = 800) {
  const count = 12;
  const rect = el.getBoundingClientRect();
  const fragment = document.createDocumentFragment();

  for (let i = 0; i < count; i++) {
    const s = document.createElement('span');
    s.className = 'sparkle-particle';
    s.style.cssText = `
      position:fixed;
      left:${rect.left + Math.random() * rect.width}px;
      top:${rect.top + Math.random() * rect.height}px;
      width:8px; height:8px;
      border-radius:50%;
      background:hsl(${50 + Math.random() * 40},100%,70%);
      pointer-events:none;
      animation:sparkle-pop ${200 + Math.random() * 400}ms ease-out forwards;
      animation-delay:${i * 30}ms;
      z-index:9999;
    `;
    fragment.appendChild(s);
  }
  document.body.appendChild(fragment);
  setTimeout(() => {
    document.querySelectorAll('.sparkle-particle').forEach((s) => s.remove());
  }, duration + 200);
}
