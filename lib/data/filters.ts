import { categoryLabel, isCategoryId } from "@/lib/domain/categories"
import { stateGroupLabel, zoneGroupLabel, NOT_SPECIFIED } from "@/lib/domain/geography"
import type { CategoryId, DataQualityFlag, Establishment, RegistrySettings } from "@/lib/domain/types"
import { calculatedLicenceStatus, licenceExpiry, oldNewGroup, recordedStatusGroup, selectScreenCount, CALCULATED_STATUS_LABEL } from "./analytics"
import { ALL_FLAGS, FLAG_META } from "./quality/flags"
import { searchRecords } from "./search"

export type SortKey = "name" | "state" | "category" | "screens" | "seats" | "expiry" | "updated"
export type SortDir = "asc" | "desc"

export type RegistryFilters = {
  q: string
  categories: CategoryId[]
  states: string[]
  zones: string[]
  lgas: string[]
  oldNew: string[]
  recordedStatus: string[]
  calculatedStatus: string[]
  screens: "any" | "has" | "none"
  screenMin?: number
  screenMax?: number
  contact: "any" | "has" | "missing"
  flags: DataQualityFlag[]
  sort: SortKey
  dir: SortDir
}

export const EMPTY_FILTERS: RegistryFilters = {
  q: "",
  categories: [],
  states: [],
  zones: [],
  lgas: [],
  oldNew: [],
  recordedStatus: [],
  calculatedStatus: [],
  screens: "any",
  contact: "any",
  flags: [],
  sort: "name",
  dir: "asc",
}

export const SORT_LABELS: Record<SortKey, string> = {
  name: "Name",
  state: "State",
  category: "Category",
  screens: "Screens",
  seats: "Seats",
  expiry: "Expiry date",
  updated: "Last updated",
}

const SORT_KEYS = Object.keys(SORT_LABELS) as SortKey[]

/** URL parameter names. Lists are repeated parameters (?state=Lagos&state=Ogun). */
const P = {
  q: "q",
  categories: "cat",
  states: "state",
  zones: "zone",
  lgas: "lga",
  oldNew: "oldnew",
  recordedStatus: "status",
  calculatedStatus: "calc",
  screens: "screens",
  screenMin: "smin",
  screenMax: "smax",
  contact: "contact",
  flags: "flag",
  sort: "sort",
  dir: "dir",
} as const

export function filtersFromParams(params: URLSearchParams): RegistryFilters {
  const num = (v: string | null) => (v !== null && v !== "" && Number.isFinite(Number(v)) ? Number(v) : undefined)
  const screens = params.get(P.screens)
  const contact = params.get(P.contact)
  const sort = params.get(P.sort) as SortKey | null
  return {
    q: params.get(P.q) ?? "",
    categories: params.getAll(P.categories).filter(isCategoryId),
    states: params.getAll(P.states),
    zones: params.getAll(P.zones),
    lgas: params.getAll(P.lgas),
    oldNew: params.getAll(P.oldNew),
    recordedStatus: params.getAll(P.recordedStatus),
    calculatedStatus: params.getAll(P.calculatedStatus),
    screens: screens === "has" || screens === "none" ? screens : "any",
    screenMin: num(params.get(P.screenMin)),
    screenMax: num(params.get(P.screenMax)),
    contact: contact === "has" || contact === "missing" ? contact : "any",
    flags: params.getAll(P.flags).filter((f): f is DataQualityFlag => (ALL_FLAGS as string[]).includes(f)),
    sort: sort && SORT_KEYS.includes(sort) ? sort : "name",
    dir: params.get(P.dir) === "desc" ? "desc" : "asc",
  }
}

