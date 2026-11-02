import type { Establishment, RegistrySettings } from "@/lib/domain/types"
import { exportColumns, metadataLines, type ExportContext } from "./table"

/** RFC 4180 escaping: quote fields containing commas, quotes or line breaks. */
export function csvField(value: unknown): string {
  if (value === undefined || value === null) return ""
  const s = String(value)
  return /[",\r\n]/.test(s) || /^\s|\s$/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

/** UTF-8 with BOM so Excel opens it with the right encoding. */
export function toCsv(rows: unknown[][]): string {
  return "﻿" + rows.map((row) => row.map(csvField).join(",")).join("\r\n")
}

export function recordsToCsv(records: Establishment[], settings: RegistrySettings, ctx: ExportContext): string {
  const cols = exportColumns(settings, ctx.asOf)
  return toCsv([
    ...metadataLines(ctx),
    cols.map((c) => c.header),
    ...records.map((r) => cols.map((c) => c.value(r))),
  ])
}
