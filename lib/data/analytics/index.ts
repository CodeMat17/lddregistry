import { CATEGORIES, getCategory } from "@/lib/domain/categories"
import { isRecognisedState, stateGroupLabel, zoneGroupLabel, NOT_SPECIFIED } from "@/lib/domain/geography"
import type { CategoryId, DataQualityFlag, Establishment, RegistrySettings } from "@/lib/domain/types"
import { nameKey } from "@/lib/data/quality/duplicates"
import { FLAG_META } from "@/lib/data/quality/flags"
import { calculatedLicenceStatus, daysToExpiry, recordedStatusGroup } from "./licence"
import { selectScreenCount } from "./screens"

export * from "./licence"
export * from "./screens"

export type ScreenTotals = {
  total: number
  /** Records whose count was included in the total. */
  contributing: number
  fromNew: number
  fromOld: number
  fromGeneric: number
  /** Records in screen-relevant registers with no usable count. */
  missing: number
  /** Records with a screen cell that was excluded as invalid or suspicious. */
  excludedInvalid: number
}

export type SeatTotals = {
  total: number
  contributing: number
  missing: number
  suspicious: number
  unparseable: number
}

export type GroupRow = { label: string; count: number; screens: number; seats: number; recognised?: boolean }

export type CategorySummary = {
  id: CategoryId
  label: string
  count: number
  screens: ScreenTotals
  seats: SeatTotals
  /** Expired licences, calculated as one year from the issue date. */
  expired: number
}

export type CompletenessField = { key: string; label: string; filled: number; pct: number }

export type Analytics = {
  totalRecords: number
  distinctNames: number
  screens: ScreenTotals
  seats: SeatTotals
  categories: CategorySummary[]
  states: GroupRow[]
  statesRecognised: number
  unrecognisedStateValues: number
  zones: GroupRow[]
  completeness: { fields: CompletenessField[]; overallPct: number; fullyCompleteRecords: number }
  licensing: {
    recorded: { label: string; count: number }[]
    withExpiryDate: number
    expired: number
    expiring30: number
    expiring60: number
    expiring90: number
    inDate: number
    noUsableExpiry: number
  }
  inspections: { withDate: number }
  quality: {
    flagCounts: { flag: DataQualityFlag; count: number }[]
    recordsWithWarnings: number
    recordsClean: number
  }
}

function emptyScreens(): ScreenTotals {
  return { total: 0, contributing: 0, fromNew: 0, fromOld: 0, fromGeneric: 0, missing: 0, excludedInvalid: 0 }
}

function emptySeats(): SeatTotals {
  return { total: 0, contributing: 0, missing: 0, suspicious: 0, unparseable: 0 }
}

function addScreens(t: ScreenTotals, r: Establishment, settings: RegistrySettings) {
  const sel = selectScreenCount(r, settings)
  if (sel.value !== undefined) {
    t.total += sel.value
    t.contributing++
    if (sel.source === "new") t.fromNew++
    else if (sel.source === "old") t.fromOld++
    else t.fromGeneric++
  } else if (getCategory(r.categoryId)?.screensRelevant) {
    t.missing++
  }
  if (r.dataQualityFlags.includes("invalid-screens") || r.dataQualityFlags.includes("suspicious-screens")) {
    t.excludedInvalid++
  }
}

function addSeats(t: SeatTotals, r: Establishment) {
  const s = r.seats
  if (s.total !== undefined && (s.status === "numeric" || s.status === "list")) {
    t.total += s.total
    t.contributing++
  } else if (s.status === "suspicious") t.suspicious++
  else if (s.status === "unparseable") t.unparseable++
  else if (getCategory(r.categoryId)?.screensRelevant) t.missing++
}

function groupBy(records: Establishment[], label: (r: Establishment) => string, settings: RegistrySettings) {
  const map = new Map<string, GroupRow>()
  for (const r of records) {
    const key = label(r)
    const row = map.get(key) ?? { label: key, count: 0, screens: 0, seats: 0 }
    row.count++
    row.screens += selectScreenCount(r, settings).value ?? 0
    if (r.seats.status === "numeric" || r.seats.status === "list") row.seats += r.seats.total ?? 0
    map.set(key, row)
  }
  return [...map.values()].sort((a, b) => {
    if (a.label === NOT_SPECIFIED) return 1
    if (b.label === NOT_SPECIFIED) return -1
    return b.count - a.count || a.label.localeCompare(b.label)
  })
}

