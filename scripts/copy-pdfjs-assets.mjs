import { cp, mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const pdfjsRoot = dirname(require.resolve('pdfjs-dist/package.json'));
const target = join(root, 'public', 'pdfjs');

await mkdir(target, { recursive: true });
for (const dir of ['cmaps', 'standard_fonts']) {
  await cp(join(pdfjsRoot, dir), join(target, dir), { recursive: true });
}
console.log('pdf.js: cmaps și standard_fonts copiate în public/pdfjs/');
