import { h } from '../utils/dom.js';
import { richText } from '../utils/math.js';
import { lessonHref } from '../utils/router.js';
import { setScore } from '../utils/storage.js';

const LETTERS = ['A', 'B', 'C', 'D'];

function encouragement(percent) {
  if (percent === 100) return 'Excelent! Ai răspuns corect la toate întrebările.';
  if (percent >= 80) return 'Foarte bine! Stăpânești aproape toate noțiunile din această lecție.';
  if (percent >= 50) return 'Bine! Mai recitește fișa pentru întrebările greșite și încearcă din nou.';
  return 'Nu te descuraja! Recitește fișa de teorie și repetă testul.';
}

export function createQuiz({ lesson, questions, nextLesson, onFinish, onBackToLesson, onShowPage }) {
  const el = h('div', { class: 'quiz', 'aria-live': 'off' });
  let index = 0;
  let correctCount = 0;

  function renderQuestion() {
    const question = questions[index];
    const total = questions.length;
    const name = `answer-${question.id}`;
    let selected = null;
    let checked = false;

    const heading = h('h3', { class: 'quiz-progress', tabindex: '-1' }, `Întrebarea ${index + 1} din ${total}`);
    const progress = h(
      'div',
      { class: 'quiz-steps', 'aria-hidden': 'true' },
      questions.map((_, i) => h('span', { class: `quiz-step${i < index ? ' done' : ''}${i === index ? ' current' : ''}` })),
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
      options.forEach(({ input, label }, i) => {
        input.disabled = true;
        if (i === question.correctIndex) label.classList.add('is-correct');
        else if (i === selected) label.classList.add('is-wrong');
      });
      feedback.className = `quiz-feedback ${correct ? 'feedback-correct' : 'feedback-wrong'}`;
      feedback.replaceChildren(
        h('p', { class: 'feedback-title' }, correct ? '✓ Corect!' : '✗ Răspuns greșit.'),
        h('p', {}, h('strong', {}, 'Răspunsul corect: '), `${LETTERS[question.correctIndex]}. `, richText(question.options[question.correctIndex])),
        h('p', {}, richText(question.explanation)),
        h(
          'p',
          { class: 'feedback-source' },
          `Sursa: fișa „${lesson.title}”, pagina ${question.sourcePage}. `,
          h('button', { type: 'button', class: 'link-button', onClick: () => onShowPage?.(question.sourcePage) }, `Vezi pagina ${question.sourcePage}`),
        ),
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
    const total = questions.length;
    const percent = Math.round((correctCount / total) * 100);
    setScore(lesson.id, correctCount, total);
    onFinish?.({ correct: correctCount, total });
    const heading = h('h3', { tabindex: '-1' }, 'Rezultatul testului');
    el.replaceChildren(
      h(
        'div',
        { class: 'quiz-results' },
        heading,
        h(
          'div',
          { class: 'results-stats' },
          h('div', { class: 'stat' }, h('span', { class: 'stat-value' }, String(correctCount)), h('span', { class: 'stat-label' }, 'răspunsuri corecte')),
          h('div', { class: 'stat' }, h('span', { class: 'stat-value' }, `${correctCount}/${total}`), h('span', { class: 'stat-label' }, 'scor')),
          h('div', { class: 'stat' }, h('span', { class: 'stat-value' }, `${percent}%`), h('span', { class: 'stat-label' }, 'procentaj')),
        ),
        h('p', { class: 'results-message' }, encouragement(percent)),
        h('p', { class: 'muted small' }, 'Scorul a fost salvat. Lecția nu se marchează automat ca învățată.'),
        h(
          'div',
          { class: 'quiz-actions' },
          h('button', { type: 'button', class: 'btn btn-primary', onClick: start }, 'Repetă testul'),
          h('button', { type: 'button', class: 'btn btn-secondary', onClick: () => onBackToLesson?.() }, 'Înapoi la lecție'),
          nextLesson && h('a', { class: 'btn btn-secondary', href: lessonHref(nextLesson.id) }, 'Lecția următoare'),
        ),
      ),
    );
    heading.focus({ preventScroll: true });
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function start() {
    index = 0;
    correctCount = 0;
    renderQuestion();
  }

  return { el, start };
}
