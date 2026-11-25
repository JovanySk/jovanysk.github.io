# jovanysk.github.io

Personal portfolio of Jovany Morales del Ángel. Bilingual (ES/EN), light and dark themes, static export for GitHub Pages.

Two modes:

- **Classic** (`/`): recruiter-first page with projects, the INTESC case study, skills, education and contact. A Ctrl/Cmd+K command palette jumps to sections and actions.
- **JovanyOS** (`/os/`, desktop only): a desktop-style playground with draggable windows, a dock, project apps and a terminal. Lazy-loaded; the classic page never downloads its code.

The JovanyOS terminal is a **BM25 retrieval demo**, not an LLM: a small bilingual knowledge base built from the CV and project READMEs (`src/os/kb.ts`) is indexed in the browser (`src/os/bm25.ts`) and each answer cites its sources. No API keys, no network calls.

## Stack

- Next.js 16 (App Router, `output: "export"`), React 19, TypeScript
- Tailwind CSS v4 (`@tailwindcss/postcss`), Geist and Geist Mono via `next/font`
- Motion (`motion/react`) for UI motion, three.js for the hero point cloud (own lazy chunk)
- Phosphor icons, Vitest for unit tests

All visible strings live in `src/i18n.ts`.

## Run

```bash
npm install
npm run dev        # http://localhost:3000
npm test           # BM25 retrieval + window manager tests
npm run build      # static site in out/
npm run preview    # serve out/ on http://localhost:4173
```

## Deploy

Pushing to `main` runs `.github/workflows/deploy.yml`, which builds the site and publishes `out/` with GitHub Pages (Settings > Pages > Source: GitHub Actions). The repository must be named `jovanysk.github.io` so the site is served from the root path.

## License

© 2026 Jovany Morales del Ángel. All rights reserved.
