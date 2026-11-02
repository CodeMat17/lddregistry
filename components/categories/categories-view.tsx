"use client"

import * as React from "react"
import { Search, X } from "lucide-react"
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from "@/components/ui/input-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useRegistry } from "@/components/providers/registry-provider"
import { PageHeader } from "@/components/common/page-header"
import { EmptyState } from "@/components/common/states"
import { InfoTip } from "@/components/common/info-tip"
import { CATEGORIES } from "@/lib/domain/categories"
import { SCREEN_METHODOLOGY, SEAT_METHODOLOGY } from "@/lib/data/analytics"
import { useLocalPreference } from "@/hooks/use-local-preference"
import { CategoryCard } from "./category-card"

type CategorySort = "source" | "records" | "name" | "screens" | "expired"
const SORTS: { value: CategorySort; label: string }[] = [
  { value: "source", label: "Workbook order" },
  { value: "records", label: "Most records" },
  { value: "screens", label: "Most screens" },
  { value: "expired", label: "Most expired" },
  { value: "name", label: "Name (A–Z)" },
]

export function CategoriesView() {
  const { analytics } = useRegistry()
  const [q, setQ] = React.useState("")
  const [sort, setSort] = useLocalPreference<CategorySort>("ldd:category-sort", "source")
  const order = new Map(CATEGORIES.map((c, i) => [c.id, i]))
  const list = analytics.categories
    .filter((c) => c.label.toLowerCase().includes(q.trim().toLowerCase()))
    .sort((a, b) => {
      if (sort === "records") return b.count - a.count
      if (sort === "screens") return b.screens.total - a.screens.total
      if (sort === "expired") return b.expired - a.expired
      if (sort === "name") return a.label.localeCompare(b.label)
      return order.get(a.id)! - order.get(b.id)!
    })

  return (
    <>
      <PageHeader
        title="Categories"
        description="The 10 licensing registers from the source workbook. Counts are calculated from the current local dataset."
      />
      <div className="mb-4 flex flex-col gap-2 sm:flex-row">
        <InputGroup className="h-11 bg-card sm:max-w-sm">
          <InputGroupAddon>
            <Search aria-hidden />
          </InputGroupAddon>
          <InputGroupInput value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search categories…" aria-label="Search categories" />
          {q && (
            <InputGroupAddon align="inline-end">
              <InputGroupButton size="icon-sm" aria-label="Clear" onClick={() => setQ("")}>
                <X />
              </InputGroupButton>
            </InputGroupAddon>
          )}
        </InputGroup>
        <Select value={sort} onValueChange={(v) => setSort(v as CategorySort)} items={SORTS}>
          <SelectTrigger className="h-11! w-full bg-card sm:w-52" aria-label="Sort categories">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SORTS.map((s) => (
              <SelectItem key={s.value} value={s.value} className="min-h-9">
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {list.length === 0 ? (
        <EmptyState title="No categories match" description="Try a different search." />
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {list.map((c) => (
            <li key={c.id}>
              <CategoryCard summary={c} />
            </li>
          ))}
        </ul>
      )}
      <p className="mt-4 flex items-center gap-1 text-xs text-muted-foreground">
        <InfoTip label="About screen and seat totals">
          <p>{SCREEN_METHODOLOGY}</p>
          <p className="mt-2">{SEAT_METHODOLOGY}</p>
        </InfoTip>
        “—” means no usable screen or seat values are recorded for that register.
      </p>
    </>
  )
}
