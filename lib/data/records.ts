import type { ChangeEvent, Establishment, EstablishmentInput } from "@/lib/domain/types"
import { parseDateCell, parseSeats } from "./import/parse"
import { computeFlags } from "./quality/flags"

const blankToUndefined = (v: string | undefined) => (v === undefined || v.trim() === "" ? undefined : v.trim())

function setScreen(r: Establishment, field: "screensOld" | "screensNew" | "screens", value: number | null | undefined) {
  const rawField = `${field}Raw` as "screensOldRaw" | "screensNewRaw" | "screensRaw"
  r[field] = value ?? null
  r[rawField] = value === null || value === undefined ? undefined : String(value)
}

function setDate(r: Establishment, field: "issueDate" | "expiryDate", iso: string | undefined) {
  const v = blankToUndefined(iso)
  if (!v) {
    r[field] = undefined
    return
  }
  const parsed = parseDateCell(v)
  r[field] = { iso: parsed.iso, raw: v }
}

/** Comparable snapshot of the editable values, for change history. */
export function editableSnapshot(r: Establishment): Record<string, unknown> {
  return {
    name: r.name,
    categoryId: r.categoryId,
    state: r.state,
    geopoliticalZone: r.geopoliticalZone,
    lga: r.lga,
    address: r.address,
    contactPerson: r.contactPerson,
    phone: r.phone,
    email: r.email,
    licenceNumber: r.licenceNumber,
    recordedLicenceStatus: r.recordedLicenceStatus,
    oldNewClassification: r.oldNewClassification,
    screensOld: r.screensOld,
    screensNew: r.screensNew,
    screens: r.screens,
    screenDetails: r.screenDetails,
    screenDetailsOld: r.screenDetailsOld,
    screenDetailsNew: r.screenDetailsNew,
    seats: r.seats.raw,
    issueDate: r.issueDate?.iso ?? r.issueDate?.raw,
    expiryDate: r.expiryDate?.iso ?? r.expiryDate?.raw,
    notes: r.notes,
  }
}

/**
 * Apply an edit to a copy of the record. `sourceData` and provenance are
 * never touched, so the original workbook values remain available.
 */
export function applyInput(record: Establishment, input: EstablishmentInput, now: string) {
  const before = editableSnapshot(record)
  const r: Establishment = structuredClone(record)
  const text = ["name", "state", "geopoliticalZone", "lga", "address", "contactPerson", "phone", "email", "licenceNumber", "recordedLicenceStatus", "oldNewClassification", "screenDetails", "screenDetailsOld", "screenDetailsNew", "notes"] as const
  for (const key of text) {
    if (key in input) {
      const v = blankToUndefined(input[key])
      if (key === "name") r.name = v ?? ""
      else r[key] = v
    }
  }
  if (input.categoryId) r.categoryId = input.categoryId
  if ("screensOld" in input) setScreen(r, "screensOld", input.screensOld)
  if ("screensNew" in input) setScreen(r, "screensNew", input.screensNew)
  if ("screens" in input) setScreen(r, "screens", input.screens)
  if ("seatsRaw" in input) r.seats = parseSeats(blankToUndefined(input.seatsRaw))
  if ("issueDate" in input) setDate(r, "issueDate", input.issueDate)
  if ("expiryDate" in input) setDate(r, "expiryDate", input.expiryDate)
  r.dataQualityFlags = computeFlags(r)

  const after = editableSnapshot(r)
  const changes: ChangeEvent["changes"] = []
  for (const key of Object.keys(after)) {
    if (JSON.stringify(before[key] ?? null) !== JSON.stringify(after[key] ?? null)) {
      changes.push({ field: key, from: before[key] ?? null, to: after[key] ?? null })
    }
  }
  if (changes.length) r.updatedAt = now
  return { record: r, changes }
}

export function newLocalRecord(input: EstablishmentInput & { name: string; categoryId: Establishment["categoryId"] }, now: string): Establishment {
  const id = `local-${now.replace(/\D/g, "").slice(0, 14)}-${Math.random().toString(36).slice(2, 8)}`
  const base: Establishment = {
    id,
    sourceSheet: "Created locally",
    sourceRow: 0,
    sourceFingerprint: id,
    name: "",
    categoryId: input.categoryId,
    seats: { status: "missing" },
    dataQualityFlags: [],
    sourceData: {},
    origin: "local",
    createdAt: now,
    updatedAt: now,
  }
  if (input.categoryId === "exhibitors-premises") {
    base.screensOld = null
    base.screensNew = null
  } else {
    base.screens = null
  }
  return applyInput(base, input, now).record
}

export function newEventId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}
