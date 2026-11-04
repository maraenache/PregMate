import { h } from '../utils/dom.js';
import { dashboardHref, formulasHref, testsHref } from '../utils/router.js';
import { currentTheme, onThemeChange, toggleTheme } from '../utils/theme.js';

const SUN = '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false"><circle cx="12" cy="12" r="4.5" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M4.9 19.1l1.8-1.8M17.3 6.7l1.8-1.8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
const MOON = '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false"><path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5Z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>';

export function createHeader() {
  const lessonsLink = h('a', { href: dashboardHref(), class: 'nav-link' }, 'Lecții');
  const formulasLink = h('a', { href: formulasHref(), class: 'nav-link' }, 'Formule');
  const testsLink = h('a', { href: testsHref(), class: 'nav-link' }, 'Teste');
  const themeButton = h('button', { type: 'button', class: 'btn btn-icon theme-toggle' });

  function updateThemeButton(theme) {
    const dark = theme === 'dark';
    themeButton.innerHTML = dark ? SUN : MOON;
    themeButton.setAttribute('aria-label', dark ? 'Activează tema luminoasă' : 'Activează tema întunecată');
    themeButton.setAttribute('title', dark ? 'Temă luminoasă' : 'Temă întunecată');
  }
  updateThemeButton(currentTheme());
  onThemeChange(updateThemeButton);
  themeButton.addEventListener('click', toggleTheme);

  const el = h(
    'header',
    { class: 'site-header' },
    h(
      'div',
      { class: 'container header-inner' },
      h(
        'a',
        { href: dashboardHref(), class: 'brand' },
        h('span', { class: 'brand-mark', 'aria-hidden': 'true' }),
        h('span', { class: 'brand-name' }, 'Recapitulare Geometrie'),
      ),
      h('nav', { class: 'site-nav', 'aria-label': 'Navigare principală' }, lessonsLink, formulasLink, testsLink, themeButton),
    ),
  );

  return {
    el,
    setActive(routeName) {
      for (const [link, names] of [
        [lessonsLink, ['dashboard', 'lesson']],
        [formulasLink, ['formulas']],
        [testsLink, ['tests']],
      ]) {
        if (names.includes(routeName)) link.setAttribute('aria-current', 'page');
        else link.removeAttribute('aria-current');
      }
    },
  };
}
