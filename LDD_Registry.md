# NFVCB LDD Registry — Claude Code Build Specification

> **Project:** National Film and Video Censors Board (NFVCB) — Licensing and Documentation Department (LDD) Registry  
> **Build target:** A polished, mobile-first, responsive web application / Progressive Web App (PWA)  
> **Initial data mode:** Local-first; no live database or paid backend required  
> **Future backend:** Convex, added later after the Director approves the project  
> **Primary source workbook:** `DATABASE UPDATE-1.xlsx`

---

## 1. Instructions to Claude Code

Act as a senior product designer, UX architect and full-stack engineer. Build a production-quality application called **NFVCB LDD Registry** for the Licensing and Documentation Department of the National Film and Video Censors Board.

The application must feel like a premium, carefully designed government enterprise product—not a generic admin template and not a spreadsheet placed inside a website.

### Non-negotiable requirements

1. **Mobile-first:** Design for a 360px-wide phone first, then progressively enhance for tablets and desktop. It must work exceptionally well on small screens.
2. **Responsive:** No horizontal page overflow at any viewport. Tables must become mobile cards or use a deliberately designed responsive presentation.
3. **Easy to use:** Clear navigation, readable typography, generous touch targets, simple filters, useful empty states and predictable interactions.
4. **Premium UI/UX:** Consistent design system, restrained colours, excellent spacing, subtle motion, polished charts, refined cards, thoughtful loading states and clear visual hierarchy.
5. **Local-first:** The app must work without Convex, Supabase, a VPS or any paid database. Load the supplied workbook data into the application as a local seed dataset. Persist local edits in IndexedDB.
6. **Convex-ready architecture:** Keep data access behind a repository/service interface so a future Convex integration does not require rewriting the UI.
7. **Data integrity:** Preserve original source values. Do not invent missing values, infer licence validity without sufficient dates, or silently “correct” ambiguous records.
8. **Management intelligence:** Give the Director an executive overview, including total establishments, total screens and total seating capacity, with clear data-quality qualifications.
9. **Share and export:** Users must be able to export the displayed data and current filtered view to Excel-compatible CSV, print/PDF and shareable report formats.
10. **No fake functionality:** Every visible button and control must work. If a feature is intentionally deferred, label it clearly as “Coming in a later phase” and do not present it as operational.

Before coding:
- Inspect the existing repository and package manager.
- Inspect `DATABASE UPDATE-1.xlsx` if it is available in the project workspace.
- Identify the actual framework and installed versions before changing dependencies.
- Do not replace working project configuration unnecessarily.
- Create a short implementation plan, then build the application.
- Run lint, type-check and production build; fix all errors.

If the workbook is not in the repository, ask for it or use the provided prepared data file. Do not fabricate a replacement dataset.

---

## 2. Product purpose

The LDD Registry is a central digital directory and management-information tool for licensing and documentation records currently maintained in a multi-sheet Excel workbook.

It should allow authorised departmental users to:

- View an executive dashboard.
- Browse the 10 source licensing categories.
- Search across all records.
- Filter and sort records.
- Open detailed establishment/operator profiles.
- View screen and seating-capacity information.
- Identify missing or inconsistent data.
- Review licence dates and recorded status.
- Generate management reports.
- Download or share displayed data.
- Add and edit records locally during the prototype phase.
- Import a revised Excel/CSV dataset and export records.

The first release is a **demonstration and working prototype**, not yet the official system of record. Display a discreet but clear label such as **“Prototype · Local data”** so users understand that changes are stored in the current browser/device and are not yet centrally synchronised.

Do not imply that the app is connected to NFVCB live systems.

---

## 3. Source workbook and data ingestion

### Workbook

Expected source file: `DATABASE UPDATE-1.xlsx`.

The workbook has 10 sheets. The visible worksheet names include:

