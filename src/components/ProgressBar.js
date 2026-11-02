import { h } from '../utils/dom.js';

export function createProgressBar({ value, max, label }) {
  const percent = max > 0 ? Math.round((value / max) * 100) : 0;
  return h(
    'div',
    {
      class: 'progress',
      role: 'progressbar',
      'aria-label': label,
      'aria-valuemin': '0',
      'aria-valuemax': String(max),
      'aria-valuenow': String(value),
      'aria-valuetext': `${value} din ${max} (${percent}%)`,
    },
    h('div', { class: 'progress-fill', style: `width: ${percent}%` }),
  );
}

export const percentOf = (value, max) => (max > 0 ? Math.round((value / max) * 100) : 0);
