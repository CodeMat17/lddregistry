import { getCategory } from "@/lib/domain/categories"
import { isRecognisedState } from "@/lib/domain/geography"
import type { DataQualityFlag, Establishment } from "@/lib/domain/types"

export type FlagSeverity = "error" | "warning" | "info"

export const FLAG_META: Record<DataQualityFlag, { label: string; description: string; severity: FlagSeverity }> = {
  "missing-name": { label: "Missing name", description: "The establishment/operator name is blank.", severity: "error" },
  "missing-state": { label: "Missing state", description: "No state recorded.", severity: "warning" },
  "missing-zone": { label: "Missing zone", description: "No geopolitical zone (Region) recorded.", severity: "warning" },
  "missing-lga": { label: "Missing LGA", description: "No LGA recorded.", severity: "info" },
  "missing-address": { label: "Missing address", description: "No address recorded.", severity: "info" },
  "missing-contact": { label: "Missing contact", description: "Neither a phone number nor an email is recorded.", severity: "warning" },
  "missing-screens": { label: "No screen count", description: "No usable screen count for an exhibition register.", severity: "warning" },
  "invalid-screens": { label: "Invalid screen value", description: "A screen-count cell contains text or a non-whole number (e.g. \"2medium\"). It is excluded from totals.", severity: "warning" },
  "suspicious-screens": { label: "Suspicious screen count", description: `A screen count is implausibly large and is excluded from totals pending review.`, severity: "warning" },
  "missing-seats": { label: "No seating data", description: "No seating capacity recorded for an exhibition register.", severity: "info" },
  "suspicious-seats": { label: "Suspicious seating value", description: "The seating value looks like a list whose commas were lost (e.g. 104106), or contains implausible capacities. Excluded from totals.", severity: "warning" },
  "unparseable-seats": { label: "Unparseable seating", description: "The seating value is not a number or a clean list of numbers. Excluded from totals.", severity: "warning" },
  "seat-screen-mismatch": { label: "Seats ≠ screens", description: "The number of seat capacities listed differs from the screen count.", severity: "info" },
  "unparseable-issue-date": { label: "Unparseable issue date", description: "Date of issue could not be read as a date. The raw text is preserved.", severity: "warning" },
  "unparseable-expiry-date": { label: "Unparseable expiry date", description: "Date of expiration could not be read as a date. The raw text is preserved.", severity: "warning" },
  "implausible-date": { label: "Implausible date", description: "A date falls outside 1990–2100 and is not used in calculations.", severity: "warning" },
  "missing-licence-status": { label: "No licence status", description: "No licence status recorded in the source.", severity: "info" },
  "old-new-conflict": { label: "OLD/NEW screens differ", description: "OLD and NEW screen counts are both present and differ. NEW is used for totals.", severity: "info" },
  "unrecognised-state": { label: "Unrecognised state", description: "The state value is not one of the 36 states or FCT (often a city, e.g. \"Jos\"). It has not been corrected.", severity: "warning" },
  "category-variant": { label: "Category text variant", description: "The row's Category text differs from the usual value for its register (spelling or a different category).", severity: "info" },
  "numeric-screen-details": { label: "Number in screen details", description: "A screen-details cell contains a number. It is not used as a screen count.", severity: "info" },
}

export const ALL_FLAGS = Object.keys(FLAG_META) as DataQualityFlag[]

/**
 * Recompute record-level flags from canonical fields. `category-variant` is
 * determined at import time (it needs the whole sheet) and is preserved.
 */
export function computeFlags(r: Establishment): DataQualityFlag[] {
  const flags = new Set<DataQualityFlag>()
  if (r.dataQualityFlags.includes("category-variant")) flags.add("category-variant")
  const relevant = getCategory(r.categoryId)?.screensRelevant ?? true

  if (!r.name?.trim()) flags.add("missing-name")
  if (!r.state) flags.add("missing-state")
  else if (!isRecognisedState(r.state)) flags.add("unrecognised-state")
  if (!r.geopoliticalZone) flags.add("missing-zone")
  if (!r.lga) flags.add("missing-lga")
  if (!r.address) flags.add("missing-address")
  if (!r.phone && !r.email) flags.add("missing-contact")
  if (!r.recordedLicenceStatus) flags.add("missing-licence-status")

  const hasOldNew = r.screensNew !== undefined || r.screensOld !== undefined
  const rawInvalid = (value: number | null | undefined, raw: string | undefined) =>
    (value === null || value === undefined) && raw !== undefined && raw !== ""
  const screenCells: [number | null | undefined, string | undefined][] = hasOldNew
    ? [[r.screensNew, r.screensNewRaw], [r.screensOld, r.screensOldRaw]]
    : [[r.screens, r.screensRaw]]
  for (const [value, raw] of screenCells) {
    if (rawInvalid(value, raw)) {
      flags.add(/^\d+$/.test(raw!.trim()) ? "suspicious-screens" : "invalid-screens")
    }
  }
  const selected = hasOldNew ? (r.screensNew ?? r.screensOld) : r.screens
  if (relevant && (selected === null || selected === undefined)) flags.add("missing-screens")
  if (hasOldNew && typeof r.screensNew === "number" && typeof r.screensOld === "number" && r.screensNew !== r.screensOld) {
    flags.add("old-new-conflict")
  }
  const details = [r.screenDetails, r.screenDetailsNew, r.screenDetailsOld]
  if (details.some((d) => d !== undefined && /^\d+$/.test(d.trim()))) flags.add("numeric-screen-details")

  if (r.seats.status === "missing" && relevant) flags.add("missing-seats")
  if (r.seats.status === "suspicious") flags.add("suspicious-seats")
  if (r.seats.status === "unparseable") flags.add("unparseable-seats")
  if (r.seats.status === "list" && typeof selected === "number" && r.seats.parts && r.seats.parts.length !== selected) {
    flags.add("seat-screen-mismatch")
  }

  if (r.issueDate?.raw && !r.issueDate.iso) {
    flags.add(isImplausibleDateRaw(r.issueDate.raw) ? "implausible-date" : "unparseable-issue-date")
  }
  if (r.expiryDate?.raw && !r.expiryDate.iso) {
    flags.add(isImplausibleDateRaw(r.expiryDate.raw) ? "implausible-date" : "unparseable-expiry-date")
  }
  if (r.lastInspectionDate?.raw && !r.lastInspectionDate.iso) flags.add("implausible-date")

  return ALL_FLAGS.filter((f) => flags.has(f))
}

/** A bare number that failed to parse is an out-of-range Excel serial. */
function isImplausibleDateRaw(raw: string) {
  return /^\d+(\.\d+)?$/.test(raw.trim())
}
