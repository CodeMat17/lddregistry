"use client"

import Link from "next/link"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { useRegistry } from "@/components/providers/registry-provider"
import { categoryLabel } from "@/lib/domain/categories"
import type { DuplicateDecision, DuplicateGroup } from "@/lib/data/quality/duplicates"
import { cn } from "@/lib/utils"

const DECISIONS: { value: DuplicateDecision; label: string }[] = [
  { value: "related", label: "Related" },
  { value: "distinct", label: "Not related" },
  { value: "duplicate", label: "Duplicate" },
]

export function DuplicateGroupCard({ group, decision, currentId }: { group: DuplicateGroup; decision?: DuplicateDecision; currentId?: string }) {
  const { byId, setDuplicateReview } = useRegistry()
  const members = group.recordIds.map((id) => byId.get(id)).filter((r) => r !== undefined)
  return (
    <div className="min-w-0 rounded-xl border bg-card p-3">
      <div className="mb-2 flex flex-wrap items-center gap-1.5">
        {group.reasons.map((reason, i) => (
          <Badge key={reason} variant="secondary" className="block h-auto max-w-full shrink truncate py-0.5 font-normal">
            {reason}: {group.matchedOn[i]}
          </Badge>
        ))}
        {group.crossCategory && (
          <Badge variant="outline" className="font-normal">
            Across registers
          </Badge>
        )}
      </div>
      <ul className="divide-y">
        {members.map((m) => (
          <li key={m.id}>
            <Link
              href={`/records/${m.id}`}
              aria-current={m.id === currentId ? "page" : undefined}
              className={cn("flex min-h-12 flex-col justify-center rounded-md px-2 py-1.5 hover:bg-muted", m.id === currentId && "bg-primary/5")}
            >
              <span className="text-sm font-medium wrap-break-word">
                {m.name || "Unnamed record"}
                {m.id === currentId && <span className="ml-1.5 text-xs font-normal text-muted-foreground">(this record)</span>}
              </span>
              <span className="text-xs text-muted-foreground">
                {categoryLabel(m.categoryId)} · {[m.lga, m.state].filter(Boolean).join(", ") || "No location"} · {m.sourceSheet} r{m.sourceRow}
              </span>
            </Link>
          </li>
        ))}
      </ul>
      <div className="mt-3 flex flex-col gap-2 border-t pt-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-muted-foreground">Your review (saved in this browser; records are not merged):</p>
        <ToggleGroup
          value={decision ? [decision] : []}
          onValueChange={async (v: string[]) => {
            const next = (v[0] as DuplicateDecision | undefined) ?? null
            await setDuplicateReview(group.key, next)
            toast.success(next ? `Marked as “${DECISIONS.find((d) => d.value === next)!.label}”.` : "Review cleared.")
          }}
          variant="outline"
          spacing={0}
          size="sm"
          aria-label="Review decision"
        >
          {DECISIONS.map((d) => (
            <ToggleGroupItem key={d.value} value={d.value} className="h-9 px-3 text-xs">
              {d.label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>
    </div>
  )
}
