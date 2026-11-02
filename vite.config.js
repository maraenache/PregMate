import { defineConfig } from 'vite';
import { validateContent, formatReport } from './scripts/validate-content.mjs';

function contentValidation() {
  let isBuild = false;
  return {
    name: 'content-validation',
    configResolved(config) {
      isBuild = config.command === 'build';
    },
    async buildStart() {
      const report = await validateContent();
      if (report.errors.length || report.warnings.length) {
        const text = formatReport(report);
        if (report.errors.length && isBuild) this.error(text);
        else this.warn(text);
      }
    },
  };
}

// Relative base: works on GitHub Pages under any repository subpath (hash routing keeps the document at index.html).
export default defineConfig({
  base: process.env.VITE_BASE || './',
  build: {
    target: 'es2022',
  },
  plugins: [contentValidation()],
});
