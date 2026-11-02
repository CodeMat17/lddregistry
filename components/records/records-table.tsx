"use client"

import Link from "next/link"
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DataQualityBadge, RecordedStatusBadge } from "@/components/common/badges"
import { useRegistry } from "@/components/providers/registry-provider"
import { categoryLabel } from "@/lib/domain/categories"
import { stateGroupLabel, zoneGroupLabel } from "@/lib/domain/geography"
import type { Establishment } from "@/lib/domain/types"
import { licenceExpiry, selectScreenCount } from "@/lib/data/analytics"
import type { SortDir, SortKey } from "@/lib/data/filters"
import { formatIsoDate, formatNumber } from "@/lib/format"
import { Highlight } from "./highlight"

export type ColumnId = "category" | "state" | "zone" | "lga" | "contact" | "phone" | "screens" | "seats" | "status" | "expiry" | "quality"

export const TABLE_COLUMNS: { id: ColumnId; label: string; sort?: SortKey; numeric?: boolean }[] = [
  { id: "category", label: "Category", sort: "category" },
  { id: "state", label: "State", sort: "state" },
  { id: "zone", label: "Zone" },
  { id: "lga", label: "LGA" },
  { id: "contact", label: "Contact person" },
  { id: "phone", label: "Phone" },
  { id: "screens", label: "Screens", sort: "screens", numeric: true },
  { id: "seats", label: "Seats", sort: "seats", numeric: true },
  { id: "status", label: "Licence status" },
  { id: "expiry", label: "Expiry", sort: "expiry" },
  { id: "quality", label: "Data quality" },
]

export const DEFAULT_COLUMNS: ColumnId[] = ["category", "state", "zone", "contact", "screens", "status", "quality"]

function SortHeader({ label, sortKey, sort, dir, onSort, numeric }: { label: string; sortKey?: SortKey; sort: SortKey; dir: SortDir; onSort: (k: SortKey) => void; numeric?: boolean }) {
  if (!sortKey) return <>{label}</>
  const active = sort === sortKey
  const Icon = !active ? ArrowUpDown : dir === "asc" ? ArrowUp : ArrowDown
  return (
    <button
      type="button"
      onClick={() => onSort(sortKey)}
      className={`-mx-1 inline-flex h-8 items-center gap-1 rounded px-1 font-medium hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none ${numeric ? "flex-row-reverse" : ""} ${active ? "text-foreground" : ""}`}
    >
      {label}
      <Icon className="size-3.5 opacity-70" aria-hidden />
    </button>
  )
}

export function RecordsTable({
  records,
  columns,
  sort,
  dir,
  onSort,
  query,
}: {
  records: Establishment[]
  columns: ColumnId[]
  sort: SortKey
  dir: SortDir
  onSort: (key: SortKey) => void
  query?: string
}) {
  const { settings } = useRegistry()
  const visible = TABLE_COLUMNS.filter((c) => columns.includes(c.id))
  const ariaSort = (k?: SortKey) => (k && sort === k ? (dir === "asc" ? "ascending" : "descending") : undefined)
  return (
    <div className="overflow-hidden rounded-xl bg-card shadow-card ring-1 ring-foreground/10 *:data-[slot=table-container]:max-h-[70vh] *:data-[slot=table-container]:overflow-auto">
      <Table>
        <TableHeader className="sticky top-0 z-10 bg-muted/95 backdrop-blur">
          <TableRow className="hover:bg-transparent">
            <TableHead className="sticky left-0 z-10 min-w-56 bg-muted/95" aria-sort={ariaSort("name")}>
              <SortHeader label="Name" sortKey="name" sort={sort} dir={dir} onSort={onSort} />
            </TableHead>
            {visible.map((c) => (
              <TableHead key={c.id} className={c.numeric ? "text-right" : undefined} aria-sort={ariaSort(c.sort)}>
                <SortHeader label={c.label} sortKey={c.sort} sort={sort} dir={dir} onSort={onSort} numeric={c.numeric} />
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {records.map((r) => {
            const screens = selectScreenCount(r, settings).value
            const cell: Record<ColumnId, React.ReactNode> = {
              category: categoryLabel(r.categoryId),
              state: <Highlight text={r.state ? stateGroupLabel(r.state) : "—"} query={query} />,
              zone: zoneGroupLabel(r.geopoliticalZone),
              lga: <Highlight text={r.lga ?? "—"} query={query} />,
              contact: <Highlight text={r.contactPerson ?? "—"} query={query} />,
              phone: r.phone ? <Highlight text={r.phone} query={query} /> : "—",
              screens: screens ?? "—",
              seats: r.seats.status === "numeric" || r.seats.status === "list" ? formatNumber(r.seats.total) : r.seats.raw ? <span className="text-warning" title="Excluded from totals">{r.seats.raw}</span> : "—",
              status: <RecordedStatusBadge status={r.recordedLicenceStatus} />,
              expiry: formatIsoDate(licenceExpiry(r)) || "—",
              quality: <DataQualityBadge flags={r.dataQualityFlags} />,
            }
            return (
              <TableRow key={r.id} className="group">
                <TableCell className="sticky left-0 max-w-72 bg-card font-medium whitespace-normal group-hover:bg-muted">
                  <Link href={`/records/${r.id}`} className="hover:text-primary hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none">
                    {r.name ? <Highlight text={r.name} query={query} /> : <span className="text-muted-foreground italic">Unnamed record</span>}
                  </Link>
                </TableCell>
                {visible.map((c) => (
                  <TableCell key={c.id} className={c.numeric ? "text-right tabular" : "max-w-56 truncate"}>
                    {cell[c.id]}
                  </TableCell>
                ))}
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
