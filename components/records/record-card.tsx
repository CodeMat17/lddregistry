"use client"

import Link from "next/link"
import { ChevronRight, MapPin, MonitorPlay, Phone, User } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { DataQualityBadge, RecordedStatusBadge } from "@/components/common/badges"
import { useRegistry } from "@/components/providers/registry-provider"
import { categoryLabel } from "@/lib/domain/categories"
import { zoneGroupLabel, NOT_SPECIFIED } from "@/lib/domain/geography"
import type { Establishment } from "@/lib/domain/types"
import { selectScreenCount } from "@/lib/data/analytics"
import { Highlight } from "./highlight"

export function RecordCard({ record: r, query, showCategory = true }: { record: Establishment; query?: string; showCategory?: boolean }) {
  const { settings } = useRegistry()
  const screens = selectScreenCount(r, settings).value
  const zone = zoneGroupLabel(r.geopoliticalZone)
  const location = [r.state, zone !== NOT_SPECIFIED ? zone : undefined].filter(Boolean).join(" · ")
  const place = r.lga || (r.address && r.address.length > 60 ? `${r.address.slice(0, 58)}…` : r.address)
  return (
    <Card className="group relative gap-2.5 p-4 shadow-card transition-shadow duration-200 hover:shadow-raised has-[a:focus-visible]:ring-2 has-[a:focus-visible]:ring-ring">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          {showCategory && (
            <Badge variant="secondary" className="mb-1.5 max-w-full truncate font-normal">
              {categoryLabel(r.categoryId)}
            </Badge>
          )}
          <h3 className="leading-snug font-semibold wrap-break-word">
            <Link href={`/records/${r.id}`} className="outline-none after:absolute after:inset-0 after:rounded-xl">
              {r.name ? <Highlight text={r.name} query={query} /> : <span className="text-muted-foreground italic">Unnamed record</span>}
            </Link>
          </h3>
        </div>
        <ChevronRight className="mt-1 size-5 shrink-0 text-muted-foreground transition-transform duration-150 group-hover:translate-x-0.5" aria-hidden />
      </div>
      <dl className="grid gap-1.5 text-sm text-muted-foreground">
        <div className="flex items-start gap-2">
          <dt className="sr-only">Location</dt>
          <MapPin className="mt-0.5 size-4 shrink-0" aria-hidden />
          <dd className="min-w-0 wrap-break-word">
            {location ? <Highlight text={location} query={query} /> : "Location not provided"}
            {place && (
              <span className="block text-xs">
                <Highlight text={place} query={query} />
              </span>
            )}
          </dd>
        </div>
        {(r.contactPerson || r.phone) && (
          <div className="flex items-start gap-2">
            <dt className="sr-only">Contact</dt>
            {r.contactPerson ? <User className="mt-0.5 size-4 shrink-0" aria-hidden /> : <Phone className="mt-0.5 size-4 shrink-0" aria-hidden />}
            <dd className="min-w-0 truncate">
              <Highlight text={r.contactPerson ?? r.phone} query={query} />
            </dd>
          </div>
        )}
      </dl>
      <div className="flex flex-wrap items-center gap-1.5">
        {screens !== undefined && (
          <Badge variant="outline" className="gap-1 font-normal">
            <MonitorPlay aria-hidden />
            {screens} {screens === 1 ? "screen" : "screens"}
          </Badge>
        )}
        <RecordedStatusBadge status={r.recordedLicenceStatus} />
        <DataQualityBadge flags={r.dataQualityFlags} />
      </div>
    </Card>
  )
}
