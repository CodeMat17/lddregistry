import { categoryLabel } from "@/lib/domain/categories"
import type { Establishment, RegistrySettings } from "@/lib/domain/types"
import { formatIsoDate, formatNumber, formatParsedDate, formatPct } from "@/lib/format"
import {
  type Analytics,
  CALCULATED_STATUS_LABEL,
  calculatedLicenceStatus,
  licenceExpiry,
  SCREEN_METHODOLOGY,
  SCREEN_SOURCE_LABEL,
  SEAT_METHODOLOGY,
  selectScreenCount,
} from "./analytics"
import type { ReportDocument, ReportSection } from "./export/report"
import { FLAG_META } from "./quality/flags"
import { stateGroupLabel, zoneGroupLabel } from "@/lib/domain/geography"

export type ReportContext = { generatedAt: string; filters: string; asOf: string; settings: RegistrySettings }

const methodology = (settings: RegistrySettings) => [
  "Source: the supplied workbook DATABASE UPDATE-1.xlsx plus any local edits or imports made in this browser.",
  `Screens: ${SCREEN_METHODOLOGY} NEW is used where valid; ${settings.useOldScreenFallback ? "OLD is used as a fallback when NEW is missing (enabled in Settings)." : "OLD is not used as a fallback (can be enabled in Settings)."} OLD and NEW are never added together.`,
  `Seats: ${SEAT_METHODOLOGY}`,
  "Record counts are imported rows, not verified unique establishments. An operator may appear in more than one register.",
  "Licences run for one year from the date of issue. Expiry and status are calculated from the issue date against the reporting date; records with a missing or unreadable issue date cannot be calculated and are counted separately.",
]

function screensCaption(a: Analytics) {
  return `${formatNumber(a.screens.contributing)} records contribute; ${formatNumber(a.screens.missing)} exhibition records have no usable count`
}

function seatsCaption(a: Analytics) {
  const excluded = a.seats.suspicious + a.seats.unparseable
  return `${formatNumber(a.seats.contributing)} records contribute; ${formatNumber(excluded)} excluded as ambiguous`
}

export function headlineKpis(a: Analytics): ReportDocument["kpis"] {
  return [
    { label: "Registered records", value: formatNumber(a.totalRecords), note: `${formatNumber(a.distinctNames)} distinct names (unverified)` },
    { label: "Recorded screens", value: formatNumber(a.screens.total), note: screensCaption(a) },
    { label: "Recorded seating capacity", value: formatNumber(a.seats.total), note: seatsCaption(a) },
    { label: "Categories", value: formatNumber(a.categories.length), note: "Source registers" },
    { label: "States represented", value: formatNumber(a.statesRecognised), note: `${a.unrecognisedStateValues} other values (e.g. cities) not counted` },
    { label: "Data completeness", value: formatPct(a.completeness.overallPct), note: "Average fill rate of 7 key fields" },
  ]
}

const qualitySection = (a: Analytics): ReportSection => ({
  heading: "Data-quality issues",
  note: `${formatNumber(a.quality.recordsWithWarnings)} records have at least one warning; ${formatNumber(a.quality.recordsClean)} have no flags.`,
  table: {
    columns: ["Issue", "Severity", "Records"],
    rows: a.quality.flagCounts.map((f) => [FLAG_META[f.flag].label, FLAG_META[f.flag].severity, f.count]),
  },
})

export function buildQualityReport(records: Establishment[], a: Analytics, ctx: ReportContext): ReportDocument {
  return {
    title: "Data completeness & quality",
    generatedAt: ctx.generatedAt,
    filters: ctx.filters,
    asOf: formatIsoDate(ctx.asOf),
    methodology: methodology(ctx.settings),
    kpis: [
      { label: "Data completeness", value: formatPct(a.completeness.overallPct), note: "Average of 7 key fields" },
      { label: "Fully complete records", value: formatNumber(a.completeness.fullyCompleteRecords) },
      { label: "Records with warnings", value: formatNumber(a.quality.recordsWithWarnings) },
    ],
    sections: [
      { heading: "Field completeness", table: { columns: ["Field", "Populated", "%"], rows: a.completeness.fields.map((f) => [f.label, f.filled, formatPct(f.pct, 1)]) } },
      qualitySection(a),
    ],
  }
}

