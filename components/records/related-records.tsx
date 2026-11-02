"use client"

import { Link2 } from "lucide-react"
import { useRegistry } from "@/components/providers/registry-provider"
import { DuplicateGroupCard } from "@/components/quality/duplicate-group-card"
import type { Establishment } from "@/lib/domain/types"
import type { DuplicateGroup } from "@/lib/data/quality/duplicates"
import { RecordProfileSection } from "./field-list"

export function RelatedRecords({ record, groups }: { record: Establishment; groups: DuplicateGroup[] }) {
  const { duplicateReviews } = useRegistry()
  return (
    <RecordProfileSection
      title="Possible duplicates & related records"
      description="Records sharing a name, phone number or email. These may be the same operator in another register, a branch, or a genuine duplicate — only a person can decide. Nothing is merged."
    >
      {groups.length === 0 ? (
        <div className="flex flex-col items-center py-6 text-center text-sm text-muted-foreground">
          <Link2 className="mb-2 size-6" aria-hidden />
          No other records share this name, phone or email.
        </div>
      ) : (
        <div className="space-y-4">
          {groups.map((g) => (
            <DuplicateGroupCard key={g.key} group={g} decision={duplicateReviews[g.key]} currentId={record.id} />
          ))}
        </div>
      )}
    </RecordProfileSection>
  )
}
