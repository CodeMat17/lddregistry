"use client"

import * as React from "react"
import { ChevronDown, SlidersHorizontal } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { useIsMobile } from "@/hooks/use-mobile"
import { useRegistry } from "@/components/providers/registry-provider"
import { categoryLabel } from "@/lib/domain/categories"
import type { CategoryId, Establishment } from "@/lib/domain/types"
import { applyFilters, countActiveFilters, EMPTY_FILTERS, filterOptions, type RegistryFilters } from "@/lib/data/filters"
import { CALCULATED_STATUS_LABEL } from "@/lib/data/analytics"
import { FLAG_META } from "@/lib/data/quality/flags"
import { formatNumber } from "@/lib/format"
import type { DataQualityFlag } from "@/lib/domain/types"
import { cn } from "@/lib/utils"

type ListKey = "categories" | "states" | "zones" | "lgas" | "oldNew" | "recordedStatus" | "calculatedStatus" | "flags"

function Section({ title, count, defaultOpen = false, children }: { title: string; count?: number; defaultOpen?: boolean; children: React.ReactNode }) {
  return (
    <Collapsible defaultOpen={defaultOpen} className="border-b last:border-b-0">
      <CollapsibleTrigger className="group flex min-h-12 w-full items-center justify-between gap-2 px-1 text-left text-sm font-medium outline-none focus-visible:ring-2 focus-visible:ring-ring">
        <span className="flex items-center gap-2">
          {title}
          {count ? <Badge className="h-5 min-w-5 justify-center px-1.5">{count}</Badge> : null}
        </span>
        <ChevronDown className="size-4 text-muted-foreground transition-transform duration-200 group-data-panel-open:rotate-180" aria-hidden />
      </CollapsibleTrigger>
      <CollapsibleContent className="pb-3">{children}</CollapsibleContent>
    </Collapsible>
  )
}

function CheckList({
  options,
  selected,
  onToggle,
  labelOf = (v) => v,
  searchable = false,
}: {
  options: { value: string; count: number }[]
  selected: string[]
  onToggle: (value: string) => void
  labelOf?: (v: string) => string
  searchable?: boolean
}) {
  const [q, setQ] = React.useState("")
  const id = React.useId()
  const shown = q ? options.filter((o) => labelOf(o.value).toLowerCase().includes(q.toLowerCase())) : options
  return (
    <div>
      {searchable && options.length > 8 && (
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filter options…" className="mb-2 h-10" aria-label="Filter options" />
      )}
      <ul className={cn("space-y-0.5", options.length > 10 && "max-h-64 overflow-y-auto pr-1")}>
        {shown.map((o) => {
          const cid = `${id}-${o.value}`
          return (
            <li key={o.value}>
              <Label htmlFor={cid} className="flex min-h-10 cursor-pointer items-center gap-3 rounded-md px-1 font-normal hover:bg-muted">
                <Checkbox id={cid} checked={selected.includes(o.value)} onCheckedChange={() => onToggle(o.value)} />
                <span className="flex-1 truncate">{labelOf(o.value)}</span>
                <span className="text-xs text-muted-foreground tabular">{formatNumber(o.count)}</span>
              </Label>
            </li>
          )
        })}
        {!shown.length && <li className="px-1 py-2 text-sm text-muted-foreground">No matching options.</li>}
      </ul>
    </div>
  )
}