1. `EXHIBITORS PREMISES`
2. `NATIONAL DISTRIBUTORS`
3. `REGIONAL EXHIBITORS`
4. `COMMUNITY EXHIBITORS`
5. `VIEWING CENTRE`
6. `ONLINE DISTRIBUTORS`
7. `NATIONAL EXHIBITORS`
8. `REGIONAL DISTRIBUTORS`
9. `DRIVE IN CINEMA`
10. `SUB URBAN`

The workbook is not perfectly uniform. Some sheets have a title row before the column header row; column names vary in capitalisation and spelling; some values are blank; and some fields have different types. The first sheet includes separate OLD and NEW screen-count/detail fields. Do not assume that every sheet has the same header row or column layout.

### Required ingestion process

Create a repeatable import/normalisation script, preferably using Python and `openpyxl` or an equivalent reliable workbook parser. It must:

1. Read every worksheet.
2. Detect the actual header row rather than assuming row 1.
3. Preserve the source sheet name.
4. Preserve the source row number.
5. Map synonymous column headings to canonical field names.
6. Preserve every original field/value in a `sourceData` object or equivalent.
7. Normalise whitespace and obvious casing inconsistencies for search/filter purposes without destroying the original display value.
8. Preserve phone numbers as strings, including leading zeroes.
9. Parse dates safely. Keep unparseable date values as raw source text and flag them.
10. Treat blank cells as missing—not zero, “N/A” or a guessed value.
11. Generate stable internal IDs for each imported row.
12. Generate a data-quality report showing missing fields, unparseable dates, invalid numeric values and possible duplicates.
13. Never merge or delete possible duplicates automatically.

### Canonical record fields

Create a flexible `Establishment` model with fields such as:

```ts
type Establishment = {
  id: string;
  sourceSheet: string;
  sourceRow: number;
  sourceSerialNumber?: string | number;

  name: string;
  category: string;
  state?: string;
  geopoliticalZone?: string;
  lga?: string;
  address?: string;

  chainNumber?: string | number;
  contactPerson?: string;
  phone?: string;
  email?: string;

  licenceNumber?: string;
  recordedLicenceStatus?: string;
  issueDate?: string;
  expiryDate?: string;
  oldNewClassification?: string;

  screensOld?: number | null;
  screenDetailsOld?: string;
  screensNew?: number | null;
  screenDetailsNew?: string;

  screens?: number | null;
  screenDetails?: string;
  totalSeats?: number | null;

  lastInspectionDate?: string;
  notes?: string;

  dataQualityFlags: string[];
  sourceData: Record<string, unknown>;

  createdAt: string;
  updatedAt: string;
};
```

Adapt this model to the actual workbook fields discovered during inspection. Do not discard additional columns: retain them in `sourceData` and make them available in a source-data/other-information section of the profile.

### Category handling

The 10 worksheets should be presented as 10 selectable categories/views. Store a canonical category ID and a display label, but preserve the original category text and source sheet.

An operator/establishment may occur in more than one sheet. Do not assume that repeated names represent duplicates. They may be separate registrations, categories, facilities or operational records. Provide a **possible duplicate / related record** review mechanism based on name, phone, address and other fields. Only a user may confirm a merge or relationship.

### Screen-count and seating-capacity rules

This is a high-priority management requirement.

- Display screen counts prominently on the Director's dashboard.
- Distinguish **screen count (NEW)** from **screen count (OLD)** where both exist.
- Do not add OLD and NEW counts together: they may be two versions of the same information.
- Use a documented rule for the headline count. Prefer NEW when it is present and valid; otherwise use OLD only if the user accepts that fallback. Show how many records contributed to the total and how many have missing/ambiguous screen data.
- If the workbook has a generic `No_of_Screens` field, use it as the available screen count for that record.
- Do not interpret text such as “Drive-in-Cinema” in a screen-details field as a numeric screen count.
- Validate numeric screen values. Flag suspicious values rather than silently including them. Example: an implausibly large number should be reviewed.
- `Total_Seats` may contain comma-separated values or malformed text. Do not blindly cast it to a number. Preserve the raw value and only calculate a total when a reliable numeric interpretation is possible.
- Distinguish **registered/recorded screens** from **operational screens**. The source workbook may not establish operational status. Do not label a figure “operational” unless a separate verified field is available.
- Show seating-capacity totals as “recorded/available data” and show the number of records with missing or unparseable seating information.
- Include an explanatory tooltip or methodology note for all aggregated screen and seat figures.

