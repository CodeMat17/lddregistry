"use client"

import { CircleAlert, Inbox, type LucideIcon } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { useRegistry } from "@/components/providers/registry-provider"
import { cn } from "@/lib/utils"

export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
  className,
}: {
  icon?: LucideIcon
  title: string
  description?: React.ReactNode
  action?: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn("flex flex-col items-center rounded-xl border border-dashed bg-card/50 px-6 py-12 text-center", className)}>
      <span className="mb-3 grid size-12 place-items-center rounded-full bg-muted text-muted-foreground">
        <Icon className="size-6" aria-hidden />
      </span>
      <h2 className="font-medium">{title}</h2>
      {description && <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>}
      {action && <div className="mt-4 flex flex-wrap justify-center gap-2">{action}</div>}
    </div>
  )
}

export function ErrorState({ title = "Something went wrong", message, onRetry }: { title?: string; message?: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="flex flex-col items-center rounded-xl border border-destructive/30 bg-destructive/5 px-6 py-12 text-center">
      <CircleAlert className="mb-3 size-8 text-destructive" aria-hidden />
      <h2 className="font-medium">{title}</h2>
      {message && <p className="mt-1 max-w-md text-sm text-muted-foreground">{message}</p>}
      {onRetry && (
        <Button variant="outline" className="mt-4 h-10" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  )
}

export function PageSkeleton({ variant = "list" }: { variant?: "list" | "dashboard" | "profile" }) {
  return (
    <div aria-busy="true" aria-label="Loading" className="space-y-5">
      <div className="space-y-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-8 w-64 max-w-full" />
      </div>
      {variant === "dashboard" && (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
      )}
      {variant === "profile" ? (
        <div className="grid gap-4 lg:grid-cols-3">
          <Skeleton className="h-64 rounded-xl lg:col-span-2" />
          <Skeleton className="h-64 rounded-xl" />
        </div>
      ) : (
        <div className="space-y-3">
          {Array.from({ length: 5 }, (_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      )}
    </div>
  )
}

/** Renders children only once the local dataset is loaded. */
export function DataGate({ children, skeleton = "list" }: { children: React.ReactNode; skeleton?: "list" | "dashboard" | "profile" }) {
  const { status, error } = useRegistry()
  if (status === "loading") return <PageSkeleton variant={skeleton} />
  if (status === "error") {
    return (
      <ErrorState
        title="The local dataset could not be opened"
        message={`${error ?? ""} This app stores data in your browser's IndexedDB. Private browsing or blocked site storage can prevent it from working.`}
        onRetry={() => window.location.reload()}
      />
    )
  }
  return <>{children}</>
}
