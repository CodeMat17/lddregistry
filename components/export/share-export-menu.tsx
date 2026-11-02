"use client"

import * as React from "react"
import { Copy, FileDown, FileSpreadsheet, FileText, Printer, Share2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useRegistry } from "@/components/providers/registry-provider"
import type { Establishment } from "@/lib/domain/types"
import { recordsToCsv } from "@/lib/data/export/csv"
import { copyText, downloadText, exportFilename, printHtml, shareOrCopy } from "@/lib/data/export/download"
import { reportToHtml, reportToText, type ReportDocument } from "@/lib/data/export/report"
import { formatIsoDate, formatTimestamp } from "@/lib/format"

export type ShareExportMenuProps = {
  title: string
  /** Records in the current (filtered) view. */
  records: Establishment[]
  filters: string
  report: () => ReportDocument
  shareText?: () => string
  label?: string
  /** Hide CSV/XLSX items (e.g. for a single profile, which offers its own). */
  tabular?: boolean
  className?: string
}

export function ShareExportMenu({ title, records, filters, report, shareText, label = "Share / Export", tabular = true, className }: ShareExportMenuProps) {
  const { settings, asOf } = useRegistry()
  const ctx = () => ({ title, filters, generatedAt: formatTimestamp(new Date().toISOString()), asOf: formatIsoDate(asOf) })
  const text = () => (shareText ? shareText() : reportToText(report()))

  const run = (fn: () => void | Promise<void>, success?: string) => async () => {
    try {
      await fn()
      if (success) toast.success(success)
    } catch (e) {
      toast.error((e as Error).message || "That action could not be completed.")
    }
  }

  const items = {
    pdf: run(() => printHtml(reportToHtml(report())), "Print dialog opened — choose “Save as PDF” to download."),
    xlsx: run(async () => {
      const { buildWorkbook, downloadWorkbook } = await import("@/lib/data/export/xlsx")
      downloadWorkbook(buildWorkbook(records, settings, ctx(), report()), exportFilename(title, "xlsx"))
    }, `Excel workbook downloaded (${records.length} records).`),
    csv: run(() => {
      downloadText(recordsToCsv(records, settings, ctx()), exportFilename(title, "csv"), "text/csv;charset=utf-8")
    }, `CSV downloaded (${records.length} records).`),
    print: run(() => window.print()),
    share: run(async () => {
      const result = await shareOrCopy(`NFVCB LDD Registry — ${title}`, text())
      if (result === "copied") toast.success("Sharing isn't available here, so the summary was copied to your clipboard.")
      if (result === "shared") toast.success("Shared.")
    }),
    copy: run(() => copyText(text()), "Summary copied to clipboard."),
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="outline" className={className ?? "h-10 gap-2"} />}>
        <Share2 className="size-4" aria-hidden />
        {label}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Download</DropdownMenuLabel>
          <DropdownMenuItem className="min-h-10" onClick={items.pdf}>
            <FileText aria-hidden />
            Download PDF report
          </DropdownMenuItem>
          {tabular && (
            <>
              <DropdownMenuItem className="min-h-10" onClick={items.xlsx}>
                <FileSpreadsheet aria-hidden />
                Download Excel workbook
              </DropdownMenuItem>
              <DropdownMenuItem className="min-h-10" onClick={items.csv}>
                <FileDown aria-hidden />
                Download CSV
              </DropdownMenuItem>
            </>
          )}
          <DropdownMenuItem className="min-h-10" onClick={items.print}>
            <Printer aria-hidden />
            Print this page
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuLabel>Share</DropdownMenuLabel>
          <DropdownMenuItem className="min-h-10" onClick={items.share}>
            <Share2 aria-hidden />
            Share summary
          </DropdownMenuItem>
          <DropdownMenuItem className="min-h-10" onClick={items.copy}>
            <Copy aria-hidden />
            Copy summary
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <p className="px-2 py-1.5 text-[0.7rem] leading-snug text-muted-foreground">
          {tabular ? `Exports the ${records.length} records in this view. ` : ""}No public links are created; shared text contains summary figures only.
        </p>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
