import { categoryLabel } from "@/lib/domain/categories"
import type { Establishment } from "@/lib/domain/types"

/** Lower-case, strip diacritics, collapse whitespace. */
export function normaliseQuery(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim()
}

const haystackCache = new WeakMap<Establishment, string>()

function haystack(r: Establishment): string {
  let h = haystackCache.get(r)
  if (h === undefined) {
    h = normaliseQuery(
      [
        r.name,
        r.contactPerson,
        r.state,
        r.geopoliticalZone,
        r.lga,
        r.address,
        r.phone,
        r.phone?.replace(/\D/g, ""),
        r.email,
        categoryLabel(r.categoryId),
        r.categoryRaw,
        r.licenceNumber,
      ]
        .filter(Boolean)
        .join(" \u0001 "),
    )
    haystackCache.set(r, h)
  }
  return h
}

/** Every whitespace-separated term must appear somewhere in the record. */
export function matchesQuery(r: Establishment, query: string): boolean {
  const terms = normaliseQuery(query).split(" ").filter(Boolean)
  if (!terms.length) return true
  const h = haystack(r)
  return terms.every((t) => h.includes(t))
}

export function searchRecords(records: Establishment[], query: string): Establishment[] {
  const q = normaliseQuery(query)
  if (!q) return records
  return records.filter((r) => matchesQuery(r, q))
}

/** Split `text` into segments marking query matches, for highlighting. */
export function highlightSegments(text: string, query: string): { text: string; match: boolean }[] {
  const terms = normaliseQuery(query)
    .split(" ")
    .filter((t) => t.length > 0)
    .map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
  if (!terms.length || !text) return [{ text, match: false }]
  const re = new RegExp(`(${terms.join("|")})`, "gi")
  return text
    .split(re)
    .filter((s) => s !== "")
    .map((s) => ({ text: s, match: terms.some((t) => new RegExp(`^${t}$`, "i").test(s)) }))
}
