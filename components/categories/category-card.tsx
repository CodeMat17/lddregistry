import Link from "next/link"
import { ChevronRight, CircleX } from "lucide-react"
import { Card } from "@/components/ui/card"
import { getCategory } from "@/lib/domain/categories"
import type { CategorySummary } from "@/lib/data/analytics"
import { formatNumber } from "@/lib/format"
import { cn } from "@/lib/utils"
import { CategoryIcon } from "./category-icon"

function Figure({ label, value }: { label: string; value?: number }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="text-lg font-semibold tabular">{value !== undefined ? formatNumber(value) : <span className="text-sm font-normal text-muted-foreground">—</span>}</dd>
    </div>
  )
}

/** One licensing register: record, screen and seat totals plus expired licences. */
export function CategoryCard({ summary: c, headingLevel: H = "h2" }: { summary: CategorySummary; headingLevel?: "h2" | "h3" }) {
  const def = getCategory(c.id)!
  const expiredUrl = `/search?${new URLSearchParams({ cat: c.id, calc: "expired" })}`
  return (
    <Card className="group relative h-full gap-3 p-4 shadow-card transition-shadow duration-200 hover:shadow-raised has-[a:focus-visible]:ring-2 has-[a:focus-visible]:ring-ring">
      <div className="flex items-start gap-3">
        <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary/8 text-primary">
          <CategoryIcon name={def.icon} className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <H className="font-semibold">
            <Link href={`/categories/${c.id}`} className="outline-none after:absolute after:inset-0 after:rounded-xl">
              {c.label}
            </Link>
          </H>
          <p className="mt-0.5 text-xs text-muted-foreground">{def.description}</p>
        </div>
        <ChevronRight className="mt-1 size-5 shrink-0 text-muted-foreground transition-transform duration-150 group-hover:translate-x-0.5" aria-hidden />
      </div>
      <dl className="grid grid-cols-3 gap-2 border-t pt-3">
        <Figure label="Records" value={c.count} />
        <Figure label="Screens" value={c.screens.contributing ? c.screens.total : undefined} />
        <Figure label="Seats" value={c.seats.contributing ? c.seats.total : undefined} />
      </dl>
      <Link
        href={expiredUrl}
        className={cn(
          "relative z-10 mt-auto flex min-h-10 items-center gap-2 rounded-lg px-2.5 text-sm transition-colors",
          c.expired > 0 ? "bg-destructive/8 text-destructive hover:bg-destructive/12" : "bg-muted text-muted-foreground hover:bg-muted/80",
        )}
        title="Licences more than one year past their date of issue"
      >
        <CircleX className="size-4 shrink-0" aria-hidden />
        <span className="font-semibold tabular">{formatNumber(c.expired)}</span>
        <span>expired licences</span>
      </Link>
    </Card>
  )
}