---

## 4. Information architecture

Use a simple five-item mobile bottom navigation:

1. **Home** — dashboard.
2. **Categories** — the 10 registers.
3. **Search** — global search.
4. **Reports** — analytics and exports.
5. **More** — data quality, import/export, settings and about.

On tablet/desktop, convert this into a refined collapsible sidebar with the same navigation structure. Keep the NFVCB/LDD identity visible.

Suggested routes:

```text
/
 /categories
 /categories/[categoryId]
 /records/[recordId]
 /search
 /reports
 /reports/screens
 /reports/geography
 /reports/licensing
 /data-quality
 /import
 /settings
```

Use sensible route names consistent with the existing project.

---

## 5. Visual direction and design system

### Overall look

Create a premium, contemporary institutional interface:

- Professional and trustworthy.
- Clean, calm, uncluttered.
- Light neutral surfaces.
- Deep navy/ink as the primary brand foundation.
- Restrained teal or green accent for positive actions.
- Amber for warnings and red for expired/error states.
- Avoid excessive gradients, glassmorphism, neon colours and decorative clutter.
- Use charts with accessible labels and legends.
- Use subtle transitions (approximately 150–220ms), respecting reduced-motion preferences.

Do not invent or misuse an official NFVCB logo. If no approved logo asset is supplied, use a typographic NFVCB wordmark and a simple neutral icon. Make branding easy to replace later.

### Design tokens

Create central CSS variables/design tokens for:

- Background, surface, elevated surface.
- Primary, secondary, muted text.
- Border and focus ring.
- Primary, success, warning, danger and info colours.
- Radius scale.
- Shadow scale.
- Spacing scale.
- Typography scale.

### Typography

Use a modern, highly readable sans-serif such as Inter, Geist or the font already configured in the repository. Use tabular numerals for statistics.

### Interaction standards

- Touch targets should be at least 44 × 44px.
- Use visible keyboard focus.
- Use semantic headings and landmarks.
- Provide accessible labels for icon-only buttons.
- Ensure contrast meets WCAG AA where practical.
- Avoid hover-only interactions.
- Keep primary actions easy to reach on mobile.
- Use skeleton loaders for genuinely asynchronous work.
- Provide clear success/error toast messages.
- Confirm destructive actions.
- Support keyboard navigation and screen readers.

---

## 6. Main screens and required behaviour

### A. Executive dashboard / Director's view

This is the most important screen. It should immediately communicate the size and distribution of the registry.

#### Primary KPI cards

Show:

1. **Total registered records** — total imported rows/records, clearly distinguished from unique operators if unique entities have not been verified.
2. **Total recorded screens** — calculated using the screen-count methodology above.
3. **Total recorded seating capacity** — only where values are reliably numeric.
4. **Categories** — 10 source categories.
5. **States represented** — count of distinct non-empty state values after conservative normalisation.
6. **Data completeness** — proportion of records with key fields populated.

Optional secondary KPIs, only where source fields support them:

- Recorded valid licences.
- Recorded expired licences.
- Pending applications.
- Licences expiring in 30/60/90 days.
- Inspections due or completed.

**Important:** Do not invent licence-status, issue-date, expiry-date or inspection statistics if the source workbook does not contain reliable values. If unavailable, show “Not available in source data” rather than a misleading zero. Distinguish source-recorded status from a status calculated using dates.

#### Dashboard visualisations

- Records by category (bar chart).
- Records by geopolitical zone (bar chart).
- Records by state (ranked horizontal bar chart; allow view all).
- Screen counts by state/zone (where usable data exists).
- Seating capacity by state/zone (where usable data exists).
- Data-quality overview.