const COMPLETENESS_FIELDS: { key: string; label: string; has: (r: Establishment) => boolean }[] = [
  { key: "name", label: "Name", has: (r) => !!r.name },
  { key: "state", label: "State", has: (r) => !!r.state },
  { key: "zone", label: "Zone", has: (r) => !!r.geopoliticalZone },
  { key: "lga", label: "LGA", has: (r) => !!r.lga },
  { key: "address", label: "Address", has: (r) => !!r.address },
  { key: "contact", label: "Phone or email", has: (r) => !!(r.phone || r.email) },
  { key: "status", label: "Licence status", has: (r) => !!r.recordedLicenceStatus },
]

/** Central, pure analytics. Every dashboard and report figure comes from here. */
export function computeAnalytics(records: Establishment[], settings: RegistrySettings, asOf: string): Analytics {
  const screens = emptyScreens()
  const seats = emptySeats()
  const perCategory = new Map<CategoryId, CategorySummary>(
    CATEGORIES.map((c) => [c.id, { id: c.id, label: c.label, count: 0, screens: emptyScreens(), seats: emptySeats(), expired: 0 }]),
  )
  const flagCounts = new Map<DataQualityFlag, number>()
  let recordsWithWarnings = 0
  const recorded = new Map<string, number>()
  const lic = { withExpiryDate: 0, expired: 0, expiring30: 0, expiring60: 0, expiring90: 0, inDate: 0, noUsableExpiry: 0 }
  let inspections = 0
  const filled = COMPLETENESS_FIELDS.map(() => 0)
  let fullyComplete = 0

  for (const r of records) {
    addScreens(screens, r, settings)
    addSeats(seats, r)
    const cat = perCategory.get(r.categoryId)
    if (cat) {
      cat.count++
      addScreens(cat.screens, r, settings)
      addSeats(cat.seats, r)
    }

    let warn = false
    for (const f of r.dataQualityFlags) {
      flagCounts.set(f, (flagCounts.get(f) ?? 0) + 1)
      if (FLAG_META[f].severity !== "info") warn = true
    }
    if (warn) recordsWithWarnings++

    const g = recordedStatusGroup(r)
    recorded.set(g, (recorded.get(g) ?? 0) + 1)
    const status = calculatedLicenceStatus(r, asOf)
    if (cat && status === "expired") cat.expired++
    if (status === undefined) lic.noUsableExpiry++
    else {
      lic.withExpiryDate++
      if (status === "expired") lic.expired++
      else {
        const d = daysToExpiry(r, asOf)!
        if (d <= 30) lic.expiring30++
        if (d <= 60) lic.expiring60++
        if (d <= 90) lic.expiring90++
        if (status === "valid") lic.inDate++
      }
    }
    if (r.lastInspectionDate?.iso) inspections++

    let all = true
    COMPLETENESS_FIELDS.forEach((f, i) => {
      if (f.has(r)) filled[i]++
      else all = false
    })
    if (all) fullyComplete++
  }

  const states = groupBy(records, (r) => stateGroupLabel(r.state), settings).map((row) => ({
    ...row,
    recognised: row.label !== NOT_SPECIFIED && isRecognisedState(row.label),
  }))
  const n = records.length || 1
  const fields = COMPLETENESS_FIELDS.map((f, i) => ({ key: f.key, label: f.label, filled: filled[i], pct: (filled[i] / n) * 100 }))

  return {
    totalRecords: records.length,
    distinctNames: new Set(records.filter((r) => r.name).map((r) => nameKey(r.name))).size,
    screens,
    seats,
    categories: [...perCategory.values()],
    states,
    statesRecognised: states.filter((s) => s.recognised).length,
    unrecognisedStateValues: states.filter((s) => !s.recognised && s.label !== NOT_SPECIFIED).length,
    zones: groupBy(records, (r) => zoneGroupLabel(r.geopoliticalZone), settings),
    completeness: {
      fields,
      overallPct: records.length ? fields.reduce((a, f) => a + f.pct, 0) / fields.length : 0,
      fullyCompleteRecords: fullyComplete,
    },
    licensing: {
      recorded: [...recorded.entries()].map(([label, count]) => ({ label, count })).sort((a, b) => b.count - a.count),
      ...lic,
    },
    inspections: { withDate: inspections },
    quality: {
      flagCounts: [...flagCounts.entries()].map(([flag, count]) => ({ flag, count })).sort((a, b) => b.count - a.count),
      recordsWithWarnings,
      recordsClean: records.filter((r) => r.dataQualityFlags.length === 0).length,
    },
  }
}
