/** @file a11y.js — focus management and aria-live announcer */

let _announcer = null;

function getAnnouncer() {
  if (!_announcer) {
    _announcer = document.createElement('div');
    _announcer.setAttribute('aria-live', 'polite');
    _announcer.setAttribute('aria-atomic', 'true');
    _announcer.style.cssText = 'position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0)';
    document.body.appendChild(_announcer);
  }
  return _announcer;
}

/**
 * Announce a message to screen readers.
 * @param {string} message
 */
export function announce(message) {
  const el = getAnnouncer();
  el.textContent = '';
  requestAnimationFrame(() => { el.textContent = message; });
}

/**
 * Trap focus inside a container (for modals).
 * @param {HTMLElement} container
 * @returns {Function} release trap
 */
export function trapFocus(container) {
  const focusable = () => [
    ...container.querySelectorAll('button,a,[href],[tabindex]:not([tabindex="-1"]),input,select,textarea'),
  ].filter((el) => !el.disabled);

  function onKeydown(e) {
    if (e.key !== 'Tab') return;
    const items = focusable();
    if (!items.length) return;
    const first = items[0], last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault(); last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault(); first.focus();
    }
  }

  document.addEventListener('keydown', onKeydown);
  focusable()[0]?.focus();
  return () => document.removeEventListener('keydown', onKeydown);
}
