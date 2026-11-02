import { formatNumber } from "@/lib/format"

/** Format-neutral report used for PDF/print, the XLSX summary sheet and share text. */
export type ReportDocument = {
  title: string
  subtitle?: string
  generatedAt: string
  filters: string
  asOf?: string
  kpis: { label: string; value: string; note?: string }[]
  sections: ReportSection[]
  methodology?: string[]
}

export type ReportSection = {
  heading: string
  note?: string
  /** Simple horizontal bar visual for (label, value) tables in the PDF. */
  bars?: boolean
  table?: { columns: string[]; rows: (string | number)[][] }
  fields?: { label: string; value: string }[]
}

const esc = (s: unknown) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!)

function sectionHtml(s: ReportSection): string {
  let body = ""
  if (s.fields) {
    body += `<dl class="fields">${s.fields.map((f) => `<div><dt>${esc(f.label)}</dt><dd>${esc(f.value) || "—"}</dd></div>`).join("")}</dl>`
  }
  if (s.table) {
    const max = s.bars ? Math.max(1, ...s.table.rows.map((r) => Number(r[1]) || 0)) : 0
    body += `<table><thead><tr>${s.table.columns.map((c) => `<th>${esc(c)}</th>`).join("")}${s.bars ? '<th class="bar-col" aria-hidden="true"></th>' : ""}</tr></thead><tbody>`
    body += s.table.rows
      .map((row) => {
        const cells = row.map((v) => `<td class="${typeof v === "number" ? "num" : ""}">${esc(typeof v === "number" ? formatNumber(v) : v)}</td>`).join("")
        const bar = s.bars ? `<td class="bar-col"><span class="bar" style="width:${((Number(row[1]) || 0) / max) * 100}%"></span></td>` : ""
        return `<tr>${cells}${bar}</tr>`
      })
      .join("")
    body += "</tbody></table>"
  }
  return `<section><h2>${esc(s.heading)}</h2>${s.note ? `<p class="note">${esc(s.note)}</p>` : ""}${body}</section>`
}

/** A self-contained, print-optimised HTML document with page numbers. */
export function reportToHtml(doc: ReportDocument): string {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>${esc(doc.title)} — NFVCB LDD Registry</title>
<style>
@page { size: A4; margin: 18mm 14mm 20mm;
  @bottom-left { content: "NFVCB LDD Registry · Prototype · Local data"; font: 8pt system-ui, sans-serif; color: #64748b; }
  @bottom-right { content: "Page " counter(page) " of " counter(pages); font: 8pt system-ui, sans-serif; color: #64748b; } }
* { box-sizing: border-box; }
body { font: 10pt/1.45 "Geist", "Segoe UI", system-ui, sans-serif; color: #0f172a; margin: 0; }
header { border-bottom: 2px solid #0f2a4a; padding-bottom: 10px; margin-bottom: 14px; }
.brand { font-weight: 700; letter-spacing: .08em; font-size: 9pt; color: #0f2a4a; text-transform: uppercase; }
h1 { font-size: 18pt; margin: 4px 0 2px; }
.sub { color: #475569; margin: 0; }
.meta { display: grid; grid-template-columns: auto 1fr; gap: 2px 12px; font-size: 8.5pt; color: #334155; margin-top: 8px; }
.meta b { font-weight: 600; }
.badge { display: inline-block; border: 1px solid #b45309; color: #92400e; border-radius: 99px; padding: 1px 8px; font-size: 8pt; margin-top: 6px; }
.kpis { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin: 12px 0 4px; }
.kpi { border: 1px solid #e2e8f0; border-radius: 8px; padding: 8px 10px; break-inside: avoid; }
.kpi .l { font-size: 8pt; color: #475569; text-transform: uppercase; letter-spacing: .04em; }
.kpi .v { font-size: 15pt; font-weight: 700; font-variant-numeric: tabular-nums; }
.kpi .n { font-size: 7.5pt; color: #64748b; }
section { margin-top: 16px; break-inside: auto; }
h2 { font-size: 11.5pt; margin: 0 0 4px; color: #0f2a4a; break-after: avoid; }
.note { font-size: 8.5pt; color: #475569; margin: 0 0 6px; }
table { width: 100%; border-collapse: collapse; font-size: 8.5pt; }
thead { display: table-header-group; }
th { text-align: left; background: #f1f5f9; font-weight: 600; padding: 4px 6px; border-bottom: 1px solid #cbd5e1; }
td { padding: 3px 6px; border-bottom: 1px solid #e2e8f0; vertical-align: top; }
tr { break-inside: avoid; }
td.num { text-align: right; font-variant-numeric: tabular-nums; }
.bar-col { width: 35%; }
.bar { display: block; height: 8px; background: #0f766e; border-radius: 2px; print-color-adjust: exact; -webkit-print-color-adjust: exact; }
.fields { display: grid; grid-template-columns: 1fr 1fr; gap: 6px 16px; margin: 0; }
.fields dt { font-size: 8pt; color: #64748b; }
.fields dd { margin: 0; }
.method { margin-top: 18px; padding: 8px 10px; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 8pt; color: #334155; break-inside: avoid; }
.method ul { margin: 4px 0 0; padding-left: 16px; }
</style></head><body>
<header>
  <div class="brand">National Film and Video Censors Board · Licensing and Documentation Department</div>
  <h1>${esc(doc.title)}</h1>
  ${doc.subtitle ? `<p class="sub">${esc(doc.subtitle)}</p>` : ""}
  <div class="meta"><b>Generated</b><span>${esc(doc.generatedAt)}</span><b>Filters</b><span>${esc(doc.filters)}</span>${doc.asOf ? `<b>Reporting date</b><span>${esc(doc.asOf)}</span>` : ""}</div>
  <span class="badge">Prototype · Local data — imported from the supplied workbook; not verified by NFVCB</span>
</header>
${doc.kpis.length ? `<div class="kpis">${doc.kpis.map((k) => `<div class="kpi"><div class="l">${esc(k.label)}</div><div class="v">${esc(k.value)}</div>${k.note ? `<div class="n">${esc(k.note)}</div>` : ""}</div>`).join("")}</div>` : ""}
${doc.sections.map(sectionHtml).join("")}
${doc.methodology?.length ? `<div class="method"><b>Source and methodology</b><ul>${doc.methodology.map((m) => `<li>${esc(m)}</li>`).join("")}</ul></div>` : ""}
</body></html>`
}

/** Plain-text summary for sharing or copying. Avoids personal contact data. */
export function reportToText(doc: ReportDocument, maxRowsPerSection = 6): string {
  const lines = [`NFVCB LDD Registry — ${doc.title}`, `Generated ${doc.generatedAt}`, `Filters: ${doc.filters}`, ""]
  for (const k of doc.kpis) lines.push(`• ${k.label}: ${k.value}${k.note ? ` (${k.note})` : ""}`)
  for (const s of doc.sections) {
    if (!s.table || s.table.rows.length === 0 || s.table.columns.length > 4) continue
    lines.push("", `${s.heading}:`)
    for (const row of s.table.rows.slice(0, maxRowsPerSection)) {
      lines.push(`  ${row.map((v) => (typeof v === "number" ? formatNumber(v) : v)).join(" — ")}`)
    }
    if (s.table.rows.length > maxRowsPerSection) lines.push(`  … and ${s.table.rows.length - maxRowsPerSection} more`)
  }
  lines.push("", "Prototype · Local data — not verified by NFVCB. Figures are from the supplied workbook.")
  return lines.join("\n")
}
