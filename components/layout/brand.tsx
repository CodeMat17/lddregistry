import { Clapperboard } from "lucide-react"
import { cn } from "@/lib/utils"

/**
 * Typographic wordmark with a neutral icon. This is not an official NFVCB
 * logo; replace this component when an approved asset is supplied.
 */
export function Brand({ className, compact = false }: { className?: string; compact?: boolean }) {
  return (
    <span className={cn("flex min-w-0 items-center gap-2.5", className)}>
      <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
        <Clapperboard className="size-5" aria-hidden />
      </span>
      {!compact && (
        <span className="flex min-w-0 flex-col leading-tight">
          <span className="text-[0.7rem] font-semibold tracking-[0.14em] uppercase opacity-80">NFVCB · LDD</span>
          <span className="truncate text-[0.95rem] font-semibold">Registry</span>
        </span>
      )}
    </span>
  )
}
