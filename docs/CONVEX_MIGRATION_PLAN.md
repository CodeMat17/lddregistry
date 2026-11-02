# Convex migration plan (future phase — not implemented)

The prototype is local-first. Convex will be introduced only after the Director approves the project. The UI already depends solely on the `RegistryRepository` interface (`lib/data/repositories/types.ts`), so the migration adds an adapter rather than rewriting screens.

## 1. Switching providers

`lib/data/repositories/index.ts` is the only place that chooses a provider:

```ts
export const dataProvider: DataProvider = "local" // future: "convex"
```

`convex-establishment-repository.ts` is a placeholder that throws if selected. The Convex implementation will live there and return plain domain objects — Convex `Id<>` or `Doc<>` types must not appear in `lib/domain` or components.

## 2. Method map

| Repository method | Convex function |
|---|---|
| `initialise`, `getMeta` | `query datasets.current` |
| `getAll`, `getByCategory` | `query establishments.list({ categoryId? })` (paginated when the dataset grows) |
| `getById` | `query establishments.get({ id })` |
| `search` | `query establishments.search` using a search index on name/contact/address/state/LGA |
| `create`, `update`, `delete` | `mutation establishments.create / update / remove` — each writes an `auditEvents` row in the same transaction |
| `replaceAll`, `appendRecords` | `action imports.commit` → batched internal mutations; snapshot before replace |
| `getHistory` | `query auditEvents.byRecord` |
| `getSettings`, `saveSettings` | `query/mutation userSettings` (per user) and `registrySettings` (shared, admin-only) |
| `getDuplicateReviews`, `setDuplicateReview` | `query/mutation duplicateReviews` (with reviewer and time) |
| `listBackups`, `createBackup`, `restoreBackup` | `snapshots` table or Convex export; restore admin-only |
| `exportBackup`, `restoreFromFile` | `action exports.full` / `action imports.restore` |

The React provider (`components/providers/registry-provider.tsx`) currently loads everything and refreshes after mutations. With Convex it can subscribe to queries (`useQuery`) instead, keeping the same context shape.

## 3. IDs

- Keep the current string `id` as an indexed `externalId` field. Convex generates its own `_id`.
- Routes keep using `externalId` so links from the prototype and exported files stay valid.
- New records created in Convex get an `externalId` in the same format.

## 4. Seeding and migrating local data

1. Run `yarn seed` against the approved workbook; deploy `data/seed/establishments.json` through an internal `seed` action (idempotent: upsert by `externalId`).
2. For officers who edited data locally: they export a JSON backup (Import & export page). An admin-only *Import local backup* action compares each record's `updatedAt` and `sourceFingerprint` against the server copy, applies only records with `origin: "local"` or newer edits, and records every change in `auditEvents` attributed to the uploading user. Conflicts are listed for manual review, not auto-resolved.
3. Duplicate reviews from backups are imported as suggestions with the reviewer recorded.

## 5. Duplicates and stable identity

- `sourceFingerprint` (sheet + S/N + name) stays the de-duplication key for workbook imports.
- `findPossibleDuplicates` (`lib/data/quality/duplicates.ts`) is pure and can run in a Convex query or a scheduled job.
- Confirmed relationships become an `establishmentRelations` table (`related` / `duplicate`). Merging, if ever approved, is an explicit audited admin operation that keeps both source rows.

## 6. Domain growth

When reliable data exists, split row-oriented records into `establishments`, `licences`, `screens`, `inspections`, `documents` and `establishmentCategories` tables. Keep the original row (`sourceData`) on an `importedRows` table for auditability.

## 7. Authentication and permissions

- Use Convex Auth (or the Board's approved identity provider). Roles: `viewer`, `officer` (create/edit), `reviewer` (data quality and duplicates), `admin` (imports, restores, settings, users).
- Enforce roles inside every query/mutation, not only in the UI.
- Replace the "Prototype · Local data" badge with environment and sync status.

## 8. Sharing

Replace text-only sharing with authenticated, permission-checked report links stored in a `sharedReports` table with an optional expiry and revocation. Never create public unauthenticated links.

## 9. Files

Licence documents, applications and inspection reports will use Convex file storage, referenced from a `documents` table (`establishmentId`, `kind`, `storageId`, uploader, time). The prototype stores no files, so nothing needs migrating.

## 10. Prerequisites

Board approval of hosting, data residency, user access, retention, backup and security arrangements before any live data is loaded.
