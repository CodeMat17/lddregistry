import type { ParsedDate, SeatParse } from "@/lib/domain/types"

export type CellValue = string | number | boolean | null | undefined

/** Thresholds documented in docs/SCREEN_COUNT_METHODOLOGY.md. */
export const MAX_PLAUSIBLE_SCREENS = 30
export const MAX_PLAUSIBLE_SEATS = 2000
export const MIN_PLAUSIBLE_YEAR = 1990
export const MAX_PLAUSIBLE_YEAR = 2100

export function isBlank(value: CellValue): boolean {
  return value === null || value === undefined || (typeof value === "string" && value.trim() === "")
}

/** Trim and collapse internal whitespace. Returns undefined for blank cells. */
export function cleanText(value: CellValue): string | undefined {
  if (isBlank(value)) return undefined
  return String(value).replace(/\s+/g, " ").trim()
}

export function rawText(value: CellValue): string | undefined {
  if (isBlank(value)) return undefined
  return String(value)
}

/** Phone numbers are always kept as text so leading zeroes survive. */
export function cleanPhone(value: CellValue): string | undefined {
  if (isBlank(value)) return undefined
  return String(value).trim()
}

export type ScreenParse = {
  value?: number
  raw?: string
  status: "missing" | "valid" | "invalid" | "suspicious"
}

/**
 * Parse a screen-count cell. Only whole, non-negative numbers are accepted.
 * Text such as "Drive-in-Cinema" or "2medium" is never interpreted as a count.
 */
export function parseScreenCount(value: CellValue): ScreenParse {
  if (isBlank(value)) return { status: "missing" }
  const raw = String(value).trim()
  const n = typeof value === "number" ? value : /^\d+$/.test(raw) ? Number(raw) : NaN
  if (!Number.isFinite(n) || !Number.isInteger(n) || n < 0) return { raw, status: "invalid" }
  if (n > MAX_PLAUSIBLE_SCREENS) return { raw, status: "suspicious" }
  return { value: n, raw, status: "valid" }
}

/**
 * Parse Total_Seats. A plain integer or a clean comma-separated list of
 * integers is accepted; anything else is kept raw and excluded from totals.
 * Large integers (e.g. 104106) are usually lists whose commas were lost on
 * entry, so they are flagged as suspicious rather than summed.
 */
export function parseSeats(value: CellValue): SeatParse {
  if (isBlank(value)) return { status: "missing" }
  const raw = String(value).trim()
  if (typeof value === "number") {
    if (Number.isInteger(value) && value > 0 && value <= MAX_PLAUSIBLE_SEATS) {
      return { raw, total: value, status: "numeric" }
    }
    return { raw, status: "suspicious" }
  }
  const compact = raw.replace(/\s+/g, "")
  if (/^\d+$/.test(compact)) {
    const n = Number(compact)
    if (n > 0 && n <= MAX_PLAUSIBLE_SEATS) return { raw, total: n, status: "numeric" }
    return { raw, status: "suspicious" }
  }
  if (/^\d+(,\d+)+$/.test(compact)) {
    const parts = compact.split(",").map(Number)
    const total = parts.reduce((a, b) => a + b, 0)
    if (parts.some((p) => p <= 0 || p > MAX_PLAUSIBLE_SEATS) || total < 10) {
      return { raw, parts, status: "suspicious" }
    }
    return { raw, parts, total, status: "list" }
  }
  return { raw, status: "unparseable" }
}

export type DateParse = ParsedDate & { status: "missing" | "valid" | "unparseable" | "implausible" }

function pad(n: number) {
  return String(n).padStart(2, "0")
}

function isRealDate(y: number, m: number, d: number) {
  if (m < 1 || m > 12 || d < 1) return false
  const days = new Date(Date.UTC(y, m, 0)).getUTCDate()
  return d <= days
}

function plausible(y: number) {
  return y >= MIN_PLAUSIBLE_YEAR && y <= MAX_PLAUSIBLE_YEAR
}

/** Convert an Excel 1900-system serial to yyyy-mm-dd using UTC arithmetic. */
export function excelSerialToIso(serial: number): { iso: string; year: number } {
  const ms = Math.round((serial - 25569) * 86400 * 1000)
  const d = new Date(ms)
  const year = d.getUTCFullYear()
  return { iso: `${year}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`, year }
}

/**
 * Parse a date-only cell. Accepts Excel serial numbers, D/M/YYYY text (the
 * convention used in the workbook) and ISO yyyy-mm-dd. Everything else is
 * kept raw and flagged.
 */
export function parseDateCell(value: CellValue): DateParse {
  if (isBlank(value)) return { status: "missing" }
  const raw = String(value).trim()
  if (typeof value === "number") {
    if (!Number.isFinite(value) || value <= 0) return { raw, status: "unparseable" }
    const { iso, year } = excelSerialToIso(Math.floor(value))
    if (!plausible(year)) return { raw, status: "implausible" }
    return { iso, raw, status: "valid" }
  }
  let m = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(raw)
  if (m) {
    const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])]
    if (!isRealDate(y, mo, d)) return { raw, status: "unparseable" }
    if (!plausible(y)) return { raw, status: "implausible" }
    return { iso: `${y}-${pad(mo)}-${pad(d)}`, raw, status: "valid" }
  }
  m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(raw)
  if (m) {
    const [d, mo, y] = [Number(m[1]), Number(m[2]), Number(m[3])]
    if (!isRealDate(y, mo, d)) return { raw, status: "unparseable" }
    if (!plausible(y)) return { raw, status: "implausible" }
    return { iso: `${y}-${pad(mo)}-${pad(d)}`, raw, status: "valid" }
  }
  return { raw, status: "unparseable" }
}

/** FNV-1a 32-bit hash, base36. Deterministic across runs and environments. */
export function fingerprint(input: string): string {
  let h = 0x811c9dc5
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return (h >>> 0).toString(36).padStart(7, "0")
}

/** Normalised header key used to match synonymous column headings. */
export function headerKey(header: string): string {
  return header.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim()
}