Charts must be responsive and usable on phones. On narrow screens, stack charts vertically and avoid tiny labels. Tapping a chart segment/bar should navigate to the corresponding filtered register where practical.

#### Dashboard actions

- Share dashboard.
- Download PDF report.
- Export summary to Excel/CSV.
- Choose reporting date/range if dates support it.
- View data methodology and data-quality caveats.

### B. Categories page

Display all 10 source categories as attractive cards/list rows.

Each category card should show:

- Category name.
- Record count.
- Available screen total, where meaningful.
- Available seating total, where meaningful.
- A small category icon or neutral illustration.
- Clear navigation affordance.

Include search categories and sort options. Category counts must be calculated from the imported records, not hard-coded.

### C. Category register

Each category page should include:

- Category title and description.
- Total records.
- Relevant screen/seat summary, where applicable.
- Search within category.
- Filter button with active-filter count.
- Sort control.
- Grid/list view toggle if useful on larger screens.
- Export current filtered results.
- Clear all filters.
- Pagination or efficient incremental loading for larger datasets.

#### Filters

Provide filters based on fields that exist in the data:

- State.
- Geopolitical zone.
- LGA.
- Category.
- OLD/NEW classification.
- Screen-count range (where numeric values exist).
- Has screens / no screen data.
- Has contact details / missing contact details.
- Data-quality flags.

Only show licence status/date filters when reliable licence fields are present. Do not add fake filter options.

Allow multiple filters simultaneously. Display active filters as removable chips. Provide a clear “Reset filters” action.

#### Mobile record cards

On mobile, do not force a wide spreadsheet table. Use cards containing:

- Establishment/operator name.
- Category badge.
- State and zone.
- LGA or shortened address.
- Number of screens, if known.
- Contact person or phone, if available.
- Data-quality indicator if relevant.
- “View record” action.

On desktop, use a data table with sticky headers, column visibility controls and sorting. Ensure it remains usable at tablet widths.

### D. Global search

Build fast global search across all categories.

Search fields:
- Establishment/operator name.
- Contact person.
- State.
- LGA.
- Address.
- Phone.
- Email.
- Category.
- Licence number if present.

Requirements:
- Debounced input.
- Case-insensitive matching.
- Trim and normalise whitespace.
- Highlight matching terms where practical.
- Show category and location with each result.
- Group results by category or offer a category filter.
- Search must work locally without a network connection after the app has loaded.
- Provide helpful no-results and clear-search states.

### E. Establishment profile

A detailed record page should be structured into readable sections or tabs:

1. **Overview** — name, category, location, record reference and source sheet.
2. **Location** — state, zone, LGA and full address.
3. **Contacts** — contact person, phone, email. Phone links should use `tel:` and email links `mailto:`.
4. **Screens & capacity** — old/new/current screen counts, screen details, seating data and methodology notes.
5. **Licensing** — only fields actually available in the source.
6. **Inspection** — only fields actually available in the source.
7. **Source data** — original imported values, source worksheet and source row.
8. **Record history** — local edits made during this prototype, clearly marked as browser-local history.

Actions:
- Edit record.
- Download profile as PDF/print view.
- Export record as JSON/CSV if useful.
- Copy record summary.
- Share through the native share sheet where supported.
- Navigate to related/possible duplicate records.

Do not display empty sections as if they contain information. Use a discreet “Not provided in source” label where useful.

### F. Reports and analytics

Provide report categories:

- Executive summary.
- Category distribution.
- Geographic distribution.
- Screen inventory.
- Seating capacity.
- Data completeness and quality.
- Licence report, only if valid source data exists.
- Inspection report, only if valid source data exists.

All reports should support:
- Filters.
- Reporting date.
- PDF/print.
- Excel-compatible CSV.
- Share action.
- Clear source and methodology notes.

### G. Data quality centre

This feature is important because the source workbook is inconsistent.

Show:
- Missing establishment names.
- Missing state/zone/LGA.
- Missing contact information.
- Missing screen counts.
- Missing seating information.
- Unparseable dates.
- Invalid or suspicious numeric values.
- Possible duplicate records.
- Category spelling variations.
- Conflicting old/new values.

