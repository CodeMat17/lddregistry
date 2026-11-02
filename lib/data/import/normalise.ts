import { categoryForSheet, getCategory } from "@/lib/domain/categories"
import { groupKey } from "@/lib/domain/geography"
import type { CategoryId, DataQualityFlag, Establishment } from "@/lib/domain/types"
import { computeFlags } from "@/lib/data/quality/flags"
import {
  type CellValue,
  cleanPhone,
  cleanText,
  fingerprint,
  headerKey,
  isBlank,
  parseDateCell,
  parseScreenCount,
  parseSeats,
} from "./parse"

/** Canonical field ← synonymous source headings (compared via headerKey). */
const COLUMN_SYNONYMS = {
  serial: ["s n", "sn", "s no", "serial", "serial no", "serial number"],
  name: ["cinema name", "name", "establishment name", "operator name", "company name", "establishment"],
  state: ["state"],
  zone: ["region", "zone", "geopolitical zone", "geo political zone"],
  lga: ["lga", "local government", "local government area"],
  address: ["precise address", "address", "full address"],
  category: ["category"],
  chain: ["chain", "chain no", "chain number"],
  screensOld: ["no of screens old", "number of screens old", "screens old"],
  screenDetailsOld: ["screen details old", "screens details old"],
  screensNew: ["no of screens new", "number of screens new", "screens new"],
  screenDetailsNew: ["screens details new", "screen details new"],
  screens: ["no of screens", "number of screens", "screens", "no screens"],
  screenDetails: ["screen details", "screens details"],
  seats: ["total seats", "seats", "seating capacity", "total seating"],
  contactPerson: ["contact person", "contact", "contact name"],
  phone: ["phone", "phone number", "telephone", "phone no", "mobile"],
  email: ["email", "e mail", "email address"],
  oldNew: ["old new", "old or new", "classification"],
  licenceStatus: ["license status", "licence status", "status"],
  issueDate: ["date of issue", "issue date", "date issued"],
  expiryDate: ["date of expiration", "expiry date", "date of expiry", "expiration date"],
  lastInspection: ["last inspection date", "last inspection", "inspection date"],
  licenceNumber: ["license number", "licence number", "license no", "licence no"],
  notes: ["notes", "remarks", "comment", "comments"],
} as const

export type CanonicalColumn = keyof typeof COLUMN_SYNONYMS

const synonymLookup = new Map<string, CanonicalColumn>()
for (const [canonical, synonyms] of Object.entries(COLUMN_SYNONYMS)) {
  for (const s of synonyms) synonymLookup.set(s, canonical as CanonicalColumn)
}

export type WorkbookSheet = { name: string; rows: CellValue[][] }

export type SheetReport = {
  sheetName: string
  categoryId?: CategoryId
  headerRow?: number
  columns: string[]
  mapped: Partial<Record<CanonicalColumn, string>>
  unmapped: string[]
  recordCount: number
  blankRowsSkipped: number
  warnings: string[]
  errors: string[]
}

export type ImportReport = {
  sourceFile: string
  generatedAt: string
  sheets: SheetReport[]
  recordCount: number
  flagCounts: Partial<Record<DataQualityFlag, number>>
  dateIssues: { recordId: string; sheet: string; row: number; field: string; raw: string }[]
  seatIssues: { recordId: string; sheet: string; row: number; raw: string; status: string }[]
  screenIssues: { recordId: string; sheet: string; row: number; field: string; raw: string }[]
}

export type NormaliseOptions = {
  sourceFile: string
  now: string
  origin: Establishment["origin"]
  /** Force every sheet into this category (used for single-sheet CSV imports). */
  categoryOverride?: CategoryId
}

/** Find the header row: the first of the top 15 rows with ≥3 recognised headings including a name column. */
export function detectHeaderRow(rows: CellValue[][]): number | undefined {
  for (let i = 0; i < Math.min(15, rows.length); i++) {
    const keys = (rows[i] ?? []).map((c) => (isBlank(c) ? "" : synonymLookup.get(headerKey(String(c)))))
    const recognised = keys.filter(Boolean).length
    if (recognised >= 3 && keys.includes("name")) return i
  }
  return undefined
}