export function filtersToParams(f: RegistryFilters): URLSearchParams {
  const p = new URLSearchParams()
  if (f.q.trim()) p.set(P.q, f.q.trim())
  const lists: (keyof typeof P & keyof RegistryFilters)[] = ["categories", "states", "zones", "lgas", "oldNew", "recordedStatus", "calculatedStatus", "flags"]
  for (const key of lists) for (const v of f[key] as string[]) p.append(P[key], v)
  if (f.screens !== "any") p.set(P.screens, f.screens)
  if (f.screenMin !== undefined) p.set(P.screenMin, String(f.screenMin))
  if (f.screenMax !== undefined) p.set(P.screenMax, String(f.screenMax))
  if (f.contact !== "any") p.set(P.contact, f.contact)
  if (f.sort !== "name") p.set(P.sort, f.sort)
  if (f.dir !== "asc") p.set(P.dir, f.dir)
  return p
}

export type ActiveFilterChip = { key: string; label: string; remove: (f: RegistryFilters) => RegistryFilters }

/** Removable chips describing every active filter (search text and sort are not chips). */
export function activeFilterChips(f: RegistryFilters, fixedCategory?: CategoryId): ActiveFilterChip[] {
  const chips: ActiveFilterChip[] = []
  const listChip = <K extends "categories" | "states" | "zones" | "lgas" | "oldNew" | "recordedStatus" | "calculatedStatus" | "flags">(
    key: K,
    prefix: string,
    labelOf: (v: string) => string = (v) => v,
  ) => {
    for (const v of f[key] as string[]) {
      chips.push({
        key: `${key}:${v}`,
        label: `${prefix}: ${labelOf(v)}`,
        remove: (cur) => ({ ...cur, [key]: (cur[key] as string[]).filter((x) => x !== v) }),
      })
    }
  }
  if (!fixedCategory) listChip("categories", "Category", categoryLabel)
  listChip("states", "State")
  listChip("zones", "Zone")
  listChip("lgas", "LGA")
  listChip("oldNew", "OLD/NEW")
  listChip("recordedStatus", "Recorded status")
  listChip("calculatedStatus", "Calculated", (v) => CALCULATED_STATUS_LABEL[v as keyof typeof CALCULATED_STATUS_LABEL] ?? v)
  listChip("flags", "Issue", (v) => FLAG_META[v as DataQualityFlag]?.label ?? v)
  if (f.screens !== "any") {
    chips.push({ key: "screens", label: f.screens === "has" ? "Has screen count" : "No screen count", remove: (c) => ({ ...c, screens: "any" }) })
  }
  if (f.screenMin !== undefined || f.screenMax !== undefined) {
    const label = `Screens ${f.screenMin ?? 0}–${f.screenMax ?? "∞"}`
    chips.push({ key: "range", label, remove: (c) => ({ ...c, screenMin: undefined, screenMax: undefined }) })
  }
  if (f.contact !== "any") {
    chips.push({ key: "contact", label: f.contact === "has" ? "Has contact details" : "Missing contact details", remove: (c) => ({ ...c, contact: "any" }) })
  }
  return chips
}

/** Plain-language description of the filters, used in export metadata. */
export function describeFilters(f: RegistryFilters, fixedCategory?: CategoryId): string {
  const parts = activeFilterChips(f, fixedCategory).map((c) => c.label)
  if (fixedCategory) parts.unshift(`Register: ${categoryLabel(fixedCategory)}`)
  if (f.q.trim()) parts.unshift(`Search: "${f.q.trim()}"`)
  return parts.length ? parts.join("; ") : "None (all records)"
}

