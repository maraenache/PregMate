import { h } from '../utils/dom.js';
import { formulas, getLesson, lessonPosition, lessons } from '../data/index.js';
import { renderLatex, richText, stripMath } from '../utils/math.js';
import { matches } from '../utils/search.js';
import { lessonHref } from '../utils/router.js';

const CHEVRONS = {
  up: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="m6 14 6-6 6 6"/></svg>',
  down: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="m6 10 6 6 6-6"/></svg>',
};

const disclosureAnimations = new WeakMap();

function animateDisclosure(element, expanded) {
  disclosureAnimations.get(element)?.cancel();
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!element.animate || reduceMotion) {
    element.hidden = !expanded;
    return;
  }

  if (expanded) {
    element.hidden = false;
    const height = element.scrollHeight;
    const animation = element.animate(
      [{ height: '0px', opacity: 0, overflow: 'hidden' }, { height: `${height}px`, opacity: 1, overflow: 'hidden' }],
      { duration: 220, easing: 'ease-out' },
    );
    disclosureAnimations.set(element, animation);
    animation.onfinish = () => {
      if (disclosureAnimations.get(element) !== animation) return;
      element.style.removeProperty('height');
      element.style.removeProperty('opacity');
      element.style.removeProperty('overflow');
      disclosureAnimations.delete(element);
    };
    return;
  }

  const height = element.getBoundingClientRect().height;
  const animation = element.animate(
    [{ height: `${height}px`, opacity: 1, overflow: 'hidden' }, { height: '0px', opacity: 0, overflow: 'hidden' }],
    { duration: 180, easing: 'ease-in' },
  );
  disclosureAnimations.set(element, animation);
  animation.onfinish = () => {
    if (disclosureAnimations.get(element) !== animation) return;
    element.hidden = true;
    element.style.removeProperty('height');
    element.style.removeProperty('opacity');
    element.style.removeProperty('overflow');
    disclosureAnimations.delete(element);
  };
}

function formulaCard(formula, lesson, initiallyExpanded = false) {
  const chevron = h('span', { class: 'formula-chevron', 'aria-hidden': 'true' });
  chevron.innerHTML = initiallyExpanded ? CHEVRONS.up : CHEVRONS.down;
  const titleButton = h(
    'button',
    { type: 'button', class: 'formula-toggle', 'aria-expanded': String(initiallyExpanded), 'aria-controls': `formula-content-${formula.id}` },
    formula.name,
    chevron,
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

  const toggleFormula = () => {
    const expanded = titleButton.getAttribute('aria-expanded') === 'true';
    titleButton.setAttribute('aria-expanded', String(!expanded));
    animateDisclosure(content, !expanded);
    chevron.innerHTML = expanded ? CHEVRONS.down : CHEVRONS.up;
  };
  titleButton.addEventListener('click', toggleFormula);
  chevron.addEventListener('click', (event) => {
    event.preventDefault();
    event.stopPropagation();
    toggleFormula();
  });

  const card = h(
    'article',
    { class: 'formula-card', 'aria-labelledby': `formula-${formula.id}` },
    h('h3', { id: `formula-${formula.id}`, class: 'formula-name' }, titleButton),
    content,
  );
  card.addEventListener('click', (event) => {
    if (event.target.closest('a, button')) return;
    titleButton.click();
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
    const compactView = window.matchMedia('(max-width: 600px)').matches;
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
      const groupContent = h('div', { class: 'formula-grid', id: groupContentId }, items.map((f, index) => formulaCard(f, lesson, !compactView || index === 0)));
      const groupToggle = h(
        'button',
        { type: 'button', class: 'btn btn-ghost btn-small formula-group-toggle', 'aria-expanded': 'true', 'aria-controls': groupContentId },
        'Ascunde formulele',
      );
      groupToggle.addEventListener('click', () => {
        const expanded = groupToggle.getAttribute('aria-expanded') === 'true';
        groupToggle.setAttribute('aria-expanded', String(!expanded));
        animateDisclosure(groupContent, !expanded);
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