export function FilterDrawer({
  records,
  filters,
  onApply,
  fixedCategory,
}: {
  /** Records the filters apply to (already limited to the register, if any). */
  records: Establishment[]
  filters: RegistryFilters
  onApply: (f: RegistryFilters) => void
  fixedCategory?: CategoryId
}) {
  const isMobile = useIsMobile()
  const { settings, asOf } = useRegistry()
  const [open, setOpen] = React.useState(false)
  const [draft, setDraft] = React.useState(filters)
  const options = React.useMemo(() => filterOptions(records, asOf), [records, asOf])
  const preview = React.useMemo(() => (open ? applyFilters(records, draft, settings, asOf).length : 0), [open, records, draft, settings, asOf])
  const active = countActiveFilters(filters, fixedCategory)

  const toggle = (key: ListKey, value: string) =>
    setDraft((d) => {
      const list = d[key] as string[]
      return { ...d, [key]: list.includes(value) ? list.filter((v) => v !== value) : [...list, value] }
    })
  const num = (v: string) => (v === "" ? undefined : Math.max(0, Number(v)))

  return (
    <Sheet
      open={open}
      onOpenChange={(o) => {
        if (o) setDraft(filters)
        setOpen(o)
      }}
    >
      <SheetTrigger render={<Button variant="outline" className="h-10 gap-2" />}>
        <SlidersHorizontal className="size-4" aria-hidden />
        Filters
        {active > 0 && <Badge className="h-5 min-w-5 justify-center px-1.5">{active}</Badge>}
      </SheetTrigger>
      <SheetContent side={isMobile ? "bottom" : "right"} className={cn("gap-0 p-0", isMobile ? "max-h-[88svh] rounded-t-2xl" : "w-full sm:max-w-md")}>
        <SheetHeader className="border-b px-4 py-3">
          <SheetTitle>Filters</SheetTitle>
          <SheetDescription>Combine as many filters as you need. Options come from the data.</SheetDescription>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto px-4">
          {!fixedCategory && (
            <Section title="Category" count={draft.categories.length} defaultOpen>
              <CheckList options={options.categories} selected={draft.categories} onToggle={(v) => toggle("categories", v)} labelOf={categoryLabel} />
            </Section>
          )}
          <Section title="State" count={draft.states.length} defaultOpen={!!fixedCategory}>
            <CheckList searchable options={options.states} selected={draft.states} onToggle={(v) => toggle("states", v)} />
          </Section>
          <Section title="Geopolitical zone" count={draft.zones.length}>
            <CheckList options={options.zones} selected={draft.zones} onToggle={(v) => toggle("zones", v)} />
          </Section>
          <Section title="LGA" count={draft.lgas.length}>
            <CheckList searchable options={options.lgas} selected={draft.lgas} onToggle={(v) => toggle("lgas", v)} />
          </Section>
          <Section title="OLD / NEW classification" count={draft.oldNew.length}>
            <CheckList options={options.oldNew} selected={draft.oldNew} onToggle={(v) => toggle("oldNew", v)} />
          </Section>
          <Section title="Licence status (recorded)" count={draft.recordedStatus.length}>
            <CheckList options={options.recordedStatus} selected={draft.recordedStatus} onToggle={(v) => toggle("recordedStatus", v)} />
          </Section>
          <Section title="Licence status (calculated from issue date)" count={draft.calculatedStatus.length}>
            <CheckList
              options={options.calculatedStatus}
              selected={draft.calculatedStatus}
              onToggle={(v) => toggle("calculatedStatus", v)}
              labelOf={(v) => CALCULATED_STATUS_LABEL[v as keyof typeof CALCULATED_STATUS_LABEL] ?? v}
            />
          </Section>
          <Section title="Screens" count={(draft.screens !== "any" ? 1 : 0) + (draft.screenMin !== undefined || draft.screenMax !== undefined ? 1 : 0)}>
            <RadioGroup value={draft.screens} onValueChange={(v) => setDraft((d) => ({ ...d, screens: v as RegistryFilters["screens"] }))} className="gap-0.5">
              {[
                ["any", "Any"],
                ["has", "Has a screen count"],
                ["none", "No screen data"],
              ].map(([value, label]) => (
                <Label key={value} className="flex min-h-10 cursor-pointer items-center gap-3 rounded-md px-1 font-normal hover:bg-muted">
                  <RadioGroupItem value={value} />
                  {label}
                </Label>
              ))}
            </RadioGroup>
            <div className="mt-2 grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="smin" className="text-xs text-muted-foreground">
                  Min screens
                </Label>
                <Input id="smin" type="number" inputMode="numeric" min={0} className="h-10" value={draft.screenMin ?? ""} onChange={(e) => setDraft((d) => ({ ...d, screenMin: num(e.target.value) }))} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="smax" className="text-xs text-muted-foreground">
                  Max screens
                </Label>
                <Input id="smax" type="number" inputMode="numeric" min={0} className="h-10" value={draft.screenMax ?? ""} onChange={(e) => setDraft((d) => ({ ...d, screenMax: num(e.target.value) }))} />
              </div>
            </div>
          </Section>
          <Section title="Contact details" count={draft.contact !== "any" ? 1 : 0}>
            <RadioGroup value={draft.contact} onValueChange={(v) => setDraft((d) => ({ ...d, contact: v as RegistryFilters["contact"] }))} className="gap-0.5">
              {[
                ["any", "Any"],
                ["has", "Has phone or email"],
                ["missing", "Missing phone and email"],
              ].map(([value, label]) => (
                <Label key={value} className="flex min-h-10 cursor-pointer items-center gap-3 rounded-md px-1 font-normal hover:bg-muted">
                  <RadioGroupItem value={value} />
                  {label}
                </Label>
              ))}
            </RadioGroup>
          </Section>
          <Section title="Data-quality issues" count={draft.flags.length}>
            <CheckList
              options={options.flags}
              selected={draft.flags}
              onToggle={(v) => toggle("flags", v)}
              labelOf={(v) => FLAG_META[v as DataQualityFlag]?.label ?? v}
            />
          </Section>
        </div>
        <SheetFooter className="flex-row gap-2 border-t px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <Button
            variant="ghost"
            className="h-11 flex-1"
            onClick={() => setDraft({ ...EMPTY_FILTERS, q: draft.q, sort: draft.sort, dir: draft.dir })}
          >
            Reset
          </Button>
          <Button
            className="h-11 flex-2"
            onClick={() => {
              onApply(draft)
              setOpen(false)
            }}
          >
            Show {formatNumber(preview)} {preview === 1 ? "record" : "records"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