Each issue should link to affected records. Allow authorised prototype users to correct values locally, while preserving the original source value and recording the local change.

Do not silently auto-correct or merge records.

### H. Import and export

The prototype should support local file import, without a backend:

- Import XLSX and CSV if feasible.
- Preview detected worksheets/columns.
- Show record counts before import.
- Validate headers and rows.
- Show warnings and errors.
- Let user choose replace dataset or append records.
- Require confirmation before replacing.
- Preserve a backup of the current local dataset before a destructive import.
- Avoid accidental duplicate imports; use source sheet + source row + stable source fingerprint where appropriate.
- Provide a downloadable import validation report.

Exports:
- CSV for filtered register data.
- Excel `.xlsx` if a suitable library is already installed or can be added safely.
- PDF through a print-optimised report view or a reliable PDF library.
- JSON backup for full local dataset portability.

CSV export must correctly escape commas, quotes and line breaks and preserve phone numbers as strings. Use UTF-8 with BOM if needed for reliable Excel opening.

### I. Settings / More

Include:
- Data source status: “Local prototype data”.
- Dataset imported date.
- Record count.
- Import/export tools.
- Data methodology.
- About the LDD Registry.
- Theme preference (light/dark/system) if practical.
- Clear local changes/reset to original seed, with confirmation.
- Privacy/security notice.

---

## 7. Share and download — core feature

Share/export must be available wherever it is relevant, not just on the Reports page.

### Export context

When a user exports from a filtered register or search result, export **the current filtered result set**, not the entire database. Make the export title and metadata state the applied filters.

### Required formats

- **CSV:** current filtered rows.
- **XLSX:** current filtered rows, preferably with a polished workbook containing a data sheet and a summary sheet.
- **PDF:** professionally formatted report with NFVCB/LDD title, report title, generated date, applied filters, summary KPIs, tables/charts where appropriate, page numbers and a “Prototype · Local data” note.
- **Print:** a clean print stylesheet.
- **Share:** use Web Share API when available; otherwise offer copy link/text and download options.

### Security note

Because this is departmental information, do not create public unauthenticated share links in the local prototype. A local share link may not work on another device and must be labelled accordingly. In the future Convex release, implement authenticated, permission-controlled report sharing with optional expiry.

### Suggested share/export menu

Use a compact action menu labelled **Share / Export** with:
- Download PDF report.
- Download Excel workbook.
- Download CSV.
- Print.
- Share summary.
- Copy summary.

For an individual profile, offer **Download profile PDF** and **Share profile summary**.

---

## 8. Local-first data architecture

Do not connect Convex in this phase. Do not add Supabase. Do not create fake API calls.

Use a clean architecture so Convex can be introduced later.

### Recommended pattern

```text
src/
  app/
  components/
    layout/
    dashboard/
    records/
    categories/
    filters/
    charts/
    export/
    ui/
  features/
    establishments/
    categories/
    reports/
    data-quality/
    import-export/
  lib/
    data/
      repositories/
        types.ts
        establishment-repository.ts
        local-establishment-repository.ts
        convex-establishment-repository.ts   # placeholder only; not active
      import/
      export/
      analytics/
      validation/
    utils/
  data/
    seed/
      establishments.json
      categories.json
```

Adapt the structure to the existing project rather than forcing this exact layout if it conflicts with a sound existing architecture.

### Repository interface

All screens must call a repository/service interface, not import JSON directly.

Example:

```ts
export interface EstablishmentRepository {
  getAll(): Promise<Establishment[]>;
  getById(id: string): Promise<Establishment | null>;
  getByCategory(categoryId: string): Promise<Establishment[]>;
  search(query: string): Promise<Establishment[]>;
  create(input: CreateEstablishmentInput): Promise<Establishment>;
  update(id: string, input: UpdateEstablishmentInput): Promise<Establishment>;
  delete(id: string): Promise<void>;
  replaceAll(records: Establishment[]): Promise<void>;
}
```