export function normaliseWorkbook(sheets: WorkbookSheet[], opts: NormaliseOptions) {
  const records: Establishment[] = []
  const reports: SheetReport[] = []
  const usedIds = new Set<string>()

  for (const sheet of sheets) {
    const report: SheetReport = {
      sheetName: sheet.name,
      columns: [],
      mapped: {},
      unmapped: [],
      recordCount: 0,
      blankRowsSkipped: 0,
      warnings: [],
      errors: [],
    }
    reports.push(report)

    const category = opts.categoryOverride ? getCategory(opts.categoryOverride) : categoryForSheet(sheet.name)
    if (!category) {
      report.errors.push(`Worksheet "${sheet.name}" does not match any of the 10 LDD registers and was not imported.`)
      continue
    }
    report.categoryId = category.id

    const headerIdx = detectHeaderRow(sheet.rows)
    if (headerIdx === undefined) {
      report.errors.push("No header row found (expected a row with Cinema_Name, State, Region …).")
      continue
    }
    report.headerRow = headerIdx + 1

    const header = sheet.rows[headerIdx].map((c) => (isBlank(c) ? "" : String(c).trim()))
    const colIndex: Partial<Record<CanonicalColumn, number>> = {}
    header.forEach((h, i) => {
      if (!h) return
      report.columns.push(h)
      const canonical = synonymLookup.get(headerKey(h))
      if (canonical && colIndex[canonical] === undefined) {
        colIndex[canonical] = i
        report.mapped[canonical] = h
      } else {
        report.unmapped.push(h)
      }
    })
    if (report.unmapped.length) {
      report.warnings.push(`Columns kept in source data only: ${report.unmapped.join(", ")}.`)
    }
    const hasOldNew = colIndex.screensNew !== undefined || colIndex.screensOld !== undefined

    const sheetRecords: Establishment[] = []
    for (let i = headerIdx + 1; i < sheet.rows.length; i++) {
      const row = sheet.rows[i] ?? []
      if (row.every(isBlank)) {
        report.blankRowsSkipped++
        continue
      }
      const cell = (c: CanonicalColumn): CellValue => (colIndex[c] === undefined ? undefined : row[colIndex[c]!])
      const sourceRow = i + 1

      const sourceData: Establishment["sourceData"] = {}
      header.forEach((h, j) => {
        const key = h || `Column ${j + 1}`
        const v = row[j]
        sourceData[key] = v === undefined ? null : (v as string | number | boolean | null)
      })

      const serial = cell("serial")
      const nameText = cleanText(cell("name")) ?? ""
      const fp = fingerprint(`${sheet.name}|${serial ?? ""}|${nameText.toLowerCase()}`)
      let id = `${category.id}-${fingerprint(`${sheet.name}|${sourceRow}|${fp}`)}`
      while (usedIds.has(id)) id = `${id}x`
      usedIds.add(id)

      const issue = parseDateCell(cell("issueDate"))
      const expiry = parseDateCell(cell("expiryDate"))
      const inspection = parseDateCell(cell("lastInspection"))
      const sOld = parseScreenCount(cell("screensOld"))
      const sNew = parseScreenCount(cell("screensNew"))
      const sGen = parseScreenCount(cell("screens"))

      const record: Establishment = {
        id,
        sourceSheet: sheet.name,
        sourceRow,
        sourceSerialNumber: isBlank(serial) ? undefined : (serial as string | number),
        sourceFingerprint: fp,
        name: nameText,
        categoryId: category.id,
        categoryRaw: cleanText(cell("category")),
        state: cleanText(cell("state")),
        geopoliticalZone: cleanText(cell("zone")),
        lga: cleanText(cell("lga")),
        address: cleanText(cell("address")),
        chainNumber: isBlank(cell("chain")) ? undefined : (cell("chain") as string | number),
        contactPerson: cleanText(cell("contactPerson")),
        phone: cleanPhone(cell("phone")),
        email: cleanText(cell("email")),
        licenceNumber: cleanText(cell("licenceNumber")),
        recordedLicenceStatus: cleanText(cell("licenceStatus")),
        issueDate: issue.raw ? { iso: issue.iso, raw: issue.raw } : undefined,
        expiryDate: expiry.raw ? { iso: expiry.iso, raw: expiry.raw } : undefined,
        lastInspectionDate: inspection.raw ? { iso: inspection.iso, raw: inspection.raw } : undefined,
        oldNewClassification: cleanText(cell("oldNew")),
        seats: parseSeats(cell("seats")),
        notes: cleanText(cell("notes")),
        dataQualityFlags: [],
        sourceData,
        origin: opts.origin,
        createdAt: opts.now,
        updatedAt: opts.now,
      }
      if (hasOldNew) {
        record.screensOld = sOld.value ?? null
        record.screensOldRaw = sOld.raw
        record.screenDetailsOld = cleanText(cell("screenDetailsOld"))
        record.screensNew = sNew.value ?? null
        record.screensNewRaw = sNew.raw
        record.screenDetailsNew = cleanText(cell("screenDetailsNew"))
      } else {
        record.screens = sGen.value ?? null
        record.screensRaw = sGen.raw
        record.screenDetails = cleanText(cell("screenDetails"))
      }
      sheetRecords.push(record)
    }

    // Category text variants: compare each row with the most common value in its sheet.
    const counts = new Map<string, number>()
    for (const r of sheetRecords) {
      if (r.categoryRaw) counts.set(groupKey(r.categoryRaw), (counts.get(groupKey(r.categoryRaw)) ?? 0) + 1)
    }
    const usual = [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0]
    for (const r of sheetRecords) {
      if (usual && counts.size > 1 && r.categoryRaw && groupKey(r.categoryRaw) !== usual) {
        r.dataQualityFlags = ["category-variant"]
      }
      r.dataQualityFlags = computeFlags(r)
    }

    report.recordCount = sheetRecords.length
    records.push(...sheetRecords)
  }

  return { records, report: buildReport(records, reports, opts) }
}

