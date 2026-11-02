import { getTheme, setTheme } from './storage.js';

const media = window.matchMedia?.('(prefers-color-scheme: dark)');
const listeners = new Set();

export function currentTheme() {
  return getTheme() ?? (media?.matches ? 'dark' : 'light');
}

function apply() {
  const theme = currentTheme();
  document.documentElement.dataset.theme = theme;
  listeners.forEach((fn) => fn(theme));
}

export function initTheme() {
  apply();
  media?.addEventListener?.('change', () => {
    if (!getTheme()) apply();
  });
}

export function toggleTheme() {
  setTheme(currentTheme() === 'dark' ? 'light' : 'dark');
  apply();
}

export function onThemeChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