/** Report for a filtered register/search result: summary plus the listed records. */
export function buildRegisterReport(title: string, records: Establishment[], a: Analytics, ctx: ReportContext): ReportDocument {
  return {
    title,
    generatedAt: ctx.generatedAt,
    filters: ctx.filters,
    asOf: formatIsoDate(ctx.asOf),
    kpis: headlineKpis(a).slice(0, 3),
    sections: [
      {
        heading: `Records (${formatNumber(records.length)})`,
        table: {
          columns: ["Name", "Register", "State", "Zone", "Screens", "Licence status"],
          rows: records.map((r) => [
            r.name || "Unnamed record",
            categoryLabel(r.categoryId),
            stateGroupLabel(r.state),
            zoneGroupLabel(r.geopoliticalZone),
            selectScreenCount(r, ctx.settings).value ?? "—",
            r.recordedLicenceStatus ?? "—",
          ]),
        },
      },
    ],
    methodology: methodology(ctx.settings),
  }
}

export function buildProfileReport(r: Establishment, ctx: ReportContext): ReportDocument {
  const sel = selectScreenCount(r, ctx.settings)
  const status = calculatedLicenceStatus(r, ctx.asOf)
  const opt = (label: string, value: string | number | undefined | null) => ({ label, value: value === undefined || value === null || value === "" ? "Not provided in source" : String(value) })
  const sections: ReportSection[] = [
    {
      heading: "Overview",
      fields: [
        opt("Register", categoryLabel(r.categoryId)),
        opt("Category (source text)", r.categoryRaw),
        opt("Source", r.origin === "local" ? "Created locally" : `${r.sourceSheet}, row ${r.sourceRow}`),
        opt("Serial number", r.sourceSerialNumber),
      ],
    },
    { heading: "Location", fields: [opt("State", r.state), opt("Geopolitical zone", r.geopoliticalZone), opt("LGA", r.lga), opt("Address", r.address)] },
    { heading: "Contacts", fields: [opt("Contact person", r.contactPerson), opt("Phone", r.phone), opt("Email", r.email)] },
    {
      heading: "Screens & capacity",
      note: SCREEN_METHODOLOGY,
      fields: [
        opt("Screens used in totals", sel.value !== undefined ? `${sel.value} (${SCREEN_SOURCE_LABEL[sel.source]})` : undefined),
        ...(r.screensNew !== undefined || r.screensOld !== undefined
          ? [opt("Screens NEW", r.screensNew ?? r.screensNewRaw), opt("Screen details NEW", r.screenDetailsNew), opt("Screens OLD", r.screensOld ?? r.screensOldRaw), opt("Screen details OLD", r.screenDetailsOld)]
          : [opt("No of screens", r.screens ?? r.screensRaw), opt("Screen details", r.screenDetails)]),
        opt("Total seats (as recorded)", r.seats.raw),
        opt("Seats used in totals", r.seats.status === "numeric" || r.seats.status === "list" ? r.seats.total : undefined),
      ],
    },
    {
      heading: "Licensing",
      fields: [
        opt("Recorded licence status", r.recordedLicenceStatus),
        opt("Calculated from issue date", status ? CALCULATED_STATUS_LABEL[status] : undefined),
        opt("OLD/NEW classification", r.oldNewClassification),
        opt("Licence number", r.licenceNumber),
        opt("Date of issue", formatParsedDate(r.issueDate)),
        opt("Date of expiration", formatIsoDate(licenceExpiry(r))),
      ],
    },
  ]
  if (r.dataQualityFlags.length) {
    sections.push({ heading: "Data-quality flags", table: { columns: ["Issue", "Detail"], rows: r.dataQualityFlags.map((f) => [FLAG_META[f].label, FLAG_META[f].description]) } })
  }
  return {
    title: r.name || "Unnamed record",
    subtitle: "Establishment profile",
    generatedAt: ctx.generatedAt,
    filters: "Single record",
    asOf: formatIsoDate(ctx.asOf),
    kpis: [],
    sections,
  }
}

export function profileSummaryText(r: Establishment, settings: RegistrySettings): string {
  const sel = selectScreenCount(r, settings)
  return [
    r.name || "Unnamed record",
    `${categoryLabel(r.categoryId)} · ${[r.lga, r.state].filter(Boolean).join(", ") || "Location not provided"}`,
    r.address ? `Address: ${r.address}` : null,
    sel.value !== undefined ? `Screens: ${sel.value}` : null,
    r.recordedLicenceStatus ? `Licence status (recorded): ${r.recordedLicenceStatus}` : null,
    licenceExpiry(r) ? `Expiry: ${formatIsoDate(licenceExpiry(r))}` : null,
    `Source: ${r.origin === "local" ? "created locally" : `${r.sourceSheet} row ${r.sourceRow}`}`,
    "NFVCB LDD Registry · Prototype · Local data",
  ]
    .filter(Boolean)
    .join("\n")
}