export function applyFilters(records: Establishment[], f: RegistryFilters, settings: RegistrySettings, asOf: string): Establishment[] {
  const set = (xs: string[]) => (xs.length ? new Set(xs) : null)
  const cats = set(f.categories)
  const states = set(f.states)
  const zones = set(f.zones)
  const lgas = set(f.lgas)
  const oldNew = set(f.oldNew)
  const recorded = set(f.recordedStatus)
  const calc = set(f.calculatedStatus)

  const out = searchRecords(records, f.q).filter((r) => {
    if (cats && !cats.has(r.categoryId)) return false
    if (states && !states.has(stateGroupLabel(r.state))) return false
    if (zones && !zones.has(zoneGroupLabel(r.geopoliticalZone))) return false
    if (lgas && !lgas.has(lgaGroupLabel(r.lga))) return false
    if (oldNew && !oldNew.has(oldNewGroup(r))) return false
    if (recorded && !recorded.has(recordedStatusGroup(r))) return false
    if (calc && !calc.has(calculatedLicenceStatus(r, asOf) ?? "no-date")) return false
    const screens = selectScreenCount(r, settings).value
    if (f.screens === "has" && screens === undefined) return false
    if (f.screens === "none" && screens !== undefined) return false
    if (f.screenMin !== undefined && (screens === undefined || screens < f.screenMin)) return false
    if (f.screenMax !== undefined && (screens === undefined || screens > f.screenMax)) return false
    const hasContact = !!(r.phone || r.email)
    if (f.contact === "has" && !hasContact) return false
    if (f.contact === "missing" && hasContact) return false
    if (f.flags.length && !f.flags.some((fl) => r.dataQualityFlags.includes(fl))) return false
    return true
  })
  return sortRecords(out, f.sort, f.dir, settings)
}

export function lgaGroupLabel(lga: string | undefined): string {
  return lga?.trim() ? lga.trim().replace(/\s+/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase()) : NOT_SPECIFIED
}

export function sortRecords(records: Establishment[], key: SortKey, dir: SortDir, settings: RegistrySettings) {
  const m = dir === "asc" ? 1 : -1
  const text = (a?: string, b?: string) => {
    if (!a && !b) return 0
    if (!a) return 1
    if (!b) return -1
    return a.localeCompare(b, "en", { sensitivity: "base" }) * m
  }
  const num = (a?: number, b?: number) => {
    if (a === undefined && b === undefined) return 0
    if (a === undefined) return 1
    if (b === undefined) return -1
    return (a - b) * m
  }
  const cmp: Record<SortKey, (a: Establishment, b: Establishment) => number> = {
    name: (a, b) => text(a.name, b.name),
    state: (a, b) => text(a.state && stateGroupLabel(a.state), b.state && stateGroupLabel(b.state)) || text(a.name, b.name),
    category: (a, b) => text(categoryLabel(a.categoryId), categoryLabel(b.categoryId)) || text(a.name, b.name),
    screens: (a, b) => num(selectScreenCount(a, settings).value, selectScreenCount(b, settings).value),
    seats: (a, b) => num(a.seats.total, b.seats.total),
    expiry: (a, b) => text(licenceExpiry(a), licenceExpiry(b)),
    updated: (a, b) => text(a.updatedAt, b.updatedAt),
  }
  return [...records].sort(cmp[key])
}

/** Distinct option values (with counts) for the filter drawer, computed from data. */
export function filterOptions(records: Establishment[], asOf: string) {
  const count = (label: (r: Establishment) => string) => {
    const m = new Map<string, number>()
    for (const r of records) m.set(label(r), (m.get(label(r)) ?? 0) + 1)
    return [...m.entries()]
      .map(([value, n]) => ({ value, count: n }))
      .sort((a, b) => (a.value === NOT_SPECIFIED ? 1 : b.value === NOT_SPECIFIED ? -1 : a.value.localeCompare(b.value)))
  }
  return {
    categories: count((r) => r.categoryId),
    states: count((r) => stateGroupLabel(r.state)),
    zones: count((r) => zoneGroupLabel(r.geopoliticalZone)),
    lgas: count((r) => lgaGroupLabel(r.lga)),
    oldNew: count(oldNewGroup),
    recordedStatus: count(recordedStatusGroup),
    calculatedStatus: count((r) => calculatedLicenceStatus(r, asOf) ?? "no-date"),
    flags: flagCounts(records),
  }
}

function flagCounts(records: Establishment[]) {
  const m = new Map<string, number>()
  for (const r of records) for (const f of r.dataQualityFlags) m.set(f, (m.get(f) ?? 0) + 1)
  return ALL_FLAGS.filter((f) => m.has(f)).map((f) => ({ value: f as string, count: m.get(f)! }))
}

export function countActiveFilters(f: RegistryFilters, fixedCategory?: CategoryId) {
  return activeFilterChips(f, fixedCategory).length
}
