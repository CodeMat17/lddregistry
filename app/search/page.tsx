import type { Metadata } from "next"
import { Suspense } from "react"
import { DataGate, PageSkeleton } from "@/components/common/states"
import { SearchView } from "@/components/records/search-view"

export const metadata: Metadata = { title: "Search" }

export default function SearchPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <DataGate>
        <SearchView />
      </DataGate>
    </Suspense>
  )
}