Use a provider/factory to select the implementation:

```ts
const dataProvider = "local"; // future: "convex"
```

Do not scatter provider checks throughout React components.

### Persistence

- Bundle the initial workbook-derived dataset as JSON seed files.
- Use IndexedDB (Dexie or another reliable wrapper) for local persistence of edits/imported data.
- On first launch, seed IndexedDB from bundled JSON.
- On later launches, load IndexedDB rather than overwriting user changes with the seed.
- Provide a deliberate “Reset to original seed data” action.
- Keep a dataset version/schema version so future changes can migrate local data.
- Do not use localStorage for the full database.
- The app should be installable as a PWA if feasible.
- Cache the app shell and seed assets for offline use. Clearly indicate offline/local state.

### Future Convex integration

Prepare, but do not implement, a future adapter. Document:
- Which local repository methods map to Convex queries/mutations/actions.
- How IDs will be mapped.
- How records and related entities will be seeded.
- How to migrate local JSON/IndexedDB records into Convex.
- How to handle duplicate detection and stable IDs.
- How authentication and role permissions will be introduced.
- How files will move from local storage to Convex file storage.

Do not make Convex-specific data types leak into the UI or domain model.

---

## 9. Suggested domain model for future growth

The workbook is currently row-oriented, but the long-term system may need separate entities.

Plan for these concepts:

- `Establishment` — cinema, viewing centre, distributor or other registered entity/facility.
- `Category` — one of the 10 licensing categories.
- `Licence` — one or more licence records over time.
- `Screen` — individual screen details where available.
- `Inspection` — inspection history.
- `Document` — licence documents, applications, inspection reports and correspondence.
- `User` — officer identity and role.
- `AuditEvent` — who changed what and when.
- `EstablishmentCategory` — relationship if one establishment belongs to multiple categories.

For the local prototype, do not overcomplicate the initial data migration. Preserve the original row as a record and add relationships only when they can be established reliably.

---

## 10. Data calculations and methodology

Create central calculation functions and unit tests.

### Records

- `totalRecords`: count of imported rows.
- `recordsByCategory`: group by canonical category/source sheet.
- `uniqueNames`: do not label as unique establishments unless a defensible matching rule is reviewed.
- Show the distinction between record count and unique operator count.

### Screens

- Use one selected screen-count value per record, never sum OLD + NEW.
- Prefer NEW when valid; fallback to OLD only under a documented rule.
- For other sheets, use their generic `No_of_Screens` field.
- Exclude blank, non-numeric and suspicious values from the numeric total; count and report them separately.
- Show a tooltip: “Calculated from available screen-count fields. Records with missing or ambiguous values are excluded. This is not a verified operational-screen count.”

### Seats

- Parse numeric values only where unambiguous.
- If a source value is a comma-separated list of seat capacities, only sum it if the format is clearly a list of numbers and not a malformed string.
- Flag suspicious values for review.
- Display the number of records included/excluded from the total.

### Geography

- Normalise common casing/whitespace differences for grouping.
- Do not infer state from address text without explicit validation.
- Preserve original source values.
- Treat missing values as “Not specified”.

### Licence status

- Keep `recordedLicenceStatus` separate from `calculatedLicenceStatus`.
- If expiry dates are absent or invalid, do not calculate status.
- If the date exists, use a clear rule and local date handling.
- Label derived status as “Calculated from expiry date”, not “official status”.
- Do not treat “OLD/NEW” as licence status.

### Dates

- Parse date-only values consistently.
- Avoid timezone shifts when displaying date-only fields.
- Preserve original raw values for auditability.

---

## 11. Performance and responsive behaviour

The source dataset is modest, but design for future growth.

- Avoid unnecessary rerenders.
- Memoise expensive derived analytics where useful.
- Debounce global search.
- Keep charts responsive.
- Use pagination or virtualisation if record count grows substantially.
- Do not fetch or compute the same aggregate separately in many components.
- Calculate dashboard data in a central analytics module.
- Keep the app fast on mid-range Android phones and slower connections.

