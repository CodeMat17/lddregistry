"use client"

import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/common/page-header"
import { RegisterView } from "./register-view"

export function SearchView() {
  const params = useSearchParams()
  return (
    <>
      <PageHeader
        title="Search the registry"
        description="Search across all 10 registers by name, contact person, state, LGA, address, phone, email, category or licence number. Works offline once loaded."
        actions={
          <Button variant="outline" className="h-10 gap-2" render={<Link href="/records/new" />} nativeButton={false}>
            <Plus className="size-4" aria-hidden />
            Add record
          </Button>
        }
      />
      <RegisterView autoFocusSearch={params.size === 0} />
    </>
  )
}
