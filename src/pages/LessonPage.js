import { h } from '../utils/dom.js';
import { assetUrl, getNeighbors, getQuestions, lessonPosition } from '../data/index.js';
import { createPDFViewer } from '../components/PDFViewer.js';
import { createQuiz } from '../components/Quiz.js';
import { dashboardHref, lessonHref } from '../utils/router.js';
import { getScore, isCompleted, setCompleted, setLastLessonId } from '../utils/storage.js';

const ICONS = {
  expand: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M8 3H3v5M16 3h5v5M3 16v5h5M21 16v5h-5"/></svg>',
  return: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M9 14 4 19l5 5M4 19h10a6 6 0 0 0 0-12h-2" transform="translate(0 -2)"/></svg>',
  collapse: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="m6 14 6-6 6 6"/></svg>',
  expandPanel: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="m6 10 6 6 6-6"/></svg>',
};

function setIconButton(button, icon, label) {
  button.innerHTML = icon;
  button.setAttribute('aria-label', label);
  button.title = label;
}

export function createLessonPage(lesson) {
  setLastLessonId(lesson.id);
  const number = lessonPosition(lesson);
  const { previous, next } = getNeighbors(lesson.id);
  const questions = getQuestions(lesson.id);
  const pdfHref = assetUrl(lesson.pdf);

  let studyContent;
  let studyToggle;
  let readingToggle;
  let pdfToolbar;
  const viewer = createPDFViewer({ url: lesson.pdf, title: lesson.title, originalUrl: pdfHref });
  studyContent = h(
    'div',
    { class: 'study-content', id: 'study-content' },
    viewer.el,
  );
  studyToggle = h('button', { type: 'button', class: 'btn btn-icon icon-action study-toggle', 'aria-expanded': 'true', 'aria-controls': 'study-content' });
  setIconButton(studyToggle, ICONS.collapse, 'Ascunde PDF');
  studyToggle.addEventListener('click', () => {
    const expanded = studyToggle.getAttribute('aria-expanded') === 'true';
    studyToggle.setAttribute('aria-expanded', String(!expanded));
    viewer.el.classList.toggle('is-collapsed', expanded);
    setIconButton(studyToggle, expanded ? ICONS.expandPanel : ICONS.collapse, expanded ? 'Afișează PDF' : 'Ascunde PDF');
    const study = studyToggle.closest('.lesson-study');
    study?.classList.toggle('is-expanded', !expanded);
    if (expanded && study?.classList.contains('is-reading-mode')) {
      study.classList.remove('is-reading-mode');
      readingToggle.setAttribute('aria-pressed', 'false');
      setIconButton(readingToggle, ICONS.expand, 'Citește pe tot ecranul');
      pdfToolbar?.append(readingToggle);
    }
    if (!expanded) {
      viewer.el.classList.add('is-refreshing');
      requestAnimationFrame(() => {
        viewer.refresh().finally(() => viewer.el.classList.remove('is-refreshing'));
      });
    }
  });
  readingToggle = h('button', { type: 'button', class: 'btn btn-icon icon-action reading-toggle', 'aria-pressed': 'false' });
  setIconButton(readingToggle, ICONS.expand, 'Citește pe tot ecranul');
  readingToggle.addEventListener('click', () => {
    const active = readingToggle.getAttribute('aria-pressed') === 'true';
    const nextActive = !active;
    readingToggle.setAttribute('aria-pressed', String(nextActive));
    setIconButton(readingToggle, nextActive ? ICONS.return : ICONS.expand, nextActive ? 'Înapoi la lecție' : 'Citește pe tot ecranul');
    const study = readingToggle.closest('.lesson-study');
    study?.classList.toggle('is-reading-mode', nextActive);
    if (nextActive) study?.querySelector('.study-head')?.append(readingToggle);
    else pdfToolbar?.append(readingToggle);
    if (nextActive) {
      studyToggle.setAttribute('aria-expanded', 'true');
      viewer.el.classList.remove('is-collapsed');
      setIconButton(studyToggle, ICONS.collapse, 'Ascunde PDF');
      studyToggle.closest('.lesson-study')?.classList.add('is-expanded');
    }
  });
  pdfToolbar = viewer.el.querySelector('.pdf-toolbar');
  pdfToolbar?.append(readingToggle);
  const scoreText = () => {
    const score = getScore(lesson.id);
    return score ? `Ultimul scor: ${score.correct}/${score.total}` : 'Nu ai rezolvat încă testul.';
  };
  const scoreEl = h('p', { class: 'muted small', 'aria-live': 'polite' }, scoreText());

  const checkbox = h('input', { type: 'checkbox', id: 'lesson-complete', checked: isCompleted(lesson.id) });
  const completionLabel = h('span', { class: 'completion-state' });
  const updateCompletion = () => {
    completionLabel.textContent = checkbox.checked ? 'Lecție învățată' : '';
  };
  checkbox.addEventListener('change', () => {
    setCompleted(lesson.id, checkbox.checked);
    updateCompletion();
  });
  updateCompletion();

  const titleEl = h('h1', { id: 'page-title', tabindex: '-1' }, lesson.title);

  const quizArea = h('div', { class: 'quiz-area' });
  const startButton = h('button', { type: 'button', class: 'btn btn-primary btn-large' }, 'Începe testul');
  const quizIntro = h(
    'div',
    { class: 'quiz-intro' },
    h('p', {}, `Testul conține ${questions.length} întrebări cu un singur răspuns corect. După fiecare răspuns vezi explicația și pagina din fișă unde găsești informația.`),
    scoreEl,
    startButton,
  );

  const quiz = questions.length
    ? createQuiz({
        lesson,
        questions,
        nextLesson: next,
        onFinish: () => {
          scoreEl.textContent = scoreText();
        },
        onBackToLesson: () => {
          quizArea.replaceChildren();
          quizIntro.hidden = false;
          window.scrollTo({ top: 0, behavior: 'smooth' });
          titleEl.focus({ preventScroll: true });
        },
        onShowPage: (page) => {
          if (studyToggle.getAttribute('aria-expanded') !== 'true') studyToggle.click();
          viewer.goToPage(page);
        },
      })
    : null;

  startButton.addEventListener('click', () => {
    quizIntro.hidden = true;
    quizArea.replaceChildren(quiz.el);
    quiz.start();
  });

  const quizSection = h(
    'section',
    { class: 'card quiz-section', 'aria-labelledby': 'quiz-title' },
    h('h2', { id: 'quiz-title' }, 'Test de verificare'),
    quiz ? [quizIntro, quizArea] : h('p', { class: 'error-text', role: 'alert' }, 'Întrebările pentru această lecție nu sunt disponibile.'),
  );

  const el = h(
    'div',
    { class: 'container page lesson-page' },
    h('nav', { class: 'breadcrumb', 'aria-label': 'Navigare' }, h('a', { href: dashboardHref() }, '← Toate lecțiile')),
    h(
      'header',
      { class: 'lesson-header' },
      h('p', { class: 'lesson-number' }, `Lecția ${number}`),
      titleEl,
      h('p', { class: 'lead' }, lesson.description),
    ),
    h(
      'section',
      { class: 'lesson-study is-expanded', 'aria-labelledby': 'study-title' },
      h(
        'div',
        { class: 'study-head' },
        h('h2', { id: 'study-title' }, 'Fișa de teorie'),
      ),
      studyContent,
    ),
    h(
      'div',
      { class: 'card completion' },
      h('label', { class: 'checkbox', for: 'lesson-complete' }, checkbox, h('span', {}, 'Marchează lecția ca învățată')),
      completionLabel,
    ),
    quizSection,
    h(
      'nav',
      { class: 'lesson-nav', 'aria-label': 'Lecția anterioară și următoare' },
      previous
        ? h('a', { class: 'lesson-nav-link prev', href: lessonHref(previous.id), rel: 'prev' }, h('span', { class: 'muted small' }, '← Lecția anterioară'), h('span', {}, previous.title))
        : h('span'),
      next
        ? h('a', { class: 'lesson-nav-link next', href: lessonHref(next.id), rel: 'next' }, h('span', { class: 'muted small' }, 'Lecția următoare →'), h('span', {}, next.title))
        : h('span'),
    ),
  );
  el.querySelector('.study-head')?.append(studyToggle);
  return { el, title: lesson.title, focusTarget: titleEl, destroy: () => viewer.destroy() };
}