### Responsive breakpoints

Use the project's Tailwind defaults unless already customised, but validate at:
- 360px phone.
- 390px phone.
- 430px large phone.
- 768px tablet.
- 1024px small laptop.
- 1440px desktop.

No clipped controls, overlapping cards or horizontal scrolling at mobile widths.

---

## 12. Security, privacy and prototype limitations

Even though this is a local prototype:

- Do not expose the data through a public API.
- Do not add analytics/tracking scripts without approval.
- Do not put secrets in frontend environment variables.
- Do not create a public sharing endpoint.
- Avoid unnecessary personal data in dashboard summaries.
- Keep phone/email details inside record views and exports only where appropriate.
- Clearly disclose that local changes are stored on the current device/browser.
- Warn users to export a backup before clearing browser data or changing devices.
- Do not claim that local browser storage is a secure central repository.
- Do not use real authentication claims in the prototype if no authentication backend exists. If a visual demo login is used, label it as demo-only and never treat it as security.

Before production, the Board must approve hosting, data residency, user access, retention, backup and security arrangements.

---

## 13. Recommended UI details that make it feel premium

Implement these where they improve usability:

- Collapsible desktop sidebar.
- Mobile bottom navigation with clear active state.
- Command/search palette (`Ctrl/Cmd + K`) on desktop.
- Global search accessible from mobile header.
- Filter drawer/bottom sheet on mobile.
- Active filter chips.
- Saved filter presets locally (e.g. “Lagos records”, “Records with screens”, “Missing contact details”).
- Column chooser on desktop.
- Sort by name, state, category, screen count and update date where data supports it.
- Breadcrumbs on desktop and simple back navigation on mobile.
- Recent records.
- Recently viewed records, stored locally.
- Copy phone/email/address actions.
- Click-to-call and click-to-email.
- Screen and seat data visualisations.
- Skeleton loading states.
- Empty states with helpful next actions.
- Error boundaries and friendly error pages.
- Toast notifications.
- Confirmation dialogs for destructive operations.
- Keyboard shortcuts on desktop.
- Dark mode only if it can be implemented consistently and accessibly.
- PWA install prompt only when appropriate; do not nag users.

Avoid adding features merely for decoration. Each feature must solve a real LDD workflow.

---

## 14. Suggested component inventory

Build reusable components such as:

- `AppShell`
- `MobileBottomNav`
- `DesktopSidebar`
- `PageHeader`
- `KpiCard`
- `DashboardChartCard`
- `CategoryCard`
- `RecordCard`
- `RecordsTable`
- `GlobalSearch`
- `FilterDrawer`
- `ActiveFilterChips`
- `StatusBadge`
- `ScreenCountSummary`
- `DataQualityBadge`
- `RecordProfileSection`
- `ShareExportMenu`
- `ReportHeader`
- `ImportWizard`
- `ImportValidationSummary`
- `ConfirmDialog`
- `EmptyState`
- `ErrorState`
- `OfflineIndicator`
- `PrototypeDataBanner`

Use a coherent component library if already installed (for example shadcn/ui with Radix primitives). Do not install multiple overlapping UI libraries.

---

## 15. Acceptance criteria

The build is not complete until all the following are true.

### Data
- [ ] All 10 workbook sheets are ingested.
- [ ] Source sheet and row are preserved for every record.
- [ ] No records are silently discarded.
- [ ] Phone numbers retain leading zeroes.
- [ ] Missing values remain missing.
- [ ] Old and new screen counts are not added together.
- [ ] Data-quality issues are visible.
- [ ] Possible duplicates are flagged, not automatically merged.

### Dashboard
- [ ] Total records are calculated from the dataset.
- [ ] Total screen count uses documented logic.
- [ ] Total seating capacity only includes valid numeric values.
- [ ] Missing/ambiguous screen and seat data are disclosed.
- [ ] Category and geographic summaries are available.
- [ ] Charts work on mobile.

