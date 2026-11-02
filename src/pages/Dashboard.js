import { h } from '../utils/dom.js';
import { lessons, getLesson, lessonPosition } from '../data/index.js';
import { createLessonCard } from '../components/LessonCard.js';
import { createProgressBar, percentOf } from '../components/ProgressBar.js';
import { getLastLessonId, isCompleted } from '../utils/storage.js';
import { searchLessons } from '../utils/search.js';
import { formulasHref, lessonHref } from '../utils/router.js';

export function createDashboard() {
  const total = lessons.length;
  const done = lessons.filter((lesson) => isCompleted(lesson.id)).length;
  const percent = percentOf(done, total);
  const lastLesson = getLesson(getLastLessonId());
  const firstLesson = lessons[0];

  const resume = lastLesson
    ? h(
        'a',
        { class: 'btn btn-primary btn-large', href: lessonHref(lastLesson.id) },
        'Continuă de unde ai rămas',
        h('span', { class: 'btn-sub' }, `Lecția ${lessonPosition(lastLesson)}: ${lastLesson.title}`),
      )
    : [
        h('button', { type: 'button', class: 'btn btn-primary btn-large', disabled: true, 'aria-describedby': 'resume-hint' }, 'Continuă de unde ai rămas'),
        firstLesson && h('a', { class: 'btn btn-secondary btn-large', href: lessonHref(firstLesson.id) }, 'Începe cu prima lecție'),
        h('p', { id: 'resume-hint', class: 'muted small resume-hint' }, 'Butonul se activează după ce deschizi prima lecție.'),
      ];

  const searchInput = h('input', {
    type: 'search',
    id: 'lesson-search',
    class: 'search-input',
    placeholder: 'De exemplu: Pitagora, bisectoare, aria trapezului…',
    autocomplete: 'off',
    spellcheck: 'false',
  });
  const resultCount = h('p', { class: 'muted small', 'aria-live': 'polite', id: 'search-count' });
  const grid = h('div', { class: 'lesson-grid' });

  function renderGrid() {
    const query = searchInput.value;
    const found = searchLessons(lessons, query);
    grid.replaceChildren(...found.map((lesson) => createLessonCard(lesson, lessonPosition(lesson))));
    if (!found.length) {
      grid.append(
        h(
          'div',
          { class: 'empty-state' },
          h('p', {}, h('strong', {}, `Nicio lecție găsită pentru „${query.trim()}”.`)),
          h('p', { class: 'muted' }, 'Încearcă un alt cuvânt-cheie (de exemplu „cerc”, „mediană” sau „sinus”) sau caută în ', h('a', { href: formulasHref() }, 'Toate formulele'), '.'),
        ),
      );
    }
    resultCount.textContent = query.trim()
      ? `${found.length} ${found.length === 1 ? 'lecție găsită' : 'lecții găsite'}`
      : `${total} lecții`;
  }
  searchInput.addEventListener('input', renderGrid);
  renderGrid();

  const el = h(
    'div',
    { class: 'container page dashboard' },
    h(
      'section',
      { class: 'hero', 'aria-labelledby': 'page-title' },
      h(
        'div',
        { class: 'hero-text' },
        h('h1', { id: 'page-title' }, 'Recapitulare Geometrie'),
        h(
          'p',
          { class: 'lead' },
          'Recapitulează noțiunile fundamentale de geometrie lecție cu lecție: citește fișa de teorie, apoi verifică-ți cunoștințele cu un test de 10 întrebări.',
        ),
        h('div', { class: 'hero-actions' }, resume),
      ),
      h(
        'div',
        { class: 'progress-card', 'aria-labelledby': 'progress-title' },
        h('h2', { id: 'progress-title', class: 'progress-title' }, 'Progresul tău'),
        h('p', { class: 'progress-value' }, h('span', { class: 'big' }, `${percent}%`), ' din curs'),
        createProgressBar({ value: done, max: total, label: 'Progresul cursului' }),
        h('p', { class: 'muted small' }, `${done} din ${total} lecții marcate ca învățate`),
        h('a', { class: 'link-arrow', href: formulasHref() }, 'Toate formulele →'),
      ),
    ),
    h(
      'section',
      { class: 'lessons-section', 'aria-labelledby': 'lessons-title' },
      h(
        'div',
        { class: 'section-head' },
        h('h2', { id: 'lessons-title' }, 'Lecții'),
        h(
          'div',
          { class: 'search' },
          h('label', { for: 'lesson-search', class: 'search-label' }, 'Caută o lecție'),
          searchInput,
          resultCount,
        ),
      ),
      grid,
    ),
  );

  return { el, title: null };
}
