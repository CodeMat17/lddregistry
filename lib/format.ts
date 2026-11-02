import type { ParsedDate } from "@/lib/domain/types"

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

/** Format a date-only ISO string without constructing a Date (no timezone shift). */
export function formatIsoDate(iso: string | undefined): string {
  if (!iso) return ""
  const [y, m, d] = iso.split("-").map(Number)
  if (!y || !m || !d) return iso
  return `${d} ${MONTHS[m - 1]} ${y}`
}

/** Parsed dates show formatted; unparseable ones show the raw source text. */
export function formatParsedDate(d: ParsedDate | undefined): string {
  if (!d) return ""
  return d.iso ? formatIsoDate(d.iso) : (d.raw ?? "")
}

export function formatTimestamp(iso: string | undefined): string {
  if (!iso) return ""
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })
}

const nf = new Intl.NumberFormat("en-NG")

export function formatNumber(n: number | undefined | null): string {
  return n === undefined || n === null ? "—" : nf.format(n)
}

export function formatPct(n: number, digits = 0): string {
  return `${n.toFixed(digits)}%`
}

export function plural(n: number, one: string, many = `${one}s`) {
  return `${formatNumber(n)} ${n === 1 ? one : many}`
}

export function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60)
}
