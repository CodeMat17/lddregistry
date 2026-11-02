import { groupKey, titleCase } from "@/lib/domain/geography"
import type { Establishment } from "@/lib/domain/types"

export type CalculatedLicenceStatus = "expired" | "expiring" | "valid"

export const CALCULATED_STATUS_LABEL: Record<CalculatedLicenceStatus | "no-date", string> = {
  expired: "Expired (calculated)",
  expiring: "Expiring ≤ 90 days (calculated)",
  valid: "In date (calculated)",
  "no-date": "No readable issue date",
}

export const NOT_RECORDED = "Not recorded"

/** Local calendar date as yyyy-mm-dd (no UTC shift). */
export function todayIso(now = new Date()): string {
  const p = (n: number) => String(n).padStart(2, "0")
  return `${now.getFullYear()}-${p(now.getMonth() + 1)}-${p(now.getDate())}`
}

/** Whole days from `fromIso` to `toIso`, both date-only. */
export function daysBetween(fromIso: string, toIso: string): number {
  const toUtc = (iso: string) => {
    const [y, m, d] = iso.split("-").map(Number)
    return Date.UTC(y, m - 1, d)
  }
  return Math.round((toUtc(toIso) - toUtc(fromIso)) / 86400000)
}

/**
 * Licences run for one year: the last valid day is the day before the issue
 * anniversary (e.g. issued 2025-03-10 → expires 2026-03-09). A 29 February
 * issue expires on 28 February.
 */
export function expiryFromIssue(issueIso: string): string {
  const [y, m, d] = issueIso.split("-").map(Number)
  const t = new Date(Date.UTC(y + 1, m - 1, d - 1))
  return t.toISOString().slice(0, 10)
}

/**
 * The licence's expiry date: one year from the issue date. Blank (undefined)
 * when the issue date is absent or unparseable — the workbook's own
 * `Date_of_Expiration` is never used; it stays in `sourceData` only.
 */
export function licenceExpiry(r: Establishment): string | undefined {
  return r.issueDate?.iso ? expiryFromIssue(r.issueDate.iso) : undefined
}

/** Days until expiry relative to `asOf`; undefined when the issue date is unusable. */
export function daysToExpiry(r: Establishment, asOf: string): number | undefined {
  const e = licenceExpiry(r)
  return e ? daysBetween(asOf, e) : undefined
}

/**
 * Status derived from the licence expiry (see `licenceExpiry`). A licence is
 * expired when that date is before the reporting date. This is not the official status.
 */
export function calculatedLicenceStatus(r: Establishment, asOf: string): CalculatedLicenceStatus | undefined {
  const days = daysToExpiry(r, asOf)
  if (days === undefined) return undefined
  if (days < 0) return "expired"
  if (days <= 90) return "expiring"
  return "valid"
}

/** Grouping label for the recorded status (fixes case/whitespace only). */
export function recordedStatusGroup(r: Establishment): string {
  return r.recordedLicenceStatus ? titleCase(groupKey(r.recordedLicenceStatus)) : NOT_RECORDED
}

export function oldNewGroup(r: Establishment): string {
  return r.oldNewClassification ? titleCase(groupKey(r.oldNewClassification)) : NOT_RECORDED
}
