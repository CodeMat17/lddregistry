# NFVCB LDD Registry (prototype)

A mobile-first, local-first web app for the National Film and Video Censors Board's Licensing and Documentation Department (LDD). It turns the departmental workbook `DATABASE UPDATE-1.xlsx` into a searchable registry with a Director's dashboard, a data-quality centre and import/export tools.

> **Prototype · Local data.** Data is imported from the supplied workbook and has not been verified by NFVCB. Edits are stored only in the current browser (IndexedDB). The app is not connected to any NFVCB system.

## Stack

- Next.js 16 (App Router, Cache Components, Turbopack), React 19, TypeScript
- Tailwind CSS v4 with shadcn/ui (Base UI primitives), lucide icons, Recharts via the shadcn chart component
- Dexie (IndexedDB) for local persistence; SheetJS (`xlsx`) for workbook import/export
- Vitest for the data-layer unit tests

## Commands

```bash
yarn install
yarn dev          # http://localhost:3000
yarn build        # production build
yarn start        # serve the production build (service worker / offline shell is active only here)
yarn lint
yarn typecheck
yarn test         # unit tests for parsing, analytics, duplicates, edits and exports
yarn seed         # re-generate data/seed/* and docs/DATA_QUALITY_REPORT.md from the workbook
yarn seed path/to/another.xlsx
```

## How the data flows

1. `scripts/import-workbook.ts` reads every worksheet of `data/source/DATABASE UPDATE-1.xlsx`, detects the header row, maps synonymous headings to canonical fields, keeps every original value in `sourceData`, flags anomalies and writes `data/seed/establishments.json`, `meta.json`, `categories.json`, `import-report.json` and `docs/DATA_QUALITY_REPORT.md`. The browser's Import page uses the same normaliser (`lib/data/import/normalise.ts`).
2. On first launch, the local repository seeds IndexedDB from the bundled seed. Later launches read IndexedDB and never overwrite local edits. *Settings → Reset to original seed data* reloads the seed deliberately (after an automatic backup).
3. All screens go through `RegistryRepository` (`lib/data/repositories`). The provider is chosen once in `lib/data/repositories/index.ts` (`dataProvider = "local"`); a Convex adapter is planned — see `docs/CONVEX_MIGRATION_PLAN.md`.
4. Every figure comes from `lib/data/analytics` (screens, seats, geography, licensing, completeness) so dashboard and exports agree.

## Project layout

```text
app/                    routes (dashboard, categories, search, records, data-quality, import, settings, more, methodology)
components/
  layout/               app shell, desktop sidebar, mobile bottom nav, command palette (Ctrl/Cmd+K), status indicators
  dashboard/ charts/    KPI cards, chart cards, ranked bar chart
  records/ filters/     register view (cards + table), filter drawer, record profile, edit form, history
  quality/              data-quality centre, duplicate review
  import/ export/       import wizard, share/export menu
  ui/                   shadcn/ui components
lib/
  domain/               provider-agnostic types, categories, geography reference lists
  data/                 import, analytics, filters, search, quality flags, duplicates, exports, repositories, Dexie DB
data/source/            the source workbook
data/seed/              generated seed files (do not edit by hand — run `yarn seed`)
docs/                   data dictionary, methodology, data-quality report, Convex plan, user guide
```

## Documentation

- [docs/USER_GUIDE.md](docs/USER_GUIDE.md) — how LDD officers use the prototype
- [docs/DATA_DICTIONARY.md](docs/DATA_DICTIONARY.md) — canonical fields and source mappings
- [docs/SCREEN_COUNT_METHODOLOGY.md](docs/SCREEN_COUNT_METHODOLOGY.md) — how screen and seat totals are calculated
- [docs/DATA_QUALITY_REPORT.md](docs/DATA_QUALITY_REPORT.md) — generated import anomalies
- [docs/CONVEX_MIGRATION_PLAN.md](docs/CONVEX_MIGRATION_PLAN.md) — future backend

## Known limitations

- Local only: data is not shared between browsers or devices and is lost if site data is cleared — export a JSON backup.
- No authentication; there is no access control beyond access to the device.
- "Download PDF" opens the browser's print dialog with a print-optimised report (choose *Save as PDF*). Page numbers in the footer need a Chromium-based browser.
- Sharing uses the device share sheet where available, otherwise copies a text summary; no public links are created.
- Offline use after the first visit relies on the service worker in production builds.
- State values that are city names (e.g. "Jos", "Awka") are flagged but not corrected; they are not counted in "States represented".