### Registers and profiles
- [ ] All 10 categories can be selected.
- [ ] Global search works across categories.
- [ ] Multiple filters work together.
- [ ] Filter chips can be removed individually.
- [ ] Mobile cards are readable and easy to tap.
- [ ] Desktop table sorting works.
- [ ] Individual record profiles show available fields and source details.

### Export and sharing
- [ ] Filtered CSV export works.
- [ ] XLSX export works if included.
- [ ] PDF/print report works.
- [ ] Export metadata shows date and active filters.
- [ ] Share works where browser support exists and degrades gracefully.
- [ ] No public unauthenticated share links are created.

### Local-first
- [ ] App works without Convex or Supabase.
- [ ] Seed data loads on first launch.
- [ ] Local edits persist after refresh.
- [ ] Reopening the app does not overwrite local edits.
- [ ] Dataset reset is deliberate and confirmed.
- [ ] JSON backup and restore work.
- [ ] Prototype/local-data status is visible.

### Responsive and quality
- [ ] No horizontal page overflow at 360px.
- [ ] Mobile bottom navigation works.
- [ ] Filter drawer works on mobile.
- [ ] Desktop sidebar works.
- [ ] Touch targets and contrast are accessible.
- [ ] No dead buttons or fake data.
- [ ] Type-check, lint and production build pass.

---

## 16. Suggested implementation sequence

Build in this order:

### Milestone 1 — Inspect and prepare data
- Inspect project and workbook.
- Write robust workbook normaliser.
- Generate JSON seed.
- Generate data-quality report.
- Validate record counts and source mapping.

### Milestone 2 — Design system and app shell
- Set up typography, tokens and theme.
- Build responsive app shell.
- Build mobile bottom navigation and desktop sidebar.
- Add prototype/local-data banner.

### Milestone 3 — Core registry
- Build categories.
- Build category registers.
- Build mobile record cards and desktop table.
- Build global search and filters.
- Build establishment profiles.

### Milestone 4 — Director dashboard
- Build KPI cards.
- Implement screen/seat calculation methodology.
- Build charts and geographic/category summaries.
- Add methodology notes.

### Milestone 5 — Data quality and local editing
- Build data-quality centre.
- Add local create/edit functionality.
- Add change history.
- Add duplicate review.

### Milestone 6 — Import/export and reports
- Add CSV/XLSX import.
- Add validation preview.
- Add CSV/XLSX export.
- Add PDF/print reports.
- Add share/copy summary.

### Milestone 7 — Polish and QA
- Test all specified viewport sizes.
- Test offline/local behaviour.
- Test data calculations with edge cases.
- Check accessibility.
- Run lint, type-check and production build.
- Fix all errors and document known limitations.

---

## 17. Required project documentation

Create and maintain:

- `README.md` — setup, development and build commands.
- `docs/DATA_DICTIONARY.md` — canonical fields and source mappings.
- `docs/DATA_QUALITY_REPORT.md` — import anomalies and unresolved issues.
- `docs/SCREEN_COUNT_METHODOLOGY.md` — how screen and seat totals are calculated.
- `docs/CONVEX_MIGRATION_PLAN.md` — future Convex adapter and seed/migration process.
- `docs/USER_GUIDE.md` — how LDD officers use the prototype.

Do not claim that the data has been verified by NFVCB. State that it is imported from the supplied workbook and requires departmental validation.

---

## 18. Final product expectation

The finished product should look and feel like a premium institutional application that the LDD Director can confidently review on a phone, tablet or desktop.

The Director should be able to open the dashboard and quickly understand:

- How many records are in the registry.
- How many cinema screens are recorded.
- What seating capacity is recorded.
- How establishments are distributed across the 10 categories.
- Where establishments and screens are located geographically.
- What information is missing or requires validation.
- How to download or share the displayed report.

An LDD officer should be able to find an establishment, inspect its information, apply filters, review screen details and export the result with minimal effort.

**Build the complete local-first application now. Do not wait for Convex. Keep the architecture ready for Convex, but do not add a live backend until the Director approves the project.**
