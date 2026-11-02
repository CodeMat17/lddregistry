import Link from "next/link"
import type { LucideIcon } from "lucide-react"
import { Card } from "@/components/ui/card"
import { InfoTip } from "@/components/common/info-tip"
import { cn } from "@/lib/utils"

export function KpiCard({
  label,
  value,
  caption,
  icon: Icon,
  info,
  href,
  emphasis = false,
  compact = false,
  className,
}: {
  label: string
  value: React.ReactNode
  caption?: React.ReactNode
  icon?: LucideIcon
  info?: React.ReactNode
  href?: string
  emphasis?: boolean
  /** Smaller figure on phones, for three-across layouts. */
  compact?: boolean
  className?: string
}) {
  return (
    <Card
      className={cn(
        compact ? "relative gap-0 p-3 shadow-card sm:p-4" : "relative gap-0 p-4 shadow-card",
        "transition-shadow duration-200 has-[a:hover]:shadow-raised",
        emphasis && "bg-primary text-primary-foreground ring-primary dark:bg-card dark:text-card-foreground dark:ring-foreground/10",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          {Icon && (
            <span className={cn("grid size-8 shrink-0 place-items-center rounded-lg bg-primary/8 text-primary", emphasis && "bg-white/12 text-current dark:bg-primary/10 dark:text-primary")}>
              <Icon className="size-4" aria-hidden />
            </span>
          )}
          <h3 className={cn("text-[0.8rem] leading-tight font-medium text-muted-foreground", emphasis && "text-current opacity-85 dark:text-muted-foreground dark:opacity-100")}>
            {href ? (
              <Link href={href} className="outline-none after:absolute after:inset-0 after:rounded-xl focus-visible:after:ring-2 focus-visible:after:ring-ring">
                {label}
              </Link>
            ) : (
              label
            )}
          </h3>
        </div>
        {info && (
          <InfoTip className={cn("relative z-10 -mt-1 -mr-1", emphasis && "text-current hover:bg-white/10 dark:text-muted-foreground")}>{info}</InfoTip>
        )}
      </div>
      <p className={cn("mt-3 font-semibold tracking-tight tabular", compact ? "text-xl sm:text-kpi" : "text-kpi")}>{value}</p>
      {caption && <p className={cn("mt-1 text-xs leading-snug text-muted-foreground", emphasis && "text-current opacity-80 dark:text-muted-foreground dark:opacity-100")}>{caption}</p>}
    </Card>
  )
}
