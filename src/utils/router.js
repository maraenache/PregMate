export function parseHash(hash) {
  const path = String(hash || '').replace(/^#/, '');
  const parts = path.split('/').filter(Boolean).map((part) => {
    try {
      return decodeURIComponent(part);
    } catch {
      return part;
    }
  });
  if (parts.length === 0) return { name: 'dashboard' };
  if (parts[0] === 'lectie' && parts[1] && parts.length === 2) return { name: 'lesson', id: parts[1] };
  if (parts[0] === 'formule' && parts.length === 1) return { name: 'formulas' };
  if (parts[0] === 'teste' && parts.length === 1) return { name: 'tests' };
  return { name: 'notfound' };
}

export const lessonHref = (id) => `#/lectie/${encodeURIComponent(id)}`;
export const dashboardHref = () => '#/';
export const formulasHref = () => '#/formule';
export const testsHref = () => '#/teste';
