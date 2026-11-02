import type { Metadata } from "next"
import { Suspense } from "react"
import { PageSkeleton } from "@/components/common/states"
import { RecordCreatePage } from "@/components/records/record-pages"

export const metadata: Metadata = { title: "Add record" }

export default function NewRecordPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <RecordCreatePage />
    </Suspense>
  )
}
