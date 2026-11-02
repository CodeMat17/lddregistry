"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Braces, Copy, FileSpreadsheet, FileText, Mail, MoreHorizontal, Pencil, Phone, Share2, Trash2, TriangleAlert, SearchX } from "lucide-react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
import { PageHeader } from "@/components/common/page-header"
import { EmptyState } from "@/components/common/states"
import { ConfirmDialog } from "@/components/common/confirm-dialog"
import { CalculatedStatusBadge, DataQualityBadge, FlagBadge, RecordedStatusBadge } from "@/components/common/badges"
import { InfoTip } from "@/components/common/info-tip"
import { categoryLabel } from "@/lib/domain/categories"
import type { Establishment } from "@/lib/domain/types"
import {
  calculatedLicenceStatus,
  daysToExpiry,
  hasOldNewScreens,
  licenceExpiry,
  SCREEN_METHODOLOGY,
  SCREEN_SOURCE_LABEL,
  SEAT_METHODOLOGY,
  selectScreenCount,
} from "@/lib/data/analytics"
import { FLAG_META } from "@/lib/data/quality/flags"
import { recordsToCsv } from "@/lib/data/export/csv"
import { copyText, downloadText, exportFilename, printHtml, shareOrCopy } from "@/lib/data/export/download"
import { reportToHtml } from "@/lib/data/export/report"
import { buildProfileReport, profileSummaryText } from "@/lib/data/reports"
import { formatIsoDate, formatNumber, formatParsedDate, formatTimestamp } from "@/lib/format"
import { FieldList, RecordProfileSection } from "./field-list"
import { RecordHistory } from "./record-history"
import { RelatedRecords } from "./related-records"

export function RecordProfile({ recordId }: { recordId: string }) {
  const { byId } = useRegistry()
  const record = byId.get(recordId)

  if (!record) {
    return (
      <EmptyState
        icon={SearchX}
        title="Record not found"
        description="It may have been deleted or replaced by an import in this browser, or the link came from another device."
        action={
          <Button className="h-10" render={<Link href="/" />} nativeButton={false}>
            Browse categories
          </Button>
        }
      />
    )
  }
  return <Profile record={record} />
}

