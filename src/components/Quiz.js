import { h } from '../utils/dom.js';
import { richText } from '../utils/math.js';
import { lessonHref } from '../utils/router.js';
import { setScore } from '../utils/storage.js';
import { getLesson } from '../data/index.js';

const LETTERS = ['A', 'B', 'C', 'D'];
const SVG_NS = 'http://www.w3.org/2000/svg';

function angleDiagram(type) {
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('class', 'quiz-angle-diagram');
  svg.setAttribute('viewBox', '0 0 260 140');
  svg.setAttribute('role', 'img');
  const descriptions = {
    corresponding: 'Două drepte tăiate de o secantă; unghiurile corespondente sunt marcate cu aceeași culoare.',
    'alternate-interior': 'Două drepte tăiate de o secantă; unghiurile alterne interne sunt marcate cu aceeași culoare.',
    adjacent: 'Trei semidrepte cu aceeași origine formează două unghiuri adiacente, marcate cu culori diferite.',
    'adjacent-straight': 'O semidreaptă împarte un unghi alungit în două unghiuri adiacente, marcate cu culori diferite.',
    bisector: 'O semidreaptă împarte un unghi în două unghiuri egale, marcate cu aceeași culoare.',
    vertical: 'Două drepte se intersectează; unghiurile opuse la vârf sunt marcate cu aceeași culoare.',
    'vertical-adjacent': 'Două drepte se intersectează; unghiul cunoscut și unghiurile adiacente lui sunt evidențiate prin culori.',
    'around-point': 'Trei unghiuri în jurul punctului O; măsurile cunoscute și unghiul necunoscut sunt indicate pe desen.',
    'around-point-dms': 'Trei unghiuri în jurul punctului O; măsurile în grade și minute și unghiul necunoscut sunt indicate pe desen.',
    'around-point-equal': 'Patru unghiuri egale în jurul punctului O.',
  };
  svg.setAttribute('aria-label', descriptions[type]);

  const add = (name, attrs) => {
    const node = document.createElementNS(SVG_NS, name);
    Object.entries(attrs).forEach(([key, value]) => node.setAttribute(key, value));
    svg.append(node);
    return node;
  };

  const center = ['adjacent-straight', 'vertical', 'vertical-adjacent', 'around-point', 'around-point-dms', 'around-point-equal'].includes(type)
    ? { x: 130, y: 70 }
    : { x: 122, y: 120 };
  const pointAt = (angle, radius) => ({
    x: center.x + radius * Math.cos((angle * Math.PI) / 180),
    y: center.y - radius * Math.sin((angle * Math.PI) / 180),
  });
  const sectorPath = (start, end, radius = 42) => {
    const first = pointAt(start, radius);
    const last = pointAt(end, radius);
    const largeArc = Math.abs(end - start) > 180 ? 1 : 0;
    return `M ${center.x} ${center.y} L ${first.x} ${first.y} A ${radius} ${radius} 0 ${largeArc} 0 ${last.x} ${last.y} Z`;
  };
  const ray = (angle, length = 128) => {
    const endpoint = pointAt(angle, length);
    add('line', { x1: center.x, y1: center.y, x2: endpoint.x, y2: endpoint.y, class: 'diagram-secant' });
  };
  const markPoint = (name, angle, radius, dx, dy) => {
    const position = angle === null ? center : pointAt(angle, radius);
    add('circle', { cx: position.x, cy: position.y, r: 2.8, class: 'diagram-point' });
    const node = add('text', { x: position.x + dx, y: position.y + dy, class: 'diagram-point-label' });
    node.textContent = name;
  };

  if (type === 'adjacent') {
    [0, 58, 142].forEach((angle) => ray(angle));
    add('path', { d: sectorPath(0, 58), class: 'diagram-angle-highlight' });
    add('path', { d: sectorPath(58, 142), class: 'diagram-angle-highlight diagram-angle-highlight-secondary' });
    markPoint('A', 142, 101, -14, -5);
    markPoint('B', 58, 101, 5, -4);
    markPoint('C', 0, 101, 5, 5);
    markPoint('O', null, 0, -13, 16);
    return svg;
  }

  if (type === 'adjacent-straight') {
    [0, 116, 180].forEach((angle) => ray(angle));
    add('path', { d: sectorPath(0, 116), class: 'diagram-angle-highlight' });
    add('path', { d: sectorPath(116, 180), class: 'diagram-angle-highlight diagram-angle-highlight-secondary' });
    markPoint('A', 180, 104, -10, -7);
    markPoint('B', 116, 104, -1, -9);
    markPoint('C', 0, 104, 5, 5);
    markPoint('O', null, 0, -13, 16);
    return svg;
  }

  if (type === 'bisector') {
    add('path', { d: sectorPath(0, 60), class: 'diagram-angle-highlight' });
    add('path', { d: sectorPath(60, 120), class: 'diagram-angle-highlight' });
    [0, 60, 120].forEach((angle) => ray(angle));
    markPoint('A', 120, 101, -13, -5);
    markPoint('P', 60, 101, 5, -5);
    markPoint('B', 0, 101, 5, 5);
    markPoint('O', null, 0, -13, 16);
    return svg;
  }

  if (type === 'vertical') {
    [25, 155, 205, 335].forEach((angle) => ray(angle));
    add('path', { d: sectorPath(25, 155), class: 'diagram-angle-highlight' });
    add('path', { d: sectorPath(205, 335), class: 'diagram-angle-highlight' });
    markPoint('O', null, 0, -13, 16);
    return svg;
  }

  if (type === 'vertical-adjacent') {
    const angles = [0, 127, 180, 307];
    add('path', { d: sectorPath(0, 127, 45), class: 'diagram-angle-highlight diagram-angle-highlight-secondary' });
    add('path', { d: sectorPath(127, 180, 45), class: 'diagram-angle-highlight' });
    add('path', { d: sectorPath(307, 360, 45), class: 'diagram-angle-highlight' });
    angles.forEach((angle) => ray(angle, 66));
    const givenPosition = pointAt(63.5, 30);
    const given = add('text', { x: givenPosition.x, y: givenPosition.y, class: 'diagram-measure-label' });
    given.textContent = '127°';
    markPoint('O', null, 0, -13, 16);
    return svg;
  }

  if (type === 'around-point' || type === 'around-point-dms') {
    const angles = type === 'around-point' ? [0, 95, 215] : [0, 82, 186.5];
    const measures = type === 'around-point' ? ['95°', '120°', 'x'] : ['82° 15′', '104° 30′', 'x'];
    angles.forEach((angle, i) => {
      const next = i === angles.length - 1 ? 360 : angles[i + 1];
      const className = i === 0
        ? 'diagram-angle-highlight'
        : i === 1
          ? 'diagram-angle-highlight diagram-angle-highlight-secondary'
          : 'diagram-angle-highlight diagram-angle-highlight-tertiary';
      add('path', { d: sectorPath(angle, next, 47), class: className });
      const labelAngle = angle + (next - angle) / 2;
      const position = pointAt(labelAngle, 29);
      const measure = add('text', { x: position.x, y: position.y, class: 'diagram-measure-label' });
      measure.textContent = measures[i];
    });
    angles.forEach((angle) => ray(angle, 66));
    markPoint('O', null, 0, -13, 16);
    return svg;
  }

  if (type === 'around-point-equal') {
    const angles = [0, 90, 180, 270];
    angles.forEach((angle, i) => {
      const next = i === angles.length - 1 ? 360 : angles[i + 1];
      add('path', { d: sectorPath(angle, next, 47), class: 'diagram-angle-highlight' });
    });
    angles.forEach((angle) => ray(angle, 66));
    markPoint('O', null, 0, -13, 16);
    return svg;
  }

  add('line', { x1: 14, y1: 35, x2: 246, y2: 35, class: 'diagram-parallel' });
  add('line', { x1: 14, y1: 105, x2: 246, y2: 105, class: 'diagram-parallel' });
  add('line', { x1: 64, y1: 130, x2: 176, y2: 10, class: 'diagram-secant' });

  const upper = { x: 152.7, y: 35 };
  const lower = { x: 87.3, y: 105 };
  const sectors = type === 'corresponding'
    ? [
        { point: upper, points: '0,0 30,0 30,-30' },
        { point: lower, points: '0,0 30,0 30,-30' },
      ]
    : [
        { point: upper, points: '0,0 -30,0 -30,30' },
        { point: lower, points: '0,0 30,0 30,-30' },
      ];
  sectors.forEach(({ point, points }) => {
    const polygon = add('polygon', { points, transform: `translate(${point.x} ${point.y})`, class: 'diagram-angle-highlight' });
    polygon.setAttribute('aria-hidden', 'true');
  });
  return svg;
}

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
    const fieldset = h(
      'fieldset',
      { class: 'quiz-fieldset' },
      legend,
      question.diagram ? angleDiagram(question.diagram) : null,
      h('div', { class: 'quiz-options' }, options.map((o) => o.label)),
    );
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
