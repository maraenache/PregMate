import { h } from '../utils/dom.js';
import { assetUrl, getNeighbors, getQuestions, lessonPosition } from '../data/index.js';
import { createPDFViewer } from '../components/PDFViewer.js';
import { createQuiz } from '../components/Quiz.js';
import { dashboardHref, lessonHref } from '../utils/router.js';
import { getScore, isCompleted, setCompleted, setLastLessonId } from '../utils/storage.js';

function downloadName(lesson, number) {
  const slug = lesson.title
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Za-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  return `Lectia-${number}-${slug}.pdf`;
}

export function createLessonPage(lesson) {
  setLastLessonId(lesson.id);
  const number = lessonPosition(lesson);
  const { previous, next } = getNeighbors(lesson.id);
  const questions = getQuestions(lesson.id);
  const pdfHref = assetUrl(lesson.pdf);

  const viewer = createPDFViewer({ url: lesson.pdf, title: lesson.title });

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
        onShowPage: (page) => viewer.goToPage(page),
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
      { class: 'lesson-study', 'aria-labelledby': 'study-title' },
      h(
        'div',
        { class: 'study-head' },
        h('h2', { id: 'study-title' }, 'Fișa de teorie'),
        h(
          'div',
          { class: 'pdf-links' },
          h('a', { class: 'btn btn-ghost btn-small', href: pdfHref, target: '_blank', rel: 'noopener' }, 'Deschide PDF-ul original'),
          h('a', { class: 'btn btn-ghost btn-small', href: pdfHref, download: downloadName(lesson, number) }, 'Descarcă PDF'),
        ),
      ),
      viewer.el,
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

  return { el, title: lesson.title, focusTarget: titleEl, destroy: () => viewer.destroy() };
}
