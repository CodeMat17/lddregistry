# LDD Registry — user guide

This prototype holds the LDD workbook data on **your device only**. Anything you add or change stays in this browser until you export it. It is not connected to NFVCB systems.

## Getting around

- **Phone:** use the bar at the bottom — Home, Add record, Settings.
- **Tablet / computer:** use the left sidebar. Collapse it with the panel button (or Ctrl+B). Press **Ctrl+K** (⌘K on Mac) anywhere to jump to a record, register or page.
- The amber **Prototype** badge at the top explains where the data comes from.

## Home

Lists the 10 registers with record, screen and seat totals. Search the list or change its sort order, and open a register to see its records.

## Finding records

- **Search** (Ctrl+K, then *Search all records*) looks across all registers by name, contact person, state, LGA, address, phone, email or category. Matching words are highlighted.
- **Filters** opens a panel (from the bottom on phones). Combine state, zone, LGA, OLD/NEW, licence status, screens, contact details and data-quality issues. Active filters appear as chips — tap × to remove one, or **Reset filters**.
- **Presets** gives quick filters (e.g. *Lagos records*, *Records with screens*) and lets you save your own on this device.
- On a computer you can switch to **table view**, choose columns and sort by clicking column headings.
- The page address keeps your filters, so the browser Back button returns to the same view.

## A record's profile

Shows location, contacts (tap a phone number to call or an email to write), screens and seats, licensing and any data-quality flags. Tabs:

- **Source data** — the exact values from the workbook row, which never change.
- **History** — changes made in this browser.
- **Related** — other records with the same name, phone or email. Mark them *Related*, *Not related* or *Duplicate*; nothing is merged.

**Share / Export** downloads a profile PDF, CSV or JSON, or shares/copies a short summary.

## Correcting or adding records

Choose **Edit** on a profile (or **Correct locally** next to a data-quality warning). Only the fields you change are saved, and the change is logged in History. To add a record, use **Add record** on a register or the Search page.

Deleting a record (••• menu) asks for confirmation and is logged.

## Data quality centre (More → Data quality)

Lists every issue type with the number of affected records — tap one to see them. Also shows field completeness, spelling variations in the Category column and possible duplicates to review.

## Import, export and backups (More → Import & export)

- **Export** the full dataset to Excel or CSV, or download a **JSON backup** (records, history and reviews). Do this before clearing browser data or changing device.
- **Restore** a JSON backup to replace the local data.
- **Import** a revised workbook (same worksheet names) or a CSV for one register. The app shows what it found — worksheets, columns, record counts, warnings and errors — before anything changes. Choose **Append** (records already present are skipped) or **Replace** (asks for confirmation). You can download the validation report.
- An automatic backup is saved before any replace, restore or reset; the last five can be restored here.

## Settings

Theme (light / dark / system), whether to use OLD screen counts when NEW is missing, data source details, **Reset to original seed data**, and the privacy notice.

## Important caveats

- Figures are recorded data from the workbook and have not been verified by NFVCB.
- Record counts are rows, not unique operators — one operator can appear in several registers.
- The date of expiration is calculated as one year from the date of issue, and "Calculated" licence status is based on it. It is not an official status. Records without a readable date of issue show a blank expiry date until one is entered; new records require a date of issue.
- Browser storage is not a secure central repository; anyone using this browser profile can see the data.
