import { h } from '../utils/dom.js';
import { getQuestions, lessons } from '../data/index.js';
import { getDetailedQuestions } from '../data/detailedQuestions.js';
import { createQuiz } from '../components/Quiz.js';

const MIXED_SCOPE = { id: 'test-mixt', title: 'toate capitolele' };

function shuffle(items) {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
function selectMixedQuestions(total, includedLessons = lessons) {
  const pools = includedLessons.map((lesson) => shuffle(getDetailedQuestions(lesson.id, getQuestions(lesson.id))));
  const selected = [];
  for (let round = 0; selected.length < total; round++) {
    for (const pool of pools) {
      if (pool[round]) selected.push(pool[round]);
      if (selected.length === total) break;
    }
  }
  return shuffle(selected);
}

export function createTestsPage() {
  const quizArea = h('div', { class: 'quiz-area' });
  const shortButton = h('button', { type: 'button', class: 'btn btn-secondary btn-large' }, 'Test mixt · 20 de întrebări');
  const detailedButton = h('button', { type: 'button', class: 'btn btn-primary btn-large' }, 'Test mixt · 40 de întrebări');
  const options = h(
    'section',
    { class: 'card mixed-test-options', 'aria-labelledby': 'mixed-test-title' },
    h('h2', { id: 'mixed-test-title' }, 'Exersează din toate capitolele'),
    h('p', {}, `Fiecare test combină întrebări din toate cele ${lessons.length} lecții. La fiecare încercare primești o selecție nouă.`),
    h('div', { class: 'quiz-actions' }, shortButton, detailedButton),
  );

  const selectedLessons = new Set(lessons.map((lesson) => lesson.id));
  const selectAllInput = h('input', { type: 'checkbox', checked: true, 'aria-label': 'Selectează toate capitolele' });
  const selectAllLabel = h('label', { class: 'custom-chapter-select-all' }, selectAllInput, 'Selectează toate capitolele');
  const chapterInputs = lessons.map((lesson) => {
    const input = h('input', { type: 'checkbox', checked: true, value: lesson.id });
    const label = h('label', { class: 'custom-chapter-choice', for: `custom-${lesson.id}` }, input, h('span', {}, lesson.title));
    input.id = `custom-${lesson.id}`;
    input.addEventListener('change', () => {
      if (input.checked) selectedLessons.add(lesson.id);
      else if (selectedLessons.size <= 2) {
        input.checked = true;
        selectionStatus.textContent = 'Păstrează cel puțin două capitole selectate.';
        return;
      } else selectedLessons.delete(lesson.id);
      selectionStatus.textContent = '';
      updateCustomSelection();
    });
    return { input, label, lesson };
  });
  const selectedCount = h('p', { class: 'muted small custom-chapter-count', 'aria-live': 'polite' });
  const selectionStatus = h('p', { class: 'muted small custom-selection-status', role: 'status', 'aria-live': 'polite' });
  const customShortButton = h('button', { type: 'button', class: 'btn btn-secondary btn-large' }, 'Test personalizat · 30 de întrebări');
  const customDetailedButton = h('button', { type: 'button', class: 'btn btn-primary btn-large' }, 'Test personalizat · 40 de întrebări');
  const customOptions = h(
    'section',
    { class: 'card mixed-test-options custom-test-options', 'aria-labelledby': 'custom-test-title' },
    h('h2', { id: 'custom-test-title' }, 'Alege capitolele'),
    h('p', {}, 'Bifează capitolele pe care vrei să le exersezi. Întrebările se împart cât mai egal între ele.'),
    selectAllLabel,
    h('div', { class: 'custom-chapter-list' }, chapterInputs.map(({ label }) => label)),
    selectedCount,
    selectionStatus,
    h('div', { class: 'quiz-actions' }, customShortButton, customDetailedButton),
  );
  const testOptions = h('div', { class: 'test-choice-list' }, options, customOptions);

  function updateCustomSelection() {
    const count = selectedLessons.size;
    selectedCount.textContent = `${count} din ${lessons.length} capitole selectate`;
    selectAllInput.checked = count === lessons.length;
    selectAllInput.indeterminate = count > 0 && count < lessons.length;
    customShortButton.disabled = count < 2;
    customDetailedButton.disabled = count < 2;
  }

  selectAllInput.addEventListener('change', () => {
    selectedLessons.clear();
    if (selectAllInput.checked) lessons.forEach((lesson) => selectedLessons.add(lesson.id));
    chapterInputs.forEach(({ input, lesson }) => {
      input.checked = selectedLessons.has(lesson.id);
    });
    updateCustomSelection();
  });
  updateCustomSelection();

  const startMixedTest = (total, includedLessons = lessons) => {
    if (includedLessons.length < 2) return;
    const quiz = createQuiz({
      lesson: MIXED_SCOPE,
      questions: selectMixedQuestions(total, includedLessons),
      onBackToLesson: () => {
        quizArea.replaceChildren();
        testOptions.hidden = false;
        window.scrollTo({ top: 0, behavior: 'smooth' });
      },
    });
    testOptions.hidden = true;
    quizArea.replaceChildren(quiz.el);
    quiz.start();
  };

  shortButton.addEventListener('click', () => startMixedTest(20));
  detailedButton.addEventListener('click', () => startMixedTest(40));
  customShortButton.addEventListener('click', () => startMixedTest(30, lessons.filter((lesson) => selectedLessons.has(lesson.id))));
  customDetailedButton.addEventListener('click', () => startMixedTest(40, lessons.filter((lesson) => selectedLessons.has(lesson.id))));

  return {
    title: 'Teste mixte',
    el: h(
      'div',
      { class: 'container page tests-page' },
      h('h1', { id: 'page-title' }, 'Teste'),
      h('p', { class: 'lead' }, 'Verifică ce ai reținut cu teste care combină noțiunile din toate capitolele.'),
      testOptions,
      quizArea,
    ),
  };
}

