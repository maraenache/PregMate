import { h } from '../utils/dom.js';
import { assetUrl } from '../data/index.js';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

const ZOOM_STEPS = [0.5, 0.75, 1, 1.25, 1.5, 2, 2.5, 3];
const MIN_ZOOM = ZOOM_STEPS[0];
const MAX_ZOOM = ZOOM_STEPS[ZOOM_STEPS.length - 1];
const PAGE_GAP = 16;

let pdfjsPromise = null;
function loadPdfjs() {
  pdfjsPromise ??= import('pdfjs-dist').then((pdfjs) => {
    pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;
    return pdfjs;
  });
  return pdfjsPromise;
}

export function createPDFViewer({ url, title, originalUrl = assetUrl(url) }) {
  const status = h(
    'div',
    { class: 'pdf-status', role: 'status' },
    h('span', { class: 'spinner', 'aria-hidden': 'true' }),
    'Se încarcă documentul…',
  );
  const pagesEl = h('div', { class: 'pdf-pages', tabindex: '0', 'aria-label': `Paginile documentului „${title}”` }, status);
  const originalLink = h('a', {
    class: 'pdf-original-link icon-action',
    href: originalUrl,
    target: '_blank',
    rel: 'noopener',
    'aria-label': 'Deschide PDF-ul original',
    title: 'Deschide PDF-ul original',
  });
  originalLink.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M14 4h6v6M20 4l-9 9"/><path d="M18 13v6a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h6"/></svg>';

  const el = h(
    'section',
    { class: 'pdf-viewer', 'aria-label': `Fișa de teorie: ${title}` },
    h('div', { class: 'pdf-toolbar' }, originalLink),
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
    }
  }

  function setZoom(value) {
    zoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, value));
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
  }

  let pinchStartDistance = 0;
  let pinchStartZoom = zoom;
  let pinchChanged = false;
  const touchDistance = (touches) => Math.hypot(
    touches[0].clientX - touches[1].clientX,
    touches[0].clientY - touches[1].clientY,
  );
  pagesEl.addEventListener('touchstart', (event) => {
    if (event.touches.length !== 2) return;
    pinchStartDistance = touchDistance(event.touches);
    pinchStartZoom = zoom;
    pinchChanged = false;
  }, { passive: true });
  pagesEl.addEventListener('touchmove', (event) => {
    if (event.touches.length !== 2 || !pinchStartDistance) return;
    event.preventDefault();
    zoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, pinchStartZoom * touchDistance(event.touches) / pinchStartDistance));
    layout();
    pinchChanged = true;
  }, { passive: false });
  const finishPinch = () => {
    if (!pinchStartDistance) return;
    pinchStartDistance = 0;
    if (pinchChanged) setZoom(zoom);
  };
  pagesEl.addEventListener('touchend', finishPinch, { passive: true });
  pagesEl.addEventListener('touchcancel', finishPinch, { passive: true });
  pagesEl.addEventListener('wheel', (event) => {
    if (!event.ctrlKey || !numPages()) return;
    event.preventDefault();
    setZoom(zoom * Math.exp(-event.deltaY * 0.002));
  }, { passive: false });
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
      resizeObserver.observe(pagesEl);
      await renderAll();
    } catch (error) {
      showError(error);
    }
  }

  load();

  return {
    el,
    refresh() {
      return renderAll().catch(showError);
    },
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
