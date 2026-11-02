import { categoryLabel } from "@/lib/domain/categories"
import type { Establishment, RegistrySettings } from "@/lib/domain/types"
import { calculatedLicenceStatus, CALCULATED_STATUS_LABEL, licenceExpiry, selectScreenCount, SCREEN_SOURCE_LABEL } from "@/lib/data/analytics"
import { FLAG_META } from "@/lib/data/quality/flags"

export type ExportColumn = { header: string; width: number; value: (r: Establishment) => string | number | undefined }

/**
 * Export columns. Header names are chosen so a CSV exported here can be
 * re-imported (they match the importer's column synonyms).
 */
export function exportColumns(settings: RegistrySettings, asOf: string): ExportColumn[] {
  return [
    { header: "Name", width: 36, value: (r) => r.name },
    { header: "Register", width: 22, value: (r) => categoryLabel(r.categoryId) },
    { header: "Category", width: 22, value: (r) => r.categoryRaw },
    { header: "State", width: 14, value: (r) => r.state },
    { header: "Geopolitical zone", width: 16, value: (r) => r.geopoliticalZone },
    { header: "LGA", width: 16, value: (r) => r.lga },
    { header: "Address", width: 40, value: (r) => r.address },
    { header: "Contact person", width: 24, value: (r) => r.contactPerson },
    { header: "Phone", width: 16, value: (r) => r.phone },
    { header: "Email", width: 28, value: (r) => r.email },
    { header: "Licence number", width: 16, value: (r) => r.licenceNumber },
    { header: "OLD/NEW", width: 10, value: (r) => r.oldNewClassification },
    { header: "Licence status", width: 14, value: (r) => r.recordedLicenceStatus },
    {
      header: "Calculated status (from issue date)",
      width: 22,
      value: (r) => CALCULATED_STATUS_LABEL[calculatedLicenceStatus(r, asOf) ?? "no-date"],
    },
    { header: "Date of issue", width: 12, value: (r) => r.issueDate?.iso ?? r.issueDate?.raw },
    { header: "Date of expiration", width: 12, value: (r) => licenceExpiry(r) },
    { header: "No of Screens OLD", width: 10, value: (r) => r.screensOld ?? r.screensOldRaw },
    { header: "Screen details OLD", width: 18, value: (r) => r.screenDetailsOld },
    { header: "No of Screens NEW", width: 10, value: (r) => r.screensNew ?? r.screensNewRaw },
    { header: "Screens details NEW", width: 18, value: (r) => r.screenDetailsNew },
    { header: "No of Screens", width: 10, value: (r) => r.screens ?? r.screensRaw },
    { header: "Screen details", width: 18, value: (r) => r.screenDetails },
    { header: "Screens used in totals", width: 10, value: (r) => selectScreenCount(r, settings).value },
    { header: "Screen count source", width: 16, value: (r) => SCREEN_SOURCE_LABEL[selectScreenCount(r, settings).source] },
    { header: "Total seats", width: 18, value: (r) => r.seats.raw },
    { header: "Seats used in totals", width: 10, value: (r) => (r.seats.status === "numeric" || r.seats.status === "list" ? r.seats.total : undefined) },
    { header: "Notes", width: 24, value: (r) => r.notes },
    { header: "Data-quality flags", width: 30, value: (r) => r.dataQualityFlags.map((f) => FLAG_META[f].label).join("; ") },
    { header: "Source sheet", width: 20, value: (r) => r.sourceSheet },
    { header: "Source row", width: 8, value: (r) => r.sourceRow || undefined },
    { header: "Record ID", width: 24, value: (r) => r.id },
  ]
}

export type ExportContext = {
  title: string
  filters: string
  generatedAt: string
  asOf: string
}

export function metadataLines(ctx: ExportContext): string[][] {
  return [
    [`NFVCB LDD Registry — ${ctx.title}`],
    [`Generated: ${ctx.generatedAt}`],
    [`Filters: ${ctx.filters}`],
    [`Reporting date for calculated licence status: ${ctx.asOf}`],
    ["Prototype · Local data. Imported from the supplied workbook; not verified by NFVCB."],
    [],
  ]
}
