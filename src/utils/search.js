export function normalize(text) {
  return String(text ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

export function tokenize(query) {
  return normalize(query).split(' ').filter(Boolean);
}

// Light Romanian stemming: drop trailing vowels so "inaltime" also matches "inaltimii", "mediana" matches "mediane".
function stem(token) {
  return token.length >= 5 ? token.replace(/[aeiu]+$/, '') : token;
}

export function matches(haystackParts, query) {
  const tokens = tokenize(query);
  if (!tokens.length) return true;
  const haystack = normalize(haystackParts.flat(Infinity).join(' '));
  return tokens.every((token) => haystack.includes(stem(token)));
}

export function lessonSearchText(lesson) {
  return [lesson.title, lesson.description, lesson.keywords || [], lesson.concepts || [], `lectia ${lesson.order}`];
}

export function searchLessons(lessons, query) {
  return lessons.filter((lesson) => matches(lessonSearchText(lesson), query));
}
