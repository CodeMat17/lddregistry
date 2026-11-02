"use client"

import * as React from "react"
import { History } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { useRegistry } from "@/components/providers/registry-provider"
import { RecordProfileSection } from "./field-list"
import type { ChangeEvent } from "@/lib/domain/types"
import { formatTimestamp } from "@/lib/format"

const FIELD_LABELS: Record<string, string> = {
  name: "Name",
  categoryId: "Register",
  state: "State",
  geopoliticalZone: "Zone",
  lga: "LGA",
  address: "Address",
  contactPerson: "Contact person",
  phone: "Phone",
  email: "Email",
  licenceNumber: "Licence number",
  recordedLicenceStatus: "Licence status",
  oldNewClassification: "OLD/NEW",
  screensOld: "Screens OLD",
  screensNew: "Screens NEW",
  screens: "Screens",
  screenDetails: "Screen details",
  screenDetailsOld: "Screen details OLD",
  screenDetailsNew: "Screen details NEW",
  seats: "Total seats",
  issueDate: "Date of issue",
  expiryDate: "Date of expiration",
  notes: "Notes",
}

const show = (v: unknown) => (v === null || v === undefined || v === "" ? "—" : String(v))

export function RecordHistory({ recordId }: { recordId: string }) {
  const { repository, records } = useRegistry()
  const [events, setEvents] = React.useState<ChangeEvent[] | null>(null)
  React.useEffect(() => {
    let live = true
    repository.getHistory(recordId).then((e) => live && setEvents(e))
    return () => {
      live = false
    }
  }, [repository, recordId, records])

  return (
    <RecordProfileSection title="Record history" description="Local edits made in this browser during the prototype. Not synchronised to other devices.">
      {events === null ? (
        <div className="space-y-2">
          <Skeleton className="h-14" />
          <Skeleton className="h-14" />
        </div>
      ) : events.length === 0 ? (
        <div className="flex flex-col items-center py-6 text-center text-sm text-muted-foreground">
          <History className="mb-2 size-6" aria-hidden />
          No local changes. This record matches its imported values.
        </div>
      ) : (
        <ol className="relative space-y-4 border-l pl-5">
          {events.map((e) => (
            <li key={e.id} className="relative">
              <span className="absolute top-1.5 -left-[1.6rem] size-2.5 rounded-full bg-primary ring-4 ring-card" aria-hidden />
              <p className="text-sm font-medium">{e.kind === "create" ? "Created" : e.kind === "update" ? "Edited" : e.kind === "delete" ? "Deleted" : e.summary}</p>
              <p className="text-xs text-muted-foreground">{formatTimestamp(e.at)}</p>
              {e.changes.length > 0 && (
                <ul className="mt-2 space-y-1.5 text-sm">
                  {e.changes.map((c) => (
                    <li key={c.field} className="rounded-md bg-muted/60 px-2.5 py-1.5">
                      <span className="font-medium">{FIELD_LABELS[c.field] ?? c.field}: </span>
                      <span className="text-muted-foreground line-through decoration-muted-foreground/50">{show(c.from)}</span>
                      <span aria-hidden> → </span>
                      <span className="sr-only"> changed to </span>
                      <span>{show(c.to)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ol>
      )}
    </RecordProfileSection>
  )
}
