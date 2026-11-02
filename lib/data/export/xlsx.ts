import * as XLSX from "xlsx"
import type { Establishment, RegistrySettings } from "@/lib/domain/types"
import type { ReportDocument } from "./report"
import { exportColumns, metadataLines, type ExportContext } from "./table"

/** Workbook with a Summary sheet (report KPIs and tables) and a Records sheet. */
export function buildWorkbook(records: Establishment[], settings: RegistrySettings, ctx: ExportContext, report?: ReportDocument) {
  const wb = XLSX.utils.book_new()

  const summary: (string | number)[][] = [...metadataLines(ctx)]
  if (report) {
    for (const k of report.kpis) summary.push([k.label, k.value, k.note ?? ""])
    for (const s of report.sections) {
      if (!s.table && !s.fields) continue
      summary.push([], [s.heading])
      if (s.note) summary.push([s.note])
      if (s.fields) for (const f of s.fields) summary.push([f.label, f.value])
      if (s.table) summary.push(s.table.columns, ...s.table.rows)
    }
    if (report.methodology?.length) summary.push([], ["Source and methodology"], ...report.methodology.map((m) => [m]))
  } else {
    summary.push(["Records exported", records.length])
  }
  const summarySheet = XLSX.utils.aoa_to_sheet(summary)
  summarySheet["!cols"] = [{ wch: 44 }, { wch: 18 }, { wch: 18 }, { wch: 14 }]
  XLSX.utils.book_append_sheet(wb, summarySheet, "Summary")

  const cols = exportColumns(settings, ctx.asOf)
  const data = [cols.map((c) => c.header), ...records.map((r) => cols.map((c) => c.value(r) ?? ""))]
  const sheet = XLSX.utils.aoa_to_sheet(data)
  sheet["!cols"] = cols.map((c) => ({ wch: c.width }))
  sheet["!autofilter"] = { ref: XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: Math.max(0, records.length), c: cols.length - 1 } }) }
  // Phone numbers are strings in the data, so they are written as text cells and keep leading zeroes.
  XLSX.utils.book_append_sheet(wb, sheet, "Records")
  return wb
}

export function downloadWorkbook(wb: XLSX.WorkBook, filename: string) {
  XLSX.writeFile(wb, filename, { compression: true })
}
