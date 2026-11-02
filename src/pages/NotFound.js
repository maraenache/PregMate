import { h } from '../utils/dom.js';
import { dashboardHref } from '../utils/router.js';

export function createNotFound(message = 'Pagina căutată nu există.') {
  return {
    title: 'Pagină inexistentă',
    el: h(
      'div',
      { class: 'container page narrow' },
      h('h1', { id: 'page-title' }, 'Pagină inexistentă'),
      h('p', {}, message),
      h('a', { class: 'btn btn-primary', href: dashboardHref() }, 'Înapoi la lecții'),
    ),
  };
}
