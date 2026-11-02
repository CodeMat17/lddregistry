"use client"

import { ErrorState } from "@/components/common/states"

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="py-10">
      <ErrorState
        title="This page couldn’t be displayed"
        message={`${error.message || "An unexpected error occurred."} Your local data has not been changed.`}
        onRetry={reset}
      />
    </div>
  )
}
