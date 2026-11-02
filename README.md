# Recapitulare Geometrie

Site static (Vite + JavaScript simplu) pentru recapitularea geometriei: 13 lecții bazate pe fișele de teorie PDF, fiecare cu un test de 10 întrebări grilă, plus pagina „Toate formulele”. Nu are backend: progresul se salvează doar în `localStorage`, în browserul elevului.

## Rulare locală

```bash
npm install
npm run dev        # server de dezvoltare
npm test           # teste unitare (căutare, localStorage)
npm run validate   # validarea conținutului (JSON + PDF-uri)
npm run build      # validare + build în dist/
npm run preview    # servește dist/ local
```

Este nevoie de Node.js 20 sau mai nou.

## Structură

- `public/pdf/` — fișele PDF originale (nemodificate)
- `src/data/lessons.json` — lecțiile (`id`, `order`, `title`, `description`, `pdf`, `keywords`, `concepts`)
- `src/data/questions.json` — câte 10 întrebări pentru fiecare lecție
- `src/data/formulas.json` — formulele afișate în „Toate formulele”
- `src/components/`, `src/pages/`, `src/utils/` — codul aplicației
- `scripts/validate-content.mjs` — validarea conținutului, rulată la `npm run build` și la pornirea serverului de dezvoltare
- `CONTENT_VALIDATION.md` — raportul de validare a conținutului educațional

Rutele folosesc hash (`#/lectie/unghiuri`, `#/formule`), deci reîncărcarea paginii și linkurile directe funcționează pe GitHub Pages fără configurări suplimentare. `base` din Vite este relativ (`./`), deci site-ul funcționează sub orice subcale de repository.

## Ordinea lecțiilor

Ordinea este dată de câmpul `order` din `lessons.json`. Pentru a reordona, modifici doar valorile `order`; numerotarea „Lecția N” și navigarea anterior/următor se recalculează automat.

## Adăugarea unei lecții noi

1. Copiezi PDF-ul în `public/pdf/` (de exemplu `public/pdf/poligoane.pdf`).
2. Adaugi lecția în `src/data/lessons.json`, cu un `id` unic și stabil (litere mici, cifre și cratimă), `order`, `title`, `description`, `pdf: "pdf/poligoane.pdf"` și `keywords`.
3. Adaugi în `src/data/questions.json` exact 10 întrebări verificate cu `lessonId` egal cu `id`-ul lecției. Fiecare are exact 4 variante, `correctIndex` (0–3), `explanation` și `sourcePage`.
4. Opțional, adaugi formule în `src/data/formulas.json`.
5. Rulezi `npm run validate`, apoi faci commit și push pe `main`.

Lecția apare automat pe pagina principală. Validarea oprește build-ul dacă lipsește un PDF, dacă există ID-uri duplicate, dacă un `correctIndex` e invalid, dacă o lecție nu are exact 10 întrebări, dacă o pagină sursă depășește numărul de pagini al PDF-ului sau dacă o formulă LaTeX nu poate fi afișată.

Formulele matematice din întrebări și explicații se scriu între `\(` și `\)` (în JSON: `"\\(a^2+b^2=c^2\\)"`) și sunt afișate cu KaTeX.

## Publicare pe GitHub Pages

1. Creezi un repository pe GitHub și faci push pe ramura `main`.
2. În repository: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
3. Workflow-ul `.github/workflows/deploy.yml` rulează la fiecare push pe `main`: `npm ci`, testele, validarea și build-ul, apoi publică `dist/` cu acțiunile oficiale `actions/upload-pages-artifact` și `actions/deploy-pages`.
4. Site-ul apare la `https://<utilizator>.github.io/<repository>/`. Nu este nevoie de domeniu propriu.

## Date salvate local

Cheia `recapitulare-geometrie:v1` din `localStorage` păstrează: lecțiile marcate ca învățate, ultimul scor la test pentru fiecare lecție, ultima lecție vizitată și tema aleasă. Datele corupte sunt ignorate, iar dacă `localStorage` nu este disponibil aplicația funcționează în continuare, fără salvare.
