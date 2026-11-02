import type { Establishment } from "@/lib/domain/types"
import { fingerprint } from "@/lib/data/import/parse"

export type DuplicateReason = "Same name" | "Same phone" | "Same email"

export type DuplicateGroup = {
  /** Stable key derived from the member IDs; used to store review decisions. */
  key: string
  recordIds: string[]
  reasons: DuplicateReason[]
  /** The shared value(s) that caused the match, for display. */
  matchedOn: string[]
  /** True when members sit in different registers (often legitimately related, not duplicates). */
  crossCategory: boolean
}

export type DuplicateDecision = "related" | "distinct" | "duplicate"

const SUFFIXES = /\b(limited|ltd|nig|nigeria|plc|company|co|inc)\b/g

/**
 * Name key: lower-case, drop punctuation and company suffixes. Bracketed
 * branch names are kept so different branches of a chain do not match.
 */
export function nameKey(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9 ]+/g, " ")
    .replace(SUFFIXES, " ")
    .replace(/\s+/g, " ")
    .trim()
}

export function phoneKey(phone: string | undefined): string | undefined {
  const digits = phone?.replace(/\D/g, "") ?? ""
  return digits.length >= 10 ? digits.slice(-10) : undefined
}

export function emailKey(email: string | undefined): string | undefined {
  const e = email?.trim().toLowerCase()
  return e && e.includes("@") ? e : undefined
}

/**
 * Group records that share one normalised name, phone or email value. Each
 * group corresponds to one shared value (no transitive chaining), and groups
 * with an identical member set are combined. Groups are suggestions only:
 * nothing is merged or deleted.
 */
export function findPossibleDuplicates(records: Establishment[]): DuplicateGroup[] {
  const groups = new Map<string, DuplicateGroup>()
  const collect = (keyOf: (r: Establishment) => string | undefined, reason: DuplicateReason, display: (r: Establishment) => string) => {
    const buckets = new Map<string, Establishment[]>()
    for (const r of records) {
      const k = keyOf(r)
      if (!k) continue
      if (!buckets.has(k)) buckets.set(k, [])
      buckets.get(k)!.push(r)
    }
    for (const members of buckets.values()) {
      if (members.length < 2) continue
      const recordIds = members.map((r) => r.id).sort()
      const key = fingerprint(recordIds.join("|"))
      const existing = groups.get(key)
      if (existing) {
        if (!existing.reasons.includes(reason)) existing.reasons.push(reason)
        existing.matchedOn.push(display(members[0]))
      } else {
        groups.set(key, {
          key,
          recordIds,
          reasons: [reason],
          matchedOn: [display(members[0])],
          crossCategory: new Set(members.map((r) => r.categoryId)).size > 1,
        })
      }
    }
  }
  collect((r) => (r.name ? nameKey(r.name) || undefined : undefined), "Same name", (r) => r.name)
  collect((r) => phoneKey(r.phone), "Same phone", (r) => r.phone ?? "")
  collect((r) => emailKey(r.email), "Same email", (r) => (r.email ?? "").toLowerCase())

  return [...groups.values()].sort(
    (a, b) => b.reasons.length - a.reasons.length || b.recordIds.length - a.recordIds.length || a.key.localeCompare(b.key),
  )
}
