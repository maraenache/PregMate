import { readFile, access } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import katex from 'katex';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const QUESTIONS_PER_LESSON = 10;
const OPTIONS_PER_QUESTION = 4;
const INLINE_MATH = /\\\((.+?)\\\)/g;

async function readJson(rel, errors) {
  try {
    return JSON.parse(await readFile(join(root, rel), 'utf8'));
  } catch (error) {
    errors.push(`${rel}: nu poate fi citit (${error.message})`);
    return null;
  }
}

async function pdfPageCount(path) {
  const { getDocument } = await import('pdfjs-dist/legacy/build/pdf.mjs');
  const data = new Uint8Array(await readFile(path));
  const doc = await getDocument({ data, verbosity: 0 }).promise;
  const n = doc.numPages;
  await doc.destroy();
  return n;
}

function checkTex(tex, where, errors) {
  try {
    katex.renderToString(tex, { throwOnError: true, strict: 'ignore' });
  } catch (error) {
    errors.push(`${where}: LaTeX invalid „${tex}” (${error.message})`);
  }
}

function checkInlineMath(text, where, errors) {
  for (const match of String(text).matchAll(INLINE_MATH)) checkTex(match[1], where, errors);
}

const isNonEmptyString = (v) => typeof v === 'string' && v.trim().length > 0;

export async function validateContent() {
  const errors = [];
  const warnings = [];
  const lessons = await readJson('src/data/lessons.json', errors);
  const questions = await readJson('src/data/questions.json', errors);
  const formulas = await readJson('src/data/formulas.json', errors);
  const pageCounts = new Map();
  const stats = { lessons: 0, questions: 0, formulas: 0 };

  if (Array.isArray(lessons)) {
    stats.lessons = lessons.length;
    const ids = new Set();
    const orders = new Set();
    for (const [i, lesson] of lessons.entries()) {
      const where = `lessons.json[${i}] (${lesson?.id ?? '?'})`;
      if (!isNonEmptyString(lesson.id) || !/^[a-z0-9-]+$/.test(lesson.id)) errors.push(`${where}: id lipsă sau invalid`);
      if (ids.has(lesson.id)) errors.push(`${where}: id duplicat`);
      ids.add(lesson.id);
      if (!Number.isFinite(lesson.order)) errors.push(`${where}: „order” lipsă sau nenumeric`);
      if (orders.has(lesson.order)) errors.push(`${where}: „order” duplicat (${lesson.order})`);
      orders.add(lesson.order);
      for (const field of ['title', 'description', 'pdf']) {
        if (!isNonEmptyString(lesson[field])) errors.push(`${where}: câmpul „${field}” lipsește`);
      }
      if (!Array.isArray(lesson.keywords) || !lesson.keywords.length) errors.push(`${where}: „keywords” trebuie să fie o listă nevidă`);
      if (isNonEmptyString(lesson.pdf)) {
        const pdfPath = join(root, 'public', lesson.pdf);
        try {
          await access(pdfPath);
          pageCounts.set(lesson.id, await pdfPageCount(pdfPath));
        } catch (error) {
          errors.push(`${where}: PDF lipsă sau ilizibil: public/${lesson.pdf} (${error.code ?? error.message})`);
        }
      }
    }
  } else if (lessons) errors.push('lessons.json: trebuie să fie o listă');

  const lessonIds = new Set((lessons || []).map((l) => l.id));

  const checkPage = (page, lessonId, where) => {
    if (!Number.isInteger(page) || page < 1) errors.push(`${where}: „sourcePage” invalid`);
    else if (pageCounts.has(lessonId) && page > pageCounts.get(lessonId)) {
      errors.push(`${where}: pagina ${page} depășește numărul de pagini al PDF-ului (${pageCounts.get(lessonId)})`);
    }
  };

  if (Array.isArray(questions)) {
    stats.questions = questions.length;
    const ids = new Set();
    const perLesson = new Map();
    for (const [i, q] of questions.entries()) {
      const where = `questions.json[${i}] (${q?.id ?? '?'})`;
      if (!isNonEmptyString(q.id)) errors.push(`${where}: id lipsă`);
      if (ids.has(q.id)) errors.push(`${where}: id duplicat`);
      ids.add(q.id);
      if (!lessonIds.has(q.lessonId)) errors.push(`${where}: lessonId necunoscut „${q.lessonId}”`);
      perLesson.set(q.lessonId, (perLesson.get(q.lessonId) || 0) + 1);
      if (!isNonEmptyString(q.question)) errors.push(`${where}: textul întrebării lipsește`);
      if (!Array.isArray(q.options) || q.options.length !== OPTIONS_PER_QUESTION || !q.options.every(isNonEmptyString)) {
        errors.push(`${where}: trebuie să aibă exact ${OPTIONS_PER_QUESTION} variante nevide`);
      } else if (new Set(q.options.map((o) => o.trim())).size !== q.options.length) {
        errors.push(`${where}: variante de răspuns duplicate`);
      }
      if (!Number.isInteger(q.correctIndex) || q.correctIndex < 0 || q.correctIndex >= OPTIONS_PER_QUESTION) {
        errors.push(`${where}: correctIndex invalid (${q.correctIndex})`);
      }
      if (!isNonEmptyString(q.explanation)) errors.push(`${where}: explicația lipsește`);
      checkPage(q.sourcePage, q.lessonId, where);
      [q.question, q.explanation, ...(q.options || [])].forEach((t) => checkInlineMath(t, where, errors));
    }
    for (const id of lessonIds) {
      const n = perLesson.get(id) || 0;
      if (n !== QUESTIONS_PER_LESSON) errors.push(`Lecția „${id}”: are ${n} întrebări, trebuie exact ${QUESTIONS_PER_LESSON}`);
    }
  } else if (questions) errors.push('questions.json: trebuie să fie o listă');

  if (Array.isArray(formulas)) {
    stats.formulas = formulas.length;
    const ids = new Set();
    for (const [i, f] of formulas.entries()) {
      const where = `formulas.json[${i}] (${f?.id ?? '?'})`;
      if (!isNonEmptyString(f.id)) errors.push(`${where}: id lipsă`);
      if (ids.has(f.id)) errors.push(`${where}: id duplicat`);
      ids.add(f.id);
      if (!lessonIds.has(f.lessonId)) errors.push(`${where}: lessonId necunoscut „${f.lessonId}”`);
      if (!isNonEmptyString(f.name)) errors.push(`${where}: numele lipsește`);
      const texList = Array.isArray(f.latex) ? f.latex : [f.latex];
      if (!texList.length || !texList.every(isNonEmptyString)) errors.push(`${where}: „latex” lipsește`);
      else texList.forEach((tex) => checkTex(tex, where, errors));
      for (const v of f.variables || []) {
        checkTex(v.symbol, where, errors);
        checkInlineMath(v.meaning, where, errors);
      }
      if (f.conditions) checkInlineMath(f.conditions, where, errors);
      checkPage(f.sourcePage, f.lessonId, where);
    }
  } else if (formulas) errors.push('formulas.json: trebuie să fie o listă');

  return { errors, warnings, stats };
}

export function formatReport({ errors, warnings }) {
  return [
    ...errors.map((e) => `✗ ${e}`),
    ...warnings.map((w) => `! ${w}`),
  ].join('\n');
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const report = await validateContent();
  const { stats } = report;
  if (report.errors.length || report.warnings.length) console.log(formatReport(report));
  console.log(`Validare conținut: ${stats.lessons} lecții, ${stats.questions} întrebări, ${stats.formulas} formule — ${report.errors.length} erori.`);
  process.exit(report.errors.length ? 1 : 0);
}
