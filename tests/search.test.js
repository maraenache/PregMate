import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalize, searchLessons } from '../src/utils/search.js';

const lessons = [
  { id: 'a', order: 1, title: 'Triunghiuri dreptunghice', description: 'Teorema înălțimii', keywords: ['Pitagora'] },
  { id: 'b', order: 2, title: 'Cercul', description: 'Lungimea cercului', keywords: ['disc'] },
];

test('normalize removes Romanian diacritics (comma and cedilla forms)', () => {
  assert.equal(normalize('Înălțime ȘȚ şţ ăâî'), 'inaltime st st aai');
});

test('search is diacritics- and case-insensitive', () => {
  assert.deepEqual(searchLessons(lessons, 'inaltime').map((l) => l.id), ['a']);
  assert.deepEqual(searchLessons(lessons, 'PITAGORA').map((l) => l.id), ['a']);
  assert.deepEqual(searchLessons(lessons, 'cerc').map((l) => l.id), ['b']);
});

test('empty query returns all, unknown returns none', () => {
  assert.equal(searchLessons(lessons, '  ').length, 2);
  assert.equal(searchLessons(lessons, 'xyz').length, 0);
});
