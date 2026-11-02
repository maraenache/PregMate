import lessonsData from './lessons.json';
import questionsData from './questions.json';
import formulasData from './formulas.json';

export const lessons = [...lessonsData].sort((a, b) => a.order - b.order);
export const formulas = formulasData;

const lessonById = new Map(lessons.map((lesson) => [lesson.id, lesson]));

export const getLesson = (id) => lessonById.get(id) ?? null;

export const getQuestions = (lessonId) => questionsData.filter((q) => q.lessonId === lessonId);

export function getNeighbors(id) {
  const index = lessons.findIndex((lesson) => lesson.id === id);
  return {
    previous: index > 0 ? lessons[index - 1] : null,
    next: index >= 0 && index < lessons.length - 1 ? lessons[index + 1] : null,
  };
}

export const lessonPosition = (lesson) => lessons.indexOf(lesson) + 1;

export const assetUrl = (path) => new URL(`${import.meta.env.BASE_URL}${path}`, window.location.href).href;
