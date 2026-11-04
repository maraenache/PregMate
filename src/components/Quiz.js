import { h } from '../utils/dom.js';
import { richText } from '../utils/math.js';
import { lessonHref } from '../utils/router.js';
import { setScore } from '../utils/storage.js';
import { getLesson } from '../data/index.js';

const LETTERS = ['A', 'B', 'C', 'D'];

function encouragement(percent, scope) {
  if (percent === 100) return 'Excelent! Ai răspuns corect la toate întrebările.';
  if (percent >= 80) return `Foarte bine! Stăpânești aproape toată materia: ${scope}.`;
  if (percent >= 50) return `Bine! Recitește fișele pentru întrebările greșite și repetă materia: ${scope}.`;
  return `Nu te descuraja! Recitește fișele de teorie și repetă testul: ${scope}.`;
}

function shuffle(items) {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function createQuiz({ lesson, questions, onFinish, onBackToLesson, onShowPage }) {
  const el = h('div', { class: 'quiz', 'aria-live': 'off' });
  let index = 0;
  let correctCount = 0;
  let runQuestions = questions;
  let wrongQuestions = [];
  let reviewingMistakes = false;
  let chapterResults = new Map();
  const backLabel = lesson.id === 'test-mixt' ? 'Înapoi la teste' : 'Înapoi la lecție';

  function renderQuestion() {
    const question = runQuestions[index];
    const total = runQuestions.length;
    const name = `answer-${question.id}`;
    let selected = null;
    let checked = false;

    const heading = h('h3', { class: 'quiz-progress', tabindex: '-1' }, `Întrebarea ${index + 1} din ${total}`);
    const progress = h(
      'div',
      { class: 'quiz-steps', 'aria-hidden': 'true' },
      runQuestions.map((_, i) => h('span', { class: `quiz-step${i < index ? ' done' : ''}${i === index ? ' current' : ''}` })),
    );

    const options = question.options.map((option, i) => {
      const input = h('input', { type: 'radio', name, value: String(i), id: `${name}-${i}` });
      input.addEventListener('change', () => {
        selected = i;
        checkButton.disabled = false;
      });
      const label = h(
        'label',
        { class: 'quiz-option', for: input.id },
        input,
        h('span', { class: 'quiz-option-letter', 'aria-hidden': 'true' }, LETTERS[i]),
        richText(option, 'span'),
      );
      return { input, label };
    });

    const legend = h('legend', { class: 'quiz-question' }, richText(question.question, 'span'));
    const fieldset = h('fieldset', { class: 'quiz-fieldset' }, legend, h('div', { class: 'quiz-options' }, options.map((o) => o.label)));
    const feedback = h('div', { class: 'quiz-feedback', tabindex: '-1', hidden: true });
    const checkButton = h('button', { type: 'button', class: 'btn btn-primary', disabled: true }, 'Verifică răspunsul');
    const isLast = index === total - 1;
    const nextButton = h('button', { type: 'button', class: 'btn btn-primary', hidden: true }, isLast ? 'Vezi rezultatul' : 'Următoarea întrebare');

    checkButton.addEventListener('click', () => {
      if (checked || selected === null) return;
      checked = true;
      const correct = selected === question.correctIndex;
      if (correct) correctCount++;
      else wrongQuestions.push(question);
      if (!reviewingMistakes) {
        const lessonId = question.lessonId ?? lesson.id;
        const chapter = chapterResults.get(lessonId) ?? { correct: 0, total: 0 };
        chapter.total++;
        if (correct) chapter.correct++;
        chapterResults.set(lessonId, chapter);
      }
      options.forEach(({ input, label }, i) => {
        input.disabled = true;
        if (i === question.correctIndex) label.classList.add('is-correct', 'answer-correct');
        else if (i === selected) label.classList.add('is-wrong', 'answer-wrong');
      });
      feedback.className = `quiz-feedback ${correct ? 'feedback-correct' : 'feedback-wrong'}`;
      feedback.replaceChildren(
        h('p', { class: 'feedback-title' }, correct ? '✓ Corect!' : '✗ Răspuns greșit.'),
        h('p', {}, h('strong', {}, 'Răspunsul corect: '), `${LETTERS[question.correctIndex]}. `, richText(question.options[question.correctIndex])),
        h('p', {}, richText(question.explanation)),
        (() => {
          const sourceLesson = getLesson(question.lessonId) ?? lesson;
          return h(
            'p',
            { class: 'feedback-source' },
            `Sursa: fișa „${sourceLesson.title}”, pagina ${question.sourcePage}. `,
            onShowPage && sourceLesson.id === lesson.id
              ? h('button', { type: 'button', class: 'link-button', onClick: () => onShowPage(question.sourcePage) }, `Vezi pagina ${question.sourcePage}`)
              : h('a', { href: lessonHref(sourceLesson.id), target: '_blank', rel: 'noopener' }, 'Deschide lecția'),
          );
        })(),
      );
      feedback.hidden = false;
      feedback.setAttribute('role', 'status');
      checkButton.hidden = true;
      nextButton.hidden = false;
      nextButton.focus();
    });

    nextButton.addEventListener('click', () => {
      index++;
      if (index < total) renderQuestion();
      else renderResults();
    });

    el.replaceChildren(
      h('div', { class: 'quiz-header' }, heading, progress),
      fieldset,
      feedback,
      h('div', { class: 'quiz-actions' }, checkButton, nextButton),
    );
    heading.focus({ preventScroll: true });
    if (index > 0) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function renderResults() {
    const total = runQuestions.length;
    const percent = Math.round((correctCount / total) * 100);
    const celebrate = percent === 100 && !reviewingMistakes;
    if (!reviewingMistakes) {
      setScore(lesson.id, correctCount, total);
      onFinish?.({ correct: correctCount, total });
    }
    const chapterBreakdown = lesson.id === 'test-mixt' && !reviewingMistakes
      ? h(
          'section',
          { class: 'chapter-breakdown', 'aria-labelledby': 'chapter-breakdown-title' },
          h('h3', { id: 'chapter-breakdown-title' }, 'Rezultate pe capitole'),
          h(
            'ul',
            { class: 'chapter-breakdown-list' },
            [...chapterResults.entries()]
              .sort(([first], [second]) => (getLesson(first)?.order ?? 0) - (getLesson(second)?.order ?? 0))
              .map(([lessonId, score]) => {
                const sourceLesson = getLesson(lessonId);
                const percentage = Math.round((score.correct / score.total) * 100);
                return h(
                  'li',
                  { class: 'chapter-breakdown-item' },
                  h('span', { class: 'chapter-breakdown-name' }, sourceLesson?.title ?? lessonId),
                  h('strong', {}, `${score.correct}/${score.total}`),
                  h('span', { class: 'muted small' }, `${percentage}%`),
                  sourceLesson && h('a', { href: lessonHref(lessonId) }, 'Deschide lecția'),
                );
              }),
          ),
        )
      : null;
    const heading = h('h3', { tabindex: '-1' }, reviewingMistakes ? 'Rezultatul repetării' : 'Rezultatul testului');
    el.replaceChildren(
      h(
        'div',
        { class: `quiz-results${celebrate ? ' quiz-results-perfect' : ''}` },
        celebrate && h(
          'div',
          { class: 'quiz-celebration', 'aria-hidden': 'true' },
          Array.from({ length: 12 }, () => h('span', { class: 'confetti-piece' })),
        ),
        heading,
        h(
          'div',
          { class: 'results-stats' },
          h('div', { class: 'stat' }, h('span', { class: 'stat-value' }, String(correctCount)), h('span', { class: 'stat-label' }, 'răspunsuri corecte')),
          h('div', { class: 'stat' }, h('span', { class: 'stat-value' }, `${correctCount}/${total}`), h('span', { class: 'stat-label' }, 'scor')),
          h('div', { class: 'stat' }, h('span', { class: 'stat-value' }, `${percent}%`), h('span', { class: 'stat-label' }, 'procentaj')),
        ),
        h('p', { class: 'results-message' }, encouragement(percent, lesson.title)),
        chapterBreakdown,
        h(
          'p',
          { class: 'muted small' },
          reviewingMistakes ? 'Scorul testului complet a rămas neschimbat.' : 'Scorul a fost salvat. Lecția nu se marchează automat ca învățată.',
        ),
        h(
          'div',
          { class: 'quiz-actions' },
          wrongQuestions.length > 0
            ? h('button', { type: 'button', class: 'btn btn-secondary', onClick: () => startReview(wrongQuestions) }, 'Repetă întrebările greșite')
            : null,
          h('button', { type: 'button', class: 'btn btn-primary', onClick: start }, 'Repetă testul'),
          h('button', { type: 'button', class: 'btn btn-secondary', onClick: () => onBackToLesson?.() }, backLabel),
        ),
      ),
    );
    heading.focus({ preventScroll: true });
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function start() {
    index = 0;
    correctCount = 0;
    runQuestions = shuffle(questions);
    wrongQuestions = [];
    reviewingMistakes = false;
    chapterResults = new Map();
    renderQuestion();
  }

  function startReview(reviewQuestions) {
    index = 0;
    correctCount = 0;
    runQuestions = shuffle(reviewQuestions);
    wrongQuestions = [];
    reviewingMistakes = true;
    renderQuestion();
  }

  return { el, start };
}
