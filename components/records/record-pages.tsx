"use client"

import { use } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { SearchX } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DataGate, EmptyState } from "@/components/common/states"
import { PageHeader } from "@/components/common/page-header"
import { useRegistry } from "@/components/providers/registry-provider"
import { categoryLabel, getCategory } from "@/lib/domain/categories"
import type { CategoryId } from "@/lib/domain/types"
import { RecordProfile } from "./record-profile"
import { RecordForm } from "./record-form"

type Params = Promise<{ recordId: string }>

export function RecordProfilePage({ params }: { params: Params }) {
  const { recordId } = use(params)
  return (
    <DataGate skeleton="profile">
      <RecordProfile recordId={decodeURIComponent(recordId)} />
    </DataGate>
  )
}

function EditInner({ recordId }: { recordId: string }) {
  const { byId } = useRegistry()
  const record = byId.get(recordId)
  if (!record) {
    return (
      <EmptyState
        icon={SearchX}
        title="Record not found"
        description="It may have been deleted or replaced in this browser."
        action={
          <Button className="h-10" render={<Link href="/" />} nativeButton={false}>
            Browse categories
          </Button>
        }
      />
    )
  }
  const name = record.name || "Unnamed record"
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        crumbs={[
          { label: categoryLabel(record.categoryId), href: `/categories/${record.categoryId}` },
          { label: name, href: `/records/${record.id}` },
          { label: "Edit" },
        ]}
        title={`Edit ${name}`}
        description={`${categoryLabel(record.categoryId)} · ${record.origin === "local" ? "Created locally" : `${record.sourceSheet}, row ${record.sourceRow}`}`}
      />
      <RecordForm record={record} />
    </div>
  )
}

export function RecordEditPage({ params }: { params: Params }) {
  const { recordId } = use(params)
  return (
    <DataGate>
      <EditInner recordId={decodeURIComponent(recordId)} />
    </DataGate>
  )
}

export function RecordCreatePage() {
  const params = useSearchParams()
  const cat = params.get("category")
  const category = cat && getCategory(cat) ? (cat as CategoryId) : undefined
  return (
    <DataGate>
      <div className="mx-auto max-w-3xl">
        <PageHeader
          crumbs={[{ label: category ? categoryLabel(category) : "Categories", href: category ? `/categories/${category}` : "/" }, { label: "Add record" }]}
          title="Add a record"
          description="The record is stored only in this browser and marked as created locally. It has no workbook source row."
        />
        <RecordForm defaultCategory={category} />
      </div>
    </DataGate>
  )
}
