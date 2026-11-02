import './styles/main.css';
import { h } from './utils/dom.js';
import { parseHash } from './utils/router.js';
import { initTheme } from './utils/theme.js';
import { getLesson } from './data/index.js';
import { createHeader } from './components/Header.js';
import { createDashboard } from './pages/Dashboard.js';
import { createLessonPage } from './pages/LessonPage.js';
import { createFormulasPage } from './pages/FormulasPage.js';
import { createNotFound } from './pages/NotFound.js';

initTheme();

const app = document.getElementById('app');
const header = createHeader();
const main = h('main', { id: 'main', tabindex: '-1' });
const backToTop = h('button', { type: 'button', class: 'btn btn-secondary back-to-top', 'aria-label': 'Mergi la începutul paginii', hidden: true }, '↑ Sus');
backToTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

let currentRouteName = null;
let dashboardScrollY = 0;

function updateBackToTop() {
  backToTop.hidden = window.scrollY < 500;
  if (currentRouteName === 'dashboard') dashboardScrollY = window.scrollY;
}

window.addEventListener('scroll', updateBackToTop, { passive: true });
app.append(header.el, main, backToTop);

document.querySelector('[data-skip]')?.addEventListener('click', (event) => {
  event.preventDefault();
  main.focus();
});

let currentPage = null;
let firstRender = true;

function render() {
  currentPage?.destroy?.();
  const previousRouteName = currentRouteName;
  const route = parseHash(window.location.hash);
  let page;
  if (route.name === 'dashboard') page = createDashboard();
  else if (route.name === 'formulas') page = createFormulasPage();
  else if (route.name === 'lesson') {
    const lesson = getLesson(route.id);
    page = lesson ? createLessonPage(lesson) : createNotFound('Lecția căutată nu există.');
  } else page = createNotFound();

  main.replaceChildren(page.el);
  header.setActive(route.name);
  currentRouteName = route.name;
  document.title = page.title ? `${page.title} — Recapitulare Geometrie` : 'Recapitulare Geometrie';
  if (route.name === 'dashboard' && previousRouteName === 'lesson') {
    window.requestAnimationFrame(() => window.scrollTo(0, dashboardScrollY));
  } else {
    window.scrollTo(0, 0);
  }
  if (!firstRender) (page.focusTarget ?? page.el.querySelector('h1') ?? main).focus({ preventScroll: true });
  firstRender = false;
  currentPage = page;
}

window.addEventListener('hashchange', render);
render();
