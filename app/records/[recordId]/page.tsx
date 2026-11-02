import type { Metadata } from "next"
import { Suspense } from "react"
import { PageSkeleton } from "@/components/common/states"
import { RecordProfilePage } from "@/components/records/record-pages"

export const metadata: Metadata = { title: "Record" }

export default function RecordPage({ params }: PageProps<"/records/[recordId]">) {
  return (
    <Suspense fallback={<PageSkeleton variant="profile" />}>
      <RecordProfilePage params={params} />
    </Suspense>
  )
}
