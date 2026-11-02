import { h } from '../utils/dom.js';
import { lessonHref } from '../utils/router.js';
import { getScore, isCompleted } from '../utils/storage.js';

export function createLessonCard(lesson, number) {
  const completed = isCompleted(lesson.id);
  const score = getScore(lesson.id);
  const titleId = `card-title-${lesson.id}`;
  return h(
    'article',
    { class: `lesson-card${completed ? ' is-completed' : ''}`, 'aria-labelledby': titleId },
    h(
      'div',
      { class: 'lesson-card-top' },
      h('span', { class: 'lesson-number' }, `Lecția ${number}`),
      h(
        'span',
        { class: `badge ${completed ? 'badge-done' : 'badge-todo'}` },
        completed ? '✓ Învățată' : 'Neînvățată',
      ),
    ),
    h('h3', { class: 'lesson-card-title', id: titleId }, lesson.title),
    h('p', { class: 'lesson-card-desc' }, lesson.description),
    h(
      'p',
      { class: 'lesson-card-score' },
      score ? `Ultimul test: ${score.correct}/${score.total}` : 'Test nerezolvat',
    ),
    h(
      'a',
      { class: 'btn btn-primary', href: lessonHref(lesson.id), 'aria-label': `Deschide lecția ${number}: ${lesson.title}` },
      'Deschide lecția',
    ),
  );
}
