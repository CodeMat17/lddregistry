# Screen-count and seating-capacity methodology

All aggregates are calculated in `lib/data/analytics` from the current local dataset. The rules below are implemented in `lib/data/import/parse.ts` (parsing) and `lib/data/analytics/screens.ts` (selection), and are covered by unit tests in `lib/data/__tests__`.

## Screens

**Labelling.** Totals are shown as *recorded screens*. The workbook does not establish whether a screen is operating, so no figure is labelled "operational".

**One value per record.** A record contributes at most one screen count. OLD and NEW counts are never added together, because they may be two versions of the same information.

| Register | Field used |
|---|---|
| Exhibitors Premises (has `No of Screens OLD` and `No of Screens NEW`) | NEW when it is a valid whole number. OLD is used **only** if *Settings → Use OLD screen counts when NEW is missing* is switched on (off by default). |
| All other registers | `No_of_Screens` |

**What counts as valid.** A whole number from 0 to 30 stored as a number or as digit-only text.

- Text such as `2medium`, `Drive-in-Cinema` or `Digital Cinema` is never interpreted as a number. The value is kept and the record is flagged *Invalid screen value*.
- Numbers above 30 are flagged *Suspicious screen count* and excluded pending review.
- Numbers found in a *screen details* column (e.g. `1`, `158158`) are not used as counts and are flagged *Number in screen details*.

**Disclosure.** Wherever the total appears, the app shows how many records contributed, how many screen-relevant records have no usable count, and how many were excluded as invalid. Registers where screens are not meaningful (National, Regional and Online Distributors) are not counted as "missing".

Methodology note shown with every total:

> Calculated from available screen-count fields. Records with missing or ambiguous values are excluded. This is not a verified operational-screen count.

## Seating capacity

`Total_Seats` is parsed conservatively:

| Source value | Treatment |
|---|---|
| Blank | Missing (not zero). |
| Whole number 1–2,000 (e.g. `50`, `537`) | Used as is. |
| Clean comma-separated list of whole numbers (e.g. `60,95,93,100,78`) | Summed (here 426). Every part must be 1–2,000 and the total at least 10. |
| Whole number above 2,000 (e.g. `104106`, `150150150`) | **Excluded and flagged.** These are almost always lists whose commas were lost when typed into a number-formatted cell. Splitting them would be guesswork. |
| Anything else | Kept as raw text, excluded and flagged *Unparseable seating*. |

If the number of hall capacities in a list differs from the record's screen count, the record is flagged *Seats ≠ screens* (information only; the seats are still counted).

Totals are labelled *recorded seating capacity*, and the app shows how many records contributed, how many were excluded as ambiguous and how many exhibition records have no seat data. Excluded values are listed in the Seating capacity report so they can be corrected locally.

## Geography

State and zone values are grouped after fixing letter case, spacing, hyphens and a trailing "State" only (`Fct` → `FCT`, `Akwa-Ibom` → `Akwa Ibom`, `Delta State` → `Delta`). Values that are not one of the 36 states or FCT — usually cities such as `Jos`, `Awka`, `Benin`, `Portharcourt` — are shown as written, flagged *Unrecognised state* and **not** counted in "States represented". A state is never inferred from an address.

## Licence status

- *Recorded status* is the `License_Status` text, grouped case-insensitively for colour and filtering only.
- *Calculated status* treats a licence as valid for one year from `Date_of_Issue`: the calculated expiry is the day before the issue anniversary (issued 2025-03-10 → expires 2026-03-09). That date is compared with the reporting date (today, local time, or the date chosen on a report): before the reporting date → expired; within 90 days → expiring; otherwise in date. It is labelled "calculated from issue date" and is not an official status.
- The workbook's `Date_of_Expiration` is not used; it is kept in source data only. Where the issue date is missing or unreadable, the expiry date is left blank and no status is calculated until a date of issue is entered. New records require a date of issue.
- `OLD/NEW` (New / Renewal) is a registration classification and is never treated as a licence status.

## Dates

Excel serial numbers are converted with UTC arithmetic to `yyyy-mm-dd` and displayed without constructing local `Date` objects, so there is no timezone shift. Text dates in `D/M/YYYY` form are accepted when they form a real calendar date. Anything else (e.g. `24/09/202`, `0411/2025`, `1O/12/2025`, `14/14/2025`) is kept as raw text and flagged. Dates outside 1990–2100 (e.g. a serial of `199`) are flagged as implausible and not used.