function buildReport(records: Establishment[], sheets: SheetReport[], opts: NormaliseOptions): ImportReport {
  const flagCounts: ImportReport["flagCounts"] = {}
  const dateIssues: ImportReport["dateIssues"] = []
  const seatIssues: ImportReport["seatIssues"] = []
  const screenIssues: ImportReport["screenIssues"] = []
  for (const r of records) {
    for (const f of r.dataQualityFlags) flagCounts[f] = (flagCounts[f] ?? 0) + 1
    const dates: [string, typeof r.issueDate][] = [
      ["Date_of_Issue", r.issueDate],
      ["Date_of_Expiration", r.expiryDate],
      ["Last_Inspection_Date", r.lastInspectionDate],
    ]
    for (const [field, d] of dates) {
      if (d?.raw && !d.iso) dateIssues.push({ recordId: r.id, sheet: r.sourceSheet, row: r.sourceRow, field, raw: d.raw })
    }
    if (r.seats.status === "suspicious" || r.seats.status === "unparseable") {
      seatIssues.push({ recordId: r.id, sheet: r.sourceSheet, row: r.sourceRow, raw: r.seats.raw ?? "", status: r.seats.status })
    }
    const screenCells: [string, number | null | undefined, string | undefined][] = [
      ["No of Screens OLD", r.screensOld, r.screensOldRaw],
      ["No of Screens NEW", r.screensNew, r.screensNewRaw],
      ["No_of_Screens", r.screens, r.screensRaw],
    ]
    for (const [field, value, raw] of screenCells) {
      if (raw && (value === null || value === undefined)) {
        screenIssues.push({ recordId: r.id, sheet: r.sourceSheet, row: r.sourceRow, field, raw })
      }
    }
  }
  return {
    sourceFile: opts.sourceFile,
    generatedAt: opts.now,
    sheets,
    recordCount: records.length,
    flagCounts,
    dateIssues,
    seatIssues,
    screenIssues,
  }
}
