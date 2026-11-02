"use client"

import Link from "next/link"
import { notFound } from "next/navigation"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRegistry } from "@/components/providers/registry-provider"
import { PageHeader } from "@/components/common/page-header"
import { KpiCard } from "@/components/dashboard/kpi-card"
import { RegisterView } from "@/components/records/register-view"
import { getCategory } from "@/lib/domain/categories"
import type { CategoryId } from "@/lib/domain/types"
import { SCREEN_METHODOLOGY, SEAT_METHODOLOGY } from "@/lib/data/analytics"
import { formatNumber } from "@/lib/format"
import { CategoryIcon } from "./category-icon"

export function CategoryRegisterView({ categoryId }: { categoryId: string }) {
  const def = getCategory(categoryId)
  const { analytics } = useRegistry()
  if (!def) notFound()
  const summary = analytics.categories.find((c) => c.id === def.id)!

  return (
    <>
      <PageHeader
        crumbs={[{ label: "Home", href: "/" }, { label: def.label }]}
        eyebrow={
          <span className="inline-flex items-center gap-1.5 text-xs font-medium tracking-wide text-muted-foreground uppercase">
            <CategoryIcon name={def.icon} className="size-3.5" />
            Source sheet: {def.sourceSheet}
          </span>
        }
        title={def.label}
        description={def.description}
        actions={
          <Button className="h-10 gap-2" render={<Link href={`/records/new?category=${def.id}`} />} nativeButton={false}>
            <Plus className="size-4" aria-hidden />
            Add record
          </Button>
        }
      />
      <div className="mb-5 grid grid-cols-3 gap-2 sm:gap-3">
        <KpiCard compact label="Records" value={formatNumber(summary.count)} />
        <KpiCard
          compact
          label="Screens"
          value={summary.screens.contributing ? formatNumber(summary.screens.total) : "—"}
          caption={summary.screens.contributing ? `${summary.screens.contributing} records` : "No usable data"}
          info={SCREEN_METHODOLOGY}
        />
        <KpiCard
          compact
          label="Seats"
          value={summary.seats.contributing ? formatNumber(summary.seats.total) : "—"}
          caption={summary.seats.contributing ? `${summary.seats.contributing} records` : "No usable data"}
          info={SEAT_METHODOLOGY}
        />
      </div>
      <RegisterView categoryId={def.id as CategoryId} />
    </>
  )
}
