import { h } from '../utils/dom.js';
import { formulas, getLesson, lessonPosition, lessons } from '../data/index.js';
import { renderLatex, richText, stripMath } from '../utils/math.js';
import { matches } from '../utils/search.js';
import { lessonHref } from '../utils/router.js';

function formulaCard(formula, lesson, initiallyExpanded = false) {
  const titleButton = h(
    'button',
    { type: 'button', class: 'formula-toggle', 'aria-expanded': String(initiallyExpanded), 'aria-controls': `formula-content-${formula.id}` },
    formula.name,
  );
  const content = h(
    'div',
    { class: 'formula-content', id: `formula-content-${formula.id}`, hidden: !initiallyExpanded },
    h('div', { class: 'formula-math' }, (Array.isArray(formula.latex) ? formula.latex : [formula.latex]).map((tex) => renderLatex(tex, true))),
    formula.conditions && h('p', { class: 'formula-conditions' }, richText(formula.conditions)),
    formula.variables?.length
      ? h(
          'dl',
          { class: 'formula-vars' },
          formula.variables.map((v) => [h('dt', {}, renderLatex(v.symbol)), h('dd', {}, richText(v.meaning))]),
        )
      : null,
    h(
      'p',
      { class: 'formula-source muted small' },
      `Sursa: Lecția ${lessonPosition(lesson)} — ${lesson.title}, pagina ${formula.sourcePage}. `,
      h('a', { href: lessonHref(lesson.id) }, 'Deschide lecția'),
    ),
  );

  titleButton.addEventListener('click', () => {
    const expanded = titleButton.getAttribute('aria-expanded') === 'true';
    titleButton.setAttribute('aria-expanded', String(!expanded));
    content.hidden = expanded;
  });

  const card = h(
    'article',
    { class: 'formula-card', 'aria-labelledby': `formula-${formula.id}` },
    h('h3', { id: `formula-${formula.id}`, class: 'formula-name' }, titleButton),
    content,
  );
  card.addEventListener('click', (event) => {
    if (event.target.closest('a, button')) return;
    if (titleButton.getAttribute('aria-expanded') === 'true') titleButton.click();
  });
  return card;
}

export function createFormulasPage() {
  const input = h('input', {
    type: 'search',
    id: 'formula-search',
    class: 'search-input',
    placeholder: 'De exemplu: Pitagora, aria trapezului, distanța…',
    autocomplete: 'off',
    spellcheck: 'false',
  });
  const count = h('p', { class: 'muted small', 'aria-live': 'polite' });
  const list = h('div', { class: 'formula-groups' });

  function render() {
    const query = input.value;
    let shown = 0;
    const groups = [];
    for (const lesson of lessons) {
      const items = formulas.filter(
        (f) =>
          f.lessonId === lesson.id &&
          matches([f.name, f.keywords || [], stripMath(f.conditions), (f.variables || []).map((v) => stripMath(v.meaning)), lesson.title], query),
      );
      if (!items.length) continue;
      shown += items.length;
      const groupContentId = `formula-group-content-${lesson.id}`;
      const groupContent = h('div', { class: 'formula-grid', id: groupContentId }, items.map((f, index) => formulaCard(f, lesson, index === 0)));
      const groupToggle = h(
        'button',
        { type: 'button', class: 'btn btn-ghost btn-small formula-group-toggle', 'aria-expanded': 'true', 'aria-controls': groupContentId },
        'Ascunde formulele',
      );
      groupToggle.addEventListener('click', () => {
        const expanded = groupToggle.getAttribute('aria-expanded') === 'true';
        groupToggle.setAttribute('aria-expanded', String(!expanded));
        groupContent.hidden = expanded;
        groupToggle.textContent = expanded ? 'Arată formulele' : 'Ascunde formulele';
      });
      groups.push(
        h(
          'section',
          { class: 'formula-group', 'aria-labelledby': `group-${lesson.id}` },
          h(
            'div',
            { class: 'formula-group-head' },
            h(
              'h2',
              { id: `group-${lesson.id}` },
              h('span', { class: 'lesson-number' }, `Lecția ${lessonPosition(lesson)}`),
              ' ',
              h(
                'span',
                { class: 'formula-group-title' },
                lesson.title.replace(/\bPartea\s+(\d+)\b/g, (_, part) => `Partea\u00a0${part}`),
              ),
            ),
            groupToggle,
          ),
          groupContent,
        ),
      );
    }
    list.replaceChildren(...groups);
    if (!shown) {
      list.append(
        h(
          'div',
          { class: 'empty-state' },
          h('p', {}, h('strong', {}, query.trim() ? `Nicio formulă găsită pentru „${query.trim()}”.` : 'Nu există formule disponibile.')),
          h('p', { class: 'muted' }, 'Încearcă un alt termen, de exemplu „arie”, „Pitagora” sau „cerc”.'),
        ),
      );
    }
    count.textContent = `${shown} ${shown === 1 ? 'formulă' : 'formule'}`;
  }
  input.addEventListener('input', render);
  render();

  const known = formulas.filter((f) => getLesson(f.lessonId)).length;

  return {
    title: 'Toate formulele',
    el: h(
      'div',
      { class: 'container page formulas-page' },
      h('h1', { id: 'page-title' }, 'Toate formulele'),
      h('p', { class: 'lead' }, `Colecția celor ${known} formule din fișele de teorie, cu trimitere la lecția și pagina sursă.`),
      h('div', { class: 'search' }, h('label', { for: 'formula-search', class: 'search-label' }, 'Caută o formulă'), input, count),
      list,
    ),
  };
}
