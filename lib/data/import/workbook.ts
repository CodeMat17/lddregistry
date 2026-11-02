import * as XLSX from "xlsx"
import type { CellValue } from "./parse"
import type { WorkbookSheet } from "./normalise"

function toSheets(wb: XLSX.WorkBook): WorkbookSheet[] {
  return wb.SheetNames.map((name) => ({
    name,
    rows: XLSX.utils.sheet_to_json<CellValue[]>(wb.Sheets[name], {
      header: 1,
      raw: true,
      defval: null,
      blankrows: true,
    }),
  }))
}

/** Read an .xlsx/.xls workbook. Cells keep their stored type (numbers stay numbers, text stays text). */
export function readWorkbook(data: ArrayBuffer | Uint8Array): WorkbookSheet[] {
  return toSheets(XLSX.read(data, { type: "array", cellDates: false }))
}

/** Read CSV text. `raw` keeps every value as text, so phone numbers keep leading zeroes. */
export function readCsv(text: string, sheetName: string): WorkbookSheet[] {
  const wb = XLSX.read(text.replace(/^﻿/, ""), { type: "string", raw: true })
  const [first] = toSheets(wb)
  return first ? [{ name: sheetName, rows: first.rows }] : []
}
