import katex from 'katex';
import 'katex/dist/katex.min.css';

export function renderLatex(latex, displayMode = false) {
  const el = document.createElement('span');
  el.className = displayMode ? 'math math-display' : 'math';
  try {
    katex.render(latex, el, { displayMode, throwOnError: true, output: 'htmlAndMathml', strict: 'ignore' });
  } catch {
    el.textContent = latex;
  }
  return el;
}

const INLINE_MATH = /\\\((.+?)\\\)/g;

export function richText(text, tag = 'span') {
  const el = document.createElement(tag);
  const source = String(text ?? '');
  let last = 0;
  for (const match of source.matchAll(INLINE_MATH)) {
    if (match.index > last) el.append(source.slice(last, match.index));
    el.append(renderLatex(match[1]));
    last = match.index + match[0].length;
  }
  if (last < source.length) el.append(source.slice(last));
  return el;
}

export function stripMath(text) {
  return String(text ?? '').replace(INLINE_MATH, ' $1 ');
}
