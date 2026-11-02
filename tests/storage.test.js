import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sanitize } from '../src/utils/storage.js';

test('sanitize drops malformed data', () => {
  const state = sanitize({
    completed: { a: true, b: 'yes', c: false },
    scores: { a: { correct: 7, total: 10 }, b: { correct: 11, total: 10 }, c: 'x' },
    lastLessonId: 42,
    theme: 'blue',
  });
  assert.deepEqual(state, { completed: { a: true }, scores: { a: { correct: 7, total: 10 } }, lastLessonId: null, theme: null });
});

test('sanitize handles non-objects', () => {
  for (const raw of [null, 'x', 5, []]) {
    assert.deepEqual(sanitize(raw), { completed: {}, scores: {}, lastLessonId: null, theme: null });
  }
});
