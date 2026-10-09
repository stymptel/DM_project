/** @file Toast.js — brief notification toasts */

import { h } from '../../utils/dom.js';

let container;

function getContainer() {
  if (!container) {
    container = h('div', { class: 'toast-container', 'aria-live': 'polite' });
    document.body.appendChild(container);
  }
  return container;
}

/**
 * Show a toast notification.
 * @param {string} message
 * @param {'success'|'error'|'info'} [type='info']
 * @param {number} [duration=3000] ms
 */
export function showToast(message, type = 'info', duration = 3000) {
  const toast = h('div', { class: `toast ${type}` }, message);
  getContainer().appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.3s';
    setTimeout(() => toast.remove(), 300);
  }, duration);
}
