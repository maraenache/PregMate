const STORAGE_KEY = 'recapitulare-geometrie:v1';

function emptyState() {
  return { completed: {}, scores: {}, lastLessonId: null, theme: null };
}

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

export function sanitize(raw) {
  const state = emptyState();
  if (!isPlainObject(raw)) return state;
  if (isPlainObject(raw.completed)) {
    for (const [id, value] of Object.entries(raw.completed)) {
      if (value === true) state.completed[id] = true;
    }
  }
  if (isPlainObject(raw.scores)) {
    for (const [id, score] of Object.entries(raw.scores)) {
      if (
        isPlainObject(score) &&
        Number.isInteger(score.correct) &&
        Number.isInteger(score.total) &&
        score.total > 0 &&
        score.correct >= 0 &&
        score.correct <= score.total
      ) {
        state.scores[id] = { correct: score.correct, total: score.total };
      }
    }
  }
  if (typeof raw.lastLessonId === 'string') state.lastLessonId = raw.lastLessonId;
  if (raw.theme === 'light' || raw.theme === 'dark') state.theme = raw.theme;
  return state;
}

function getStorage() {
  try {
    const storage = globalThis.localStorage;
    const probe = '__recapitulare_geometrie_probe__';
    storage.setItem(probe, '1');
    storage.removeItem(probe);
    return storage;
  } catch {
    return null;
  }
}

const storage = getStorage();
let state = load();

function load() {
  if (!storage) return emptyState();
  try {
    return sanitize(JSON.parse(storage.getItem(STORAGE_KEY) || 'null'));
  } catch {
    return emptyState();
  }
}

function persist() {
  if (!storage) return;
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Quota exceeded or storage revoked: keep working with in-memory state.
  }
}

export const isPersistent = () => storage !== null;

export const isCompleted = (lessonId) => state.completed[lessonId] === true;

export function setCompleted(lessonId, completed) {
  if (completed) state.completed[lessonId] = true;
  else delete state.completed[lessonId];
  persist();
}

export const getScore = (lessonId) => state.scores[lessonId] ?? null;

export function setScore(lessonId, correct, total) {
  state.scores[lessonId] = { correct, total };
  persist();
}

export const getLastLessonId = () => state.lastLessonId;

export function setLastLessonId(lessonId) {
  state.lastLessonId = lessonId;
  persist();
}

export const getTheme = () => state.theme;

export function setTheme(theme) {
  state.theme = theme === 'dark' || theme === 'light' ? theme : null;
  persist();
}
