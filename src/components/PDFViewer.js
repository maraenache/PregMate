import { h } from '../utils/dom.js';
import { assetUrl } from '../data/index.js';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

const ZOOM_STEPS = [0.5, 0.75, 1, 1.25, 1.5, 2, 2.5, 3];
const PAGE_GAP = 16;

let pdfjsPromise = null;
function loadPdfjs() {
  pdfjsPromise ??= import('pdfjs-dist').then((pdfjs) => {
    pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;
    return pdfjs;
  });
  return pdfjsPromise;
}

export function createPDFViewer({ url, title }) {
  const prevButton = h('button', { type: 'button', class: 'btn btn-icon', 'aria-label': 'Pagina anterioară', disabled: true }, '‹');
  const nextButton = h('button', { type: 'button', class: 'btn btn-icon', 'aria-label': 'Pagina următoare', disabled: true }, '›');
  const pageLabel = h('span', { class: 'pdf-page-label', 'aria-live': 'polite' }, 'Pagina – din –');
  const zoomOutButton = h('button', { type: 'button', class: 'btn btn-icon', 'aria-label': 'Micșorează', disabled: true }, '−');
  const zoomInButton = h('button', { type: 'button', class: 'btn btn-icon', 'aria-label': 'Mărește', disabled: true }, '+');
  const zoomLabel = h('span', { class: 'pdf-zoom-label', 'aria-live': 'polite' }, '100%');
  const fitButton = h('button', { type: 'button', class: 'btn btn-ghost btn-small', disabled: true }, 'Potrivește la lățime');
  const status = h(
    'div',
    { class: 'pdf-status', role: 'status' },
    h('span', { class: 'spinner', 'aria-hidden': 'true' }),
    'Se încarcă documentul…',
  );
  const pagesEl = h('div', { class: 'pdf-pages', tabindex: '0', 'aria-label': `Paginile documentului „${title}”` }, status);

  const el = h(
    'section',
    { class: 'pdf-viewer', 'aria-label': `Fișa de teorie: ${title}` },
    h(
      'div',
      { class: 'pdf-toolbar', role: 'toolbar', 'aria-label': 'Controale document' },
      h('div', { class: 'pdf-toolbar-group' }, prevButton, pageLabel, nextButton),
      h('div', { class: 'pdf-toolbar-group' }, zoomOutButton, zoomLabel, zoomInButton, fitButton),
    ),
    pagesEl,
  );

  let pdf = null;
  let loadingTask = null;
  let pageViewports = [];
  let wrappers = [];
  let zoom = 1;
  let current = 1;
  let generation = 0;
  let renderTasks = [];
  let destroyed = false;
  let lastWidth = 0;
  let resizeTimer = null;

  const numPages = () => pageViewports.length;

  function updateControls() {
    const n = numPages();
    pageLabel.textContent = n ? `Pagina ${current} din ${n}` : 'Pagina – din –';
    prevButton.disabled = !n || current <= 1;
    nextButton.disabled = !n || current >= n;
    zoomOutButton.disabled = !n || zoom <= ZOOM_STEPS[0];
    zoomInButton.disabled = !n || zoom >= ZOOM_STEPS[ZOOM_STEPS.length - 1];
    fitButton.disabled = !n || zoom === 1;
    zoomLabel.textContent = `${Math.round(zoom * 100)}%`;
  }

  function availableWidth() {
    const style = getComputedStyle(pagesEl);
    const padding = parseFloat(style.paddingLeft) + parseFloat(style.paddingRight);
    return Math.max(160, pagesEl.clientWidth - padding);
  }

  function layout() {
    const width = availableWidth();
    lastWidth = pagesEl.clientWidth;
    pageViewports.forEach((base, i) => {
      const scale = (width / base.width) * zoom;
      wrappers[i].style.width = `${Math.floor(base.width * scale)}px`;
      wrappers[i].style.height = `${Math.floor(base.height * scale)}px`;
    });
  }

  async function renderAll() {
    const gen = ++generation;
    renderTasks.forEach((task) => task.cancel());
    renderTasks = [];
    layout();
    scrollToPage(current, false);
    const width = availableWidth();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    for (let i = 1; i <= numPages(); i++) {
      const page = await pdf.getPage(i);
      if (gen !== generation || destroyed) return;
      const base = page.getViewport({ scale: 1 });
      const viewport = page.getViewport({ scale: (width / base.width) * zoom });
      const canvas = document.createElement('canvas');
      canvas.width = Math.floor(viewport.width * dpr);
      canvas.height = Math.floor(viewport.height * dpr);
      canvas.style.width = `${Math.floor(viewport.width)}px`;
      canvas.style.height = `${Math.floor(viewport.height)}px`;
      canvas.setAttribute('role', 'img');
      canvas.setAttribute('aria-label', `Pagina ${i} din ${numPages()} a fișei „${title}”`);
      const task = page.render({
        canvasContext: canvas.getContext('2d'),
        viewport,
        transform: dpr !== 1 ? [dpr, 0, 0, dpr, 0, 0] : undefined,
      });
      renderTasks.push(task);
      try {
        await task.promise;
      } catch (error) {
        if (error?.name === 'RenderingCancelledException') return;
        throw error;
      }
      if (gen !== generation || destroyed) return;
      wrappers[i - 1].replaceChildren(canvas);
    }
  }

  function scrollToPage(n, smooth = true) {
    const wrapper = wrappers[n - 1];
    if (!wrapper) return;
    pagesEl.scrollTo({ top: wrapper.offsetTop - PAGE_GAP, behavior: smooth ? 'smooth' : 'auto' });
    current = n;
    updateControls();
  }

  function onScroll() {
    if (!wrappers.length) return;
    const marker = pagesEl.scrollTop + pagesEl.clientHeight / 3;
    let page = 1;
    wrappers.forEach((wrapper, i) => {
      if (wrapper.offsetTop <= marker) page = i + 1;
    });
    if (page !== current) {
      current = page;
      updateControls();
    }
  }

  function setZoom(value) {
    zoom = value;
    updateControls();
    renderAll().catch(showError);
  }

  function showError(error) {
    if (destroyed) return;
    console.error('Eroare la încărcarea PDF-ului:', error);
    pagesEl.replaceChildren(
      h(
        'div',
        { class: 'pdf-status pdf-error', role: 'alert' },
        h('strong', {}, 'Documentul nu a putut fi afișat.'),
        h('p', {}, 'Verifică conexiunea la internet și reîncarcă pagina sau deschide direct fișierul PDF original.'),
        h('a', { class: 'btn btn-secondary', href: assetUrl(url), target: '_blank', rel: 'noopener' }, 'Deschide PDF-ul original'),
      ),
    );
    pageViewports = [];
    wrappers = [];
    updateControls();
  }

  prevButton.addEventListener('click', () => scrollToPage(Math.max(1, current - 1)));
  nextButton.addEventListener('click', () => scrollToPage(Math.min(numPages(), current + 1)));
  zoomInButton.addEventListener('click', () => setZoom(ZOOM_STEPS.find((step) => step > zoom) ?? zoom));
  zoomOutButton.addEventListener('click', () => setZoom([...ZOOM_STEPS].reverse().find((step) => step < zoom) ?? zoom));
  fitButton.addEventListener('click', () => setZoom(1));
  pagesEl.addEventListener('scroll', () => requestAnimationFrame(onScroll), { passive: true });

  const resizeObserver = new ResizeObserver(() => {
    if (!numPages() || Math.abs(pagesEl.clientWidth - lastWidth) < 8) return;
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => renderAll().catch(showError), 200);
  });

  async function load() {
    try {
      const pdfjs = await loadPdfjs();
      if (destroyed) return;
      loadingTask = pdfjs.getDocument({
        url: assetUrl(url),
        cMapUrl: assetUrl('pdfjs/cmaps/'),
        cMapPacked: true,
        standardFontDataUrl: assetUrl('pdfjs/standard_fonts/'),
      });
      pdf = await loadingTask.promise;
      if (destroyed) return;
      pageViewports = [];
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        pageViewports.push(page.getViewport({ scale: 1 }));
      }
      if (destroyed) return;
      wrappers = pageViewports.map((_, i) =>
        h('div', { class: 'pdf-page', 'data-page': String(i + 1) }, h('span', { class: 'pdf-page-placeholder' }, `Pagina ${i + 1}…`)),
      );
      pagesEl.replaceChildren(...wrappers);
      current = 1;
      updateControls();
      resizeObserver.observe(pagesEl);
      await renderAll();
    } catch (error) {
      showError(error);
    }
  }

  load();

  return {
    el,
    goToPage(n) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      if (n >= 1 && n <= numPages()) scrollToPage(n);
    },
    destroy() {
      destroyed = true;
      generation++;
      clearTimeout(resizeTimer);
      renderTasks.forEach((task) => task.cancel());
      resizeObserver.disconnect();
      loadingTask?.destroy();
    },
  };
}