function Profile({ record: r }: { record: Establishment }) {
  const router = useRouter()
  const { settings, asOf, remove, duplicates } = useRegistry()
  const [deleteOpen, setDeleteOpen] = React.useState(false)
  const sel = selectScreenCount(r, settings)
  const calc = calculatedLicenceStatus(r, asOf)
  const days = daysToExpiry(r, asOf)
  const expiry = licenceExpiry(r)
  const related = duplicates.filter((g) => g.recordIds.includes(r.id))
  const ctx = () => ({ generatedAt: formatTimestamp(new Date().toISOString()), filters: "Single record", asOf, settings })
  const summary = () => profileSummaryText(r, settings)
  const name = r.name || "Unnamed record"

  const act = (fn: () => void | Promise<void>, ok?: string) => async () => {
    try {
      await fn()
      if (ok) toast.success(ok)
    } catch (e) {
      toast.error((e as Error).message)
    }
  }

  return (
    <>
      <PageHeader
        crumbs={[
          { label: "Home", href: "/" },
          { label: categoryLabel(r.categoryId), href: `/categories/${r.categoryId}` },
          { label: name },
        ]}
        eyebrow={
          <div className="flex flex-wrap gap-1.5">
            <Badge variant="secondary" render={<Link href={`/categories/${r.categoryId}`} />}>
              {categoryLabel(r.categoryId)}
            </Badge>
            <RecordedStatusBadge status={r.recordedLicenceStatus} />
            <CalculatedStatusBadge status={calc} />
            <DataQualityBadge flags={r.dataQualityFlags} />
            {r.origin === "local" && <Badge variant="outline">Created locally</Badge>}
          </div>
        }
        title={name}
        description={[r.lga, r.state, r.geopoliticalZone].filter(Boolean).join(" · ") || "Location not provided in source"}
        actions={
          <>
            <Button className="h-10 gap-2" render={<Link href={`/records/${r.id}/edit`} />} nativeButton={false}>
              <Pencil className="size-4" aria-hidden />
              Edit
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger render={<Button variant="outline" className="h-10 gap-2" />}>
                <Share2 className="size-4" aria-hidden />
                Share / Export
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-60">
                <DropdownMenuGroup>
                  <DropdownMenuLabel>Profile</DropdownMenuLabel>
                  <DropdownMenuItem className="min-h-10" onClick={act(() => printHtml(reportToHtml(buildProfileReport(r, ctx()))), "Print dialog opened — choose “Save as PDF”.")}>
                    <FileText aria-hidden />
                    Download profile PDF
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="min-h-10"
                    onClick={act(async () => {
                      const res = await shareOrCopy(name, summary())
                      if (res === "copied") toast.success("Sharing isn't available here, so the summary was copied.")
                    })}
                  >
                    <Share2 aria-hidden />
                    Share profile summary
                  </DropdownMenuItem>
                  <DropdownMenuItem className="min-h-10" onClick={act(() => copyText(summary()), "Summary copied.")}>
                    <Copy aria-hidden />
                    Copy summary
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuLabel>Data</DropdownMenuLabel>
                  <DropdownMenuItem
                    className="min-h-10"
                    onClick={act(
                      () => downloadText(recordsToCsv([r], settings, { title: name, filters: "Single record", generatedAt: formatTimestamp(new Date().toISOString()), asOf: formatIsoDate(asOf) }), exportFilename(name, "csv"), "text/csv;charset=utf-8"),
                      "CSV downloaded.",
                    )}
                  >
                    <FileSpreadsheet aria-hidden />
                    Export as CSV
                  </DropdownMenuItem>
                  <DropdownMenuItem className="min-h-10" onClick={act(() => downloadText(JSON.stringify(r, null, 2), exportFilename(name, "json"), "application/json"), "JSON downloaded.")}>
                    <Braces aria-hidden />
                    Export as JSON
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
            <DropdownMenu>
              <DropdownMenuTrigger render={<Button variant="ghost" size="icon" className="size-10" aria-label="More actions" />}>
                <MoreHorizontal />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem variant="destructive" className="min-h-10" onClick={() => setDeleteOpen(true)}>
                  <Trash2 aria-hidden />
                  Delete record…
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        }
      />

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete this record?"
        description={
          <>
            “{name}” will be removed from this browser’s dataset. The deletion is logged in the local history. You can restore it from
            an automatic backup only if you reset or restore the dataset.
          </>
        }
        confirmLabel="Delete record"
        onConfirm={async () => {
          router.push(`/categories/${r.categoryId}`)
          await remove(r.id)
          toast.success("Record deleted.")
        }}
      />

      <Tabs defaultValue="details">
        <TabsList className="mb-3 w-full max-w-full justify-start overflow-x-auto [scrollbar-width:none] sm:w-fit" variant="line">
          <TabsTrigger value="details" className="min-h-10 flex-none px-2.5 sm:px-3">
            Details
          </TabsTrigger>
          <TabsTrigger value="source" className="min-h-10 flex-none px-2.5 sm:px-3">
            Source data
          </TabsTrigger>
          <TabsTrigger value="history" className="min-h-10 flex-none px-2.5 sm:px-3">
            History
          </TabsTrigger>
          <TabsTrigger value="related" className="min-h-10 flex-none px-2.5 sm:px-3">
            Related{related.length > 0 && <Badge className="ml-1 h-5 px-1.5">{related.length}</Badge>}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="details">
          <div className="grid gap-4 lg:grid-cols-3">
            <div className="space-y-4 lg:col-span-2">
              <RecordProfileSection title="Overview">
                <FieldList
                  fields={[
                    { label: "Name", value: r.name, copy: r.name },
                    { label: "Register", value: categoryLabel(r.categoryId) },
                    { label: "Category (as written in source)", value: r.categoryRaw },
                    { label: "Record reference", value: r.origin === "local" ? "Created locally" : `${r.sourceSheet}, row ${r.sourceRow}${r.sourceSerialNumber !== undefined ? ` (S/N ${r.sourceSerialNumber})` : ""}` },
                  ]}
                />
              </RecordProfileSection>

              <RecordProfileSection title="Location">
                <FieldList
                  fields={[
                    { label: "State", value: r.state, hint: r.dataQualityFlags.includes("unrecognised-state") ? "Not a recognised state name — shown as recorded." : undefined },
                    { label: "Geopolitical zone", value: r.geopoliticalZone },
                    { label: "LGA", value: r.lga },
                    { label: "Full address", value: r.address, copy: r.address, wide: true },
                  ]}
                />
              </RecordProfileSection>

              <RecordProfileSection title="Contacts">
                <FieldList
                  fields={[
                    { label: "Contact person", value: r.contactPerson, copy: r.contactPerson },
                    {
                      label: "Phone",
                      value: r.phone && (
                        <a href={`tel:${r.phone.replace(/[^\d+]/g, "")}`} className="inline-flex items-center gap-1.5 font-medium text-primary underline-offset-4 hover:underline">
                          <Phone className="size-3.5" aria-hidden />
                          {r.phone}
                        </a>
                      ),
                      copy: r.phone,
                    },
                    {
                      label: "Email",
                      value: r.email && (
                        <a href={`mailto:${r.email}`} className="inline-flex items-center gap-1.5 font-medium break-all text-primary underline-offset-4 hover:underline">
                          <Mail className="size-3.5 shrink-0" aria-hidden />
                          {r.email}
                        </a>
                      ),
                      copy: r.email,
                      wide: true,
                    },
                  ]}
                />
              </RecordProfileSection>

              <RecordProfileSection
                title="Screens & capacity"
                description="Recorded values; not verified operational figures."
                action={
                  <InfoTip>
                    <p>{SCREEN_METHODOLOGY}</p>
                    <p className="mt-2">{SEAT_METHODOLOGY}</p>
                  </InfoTip>
                }
              >
                <div className="mb-4 grid grid-cols-2 gap-3">
                  <div className="rounded-lg bg-muted/60 p-3">
                    <p className="text-xs text-muted-foreground">Screens used in totals</p>
                    <p className="text-kpi font-semibold tabular">{sel.value ?? "—"}</p>
                    <p className="text-xs text-muted-foreground">{SCREEN_SOURCE_LABEL[sel.source]}</p>
                  </div>
                  <div className="rounded-lg bg-muted/60 p-3">
                    <p className="text-xs text-muted-foreground">Seats used in totals</p>
                    <p className="text-kpi font-semibold tabular">{r.seats.status === "numeric" || r.seats.status === "list" ? formatNumber(r.seats.total) : "—"}</p>
                    <p className="text-xs text-muted-foreground">
                      {r.seats.status === "list" ? `${r.seats.parts!.length} halls listed` : r.seats.status === "numeric" ? "Single value" : r.seats.status === "missing" ? "Not recorded" : "Excluded — needs review"}
                    </p>
                  </div>
                </div>
                <FieldList
                  fields={[
                    ...(hasOldNewScreens(r)
                      ? [
                          { label: "No. of screens (NEW)", value: r.screensNew ?? r.screensNewRaw, hint: r.screensNew === null && r.screensNewRaw ? "Not a whole number — excluded." : undefined },
                          { label: "Screen details (NEW)", value: r.screenDetailsNew },
                          { label: "No. of screens (OLD)", value: r.screensOld ?? r.screensOldRaw, hint: r.screensOld === null && r.screensOldRaw ? "Not a whole number — excluded." : undefined },
                          { label: "Screen details (OLD)", value: r.screenDetailsOld },
                        ]
                      : [
                          { label: "No. of screens", value: r.screens ?? r.screensRaw },
                          { label: "Screen details", value: r.screenDetails },
                        ]),
                    {
                      label: "Total seats (as recorded)",
                      value: r.seats.raw,
                      wide: true,
                      hint: r.seats.status === "suspicious" ? FLAG_META["suspicious-seats"].description : r.seats.status === "unparseable" ? FLAG_META["unparseable-seats"].description : undefined,
                    },
                  ]}
                />
              </RecordProfileSection>

              <RecordProfileSection title="Licensing" description="Only fields present in the source are shown.">
                <FieldList
                  fields={[
                    { label: "Licence status (recorded)", value: r.recordedLicenceStatus },
                    {
                      label: "Status calculated from issue date",
                      value: calc ? <CalculatedStatusBadge status={calc} /> : undefined,
                      hint: calc ? `${days! < 0 ? `${Math.abs(days!)} days ago` : `${days} days remaining`} as at ${formatIsoDate(asOf)}. Not an official status.` : undefined,
                    },
                    { label: "Date of issue", value: formatParsedDate(r.issueDate), hint: r.issueDate && !r.issueDate.iso ? "Unparseable date — raw source text shown." : undefined },
                    {
                      label: "Date of expiration",
                      value: formatIsoDate(expiry) || "—",
                      hint: expiry ? "One year from the date of issue." : "Left blank until a readable date of issue is entered.",
                    },
                    { label: "OLD/NEW classification", value: r.oldNewClassification, hint: "A registration classification, not a licence status." },
                    ...(r.licenceNumber ? [{ label: "Licence number", value: r.licenceNumber, copy: r.licenceNumber }] : []),
                  ]}
                />
              </RecordProfileSection>

              {r.lastInspectionDate && (
                <RecordProfileSection title="Inspection">
                  <FieldList
                    fields={[
                      {
                        label: "Last inspection date",
                        value: formatParsedDate(r.lastInspectionDate),
                        hint: !r.lastInspectionDate.iso ? "Implausible or unreadable date — raw source value shown." : undefined,
                      },
                    ]}
                  />
                </RecordProfileSection>
              )}

              {r.notes && (
                <RecordProfileSection title="Notes">
                  <p className="text-sm whitespace-pre-wrap">{r.notes}</p>
                </RecordProfileSection>
              )}
            </div>

            <div className="space-y-4">
              <RecordProfileSection
                title="Data quality"
                description={r.dataQualityFlags.length ? "Flags raised on import or after edits. Nothing has been auto-corrected." : undefined}
              >
                {r.dataQualityFlags.length ? (
                  <ul className="space-y-3">
                    {r.dataQualityFlags.map((f) => (
                      <li key={f}>
                        <FlagBadge flag={f} />
                        <p className="mt-1 text-xs text-muted-foreground">{FLAG_META[f].description}</p>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground">No issues detected.</p>
                )}
                {r.dataQualityFlags.some((f) => FLAG_META[f].severity !== "info") && (
                  <Button variant="outline" className="mt-4 h-10 w-full gap-2" render={<Link href={`/records/${r.id}/edit`} />} nativeButton={false}>
                    <TriangleAlert className="size-4" aria-hidden />
                    Correct locally
                  </Button>
                )}
              </RecordProfileSection>
              <RecordProfileSection title="Record">
                <FieldList
                  className="sm:grid-cols-1"
                  fields={[
                    { label: "Origin", value: r.origin === "seed" ? "Imported from workbook" : r.origin === "import" ? "Imported file" : "Created locally" },
                    { label: "Last updated", value: formatTimestamp(r.updatedAt) },
                    { label: "Internal ID", value: <code className="text-xs break-all">{r.id}</code>, copy: r.id },
                  ]}
                />
              </RecordProfileSection>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="source">
          <RecordProfileSection
            title="Original source values"
            description={r.origin === "local" ? "This record was created in the app and has no workbook source row." : `Exactly as imported from worksheet “${r.sourceSheet}”, row ${r.sourceRow}. Local edits never change these values.`}
          >
            {Object.keys(r.sourceData).length ? (
              <dl className="divide-y rounded-lg border">
                {Object.entries(r.sourceData).map(([k, v]) => (
                  <div key={k} className="grid gap-1 px-3 py-2.5 sm:grid-cols-[14rem_1fr]">
                    <dt className="font-mono text-xs text-muted-foreground">{k}</dt>
                    <dd className="text-sm wrap-break-word">{v === null || v === "" ? <span className="text-muted-foreground/70 italic">blank</span> : String(v)}</dd>
                  </div>
                ))}
              </dl>
            ) : (
              <p className="text-sm text-muted-foreground">No source data.</p>
            )}
          </RecordProfileSection>
        </TabsContent>

        <TabsContent value="history">
          <RecordHistory recordId={r.id} />
        </TabsContent>

        <TabsContent value="related">
          <RelatedRecords record={r} groups={related} />
        </TabsContent>
      </Tabs>
    </>
  )
}
