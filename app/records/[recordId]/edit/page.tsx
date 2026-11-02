import type { Metadata } from "next"
import { Suspense } from "react"
import { PageSkeleton } from "@/components/common/states"
import { RecordEditPage } from "@/components/records/record-pages"

export const metadata: Metadata = { title: "Edit record" }

export default function EditRecordPage({ params }: PageProps<"/records/[recordId]/edit">) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <RecordEditPage params={params} />
    </Suspense>
  )
}
