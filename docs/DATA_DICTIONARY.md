# Data dictionary

Each workbook row becomes one `Establishment` record (`lib/domain/types.ts`). Column headings are matched case-insensitively after removing punctuation, so `Cinema_Name`, `cinema name` and `CINEMA-NAME` are equivalent. The full synonym list is in `lib/data/import/normalise.ts` (`COLUMN_SYNONYMS`). Any column that does not match is kept in `sourceData` and shown on the record's *Source data* tab.

## Worksheets → registers

| Worksheet | Register ID | Screen columns |
|---|---|---|
| EXHIBITORS PREMISES | `exhibitors-premises` | OLD and NEW |
| NATIONAL DISTRIBUTORS | `national-distributors` | `No_of_Screens` (not meaningful) |
| REGIONAL EXHIBITORS | `regional-exhibitors` | `No_of_Screens` |
| COMMUNITY EXHIBITORS | `community-exhibitors` | `No_of_Screens` |
| VIEWING CENTRE | `viewing-centres` | `No_of_Screens` |
| ONLINE DISTRIBUTORS | `online-distributors` | `No_of_Screens` (not meaningful) |
| NATIONAL EXHIBITORS | `national-exhibitors` | `No_of_Screens` |
| REGIONAL DISTRIBUTORS | `regional-distributors` | `No_of_Screens` (not meaningful) |
| DRIVE IN CINEMA | `drive-in-cinemas` | `No_of_Screens` |
| SUB URBAN | `sub-urban` | `No_of_Screens` |

The register is taken from the worksheet, not from the row's `Category` text, which has spelling variations (kept as `categoryRaw`).

## Fields

| Canonical field | Source heading(s) | Type / notes |
|---|---|---|
| `id` | — | Stable ID: register + hash of sheet, row and fingerprint. |
| `sourceSheet`, `sourceRow` | — | Worksheet name and 1-based Excel row. |
| `sourceSerialNumber` | `S/N` | As recorded. |
| `sourceFingerprint` | — | Hash of sheet + S/N + name; used to skip duplicate imports. |
| `name` | `Cinema_Name` | Trimmed text; whitespace collapsed. |
| `categoryId` | worksheet | One of the 10 register IDs. |
| `categoryRaw` | `Category` | Text as written. |
| `state` | `State` | Text as written (trimmed). Grouping is conservative — see methodology. |
| `geopoliticalZone` | `Region` | Text as written. |
| `lga` | `LGA` / `Lga` | Text. |
| `address` | `Precise_Address` | Text. |
| `chainNumber` | `Chain` | As recorded (in practice a running number). |
| `contactPerson` | `Contact_Person` | Text. |
| `phone` | `Phone` | **Always text**; leading zeroes preserved. |
| `email` | `Email` | Text. |
| `licenceNumber` | `License number` etc. | Not present in the current workbook. |
| `recordedLicenceStatus` | `License_Status` | Text as written (Valid / Expired / Pending / New…). |
| `issueDate`, `expiryDate` | `Date_of_Issue`, `Date_of_Expiration` | `{ iso?, raw }` — `iso` only when parsed reliably. |
| `lastInspectionDate` | `Last_Inspection_Date` | `{ iso?, raw }`. Almost always blank in the source. |
| `oldNewClassification` | `OLD/NEW` | New / Renewal. Not a licence status. |
| `screensOld`, `screensOldRaw` | `No of Screens OLD` | Number or `null`; raw text kept. Exhibitors Premises only. |
| `screenDetailsOld` | `Screen Details OLD` | Text. |
| `screensNew`, `screensNewRaw` | `No of Screens NEW` | Number or `null`; raw text kept. |
| `screenDetailsNew` | `Screens Details NEW` | Text. |
| `screens`, `screensRaw` | `No_of_Screens` | Number or `null`. Other registers. |
| `screenDetails` | `Screen_Details` | Text. |
| `seats` | `Total_Seats` | `{ raw, total?, parts?, status }` — see methodology. |
| `notes` | `Notes` / `Remarks` | Text (added locally; none in source). |
| `dataQualityFlags` | — | List of flags (`lib/data/quality/flags.ts`). |
| `sourceData` | every column | Original header → value pairs, never edited. |
| `origin` | — | `seed`, `import` or `local`. |
| `createdAt`, `updatedAt` | — | ISO timestamps. |

Blank cells are stored as missing (`undefined`/`null`), never as zero or "N/A".

## Local-only stores (IndexedDB `nfvcb-ldd-registry`)

| Table | Contents |
|---|---|
| `establishments` | Records. |
| `history` | Change events: record ID, time, kind, field-level before/after. |
| `meta` | Dataset metadata (schema version, source file, load/import dates) and settings. |
| `backups` | Up to 5 automatic snapshots taken before replace/restore/reset. |
| `duplicateReviews` | User decisions on possible duplicate groups (related / not related / duplicate). |
